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
  if (issues.length) {
    lines.push('Problems:');
    for (const issue of issues) lines.push(`- ${issue}`);
  }
  return lines.join('\n');
}

module.exports = { diagnose };
