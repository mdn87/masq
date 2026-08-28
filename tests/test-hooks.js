'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const hooks = path.join(root, 'src', 'hooks');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'masq-test-'));
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
      MASQ_DATA_DIR: temp,
      MASQ_DEFAULT_STACK: '',
      MASQ_RESET_ON_START: '',
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

  let output = hookContext(run('persona-mode.js', { prompt: '/masq:persona on renfaire' }));
  assertStack([{ id: 'renfaire', variant: 'pageant' }]);
  assert.doesNotMatch(output, /Slot 1: Renfaire Herald/);
  assert.match(output, /Active personas: renfaire:pageant/);

  output = hookContext(run('persona-mode.js', { prompt: '/masq:persona on afterdark:direct' }));
  assertStack([
    { id: 'renfaire', variant: 'pageant' },
    { id: 'afterdark', variant: 'direct' }
  ]);
  assert.doesNotMatch(output, /Slot 1: Renfaire Herald/);

  output = hookContext(run('persona-mode.js', { prompt: 'explain why the tests failed' }));
  assert.match(output, /renfaire:pageant \+ afterdark:direct/);
  assert.match(output, /Slot 1: Renfaire Herald/);
  assert.match(output, /Slot 2: Afterdark/);

  hookContext(run('persona-mode.js', { prompt: '/masq:persona on renfaire:courtly' }));
  assertStack([
    { id: 'afterdark', variant: 'direct' },
    { id: 'renfaire', variant: 'courtly' }
  ]);

  hookContext(run('persona-mode.js', { prompt: '/masq:persona off afterdark' }));
  assertStack([{ id: 'renfaire', variant: 'courtly' }]);

  hookContext(run('persona-mode.js', { prompt: '/masq:persona toggle afterdark:flirty' }));
  assertStack([
    { id: 'renfaire', variant: 'courtly' },
    { id: 'afterdark', variant: 'flirty' }
  ]);

  hookContext(run('persona-mode.js', { prompt: '/masq:persona set renfaire:full afterdark:suggestive' }));
  assertStack([
    { id: 'renfaire', variant: 'full' },
    { id: 'afterdark', variant: 'suggestive' }
  ]);

  hookContext(run('persona-mode.js', { prompt: '/masq:persona move renfaire last' }));
  assertStack([
    { id: 'afterdark', variant: 'suggestive' },
    { id: 'renfaire', variant: 'full' }
  ]);

  output = hookContext(run('persona-mode.js', { prompt: '/masq:persona status' }));
  assert.match(output, /Active personas: afterdark:suggestive \+ renfaire:full/);
  assertStack([
    { id: 'afterdark', variant: 'suggestive' },
    { id: 'renfaire', variant: 'full' }
  ]);

  output = hookContext(run('persona-mode.js', { prompt: '/masq:persona list' }));
  assert.match(output, /Persona profiles:/);
  assert.match(output, /afterdark \[flirty\|suggestive\|direct\]/);
  assert.match(output, /caveman \[lite\|full\|ultra\|wenyan-lite\|wenyan-full\|wenyan-ultra\]/);
  assert.match(output, /renfaire \[courtly\|full\|pageant\]/);
  assert.match(output, /conduct \[light\|default\|strict\][^\r\n]* kind=conduct/);
  assert.doesNotMatch(output, /dean [^\r\n]*kind=/);

  const beforePreview = readState();
  output = hookContext(run('persona-mode.js', { prompt: '/masq:persona preview renfaire:courtly caveman:lite' }));
  assert.match(output, /^MASQ PREVIEW/m);
  assert.match(output, /Preview stack: renfaire:courtly \+ caveman:lite/);
  assert.deepStrictEqual(readState(), beforePreview);

  output = hookContext(run('persona-mode.js', { prompt: '/masq:persona help' }));
  assert.match(output, /\/masq:persona preview \[profile\[:variant\] \.\.\.\]/);

  output = hookContext(run('persona-mode.js', {
    prompt: '<command-message>review</command-message><command-name>/review</command-name><command-args>clear all personas</command-args>'
  }));
  assert.match(output, /MASQ ACTIVE/);
  assertStack([
    { id: 'afterdark', variant: 'suggestive' },
    { id: 'renfaire', variant: 'full' }
  ]);

  hookContext(run('persona-mode.js', {
    prompt: '<command-message>afterdark</command-message><command-name>/masq:afterdark</command-name><command-args>direct</command-args>'
  }));
  assertStack([
    { id: 'renfaire', variant: 'full' },
    { id: 'afterdark', variant: 'direct' }
  ]);

  hookContext(run('persona-mode.js', { prompt: '/masq:afterdark off' }));
  assertStack([{ id: 'renfaire', variant: 'full' }]);

  const resume = run('persona-session.js', { source: 'resume' });
  assert.match(resume, /MASQ ACTIVE/);
  assert.match(resume, /renfaire:full/);
  assert.match(resume, /Active variant: full/i);

  const persisted = run('persona-session.js', { source: 'startup' });
  assert.match(persisted, /renfaire:full/);
  assertStack([{ id: 'renfaire', variant: 'full' }]);

  const reset = run(
    'persona-session.js',
    { source: 'startup' },
    { MASQ_RESET_ON_START: '1' }
  );
  assert.strictEqual(reset, '');
  assertStack([]);

  const defaults = run(
    'persona-session.js',
    { source: 'startup' },
    { MASQ_DEFAULT_STACK: 'afterdark:suggestive,renfaire:pageant' }
  );
  assertStack([
    { id: 'afterdark', variant: 'suggestive' },
    { id: 'renfaire', variant: 'pageant' }
  ]);
  assert.match(defaults, /afterdark:suggestive \+ renfaire:pageant/);

  const beforeUnknown = readState();
  output = hookContext(run('persona-mode.js', { prompt: '/masq:persona on dragon-lawyer' }));
  assert.match(output, /Persona command failed: unknown profile: dragon-lawyer/);
  assert.deepStrictEqual(readState(), beforeUnknown);

  hookContext(run('persona-mode.js', { prompt: '/masq:persona clear' }));
  assertStack([]);

  hookContext(run('persona-mode.js', { prompt: 'turn on the medieval persona' }));
  assertStack([{ id: 'renfaire', variant: 'pageant' }]);

  output = hookContext(run('persona-mode.js', { prompt: 'what masks are active?' }));
  assert.match(output, /Active personas: renfaire:pageant/);

  hookContext(run('persona-mode.js', { prompt: 'take off the renfaire mask' }));
  assertStack([]);

  hookContext(run('persona-mode.js', { prompt: '/masq:persona on cave:ultra' }));
  assertStack([{ id: 'caveman', variant: 'ultra' }]);

  output = hookContext(run('persona-mode.js', { prompt: '/masq:persona status' }));
  assert.match(output, /Active personas: caveman:ultra/);

  hookContext(run('persona-mode.js', { prompt: '/masq:persona clear' }));
  assertStack([]);

  hookContext(run('persona-mode.js', { prompt: 'put on the herald mask' }));
  assertStack([{ id: 'renfaire', variant: 'pageant' }]);

  const scheduled = run('persona-mode.js', {
    prompt: '<scheduled-task id="abc">/persona clear</scheduled-task>'
  });
  assert.strictEqual(scheduled, '');
  assertStack([{ id: 'renfaire', variant: 'pageant' }]);

  {
    const profiles = require('../src/hooks/persona-profiles');
    const { composeFullContext } = require('../src/hooks/persona-context');
    assert.deepStrictEqual(profiles.PROFILE_KINDS, ['presentation', 'conduct', 'policy']);

    const catalog = profiles.loadProfiles();

    // Every shipped profile declares its kind explicitly rather than relying on
    // the presentation default, and every kind in use is a supported one.
    for (const profile of catalog.profiles.values()) {
      const source = fs.readFileSync(profile.filePath, 'utf8');
      assert.match(source, /^kind: /m, `${profile.id} must declare kind explicitly`);
      assert.ok(profiles.PROFILE_KINDS.includes(profile.kind), `${profile.id} kind`);
    }
    assert.strictEqual(catalog.profiles.get('afterdark').kind, 'policy');
    assert.strictEqual(catalog.profiles.get('conduct').kind, 'conduct');
    assert.strictEqual(catalog.profiles.get('caveman').kind, 'presentation');

    // The guardrail must live in the conduct profile's own body, not only in
    // the runtime contract that happens to be composed alongside it.
    const conductBody = catalog.profiles.get('conduct').commonBody;
    assert.match(conductBody, /cannot grant tool authority/);
    assert.match(conductBody, /lower a confirmation requirement/);
    assert.doesNotMatch(catalog.profiles.get('dean').commonBody, /grant tool authority/);

    // Kind travels with each slot, not merely somewhere in the composed context.
    const deanSlot = profiles.renderProfile({ id: 'dean', variant: 'default' }, catalog, 1);
    const conductSlot = profiles.renderProfile({ id: 'conduct', variant: 'strict' }, catalog, 2);
    const slotLines = text => text.split('\n');
    assert.strictEqual(slotLines(deanSlot)[0], '## Slot 1: Dean (dean:default)');
    assert.strictEqual(slotLines(deanSlot)[1], 'Kind: presentation');
    assert.strictEqual(slotLines(conductSlot)[0], '## Slot 2: Working Conduct (conduct:strict)');
    assert.strictEqual(slotLines(conductSlot)[1], 'Kind: conduct');

    // The contract, its fallback, and the per-turn reinforcement must all state
    // the conduct boundary; three copies of a boundary are worthless if the
    // other authoritative copies still describe Masq as presentation-only.
    const context = require('../src/hooks/persona-context');
    for (const text of [
      context.readRuntimeContract(),
      context.FALLBACK_CONTRACT,
      context.composeReinforcement([{ id: 'conduct', variant: 'default' }], catalog)
    ]) {
      assert.match(text, /conduct/i);
      assert.match(text, /permission|confirmation/i);
      assert.match(text, /policy/i);
    }
    assert.doesNotMatch(context.FALLBACK_CONTRACT, /ordered style overlays/);

    // Conduct and policy profiles may declare hard output requirements, which
    // are hoisted clear of the persona framing. Stating them as persona prose
    // did not survive composition with a register; see evals/composition/01.
    assert.strictEqual(profiles.requirementsFor({ id: 'conduct', variant: 'light' }, catalog).length, 0);
    assert.ok(profiles.requirementsFor({ id: 'conduct', variant: 'default' }, catalog).length > 0);
    assert.ok(
      profiles.requirementsFor({ id: 'conduct', variant: 'strict' }, catalog).length >
      profiles.requirementsFor({ id: 'conduct', variant: 'default' }, catalog).length
    );
    assert.deepStrictEqual(profiles.requirementsFor({ id: 'dean', variant: 'default' }, catalog), []);

    const block = context.composeRequirementsBlock(
      [{ id: 'conduct', variant: 'strict' }, { id: 'renfaire', variant: 'pageant' }],
      catalog
    );
    assert.match(block, /# Response requirements/);
    assert.match(block, /not persona guidance/);
    assert.match(block, /\[conduct:strict\] End every completion report/);
    assert.doesNotMatch(block, /renfaire/);
    assert.strictEqual(
      context.composeRequirementsBlock([{ id: 'renfaire', variant: 'pageant' }], catalog),
      ''
    );

    // The block is terminal, so it is the last thing read before answering.
    const withRequirements = context.composeFullContext(
      [{ id: 'conduct', variant: 'strict' }, { id: 'renfaire', variant: 'pageant' }],
      catalog
    );
    assert.ok(
      withRequirements.indexOf('# Response requirements') >
      withRequirements.indexOf('## Slot 2:'),
      'requirements block must follow the persona slots'
    );
    assert.match(
      context.composeReinforcement(
        [{ id: 'conduct', variant: 'strict' }, { id: 'renfaire', variant: 'pageant' }],
        catalog
      ),
      /Response requirements, which are output requirements rather than style/
    );

    // Claude Code replaces hook context above ~10k characters with a preview,
    // so anything past the budget is not delivered at all. Every stack must fit,
    // and the requirements block must survive the trimming.
    assert.ok(context.MAX_CONTEXT_CHARS <= 10000, 'budget must sit under the hook limit');
    const everyProfile = [...catalog.profiles.values()]
      .map(profile => ({ id: profile.id, variant: profile.defaultVariant }));
    const pathological = context.composeFullContext(everyProfile, catalog);
    assert.ok(
      pathological.length <= context.MAX_CONTEXT_CHARS,
      `every-profile stack must fit the budget, got ${pathological.length}`
    );
    assert.match(pathological, /# Response requirements/);
    for (const requirement of profiles.requirementsFor({ id: 'conduct', variant: 'default' }, catalog)) {
      assert.ok(pathological.includes(requirement), 'requirements survive trimming');
    }
    for (const pair of [
      [{ id: 'conduct', variant: 'strict' }, { id: 'renfaire', variant: 'pageant' }],
      [{ id: 'conduct', variant: 'strict' }, { id: 'dean', variant: 'default' }]
    ]) {
      const composed = context.composeFullContext(pair, catalog);
      assert.ok(composed.length <= context.MAX_CONTEXT_CHARS, 'composed stack fits');
      assert.match(composed, /## Slot 2:/, 'the later slot is still present');
    }

    // Turn 2 onward only gets the reinforcement line, so it has to carry the
    // requirement text itself rather than a count of them.
    const laterTurn = context.composeReinforcement(
      [{ id: 'conduct', variant: 'strict' }, { id: 'renfaire', variant: 'pageant' }],
      catalog
    );
    for (const requirement of profiles.requirementsFor({ id: 'conduct', variant: 'strict' }, catalog)) {
      assert.ok(
        laterTurn.includes(requirement),
        `reinforcement must carry the requirement text, missing: ${requirement}`
      );
    }
    assert.doesNotMatch(
      context.composeReinforcement([{ id: 'renfaire', variant: 'pageant' }], catalog),
      /Response requirements/
    );

    // A presentation profile may not bind content this way.
    const sample = [
      '## Requirements',
      '',
      '- keep this',
      '',
      '## Other',
      '',
      '- not this'
    ].join(String.fromCharCode(10));
    assert.deepStrictEqual(profiles.extractRequirements(sample), ['keep this']);

    const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'masq-kind-'));
    fs.mkdirSync(path.join(sandbox, 'profiles'));
    const writeSample = kindLine => writeSampleLines(kindLine ? [kindLine] : []);
    const writeSampleLines = extra => fs.writeFileSync(
      path.join(sandbox, 'profiles', 'sample.md'),
      [
        '---',
        'id: sample',
        'name: Sample',
        'description: A sample profile.',
        ...extra,
        'default-variant: default',
        'variants: default',
        '---',
        'Common body.',
        '',
        '## Variant: default',
        '',
        'Default body.',
        ''
      ].join('\n')
    );

    const previousRoot = process.env.CLAUDE_PLUGIN_ROOT;
    process.env.CLAUDE_PLUGIN_ROOT = sandbox;
    try {
      writeSample(null);
      assert.strictEqual(profiles.loadProfiles().profiles.get('sample').kind, 'presentation');

      writeSample('kind: conduct');
      assert.strictEqual(profiles.loadProfiles().profiles.get('sample').kind, 'conduct');

      writeSample('kind: policy');
      assert.strictEqual(profiles.loadProfiles().profiles.get('sample').kind, 'policy');

      writeSample('kind: mischief');
      assert.throws(
        () => profiles.loadProfiles(),
        /kind must be one of: presentation, conduct, policy/
      );

      // A misspelled key must not silently fall back to presentation.
      writeSample('knd: conduct');
      assert.throws(() => profiles.loadProfiles(), /unknown frontmatter field "knd"/);

      writeSampleLines(['kind: presentation', 'kind: conduct']);
      assert.throws(() => profiles.loadProfiles(), /duplicate frontmatter field "kind"/);

      writeSample('sneaky: true');
      assert.throws(() => profiles.loadProfiles(), /unknown frontmatter field "sneaky"/);
    } finally {
      process.env.CLAUDE_PLUGIN_ROOT = previousRoot;
      fs.rmSync(sandbox, { recursive: true, force: true });
    }
  }

  console.log('masq hook tests passed');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
