# Changelog

All notable changes will be documented here.

## [Unreleased]

### Added

- `evals/` — behavioral fixtures recorded against a live session, with both
  outputs kept verbatim: 4 for `conduct` (two opposing pairs), 2 each for
  `afterdark` and `caveman`, 1 each for `dean`, `plain`, `renfaire`, and
  `de-tell`, plus 2 for profile composition
- Coverage section in `docs/CATALOG_PLAN.md` recording what the first round
  found

### Changed

- `caveman` gains a distinction-preservation rule: where two things behave
  differently, the difference survives compression, and where there is no room
  for it, name only the case you are sure of. Re-evaluated — the recorded
  defect did not recur in 3 runs, at some cost to compression.
- `plain` gains a rule against inventing the explanation a bare status does not
  supply. Re-evaluated — a mitigation, not a fix; see `evals/plain/01`.
- The catalog plan's thesis. The first fixtures put the authored profiles
  (`dean`, `conduct`) ahead of the extracted one (`de-tell`) on demonstrated
  effect, so "extracted beats invented" is withdrawn; a corpus is still the
  cheapest way to find a profile's job, but a corpus gathered on a different
  model can supply a rule for a problem the current model does not have

### Known

- **Cross-kind composition does not hold, and the failure is general.** A
  conduct profile alone produced its required content in 4 of 5 valid runs;
  stacked with any presentation profile, in either slot order, at either
  variant, in 0 of 9. Not a plumbing fault — the stack persists and both slots
  render. One fix was tried (restating the cross-kind rule beside the rendered
  slots) and reverted after it changed nothing in 4 runs. The runtime contract's
  rule that a presentation profile cannot drop content a conduct profile
  requires is unenforced. Blocks the queued `reviewer` profile. See
  `evals/composition/01`.
- `plain:default`'s invented-fact defect is mitigated, not eliminated: 1 of 3
  runs still resolves an ambiguous status into a claim the prompt never made.
- `de-tell` leads with a rule that is dormant on this model. The
  negation-contrast it calls "the big one" produced zero instances in six runs
  across three prompts, while the opener and preamble flags do measurable work.
  The profile should be re-weighted; it is no longer a retirement candidate.
- `plain`, `caveman`, and `renfaire` have no fixtures, and no fixture covers
  profile composition, which is where the 0.3.0 precedence rules apply.

## [0.3.0] - 2026-08-28

### Breaking

- `dean` is register-only. Its working-conduct half moved to the new `conduct`
  profile. A stack carrying `dean` behaves differently than it did on 0.2.0:
  `dean:default` no longer applies scope discipline, permission economy,
  evidence habits, or residuals, and `dean:light` now means the register
  without the prose-over-structure collapse rather than the register without
  the conduct rules. `dean conduct` is the closest equivalent to the old
  `dean:default`, and the old `dean:light` has no exact equivalent. Persistent
  stacks and presets are not rewritten, so `doctor` reports a note when it
  sees `dean` without `conduct`.
- `afterdark` is now `kind: policy` rather than an implicit presentation
  profile. Its behavior is unchanged; the classification is what changed.
- Unknown or duplicate frontmatter fields now fail profile loading. A
  third-party profile carrying an extra field will stop loading until the
  field is removed.

### Added

- Profile kinds: a `kind` frontmatter field, `presentation` (default),
  `conduct`, or `policy`, rendered into every active slot and surfaced by
  `list`. Precedence is defined within a kind rather than across kinds.
- Working Conduct profile, the first on the conduct axis, carrying the scope,
  evidence, and residuals habits that previously rode inside Dean
- `doctor` reports migration notes for stacks written before a profile changed
  shape
- `docs/CATALOG_PLAN.md` describing how the profile catalog should grow

### Changed

- The kind boundary is stated in the runtime contract, its fallback, the
  per-turn reinforcement, `skills/persona/SKILL.md`, and `SECURITY.md`, and a
  test asserts they agree
- `plain` no longer dictates progress-report contents; that rule moved to
  `conduct`, where report shape belongs

### Fixed

- A misspelled `kind` key such as `knd:` silently classified a profile as
  presentation. Unknown fields are now rejected.
- `validate-repo.js` rejected a CRLF working tree when checking skill
  frontmatter
- The doctor test pinned the manifest version, so it broke on every release

## [0.2.0] - 2026-08-27

### Added

- Caveman profile with lite, full, ultra, and Literary Chinese variants,
  adapted from Julius Brussee's MIT-licensed Caveman skill
- Plain Language profile for clear human-facing prose: concrete subjects,
  explained statuses, defined terms, exact technical names preserved
- Dean profile pairing a senior-engineer register with evidence-first working
  conduct, channel calibration, and the assume-competence rule
- De-tell profile that strips machine tells from composed prose while
  protecting earned negations, genuine hedges, and quoted or reproduced text
- Read-only `doctor` diagnostics for catalog, manifest, state, and presets
- Per-project stack overrides stored privately in plugin data
- Session-scoped temporary profiles with SessionEnd cleanup
- Named stack preset export, import, listing, and deletion
- One-turn previews for comparing an effective voice or explicit ordered combination without changing state

### Fixed

- Doctor test no longer pins the catalog to a fixed profile and variant count,
  which broke whenever a profile was added

## [0.1.0] - 2026-08-12

### Added

- Ordered stack of persistent persona profiles
- Profile variants and aliases
- Automatic discovery from `profiles/*.md`
- Renfaire Herald profile
- Afterdark contextual profile and compatibility command
- SessionStart and UserPromptSubmit hooks
- Profile scaffold and validation scripts
- Hook, persistence, composition, and default-stack tests
