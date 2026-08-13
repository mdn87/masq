'use strict';

const fs = require('fs');
const path = require('path');
const {
  canonicalizeStack,
  formatStack,
  renderProfile
} = require('./persona-profiles');

function readRuntimeContract() {
  const candidates = [];
  if (process.env.CLAUDE_PLUGIN_ROOT) {
    candidates.push(path.join(process.env.CLAUDE_PLUGIN_ROOT, 'src', 'rules', 'persona-runtime.md'));
  }
  candidates.push(path.join(__dirname, '..', 'rules', 'persona-runtime.md'));

  for (const candidate of candidates) {
    try {
      return fs.readFileSync(candidate, 'utf8').trim();
    } catch (_) {}
  }

  return [
    'Persona profiles are ordered style overlays.',
    'Later slots win direct style conflicts; earlier non-conflicting traits remain.',
    'Apply each profile only within its scope.',
    'Preserve code, commands, paths, URLs, identifiers, exact errors, citations, and numbers.',
    'Clarity, safety, factuality, and user instructions override persona styling.'
  ].join(' ');
}

function composeFullContext(stack, catalog) {
  const canonical = canonicalizeStack(stack, catalog);
  if (!canonical.length) return '';

  const rendered = canonical
    .map((entry, index) => renderProfile(entry, catalog, index + 1))
    .filter(Boolean)
    .join('\n\n---\n\n');

  return [
    'MASQ ACTIVE',
    `Ordered stack: ${formatStack(canonical)}`,
    '',
    readRuntimeContract(),
    '',
    '# Active Persona Slots',
    '',
    rendered
  ].join('\n').trim();
}

function composeReinforcement(stack, catalog) {
  const canonical = canonicalizeStack(stack, catalog);
  if (!canonical.length) return '';
  return [
    `MASQ ACTIVE. Ordered stack: ${formatStack(canonical)}.`,
    'Apply the already-loaded profile contracts in order; later slots win only direct style conflicts.',
    'Respect profile scopes. Preserve exact technical literals. Clarity, safety, factuality, and user instructions come first.'
  ].join(' ');
}

module.exports = {
  composeFullContext,
  composeReinforcement,
  readRuntimeContract
};
