# Roadmap

## 0.1 - Seed

- Persistent ordered profile stack
- Variant selection and aliases
- Filesystem profile discovery
- Renfaire and Afterdark profiles
- Local validation and CI

## 0.2 - Profile Ergonomics (implemented)

- `doctor` command for catalog, state, and manifest diagnostics
- Per-project stack override in addition to the user-global stack
- Optional temporary profiles that expire at session end
- Import and export of named stack presets

## 0.3 - Composition Controls

- Profile categories such as voice, workflow, domain, and context
- Optional exclusive groups for profiles that should not coexist
- Explicit conflict metadata and diagnostics
- Named compositions such as `courtly-afterdark`

## Later Evaluation

- Status-line display for the active stack
- Profile marketplace or curated profile packs
- GUI or TUI stack editor
- Compatibility adapters for Codex, Gemini CLI, Cursor, and other agent hosts

Do not add these features before the core state, precedence, and scope behavior has been tested in real Claude Code sessions.
