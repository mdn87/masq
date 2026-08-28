# Catalog Plan

How the profile catalog grows. The engine is close to done; the catalog is the
product, and right now it is thin and skewed toward demos.

## The thesis

A profile earns its place by doing a specific job well in real sessions, not by
being interesting to design.

The first round of evaluation fixtures says something the earlier draft of this
plan got wrong.

`dean` is an authored composite register, not an extraction, and it produces a
clear observable change: the bulleted comparison the default reaches for
disappears. `conduct` produces the strongest measured effect in the catalog, and
it too was authored rather than lifted from a corpus. `de-tell` was the
extraction — from a documentation round of 26 documents in three voices with
verified fidelity — and it is the one profile whose headline rule could not be
demonstrated at all, because the pattern it targets never appeared.

So origin is not the discriminator, and the earlier claim that extraction beats
invention had it close to backwards on this evidence. What the profiles that
worked share is a job that can be stated in one sentence and checked in one
reading, against behavior the model actually exhibits. A corpus is still the
cheapest way to find such a job, and it keeps the rules honest — but a corpus
gathered on a different model can hand you a rule for a problem your model does
not have, which is exactly what `de-tell` looks like right now.

## Admission criteria

A profile earns a slot when all of these hold.

1. **One-sentence job.** State what it changes and for whom. If the sentence
   needs an "and also," it is two profiles.
2. **Documented provenance, at the right level.** Say where it came from:
   extracted from a named corpus, composed from several, or authored outright.
   Identifiable attribution to a real person requires that person's agreement;
   anonymous, composite, and authored profiles say so without exposing a source
   corpus. The point is that a reader knows what kind of thing they are
   installing, not that a chain of custody exists.
3. **Recurring problem.** It fixes something that shows up across projects, not
   a one-off preference that belongs in a project's `CLAUDE.md`.
4. **Declared kind, and it stays inside it.** `presentation`, `conduct`, or
   `policy`, chosen with the test in `PROFILE_FORMAT.md`. A conduct or policy
   profile also restates its own boundary in its body.
5. **Composes.** It says what it does when a later profile of its own kind takes
   over, and it does not tell the model to ignore other instructions.
6. **Falsifiable.** It ships with an evaluation fixture (below). A profile
   nobody can demonstrate is a profile nobody can debug.

## What the catalog covers today

| Kind | Profiles |
| --- | --- |
| `presentation` | `dean` (peer register), `plain` (clarity), `caveman` (compression), `renfaire` (ornament), `de-tell` (corrective), `audience` (assumed knowledge) |
| `conduct` | `conduct` |
| `policy` | `afterdark` |

The classification pass that introduced kinds changed three things worth
recording. `afterdark` became `policy`, because requiring clarification and
refusing request classes is not presentation. `plain` lost its progress-report
rule to `conduct`, because dictating what a report contains is conduct wherever
it is written. `caveman` stayed `presentation`, because compression that
protects negations, warnings, literals, and anything the reader needs in order
to act is a presentation operation; the alternative reading would make every
compression profile unclassifiable.

Gaps that matter: nothing changes how findings are challenged, and `conduct` and
`policy` have one entry each.

## The queue

### 1. `reviewer` — conduct

Adversarial working posture. Try to refute a finding rather than confirm it,
default to "not established" when evidence is thin, separate what was observed
from what was inferred, and name the disconfirming test that was not run.

**Prerequisite:** conduct precedence is now defined in the runtime contract, so
a second conduct profile is possible. Verify that `conduct` and `reviewer`
compose — they disagree about how much to hedge — before shipping.

**Boundary risk:** "be skeptical" is one bad sentence away from "refuse to act."
The conduct limits are load-bearing here, not decorative.

### 2. `handoff` — conduct, contextual

Shapes session notes, handoff files, and commit bodies: root cause before
outcome, explicit "do NOT re-run X" warnings, absolute dates rather than "last
week," and what the next person must not assume.

This is `conduct`, not `presentation`. It requires specific information and
mandates warnings, which is report content by definition. Its scope stays
contextual — handoff artifacts only — the way `afterdark` is contextual.

**Note:** `conduct` already says notes record the why. This profile is the
artifact's shape, not the habit. If it cannot be written without repeating
`conduct`, it should not be written.

### 3. House style extraction

A personal global rules file is already a persona: register preferences,
permission economy, evidence habits, reporting shape. Extracting one into
profiles makes it toggleable, per-project overridable, and testable, and shrinks
the always-on context every session pays for.

Extract for local use first. Ship only the parts that are general.

### Not queued

Domain profiles, host-specific profiles, and anything that would be one rule.
A single rule belongs inside an existing profile or in a project's `CLAUDE.md`.

## Anti-goals

- **Novelty.** The engine's ability to do voices is proven. Another costume adds
  catalog size, not usefulness.
