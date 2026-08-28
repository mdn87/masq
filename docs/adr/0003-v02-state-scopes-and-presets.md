# ADR 0003: Version 0.2 State Scopes and Presets

## Status

Accepted for the 0.2 implementation.

## Context

Masq 0.1 stores one persistent ordered stack in `state.json`. Version 0.2
needs project-specific behavior, profiles that last for only one Claude Code
session, reusable named stacks, and diagnostics without weakening the rule that
plugin state stays inside the plugin data directory.

Claude Code supplies `cwd` and `session_id` to SessionStart,
UserPromptSubmit, and SessionEnd hooks. Masq can therefore scope state without
writing files into a user's repository.

## Decision

Masq keeps four state layers under `${CLAUDE_PLUGIN_DATA}`:

1. `state.json` remains the backward-compatible user-global stack.
2. `projects/<sha256(realpath(cwd))>.json` stores an optional project override.
3. `sessions/<sha256(session_id)>.json` stores a temporary stack for one
   Claude Code session.
4. `presets.json` stores named reusable stacks.

A project override replaces the global stack. An absent project file falls
back to global; an explicitly empty project file is a valid empty override.
The session stack overlays the selected persistent stack. A temporary entry
with the same profile ID replaces that persistent entry and moves to the end,
so temporary choices have final style precedence.

Unqualified mutation commands target the project override when one exists and
otherwise target global state. `global`, `project`, and `temp` prefixes select
a scope explicitly. `project unset` removes the override and restores global
fallback. SessionEnd removes the matching temporary state file; stale files
from interrupted processes are harmless because another session ID cannot load
them.

Preset export saves the effective, global, project, or temporary stack under a
validated name. Preset import replaces the active persistent, global, project,
or temporary stack. Presets never accept arbitrary filesystem paths.

Doctor performs read-only checks of the catalog, package/plugin manifest,
required hooks, plugin data directory, relevant scoped state files, and preset
store. It reports actionable problems but never repairs or rewrites state.

## Commands

```text
/masq:persona doctor
/masq:persona global <status|on|off|toggle|set|move|clear> [...]
/masq:persona project <status|on|off|toggle|set|move|clear|unset> [...]
/masq:persona temp <status|on|off|toggle|set|move|clear> [...]
/masq:persona preset list
/masq:persona preset export <name> [effective|global|project|temp]
/masq:persona preset import <name> [active|global|project|temp]
/masq:persona preset delete <name>
```

`save` aliases `preset export`; `load` and `use` alias `preset import`.

## Consequences

- Existing 0.1 global state remains readable without migration.
- Project identity follows the canonical hook working directory. Starting
  Claude Code from a different subdirectory intentionally creates a different
  project scope.
- All writes remain private plugin data with atomic, size-limited files and
  symlink rejection.
- A crash may leave an unreachable session file. Doctor reports the current
  session only; automatic garbage collection is deferred until evidence shows
  it is needed.
