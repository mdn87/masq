# CLAUDE.md - Masq

## Project Intent

Masq is a Claude Code plugin for ordered, composable persona profiles. A profile
sits on one of two axes, declared by its `kind`. A `presentation` profile alters
user-visible presentation only. A `conduct` profile alters how work is done and
reported: effort, sequencing, and what a report contains. Neither may change
facts, permissions, safety boundaries, or exact technical literals.

## Invariants

1. The default installation is quiet. Do not activate a profile without an explicit command, a supported natural-language activation, or `MASQ_DEFAULT_STACK` on an empty state.
2. Profiles load from `profiles/*.md`. Files beginning with `_` are ignored. Adding a profile must not require a registry edit.
3. State contains canonical `{ id, variant }` entries only and remains under
   `${CLAUDE_PLUGIN_DATA}`. Project and session scopes must never write into a
   user's repository.
4. Apply the stack from first to last. Later profiles win only direct style conflicts.
5. Contextual profiles remain dormant outside their declared scope.
6. Hooks must fail closed, emit no untrusted state bytes, and never block Claude Code startup or prompt submission.
7. Preserve code, commands, paths, URLs, identifiers, schemas, errors, citations, numbers, and units exactly.
8. Keep the plugin dependency-free unless a dependency solves a concrete reliability problem that cannot reasonably remain local.
9. A conduct profile may change effort, sequencing, and reporting. It may never
   grant tool authority, widen a permission, lower a confirmation requirement,
   skip a safety check, or alter a factual claim. It yields to any user
   request, project instruction, permission rule, or safety rule.

## Sources of Truth

- `profiles/*.md` - profile metadata, common rules, and variants
- `src/rules/persona-runtime.md` - global composition contract
- `src/hooks/persona-mode.js` - commands, natural-language activation, and stack mutation
- `src/hooks/persona-session.js` - startup persistence and default-stack behavior
- `src/hooks/persona-session-end.js` - temporary session cleanup
- `src/hooks/persona-doctor.js` - read-only catalog, manifest, and state diagnostics
- `src/hooks/persona-state.js` - state normalization and safe persistence
- `src/hooks/persona-profiles.js` - profile parsing, validation, resolution, and rendering
- `docs/PROFILE_FORMAT.md` - public profile authoring contract

## Development Loop

```bash
npm test
claude --plugin-dir .
```

After changing commands, update all of:

- `README.md`
- `skills/persona/SKILL.md`
- `src/hooks/persona-mode.js`
- `tests/test-hooks.js`
- `tests/test-v02.js`

After changing profile format, update:

- `docs/PROFILE_FORMAT.md`
- `profiles/_template.md`
- `scripts/new-profile.js`
- `scripts/validate-profiles.js`
- parser tests or hook tests

## Change Discipline

Prefer narrow changes with tests. Do not duplicate the profile catalog in code. Do not hardcode included profile IDs into the generic runtime except for intentionally documented compatibility commands such as `/masq:afterdark`.
