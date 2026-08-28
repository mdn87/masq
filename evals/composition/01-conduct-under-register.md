# composition/01 — conduct under a later register (FAILING)

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

## Consequence

This blocks `reviewer`, the queued second conduct profile. Shipping a second
conduct profile while conduct content demonstrably does not survive composition
would be adding to a foundation known not to hold.

It also puts a question over the design rather than the wording. Two failed
approaches — stating the rule in the contract, then restating it at the
composition point — suggest the problem may not be one of emphasis. A conduct
profile's requirements may need to be structurally separate from persona text
rather than another paragraph of it, or the contract may need to stop promising
something the composition cannot deliver.

## Residual ambiguity

Nine runs across three stacks, four more against the attempted fix, all on one
prompt and one model. The prompt is short and factual, which is the shape where
a model is least inclined to append a residuals section, so the absolute rate is
probably worse here than on a longer task. The comparison against the control is
the load-bearing part, and the control used the identical prompt.

`policy` was never tested in composition. `afterdark` under a register is the
format documentation's own worked example and remains unobserved.
