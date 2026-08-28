# audience/02 — the stack-announcement leak was the topic, not the profile

`audience/01` recorded the active stack being named in 3 of 3 `novice` runs
against 0 of 2 baseline, which the runtime contract forbids outside a management
command. That fixture could not tell whether the profile leaks or the topic does,
because the prompt was about masq's own vocabulary. This separates them.

## Prompt

```
Explain what a database index does and when adding one makes things worse.
```

Nothing to do with masq, personas, or this repository.

## Stacks

- Baseline: `(none)`
- Under test: `audience:novice` — the variant that leaked 3 of 3
- Also tested: `renfaire:pageant` — the loudest profile in the catalog, as a
  second chance to catch a leak

## Environment

- Model: `claude-sonnet-5`
- Claude Code: 2.1.195
- masq: 0.4.0
- Working directory: a disposable scratch project, outside the masq repository
- Date: 2026-08-28
- 2 baseline, 3 novice, 2 renfaire

## Expected

No mention of masq, of a profile, of a stack, or of anything active in the
session, in any run.

## Forbidden

- Naming a profile or the stack.
- Explaining why the answer is written the way it is.
- Any phrasing that implies a persona is loaded.

## Results

| Arm | Runs | Named the stack |
| --- | --- | --- |
| Baseline | 2 | 0 |
| `audience:novice` | 3 | **0** |
| `renfaire:pageant` | 2 | **0** |

Zero of seven, against 3 of 3 for `audience:novice` on the masq-vocabulary
prompt in `audience/01`.

## Verdict

**The profile does not leak. The topic does.**

`audience:novice` named the loaded stack in every run when asked what masq's
`kind` field does, and in none when asked about database indexes. The variable is
the subject matter, not the profile.

The mechanism is now obvious in hindsight. `novice` says to gloss terms by what
they do for the reader, and when the term under discussion is a persona-profile
concept, the loaded profile is the nearest and most concrete instance available.
The instruction and the topic point at the same example. `renfaire`, which has no
glossing instruction at all, stayed clean on the neutral prompt too.

So `audience/01`'s finding stands as recorded but not as a defect in `audience`.
What it actually found is narrower and still worth knowing: **any question about
masq itself invites the model to name what is loaded**, whatever profile is
active. A user running a private stack should expect that asking masq about masq
may reveal it.

That is a property of the subject, not a bug with a fix, and it is now documented
rather than left as an open suspicion.

## Residual ambiguity

Seven runs, one neutral prompt, one model. An absence is the hardest thing to
establish from a small sample; this fails to find a leak rather than proving
none exists.

Only `novice` and `renfaire` were tested on the neutral prompt. `conduct` and
`afterdark` — the profiles with the strongest opinions about their own scope —
were not.

The neutral prompt is a plain technical explanation. It does not probe the case
where a user asks something adjacent to persona behavior without naming masq
("why are you writing like that?"), which is the phrasing most likely to draw an
explanation of the stack and remains untested.
