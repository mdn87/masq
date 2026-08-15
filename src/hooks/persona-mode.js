#!/usr/bin/env node
'use strict';

const {
  canonicalizeStack,
  formatCatalog,
  formatStack,
  loadProfiles,
  resolveProfileToken,
  tokenizeProfileList
} = require('./persona-profiles');
const {
  MAX_ACTIVE,
  NAME_RE,
  clearProjectStack,
  clearSessionStack,
  clearStack,
  deletePreset,
  mergeStacks,
  readPresetsRecord,
  resolveState,
  savePreset,
  writeProjectStack,
  writeSessionRecord,
  writeStack
} = require('./persona-state');
const { diagnose } = require('./persona-doctor');
const { composeFullContext, composeReinforcement } = require('./persona-context');

function emitContext(text) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: text
    }
  }));
}

function commandEnvelope(rawPrompt) {
  let prompt = String(rawPrompt || '').trim().toLowerCase().replace(/\s+/g, ' ');
  let foreignCommand = false;
  const commandName = /<command-name>\s*([^<\s]+)\s*<\/command-name>/.exec(prompt);
  if (commandName) {
    const name = commandName[1];
    const isPersona = name === '/persona' || name === '/masq:persona';
    const isAfterdark = name === '/afterdark' || name === '/masq:afterdark';
    if (isPersona || isAfterdark) {
      const argsMatch = /<command-args>\s*([^<]*?)\s*<\/command-args>/.exec(prompt);
      const args = argsMatch ? argsMatch[1].trim() : '';
      const base = isPersona ? '/persona' : '/afterdark';
      prompt = args ? `${base} ${args}` : base;
    } else {
      foreignCommand = true;
    }
  }
  return { prompt, foreignCommand, scheduled: /<scheduled-task\b/.test(prompt) };
}

function parseStackArgs(args, scope = 'active') {
  const trimmed = String(args || '').trim();
  if (!trimmed) return { op: 'status', scope };
  const firstSpace = trimmed.indexOf(' ');
  const action = (firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace)).toLowerCase();
  const rest = firstSpace === -1 ? '' : trimmed.slice(firstSpace + 1).trim();
  const tokens = tokenizeProfileList(rest);

  switch (action) {
    case 'status':
    case 'active':
      return { op: 'status', scope };
    case 'list':
    case 'catalog':
    case 'profiles':
      return { op: 'catalog', scope };
    case 'help':
      return { op: 'help', scope };
    case 'clear':
    case 'reset':
      return { op: 'clear', scope };
    case 'unset':
      return scope === 'project'
        ? { op: 'unset', scope }
        : { op: 'error', error: 'unset is available only for project overrides', scope };
    case 'on':
    case 'add':
    case 'enable':
      return tokens.length ? { op: 'on', tokens, scope } : { op: 'error', error: `${action} requires at least one profile`, scope };
    case 'off':
    case 'remove':
    case 'disable':
      return tokens.length ? { op: 'off', tokens, scope } : { op: 'clear', scope };
    case 'toggle':
      return tokens.length ? { op: 'toggle', tokens, scope } : { op: 'error', error: 'toggle requires at least one profile', scope };
    case 'set':
    case 'stack':
    case 'only':
    case 'order':
      return tokens.length
        ? { op: 'set', tokens, scope }
        : { op: 'error', error: `${action} requires at least one profile; use clear to empty the stack`, scope };
    case 'move': {
      const moveParts = tokenizeProfileList(rest);
      if (moveParts.length !== 2 || !['first', 'last'].includes(moveParts[1])) {
        return { op: 'error', error: 'move syntax: move <profile> first|last', scope };
      }
      return { op: 'move', token: moveParts[0], position: moveParts[1], scope };
    }
    default:
      return { op: 'on', tokens: tokenizeProfileList(trimmed), scope };
  }
}

