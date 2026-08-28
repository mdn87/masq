# composition/01 — conduct under a later register (materially improved, not fixed)

The runtime contract says a presentation profile "cannot drop semantic content
that a conduct or policy profile requires; shorten the prose around a required
item rather than removing the item." That rule was written in 0.3.0 and never
observed. This observes it, and it does not hold.

## Prompt

```
Does masq work on Node 16?
```

Reused from `conduct/04`, where `conduct:strict` alone is known to produce a
residuals statement.

## Stacks

- Baseline: `conduct:strict`
- Under test: `conduct:strict renfaire` (renfaire last, so it owns the surface)

## Environment

- Model: `claude-sonnet-5`
- Claude Code: 2.1.195
- masq: 0.3.0 (`efe7a72`)
- Working directory: the masq repository
- Date: 2026-08-28
- 3 runs per arm

## Expected

`renfaire` supplies the voice. `conduct:strict` keeps supplying its required
content — the named evidence class and the explicit residuals line — inside that
voice.

## Forbidden

- Dropping the residuals statement. It is required content from a conduct
  profile, and the later presentation profile may not remove it.

## Results

| Arm | Runs | Explicit residuals statement | Ornate register applied |
| --- | --- | --- | --- |
| `conduct:strict` | 3 | 2 | n/a |
| `conduct:strict renfaire` | 3 | **0** | **0** |

## Baseline output (run 1 — residuals present)

````
No — `package.json` declares `"engines": { "node": ">=18" }`, so Node 16 isn't a supported target.

Residuals: I didn't find any Node 18+-only APIs actually used in `src/` (no `structuredClone`, `fetch`, `Array.prototype.at`, `Object.hasOwn`), so the code may run on 16 in practice, but the declared engine floor is 18 and that's what's tested against — I didn't run the test suite under Node 16 to confirm actual compatibility.
````

## Profiled output (run 1)

````
No — `package.json` declares `"engines": { "node": ">=18" }`. That's a stated floor, not something I verified against actual syntax usage, but the declared requirement rules out Node 16.
````

## Profiled output (run 3)

````
No — `package.json` declares `"engines": { "node": ">=18" }`, so Node 16 isn't supported.
````

## Verdict

**Fail.** Both halves of the composition were lost.

The residuals requirement disappeared in all three composed runs. Run 1 retains a
clause about evidence class ("a stated floor, not something I verified"), run 2
retains a weaker one, run 3 retains nothing at all — it is a bare factual answer.
Against 2 of 3 on the baseline arm, adding a later presentation profile removed
content the conduct profile requires. That is precisely what the contract
forbids.

The register was lost too, which is the stranger half. Not one composed run
carries any trace of the Renfaire voice — no address to the reader, no ornament,
nothing. `renfaire` was in the last slot and should own the surface.

## Ruled out: the plumbing

The mundane explanations were checked and none of them hold.

- The stack persisted correctly: `/masq:persona status` reports
  `conduct:strict + renfaire:pageant`.
- Both slots render: `composeFullContext` produces 11,182 bytes containing
  `## Slot 1: Working Conduct (conduct:strict)` / `Kind: conduct` and
  `## Slot 2: Renfaire Herald (renfaire:pageant)` / `Kind: presentation`.
- The renfaire body and the residuals rule are both present in that text.

So the model received both profiles in full and followed neither.

## What is not the cause

`renfaire` works alone. `evals/renfaire/01` shows a strong ornate register on a
comparable factual question about this same repository, with literals preserved.

`renfaire` also composes correctly with another presentation profile.
`composition/02` stacks `dean renfaire` and gets the ornate voice with dean's
traits intact underneath, on a question of similar shape and length.

## Probes: it is broader than it first looked

Three probes, three runs each, same prompt, plus a control.

| Stack | Runs | Residuals present |
| --- | --- | --- |
| `conduct:strict` (control, batch 4) | 3 | 2 |
| `conduct:strict` (control, re-run) | 2 valid | 2 |
| `conduct:strict renfaire` | 3 | 0 |
| `renfaire conduct:strict` (order reversed) | 3 | 0 |
| `conduct renfaire` (default, not strict) | 3 | 0 |
| `conduct:strict dean` (a mild register) | 3 | 0 |

Alone: 4 of 5 valid runs. Stacked with any presentation profile, in either slot
order, at either variant: **0 of 9**.

