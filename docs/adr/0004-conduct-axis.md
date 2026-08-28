# ADR 0004: The Conduct Axis

## Status

Accepted.

## Context

The project intent said profiles "alter user-visible presentation only" and
must not change "facts, permissions, tool behavior, safety boundaries, or exact
technical literals." The Dean profile then shipped a Working conduct section
telling the assistant to do exactly what was asked and nothing more, to skip
permission theater, to skip pre-verification busywork, and not to act on
discoveries unprompted. Those are instructions about tool behavior and about
how much gets asked before acting. Dean was outside the stated invariant from
the day it landed.

It was also, by a distance, the most useful thing in the catalog. The rules
people actually want to tune are how much an agent asks, what it reports, and
whether it names what is still open. A framework that can only change adjectives
is a costume shop.

So the invariant was wrong, not the profile. The two candidate fixes were to
strip conduct out of Dean and keep Masq purely presentational, or to admit
conduct as a second axis with a guardrail of its own. The 0.3 roadmap already
anticipated "profile categories such as voice, workflow, domain, and context,"
so the second option was a promotion of something already planned rather than a
new direction.

The risk of admitting conduct is specific and worth naming. "No permission
theater" reads, to a careless model, as license to stop asking for
confirmations. A conduct profile that can quietly lower a confirmation
requirement is a security problem, not a style preference.

## Decision

A profile declares an optional `kind` in frontmatter, `presentation` (the
default) or `conduct`.

A `presentation` profile changes how a response reads. It never changes what
the response asserts.

A `conduct` profile changes how work is done and reported: effort, sequencing,
and what a report contains. It may never grant tool authority, widen a
permission, lower a confirmation requirement, skip a safety check, or alter a
factual claim. Where a conduct instruction appears to conflict with the user's
request, a project instruction, a permission rule, or a safety rule, the conduct
instruction yields.

The boundary is stated in three places, deliberately redundantly:

1. `src/rules/persona-runtime.md`, injected once per session with the stack.
2. `renderProfile`, which emits a `Kind:` line into every rendered slot, so the
   axis travels with the profile body rather than depending on the reader
   remembering the contract at the top.
3. The conduct profile's own common body, so someone reading `profiles/*.md`
   sees the limit without loading the plugin.

Unknown `kind` values fail profile loading rather than defaulting, so a typo
cannot silently produce a profile with no declared axis.

Dean splits. `dean` keeps the register, tone traps, assume-competence rule, and
channel calibration. `conduct` takes the scope discipline, permission economy,
evidence habits, residuals, and blunt-naming rules. They compose, so
`dean conduct` reproduces the behavior that previously shipped as one file.

## Consequences

Dean's variants change meaning. `dean:light` no longer means "register only
without the conduct rules"; it now means the register applied without the
prose-over-structure collapse. Anyone with `dean:light` in a stack gets a
different result than before, and that is a behavior change in a profile rather
than in the engine.

The catalog gains a second dimension to reason about. A stack can now hold a
register and a working style independently, which is the point, but it also
means `list` output has to distinguish them; the conduct marker is appended to
the catalog line rather than inserted, so existing catalog assertions keep
matching.

Conduct profiles are harder to write safely than presentation profiles, because
a badly worded habit reaches past the prose. The guardrail is stated in the
profile file itself precisely so that authoring a new one starts from the limit.

This does not add categories, exclusive groups, or conflict metadata. Two axes
with a clear rule about what each may touch is the smallest change that fixes
the contradiction; the rest of the 0.3 composition machinery stays unbuilt until
a real conflict demands it.
