'use strict';

// The launcher must run the installed masq copy when the session is pinned to
// an older cache directory, and must leave development checkouts alone.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'masq-launch-'));
const configDir = path.join(temp, 'config');
const dataDir = path.join(temp, 'data');
const cache = path.join(configDir, 'plugins', 'cache', 'masq', 'masq');
const pinned = path.join(cache, '0.0.1');
const live = path.join(cache, '9.9.9');
const foreign = path.join(cache, 'not-masq');

function copyPlugin(target, version) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of ['.claude-plugin', 'src', 'profiles', 'package.json']) {
    fs.cpSync(path.join(root, entry), path.join(target, entry), { recursive: true });
  }
  for (const file of ['.claude-plugin/plugin.json', 'package.json']) {
    const manifestPath = path.join(target, file);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.version = version;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }
}

function writeInstalled(installPath) {
  fs.writeFileSync(
    path.join(configDir, 'plugins', 'installed_plugins.json'),
    JSON.stringify({
      version: 2,
      plugins: {
        'masq@masq': [{ scope: 'user', installPath, version: path.basename(installPath) }]
      }
    })
  );
}

function launch(pluginRoot, prompt, extraEnv = {}) {
  const result = spawnSync(
    process.execPath,
    [path.join(pluginRoot, 'src', 'hooks', 'launch.js'), 'persona-mode.js', '--data-dir', dataDir],
    {
      cwd: temp,
      input: JSON.stringify({ prompt, session_id: 'launch-test', cwd: temp }),
      encoding: 'utf8',
      env: {
        ...process.env,
        CLAUDE_CONFIG_DIR: configDir,
        CLAUDE_PLUGIN_ROOT: pluginRoot,
        CLAUDE_PLUGIN_DATA: dataDir,
        MASQ_DATA_DIR: dataDir,
        MASQ_DEFAULT_STACK: '',
        MASQ_RESET_ON_START: '',
        MASQ_LIVE_ROOT: '',
        MASQ_NO_RELAUNCH: '',
        ...extraEnv
      }
    }
  );
  assert.strictEqual(result.status, 0, result.stderr || 'launch.js failed');
  assert.ok(result.stdout, 'expected hook JSON output');
  return JSON.parse(result.stdout).hookSpecificOutput.additionalContext;
}

try {
  fs.mkdirSync(dataDir, { recursive: true });
  copyPlugin(pinned, '0.0.1');
  copyPlugin(live, '9.9.9');
  copyPlugin(foreign, '1.0.0');

  // The live copy ships a profile the pinned copy has never heard of.
  fs.writeFileSync(
    path.join(live, 'profiles', 'zed.md'),
    [
      '---',
      'id: zed',
      'name: Zed',
      'description: A profile that only the live copy knows.',
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
  const foreignManifest = path.join(foreign, '.claude-plugin', 'plugin.json');
  fs.writeFileSync(foreignManifest, JSON.stringify({ name: 'other', version: '1.0.0' }));

  // 1. Pinned cache copy + newer install: delegate, so the new profile resolves.
  writeInstalled(live);
  let output = launch(pinned, '/masq:persona on zed');
  assert.match(output, /Active personas: zed/, `expected delegation to the live copy, got:\n${output}`);
  output = launch(pinned, '/masq:persona doctor');
  assert.match(output, /Launcher: session pinned to 0\.0\.1 at .*0\.0\.1; running 9\.9\.9 from .*9\.9\.9/);
  launch(pinned, '/masq:persona clear');

  // 2. Same session, MASQ_NO_RELAUNCH=1: the pinned copy runs and rejects the profile.
  output = launch(pinned, '/masq:persona on zed', { MASQ_NO_RELAUNCH: '1' });
  assert.match(output, /unknown profile: zed/);
  output = launch(pinned, '/masq:persona doctor', { MASQ_NO_RELAUNCH: '1' });
  assert.match(output, /Launcher: running the session's pinned copy at .*0\.0\.1/);

  // 3. A development checkout outside the cache is never redirected.
  output = launch(root, '/masq:persona on zed');
  assert.match(output, /unknown profile: zed/);

  // 4. MASQ_LIVE_ROOT points a development checkout at another copy explicitly.
  output = launch(root, '/masq:persona on zed', { MASQ_LIVE_ROOT: live });
  assert.match(output, /Active personas: zed/);
  launch(root, '/masq:persona clear', { MASQ_LIVE_ROOT: live });

  // 5. Install record pointing at a missing directory: fall back to the pinned copy.
  writeInstalled(path.join(cache, 'missing'));
  output = launch(pinned, '/masq:persona on zed');
  assert.match(output, /unknown profile: zed/);

  // 6. Install record pointing at a plugin that is not masq: fall back.
  writeInstalled(foreign);
  output = launch(pinned, '/masq:persona on zed');
  assert.match(output, /unknown profile: zed/);

  // 7. Install record pointing at the pinned copy itself: run it directly.
  writeInstalled(pinned);
  output = launch(pinned, '/masq:persona doctor');
  assert.match(output, /Launcher: running the session's pinned copy at .*0\.0\.1/);

  // 8. No install record at all: fall back without error.
  fs.rmSync(path.join(configDir, 'plugins', 'installed_plugins.json'));
  output = launch(pinned, '/masq:persona on zed');
  assert.match(output, /unknown profile: zed/);

  console.log('masq launcher tests passed');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