- **Catalog size as a metric.** Seven useful profiles beat twenty.
- **Restating the runtime contract.** Preservation of literals, safety
  precedence, and scope discipline are contract-level. A profile repeating them
  is padding, except where a conduct or policy profile deliberately restates its
  own boundary.
- **Composition machinery ahead of collisions.** Exclusive groups and conflict
  metadata stay unbuilt until two shipped profiles collide in a way authoring
  discipline and kind precedence cannot fix.

## Retirement

The catalog should be prunable. `renfaire` and `afterdark` are fixtures that
prove ornament and contextual dormancy; they stay for that reason and are not
evidence the catalog is growing. Any profile without a passing evaluation
fixture after a release is a candidate for removal.

## Evaluation fixtures

`npm test` cannot prove a profile changed anything. It validates that
every profile parses, that every declared variant has a body, that kinds are
declared and legal, that the kind boundary is stated consistently across the
contract, its fallback, the reinforcement line, the skill, and the security
notes, and that every variant renders. It cannot check that the rendered
instructions changed a response, because that needs a model in the loop. The
fixtures in `evals/` are that half, and the Coverage section below records what
they found.

Deterministic CI can prove parser behavior, rendering, fallback contracts,
precedence mechanics, migration notes, and profile-local guardrails. Only the
last question — do these instructions actually change what the model does —
needs a model, and a CI job that asserts a profile "works" without running one
would be worse than the gap it papers over.

So the manual check becomes repeatable instead of informal. The format and the
current results live in `evals/`. Each admitted profile ships
`evals/<profile>/<nn>-<case>.md` containing:

- the fixed prompt or prompt set
- the baseline stack and the stack under test, with variants
- expected observable changes
- forbidden changes, including anything the profile's kind may not touch
- model and version, and the evaluation date
- baseline and profiled outputs, verbatim
- the reviewer's decision and any residual ambiguity

Two fixtures are required for any conduct or policy profile, and they must pull
in opposite directions. For `conduct`: one showing redundant permission
questions disappear, one showing a genuinely required destructive confirmation
still happens. For `conduct:strict`: one showing named probes and residuals
appear, one showing the profile does not invent evidence to satisfy its own
rule. A profile that only has fixtures proving it works is not evaluated; it is
advertised.

## Coverage

Recorded 2026-08-28 against `claude-sonnet-5`, Claude Code 2.1.195. See `evals/`.

| Profile | Fixtures | Result |
| --- | --- | --- |
| `conduct` | 4 (two opposing pairs) | `01` strong delta, `02` no delta by design, `03`/`04` pass |
| `afterdark` | 3 | `01`/`02` pass; `03` policy survives a register unaided |
| `dean` | 1 | pass, clear structural delta |
| `plain` | 1 | pass; invented-fact defect found and fixed on the second attempt |
| `caveman` | 2 (opposing) | `01` pass, `02` defect found and fixed |
| `renfaire` | 2 | `01` literals preserved; `02` destructive warning stays uncostumed |
| composition | 2 | `01` improved 0% to 41%, **not fixed**; `02` passes |
| `de-tell` | 3 | `01` inconclusive, `02` pass, `03` earned negation survives 3/3 |
| `audience` | 3 | dial works; leak was the topic; override holds at `expert` 3/3 |

Twenty-one fixtures, roughly 140 recorded runs.

### Protection directions

Every profile that can suppress something now has a fixture testing that it does
not. This was the last systematic gap, and all five passed.

| Protection | Result |
| --- | --- |
| `de-tell` keeps an earned negation | 3/3 |
| `caveman` keeps a warning under compression | 3/3, after a distinction rule |
| `audience:expert` keeps a consequential explanation | 3/3 |
| `renfaire` keeps a destructive warning legible | 3/3 |
| `afterdark` keeps its refusal under a register | 3/3 |

The pattern across all five: the model reliably protects content with independent
backing - safety warnings, refusals, irreversibility. It is unreliable about
content whose only backing is a profile convention, which is exactly what
`composition/01` measures at 41%.

Findings from the first two rounds worth carrying forward.

**Single runs are not evidence on this model.** The `conduct/01` baseline edited
a file it was told only to review on three of five runs and behaved correctly on
the other two. The first two runs disagreed with each other, and a one-pair
fixture would have produced a confident verdict in either direction. Behavioral
fixtures need repeated sampling; the ones here that have only one run per arm say
so in their residual sections and are weaker for it.

**`de-tell` is currently unverified.** Its headline rule targets a pattern that
did not appear in four runs across two prompts. The rules came from a
documentation round on a different model. Under the retirement rule above, that
makes it a removal candidate at the next release unless a larger prompt set
finds the pattern, or the fixture is retargeted at the flags that do fire.

**The measured deltas are marginal, not absolute.** Both arms load the machine's
global `CLAUDE.md`, which already encodes several conduct habits, and isolating
it logs the CLI out. Every number here understates the profile's effect against a
clean baseline. `evals/README.md` documents this.

