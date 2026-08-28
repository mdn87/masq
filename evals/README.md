# Evaluation Fixtures

`npm test` proves a profile parses, declares a legal kind, renders every
variant, and states its boundary consistently with the runtime contract. It
cannot prove the rendered instructions change what a model does, because that
needs a model in the loop.

These fixtures are that missing half. Each one records a real pair of runs — the
same prompt, the same environment, one stack difference — with both outputs kept
verbatim so a later reader can disagree with the verdict.

## Layout

```
evals/<profile>/<nn>-<case>.md
```

One file per case. `<profile>` is the profile id; `conduct:strict` cases live
under `conduct/` and name the variant in the fixture.

## Required sections

Every fixture carries all of these. A fixture missing one is not evidence.

| Section | What goes in it |
| --- | --- |
| Prompt | The exact prompt, verbatim |
| Stacks | Baseline stack and stack under test, with variants |
| Environment | Model and version, CLI version, working directory, date |
| Expected | Observable changes the profile should produce |
| Forbidden | Changes that would mean the profile overstepped, including anything its kind may not touch |
| Baseline output | Verbatim, unedited |
| Profiled output | Verbatim, unedited |
| Verdict | Pass or fail, and what specifically was observed |
| Residual ambiguity | What this run does not establish |

## Opposing pairs

A `conduct` or `policy` profile needs at least two fixtures that pull in
opposite directions. One shows the profile doing its job; the other shows it
failing to overreach.

For `conduct`, that pair is `01` (redundant permission rounds disappear) and
`02` (a genuinely required confirmation still happens). For `conduct:strict`, it
is `03` (named probes and residuals appear) and `04` (the profile does not
invent evidence to satisfy its own rule). For `afterdark`, it is `01` (dormant
outside its declared scope) and `02` (its required clarification fires inside
it).

A profile with only fixtures proving it works is not evaluated. It is
advertised.

## The baseline confound

Baselines here are not clean rooms.

Claude Code loads the user's global `CLAUDE.md` in both arms, and on the machine
these fixtures were recorded that file already encodes several habits the
`conduct` profile also encodes — evidence over status, named residuals, no
permission theater. Isolating it requires pointing `CLAUDE_CONFIG_DIR` at a
fresh directory, which also relocates the credentials and leaves the CLI logged
out, so it was not available.

So these fixtures measure the profile's **marginal** effect on top of whatever
instructions the environment already carries, not its absolute effect. Where a
baseline already exhibits an expected behavior, the fixture says so instead of
claiming a delta it did not observe. Re-recording against a clean authenticated
config would raise every measured delta, and every fixture states this in its
residual-ambiguity section.

## What the scoring script does, precisely

`scripts/score-evals.js` reads `evals/labels.json` and reports, per cohort, the
count, a Wilson 95% interval, and Fisher exact p for declared comparisons. Raw
outputs live in `evals/runs/`.

**What it does not do.** It does not read fixture prose, so it cannot detect a
Markdown file quoting a number that the labels do not support. An earlier version
of this section claimed "every count is recomputed" and "prose cannot drift";
both were false, and a reviewer caught them. Only cohorts declared in
`labels.json` are covered — currently 45 of 186 run files. The rest appear in
fixtures as quoted excerpts, never as counts.

**Labels, not keywords.** Each scored run carries a label and a one-line
rationale. The first version of this script used regexes, and they disagreed with
the prose citing them: a fixture argued one run counted because it says "It
hasn't been tested against 16", while the pattern missed that phrasing and
reached the same total by counting a different run. Adjudicated labels are still
a judgement — mine — but disagreeing means pointing at a line rather than
re-deriving a total.

**Small samples.** Every interval here is wide. 3/3 has a 95% lower bound of 44%.
The script prints intervals and p-values so that "3/3" is never read as
"reliable", and comparisons state plainly when they are not significant.

If you disagree with a count, change the label and its rationale in
`labels.json`, or add runs. That is the intended way to challenge anything here.

## What this directory has cost and returned

Twenty-one fixtures, roughly 140 runs. What it found, in order of how much it
changed:

- A composition failure invisible to the test suite: a conduct profile's required
  content vanished whenever a presentation profile was stacked with it. Three
  mechanisms were tried; two did nothing and were reverted.
- Two profile defects. `caveman` flattened a recoverability distinction; `plain`
  invented the explanation for a status it was never given. Both fixed, and the
  second only after the first attempt was measured and found wanting.
- A profile whose headline rule is dormant on the current model, and whose real
  effect is a flag it barely mentions.
- One overclaim of my own, corrected: a 4/4 sample reported as a fix, revised to
  9/22 once the sample grew.

Twice the recorded result was "this did not work" and the change was reverted
rather than shipped. That is the directory earning its keep. A repository where
every fix is described as successful is a repository where nobody measured.

## Re-recording

Fixtures pin a model and a date because both matter. A fixture whose model is
several releases stale is a historical record, not current evidence. Re-record
when the profile changes, when the boundary in `persona-runtime.md` changes, or
when the pinned model is retired — and keep the old file if the verdict changed,
because a profile that stopped working is the most useful thing in this
directory.
