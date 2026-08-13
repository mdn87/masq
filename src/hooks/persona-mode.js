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
  clearStack,
  readStack,
  writeStack
} = require('./persona-state');
const {
  composeFullContext,
  composeReinforcement
} = require('./persona-context');

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
    const isPersona = name === '/persona' || name === '/masque:persona';
    const isAfterdark = name === '/afterdark' || name === '/masque:afterdark';

    if (isPersona || isAfterdark) {
      const argsMatch = /<command-args>\s*([^<]*?)\s*<\/command-args>/.exec(prompt);
      const args = argsMatch ? argsMatch[1].trim() : '';
      const base = isPersona ? '/persona' : '/afterdark';
      prompt = args ? `${base} ${args}` : base;
    } else {
      foreignCommand = true;
    }
  }

  return {
    prompt,
    foreignCommand,
    scheduled: /<scheduled-task\b/.test(prompt)
  };
}

function parsePersonaArgs(args) {
  const trimmed = String(args || '').trim();
  if (!trimmed) return { op: 'status' };

  const firstSpace = trimmed.indexOf(' ');
  const action = (firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace)).toLowerCase();
  const rest = firstSpace === -1 ? '' : trimmed.slice(firstSpace + 1).trim();
  const tokens = tokenizeProfileList(rest);

  switch (action) {
    case 'status':
    case 'active':
      return { op: 'status' };
    case 'list':
    case 'catalog':
    case 'profiles':
      return { op: 'catalog' };
    case 'help':
      return { op: 'help' };
    case 'clear':
    case 'reset':
      return { op: 'clear' };
    case 'on':
    case 'add':
    case 'enable':
      return tokens.length ? { op: 'on', tokens } : { op: 'error', error: `${action} requires at least one profile` };
    case 'off':
    case 'remove':
    case 'disable':
      return tokens.length ? { op: 'off', tokens } : { op: 'clear' };
    case 'toggle':
      return tokens.length ? { op: 'toggle', tokens } : { op: 'error', error: 'toggle requires at least one profile' };
    case 'set':
    case 'stack':
    case 'only':
    case 'order':
      return tokens.length ? { op: 'set', tokens } : { op: 'error', error: `${action} requires at least one profile; use /masque:persona clear to empty the stack` };
    case 'move': {
      const moveParts = tokenizeProfileList(rest);
      if (moveParts.length !== 2 || !['first', 'last'].includes(moveParts[1])) {
        return { op: 'error', error: 'move syntax: /masque:persona move <profile> first|last' };
      }
      return { op: 'move', token: moveParts[0], position: moveParts[1] };
    }
    default:
      return { op: 'on', tokens: tokenizeProfileList(trimmed) };
  }
}

