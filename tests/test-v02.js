'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const hooks = path.join(root, 'src', 'hooks');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'masq-v02-test-'));
const dataDir = path.join(temp, 'data');
const projectA = path.join(temp, 'project-a');
const projectB = path.join(temp, 'project-b');
fs.mkdirSync(projectA);
fs.mkdirSync(projectB);

function run(script, payload) {
  const result = spawnSync(process.execPath, [path.join(hooks, script)], {
    cwd: root,
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: {
      ...process.env,
      CLAUDE_CONFIG_DIR: temp,
      CLAUDE_PLUGIN_ROOT: root,
      MASQ_DATA_DIR: dataDir,
      MASQ_DEFAULT_STACK: '',
      MASQ_RESET_ON_START: ''
    }
  });

  assert.strictEqual(result.status, 0, result.stderr || `${script} failed`);
  return result.stdout;
}

function prompt(text, cwd = projectA, sessionId = 'session-a') {
  const stdout = run('persona-mode.js', {
    hook_event_name: 'UserPromptSubmit',
    prompt: text,
    cwd,
    session_id: sessionId
  });
  assert.ok(stdout, `expected hook output for ${text}`);
  return JSON.parse(stdout).hookSpecificOutput.additionalContext;
}

function session(source, cwd = projectA, sessionId = 'session-a') {
  return run('persona-session.js', {
    hook_event_name: 'SessionStart',
    source,
    cwd,
    session_id: sessionId
  });
}

function snapshotTree(directory, relative = '') {
  if (!fs.existsSync(directory)) return [];
  const entries = [];
  for (const name of fs.readdirSync(directory).sort()) {
    const fullPath = path.join(directory, name);
    const relativePath = path.join(relative, name);
    const stat = fs.lstatSync(fullPath);
    if (stat.isDirectory()) entries.push(...snapshotTree(fullPath, relativePath));
    else entries.push([relativePath, fs.readFileSync(fullPath, 'utf8')]);
  }
  return entries;
}