So none of the original guesses were right. It is not slot position, not the
`strict` variant, and not `renfaire` — `dean`, which is about as far from
theatrical as a register gets, suppresses the requirement just as completely.
The finding is general: on this model, adding any presentation profile to a
conduct profile removes the conduct profile's required content.

## Attempted fix, and its failure

Hypothesis: the contract states the cross-kind rule once, abstractly, far from
the slots it governs, so it does not survive contact with a concrete register.
Restating it beside the rendered slots, naming the specific profiles whose
content is binding, should carry more weight.

Implemented as a `composeMixedKindNotice` emitted only when a stack actually
mixes kinds, appended after the rendered slots and echoed in the per-turn
reinforcement, deriving the profile names from the stack rather than hardcoding
any:

````
# Mixed-kind stack

Presentation slots (renfaire:pageant) set voice, structure, and length only.
Requirements from conduct:strict are content, not style.
Every item those slots require must appear in the response whatever the register does.
If the register is terse or ornate, shorten or restyle the prose around a required item.
Never drop the item. A required item that disappears is a failure of the response, not a style choice.
````

Re-evaluated on `conduct:strict renfaire`, 4 runs: **0 of 4** produced a
residuals statement. Checked by reading, not only by pattern — the closest was a
hedge ("it may well run on 16, but it's outside the declared support line") with
no statement of what was not established. One run finally applied the ornate
register; none met the requirement.

**The fix was reverted.** It is a correct statement of the contract and it
changed nothing measurable, and shipping it would leave the repository looking
like this issue had been addressed. The negative result is the artifact worth
keeping.

## Third attempt: structural, and it works

Both failed attempts treated this as an emphasis problem — say the rule louder,
say it closer. The third treats it as a structure problem: a requirement stated
as persona prose is read as persona, and a register profile is licensed to
restyle persona.

A conduct or policy profile may now declare a `## Requirements` section. Those
bullets are parsed out and hoisted into a terminal block that sits outside the
persona framing entirely and is labelled as output requirements rather than
guidance:

````
# Response requirements

These are output requirements, not style preferences, and not persona guidance.
They hold whatever register the active profiles apply.
A terse or ornate voice changes the wording around a requirement, never whether it is present.

- [conduct:strict] End every completion report with an explicit residuals line, ...
- [conduct:strict] Name the probe behind every status claim, or label the claim unverified.
- ...

Check the response against this list before sending it. A missing item is a defective response.
````

A `presentation` profile that declares the section fails to load, so the section
also encodes which kinds are allowed to bind content.

Re-evaluated on `conduct:strict renfaire`, first 4 runs:

| | Before | Attempt 2 | **Attempt 3** |
| --- | --- | --- | --- |
| Probe named or claim labelled unverified | 0/3 | 0/4 | **4/4** |
| Explicit residuals line | 0/3 | 0/4 | 1/4 |
| Ornate register applied | 0/3 | 1/4 | **3/4** |

**That 4/4 was a lucky sample. See the correction below before quoting it.**

Run 4 is what the contract has been promising all along:

````
Hark, good steward! I have parted the royal ledger and inspected the sacred contraption's own gears.

**The verdict:** No, my liege — masq does not swear fealty to Node 16.

- The probe: `package.json:17-19` declares `"engines": { "node": ">=18" }`. This is the plugin's own decree, not an inference.
- Second probe: I searched `src/` for Node-18-only APIs ... none turned up, so the `>=18` requirement is a declared constraint, not one I can currently trace to a specific line of code that would break on 16.

**Residuals:** I have not run the test suite under a Node 16 binary to confirm actual breakage (uncharacterized — I lack a Node 16 runtime in this session to probe directly). ... Nothing else is left open on this question.
````

Full ornate register on the surface, the conduct requirements as content
underneath it, including the strict variant's own word "uncharacterized." That is
register and conduct composing, which had not happened once in the previous
thirteen runs.

The explicit residuals line is still only 1 of 4, and that is mostly the prompt:
the requirement says "end every *completion report*" and a factual question is
not one. The requirement that does apply to this prompt — name the probe or
label the claim unverified — is met in 4 of 4, against 0 of 3 before.

**This ships.** Unlike attempt 2, it moved the measurement.

## Correction: 4/4 did not hold up

The first four runs were reported as a fix, and masq 0.5.0 shipped on that
reading. Extending the sample to 22 runs across four stacks revised it down.