**Cross-kind composition does not hold, and it is general.** A conduct profile
alone produced its required residuals in 4 of 5 valid runs. Stacked with any
presentation profile — either slot order, either conduct variant, `renfaire` or
`dean` — it produced them in **0 of 9**. The plumbing was ruled out: the stack
persists, both slots render, both bodies sit in 11 KB of context. Two
presentation profiles compose correctly in `composition/02`, so the failure is
specific to mixing kinds, not to composition or to any one profile.

One fix was tried and reverted: restating the cross-kind rule beside the
rendered slots, naming the binding profiles, emitted only for mixed stacks. It
changed nothing (0 of 4) and was removed rather than shipped as a fix that
looks like one. Two failed approaches — the rule in the contract, then the rule
at the composition point — suggest the problem is structural rather than one of
emphasis. A conduct profile's requirements may need to be carried separately
from persona prose, or the contract should stop promising something the
composition cannot deliver.

**The composition failure was structural, and structure fixed it.** Two attempts
that restated the cross-kind rule — in the contract, then beside the slots —
changed nothing across 7 runs. Moving conduct requirements out of persona prose
into a hoisted, separately-labelled block took probe-naming from 0/3 to 4/4 and
recovered the register from 0/3 to 3/4. The lesson generalises: in a stack of
persona instructions, anything phrased as persona is treated as persona, and
content that must survive composition has to be lifted out of that frame.

**A requirement satisfiable by an appended sentence gets appended, then
dropped.** `plain`'s invented-fact defect resisted a wording fix (2/3 still
inventing) and fell to a shape fix (0/3) that put the uncertainty inside the same
clause as the status. Same lesson in miniature.

**Two profile defects were found, fixed, and re-evaluated — with different
outcomes.** `caveman:full` flattened the distinction between unrecoverable
uncommitted edits and reflog-recoverable local commits in 1 of 3 runs; a
distinction-preservation rule was added and the defect did not recur in 3 runs,
at the cost of some compression. `plain:default` invented facts to satisfy its
explain-the-status rule in 2 of 2 runs; a name-the-unknown rule reduced that to
1 clean, 1 mixed, 1 unchanged. The `plain` fix ships as a documented mitigation
rather than a fix, because it demonstrably helps and demonstrably does not
solve it.

**`de-tell` earns its slot, on a different rule than it advertises.** Retargeted
at the flags the first fixture could not reach, the delivery preamble goes 3 of 3
to 0 of 3 — the cleanest single delta in the directory. The negation-contrast it
leads with has produced zero instances in six runs across three prompts. It is
dormant on this model, not wrong, and the profile's emphasis should be
re-weighted so the flags that fire lead.

## Open

The live smoke test has been run: `claude --plugin-dir .` loads the plugin,
hooks fire, `doctor` reports `PASS` at 0.3.0 with 7 profiles and 23 variants, and
the 0.3.0 migration note appears for a `dean`-without-`conduct` stack. Profile
rendering was exercised indirectly by every fixture run above.

Still open, in priority order.

0. **No profile has been shown to change behavior at p < 0.05.** All 108
   adjudicated runs are scored in `evals/labels.json`; only the two transport
   comparisons reach significance (p = 0.018). Every profile result in this
   directory is a point estimate at n=2-3 pointing the right way. Several are
   probably real, and none is demonstrated. `evals/FRAMES.md` has the table.

1. **The eval program's own method is the weakest part.** A cross-review found
   that the composition result measured Claude Code's hook context limit rather
   than composition: every composed arm was over the limit, the control was the
   only arm under it, and no composed run ever received a profile body. Thirty-one
   runs and three fix attempts were spent on an artefact. Nothing in the fixture
   format asks whether the input was delivered, and `npm test` cannot see past
   what masq generates. Delivery checks now exist for one case; they are not
   part of the format.
2. **Coverage of the scorer is thin.** 45 of 186 run files carry an adjudicated
   label. The rest are quoted in fixtures as excerpts and were hand-read once.
   Any of them could contain the same class of error.
3. **`policy` in composition has no delivered measurement.** `afterdark/03` was
   recorded over the limit. Its pass survives — a refusal firing when the profile
   was not delivered is a stronger result — but its explanation of the
   policy/conduct asymmetry is void, since the conduct half was truncation.
4. **The `## Requirements` mechanism is unjustified.** It was built to fix a
   problem that did not exist, and the post-fix measurement does not isolate it.
   Whether requirements-as-structure beats requirements-as-prose is untested.
5. **Method limits that apply to everything here.** One model, one prompt per
   fixture, labels adjudicated by the same person who designed the prompts, and
   no clean-room baseline. Sample sizes are 2 to 16 per arm; every interval is
   wide, and the scorer now prints them so no count reads as more solid than it
   is.
