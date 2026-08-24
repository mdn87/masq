# Masq

**Modular Agent Style and Qualities.**

Masq is a Claude Code plugin for reusable, stackable persona profiles. A profile can supply a voice, tone, domain posture, workflow preference, or contextual behavior. Profiles can be activated independently, assigned a variant, reordered, combined, and turned off without editing the plugin runtime.

Masq is quiet by default. No profile is active until one is explicitly enabled.

The name is clipped from the courtly theatrical tradition of costumes, roles, spectacle, and deliberate performance. It fits the first Renfaire profile while remaining broad enough for technical, editorial, workflow, and domain personas.

## Why Masq

A single global personality toggle cannot express combinations such as:

```text
afterdark:suggestive + renfaire:pageant
```

Masq keeps an ordered stack. Every profile contributes its non-conflicting traits. A later profile wins only a direct style conflict. Contextual profiles remain dormant outside their declared scope.

In the example above, Afterdark supplies adult-consent boundaries and intimate-message intent. Renfaire supplies the absurd courtly delivery. During ordinary technical work, Afterdark stays dormant while Renfaire can still style the surrounding explanation.

## Commands

Claude Code namespaces plugin skills with the plugin name:

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

Scope and preset commands:

```text
/masq:persona global <status|on|off|toggle|set|move|clear> [...]
/masq:persona project <status|on|off|toggle|set|move|clear|unset> [...]
/masq:persona temp <status|on|off|toggle|set|move|clear> [...]
/masq:persona preset list
/masq:persona preset export <name> [effective|global|project|temp]
/masq:persona preset import <name> [active|global|project|temp]
/masq:persona preset delete <name>
```

Shorthand activation:

```text
/masq:persona renfaire
/masq:persona renfaire:full
```

Examples:

```text
/masq:persona on renfaire
/masq:persona on afterdark:suggestive
/masq:persona set afterdark:suggestive renfaire:pageant
/masq:persona move afterdark last
/masq:persona off renfaire
/masq:persona clear
/masq:persona project set plain:strict caveman:lite
/masq:persona temp on renfaire:courtly
/masq:persona preset export concise effective
/masq:persona preset import concise project
/masq:persona preview renfaire:pageant caveman:lite
```

`preview` renders a standardized release-status sample through either the
current effective stack or an explicitly supplied ordered combination. It is a
one-turn comparison and does not change saved or temporary persona state.

Simple natural-language controls are also recognized:

```text
turn on the medieval persona
turn off the afterdark profile
show the active persona stack
clear all personas
```

The Afterdark compatibility command remains available:

```text
/masq:afterdark
/masq:afterdark flirty
/masq:afterdark suggestive
/masq:afterdark direct
/masq:afterdark off
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

### Plain Language

Clear human-facing prose: concrete subjects and verbs, statuses explained rather than left bare, exact technical names preserved, and no invented project shorthand.

```text
plain:light
plain:default
plain:strict
```

The default is `plain:default`.

### Caveman

Token-conscious terse prose adapted from the MIT-licensed
[Caveman skill](https://github.com/JuliusBrussee/caveman). Caveman removes
filler and repetition while preserving technical substance, exact literals,
negations, and clarity around consequential actions.

```text
caveman:lite
caveman:full
caveman:ultra
caveman:wenyan-lite
caveman:wenyan-full
caveman:wenyan-ultra
```

The default is `caveman:full`. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)
for attribution and license terms.

## Composition Contract

Masq treats profiles as presentation layers, not new authorities or identities.

- Apply profiles from first to last.
- Preserve every non-conflicting trait.
- Let a later profile win only direct style conflicts.
- Keep contextual profiles dormant outside their scope.
- Preserve code, commands, paths, URLs, identifiers, schemas, errors, quotations, citations, numbers, units, and data exactly.
- Keep safety, factuality, project instructions, and the current user request above persona styling.
- State destructive, security, medical, legal, and financial warnings plainly when styling could obscure them.

## State Scopes

Masq resolves one effective stack from three scopes:

1. The user-global stack is the fallback for every project.
2. A project override, when present for the current canonical working
   directory, replaces the global stack.
3. Temporary session profiles overlay the persistent stack and win duplicate
   profile precedence.

Unqualified mutation commands edit the project override when one exists and
otherwise edit the global stack. `project unset` removes the override and
restores global fallback. `project clear` deliberately creates an empty
override. Temporary profiles expire at SessionEnd and remain isolated from
other Claude Code sessions.

All state remains inside Claude Code's private plugin-data directory:

```text
${CLAUDE_PLUGIN_DATA}/state.json
${CLAUDE_PLUGIN_DATA}/projects/<project-hash>.json
${CLAUDE_PLUGIN_DATA}/sessions/<session-hash>.json
${CLAUDE_PLUGIN_DATA}/presets.json
```

Global and project stacks survive new sessions, resume, `/clear`, and context
compaction. Temporary stacks persist while the session remains live and
through compaction; Claude Code's SessionEnd hook removes them on exit,
`/clear`, or a session switch. Named presets store canonical stacks and never
read or write an arbitrary path.

Run `/masq:persona doctor` to inspect the catalog, manifest hooks, data
directory, current scopes, effective stack, and preset count. Doctor is
read-only.

Seed an empty installation with a default stack:

```powershell
$env:MASQ_DEFAULT_STACK = "afterdark:suggestive,renfaire:pageant"
claude --plugin-dir .
```

Reset the saved stack at each true startup:

```powershell
$env:MASQ_RESET_ON_START = "1"
```

When both variables are set, startup clears the prior global stack and then
loads the defaults. Project overrides remain explicit and unchanged.

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
claude plugin marketplace add mdn87/masq
claude plugin install masq@masq
```

## Repository Layout

```text
masq/
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
