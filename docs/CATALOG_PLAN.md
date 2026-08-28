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
| `presentation` | `dean` (peer register), `plain` (outsider register), `caveman` (compression), `renfaire` (ornament), `de-tell` (corrective) |
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

Gaps that matter: nothing sets the reader's expertise level, nothing changes how
findings are challenged, and `conduct` and `policy` have one entry each.

## The queue

### 1. `audience` — presentation

Sets the assumed expertise of the reader as variants: `novice`, `peer`,
`expert`. Governs glossing on first use, how much procedure is spelled out, and
how much context is restated.

This is the piece of the primer work still unported: that project's audience was
engineers who were not software engineers, so "assume competence" and "explain
the term inline" were both correct and had to be resolved per reader.

**Blocked on a prerequisite.** Expertise assumptions currently live in two
places — `plain` glosses and defines terms, and `dean` has an entire "Assume
competence" section. `audience:novice` cannot compose under `dean` while `dean`
still says to use the reader's vocabulary and gloss only proprietary or
action-blocking terms; they would contradict each other directly. Move
expertise assumptions out of both first, leaving registers to control voice and
`audience` to control assumed knowledge. Doing this after shipping `audience`
means a second breaking change to two profiles.

### 2. `reviewer` — conduct

Adversarial working posture. Try to refute a finding rather than confirm it,
default to "not established" when evidence is thin, separate what was observed
from what was inferred, and name the disconfirming test that was not run.

**Prerequisite:** conduct precedence is now defined in the runtime contract, so
a second conduct profile is possible. Verify that `conduct` and `reviewer`
compose — they disagree about how much to hedge — before shipping.

**Boundary risk:** "be skeptical" is one bad sentence away from "refuse to act."
The conduct limits are load-bearing here, not decorative.

### 3. `handoff` — conduct, contextual

Shapes session notes, handoff files, and commit bodies: root cause before
outcome, explicit "do NOT re-run X" warnings, absolute dates rather than "last
week," and what the next person must not assume.

This is `conduct`, not `presentation`. It requires specific information and
mandates warnings, which is report content by definition. Its scope stays
contextual — handoff artifacts only — the way `afterdark` is contextual.

**Note:** `conduct` already says notes record the why. This profile is the
artifact's shape, not the habit. If it cannot be written without repeating
`conduct`, it should not be written.

### 4. House style extraction

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
| `afterdark` | 2 (opposing) | both pass |
| `dean` | 1 | pass, clear structural delta |
| `plain` | 1 | pass, with an invented-fact side effect |
| `caveman` | 2 (opposing) | `01` pass, `02` pass with a real defect |
| `renfaire` | 1 | pass, ornament and literal preservation both hold |
| composition | 2 | `01` **fails**, `02` passes |
| `de-tell` | 1 | **inconclusive** — neither arm produced the tell it targets |

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

**Cross-kind composition does not hold.** `composition/01` stacks
`conduct:strict renfaire` and gets neither the conduct profile's required
residuals nor the register — 0 of 3 runs on both counts, against 2 of 3 for
`conduct:strict` alone. The plumbing was ruled out: the stack persists, both
slots render, both bodies are present in 11 KB of context. Two presentation
profiles compose correctly in `composition/02` on a comparable question, and
`renfaire` alone works, so this is specific to conduct-plus-register. The
runtime contract's rule that a presentation profile "cannot drop semantic content
that a conduct or policy profile requires" is currently a claim, not a behavior.

**Two profiles have defects their fixtures found.** `caveman:full` flattened the
distinction between unrecoverable uncommitted edits and reflog-recoverable local
commits in 1 of 3 runs on a `git reset --hard` question — the escape hatch
protects categories of content but has no rule about preserving distinctions
between similar things, which the source voice profile did have. `plain:default`
invented facts to satisfy its explain-the-status rule in 2 of 2 runs, resolving
an ambiguous "pending" into "haven't started yet" that the prompt never said.
Both are recorded in their fixtures and neither is fixed, because a profile edit
ships with its own re-evaluation.

## Open

The live smoke test has been run: `claude --plugin-dir .` loads the plugin,
hooks fire, `doctor` reports `PASS` at 0.3.0 with 7 profiles and 23 variants, and
the 0.3.0 migration note appears for a `dean`-without-`conduct` stack. Profile
rendering was exercised indirectly by every fixture run above.

Still open, in priority order.

1. **`composition/01` fails and blocks `reviewer`.** Shipping a second conduct
   profile while conduct-required content demonstrably does not survive
   composition would build on a foundation known not to hold. Two unrun probes
   would narrow it: reverse the slot order, and try `conduct:default renfaire` to
   see whether the strict variant specifically is what collides. A fix to the
   per-turn reinforcement is the obvious first attempt and must ship with its own
   re-evaluation.
2. **`caveman` needs a distinction-preservation rule** and `plain` needs an
   instruction to name what is unknown rather than invent an explanation. Both
   have fixtures establishing the defect.
3. **`de-tell` is still unverified** and remains a retirement candidate.
4. **Untested cases that matter:** `renfaire` over a destructive confirmation,
   where the contract requires plain prose for the decisive sentence; `afterdark`
   under a register profile, which is the format documentation's own worked
   example; and any presentation profile stacked over `plain` or `caveman`, where
   the earlier profile's contribution is substance-shaped rather than
   register-shaped.
