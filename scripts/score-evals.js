#!/usr/bin/env node
'use strict';

// Recompute the counts claimed in evals/ from the raw runs in evals/runs/.
//
// The fixtures were scored by hand. That is one reader applying a criterion
// they also wrote, which is exactly the loop that produced the one overclaim in
// this directory (a 4/4 sample reported as a fix, later 9/22). This script does
// not make the criteria correct -- a bad pattern scored mechanically is still a
// bad pattern -- but it makes them explicit and reproducible, so a reviewer can
// argue with the criterion instead of re-reading 150 files.

const fs = require('fs');
const path = require('path');

const NL = String.fromCharCode(10);
const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'evals', 'scoring.json'), 'utf8'));
const runsDir = path.join(root, 'evals', 'runs');

let mismatches = 0;
let missing = 0;
const lines = [];

for (const claim of config.claims) {
  const criterion = config.criteria[claim.criterion];
  if (!criterion) {
    console.error(`unknown criterion: ${claim.criterion}`);
    process.exit(1);
  }
  const re = new RegExp(criterion.pattern, criterion.flags || '');

  let hit = 0;
  let counted = 0;
  const absent = [];

  for (const name of claim.runs) {
    const file = path.join(runsDir, `${name}.txt`);
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch (_) {
      absent.push(name);
      continue;
    }
    // A void run (harness fault, empty output) is not evidence either way.
    if (text.trim().length < 3) {
      absent.push(`${name} (empty)`);
      continue;
    }
    counted += 1;
    if (re.test(text)) hit += 1;
  }

  const actual = `${hit}/${counted}`;
  const agrees = actual === claim.expect;
  if (!agrees) mismatches += 1;
  if (absent.length) missing += absent.length;

  lines.push(
    `${agrees ? 'ok  ' : 'DIFF'} ${claim.id}` +
    `${NL}       criterion=${claim.criterion} claimed=${claim.expect} computed=${actual}` +
    (absent.length ? `${NL}       not counted: ${absent.join(', ')}` : '')
  );
}

console.log(lines.join(NL));
console.log('');
console.log(`${config.claims.length} claims checked, ${mismatches} disagree with the fixture text.`);
if (missing) console.log(`${missing} run files were missing or empty and were excluded.`);

if (mismatches) {
  console.log('');
  console.log('A DIFF means the fixture prose and the raw runs disagree. Fix whichever is wrong.');
  process.exit(1);
}
