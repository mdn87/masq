#!/usr/bin/env node
'use strict';

const fs = require('fs');
const {
  canonicalizeStack,
  loadProfiles,
  resolveProfileToken,
  tokenizeProfileList
} = require('./persona-profiles');
const {
  clearSessionStack,
  clearStack,
  mergeStacks,
  resolveState,
  writeProjectStack,
  writeSessionRecord,
  writeStack
} = require('./persona-state');
const { composeFullContext } = require('./persona-context');

function readPayload() {
  try {
    if (process.stdin.isTTY) return {};
    const raw = fs.readFileSync(0, 'utf8');
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

function resolveTokens(tokens, catalog) {
  const stack = [];
  for (const token of tokens) {
    const resolved = resolveProfileToken(token, catalog);
    if (resolved.error) continue;
    const previous = stack.findIndex(entry => entry.id === resolved.entry.id);
    if (previous !== -1) stack.splice(previous, 1);
    stack.push(resolved.entry);
  }
  return canonicalizeStack(stack, catalog);
}

function truthy(value) {
  return /^(?:1|true|yes|on)$/i.test(String(value || '').trim());
}

try {
  const payload = readPayload();
  const source = typeof payload.source === 'string' ? payload.source : 'startup';
  const cwd = payload.cwd || process.cwd();
  const sessionId = payload.session_id || 'unknown';
  const catalog = loadProfiles();

  if (source === 'startup' || source === 'clear') clearSessionStack(sessionId);
  if (source === 'startup' && truthy(process.env.MASQ_RESET_ON_START)) clearStack();

  let state = resolveState({ cwd, sessionId });
  let global = canonicalizeStack(state.global, catalog);
  let project = canonicalizeStack(state.project, catalog);
  let temporary = canonicalizeStack(state.temporary, catalog);

  if (state.globalRecord.defined && JSON.stringify(global) !== JSON.stringify(state.global)) writeStack(global);
  if (state.projectRecord.defined && JSON.stringify(project) !== JSON.stringify(state.project)) writeProjectStack(cwd, project);
  if (source === 'startup' && global.length === 0) {
    const defaults = tokenizeProfileList(process.env.MASQ_DEFAULT_STACK || '');
    const resolvedDefaults = resolveTokens(defaults, catalog);
    if (resolvedDefaults.length && writeStack(resolvedDefaults)) global = resolvedDefaults;
  }

  state = resolveState({ cwd, sessionId });
  global = canonicalizeStack(state.global, catalog);
  project = canonicalizeStack(state.project, catalog);
  temporary = canonicalizeStack(state.temporary, catalog);
  const persistent = state.projectRecord.defined ? project : global;
  const effective = canonicalizeStack(mergeStacks(persistent, temporary), catalog);

  writeSessionRecord(sessionId, temporary, effective);
  const context = composeFullContext(effective, catalog);
  if (context) process.stdout.write(context);
} catch (_) {
  // Session hooks must never block Claude Code startup.
}
