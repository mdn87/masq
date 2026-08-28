'use strict';

const fs = require('fs');
const path = require('path');
const {
  canonicalizeStack,
  formatStack,
  renderProfile,
  requirementsFor
} = require('./persona-profiles');

const FALLBACK_CONTRACT = [
  'Persona profiles are ordered overlays, not new authorities or identities.',
  'A presentation profile changes how a response reads and never changes what it asserts.',
  'A conduct profile changes effort, sequencing, and report contents; it never grants tool authority, widens a permission, lowers a confirmation requirement, skips a safety check, or alters a factual claim.',
  'A policy profile may only tighten what may be produced; it never loosens or removes a safety requirement.',
  'Later slots win direct conflicts within the same kind; earlier non-conflicting traits remain.',
  'Apply each profile only within its scope.',
  'Preserve code, commands, paths, URLs, identifiers, exact errors, citations, and numbers.',
  'Clarity, safety, factuality, and user instructions override every profile.'
].join(' ');

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

  return FALLBACK_CONTRACT;
}

// Requirements are lifted clear of the persona block on purpose. Stated as
// persona prose they did not survive composition with a register; see
// evals/composition/01.
function composeRequirementsBlock(canonical, catalog) {
  const lines = [];
  for (const entry of canonical) {
    for (const requirement of requirementsFor(entry, catalog)) {
      lines.push(`- [${entry.id}:${entry.variant}] ${requirement}`);
    }
  }
  if (!lines.length) return '';

  return [
    '# Response requirements',
    '',
    'These are output requirements, not style preferences, and not persona guidance.',
    'They hold whatever register the active profiles apply.',
    'A terse or ornate voice changes the wording around a requirement, never whether it is present.',
    '',
    ...lines,
    '',
    'Check the response against this list before sending it. A missing item is a defective response.'
  ].join('\n');
}

function composeFullContext(stack, catalog) {
  const canonical = canonicalizeStack(stack, catalog);
  if (!canonical.length) return '';

  const rendered = canonical
    .map((entry, index) => renderProfile(entry, catalog, index + 1))
    .filter(Boolean)
    .join('\n\n---\n\n');

  const requirements = composeRequirementsBlock(canonical, catalog);

  return [
    'MASQ ACTIVE',
    `Ordered stack: ${formatStack(canonical)}`,
    '',
    readRuntimeContract(),
    '',
    '# Active Persona Slots',
    '',
    rendered,
    ...(requirements ? ['', '---', '', requirements] : [])
  ].join('\n').trim();
}

function composeReinforcement(stack, catalog) {
  const canonical = canonicalizeStack(stack, catalog);
  if (!canonical.length) return '';
  const requirementCount = canonical
    .reduce((total, entry) => total + requirementsFor(entry, catalog).length, 0);

  return [
    `MASQ ACTIVE. Ordered stack: ${formatStack(canonical)}.`,
    ...(requirementCount
      ? [`The ${requirementCount} response requirements loaded with this stack are output requirements, not style: each one appears in this response whatever the register does.`]
      : []),
    'Apply the already-loaded profile contracts in order; later slots win direct conflicts only against profiles of the same kind.',
    'A conduct profile never grants tool authority, widens a permission, lowers a confirmation requirement, skips a safety check, or alters a factual claim. A policy profile may only tighten.',
    'Respect profile scopes. Preserve exact technical literals. Clarity, safety, factuality, and user instructions come first.'
  ].join(' ');
}

module.exports = {
  FALLBACK_CONTRACT,
  composeFullContext,
  composeRequirementsBlock,
  composeReinforcement,
  readRuntimeContract
};