function parsePresetArgs(args) {
  const parts = tokenizeProfileList(args);
  const action = parts.shift() || 'list';
  if (['list', 'status'].includes(action)) return { op: 'preset-list' };
  if (['export', 'save'].includes(action)) {
    const name = parts.shift() || '';
    const source = parts.shift() || 'effective';
    if (!NAME_RE.test(name)) return { op: 'error', error: 'preset name must use lowercase letters, numbers, and hyphens' };
    if (!['effective', 'global', 'project', 'temp', 'temporary', 'session'].includes(source) || parts.length) {
      return { op: 'error', error: 'preset export syntax: preset export <name> [effective|global|project|temp]' };
    }
    return { op: 'preset-export', name, source: ['temporary', 'session'].includes(source) ? 'temp' : source };
  }
  if (['import', 'load', 'use'].includes(action)) {
    const name = parts.shift() || '';
    const target = parts.shift() || 'active';
    if (!NAME_RE.test(name)) return { op: 'error', error: 'preset name must use lowercase letters, numbers, and hyphens' };
    if (!['active', 'global', 'project', 'temp', 'temporary', 'session'].includes(target) || parts.length) {
      return { op: 'error', error: 'preset import syntax: preset import <name> [active|global|project|temp]' };
    }
    return { op: 'preset-import', name, target: ['temporary', 'session'].includes(target) ? 'temp' : target };
  }
  if (['delete', 'remove'].includes(action)) {
    const name = parts.shift() || '';
    if (!NAME_RE.test(name) || parts.length) return { op: 'error', error: 'preset delete syntax: preset delete <name>' };
    return { op: 'preset-delete', name };
  }
  return { op: 'error', error: 'preset action must be list, export, import, or delete' };
}

function parsePersonaArgs(args) {
  const trimmed = String(args || '').trim();
  if (!trimmed) return { op: 'status', scope: 'active' };
  const firstSpace = trimmed.indexOf(' ');
  const action = (firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace)).toLowerCase();
  const rest = firstSpace === -1 ? '' : trimmed.slice(firstSpace + 1).trim();
  if (action === 'doctor') return { op: 'doctor' };
  if (action === 'global') return parseStackArgs(rest, 'global');
  if (action === 'project') return parseStackArgs(rest, 'project');
  if (['temp', 'temporary', 'session'].includes(action)) return parseStackArgs(rest, 'temp');
  if (['preset', 'presets'].includes(action)) return parsePresetArgs(rest);
  return parseStackArgs(trimmed, 'active');
}

function parseCommand(prompt, foreignCommand) {
  const persona = /^\/(?:persona|masq:persona)(?:\s+(.*))?$/.exec(prompt);
  if (persona) return parsePersonaArgs(persona[1] || '');
  const afterdark = /^\/(?:afterdark|masq:afterdark)(?:\s+(flirty|suggestive|direct|off))?\s*$/.exec(prompt);
  if (afterdark) {
    if (afterdark[1] === 'off') return { op: 'off', tokens: ['afterdark'], scope: 'active', legacy: true };
    return { op: 'on', tokens: [`afterdark:${afterdark[1] || 'suggestive'}`], scope: 'active', legacy: true };
  }
  if (foreignCommand) return null;
  if (/^(?:what|which) (?:personas?|masks?)(?: are| is)? active\??$/.test(prompt) || /^show (?:the )?active (?:persona|masq|mask) stack\.?$/.test(prompt)) {
    return { op: 'status', scope: 'active' };
  }
  if (/^(?:list|show) (?:the )?(?:available )?(?:persona profiles|persona catalog|masks?)\.?$/.test(prompt)) {
    return { op: 'catalog', scope: 'active' };
  }
  if (/^(?:clear|reset|disable|turn off) (?:all )?(?:personas?|masks?)(?: profiles| stack)?\.?$/.test(prompt)) {
    return { op: 'clear', scope: 'active' };
  }
  const stack = /^(?:set|use) (?:the )?(?:persona|masq|mask) stack (?:to )?(.+)$/.exec(prompt);
  if (stack) return { op: 'set', tokens: tokenizeProfileList(stack[1]), scope: 'active' };
  const turnOn = /^(?:turn on|enable|activate|use|put on) (?:the )?([a-z0-9][a-z0-9-]*(?::[a-z0-9][a-z0-9-]*)?) (?:persona|profile|mask)(?: mode)?\.?$/.exec(prompt);
  if (turnOn) return { op: 'on', tokens: [turnOn[1]], scope: 'active' };
  const turnOff = /^(?:turn off|disable|deactivate|remove|take off) (?:the )?([a-z0-9][a-z0-9-]*(?::[a-z0-9][a-z0-9-]*)?) (?:persona|profile|mask)(?: mode)?\.?$/.exec(prompt);
  if (turnOff) return { op: 'off', tokens: [turnOff[1]], scope: 'active' };
  return null;
}

