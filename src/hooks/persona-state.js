'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const STATE_VERSION = 1;
const PRESETS_VERSION = 1;
const STATE_FILENAME = 'state.json';
const PRESETS_FILENAME = 'presets.json';
const MAX_STATE_BYTES = 8192;
const MAX_PRESETS_BYTES = 64 * 1024;
const MAX_ACTIVE = 12;
const MAX_PRESETS = 100;
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

function stableHash(value) {
  return crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex');
}

function canonicalProjectPath(cwd) {
  const candidate = path.resolve(String(cwd || process.cwd()));
  try {
    return fs.realpathSync.native(candidate);
  } catch (_) {
    return candidate;
  }
}

function getProjectStatePath(cwd) {
  return path.join(getDataDir(), 'projects', `${stableHash(canonicalProjectPath(cwd))}.json`);
}

function getSessionStatePath(sessionId) {
  return path.join(getDataDir(), 'sessions', `${stableHash(String(sessionId || 'unknown'))}.json`);
}

function getPresetsPath() {
  return path.join(getDataDir(), PRESETS_FILENAME);
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

function mergeStacks(base, overlay) {
  const result = normalizeStack(base);
  for (const entry of normalizeStack(overlay)) {
    const previous = result.findIndex(existing => existing.id === entry.id);
    if (previous !== -1) result.splice(previous, 1);
    result.push(entry);
    if (result.length > MAX_ACTIVE) result.shift();
  }
  return result;
}

function readJsonFile(filePath, maxBytes) {
  try {
    const stat = fs.lstatSync(filePath);
    if (stat.isSymbolicLink()) return { status: 'invalid', error: 'symlink rejected' };
    if (!stat.isFile()) return { status: 'invalid', error: 'not a regular file' };
    if (stat.size > maxBytes) return { status: 'invalid', error: `exceeds ${maxBytes} bytes` };
    return { status: 'valid', value: JSON.parse(fs.readFileSync(filePath, 'utf8')) };
  } catch (error) {
    if (error && error.code === 'ENOENT') return { status: 'missing' };
    return { status: 'invalid', error: error && error.message ? error.message : String(error) };
  }
}

function readStackRecord(filePath) {
  const inspected = readJsonFile(filePath, MAX_STATE_BYTES);
  if (inspected.status !== 'valid') {
    return { defined: false, status: inspected.status, stack: [], error: inspected.error || '' };
  }
  if (!inspected.value || inspected.value.version !== STATE_VERSION || !Array.isArray(inspected.value.active)) {
    return { defined: false, status: 'invalid', stack: [], error: `expected state version ${STATE_VERSION}` };
  }
  const stack = normalizeStack(inspected.value.active);
  if (JSON.stringify(stack) !== JSON.stringify(inspected.value.active)) {
    return { defined: false, status: 'invalid', stack: [], error: 'active stack is not canonical' };
  }
  return { defined: true, status: 'valid', stack, error: '' };
}

function ensureSafeDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const stat = fs.lstatSync(directory);
  return !stat.isSymbolicLink() && stat.isDirectory();
}