try {
  let output = prompt('/masq:persona global set renfaire:courtly');
  assert.match(output, /Active personas: renfaire:courtly/);
  assert.match(output, /Persistent scope: global/);

  output = prompt('/masq:persona project set plain:strict');
  assert.match(output, /Active personas: plain:strict/);
  assert.match(output, /Persistent scope: project/);

  output = prompt('/masq:persona status');
  assert.match(output, /Global: renfaire:courtly/);
  assert.match(output, /Project override: plain:strict/);
  assert.match(output, /Temporary: \(none\)/);

  output = prompt('/masq:persona status', projectB, 'session-b');
  assert.match(output, /Active personas: renfaire:courtly/);
  assert.match(output, /Project override: \(unset\)/);

  const stateBeforePreview = snapshotTree(dataDir);
  output = prompt('/masq:persona preview renfaire:pageant caveman:ultra');
  assert.match(output, /^MASQ PREVIEW/m);
  assert.match(output, /Preview stack: renfaire:pageant \+ caveman:ultra/);
  assert.match(output, /## Slot 1: Renfaire Herald \(renfaire:pageant\)/);
  assert.match(output, /## Slot 2: Caveman \(caveman:ultra\)/);
  assert.match(output, /The release is ready\. All 42 tests passed\./);
  assert.match(output, /`npm publish`/);
  assert.deepStrictEqual(snapshotTree(dataDir), stateBeforePreview);

  output = prompt('/masq:persona preview');
  assert.match(output, /Preview stack: plain:strict/);
  assert.deepStrictEqual(snapshotTree(dataDir), stateBeforePreview);

  output = prompt('/masq:persona preview unknown-voice');
  assert.match(output, /Persona command failed: unknown profile: unknown-voice/);
  assert.deepStrictEqual(snapshotTree(dataDir), stateBeforePreview);

  output = prompt('/masq:persona on caveman:lite');
  assert.match(output, /Active personas: plain:strict \+ caveman:lite/);
  assert.match(output, /Project override: plain:strict \+ caveman:lite/);

  output = prompt('/masq:persona project unset');
  assert.match(output, /Active personas: renfaire:courtly/);
  assert.match(output, /Project override: \(unset\)/);

  output = prompt('/masq:persona project clear');
  assert.match(output, /Active personas: \(none\)/);
  assert.match(output, /Global: renfaire:courtly/);
  assert.match(output, /Project override: \(none\)/);
  output = prompt('/masq:persona project unset');
  assert.match(output, /Active personas: renfaire:courtly/);

  output = prompt('/masq:persona temp on renfaire:pageant');
  assert.match(output, /Active personas: renfaire:pageant/);
  assert.doesNotMatch(output, /Active personas: renfaire:courtly \+/);
  output = prompt('/masq:persona temp clear');
  assert.match(output, /Active personas: renfaire:courtly/);

  output = prompt('/masq:persona temp on caveman:ultra');
  assert.match(output, /Active personas: renfaire:courtly \+ caveman:ultra/);
  assert.match(output, /Temporary: caveman:ultra/);

  output = prompt('/masq:persona status', projectA, 'session-b');
  assert.match(output, /Active personas: renfaire:courtly/);
  assert.match(output, /Temporary: \(none\)/);

  output = session('resume');
  assert.match(output, /renfaire:courtly \+ caveman:ultra/);

  run('persona-session-end.js', {
    hook_event_name: 'SessionEnd',
    reason: 'other',
    cwd: projectA,
    session_id: 'session-a'
  });
  output = prompt('/masq:persona status');
  assert.match(output, /Active personas: renfaire:courtly/);
  assert.match(output, /Temporary: \(none\)/);

  output = prompt('/masq:persona global set plain:default caveman:full');
  assert.match(output, /Active personas: plain:default \+ caveman:full/);
  output = prompt('/masq:persona preset export concise global');
  assert.match(output, /Exported preset concise: plain:default \+ caveman:full/);
  output = prompt('/masq:persona global clear');
  assert.match(output, /Global: \(none\)/);
  output = prompt('/masq:persona preset import concise global');
  assert.match(output, /Imported preset concise to global/);
  assert.match(output, /Active personas: plain:default \+ caveman:full/);
  output = prompt('/masq:persona project clear');
  assert.match(output, /Active personas: \(none\)/);
  output = prompt('/masq:persona preset import concise project');
  assert.match(output, /Imported preset concise to project/);
  assert.match(output, /Active personas: plain:default \+ caveman:full/);
  output = prompt('/masq:persona project unset');
  assert.match(output, /Project override: \(unset\)/);
  output = prompt('/masq:persona preset list');
  assert.match(output, /concise: plain:default \+ caveman:full/);
  output = prompt('/masq:persona preset delete concise');
  assert.match(output, /Deleted preset concise/);

  output = prompt('/masq:persona doctor');
  assert.match(output, /Masq doctor: PASS/);
  assert.match(output, /Catalog: 4 profiles, 15 variants/);
  assert.match(output, /Manifest: 0\.2\.0, required hooks present/);
  assert.match(output, /Project override: \(unset\)/);

  const projectHash = crypto.createHash('sha256').update(fs.realpathSync.native(projectA), 'utf8').digest('hex');
  const projectStatePath = path.join(dataDir, 'projects', `${projectHash}.json`);
  fs.writeFileSync(projectStatePath, JSON.stringify({
    version: 1,
    active: [{ id: 'INVALID!', variant: 'full' }]
  }), 'utf8');
  output = prompt('/masq:persona status');
  assert.match(output, /Project override: \(invalid: active stack is not canonical\)/);
  output = prompt('/masq:persona on renfaire');
  assert.match(output, /Persona command failed: project state is invalid; run \/masq:persona doctor/);
  output = prompt('/masq:persona project unset');
  assert.match(output, /Project override: \(unset\)/);
  assert.ok(!fs.existsSync(projectStatePath));

  const globalStatePath = path.join(dataDir, 'state.json');
  const validGlobalState = fs.readFileSync(globalStatePath, 'utf8');
  fs.writeFileSync(globalStatePath, '{ malformed', 'utf8');
  output = prompt('/masq:persona doctor');
  assert.match(output, /Masq doctor: FAIL/);
  assert.match(output, /global state:/);
  assert.strictEqual(fs.readFileSync(globalStatePath, 'utf8'), '{ malformed');
  fs.writeFileSync(globalStatePath, JSON.stringify({
    version: 1,
    active: [{ id: 'INVALID!', variant: 'full' }]
  }), 'utf8');
  output = prompt('/masq:persona doctor');
  assert.match(output, /Masq doctor: FAIL/);
  assert.match(output, /global state: active stack is not canonical/);
  output = prompt('/masq:persona status');
  assert.match(output, /Global: \(invalid: active stack is not canonical\)/);
  output = prompt('/masq:persona on renfaire');
  assert.match(output, /Persona command failed: global state is invalid; run \/masq:persona doctor/);
  assert.strictEqual(JSON.parse(fs.readFileSync(globalStatePath, 'utf8')).active[0].id, 'INVALID!');
  output = prompt('/masq:persona global clear');
  assert.match(output, /Global: \(none\)/);
  assert.ok(!fs.existsSync(globalStatePath));
  fs.writeFileSync(globalStatePath, validGlobalState, 'utf8');

  assert.deepStrictEqual(fs.readdirSync(projectA), []);
  assert.deepStrictEqual(fs.readdirSync(projectB), []);

  console.log('masq v0.2 scope, session, preset, and doctor tests passed');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