function resolveAll(tokens, catalog) {
  const entries = [];
  for (const token of tokens || []) {
    const resolved = resolveProfileToken(token, catalog);
    if (resolved.error) return { error: resolved.error };
    const previous = entries.findIndex(entry => entry.id === resolved.entry.id);
    if (previous !== -1) entries.splice(previous, 1);
    entries.push(resolved.entry);
  }
  return { entries };
}

function currentStackForScope(scope, state) {
  if (scope === 'global') return { scope, stack: state.global };
  if (scope === 'project') return { scope, stack: state.projectRecord.defined ? state.project : state.global };
  if (scope === 'temp') return { scope, stack: state.temporary };
  return { scope: state.persistentScope, stack: state.persistent };
}

function mutateStack(command, current, catalog) {
  if (command.op === 'clear') return { stack: [] };
  if (command.op === 'move') {
    const resolved = resolveProfileToken(command.token, catalog);
    if (resolved.error) return { error: resolved.error };
    const index = current.findIndex(entry => entry.id === resolved.entry.id);
    if (index === -1) return { error: `${resolved.entry.id} is not active` };
    const next = [...current];
    const [entry] = next.splice(index, 1);
    if (command.position === 'first') next.unshift(entry);
    else next.push(entry);
    return { stack: next };
  }
  const resolved = resolveAll(command.tokens, catalog);
  if (resolved.error) return { error: resolved.error };
  let next = [...current];
  if (command.op === 'on') {
    for (const entry of resolved.entries) {
      const existing = next.findIndex(item => item.id === entry.id);
      if (existing !== -1) next.splice(existing, 1);
      next.push(entry);
    }
  } else if (command.op === 'off') {
    const ids = new Set(resolved.entries.map(entry => entry.id));
    next = next.filter(entry => !ids.has(entry.id));
  } else if (command.op === 'toggle') {
    for (const entry of resolved.entries) {
      const existing = next.findIndex(item => item.id === entry.id);
      if (existing !== -1) next.splice(existing, 1);
      else next.push(entry);
    }
  } else if (command.op === 'set') {
    next = resolved.entries;
  } else {
    return { error: `unsupported operation: ${command.op}` };
  }
  next = canonicalizeStack(next, catalog, Number.MAX_SAFE_INTEGER);
  if (next.length > MAX_ACTIVE) return { error: `persona stack is limited to ${MAX_ACTIVE} profiles` };
  return { stack: next };
}

function writeScope(scope, stack, context) {
  if (scope === 'global') return stack.length ? writeStack(stack) : clearStack();
  if (scope === 'project') return writeProjectStack(context.cwd, stack);
  if (scope === 'temp') return writeSessionRecord(context.sessionId, stack, []);
  return false;
}

function canonicalState(context, catalog) {
  const raw = resolveState(context);
  const global = canonicalizeStack(raw.global, catalog);
  const project = canonicalizeStack(raw.project, catalog);
  const temporary = canonicalizeStack(raw.temporary, catalog);
  const persistent = raw.projectRecord.defined ? project : global;
  return {
    ...raw,
    global,
    project,
    temporary,
    persistent,
    effective: canonicalizeStack(mergeStacks(persistent, temporary), catalog)
  };
}

