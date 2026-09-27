#!/usr/bin/env node
'use strict';

// Hook launcher: run the hook from the masq copy that is installed right now,
// not the copy this Claude Code session pinned at startup.
//
// Claude Code resolves ${CLAUDE_PLUGIN_ROOT} once per session. After
// `claude plugin update masq@masq` the session keeps running the old cache
// directory until it is restarted, so new profiles are "unknown" and fixes do
// not apply. Hooks are fresh processes on every event, so this launcher reads
// installed_plugins.json, and when the installed copy differs from the pinned
// one, delegates to the installed copy's hook script.
//
// Rules, all fail-closed to running the pinned copy:
// - Only delegate when the pinned root is itself an installed cache copy. A
//   `claude --plugin-dir .` development checkout is never redirected.
// - Only delegate to a directory that is a masq plugin (manifest name "masq")
//   and contains the requested hook script.
// - MASQ_LIVE_ROOT overrides the lookup (useful for a development checkout).
// - MASQ_NO_RELAUNCH=1 disables delegation entirely.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOK_NAME_RE = /^persona-[a-z-]+\.js$/;

function realpathOrNull(target) {
  try {
    return fs.realpathSync(target);
  } catch (_) {
    return null;
  }
}

function readJson(target) {
  return JSON.parse(fs.readFileSync(target, 'utf8'));
}

function configDir() {
  const explicit = String(process.env.CLAUDE_CONFIG_DIR || '').trim();
  return explicit || path.join(os.homedir(), '.claude');
}

function isMasqPlugin(root) {
  try {
    const manifest = readJson(path.join(root, '.claude-plugin', 'plugin.json'));
    return manifest && manifest.name === 'masq';
  } catch (_) {
    return false;
  }
}

function manifestVersion(root) {
  try {
    return String(readJson(path.join(root, '.claude-plugin', 'plugin.json')).version || 'unknown');
  } catch (_) {
    return 'unknown';
  }
}

function pinnedRoot() {
  const fromEnv = String(process.env.CLAUDE_PLUGIN_ROOT || '').trim();
  return path.resolve(fromEnv || path.join(__dirname, '..', '..'));
}

function isInstalledCopy(root) {
  const cacheRoot = realpathOrNull(path.join(configDir(), 'plugins', 'cache'));
  const real = realpathOrNull(root);
  if (!cacheRoot || !real) return false;
  const relative = path.relative(cacheRoot, real);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function installedRoot() {
  const override = String(process.env.MASQ_LIVE_ROOT || '').trim();
  if (override) return path.resolve(override);
  let record;
  try {
    record = readJson(path.join(configDir(), 'plugins', 'installed_plugins.json'));
  } catch (_) {
    return null;
  }
  const plugins = record && typeof record.plugins === 'object' ? record.plugins : {};
  for (const [key, entries] of Object.entries(plugins)) {
    if (!/^masq@/.test(key) || !Array.isArray(entries)) continue;
    const userScope = entries.find(entry => entry && entry.scope === 'user' && entry.installPath)
      || entries.find(entry => entry && entry.installPath);
    if (userScope) return path.resolve(String(userScope.installPath));
  }
  return null;
}

function resolveLiveHook(hook) {
  if (String(process.env.MASQ_NO_RELAUNCH || '').trim() === '1') return null;
  const pinned = pinnedRoot();
  const override = String(process.env.MASQ_LIVE_ROOT || '').trim();
  if (!override && !isInstalledCopy(pinned)) return null;
  const live = installedRoot();
  if (!live) return null;
  const pinnedReal = realpathOrNull(pinned);
  const liveReal = realpathOrNull(live);
  if (!liveReal || liveReal === pinnedReal) return null;
  if (!isMasqPlugin(liveReal)) return null;
  const script = path.join(liveReal, 'src', 'hooks', hook);
  if (!fs.existsSync(script)) return null;
  return { root: liveReal, script, pinned: pinnedReal || pinned };
}

function main() {
  const hook = String(process.argv[2] || '');
  const rest = process.argv.slice(3);
  if (!HOOK_NAME_RE.test(hook) || !fs.existsSync(path.join(__dirname, hook))) {
    // Unknown hook name: nothing sensible to run. Stay silent and succeed.
    return;
  }

  let live = null;
  try {
    live = resolveLiveHook(hook);
  } catch (_) {
    live = null;
  }

  if (live) {
    const result = spawnSync(process.execPath, [live.script, ...rest], {
      stdio: 'inherit',
      env: {
        ...process.env,
        CLAUDE_PLUGIN_ROOT: live.root,
        MASQ_LAUNCHED_FROM: live.pinned,
        MASQ_LAUNCHED_FROM_VERSION: manifestVersion(live.pinned)
      }
    });
    if (result.error) {
      // Delegation failed before the child ran; fall back to the pinned copy.
      require(path.join(__dirname, hook));
      return;
    }
    process.exitCode = typeof result.status === 'number' ? result.status : 0;
    return;
  }

  require(path.join(__dirname, hook));
}

main();
