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
  clearStack,
  readStack,
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
  const catalog = loadProfiles();
  const stored = readStack();
  let stack = canonicalizeStack(stored, catalog);

  if (JSON.stringify(stored) !== JSON.stringify(stack)) {
    if (stack.length) writeStack(stack);
    else clearStack();
  }

  if (source === 'startup' && truthy(process.env.MASQ_RESET_ON_START)) {
    clearStack();
    stack = [];
  }

  if (source === 'startup' && stack.length === 0) {
    const defaults = tokenizeProfileList(process.env.MASQ_DEFAULT_STACK || '');
    const resolvedDefaults = resolveTokens(defaults, catalog);
    if (resolvedDefaults.length && writeStack(resolvedDefaults)) stack = resolvedDefaults;
  }

  const context = composeFullContext(stack, catalog);
  if (context) process.stdout.write(context);
} catch (_) {
  // Session hooks must never block Claude Code startup.
}