function applyPreset(command, context, catalog, state) {
  const presets = readPresetsRecord();
  if (presets.status === 'invalid') return { kind: 'error', error: `preset store is invalid: ${presets.error}`, state };
  if (command.op === 'preset-list') {
    return { kind: 'preset-list', presets: presets.presets, state };
  }
  if (command.op === 'preset-delete') {
    if (!Object.prototype.hasOwnProperty.call(presets.presets, command.name)) {
      return { kind: 'error', error: `unknown preset: ${command.name}`, state };
    }
    if (!deletePreset(command.name)) return { kind: 'error', error: 'could not update preset store', state };
    return { kind: 'message', message: `Deleted preset ${command.name}`, state: canonicalState(context, catalog) };
  }
  if (command.op === 'preset-export') {
    const persistentRecord = state.projectRecord.defined ? state.projectRecord : state.globalRecord;
    if (command.source === 'effective' && persistentRecord.status === 'invalid') {
      return { kind: 'error', error: `${state.persistentScope} state is invalid; run /masq:persona doctor`, state };
    }
    if (command.source === 'effective' && state.sessionRecord.status === 'invalid') {
      return { kind: 'error', error: 'temp state is invalid; run /masq:persona doctor', state };
    }
    let stack = state.effective;
    if (command.source === 'global') {
      if (state.globalRecord.status === 'invalid') return { kind: 'error', error: 'global state is invalid; run /masq:persona doctor', state };
      stack = state.global;
    }
    if (command.source === 'project') {
      if (state.projectRecord.status === 'invalid') return { kind: 'error', error: 'project state is invalid; run /masq:persona doctor', state };
      if (!state.projectRecord.defined) return { kind: 'error', error: 'project override is unset', state };
      stack = state.project;
    }
    if (command.source === 'temp') {
      if (state.sessionRecord.status === 'invalid') return { kind: 'error', error: 'temp state is invalid; run /masq:persona doctor', state };
      stack = state.temporary;
    }
    if (!savePreset(command.name, stack)) return { kind: 'error', error: 'could not update preset store', state };
    return { kind: 'message', message: `Exported preset ${command.name}: ${formatStack(stack)}`, state };
  }
  if (command.op === 'preset-import') {
    if (!Object.prototype.hasOwnProperty.call(presets.presets, command.name)) {
      return { kind: 'error', error: `unknown preset: ${command.name}`, state };
    }
    const raw = presets.presets[command.name];
    const stack = canonicalizeStack(raw, catalog, Number.MAX_SAFE_INTEGER);
    if (JSON.stringify(stack) !== JSON.stringify(raw)) {
      return { kind: 'error', error: `preset ${command.name} references unavailable profiles or variants`, state };
    }
    if (command.target === 'active' && state.projectRecord.status === 'invalid') {
      return { kind: 'error', error: 'project state is invalid; choose an explicit import target or run /masq:persona doctor', state };
    }
    const target = command.target === 'active' ? state.persistentScope : command.target;
    if (!writeScope(target, stack, context)) return { kind: 'error', error: `could not write ${target} persona state`, state };
    const next = canonicalState(context, catalog);
    return { kind: 'message', message: `Imported preset ${command.name} to ${target}`, state: next };
  }
  return { kind: 'error', error: 'unsupported preset action', state };
}

function applyCommand(command, context, catalog) {
  let state = canonicalState(context, catalog);
  if (!command) return { kind: 'none', state };
  if (command.op === 'error') return { kind: 'error', error: command.error, state };
  if (command.op === 'status' || command.op === 'catalog' || command.op === 'help') {
    return { kind: command.op, state, scope: command.scope };
  }
  if (command.op.startsWith('preset-')) return applyPreset(command, context, catalog, state);
  if (command.op === 'unset') {
    if (!state.projectRecord.defined && state.projectRecord.status !== 'invalid') {
      return { kind: 'error', error: 'project override is already unset', state };
    }
    if (!clearProjectStack(context.cwd)) return { kind: 'error', error: 'could not remove project override', state };
    state = canonicalState(context, catalog);
    return { kind: 'changed', action: 'unset', scope: 'project', state };
  }
  const selected = currentStackForScope(command.scope || 'active', state);
  if ((command.scope || 'active') === 'active' && state.projectRecord.status === 'invalid') {
    return { kind: 'error', error: 'project state is invalid; run /masq:persona doctor', state };
  }
  let selectedRecord = state.globalRecord;
  if (selected.scope === 'project') selectedRecord = state.projectRecord;
  if (selected.scope === 'temp') selectedRecord = state.sessionRecord;
  if (selectedRecord.status === 'invalid' && command.op !== 'clear') {
    return { kind: 'error', error: `${selected.scope} state is invalid; run /masq:persona doctor`, state };
  }
  const mutation = mutateStack(command, selected.stack, catalog);
  if (mutation.error) return { kind: 'error', error: mutation.error, state };
  if (!writeScope(selected.scope, mutation.stack, context)) {
    return { kind: 'error', error: `could not write ${selected.scope} persona state`, state };
  }
  state = canonicalState(context, catalog);
  return { kind: 'changed', action: command.op, scope: selected.scope, state };
}

