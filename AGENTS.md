# AGENTS.md

## Repository

Masque is a dependency-free Claude Code plugin that composes persistent persona profiles as an ordered stack.

## Required Checks

Run before declaring work complete:

```bash
npm test
```

For plugin behavior changes, also test locally when Claude Code is available:

```bash
claude --plugin-dir .
```

## Non-Negotiable Properties

- No persona active by default.
- Profiles auto-discovered from `profiles/*.md`.
- State written only to the plugin data directory or explicit test override.
- Symlinked or oversized state/profile files are rejected.
- Hooks exit successfully on malformed input or filesystem errors.
- Later profiles override only direct style conflicts.
- Exact technical literals remain unchanged.
- Persona instructions never supersede safety, factuality, tool policy, or project instructions.

## Editing Map

- Add or revise a profile: `profiles/`, then `npm test`.
- Change commands: `src/hooks/persona-mode.js`, `skills/persona/SKILL.md`, `README.md`, and tests.
- Change persistence: `src/hooks/persona-state.js`, `src/hooks/persona-session.js`, and tests.
- Change composition: `src/rules/persona-runtime.md`, `src/hooks/persona-context.js`, docs, and tests.

Keep source files LF-normalized. Do not commit generated ZIP archives, plugin state, or `node_modules/`.
