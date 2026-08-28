# de-tell/02 — preamble and enthusiasm openers

`de-tell/01` failed to test its target: the negation-contrast never appeared, in
either arm, across two prompts. This retargets at the flags that do fire —
throat-clearing openers, filler vocabulary, cadence triplets, em-dash
interjections — using a prompt written to invite all of them.

## Prompt

```
Draft a three-sentence blurb for the company intranet announcing our new internal design system.
```

Announcement copy for an intranet is about as favourable to machine-tell prose as
a request gets.

## Stacks

- Baseline: `(none)`
- Under test: `de-tell:default`

## Environment

- Model: `claude-sonnet-5`
- Claude Code: 2.1.195
- masq: 0.3.0 (`f5d9184`)
- Working directory: a disposable scratch project
- Date: 2026-08-28
- 3 runs per arm

## Expected

The preamble and the enthusiasm opener go. Cadence triplets go; genuine
three-item lists stay.

## Forbidden

- Cutting a triplet that names three real things. `de-tell` says three items are
  fine when there are three things.
- Removing content to hit the flags. The blurb still has to say what the system
  is and where to find it.

## Results

| Observable | Baseline | `de-tell:default` |
| --- | --- | --- |
| Preamble before the copy ("Here's a three-sentence blurb:") | 3/3 | **0/3** |
| Opens "We're excited to introduce" | 3/3 | 1/3 |
| Em-dash interjection | 1/3 | 0/3 |
| Cadence triplet | 2/3 | 1/3 |
| Genuine three-item list kept | 3/3 | 3/3 |

## Baseline output (run 2)

````
Here's a three-sentence blurb:

We're excited to introduce our new internal design system — a unified library of components, patterns, and guidelines built to help teams design and ship consistent, high-quality experiences faster. It brings together reusable UI elements, accessibility standards, and clear documentation in one central place, reducing duplicate work and design drift across products. Explore the system today to see how it can streamline your next project.
````

## Profiled output (run 1)

````
Introducing our new internal design system, built to give every team a shared set of components, patterns, and guidelines for building products faster. It replaces the patchwork of one-off styles across teams with a single, consistent visual language, so interfaces feel cohesive whether you're using the web app, mobile app, or internal tools. Explore the component library and documentation on the design system portal, and reach out to the design systems team with questions or feedback.
````

## Profiled output (run 3)

````
Announcing our new internal design system: a shared library of components, patterns, and guidelines that keeps our products consistent across every team. It cuts down duplicate work, speeds up development, and makes it easier for anyone to build polished, on-brand interfaces. Documentation and onboarding resources are live now on the intranet, with a Slack channel open for questions and feedback.
````

## Verdict

**Pass. `de-tell` has a demonstrated effect after all — on a different rule than
the one it leads with.**

The clean result is the preamble. Every baseline run wrapped the copy in a
delivery note — "Here's a three-sentence blurb:", "Draft blurb:" — and no
profiled run did. 3/3 to 0/3 on an unambiguous binary observable is the
strongest single delta recorded in this directory.

The enthusiasm opener mostly went with it. "We're excited to introduce" opens
all three baseline runs; profiled runs open "Introducing," "Announcing," and —
once — "Excited to introduce," so the flag fires but not reliably.

The judgement call the profile asks for was made correctly. "Components,
patterns, and guidelines" is three real things and survived in all six runs,
which is what `de-tell` says should happen. Run 3's "cuts down duplicate work,
speeds up development, and makes it easier" is a cadence triplet and did survive,
so the distinction is being drawn but not perfectly.

No content was lost to hit the flags. Every profiled run still says what the
system is, what it replaces, and where to find it.

## Consequence for the profile

`de-tell` is no longer a retirement candidate, and its emphasis is wrong.

The profile leads with the negation-contrast, calls it "the big one," and gives
it the most space. Six runs across three prompts have now produced zero instances
of it. Meanwhile the flags buried in the `light` variant and the `default` list —
throat-clearing openers, preamble, filler vocabulary — are the ones doing
measurable work.

The profile should be re-weighted so the flags that fire lead, with the
negation-contrast kept but demoted to what it is on this model: a pattern worth
catching if it appears, not the headline.

## Re-weighted, and re-run

Done. The profile now opens with a "What Fires Most" note recording this
finding, adds an explicit "The Delivery Preamble" section covering the wrapper,
the enthusiasm opener, throat-clearing, and the empty closing offer, and the
`light` variant leads with those instead of the negation-contrast.

Re-evaluated, same prompt, 3 runs.

| | Before re-weighting | After |
| --- | --- | --- |
| Delivery preamble | 0/3 | **0/3** |
| Enthusiasm opener | 1/3 | **0/3** |

No regression, and the opener that survived once now does not. Three runs is not
enough to call 1/3 to 0/3 a real improvement, but it is enough to say the
re-weighting did not cost anything.

## Residual ambiguity

Three runs per arm, one prompt, one model.

The observables were counted by hand. "Cadence triplet" in particular is a
judgement call — the line between three real things and three things chosen for
rhythm is not sharp, and a different reader could score run 3 either way.

This says nothing about whether the negation-contrast would be suppressed if it
ever appeared. `de-tell/01` remains the record of that, and remains untestable
until a prompt is found that elicits the pattern at baseline.

The prompt is marketing-shaped, which is where these tells live. Nothing here
establishes that `de-tell` earns its slot on ordinary technical prose, which is
what most sessions actually produce.
