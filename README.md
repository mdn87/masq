# Masque

**Modular Agent Style, Qualities, and User Expression.**

Masque is a Claude Code plugin for reusable, stackable persona profiles. A profile can supply a voice, tone, domain posture, workflow preference, or contextual behavior. Profiles can be activated independently, assigned a variant, reordered, combined, and turned off without editing the plugin runtime.

Masque is quiet by default. No profile is active until one is explicitly enabled.

The name comes from the courtly theatrical masque: costumes, roles, spectacle, and deliberate performance. It fits the first Renfaire profile while remaining broad enough for technical, editorial, workflow, and domain personas.

## Why Masque

A single global personality toggle cannot express combinations such as:

```text
afterdark:suggestive + renfaire:pageant
```

Masque keeps an ordered stack. Every profile contributes its non-conflicting traits. A later profile wins only a direct style conflict. Contextual profiles remain dormant outside their declared scope.

In the example above, Afterdark supplies adult-consent boundaries and intimate-message intent. Renfaire supplies the absurd courtly delivery. During ordinary technical work, Afterdark stays dormant while Renfaire can still style the surrounding explanation.

## Commands

Claude Code namespaces plugin skills with the plugin name:

```text
/masque:persona status
/masque:persona list
/masque:persona on <profile[:variant]> [...]
/masque:persona off <profile> [...]
/masque:persona toggle <profile[:variant]> [...]
/masque:persona set <profile[:variant]> [...]
/masque:persona move <profile> first|last
/masque:persona clear
/masque:persona help
```

Shorthand activation:

```text
/masque:persona renfaire
/masque:persona renfaire:full
```

Examples:

```text
/masque:persona on renfaire
/masque:persona on afterdark:suggestive
/masque:persona set afterdark:suggestive renfaire:pageant
/masque:persona move afterdark last
/masque:persona off renfaire
/masque:persona clear
```

Simple natural-language controls are also recognized:

```text
turn on the medieval persona
turn off the afterdark profile
show the active persona stack
clear all personas
```

The Afterdark compatibility command remains available:

```text
/masque:afterdark
/masque:afterdark flirty
/masque:afterdark suggestive
/masque:afterdark direct
/masque:afterdark off
```

## Included Profiles

### Renfaire Herald

An overcommitted Medieval Times and renaissance-fair performer who has remained in character several hours past closing.

```text
renfaire:courtly
renfaire:full
renfaire:pageant
```

The default is `renfaire:pageant`.

### Afterdark

A contextual adult intimate-message profile with controlled levels of directness.

```text
afterdark:flirty
afterdark:suggestive
afterdark:direct
```

Afterdark remains non-graphic, consent-aware, and dormant outside adult intimate-message drafting or revision.

## Composition Contract

Masque treats profiles as presentation layers, not new authorities or identities.

- Apply profiles from first to last.
- Preserve every non-conflicting trait.
- Let a later profile win only direct style conflicts.
- Keep contextual profiles dormant outside their scope.
- Preserve code, commands, paths, URLs, identifiers, schemas, errors, quotations, citations, numbers, units, and data exactly.
- Keep safety, factuality, project instructions, and the current user request above persona styling.
- State destructive, security, medical, legal, and financial warnings plainly when styling could obscure them.

## Persistence

The ordered stack is stored in Claude Code's persistent plugin-data directory:

```text
${CLAUDE_PLUGIN_DATA}/state.json
```

The stack survives new sessions, resume, `/clear`, and context compaction until it is changed or cleared. Concurrent Claude Code sessions using the same Masque installation share the stack.

Seed an empty installation with a default stack:

```powershell
$env:MASQUE_DEFAULT_STACK = "afterdark:suggestive,renfaire:pageant"
claude --plugin-dir .
```

Reset the saved stack at each true startup:

```powershell
$env:MASQUE_RESET_ON_START = "1"
```

When both variables are set, startup clears the prior stack and then loads the defaults.

## Add a Profile

Profiles are discovered automatically from `profiles/*.md`. No registry or hook edit is required.

```bash
npm run new-profile -- goblin-accountant "Goblin Accountant"
npm test
```

See [`docs/PROFILE_FORMAT.md`](docs/PROFILE_FORMAT.md) for the profile contract and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for runtime behavior.

## Test Locally

Node 18 or newer is required. There are no runtime npm dependencies.

```powershell
npm test
claude --plugin-dir .
```

## Install from GitHub

```powershell
claude plugin marketplace add mdn87/masque
claude plugin install masque@masque
```

## Repository Layout

```text
masque/
├── .claude-plugin/             # Claude Code plugin and marketplace manifests
├── .github/workflows/ci.yml    # Node test matrix
├── profiles/                   # Auto-discovered persona profiles
├── skills/                     # Persona management and compatibility commands
├── src/hooks/                  # Persistent state and prompt-context hooks
├── src/rules/                  # Global composition contract
├── scripts/                    # Validation and profile scaffolding
├── tests/                      # Hook and persistence tests
├── docs/                       # Architecture, profile format, roadmap, ADRs
├── AGENTS.md                   # Repository instructions for coding agents
└── CLAUDE.md                   # Claude Code maintainer context
```
