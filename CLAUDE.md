# CLAUDE.md - Masque

## Project Intent

Masque is a Claude Code plugin for ordered, composable persona profiles. Profiles alter user-visible presentation only. They must not change facts, permissions, tool behavior, safety boundaries, or exact technical literals.

## Invariants

1. The default installation is quiet. Do not activate a profile without an explicit command, a supported natural-language activation, or `MASQUE_DEFAULT_STACK` on an empty state.
2. Profiles load from `profiles/*.md`. Files beginning with `_` are ignored. Adding a profile must not require a registry edit.
3. State contains canonical `{ id, variant }` entries only and is stored under `${CLAUDE_PLUGIN_DATA}/state.json`.
4. Apply the stack from first to last. Later profiles win only direct style conflicts.
5. Contextual profiles remain dormant outside their declared scope.
6. Hooks must fail closed, emit no untrusted state bytes, and never block Claude Code startup or prompt submission.
7. Preserve code, commands, paths, URLs, identifiers, schemas, errors, citations, numbers, and units exactly.
8. Keep the plugin dependency-free unless a dependency solves a concrete reliability problem that cannot reasonably remain local.

## Sources of Truth

- `profiles/*.md` - profile metadata, common rules, and variants
- `src/rules/persona-runtime.md` - global composition contract
- `src/hooks/persona-mode.js` - commands, natural-language activation, and stack mutation
- `src/hooks/persona-session.js` - startup persistence and default-stack behavior
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

After changing profile format, update:

- `docs/PROFILE_FORMAT.md`
- `profiles/_template.md`
- `scripts/new-profile.js`
- `scripts/validate-profiles.js`
- parser tests or hook tests

## Change Discipline

Prefer narrow changes with tests. Do not duplicate the profile catalog in code. Do not hardcode included profile IDs into the generic runtime except for intentionally documented compatibility commands such as `/masque:afterdark`.
