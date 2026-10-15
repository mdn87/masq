'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'masq-cli-'));
const store = path.join(temp, 'store');
const project = path.join(temp, 'project');
fs.mkdirSync(project);

function cli(command, options = {}) {
  const args = [path.join(root, 'src/cli.js'), '--data-dir', store, '--cwd', project,
    '--session-id', options.session || 's1', '--harness', options.harness || 'claude-code', '--json'];
  if (options.shared) args.push('--shared-store');
  const result = spawnSync(process.execPath, [...args, '--', ...command.split(' ')], {
    encoding: 'utf8', env: { ...process.env, MASQ_DATA_DIR: path.join(temp, 'must-not-be-used') }
  });
  assert.equal(result.status, options.error ? 1 : 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

function hook(prompt, dataDir = store) {
  const result = spawnSync(process.execPath, [path.join(root, 'src/hooks/persona-mode.js')], {
    input: JSON.stringify({ prompt, cwd: project, session_id: 's1' }), encoding: 'utf8',
    env: { ...process.env, MASQ_DATA_DIR: dataDir }
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout).hookSpecificOutput.additionalContext;
}

assert.deepEqual(cli('status').state.effective, []);
assert.equal(fs.existsSync(store), false, 'status must not create state');
const changed = cli('global set plain dean');
assert.deepEqual(changed.state.effective.map(p => p.id), ['plain', 'dean']);
assert.ok(hook('/masq:persona status').includes(changed.text));
assert.ok(hook('Explain this code').includes('plain'));
const beforeNativePrompt = cli('status').state.effective;
hook('/masq toggle plain');
assert.deepEqual(cli('status').state.effective, beforeNativePrompt, 'native command text must not trigger a second mutation');
assert.deepEqual(cli('move plain last').state.effective.map(p => p.id), ['dean', 'plain']);
cli('temp set caveman');
assert.ok(cli('status').state.effective.some(p => p.id === 'caveman'));
assert.ok(!cli('status', { session: 's2' }).state.effective.some(p => p.id === 'caveman'));
assert.deepEqual(cli('status', { harness: 'codex' }).state.effective, []);
cli('global set renfaire', { harness: 'codex' });
assert.ok(!cli('status').state.effective.some(p => p.id === 'renfaire'));
assert.ok(cli('status', { harness: 'codex', shared: true }).state.effective.some(p => p.id === 'plain'));
assert.ok(!cli('status', { harness: 'codex', shared: true }).state.effective.some(p => p.id === 'caveman'));
cli('project clear');
assert.deepEqual(cli('status', { session: 's2' }).state.effective, []);
cli('project unset');
assert.ok(cli('status', { session: 's2' }).state.effective.some(p => p.id === 'plain'));
cli('preset export saved global');
cli('global clear');
cli('preset import saved global');
assert.ok(cli('status').state.effective.some(p => p.id === 'plain'));
assert.equal(cli('set nonexistent', { error: true }).ok, false);
assert.equal(cli('preview', { error: true }).ok, false);
fs.writeFileSync(path.join(store, 'state.json'), ' '.repeat(8193));
assert.equal(cli('on plain', { error: true }).ok, false);

// Native commands must resolve the shell hook store for this exact install.
const config = path.join(temp, 'claude-config');
const cache = path.join(config, 'plugins', 'cache', 'store', 'masq', '0.8.0');
fs.mkdirSync(cache, { recursive: true });
const registry = path.join(config, 'plugins', 'installed_plugins.json');
fs.writeFileSync(registry, JSON.stringify({ plugins: { 'masq@my-store': [{ installPath: cache }] } }));
function native(rootPath, expectedCode = 0) {
  const result = spawnSync(process.execPath, [path.join(root, 'src/cli.js'),
    '--claude-plugin-root', rootPath, '--cwd', project, '--session-id', 'native',
    '--harness', 'claude-code', '--json', '--', 'global', 'set', 'plain'], {
    encoding: 'utf8', env: { ...process.env, CLAUDE_CONFIG_DIR: config, MASQ_DATA_DIR: '', CLAUDE_PLUGIN_DATA: '' }
  });
  assert.equal(result.status, expectedCode, result.stdout + result.stderr);
}
native(root);
assert.ok(fs.existsSync(path.join(config, 'plugins/data/masq-inline/state.json')));
native(cache);
assert.ok(fs.existsSync(path.join(config, 'plugins/data/masq-my-store/state.json')));
fs.writeFileSync(registry, JSON.stringify({ plugins: {
  'masq@my-store': [{ installPath: cache }], 'masq@other-store': [{ installPath: cache }]
} }));
native(cache, 1);
console.log('masq portable CLI and hook parity tests passed');
