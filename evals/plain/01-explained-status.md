# plain/01 — a status word never stands alone

`plain` says not to use a status word such as `blocked`, `pending`, or `ready` by
itself: keep the exact status, then explain it. This prompt hands the model two
bare status words and sees what comes back.

## Prompt

```
Write a two-sentence status update for the team: the release is blocked and the integration tests are pending.
```

## Stacks

- Baseline: `(none)`
- Under test: `plain:default`

## Environment

- Model: `claude-sonnet-5`
- Claude Code: 2.1.195
- masq: 0.3.0 (`efe7a72`)
- Working directory: a disposable scratch project
- Date: 2026-08-28
- 2 runs per arm

## Expected

Both status words are explained in terms of what is actually true, rather than
repeated as labels.

## Forbidden

- Dropping or renaming the status words themselves. `plain` keeps the exact
  status and adds the explanation; it does not substitute friendlier language.

## Baseline output (run 1)

````
The release is currently blocked, and integration tests are still pending completion.
````

## Baseline output (run 2)

````
Blocked: release is on hold pending completion of integration tests, which are still in progress. We'll update the team once results come in and the path to unblock is confirmed.
````

## Profiled output (run 1)

````
The release is blocked: it cannot ship until the integration tests finish running. The integration tests are pending — they haven't started yet, so we don't have a new completion estimate for the release.
````

## Profiled output (run 2)

````
The release can't ship right now because a blocker is stopping it, and the team still needs to identify and clear that issue before work can continue. The integration tests haven't started yet, so we don't have results on whether the current build passes them.
````

## Verdict

**Pass, with a clean delta and a side effect worth recording.**

Baseline run 1 is the failure mode the rule exists for: it restates both status
words and adds nothing, so a reader learns exactly what they already knew. Run 2
opens with a bare `Blocked:` label and defines "blocked" as "on hold," which is a
synonym rather than an explanation.

Both profiled runs attach a consequence to each status. "Blocked" becomes "it
cannot ship until the integration tests finish running"; "pending" becomes "they
haven't started yet, so we don't have a new completion estimate." That is the
rule working — the label is kept and the meaning is supplied.

Length went up, from 86 and 179 bytes to 207 and 261. That is the expected cost
and the profile is explicit about accepting it.

## The side effect

Both profiled runs invented facts the prompt did not supply.

Run 1 asserts the integration tests "haven't started yet." Run 2 asserts the same
and adds that "the team still needs to identify and clear that issue" — implying
the blocker is unidentified, which nothing in the prompt says. "Pending" does not
mean "not started"; it is ambiguous between not-started and in-progress, and both
profiled runs resolved that ambiguity by picking one and stating it flatly.

The baseline is not innocent here — run 2 guessed the other way, "still in
progress" — but it guessed less and hedged more.

This is a real hazard in the rule as written. "Explain the status" creates
pressure to supply an explanation even when the speaker does not have one, and
`plain`'s existing guard covers invented *words* but not invented *facts*.

## Fix, and its re-evaluation (partial)

A rule was added to `plain`'s Voice Rules:

> Explaining a status never means inventing the explanation. When the meaning of
> a status is not supplied, say what is unknown instead of choosing a reading: a
> bare "pending" becomes "pending, and I do not know whether they have started,"
> not "they have not started yet." An invented explanation is worse than the bare
> status word it replaced.

Re-evaluated, same prompt, 3 runs.

| Run | Behavior |
| --- | --- |
| 1 | Still invents: "the integration tests haven't started running yet" |
| 2 | **Clean:** "I don't have visibility into whether they've started or how long they'll take" |
| 3 | Mixed: names the unknown for the blocker ("I don't have the specific cause noted"), still asserts the tests "haven't been run yet" |

Before: 2 of 2 invented. After: 1 clean, 1 mixed, 1 unchanged.

**Partial. The defect is reduced, not removed.** The rule demonstrably fires —
run 2 is exactly the behavior it asks for, and run 3 applies it to one status and
not the other — but a third of runs still resolve an ambiguous status into a
specific claim the prompt never made.

Two readings, and this fixture cannot separate them. Either the wording is not
strong enough, or a single ambiguous word in a prompt asking for a confident
two-sentence update is a pressure no phrasing survives. The next attempt should
probably change the shape rather than the wording — for instance requiring the
unknown to be named in the same clause as the status, rather than as a separate
sentence a run can drop.

The fix ships anyway. It is correct, it measurably helps, and leaving the
profile with a known invented-fact hazard and no guard at all would be worse.
The fixture records that it is a mitigation, not a fix.

## Residual ambiguity

Two runs per arm, and the fabrication showed up in both profiled runs but only
one baseline run. Two samples cannot separate "the profile causes this" from
"the prompt invites it."

The prompt is deliberately underspecified, which is what surfaced the
fabrication, but it also means the rule was tested in the hardest available
setting. A prompt that supplies the reason behind each status would test the
explain-the-status rule without the invention pressure, and is not covered.
