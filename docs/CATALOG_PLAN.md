# Catalog Plan

How the profile catalog grows. The engine is close to done; the catalog is the
product, and right now it is thin and skewed toward demos.

## The thesis

Extracted profiles beat invented ones, badly.

The evidence is in the catalog. `dean` came from a voice guide built out of
months of one person's actual messages. `de-tell` came from a production
documentation round of 26 documents in three voices with verified fidelity.
Those two do work every session. `renfaire`, `afterdark`, and `caveman` were
designed rather than extracted, and they are demos: they prove the engine
handles ornament, contextual dormancy, and compression, which was worth
proving once.

So the rule is: a new profile starts from a corpus, not from an idea. If nobody
has written in this voice or worked in this way, there is nothing to extract and
the profile will be a costume.

## Admission criteria

A profile earns a slot when all of these hold.

1. **Named corpus.** State what it was extracted from: a body of writing, a
   document set, a rules file, a review history. "Derived from" is a real field,
   not a courtesy.
2. **Provenance is clean.** If the corpus is an identifiable person's writing,
   the profile ships only with that person's agreement, and the profile says
   whose voice it is. This repository is public; a corpus is not.
3. **Recurring problem.** It fixes something that shows up across projects, not
   a one-off preference that belongs in a project's `CLAUDE.md`.
4. **Declared axis.** `presentation` or `conduct`, and it stays inside the
   limits of that axis. A conduct profile also restates its own boundary in its
   body.
5. **Composes.** It says what it does when a later profile takes the surface
   voice, and it does not tell the model to ignore other instructions.
6. **Falsifiable.** There is a before/after where the profile visibly changed
   the output. A profile nobody can demonstrate is a profile nobody can debug.

## What the catalog covers today

| Axis | Register | Corrective | Contextual |
| --- | --- | --- | --- |
| presentation | `dean` (peer), `plain` (outsider), `caveman` (terse), `renfaire` (ornate) | `de-tell` | `afterdark` |
| conduct | `conduct` | — | — |

The gaps that matter: nothing sets the reader's expertise level, nothing changes
how findings are challenged, and the conduct axis has exactly one entry.

## The queue

Ordered by whether the corpus already exists.

### 1. `audience` — presentation, register

Sets the assumed expertise of the reader, as variants: `novice`, `peer`,
`expert`. Governs whether a term is glossed on first use, whether a step is
spelled out, and how much context is restated.

This is the one real piece of the BWA primer work still unported. That project's
central problem was that its audience was engineers who were not software
engineers, so "assume competence" and "explain the term inline" were both right
and had to be resolved per reader. `plain` and `dean` currently each encode one
end of that spectrum as a fixed position; `audience` makes it a dial and lets
either register sit on top.

**Corpus:** the primer's three published voices and the gloss decisions between
them. **Risk:** overlaps `plain` at `novice`. Resolve by moving the glossing
rules out of `plain` and leaving `plain` as the substance rules it also carries.

### 2. `reviewer` — conduct

Adversarial working posture. Try to refute the finding rather than confirm it;
default to "not established" when the evidence is thin; separate what was
observed from what was inferred; state the disconfirming test that was not run.

**Corpus:** the review and verification patterns already in use — adversarial
verify passes, independent-lens judging, the habit of ranking findings by
whether they were confirmed or merely plausible. **Why conduct:** it changes how
work is done and what a report contains, and it must be bounded by the conduct
limits, since "be skeptical" is one bad sentence away from "refuse to act."

### 3. `handoff` — presentation, contextual

Shapes session notes, handoff files, and commit bodies: root cause before
outcome, explicit "do NOT re-run X" warnings, absolute dates rather than "last
week," and what the next person must not assume. Dormant outside those
artifacts, the way `afterdark` is dormant outside its context.

**Corpus:** existing handoff files and the conventions in the author's global
rules. **Note:** `conduct` already says notes record the why. This profile is
the artifact's shape, not the habit; if it cannot be written without repeating
`conduct`, it should not be written at all.

### 4. House style extraction

A personal global rules file is already a persona: register preferences,
permission economy, evidence habits, reporting shape. Extracting one into
profiles makes it toggleable, per-project overridable, and testable, and it
shrinks the always-on context that every session pays for.

This is the highest-leverage item and the one most constrained by criterion 2.
Extract it for local use first; ship only the parts that are genuinely general.

### Not queued

Domain profiles, host-specific profiles, and anything that would be one rule.
A single rule belongs inside an existing profile or in a project's `CLAUDE.md`.

## Anti-goals

- **Novelty.** The engine's ability to do voices is proven. Another costume adds
  catalog size, not usefulness.
- **Catalog size as a metric.** Seven useful profiles beat twenty.
- **Restating the runtime contract.** Preservation of literals, safety
  precedence, and scope discipline are contract-level. A profile that repeats
  them is padding, except where a conduct profile deliberately restates its own
  boundary.
- **Composition machinery ahead of collisions.** Exclusive groups and conflict
  metadata stay unbuilt until two shipped profiles actually collide in a way
  authoring discipline cannot fix. `de-tell` composes under everything precisely
  because it declares no register, which suggests the fix is usually authoring.

## Retirement

The catalog should be prunable. `renfaire` and `afterdark` are fixtures that
prove ornament and contextual dormancy; they stay for that reason and are not
evidence the catalog is growing. Any profile that cannot be demonstrated under
criterion 6 after a release is a candidate for removal.

## The verification gap

Nothing currently proves a profile changed anything. `npm test` validates that
every profile parses, that every declared variant has a body, and that every
variant renders. It cannot check that the rendered instructions changed a
response, because that needs a model in the loop.

The honest interim is manual: `/masq:persona preview` the stack, run a fixed
prompt, and keep the before/after that criterion 6 requires alongside the
profile. Automated behavioral checks are deferred rather than faked; a CI job
that asserts a profile "works" without running a model would be worse than the
gap it papers over.
