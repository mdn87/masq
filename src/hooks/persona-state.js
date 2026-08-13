'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const STATE_VERSION = 1;
const STATE_FILENAME = 'state.json';
const MAX_STATE_BYTES = 8192;
const MAX_ACTIVE = 12;
const NAME_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

function getClaudeDir() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
}

function getCliDataDir() {
  const index = process.argv.indexOf('--data-dir');
  if (index === -1 || !process.argv[index + 1]) return null;
  const value = String(process.argv[index + 1]).trim();
  return value ? path.resolve(value) : null;
}

function getDataDir() {
  const explicit = String(process.env.MASQ_DATA_DIR || '').trim();
  if (explicit) return path.resolve(explicit);

  const cli = getCliDataDir();
  if (cli) return cli;

  const pluginData = String(process.env.CLAUDE_PLUGIN_DATA || '').trim();
  if (pluginData) return path.resolve(pluginData);

  return path.join(getClaudeDir(), 'plugins', 'data', 'masq-local');
}

function getStatePath() {
  return path.join(getDataDir(), STATE_FILENAME);
}

function normalizeEntry(value) {
  if (!value || typeof value !== 'object') return null;
  const id = typeof value.id === 'string' ? value.id.trim().toLowerCase() : '';
  const variant = typeof value.variant === 'string' ? value.variant.trim().toLowerCase() : '';
  if (!NAME_RE.test(id) || !NAME_RE.test(variant)) return null;
  return { id, variant };
}

function normalizeStack(value) {
  const result = [];
  const items = Array.isArray(value) ? value : [];

  for (const item of items) {
    const entry = normalizeEntry(item);
    if (!entry) continue;
    const previous = result.findIndex(existing => existing.id === entry.id);
    if (previous !== -1) result.splice(previous, 1);
    result.push(entry);
    if (result.length > MAX_ACTIVE) result.shift();
  }

  return result;
}

function readStack() {
  const statePath = getStatePath();
  try {
    const stat = fs.lstatSync(statePath);
    if (stat.isSymbolicLink() || !stat.isFile() || stat.size > MAX_STATE_BYTES) return [];
    const parsed = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    if (!parsed || parsed.version !== STATE_VERSION) return [];
    return normalizeStack(parsed.active);
  } catch (_) {
    return [];
  }
}

function writeStack(stack) {
  const normalized = normalizeStack(stack);
  const dataDir = getDataDir();
  const statePath = getStatePath();
  const tempPath = `${statePath}.${process.pid}.${Date.now()}.tmp`;
  const serialized = `${JSON.stringify({ version: STATE_VERSION, active: normalized }, null, 2)}\n`;

  if (Buffer.byteLength(serialized, 'utf8') > MAX_STATE_BYTES) return false;

  try {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });

    const dirStat = fs.lstatSync(dataDir);
    if (dirStat.isSymbolicLink() || !dirStat.isDirectory()) return false;

    try {
      if (fs.lstatSync(statePath).isSymbolicLink()) return false;
    } catch (_) {
      // Missing state file is expected.
    }

    fs.writeFileSync(tempPath, serialized, {
      encoding: 'utf8',
      mode: 0o600,
      flag: 'wx'
    });
    fs.renameSync(tempPath, statePath);
    return true;
  } catch (_) {
    try { fs.unlinkSync(tempPath); } catch (_) {}
    return false;
  }
}

function clearStack() {
  const statePath = getStatePath();
  try {
    const stat = fs.lstatSync(statePath);
    if (!stat.isSymbolicLink() && stat.isFile()) fs.unlinkSync(statePath);
  } catch (_) {}
}

module.exports = {
  MAX_ACTIVE,
  STATE_FILENAME,
  clearStack,
  getClaudeDir,
  getDataDir,
  getStatePath,
  normalizeEntry,
  normalizeStack,
  readStack,
  writeStack
};
