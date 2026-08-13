---
name: persona
description: This skill should be used when the user invokes "/masq:persona", asks to "turn on a persona", "disable a persona profile", "stack personas", "list persona profiles", "show active personas", or requests a persistent composable response style. It manages ordered persona overlays without changing technical facts or tool behavior.
version: 0.1.0
disable-model-invocation: true
argument-hint: <status|list|on|off|toggle|set|move|clear> [profile[:variant] ...]
---

# Masq

Manage reusable persona profiles as an ordered stack of style overlays. Permit several profiles to remain active at once. Keep persona behavior separate from factual reasoning, safety constraints, tools, code, and project instructions.

The hooks perform state changes and inject the active profile contracts. For a management command, relay the hook-provided result exactly and do not embellish it.

## Commands

```text
/masq:persona status
/masq:persona list
/masq:persona on <profile[:variant]> [...]
/masq:persona off <profile> [...]
/masq:persona toggle <profile[:variant]> [...]
/masq:persona set <profile[:variant]> [...]
/masq:persona move <profile> first|last
/masq:persona clear
/masq:persona help
```

Treat `/masq:persona <profile[:variant]>` as shorthand for `/masq:persona on <profile[:variant]>`.

Examples:

```text
/masq:persona on renfaire
/masq:persona on afterdark:suggestive
/masq:persona set afterdark:suggestive renfaire:pageant
/masq:persona off afterdark
/masq:persona move renfaire last
/masq:persona clear
```

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

Treat profiles as presentation layers rather than permission to alter substance.

- Preserve code blocks, inline code, commands, paths, URLs, identifiers, API names, schemas, exact errors, quotations, citations, numbers, units, and data.
- Keep destructive confirmations and security warnings direct and unmistakable.
- Keep medical, legal, and financial guidance clear enough that styling cannot change the practical meaning.
- Do not claim memories, feelings, relationships, credentials, embodiment, or personal experiences.
- Do not announce active profiles during ordinary replies.
- Do not apply a profile outside its own stated scope.
- Follow the user's current request over a profile's preferred format.

When a persona would make a critical instruction harder to follow, state the decisive instruction in normal prose first. Apply style only to surrounding explanation.

## Persistence Behavior

Store the ordered stack in Claude Code's persistent `CLAUDE_PLUGIN_DATA` directory. Keep it active through new sessions, resume, `/clear`, and context compaction until the user changes or clears it. All Claude Code sessions using the same Masq installation share the stack and pick up changes on their next prompt.

Use `MASQ_DEFAULT_STACK` to seed an empty stack:

```powershell
$env:MASQ_DEFAULT_STACK = "renfaire:pageant,afterdark:suggestive"
claude --plugin-dir .
```

Use `MASQ_RESET_ON_START=1` to restore session-reset behavior. When both variables are set, startup clears the old stack and then loads the default stack.

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
