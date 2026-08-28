# Catalog Plan

How the profile catalog grows. The engine is close to done; the catalog is the
product, and right now it is thin and skewed toward demos.

## The thesis

A profile earns its place by doing a specific job well in real sessions, not by
being interesting to design.

Two of the current profiles do work every session. `de-tell` was extracted from
a production documentation round — 26 documents in three voices with verified
fidelity — and its rules are the ones that survived that round. `dean` is an
authored composite register rather than an extraction, and it works because it
answers a narrow question: how should a reply to this person read. The other
three presentation profiles were designed to prove the engine handles ornament,
compression, and contextual dormancy, which was worth proving once.

So origin is not the discriminator. The useful profiles have a job that can be
stated in one sentence and checked in one reading. Corpus-derived extraction is
the better default heuristic, because a corpus supplies that job for free and
keeps the rules honest — but it is a heuristic until there is broader behavioral
evidence, not a settled result from two examples.

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

Nothing currently proves a profile changed anything. `npm test` validates that
every profile parses, that every declared variant has a body, that kinds are
declared and legal, that the kind boundary is stated consistently across the
contract, its fallback, the reinforcement line, the skill, and the security
notes, and that every variant renders. It cannot check that the rendered
instructions changed a response, because that needs a model in the loop.

Deterministic CI can prove parser behavior, rendering, fallback contracts,
precedence mechanics, migration notes, and profile-local guardrails. Only the
last question — do these instructions actually change what the model does —
needs a model, and a CI job that asserts a profile "works" without running one
would be worse than the gap it papers over.

So the manual check becomes repeatable instead of informal. Each admitted
profile ships `evals/<profile>/<case>.md` containing:

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

## Open

`claude --plugin-dir .` — the live plugin smoke test the development loop calls
for — has not been run against the kind changes. Parser, rendering, contract,
and migration-note behavior are covered by `npm test`; how the rendered
instructions actually land in a session is not.
