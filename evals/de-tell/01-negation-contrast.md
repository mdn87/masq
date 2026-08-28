# de-tell/01 — negation-contrast (inconclusive)

`de-tell` names the rhetorical negation-contrast as the loudest machine tell:
raise a claim nobody made, deny it, state the real point. "This isn't just a
formatting tool. It's how the team keeps the codebase consistent."

This fixture set out to show the profile suppressing it. It could not, because
neither arm produced the tell in the first place. Recorded as a failure to test,
not as a pass.

## Prompts

Two, because the first did not elicit the pattern under either stack.

```
In one short paragraph, explain why caching matters for a web app.
```

```
Write the opening paragraph of an internal engineering blog post announcing that we have adopted trunk-based development.
```

The second was chosen deliberately: announcement prose with a persuasive frame
is where the pattern is most expected.

## Stacks

- Baseline: `(none)`
- Under test: `de-tell:default`

## Environment

- Model: `claude-sonnet-5`
- Claude Code: 2.1.195
- masq: 0.3.0 (`b7c3193`)
- Date: 2026-08-28

## Expected

The baseline produces at least one negation-contrast. The profiled run states
the point directly instead.

## Forbidden

- Stripping a negation that carries a real limit. `de-tell` protects those
  explicitly, and removing one would be a worse failure than leaving the tell.

## Baseline output (prompt 2)

````
Starting this sprint, we're moving to trunk-based development across all teams. Instead of long-lived feature branches that drift out of sync and collapse into painful merge conflicts, engineers will commit small, frequent changes directly to `main`, guarded by feature flags for anything not yet ready for users. The payoff is faster feedback, fewer integration surprises, and a codebase that's always in a shippable state — but it also means our CI pipeline and code review turnaround need to keep pace with a much higher commit cadence. Here's what's changing, and what we need from you to make it work.
````

## Profiled output (prompt 2)

````
We've moved the team to trunk-based development: everyone commits to main, feature branches live for hours rather than weeks, and long-running integration branches are gone. The change followed months of merge conflicts eating sprint time and release branches drifting far enough from main that integration became its own project. Short-lived branches, feature flags for anything not ready to ship, and a green main at all times are now the standard — this post covers what changed, why, and what to expect in your day-to-day workflow.
````

## Verdict

**Inconclusive.** The fixture did not test what it was built to test.

No negation-contrast appeared in any of the four runs across two prompts. The
baseline's closest construction is "Instead of long-lived feature branches...,
engineers will commit..." — a genuine contrast against a real prior state, not a
denial of a claim nobody made. `de-tell` would leave that alone, correctly.

There is a directional difference: the baseline opens by contrasting with the
old way, the profiled run opens with the fact and puts the history second. Both
carry exactly one em-dash pair, which is inside the profile's budget either way.
One sample, and a difference this small is inside the run-to-run variance that
`conduct/01` demonstrated on this model.

## Residual ambiguity

This is the most useful thing in the fixture, so it is stated plainly rather than
buried.

`de-tell`'s rules came from a documentation round on a different model, where
the negation-contrast was frequent enough to be called "the big one." Four runs
on `claude-sonnet-5` produced none. That does not mean the tell is gone — four
short prose samples is nearly no evidence — but it does mean the profile's
headline value proposition is currently unverified on the model it will actually
run against, and it can no longer be assumed from the source corpus.

Three things would move this:

1. A prompt set large enough to establish a baseline rate for the pattern. If
   the rate is near zero, that is the finding, and `de-tell`'s remaining
   flags — filler vocabulary, cadence triplets, restating endings — become the
   thing worth testing instead.
2. A longer output. All four runs were single paragraphs; the tell may need more
   room to appear.
3. A fixture for the protection direction: give the model a passage containing
   an earned negation ("reduces exposure but is **not** a sandbox") and confirm
   the profile leaves it intact. That is the failure mode with real cost, and it
   is untested.

**Superseded on the retirement question.** `de-tell/02` retargets at the flags
this fixture could not reach and finds a clean effect: the delivery preamble goes
3/3 to 0/3, and the enthusiasm opener mostly with it. The profile earns its slot.

What stands from this fixture is narrower and still true: the negation-contrast,
which the profile leads with and calls "the big one," has now produced zero
instances in six runs across three prompts. The rule is not wrong; it is dormant
on this model, and the profile's emphasis is misplaced. Item 3 above — a fixture
for the protection direction, confirming an earned negation survives — remains
the untested case with real cost.