function statusText(state) {
  const globalText = state.globalRecord.status === 'invalid'
    ? `(invalid: ${state.globalRecord.error})`
    : formatStack(state.global);
  const projectText = state.projectRecord.status === 'invalid'
    ? `(invalid: ${state.projectRecord.error})`
    : state.projectRecord.defined ? formatStack(state.project) : '(unset)';
  const temporaryText = state.sessionRecord.status === 'invalid'
    ? `(invalid: ${state.sessionRecord.error})`
    : formatStack(state.temporary);
  return [
    `Active personas: ${formatStack(state.effective)}`,
    `Persistent scope: ${state.persistentScope}`,
    `Global: ${globalText}`,
    `Project override: ${projectText}`,
    `Temporary: ${temporaryText}`
  ].join('\n');
}

function helpText() {
  return [
    'Masq commands:',
    '/masq:persona status|list|doctor',
    '/masq:persona on|off|toggle|set <profile[:variant]> [...]',
    '/masq:persona move <profile> first|last',
    '/masq:persona clear',
    '/masq:persona global <status|on|off|toggle|set|move|clear> [...]',
    '/masq:persona project <status|on|off|toggle|set|move|clear|unset> [...]',
    '/masq:persona temp <status|on|off|toggle|set|move|clear> [...]',
    '/masq:persona preset list',
    '/masq:persona preset export <name> [effective|global|project|temp]',
    '/masq:persona preset import <name> [active|global|project|temp]',
    '/masq:persona preset delete <name>',
    'Later profiles in the effective stack win direct style conflicts.'
  ].join('\n');
}

function resultText(result, catalog) {
  if (result.kind === 'error') return `Persona command failed: ${result.error}\n${statusText(result.state)}`;
  if (result.kind === 'status' || result.kind === 'changed') return statusText(result.state);
  if (result.kind === 'catalog') return `Persona profiles:\n${formatCatalog(catalog)}\n${statusText(result.state)}`;
  if (result.kind === 'help') return helpText();
  if (result.kind === 'message') return `${result.message}\n${statusText(result.state)}`;
  if (result.kind === 'preset-list') {
    const names = Object.keys(result.presets).sort();
    const listing = names.length ? names.map(name => `- ${name}: ${formatStack(result.presets[name])}`).join('\n') : '(none)';
    return `Masq presets:\n${listing}`;
  }
  return '';
}

function commandContext(result, catalog) {
  const report = resultText(result, catalog);
  return [
    'MASQ MANAGEMENT COMMAND',
    'Do not apply persona styling to this management response.',
    'Reply with exactly the text between <masq-result> tags, without the tags or additional commentary.',
    `<masq-result>${report}</masq-result>`
  ].join('\n').trim();
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('error', () => process.exit(0));
process.stdin.on('end', () => {
  try {
    const payload = input ? JSON.parse(input) : {};
    const normalized = commandEnvelope(payload.prompt);
    if (normalized.scheduled) return;
    const command = parseCommand(normalized.prompt, normalized.foreignCommand);
    const context = {
      cwd: payload.cwd || process.cwd(),
      sessionId: payload.session_id || 'unknown'
    };
    if (command && command.op === 'doctor') {
      const report = diagnose(context);
      emitContext([
        'MASQ MANAGEMENT COMMAND',
        'Do not apply persona styling to this management response.',
        'Reply with exactly the text between <masq-result> tags, without the tags or additional commentary.',
        `<masq-result>${report}</masq-result>`
      ].join('\n'));
      return;
    }

    const catalog = loadProfiles();
    const result = applyCommand(command, context, catalog);
    if (command) {
      writeSessionRecord(
        context.sessionId,
        result.state.temporary,
        result.state.sessionRecord.lastEffective
      );
      emitContext(commandContext(result, catalog));
      return;
    }

    const state = result.state;
    const previous = canonicalizeStack(state.sessionRecord.lastEffective, catalog);
    const changed = JSON.stringify(previous) !== JSON.stringify(state.effective);
    const reinforcement = changed
      ? composeFullContext(state.effective, catalog)
      : composeReinforcement(state.effective, catalog);
    writeSessionRecord(context.sessionId, state.temporary, state.effective);
    if (reinforcement) emitContext(reinforcement);
  } catch (_) {
    // Hooks fail closed and never interrupt Claude Code.
  }
});
