'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const hooks = path.join(root, 'src', 'hooks');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'masque-test-'));
const statePath = path.join(temp, 'state.json');

function run(script, payload, extraEnv = {}) {
  const result = spawnSync(process.execPath, [path.join(hooks, script)], {
    cwd: root,
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: {
      ...process.env,
      CLAUDE_CONFIG_DIR: temp,
      CLAUDE_PLUGIN_ROOT: root,
      MASQUE_DATA_DIR: temp,
      MASQUE_DEFAULT_STACK: '',
      MASQUE_RESET_ON_START: '',
      ...extraEnv
    }
  });

  assert.strictEqual(result.status, 0, result.stderr || `${script} failed`);
  return result.stdout;
}

function readState() {
  if (!fs.existsSync(statePath)) return [];
  return JSON.parse(fs.readFileSync(statePath, 'utf8')).active;
}

function hookContext(stdout) {
  assert.ok(stdout, 'expected hook JSON output');
  const parsed = JSON.parse(stdout);
  return parsed.hookSpecificOutput.additionalContext;
}

function assertStack(expected) {
  assert.deepStrictEqual(readState(), expected);
}

try {
  const startup = run('persona-session.js', { source: 'startup' });
  assert.strictEqual(startup, '');
  assertStack([]);

  let output = hookContext(run('persona-mode.js', { prompt: '/masque:persona on renfaire' }));
  assertStack([{ id: 'renfaire', variant: 'pageant' }]);
  assert.match(output, /Ordered stack: renfaire:pageant/);
  assert.match(output, /Slot 1: Renfaire Herald/);
  assert.match(output, /Active personas: renfaire:pageant/);

  output = hookContext(run('persona-mode.js', { prompt: '/masque:persona on afterdark:direct' }));
  assertStack([
    { id: 'renfaire', variant: 'pageant' },
    { id: 'afterdark', variant: 'direct' }
  ]);
  assert.match(output, /Slot 1: Renfaire Herald/);
  assert.match(output, /Slot 2: Afterdark/);

  output = hookContext(run('persona-mode.js', { prompt: 'explain why the tests failed' }));
  assert.match(output, /renfaire:pageant \+ afterdark:direct/);
  assert.match(output, /already-loaded profile contracts/);

  hookContext(run('persona-mode.js', { prompt: '/masque:persona on renfaire:courtly' }));
  assertStack([
    { id: 'afterdark', variant: 'direct' },
    { id: 'renfaire', variant: 'courtly' }
  ]);

  hookContext(run('persona-mode.js', { prompt: '/masque:persona off afterdark' }));
  assertStack([{ id: 'renfaire', variant: 'courtly' }]);

  hookContext(run('persona-mode.js', { prompt: '/masque:persona toggle afterdark:flirty' }));
  assertStack([
    { id: 'renfaire', variant: 'courtly' },
    { id: 'afterdark', variant: 'flirty' }
  ]);

  hookContext(run('persona-mode.js', { prompt: '/masque:persona set renfaire:full afterdark:suggestive' }));
  assertStack([
    { id: 'renfaire', variant: 'full' },
    { id: 'afterdark', variant: 'suggestive' }
  ]);

  hookContext(run('persona-mode.js', { prompt: '/masque:persona move renfaire last' }));
  assertStack([
    { id: 'afterdark', variant: 'suggestive' },
    { id: 'renfaire', variant: 'full' }
  ]);

  output = hookContext(run('persona-mode.js', { prompt: '/masque:persona status' }));
  assert.match(output, /Active personas: afterdark:suggestive \+ renfaire:full/);
  assertStack([
    { id: 'afterdark', variant: 'suggestive' },
    { id: 'renfaire', variant: 'full' }
  ]);

  output = hookContext(run('persona-mode.js', { prompt: '/masque:persona list' }));
  assert.match(output, /Persona profiles:/);
  assert.match(output, /afterdark \[flirty\|suggestive\|direct\]/);
  assert.match(output, /renfaire \[courtly\|full\|pageant\]/);

  output = hookContext(run('persona-mode.js', {
    prompt: '<command-message>review</command-message><command-name>/review</command-name><command-args>clear all personas</command-args>'
  }));
  assert.match(output, /MASQUE ACTIVE/);
  assertStack([
    { id: 'afterdark', variant: 'suggestive' },
    { id: 'renfaire', variant: 'full' }
  ]);

  hookContext(run('persona-mode.js', {
    prompt: '<command-message>afterdark</command-message><command-name>/masque:afterdark</command-name><command-args>direct</command-args>'
  }));
  assertStack([
    { id: 'renfaire', variant: 'full' },
    { id: 'afterdark', variant: 'direct' }
  ]);

  hookContext(run('persona-mode.js', { prompt: '/masque:afterdark off' }));
  assertStack([{ id: 'renfaire', variant: 'full' }]);

  const resume = run('persona-session.js', { source: 'resume' });
  assert.match(resume, /MASQUE ACTIVE/);
  assert.match(resume, /renfaire:full/);
  assert.match(resume, /Active variant: full/i);

  const persisted = run('persona-session.js', { source: 'startup' });
  assert.match(persisted, /renfaire:full/);
  assertStack([{ id: 'renfaire', variant: 'full' }]);

  const reset = run(
    'persona-session.js',
    { source: 'startup' },
    { MASQUE_RESET_ON_START: '1' }
  );
  assert.strictEqual(reset, '');
  assertStack([]);

  const defaults = run(
    'persona-session.js',
    { source: 'startup' },
    { MASQUE_DEFAULT_STACK: 'afterdark:suggestive,renfaire:pageant' }
  );
  assertStack([
    { id: 'afterdark', variant: 'suggestive' },
    { id: 'renfaire', variant: 'pageant' }
  ]);
  assert.match(defaults, /afterdark:suggestive \+ renfaire:pageant/);

  const beforeUnknown = readState();
  output = hookContext(run('persona-mode.js', { prompt: '/masque:persona on dragon-lawyer' }));
  assert.match(output, /Persona command failed: unknown profile: dragon-lawyer/);
  assert.deepStrictEqual(readState(), beforeUnknown);

  hookContext(run('persona-mode.js', { prompt: '/masque:persona clear' }));
  assertStack([]);

  hookContext(run('persona-mode.js', { prompt: 'turn on the medieval persona' }));
  assertStack([{ id: 'renfaire', variant: 'pageant' }]);

  output = hookContext(run('persona-mode.js', { prompt: 'what masks are active?' }));
  assert.match(output, /Active personas: renfaire:pageant/);

  hookContext(run('persona-mode.js', { prompt: 'take off the renfaire mask' }));
  assertStack([]);

  hookContext(run('persona-mode.js', { prompt: 'put on the herald mask' }));
  assertStack([{ id: 'renfaire', variant: 'pageant' }]);

  const scheduled = run('persona-mode.js', {
    prompt: '<scheduled-task id="abc">/persona clear</scheduled-task>'
  });
  assert.strictEqual(scheduled, '');
  assertStack([{ id: 'renfaire', variant: 'pageant' }]);

  console.log('masque hook tests passed');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