function writeJsonFile(filePath, value, maxBytes) {
  const dataDir = getDataDir();
  const relative = path.relative(dataDir, filePath);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return false;
  const serialized = `${JSON.stringify(value, null, 2)}\n`;
  if (Buffer.byteLength(serialized, 'utf8') > maxBytes) return false;
  const parent = path.dirname(filePath);
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    if (!ensureSafeDirectory(dataDir) || !ensureSafeDirectory(parent)) return false;
    try {
      if (fs.lstatSync(filePath).isSymbolicLink()) return false;
    } catch (_) {
      // Missing destination is expected.
    }
    fs.writeFileSync(tempPath, serialized, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (_) {
    try { fs.unlinkSync(tempPath); } catch (_) {}
    return false;
  }
}

function writeStackFile(filePath, stack, extra = {}) {
  return writeJsonFile(filePath, {
    version: STATE_VERSION,
    active: normalizeStack(stack),
    ...extra
  }, MAX_STATE_BYTES);
}

function clearFile(filePath) {
  try {
    const stat = fs.lstatSync(filePath);
    if (stat.isSymbolicLink() || !stat.isFile()) return false;
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    return Boolean(error && error.code === 'ENOENT');
  }
}

function readStack() {
  return readStackRecord(getStatePath()).stack;
}

function writeStack(stack) {
  return writeStackFile(getStatePath(), stack);
}

function clearStack() {
  return clearFile(getStatePath());
}

function readProjectStack(cwd) {
  return readStackRecord(getProjectStatePath(cwd));
}

function writeProjectStack(cwd, stack) {
  return writeStackFile(getProjectStatePath(cwd), stack, { project: canonicalProjectPath(cwd) });
}

function clearProjectStack(cwd) {
  return clearFile(getProjectStatePath(cwd));
}

function readSessionRecord(sessionId) {
  const inspected = readJsonFile(getSessionStatePath(sessionId), MAX_STATE_BYTES);
  if (inspected.status !== 'valid') {
    return { defined: false, status: inspected.status, stack: [], lastEffective: [], error: inspected.error || '' };
  }
  const value = inspected.value;
  if (!value || value.version !== STATE_VERSION || !Array.isArray(value.active)) {
    return { defined: false, status: 'invalid', stack: [], lastEffective: [], error: `expected state version ${STATE_VERSION}` };
  }
  const stack = normalizeStack(value.active);
  if (JSON.stringify(stack) !== JSON.stringify(value.active)) {
    return { defined: false, status: 'invalid', stack: [], lastEffective: [], error: 'active stack is not canonical' };
  }
  return {
    defined: true,
    status: 'valid',
    stack,
    lastEffective: normalizeStack(value.lastEffective),
    error: ''
  };
}

function writeSessionRecord(sessionId, stack, lastEffective = []) {
  return writeStackFile(getSessionStatePath(sessionId), stack, {
    lastEffective: normalizeStack(lastEffective)
  });
}

function clearSessionStack(sessionId) {
  return clearFile(getSessionStatePath(sessionId));
}

function resolveState({ cwd, sessionId } = {}) {
  const globalRecord = readStackRecord(getStatePath());
  const projectRecord = readProjectStack(cwd);
  const sessionRecord = readSessionRecord(sessionId);
  const persistentScope = projectRecord.defined ? 'project' : 'global';
  const persistent = projectRecord.defined ? projectRecord.stack : globalRecord.stack;
  return {
    global: globalRecord.stack,
    globalRecord,
    project: projectRecord.stack,
    projectRecord,
    temporary: sessionRecord.stack,
    sessionRecord,
    persistent,
    persistentScope,
    effective: mergeStacks(persistent, sessionRecord.stack)
  };
}

function readPresetsRecord() {
  const inspected = readJsonFile(getPresetsPath(), MAX_PRESETS_BYTES);
  if (inspected.status === 'missing') return { status: 'missing', presets: {}, error: '' };
  if (inspected.status !== 'valid') return { status: 'invalid', presets: {}, error: inspected.error || '' };
  const value = inspected.value;
  if (!value || value.version !== PRESETS_VERSION || !value.presets || typeof value.presets !== 'object' || Array.isArray(value.presets)) {
    return { status: 'invalid', presets: {}, error: `expected presets version ${PRESETS_VERSION}` };
  }
  const presets = {};
  for (const [name, stack] of Object.entries(value.presets)) {
    if (!NAME_RE.test(name) || !Array.isArray(stack)) {
      return { status: 'invalid', presets: {}, error: `invalid preset entry: ${name}` };
    }
    const normalized = normalizeStack(stack);
    if (JSON.stringify(normalized) !== JSON.stringify(stack)) {
      return { status: 'invalid', presets: {}, error: `preset ${name} is not canonical` };
    }
    presets[name] = normalized;
  }
  return { status: 'valid', presets, error: '' };
}

function writePresets(presets) {
  const names = Object.keys(presets || {}).sort();
  if (names.length > MAX_PRESETS || names.some(name => !NAME_RE.test(name))) return false;
  const normalized = {};
  for (const name of names) normalized[name] = normalizeStack(presets[name]);
  return writeJsonFile(getPresetsPath(), { version: PRESETS_VERSION, presets: normalized }, MAX_PRESETS_BYTES);
}

function savePreset(name, stack) {
  if (!NAME_RE.test(String(name || ''))) return false;
  const record = readPresetsRecord();
  if (record.status === 'invalid') return false;
  return writePresets({ ...record.presets, [name]: normalizeStack(stack) });
}

function deletePreset(name) {
  const record = readPresetsRecord();
  if (record.status === 'invalid' || !Object.prototype.hasOwnProperty.call(record.presets, name)) return false;
  const next = { ...record.presets };
  delete next[name];
  return writePresets(next);
}

module.exports = {
  MAX_ACTIVE,
  MAX_PRESETS,
  NAME_RE,
  PRESETS_FILENAME,
  STATE_FILENAME,
  canonicalProjectPath,
  clearProjectStack,
  clearSessionStack,
  clearStack,
  deletePreset,
  getClaudeDir,
  getDataDir,
  getPresetsPath,
  getProjectStatePath,
  getSessionStatePath,
  getStatePath,
  mergeStacks,
  normalizeEntry,
  normalizeStack,
  readPresetsRecord,
  readProjectStack,
  readSessionRecord,
  readStack,
  readStackRecord,
  resolveState,
  savePreset,
  writePresets,
  writeProjectStack,
  writeSessionRecord,
  writeStack
};
