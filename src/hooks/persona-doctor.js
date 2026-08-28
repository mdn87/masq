'use strict';

const fs = require('fs');
const path = require('path');
const { formatStack, loadProfiles } = require('./persona-profiles');
const {
  canonicalProjectPath,
  getDataDir,
  readPresetsRecord,
  resolveState
} = require('./persona-state');

function readJson(filePath) {
  try {
    const stat = fs.lstatSync(filePath);
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error('not a safe regular file');
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`${path.basename(filePath)}: ${error.message}`);
  }
}

// Compatibility notices for stacks written before a profile changed shape.
// This is the second intentional exception to "no included profile IDs in the
// generic runtime" (the first is the /masq:afterdark command), and it is meant
// to be deleted once the affected release is far enough back. See ADR 0005.
const MIGRATION_NOTES = Object.freeze([
  {
    since: '0.3.0',
    present: 'dean',
    absent: 'conduct',
    note: 'dean is register-only since 0.3.0; its working conduct moved to the conduct profile. '
      + 'A stack carrying dean without conduct behaves differently than it did before 0.3.0. '
      + 'Run /masq:persona set dean conduct to restore the previous behavior, or keep dean alone '
      + 'if the register is all you wanted.'
  },
  {
    since: '0.4.0',
    present: 'dean',
    absent: 'audience',
    note: 'dean no longer sets assumed reader expertise; masq 0.4.0 moved glossing and '
      + 'procedural detail to the audience profile. Add audience to choose a level '
      + '(audience:novice, audience:peer, audience:expert); audience:peer is closest to '
      + 'the behavior dean used to carry on its own.'
  },
  {
    since: '0.4.0',
    present: 'plain',
    absent: 'audience',
    note: 'plain no longer defines unfamiliar terms or restates abbreviations; masq 0.4.0 '
      + 'moved assumed reader knowledge to the audience profile. Add audience:novice to '
      + 'restore the glossing plain used to do.'
  }
]);

function migrationNotes(effective) {
  const active = new Set((effective || []).map(entry => entry.id));
  return MIGRATION_NOTES
    .filter(rule => active.has(rule.present) && !active.has(rule.absent))
    .map(rule => rule.note);
}

function diagnose({ cwd, sessionId } = {}) {
  const issues = [];
  const lines = [];
  const pluginRoot = path.resolve(process.env.CLAUDE_PLUGIN_ROOT || path.join(__dirname, '..', '..'));
  let catalog = null;
  let packageVersion = 'unknown';
  let manifestVersion = 'unknown';
  let hooksPresent = false;

  try {
    catalog = loadProfiles();
  } catch (error) {
    issues.push(`catalog: ${error.message}`);
  }

  try {
    const pkg = readJson(path.join(pluginRoot, 'package.json'));
    const manifest = readJson(path.join(pluginRoot, '.claude-plugin', 'plugin.json'));
    packageVersion = String(pkg.version || 'unknown');
    manifestVersion = String(manifest.version || 'unknown');
    if (packageVersion !== manifestVersion) issues.push('manifest: package and plugin versions differ');
    const requiredHooks = {
      SessionStart: 'persona-session.js',
      UserPromptSubmit: 'persona-mode.js',
      SessionEnd: 'persona-session-end.js'
    };
    hooksPresent = Object.entries(requiredHooks).every(([event, source]) => {
      const registrations = manifest.hooks && manifest.hooks[event];
      const command = Array.isArray(registrations) ? registrations[0]?.hooks?.[0]?.command || '' : '';
      return command.includes(source) &&
        command.includes('${CLAUDE_PLUGIN_ROOT}') &&
        command.includes('${CLAUDE_PLUGIN_DATA}');
    });
    if (!hooksPresent) issues.push('manifest: one or more required hooks are missing');
  } catch (error) {
    issues.push(`manifest: ${error.message}`);
  }

  const dataDir = getDataDir();
  let dataStatus = 'not created';
  try {
    const stat = fs.lstatSync(dataDir);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      dataStatus = 'unsafe';
      issues.push('data directory: symlink or non-directory rejected');
    } else {
      dataStatus = 'ready';
    }
  } catch (error) {
    if (!error || error.code !== 'ENOENT') {
      dataStatus = 'unreadable';
      issues.push(`data directory: ${error.message}`);
    }
  }

  const state = resolveState({ cwd, sessionId });
  for (const [label, record] of [
    ['global state', state.globalRecord],
    ['project state', state.projectRecord],
    ['session state', state.sessionRecord]
  ]) {
    if (record.status === 'invalid') issues.push(`${label}: ${record.error}`);
  }

  const presets = readPresetsRecord();
  if (presets.status === 'invalid') issues.push(`presets: ${presets.error}`);

  lines.push(`Masq doctor: ${issues.length ? 'FAIL' : 'PASS'}`);
  lines.push(`Version: ${packageVersion}`);
  if (catalog) {
    const variants = [...catalog.profiles.values()].reduce((total, profile) => total + profile.variants.length, 0);
    lines.push(`Catalog: ${catalog.profiles.size} profiles, ${variants} variants`);
  } else {
    lines.push('Catalog: unavailable');
  }
  lines.push(`Manifest: ${manifestVersion}, ${hooksPresent ? 'required hooks present' : 'required hooks incomplete'}`);
  lines.push(`Data directory: ${dataDir} (${dataStatus})`);
  lines.push(`Project: ${canonicalProjectPath(cwd)}`);
  lines.push(`Global: ${formatStack(state.global)}`);
  lines.push(`Project override: ${state.projectRecord.defined ? formatStack(state.project) : '(unset)'}`);
  lines.push(`Temporary: ${formatStack(state.temporary)}`);
  lines.push(`Effective: ${formatStack(state.effective)}`);
  lines.push(`Presets: ${Object.keys(presets.presets).length}`);

  const notes = migrationNotes(state.effective);
  if (notes.length) {
    lines.push('Notes:');
    for (const note of notes) lines.push(`- ${note}`);
  }

  if (issues.length) {
    lines.push('Problems:');
    for (const issue of issues) lines.push(`- ${issue}`);
  }
  return lines.join('\n');
}

module.exports = { diagnose };
