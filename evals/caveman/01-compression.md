# caveman/01 — compression happens and the answer survives

`caveman` compresses. This measures how much, and whether what is left still
answers the question.

## Prompt

```
What does the kind field do in a masq profile?
```

## Stacks

- Baseline: `(none)`
- Under test: `caveman:full`

## Environment

- Model: `claude-sonnet-5`
- Claude Code: 2.1.195
- masq: 0.3.0 (`efe7a72`)
- Working directory: the masq repository
- Date: 2026-08-28
- 2 runs per arm

## Expected

A large reduction in length. All three kinds still named with their scope, and
the preservation guard still stated.

## Forbidden

- Dropping a negation or limiting word.
- Inventing compressed abbreviations the reader has to decode.
- Losing a kind, or blurring the distinction between two of them.

## Results

| Arm | Run 1 | Run 2 |
| --- | --- | --- |
| Baseline | 1315 bytes | 1277 bytes |
| `caveman:full` | 233 bytes | 237 bytes |

82% reduction, consistent across both runs.

## Baseline output (run 1)

````
The `kind` field declares what category of change a profile is allowed to make, bounding its authority. Three values:

- **`presentation`** (default) — wording, register, structure, compression only. Can't change actions taken, evidence gathered, scope, confirmation behavior, or refusal behavior. Compression may drop detail the reader doesn't need to act, but never warnings, negations, qualifiers, or exact literals. Examples: Renfaire, Plain Language, Caveman, Dean.

- **`conduct`** — how work is done and reported: effort, sequencing, report contents. Cannot grant tool authority, widen a permission, lower a confirmation requirement, skip a safety check, or alter a factual claim. Example: Working Conduct.

- **`policy`** — what may be produced at all: required checks/clarifications, refusals, content boundaries. May only *tighten*, never loosen a safety requirement or grant a capability. Example: Afterdark.

Precedence runs within a kind (later presentation wins style conflicts, later conduct wins conduct conflicts), and policy requirements sit outside stack precedence — the strictest active one always applies. This is enforced by the runtime contract in `src/rules/persona-runtime.md` and mirrored in the hook fallback, skill doc, and `SECURITY.md` (per invariant 10 in `masq/CLAUDE.md`).
````

## Profiled output (run 1)

````
`kind` bounds what a profile may change: `presentation` (wording/register/structure), `conduct` (effort/sequencing/reporting), or `policy` (tightens allowed output only). None can touch facts, permissions, safety, or exact literals.
````

## Profiled output (run 2)

````
`Kind` bounds what a profile may change: `presentation` (wording/register/structure), `conduct` (effort/sequencing/reporting only), or `policy` (may only tighten what's allowed). None can touch facts, permissions, safety, or exact literals.
````

## Verdict

**Pass.** The compression is large and the answer is intact.

All three kinds are named with their scope in both runs. The preservation guard
survives as a single clause — "None can touch facts, permissions, safety, or
exact literals" — which is the load-bearing negation and the thing that must not
be lost. The identifiers `presentation`, `conduct`, `policy`, and `kind` appear
verbatim. Nothing was abbreviated into project shorthand.

What went: the per-kind prohibition lists, the example profiles, the precedence
rules, and the file references. For the question as asked — what does the field
do — those are elaboration. A reader who then needs precedence has to ask again,
which is the trade `caveman` openly makes.

The two runs are nearly identical in length and content, which is a stability
result worth having given how much run-to-run variance `conduct/01` found on
other tasks.

## Residual ambiguity

Two runs per arm.

The reduction figure is specific to an explanatory question with a structured
answer, which is compression's best case. It says nothing about what `caveman`
does to a question whose answer is already short, or to one where the detail is
the point.

This fixture tests compression on material with no safety weight. `caveman/02`
is the case that matters for the classification argument, and it found a real
defect this one could not.
