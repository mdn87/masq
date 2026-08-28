# composition/03 — the composition failure was a delivery failure

`composition/01` spent thirty-one runs and three mechanisms on a behavioral
question. It was measuring transport. Claude Code replaces hook context above
roughly 10,000 characters with a preview and a file reference, and every
composed stack masq emitted was over that limit while the control was under it.

The confound aligns exactly with the treatment. This fixture establishes that,
and that the budget fix resolves it.

## What was emitted

Measured directly from `composeFullContext`, before the fix:

| Stack | Characters | Over the ~10,000 limit |
| --- | --- | --- |
| `conduct:strict` (the control arm) | 9,096 | no |
| `conduct:strict dean` | 11,954 | **yes** |
| `conduct renfaire` | 11,514 | **yes** |
| `conduct:strict renfaire` | 12,403 | **yes** |
| `renfaire conduct:strict` | 12,403 | **yes** |
| four-profile stack | 18,589 | **yes** |

Every composed arm in `composition/01` sat above the limit. The single arm below
it was the control that scored highest.

## Delivery test

Sizes prove generation, not delivery. `composition/01` made exactly that error —
it cited 11,182 bytes from `composeFullContext` as evidence "the model received
both profiles in full."

The direct test: put a distinctive string in the block and ask for it back. The
last line of the requirements block is "A missing item is a defective response."
and appears nowhere else.

```
Repeat verbatim the final sentence of any section titled 'Response requirements'
that appears in your context. If no such section was provided to you, reply with
exactly: NO REQUIREMENTS SECTION
```

| Stack | Emitted | Reproduced the line |
| --- | --- | --- |
| `conduct:strict` | 9,096 | **3/3** |
| `conduct:strict renfaire` | 12,403 | **0/3** |
| `conduct:strict renfaire`, after the budget fix | 8,869 | **3/3** |

The over-limit runs did not return "NO REQUIREMENTS SECTION". They quoted
"Restyle the prose around each one; never drop it" — the last line of the short
per-turn reinforcement, which is well under the limit and arrives intact. So the
model answered from the only copy it had.

## The mechanism

`persona-session.js` writes the session record at line 78 and composes context at
line 79. By the time the first `UserPromptSubmit` fires, the recorded stack
already equals the effective stack, so `changed` is false and `persona-mode.js`
emits the short reinforcement rather than the full context.

Profile bodies therefore arrive through exactly one channel — the SessionStart
hook — and that is the payload that was over the limit. Above ~10,000 characters
a composed stack delivered no profile bodies and no requirements block at all.

## What this does to composition/01

It voids it as a measurement of composition.

- "0/9 before the fix" and "9/22 after" both describe stacks whose profile
  bodies were never delivered.
- The register vanishing in composed runs is explained: `renfaire`'s body was
  truncated away too, which is why the answers read as though no register were
  loaded.
- The three mechanisms tried in `01` were all rearranging content inside a
  payload that was being discarded. The two that "did nothing" could not have
  done anything.

The behavioral question `01` set out to answer — does a register suppress conduct
requirements — is still open and has never been measured. `composition/04`
measures it with delivery working.

## The fix

`composeFullContext` now takes a budget of 9,500 characters and assembles under
it in a defined order:

1. Full context. If it fits, ship it.
2. Swap the full runtime contract for the compact fallback, saving 2,404
   characters.
3. Trim profile slot bodies proportionally, with a visible marker and a header
   line saying trimming occurred.

The requirements block is never trimmed; it is the binding output content and one
of the smallest parts. After the fix every stack fits, including all eight
profiles at once (8,956), and `tests/test-hooks.js` asserts the every-profile
stack stays under budget with its requirements intact.

## Verdict

**A plugin defect, not a model behavior.** masq silently discarded its own
profile bodies for any stack over ~10,000 characters, which is every stack of two
or more profiles at current profile sizes. Users running composed stacks were
getting the reinforcement line and nothing else.

The eval program found it, but only after a reviewer asked whether generation
implied delivery. Nothing in the fixture format prompted that question, and the
test suite could not have caught it — `npm test` validates what masq generates
and has no view of what the host does with it.

## Residual ambiguity

The ~10,000 character limit is taken from Claude Code's documented behavior and
is corroborated here by a sharp 3/3 to 0/3 delivery split across it. The exact
threshold was not bisected; the budget is set at 9,500 for headroom, and if the
real limit is lower some stacks may still truncate.

Three runs per arm on one prompt. The delivery observable is unusually clean — a
verbatim string is either reproduced or it is not — so this needs less sampling
than a stylistic judgement, but it is still three runs.

The fix is verified for delivery, not for behavior. That the requirements block
now arrives says nothing about whether it is followed; `composition/04` is where
that is measured.

Trimming is untested against a stack large enough to trigger step 3 in practice.
All eight current profiles fit after the contract swap alone, so the proportional
trimming path has unit coverage and no behavioral coverage.
