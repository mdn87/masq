# ADR 0005: Three Kinds, Precedence, and the Dean Break

## Status

Accepted. Supersedes the two-kind model in ADR 0004.

## Context

ADR 0004 split profiles into `presentation` and `conduct` because Dean's working
conduct sat outside the presentation-only invariant. A review of that change
found the split incomplete: it fixed Dean and left the same contradiction
sitting in other profiles, which now defaulted to `presentation` by omission.

A pass over the catalog confirmed most of it.

`afterdark` asks for clarification when age is ambiguous and refuses whole
classes of request. That is refusal behavior, not presentation, and no wording
of the presentation boundary makes it fit.

`plain` required progress reports to open with a sentence naming what changed,
what remains, and what blocks completion. Dictating what a report contains is
conduct wherever it is written.

`caveman` was also called misclassified, on the grounds that omitting
alternatives and caveats changes which propositions appear. That one does not
hold. Caveman already keeps every fact needed to solve the request, preserves
negations and limiting words, and escapes to ordinary prose for warnings,
destructive confirmations, and ordered procedures. A boundary defined as "may
not change the set of semantic propositions" outlaws compression as a category
and leaves every compression profile unclassifiable. The boundary was underspecified,
not the profile.

Two further holes came out of the same review. A misspelled `knd:` was accepted
by the frontmatter parser and silently classified the profile as presentation,
so the claim that a typo could not produce an undeclared axis was false. And the
Dean split changed the meaning of an existing persistent stack without saying
so: `dean:default` used to carry conduct and no longer does.

## Decision

**Three kinds.** `presentation`, `conduct`, and `policy`.

`presentation` changes wording, register, structure, and compression, after the
task decisions have been made. Compression may drop detail, but never detail the
reader needs in order to decide or act, and never a warning, negation,
qualifier, or exact literal. It does not change which actions are taken, what
evidence is gathered, the scope of the work, confirmation behavior, or refusal
behavior. That phrasing keeps `caveman` classifiable while still excluding the
things a presentation profile must not do.

`conduct` changes how work is done and reported. Limits unchanged from ADR 0004.

`policy` changes what may be produced in a context: required checks, required
clarifications, refusals, and content boundaries. It is monotone — it may only
tighten. It never loosens or removes a safety requirement, grants a capability,
or permits content another rule forbids. `afterdark` is the first.

**Precedence runs within a kind, not across kinds.** Presentation traits compose
and a later presentation profile owns the surface register. Conduct traits
compose and a later conduct profile wins a direct conduct conflict. A
presentation profile cannot drop semantic content a conduct or policy profile
requires; it shortens the prose around a required item instead. A conduct
profile does not dictate register except where wording is needed to keep a
warning or factual distinction intact. Policy requirements sit outside stack
precedence, and the strictest active requirement applies.

This also settles a rule that had been left profile-specific: registers are
intentionally exclusive at the surface, while non-register presentation traits
still compose. Dean's own composition note now defers to the global rule rather
than restating a broader version of it.

**Every shipped profile declares its kind explicitly.** The `presentation`
default remains for third-party profiles written before the field existed, but
the repository does not rely on an implicit classification for a boundary this
important. A test asserts every shipped profile has an explicit `kind:` line.

**The frontmatter parser rejects unknown and duplicate fields.** Supported keys
are allowlisted. `knd: conduct` now fails to load rather than defaulting to
presentation, and a repeated key fails rather than silently taking the last
value. This is a breaking change for any third-party profile carrying extra
fields, and that is the correct trade: the alternative is a boundary that a typo
can erase.

**One canonical boundary, asserted.** The kind boundary appears in the runtime
contract, its fallback string, the per-turn reinforcement, the persona skill,
and the security notes. Stating it three times is worthless if three other
authoritative locations still say Masq is presentation-only, so a test now
asserts every copy mentions conduct, policy, and the permission or confirmation
limit, and that the fallback no longer describes profiles as style overlays.

**The Dean break is declared, not migrated.** Persistent state and presets stay
at schema version 1 and are not rewritten. Instead the version goes to 0.3.0,
the changelog carries a Breaking section naming both variants, and `doctor`
reports a note whenever the effective stack contains `dean` without `conduct`.

A migration was considered and rejected. `dean:default` maps cleanly to
`dean:default + conduct:default`, but `dean:light` does not map at all: old
light applied the full common register including prose-over-structure and
treated every conduct habit as a suggestion, while `conduct:light` enforces the
reporting habits and relaxes only scope and permission rules. Rewriting a user's
stack into something that is merely close is worse than telling them what
changed. The note is the honest form of that.

The note table hardcodes profile IDs in the generic runtime, which the project
otherwise forbids. This is the second intentional documented exception, after
the `/masq:afterdark` compatibility command. It is dated, scoped to one release,
and meant to be deleted.

## Consequences

Third-party profiles with unrecognized frontmatter fields stop loading until the
field is removed. Profiles without an explicit `kind` still load as
presentation.

`plain` no longer governs progress-report shape. Anyone running `plain` without
`conduct` loses the leading-sentence rule; that rule is now in `conduct`, where
report contents belong.

A second conduct profile is now possible, since precedence within a kind is
defined. `reviewer` was blocked on exactly this.

The catalog plan's thesis weakened on contact with the facts. "Extracted beats
invented" was two examples presented as a general result, and one of the two is
an authored profile rather than an extraction. Corpus-backing survives as the
default admission heuristic; the claim that it is the discriminator does not.

There is still no behavioral evidence that any of this changes a model's output.
Deterministic tests cover parsing, rendering, precedence mechanics, contract
consistency, and the migration note. The evaluation-fixture format in the
catalog plan is the intended answer; no fixtures exist yet, and
`claude --plugin-dir .` has not been run against these changes.
