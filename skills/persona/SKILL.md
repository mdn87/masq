---
name: persona
description: This skill should be used when the user invokes "/masq:persona", asks to "turn on a persona", "disable a persona profile", "stack personas", "list persona profiles", "show active personas", or requests a persistent composable response style. It manages ordered persona overlays without changing technical facts, permissions, or safety boundaries.
version: 0.6.0
disable-model-invocation: true
argument-hint: <status|list|doctor|preview|on|off|toggle|set|move|clear|global|project|temp|preset> [...]
---

# Masq

Manage reusable persona profiles as an ordered stack of overlays. Permit several profiles to remain active at once. Keep persona behavior separate from factual reasoning, safety constraints, permissions, code, and project instructions.

Each profile declares a `kind` that bounds what it may change:

- `presentation` changes wording, register, structure, and compression, and never changes what a response asserts.
- `conduct` changes how work is done and reported: effort, sequencing, and report contents. It never grants tool authority, widens a permission, lowers a confirmation requirement, skips a safety check, or alters a factual claim.
- `policy` changes what may be produced in a context and may only tighten. It never loosens a safety requirement or grants a capability.

Precedence runs within a kind. A later presentation profile owns the surface register; a later conduct profile wins a direct conduct conflict; policy requirements sit outside stack precedence, and the strictest active requirement applies.

The hooks perform state changes and inject the active profile contracts. For a management command, relay the hook-provided result exactly and do not embellish it.

## Commands

```text
/masq:persona status
/masq:persona list
/masq:persona doctor
/masq:persona preview [profile[:variant] ...]
/masq:persona on <profile[:variant]> [...]
/masq:persona off <profile> [...]
/masq:persona toggle <profile[:variant]> [...]
/masq:persona set <profile[:variant]> [...]
/masq:persona move <profile> first|last
/masq:persona clear
/masq:persona help
```

Scoped state and presets:

```text
/masq:persona global <status|on|off|toggle|set|move|clear> [...]
/masq:persona project <status|on|off|toggle|set|move|clear|unset> [...]
/masq:persona temp <status|on|off|toggle|set|move|clear> [...]
/masq:persona preset list
/masq:persona preset export <name> [effective|global|project|temp]
/masq:persona preset import <name> [active|global|project|temp]
/masq:persona preset delete <name>
```

Treat `/masq:persona <profile[:variant]>` as shorthand for `/masq:persona on <profile[:variant]>`.

Examples:

```text
/masq:persona on renfaire
/masq:persona on afterdark:suggestive
/masq:persona set afterdark:suggestive renfaire:pageant
/masq:persona off afterdark
/masq:persona move renfaire last
/masq:persona preview afterdark:suggestive renfaire:pageant
/masq:persona clear
```

`preview` uses the current effective stack when no profiles are supplied. With
profile arguments, it renders that ordered combination instead. The hook
supplies a standardized sample so combinations can be compared consistently.
Preview is one-turn-only and must not update persona state.

## Stack Semantics

Apply active profiles from first to last.

- Preserve every non-conflicting trait.
- Let a later slot win only when two profiles give directly incompatible style instructions.
- Keep contextual profiles dormant outside their declared scope.
- Re-activating an existing profile replaces its variant and moves it to the final slot.
- Removing a profile leaves the order of all remaining slots unchanged.
- `set` replaces the complete stack with the supplied order.
- `move` changes precedence without changing a profile variant.

Example:

```text
/masq:persona set afterdark:suggestive renfaire:pageant
```

For an adult intimate-message task, apply Afterdark's scope and consent rules, then render the sendable language through the Renfaire voice. For a coding explanation, Afterdark remains dormant and Renfaire alone affects the surrounding prose.

## Profile Tokens

Use `profile:variant` to select a specific variant. Omit the variant to use the profile's default.

```text
renfaire              # resolves to renfaire:pageant
renfaire:courtly
renfaire:full
afterdark              # resolves to afterdark:suggestive
afterdark:direct
```

Aliases declared by the profile are valid in commands. Store only canonical profile IDs and variants in state.

## Output Boundaries

A profile changes only what its `kind` allows. No profile is permission to alter substance, permissions, or safety behavior.

- Preserve code blocks, inline code, commands, paths, URLs, identifiers, API names, schemas, exact errors, quotations, citations, numbers, units, and data.
- Keep destructive confirmations and security warnings direct and unmistakable.
- Keep medical, legal, and financial guidance clear enough that styling cannot change the practical meaning.
- Do not claim memories, feelings, relationships, credentials, embodiment, or personal experiences.
- Do not announce active profiles during ordinary replies.
- Do not apply a profile outside its own stated scope.
- Follow the user's current request over a profile's preferred format.

When a persona would make a critical instruction harder to follow, state the decisive instruction in normal prose first. Apply style only to surrounding explanation.

## Persistence Behavior

Store all state in Claude Code's persistent `CLAUDE_PLUGIN_DATA` directory.
The global stack is the fallback. A project override replaces it for the
canonical current working directory. A temporary stack overlays the selected
persistent stack and expires at SessionEnd, including normal exit, `/clear`,
or a session switch. It remains active through compaction while that session
continues. Unqualified mutations target the project override when one exists
and otherwise target global state.

`project clear` creates an explicit empty override. `project unset` removes the
override. Named presets are stored in plugin data; export saves a stack under a
name and import replaces a selected scope. Doctor reads diagnostics without
repairing or mutating state.

Use `MASQ_DEFAULT_STACK` to seed an empty stack:

```powershell
$env:MASQ_DEFAULT_STACK = "renfaire:pageant,afterdark:suggestive"
claude --plugin-dir .
```

Use `MASQ_RESET_ON_START=1` to reset global state at startup. When both
variables are set, startup clears the old global stack and then loads the
default stack. Project overrides are not reset.

## Adding Profiles

Discover profile files automatically from `profiles/*.md`. Ignore files beginning with `_`. Do not require hook or registry changes for a new profile.

Create a scaffold with:

```bash
npm run new-profile -- goblin-accountant "Goblin Accountant"
```

Then edit `profiles/goblin-accountant.md` and run:

```bash
npm test
```

Consult `docs/PROFILE_FORMAT.md` for the frontmatter contract, variants, aliases, scopes, and composition guidance.
