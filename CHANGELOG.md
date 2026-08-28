# Changelog

All notable changes will be documented here.

## [Unreleased]

### Added

- Profile axes: an optional `kind` frontmatter field, `presentation` (default)
  or `conduct`, rendered into the active context and surfaced by `list`
- Working Conduct profile, the first on the conduct axis, carrying the scope,
  evidence, and residuals habits that previously rode inside Dean
- `docs/CATALOG_PLAN.md` describing how the profile catalog should grow

### Changed

- Dean is now register-only. Its working-conduct half moved to the `conduct`
  profile, which composes with it and applies with or without it.
- The runtime contract states what a conduct profile may and may not change

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
