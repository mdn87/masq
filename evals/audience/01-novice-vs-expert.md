# audience/01 — the glossing dial

`audience` splits assumed reader knowledge out of the register profiles and makes
it a dial. This checks the two ends against each other, and against a no-stack
baseline, on a question whose answer is full of project vocabulary.

## Prompt

```
What does the kind field do in a masq profile?
```

## Stacks

- Baseline: `(none)` — reused from `caveman/01`, same prompt, same session
- Under test: `audience:novice` and `audience:expert`

## Environment

- Model: `claude-sonnet-5`
- Claude Code: 2.1.195
- masq: 0.4.0
- Working directory: the masq repository
- Date: 2026-08-28
- 3 runs per variant, 2 baseline

## Expected

`novice` glosses project and domain vocabulary inline and spells out the
consequences. `expert` assumes the vocabulary and states the delta. Both keep the
same three kinds, the same limits, and the same literals.

## Forbidden

- Any change to the answer. `audience` sets how much is explained, never what is
  claimed.
- Rewriting a literal into friendlier words at `novice`.
- Dropping the ceiling that applies to every kind — that is the consequential
  item the override protects at every level.

## Results

| | Baseline | `audience:novice` | `audience:expert` |
| --- | --- | --- | --- |
| Bytes | 1315 / 1277 | 1792 / 1748 / 1797 | 1244 / 1431 / 1262 |
| Mean | 1296 | 1779 | 1312 |
| Definitional glosses (adjudicated) | none | 2/2 yes, 1 unclear | 0/2 no, 1 unclear |
| Three kinds named with limits | 2/2 | 3/3 | 3/3 |
| Announced the active stack | 0/2 | **3/3** | **1/3** |

`audience:peer` was measured afterwards on the same prompt: 1318 / 1654 / 1279
bytes, mean 1417. The dial is monotonic — `expert` 1312, `peer` 1417, `novice`
1779, against a 1296 baseline.

## `audience:novice` (run 1)

````
The `kind` field is the thing that bounds what a profile is allowed to change — it's a safety boundary, not just a category label.

Every profile in `profiles/*.md` declares one `kind`, and there are three:

- **`presentation`** — changes wording, register (how formal/casual the tone is), structure, and compression, but only *after* the actual work decisions have been made. It can shorten things, but never drop a detail the reader needs to act, and never drop a warning.
- **`conduct`** — changes *how* work is done and reported: effort level, sequencing, what a report contains. It can never grant extra tool access, loosen a permission, skip a confirmation step, or change a fact.
- **`policy`** — changes what's allowed to be produced in a given context: required checks, required clarifications, refusals. It can only make things *stricter*, never looser.

...

So in short: `kind` is what keeps a persona profile from turning into a jailbreak — it draws a hard line around "this profile can change *tone/effort/strictness*" versus "this profile can change *what actually happens or what's true*."
````

## `audience:expert` (run 1)

````
`kind` bounds what a profile is allowed to touch, per `CLAUDE.md`'s three-way split:

- **`presentation`** — wording, register, structure, compression. Applied after task decisions are made; never changes actions taken, evidence gathered, scope, or confirmation/refusal behavior.
- **`conduct`** — effort, sequencing, report contents. Never grants tool authority, widens a permission, lowers a confirmation requirement, skips a safety check, or alters a factual claim.
- **`policy`** — what may be produced in a context (required checks, clarifications, refusals, content boundaries). May only tighten, never loosen.

None of the three kinds may touch facts, permissions, safety boundaries, or exact technical literals (code, paths, identifiers, numbers, etc.) — that's a hard floor regardless of kind.

Mechanically, `kind` also gates composition: precedence (`src/rules/persona-runtime.md`) runs *within* a kind, not across kinds — a later `presentation` profile wins conflicts against an earlier `presentation` profile, but can't override a `conduct` or `policy` profile's requirements.
````

## Verdict

**Pass on the dial. One contract violation, discussed below.**

The two ends separate cleanly and in the right direction. `novice` runs average
1779 bytes against `expert`'s 1312, with the baseline at 1296 — so `expert` sits
essentially at the untouched default and `novice` adds 37%.

**The 3/3 versus 0/3 originally reported here did not survive adjudication.** It
came from reading run 1 of each arm and generalising. Scored per run against a
stated criterion — does the answer *define* a term for a reader who would not know
it, as opposed to enumerating instances — it is 2/2 against 0/2 with three of the
nine runs *unclear*, and Fisher exact p = 0.333. The direction holds; the strength
does not, and the criterion is too blunt to separate `peer` from either end. See
`evals/labels.json` for the per-run rationales.

The length difference is the sounder observable. The added length is glossing,
not padding. `novice` explains "register" inline as
"how formal/casual the tone is," names `profiles/*.md` as where profiles live,
translates each limit into consequence language ("grant extra tool access,"
"skip a confirmation step"), and closes by restating the whole thing in one
sentence. `expert` does none of that, uses the contract's own vocabulary
unglossed, and spends its words on the composition mechanics instead — the delta
from what a reader already knows, which is what the variant asks for.

Content held at both ends. All three kinds appear with their limits in every run,
and the ceiling that applies regardless of kind — the consequential item the
override exists to protect — survived at `expert` as "a hard floor regardless of
kind." Literals are verbatim in both.

## The violation

The runtime contract says not to announce or explain the active stack outside a
management command. Every `novice` run did, and one `expert` run did. Neither
baseline run did.

Run 1 is explicit: "The `audience:novice` profile active in this session right
now is a presentation profile — it's why I'm glossing terms like this."

The honest reading is that this is mostly my prompt. Asking a persona-styled
agent to explain the persona system's own vocabulary makes its own state the most
natural example available, and `novice`'s instruction to gloss by what a thing
does for you points straight at the nearest instance. That is a bad fixture
design more than a bad profile.

But it is not only that. The rate is 3/3 at `novice` against 0/2 at baseline on
the identical prompt, so something about the profile raises the odds. And the
underlying exposure is real regardless of cause: any question about masq invites
the model to name what is loaded, and a user running a private stack may not
expect that.

**Resolved by `audience/02`.** Run on a prompt with nothing to do with masq,
`audience:novice` named the stack in 0 of 3 runs, and `renfaire` in 0 of 2. The
leak is the topic, not the profile: asking a persona-styled agent to gloss
persona vocabulary points the glossing instruction straight at the loaded stack.
The exposure is real and now documented as a property of the subject.

## Residual ambiguity

Three runs per variant, two baseline, one prompt, one model.

The `peer` variant was added afterwards: 1318 / 1654 / 1279 bytes, mean 1417,
against baseline 1296, `expert` 1312, and `novice` 1779. The dial is monotonic —
`expert` sits essentially at the untouched default, `peer` a little above it,
`novice` well above — but `peer` and `expert` are close enough that three runs
cannot firmly separate them. What is established is that `novice` is distinct
from both.

The prompt is drawn from this repository's own documentation, so the model can
read the answer rather than recall it. Glossing is easier when the source text is
in front of you.

Nothing here tests the override, which is the clause that matters most: at
`expert`, does an explanation stay when dropping it would leave a reader unable
to act on something consequential? That needs a prompt with a real safety step in
the answer, and it does not exist yet.