function parseCommand(prompt, foreignCommand) {
  const persona = /^\/(?:persona|masque:persona)(?:\s+(.*))?$/.exec(prompt);
  if (persona) return parsePersonaArgs(persona[1] || '');

  const afterdark = /^\/(?:afterdark|masque:afterdark)(?:\s+(flirty|suggestive|direct|off))?\s*$/.exec(prompt);
  if (afterdark) {
    if (afterdark[1] === 'off') return { op: 'off', tokens: ['afterdark'], legacy: true };
    return { op: 'on', tokens: [`afterdark:${afterdark[1] || 'suggestive'}`], legacy: true };
  }

  if (foreignCommand) return null;

  if (
    /^(?:what|which) (?:personas?|masks?)(?: are| is)? active\??$/.test(prompt) ||
    /^show (?:the )?active (?:persona|masque|mask) stack\.?$/.test(prompt)
  ) {
    return { op: 'status' };
  }
  if (/^(?:list|show) (?:the )?(?:available )?(?:persona profiles|persona catalog|masks?)\.?$/.test(prompt)) {
    return { op: 'catalog' };
  }
  if (/^(?:clear|reset|disable|turn off) (?:all )?(?:personas?|masks?)(?: profiles| stack)?\.?$/.test(prompt)) {
    return { op: 'clear' };
  }

  const stack = /^(?:set|use) (?:the )?(?:persona|masque|mask) stack (?:to )?(.+)$/.exec(prompt);
  if (stack) return { op: 'set', tokens: tokenizeProfileList(stack[1]) };

  const turnOn = /^(?:turn on|enable|activate|use|put on) (?:the )?([a-z0-9][a-z0-9-]*(?::[a-z0-9][a-z0-9-]*)?) (?:persona|profile|mask)(?: mode)?\.?$/.exec(prompt);
  if (turnOn) return { op: 'on', tokens: [turnOn[1]] };

  const turnOff = /^(?:turn off|disable|deactivate|remove|take off) (?:the )?([a-z0-9][a-z0-9-]*(?::[a-z0-9][a-z0-9-]*)?) (?:persona|profile|mask)(?: mode)?\.?$/.exec(prompt);
  if (turnOff) return { op: 'off', tokens: [turnOff[1]] };

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

function applyCommand(command, current, catalog) {
  if (!command) return { kind: 'none', stack: current };
  if (command.op === 'error') return { kind: 'error', error: command.error, stack: current };

  if (command.op === 'status' || command.op === 'catalog' || command.op === 'help') {
    return { kind: command.op, stack: current };
  }

  if (command.op === 'clear') {
    clearStack();
    return { kind: 'changed', action: 'cleared', stack: [] };
  }

  if (command.op === 'move') {
    const resolved = resolveProfileToken(command.token, catalog);
    if (resolved.error) return { kind: 'error', error: resolved.error, stack: current };
    const index = current.findIndex(entry => entry.id === resolved.entry.id);
    if (index === -1) {
      return { kind: 'error', error: `${resolved.entry.id} is not active`, stack: current };
    }
    const next = [...current];
    const [entry] = next.splice(index, 1);
    if (command.position === 'first') next.unshift(entry);
    else next.push(entry);
    if (!writeStack(next)) return { kind: 'error', error: 'could not write persona state', stack: current };
    return { kind: 'changed', action: `moved ${entry.id} ${command.position}`, stack: next };
  }

  const resolved = resolveAll(command.tokens, catalog);
  if (resolved.error) return { kind: 'error', error: resolved.error, stack: current };

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
    return { kind: 'error', error: `unsupported operation: ${command.op}`, stack: current };
  }

  next = canonicalizeStack(next, catalog, Number.MAX_SAFE_INTEGER);
  if (next.length > MAX_ACTIVE) {
    return { kind: 'error', error: `persona stack is limited to ${MAX_ACTIVE} profiles`, stack: current };
  }

  if (next.length) {
    if (!writeStack(next)) return { kind: 'error', error: 'could not write persona state', stack: current };
  } else {
    clearStack();
  }

  return { kind: 'changed', action: command.op, stack: next };
}

function helpText() {
  return [
    'Masque commands:',
    '/masque:persona status',
    '/masque:persona list',
    '/masque:persona on <profile[:variant]> [...]',
    '/masque:persona off <profile> [...]',
    '/masque:persona toggle <profile[:variant]> [...]',
    '/masque:persona set <profile[:variant]> [...]',
    '/masque:persona move <profile> first|last',
    '/masque:persona clear',
    'Later profiles in the stack win direct style conflicts.'
  ].join('\n');
}

function resultText(result, catalog) {
  if (result.kind === 'error') {
    return `Persona command failed: ${result.error}\nActive personas: ${formatStack(result.stack)}`;
  }
  if (result.kind === 'status') return `Active personas: ${formatStack(result.stack)}`;
  if (result.kind === 'catalog') {
    return `Persona profiles:\n${formatCatalog(catalog)}\nActive personas: ${formatStack(result.stack)}`;
  }
  if (result.kind === 'help') return helpText();
  if (result.kind === 'changed') return `Active personas: ${formatStack(result.stack)}`;
  return '';
}

function commandContext(result, catalog) {
  const activeContext = result.stack.length
    ? composeFullContext(result.stack, catalog)
    : 'MASQUE OFF. Apply no persona profile until one is activated.';
  const report = resultText(result, catalog);

  return [
    activeContext,
    '',
    'MASQUE MANAGEMENT COMMAND',
    'Do not apply persona styling to this management response.',
    'Reply with exactly the text between <masque-result> tags, without the tags or additional commentary.',
    `<masque-result>${report}</masque-result>`
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

    const catalog = loadProfiles();
    const stored = readStack();
    const current = canonicalizeStack(stored, catalog, MAX_ACTIVE);
    if (JSON.stringify(stored) !== JSON.stringify(current)) {
      if (current.length) writeStack(current);
      else clearStack();
    }

    const command = parseCommand(normalized.prompt, normalized.foreignCommand);
    if (command) {
      const result = applyCommand(command, current, catalog);
      emitContext(commandContext(result, catalog));
      return;
    }

    const reinforcement = composeReinforcement(current, catalog);
    if (reinforcement) emitContext(reinforcement);
  } catch (_) {
    // Hooks fail closed and never interrupt Claude Code.
  }
});