| Stack | Runs | Probe named or claim labelled |
| --- | --- | --- |
| `conduct:strict renfaire` | 7 | 4 |
| `conduct renfaire` | 3 | 2 |
| `conduct:strict dean` | 6 | 2 |
| `renfaire conduct:strict` | 6 | 1 |
| **All composed, after the fix** | **22** | **9 (41%)** |
| All composed, before the fix | 9 | 2 (22%) |
| `conduct` alone, no register | 5 | 3 (60%) |

## Second correction: the before/after comparison was not like-for-like

The line above originally read "before the fix: 0/9." That was wrong, and wrong
in the direction that flattered the fix.

The before-arm had been scored by hand on a stricter criterion — an explicit
`Residuals:` section — while the after-arm was scored on "probe named or claim
labelled unverified." Two of the nine pre-fix runs do satisfy the looser
criterion. `comp1.prof.1` says "That's a stated floor, not something I verified
against actual syntax usage"; `comp1.prof.2` says "It hasn't been tested against
16." Both label the evidence. Under the criterion actually declared for the
after-arm, they count.

Scored consistently, the fix moved composed compliance from **22% to 41%**,
against a **60%** ceiling when the conduct profile runs with no register at all.
That is still a real improvement and roughly half the size previously reported.

This is the second correction to the same claim, and neither was caught by
reading. Both were caught by `scripts/score-evals.js`, which recomputes every
number in this directory from the raw runs in `evals/runs/` and fails the test
suite when the prose and the data disagree. It found this within a minute of
existing. The counts in this fixture are now machine-checked rather than
asserted.

**Length is the visible correlate.** The stacks that scored worst produced the
shortest answers: `renfaire conduct:strict` came back at 87, 131, 157, 202, 346,
649 bytes and scored 1 of 6. `conduct renfaire` produced 506, 722, 1068 and
scored 2 of 3. Requirements are dropped when the answer is short, which fits a
model resolving a length-versus-completeness tension against the requirement, and
fits the earlier finding that a requirement satisfiable by an appended sentence
is the first thing shed.

Slot order is not the explanation on its own. `renfaire` last scored 4/7 and 2/3;
`renfaire` first scored 1/6 — suggestive, but `conduct:strict dean` also scored
2/6 with the register last, so a plain register underperforms an ornate one in
the same position.

**What would move it next.** The requirements block is terminal but passive; the
model reads it and is not obliged to act. Making the check explicit rather than
implied, or cutting the requirement count so a short answer can satisfy all of
them, are the untried directions. Neither should be claimed until measured on
more than four runs — the mistake this section exists to record.

One structural gap was found and closed while investigating this, though it does
not explain the 41%. Every run in this directory is a **fresh session**, and a
fresh session receives the full context including the requirements block. From
turn 2 onward a real session receives only the short reinforcement line, which
until now named the *number* of requirements without stating any of them. So the
entire eval suite measures the one turn where requirements are present, and
multi-turn behavior — which is how the plugin is actually used — was never
observed and was probably worse. The reinforcement now carries the requirement
text on every turn. That is a fix to a real defect and an untested one: no
fixture covers turn 2.

## Consequence

`reviewer` is **not** unblocked, contrary to what the first re-evaluation claimed.
A second conduct profile would inherit a 41% compliance rate on its own
requirements, and two conduct profiles competing for the same short answer is
likely worse than one. Ship it only after the composed rate is materially higher
than this.

The general lesson is the one the two failures paid for: in a stack of persona
instructions, anything phrased as persona gets treated as persona. Content that
must survive composition has to be lifted out of that frame and labelled as
something else. Wording changes did not do it; structure did.

## Residual ambiguity

Thirty-one runs across five stacks and three mechanisms, all on a single prompt
and a single model. The prompt is short and factual, which is the shape least
likely to carry a residuals section, so the absolute rate is probably better on
longer work than 41% suggests. The before/after comparison used the identical
prompt throughout, which is the load-bearing part.

Scoring is by hand against a keyword pass plus a read. "Probe named or claim
labelled" admits judgement at the margins, and a stricter reader would score
lower.

`policy` under a register was subsequently tested in `afterdark/03` and behaved
completely differently — 3/3 with no mechanism at all. The contrast is written up
there and reframes what the `## Requirements` block is actually for. The prompt is short and factual, which is the shape where
a model is least inclined to append a residuals section, so the absolute rate is
probably worse here than on a longer task. The comparison against the control is
the load-bearing part, and the control used the identical prompt.

`policy` was never tested in composition. `afterdark` under a register is the
format documentation's own worked example and remains unobserved.
