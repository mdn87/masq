'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Mods run in-process, without shell hooks' CLAUDE_PLUGIN_DATA substitution.
// Resolve the exact loaded installation; never pick the first masq installation.
function resolveClaudeDataDir(pluginRoot) {
  for (const name of ['MASQ_DATA_DIR', 'CLAUDE_PLUGIN_DATA']) {
    if (String(process.env[name] || '').trim()) return path.resolve(process.env[name]);
  }
  const root = fs.realpathSync(pluginRoot);
  const config = path.resolve(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'));
  let cache = path.join(config, 'plugins', 'cache');
  if (fs.existsSync(cache)) cache = fs.realpathSync(cache);
  const relative = path.relative(cache, root);
  const cached = relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
  if (!cached) return path.join(config, 'plugins', 'data', 'masq-inline');
  const registry = path.join(config, 'plugins', 'installed_plugins.json');
  if (fs.lstatSync(registry).isSymbolicLink() || fs.statSync(registry).size > 1024 * 1024) {
    throw new Error('Claude plugin registry is not a bounded regular file');
  }
  const record = JSON.parse(fs.readFileSync(registry, 'utf8'));
  const matches = [];
  for (const [id, entries] of Object.entries(record.plugins || {})) {
    if (!id.startsWith('masq@') || !Array.isArray(entries)) continue;
    if (entries.some(entry => {
      try { return fs.realpathSync(entry.installPath) === root; } catch (_) { return false; }
    })) matches.push(id);
  }
  if (matches.length !== 1) throw new Error('Loaded Masq installation has no unique registry identity; use the CLI with --data-dir');
  return path.join(config, 'plugins', 'data', matches[0].replace(/[^a-zA-Z0-9_-]/g, '-'));
}

module.exports = { resolveClaudeDataDir };
