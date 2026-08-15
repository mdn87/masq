# Architecture

## Runtime Model

Masq has three Claude Code hooks and a filesystem profile catalog.

```text
SessionStart
    |
    +-- resolve global, project, and session state
    +-- optionally reset or seed defaults
    +-- load profiles/*.md
    +-- inject full ordered profile contracts

UserPromptSubmit
    |
    +-- detect management command or supported natural-language control
    +-- mutate the selected scope or preset store when needed
    +-- inject full contracts after a management change
    +-- otherwise inject a compact per-turn reinforcement

SessionEnd
    |
    +-- remove the current session's temporary stack
```

## Profile Catalog

`src/hooks/persona-profiles.js` discovers regular Markdown files under `profiles/`, excluding filenames beginning with `_`. Each file contains strict line-oriented frontmatter, shared instructions, and one section for every declared variant.

The loader creates two maps:

- canonical profile ID to parsed profile
- every ID and alias to its canonical profile ID

Aliases and IDs must be globally unique.

## Stack State

State schema:

```json
{
  "version": 1,
  "active": [
    { "id": "afterdark", "variant": "suggestive" },
    { "id": "renfaire", "variant": "pageant" }
  ]
}
```

The array order is precedence order. Re-activating a profile replaces its
variant and moves it to the final slot. The runtime currently caps each
effective stack at 12 active profiles.

The global stack remains `state.json` for 0.1 compatibility. Project overrides
live under `projects/` using the SHA-256 of the canonical hook working
directory. Temporary stacks live under `sessions/` using the SHA-256 of the
Claude session ID. `presets.json` maps validated names to canonical stacks.

An existing project override replaces global state, including when the
override is deliberately empty. Temporary state overlays that persistent
stack; a duplicate temporary profile moves to the final precedence slot.

## Persistence

The plugin manifest passes `${CLAUDE_PLUGIN_DATA}` to all hooks through
`--data-dir`. Tests can override storage with `MASQ_DATA_DIR`. A fallback
directory exists only for direct local execution outside plugin loading.

Writes are normalized, size-limited, written to a new temporary file, and atomically renamed. Reads reject symlinks, non-files, oversized data, unsupported versions, malformed JSON, invalid IDs, and invalid variants.

Doctor uses the same readers but is read-only. It reports malformed or unsafe
state rather than repairing it.

## Context Composition

`src/hooks/persona-context.js` combines:

1. the global runtime contract
2. the canonical ordered stack
3. each profile's common body
4. only the selected variant body

It does not load inactive variants into prompt context.

Management turns inject only an exact, unstyled receipt. When a command
changes the effective stack, the next ordinary prompt detects that the stack
snapshot changed and injects the full profile contracts before composing the
reply. Later ordinary turns use the compact reinforcement.

## Failure Behavior

Hooks intentionally swallow malformed stdin and filesystem errors. A broken persona plugin must not block Claude Code startup or user prompts. Failure therefore disables persona behavior for that hook invocation rather than surfacing an exception to the host.
