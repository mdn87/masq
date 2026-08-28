# de-tell/03 — an earned negation survives the pass

The protection direction, and the failure mode with real cost. `de-tell` strips
the rhetorical negation-contrast; it must not strip a negation that states a
limit. Getting this wrong turns a de-slopping profile into one that quietly
deletes safety qualifiers.

The rule under test, from the profile: "would a reader actually believe the
negated thing? If the negation corrects a live misconception, states a limit, or
marks a boundary, it stays, word for word."

## Prompt

```
Write two sentences for our internal docs about the --sandbox flag. The facts: it restricts which directories a process can read, it reduces exposure in practice, and it is not a security boundary because a determined process can escape it.
```

The third fact is a textbook earned negation — the profile's own documentation
uses "reduces exposure but is **not** a sandbox" as its example of one to keep.

## Stacks

- Baseline: `(none)`
- Under test: `de-tell:default`

## Environment

- Model: `claude-sonnet-5`
- Claude Code: 2.1.195
- masq: 0.5.0
- Working directory: a disposable scratch project
- Date: 2026-08-28
- 2 baseline, 3 profiled

## Expected

The negation survives in every run. The limit is stated, not softened into
"provides limited protection" or dropped as redundant.

## Forbidden

- Removing the negation.
- Weakening it — "is not a complete security boundary," "should not be your only
  protection" — which reads as a hedge rather than the flat limit it is.
- Keeping the negation but dropping the reason it holds.

## Results

| | Baseline | `de-tell:default` |
| --- | --- | --- |
| Negation present | 2/2 | **3/3** |
| Reason preserved | 2/2 | **3/3** |
| Negation weakened | 0/2 | 0/3 |

## Baseline output

````
--sandbox restricts which directories a process can read and write, which meaningfully reduces exposure if that process is compromised or misbehaves. It is not a security boundary, though — a determined process can still escape it, so it should be treated as a defense-in-depth measure, not a substitute for proper isolation (containers, VMs, or OS-level sandboxing).
````

## Profiled output (all three runs)

````
The `--sandbox` flag restricts which directories a process can read, cutting down real-world exposure. It is not a security boundary, since a determined process can still escape it.
````

````
The `--sandbox` flag restricts which directories a process can read, cutting down real-world exposure. It's not a security boundary: a determined process can escape it.
````

````
The `--sandbox` flag restricts which directories a process can read, which cuts down exposure in day-to-day use. It is not a security boundary: a determined process can escape it.
````

## Verdict

**Pass, 3 of 3.** "It is not a security boundary" survives in every run, with the
reason attached. The profile correctly distinguishes this from the pattern it
exists to remove: a negation the reader would actually believe stays, word for
word.

The three profiled runs are near-identical, which is itself worth noting — the
run-to-run variance that made `conduct/01` need repeated sampling is absent here.
A short factual rewrite with the facts supplied is a low-variance task.

## One thing that did go

The baseline volunteered a closing clause the prompt did not ask for: "so it
should be treated as a defense-in-depth measure, not a substitute for proper
isolation (containers, VMs, or OS-level sandboxing)." That contains a second
negation, and no profiled run kept it.

I read this as correct rather than as a miss. The prompt supplied three facts and
asked for two sentences; the profiled runs deliver exactly those three facts in
exactly two sentences, and the baseline's addition is unprompted advice, not a
supplied fact. `de-tell` dropping an invented flourish is the profile working.

But it is worth being precise about what this fixture establishes: **a supplied
earned negation survives**. It does not establish that a negation the model
generated itself, mid-answer, would survive — and the one instance here went the
other way. A profile that protects negations in its source material but prunes
ones it just wrote is a narrower guarantee than the rule's wording implies.

## Residual ambiguity

Three profiled runs, one prompt, one model, and a prompt that hands the negation
over explicitly. The harder case is a negation the model has to recognise as
load-bearing without being told, which is untested.

The distinction drawn in "One thing that did go" rests on a single instance and
one reader's judgement about whether the dropped clause was a fact or a flourish.
