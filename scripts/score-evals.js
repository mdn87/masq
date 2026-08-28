#!/usr/bin/env node
'use strict';

// Recompute the counts quoted in evals/ from per-run adjudicated labels.
//
// This replaces keyword scoring, which failed twice. The regexes disagreed with
// the prose citing them: a fixture argued comp1.prof.2 counted because it says
// "It hasn't been tested against 16", while the pattern missed that phrasing and
// reached the same total by counting a different run. A keyword is a proxy for a
// judgement, and when the two drift the number means nothing.
//
// So each run carries an explicit label and a one-line rationale in
// evals/labels.json. The label is still a judgement -- mine, and arguable -- but
// it is recorded per run, so disagreeing means pointing at a line rather than
// re-deriving a total.
//
// This script checks arithmetic, completeness, and significance. It does NOT
// check that a fixture's prose matches its numbers; nothing here reads Markdown.

const fs = require('fs');
const path = require('path');

const NL = String.fromCharCode(10);
const root = path.resolve(__dirname, '..');
const labels = JSON.parse(fs.readFileSync(path.join(root, 'evals', 'labels.json'), 'utf8'));
const runsDir = path.join(root, 'evals', 'runs');

// Wilson interval; the normal approximation is useless at n=3.
function wilson(hit, n) {
  if (!n) return [0, 0];
  const z = 1.959964;
  const p = hit / n;
  const d = 1 + (z * z) / n;
  const centre = p + (z * z) / (2 * n);
  const spread = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  return [Math.max(0, (centre - spread) / d), Math.min(1, (centre + spread) / d)];
}

function logFactorial(n) {
  let total = 0;
  for (let i = 2; i <= n; i += 1) total += Math.log(i);
  return total;
}

// Two-sided Fisher exact test on a 2x2 table.
function fisher(a, b, c, d) {
  const n = a + b + c + d;
  const logP = (w, x, y, z) =>
    logFactorial(w + x) + logFactorial(y + z) + logFactorial(w + y) + logFactorial(x + z) -
    logFactorial(w) - logFactorial(x) - logFactorial(y) - logFactorial(z) - logFactorial(n);
  const observed = logP(a, b, c, d);
  let total = 0;
  const rowOne = a + b;
  const colOne = a + c;
  for (let i = Math.max(0, colOne - (c + d)); i <= Math.min(rowOne, colOne); i += 1) {
    const p = logP(i, rowOne - i, colOne - i, n - rowOne - colOne + i);
    if (p <= observed + 1e-9) total += Math.exp(p);
  }
  return Math.min(1, total);
}

const groups = new Map();
const problems = [];
const labelled = new Set();
const validLabels = new Set(['yes', 'no', 'void', 'unclear']);

for (const [run, record] of Object.entries(labels.runs)) {
  labelled.add(run);
  if (!fs.existsSync(path.join(runsDir, `${run}.txt`))) {
    problems.push(`labelled run has no output file: ${run}`);
    continue;
  }
  if (!validLabels.has(record.label)) problems.push(`invalid label on ${run}: ${record.label}`);
  if (!record.rationale) problems.push(`label without a rationale: ${run}`);
  if (!groups.has(record.cohort)) groups.set(record.cohort, []);
  groups.get(record.cohort).push({ run, ...record });
}

const lines = [];
const rates = new Map();

for (const cohort of labels.cohorts) {
  const members = groups.get(cohort.id) || [];
  const counted = members.filter(m => m.label === 'yes' || m.label === 'no');
  const hit = counted.filter(m => m.label === 'yes').length;
  const [lo, hi] = wilson(hit, counted.length);
  rates.set(cohort.id, { hit, n: counted.length });
  const voids = members.filter(m => m.label === 'void').length;
  const unclear = members.filter(m => m.label === 'unclear').length;
  lines.push(
    cohort.id + NL +
    `    ${hit}/${counted.length}` +
    `   95% CI ${(lo * 100).toFixed(0)}-${(hi * 100).toFixed(0)}%` +
    (voids ? `   (${voids} void)` : '') +
    (unclear ? `   (${unclear} UNCLEAR -- criterion too blunt here)` : '') + NL +
    `    ${cohort.description}`
  );
  // A cohort can be entirely void by design -- the truncated runs are kept as a
  // record of what was discarded and why. Only an empty cohort is a problem.
  if (members.length === 0) problems.push(`cohort has no runs at all: ${cohort.id}`);
}

for (const comparison of labels.comparisons || []) {
  const a = rates.get(comparison.a);
  const b = rates.get(comparison.b);
  if (!a || !b) {
    problems.push(`comparison references an unknown cohort: ${comparison.a} / ${comparison.b}`);
    continue;
  }
  const p = fisher(a.hit, a.n - a.hit, b.hit, b.n - b.hit);
  lines.push(
    `${comparison.a}  vs  ${comparison.b}` + NL +
    `    ${a.hit}/${a.n} vs ${b.hit}/${b.n}   Fisher exact p = ${p.toFixed(3)}` +
    `   -> ${p < 0.05 ? 'significant at p<0.05' : 'NOT significant'}` + NL +
    `    ${comparison.note || ''}`
  );
}

const allRuns = fs.readdirSync(runsDir)
  .filter(f => f.endsWith('.txt'))
  .map(f => f.replace(/\.txt$/, ''));
const unlabelled = allRuns.filter(run => !labelled.has(run));

console.log(lines.join(NL + NL));
console.log('');
console.log(`${labelled.size} of ${allRuns.length} run files carry an adjudicated label.`);
console.log(`${unlabelled.length} are unlabelled; those are cited as quoted excerpts, never as counts.`);
console.log('Counts come from labels, not keyword matching. Nothing here reads fixture prose.');

if (problems.length) {
  console.log('');
  for (const problem of problems) console.log(`PROBLEM: ${problem}`);
  process.exit(1);
}
