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

So this is specific to conduct-plus-register, not to `renfaire`, not to short
factual prompts, and not to composition in general.

## Hypotheses, untested

Composed context is 11,182 bytes here against 9,819 for `dean renfaire` — 14%
larger, which is a thin basis for a length explanation but is the one measured
difference.

More plausibly, `conduct:strict` installs a clinical, evidence-first working
posture, and an ornate register is in tension with it in a way two presentation
profiles are not. If the model resolves that tension by suppressing both rather
than layering them, the contract's cross-kind rule is asking for something the
composition does not naturally produce, and stating the rule once per session is
not enough to get it.

Neither hypothesis has been tested. Two obvious probes: reverse the order
(`renfaire conduct:strict`) to see whether slot position matters, and try
`conduct:default renfaire` to see whether the strict variant specifically is
what collides.

## Consequence

This blocks `reviewer`, the queued second conduct profile. Shipping a second
conduct profile while conduct content demonstrably does not survive composition
would be adding to a foundation that is known not to hold.

No fix is shipped with this fixture. Strengthening the per-turn reinforcement to
restate the cross-kind rule is the obvious first attempt, but shipping an
unverified fix is the exact failure this eval directory exists to prevent. The
fix and its re-evaluation belong in the same change.

## Residual ambiguity

Three runs per arm. 0 of 3 is consistent with a real rate up to roughly 60% at
this sample size, so "always fails" is not established — "fails often enough to
block dependent work" is.

Only one prompt, and one stack ordering. Both probes named above are unrun.
