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

// Claude Code replaces hook context above ~10k characters with a preview and a
// file reference, so anything past this is not delivered at all. Emitting more
// is strictly worse than emitting less: see evals/composition/03.
const MAX_CONTEXT_CHARS = 9500;

function assemble(header, contract, slots, requirements) {
  return [
    ...header,
    '',
    contract,
    '',
    '# Active Persona Slots',
    '',
    slots.join('\n\n---\n\n'),
    ...(requirements ? ['', '---', '', requirements] : [])
  ].join('\n').trim();
}

function trimSlot(text, budget) {
  if (text.length <= budget) return text;
  const marker = '\n\n[trimmed to fit the hook context limit; the full profile is in profiles/]';
  const room = Math.max(0, budget - marker.length);
  const cut = text.slice(0, room);
  const lastBreak = cut.lastIndexOf('\n');
  return (lastBreak > room * 0.5 ? cut.slice(0, lastBreak) : cut).trimEnd() + marker;
}

function composeFullContext(stack, catalog, maxChars = MAX_CONTEXT_CHARS) {
  const canonical = canonicalizeStack(stack, catalog);
  if (!canonical.length) return '';

  const slots = canonical
    .map((entry, index) => renderProfile(entry, catalog, index + 1))
    .filter(Boolean);
  const requirements = composeRequirementsBlock(canonical, catalog);
  const header = ['MASQ ACTIVE', `Ordered stack: ${formatStack(canonical)}`];

  let out = assemble(header, readRuntimeContract(), slots, requirements);
  if (out.length <= maxChars) return out;

  // 1. Drop the full contract for the compact statement of the same rules.
  out = assemble(header, FALLBACK_CONTRACT, slots, requirements);
  if (out.length <= maxChars) return out;

  // 2. Trim slot bodies proportionally. Requirements are never trimmed.
  const overhead = assemble(header, FALLBACK_CONTRACT, slots.map(() => ''), requirements).length;
  const slotBudget = Math.max(200, Math.floor((maxChars - overhead) / slots.length));
  const trimmed = slots.map(slot => trimSlot(slot, slotBudget));
  return assemble(
    [...header, 'Some profile text was trimmed to fit the context limit; the rules above still apply in full.'],
    FALLBACK_CONTRACT,
    trimmed,
    requirements
  ).slice(0, maxChars);
}

function composeReinforcement(stack, catalog) {
  const canonical = canonicalizeStack(stack, catalog);
  if (!canonical.length) return '';
  // Turn 2 onward only gets this line, so it has to carry the requirement text
  // rather than a count. Naming how many there are without saying what they are
  // is not a reminder of anything.
  const requirements = [];
  for (const entry of canonical) {
    for (const requirement of requirementsFor(entry, catalog)) {
      requirements.push(`(${entry.id}:${entry.variant}) ${requirement}`);
    }
  }

  return [
    `MASQ ACTIVE. Ordered stack: ${formatStack(canonical)}.`,
    ...(requirements.length
      ? [
        'Response requirements, which are output requirements rather than style and hold whatever the register does:',
        requirements.map(item => `${item}`).join(' '),
        'Restyle the prose around each one; never drop it.'
      ]
      : []),
    'Apply the already-loaded profile contracts in order; later slots win direct conflicts only against profiles of the same kind.',
    'A conduct profile never grants tool authority, widens a permission, lowers a confirmation requirement, skips a safety check, or alters a factual claim. A policy profile may only tighten.',
    'Respect profile scopes. Preserve exact technical literals. Clarity, safety, factuality, and user instructions come first.'
  ].join(' ');
}

module.exports = {
  FALLBACK_CONTRACT,
  MAX_CONTEXT_CHARS,
  composeFullContext,
  composeRequirementsBlock,
  composeReinforcement,
  readRuntimeContract
};
