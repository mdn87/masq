#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { parsePersonaArgs, applyCommand, resultText } = require('./hooks/persona-command');
const { loadProfiles } = require('./hooks/persona-profiles');
const { canonicalProjectPath } = require('./hooks/persona-state');
const { diagnose } = require('./hooks/persona-doctor');
const { resolveClaudeDataDir } = require('./claude-data-dir');

function main(argv) {
  const options = {};
  let command = [];
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === '--') { command = argv.slice(i + 1); break; }
    if (flag === '--json' || flag === '--shared-store') { options[flag] = true; continue; }
    if (!['--data-dir', '--claude-plugin-root', '--cwd', '--session-id', '--harness'].includes(flag) || !argv[i + 1]) {
      throw new Error('Use --data-dir <absolute path> --cwd <absolute path> --session-id <id> --harness <name> [--shared-store] [--json] -- <persona command>');
    }
    if (options[flag] !== undefined) throw new Error(`Duplicate option: ${flag}`);
    options[flag] = argv[++i];
  }
  for (const flag of ['--cwd', '--session-id', '--harness']) {
    if (!options[flag] || !options[flag].trim()) throw new Error(`Required option: ${flag}`);
  }
  if (!/^[a-z][a-z0-9-]{0,63}$/.test(options['--harness'])) throw new Error('Invalid harness name');
  if (options['--claude-plugin-root']) {
    if (options['--data-dir'] || options['--harness'] !== 'claude-code') throw new Error('Use either --data-dir or --claude-plugin-root for Claude');
    if (!path.isAbsolute(options['--claude-plugin-root'])) throw new Error('Plugin root must be absolute');
    options['--data-dir'] = resolveClaudeDataDir(options['--claude-plugin-root']);
  }
  if (!options['--data-dir']) throw new Error('Required option: --data-dir');
  if (options['--session-id'].length > 512 || /[\x00-\x1f]/.test(options['--session-id'])) throw new Error('Invalid session ID');
  if (!path.isAbsolute(options['--data-dir']) || !path.isAbsolute(options['--cwd'])) throw new Error('Data directory and cwd must be absolute');
  if (!fs.statSync(options['--cwd']).isDirectory()) throw new Error('cwd must be a directory');
  const harness = options['--harness'];
  const base = path.resolve(options['--data-dir']);
  // This process owns its environment. An explicit CLI path wins over inherited defaults.
  process.env.MASQ_DATA_DIR = harness === 'claude-code' || options['--shared-store']
    ? base : path.join(base, 'harnesses', harness);
  const context = {
    cwd: canonicalProjectPath(options['--cwd']),
    sessionId: harness === 'claude-code' ? options['--session-id'] : `${harness}:${options['--session-id']}`
  };
  const parsed = parsePersonaArgs(command.join(' ').trim().toLowerCase());
  const catalog = loadProfiles();
  let result;
  if (parsed.op === 'preview') {
    result = applyCommand({ op: 'error', error: 'Preview needs a model turn; use /masq:persona preview.' }, context, catalog);
  } else {
    result = applyCommand(parsed.op === 'doctor' ? { op: 'status' } : parsed, context, catalog);
  }
  const state = result.state;
  const output = {
    schema_version: 1, ok: result.kind !== 'error', kind: result.kind,
    subject: { harness, session_id: options['--session-id'], cwd: context.cwd },
    state: { global: state.global, project: state.project, temporary: state.temporary,
      effective: state.effective, persistent_scope: state.persistentScope,
      availability: { global: state.globalRecord.status, project: state.projectRecord.status, temporary: state.sessionRecord.status } },
    text: parsed.op === 'doctor' ? diagnose(context) : resultText(result, catalog),
    status_text: resultText({ kind: 'status', state }, catalog)
  };
  // Do not update lastEffective: the next prompt hook still has to inject the change.
  process.stdout.write((options['--json'] ? JSON.stringify(output) : output.text) + '\n');
  return output.ok ? 0 : 1;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  if (process.argv.includes('--json')) {
    process.stdout.write(JSON.stringify({ schema_version: 1, ok: false, kind: 'error', text: error.message }) + '\n');
  } else {
    process.stderr.write(`Masq: ${error.message}\n`);
  }
  process.exitCode = 1;
}
