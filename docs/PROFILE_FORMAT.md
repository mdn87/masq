# Persona Profile Format

Masque discovers profiles automatically from `profiles/*.md`. Files beginning with `_` are ignored, so `_template.md` can remain in the repository.

A profile is data and instructions, not executable code. Adding one requires no changes to the hooks or plugin manifest.

## Minimal Profile

```markdown
---
id: goblin-accountant
name: Goblin Accountant
description: Meticulous financial explanations delivered by a possessive fantasy bookkeeper.
aliases: goblin, bookkeeper
scope: explanatory and conversational prose
default-variant: default
variants: light, default, extreme
---
# Goblin Accountant

Define behavior shared by every variant.

## Variant: light

Use occasional goblin-accounting language.

## Variant: default

Remain consistently in character while preserving clarity.

## Variant: extreme

Use maximal theatrical commitment without damaging the answer.
```

## Required Frontmatter

`id`
: Lowercase kebab-case identifier. The filename must be exactly `<id>.md`.

`name`
: Human-readable display name.

`description`
: One sentence shown by `/masque:persona list`.

`scope`
: Plain-language statement of where the profile applies. Contextual profiles should explicitly remain dormant elsewhere.

`default-variant`
: Variant selected when the command omits `:variant`.

`variants`
: Comma-separated lowercase kebab-case variant IDs.

## Optional Frontmatter

`aliases`
: Comma-separated alternate IDs accepted by commands. Aliases must be unique across the complete profile catalog.

## Variant Sections

Declare exactly one `## Variant: <id>` section for each item in `variants`. Text before the first variant section becomes common behavior and loads for every variant. At runtime, only the common body and selected variant body are injected.

Keep shared preservation and scope rules in the common body. Keep intensity-specific instructions in variant sections.

## Composition Rules

The stack is ordered. Later profiles win only direct style conflicts. Earlier profiles continue contributing non-conflicting traits.

Design profiles to compose cleanly:

- State scope explicitly.
- Describe positive traits rather than only prohibitions.
- Preserve exact technical literals.
- Avoid telling the model to ignore other instructions.
- Avoid claiming a new real identity, memory, body, credential, or relationship.
- Treat task behavior and factuality as higher priority than performance.
- Mention how the profile behaves when another later style profile changes its voice.

A contextual profile can combine with a general voice profile. For example:

```text
/masque:persona set afterdark:suggestive renfaire:pageant
```

Afterdark controls when intimate-message behavior is appropriate and what boundaries apply. Renfaire, loaded later, supplies the theatrical surface voice. Outside intimate-message tasks, Afterdark remains dormant and Renfaire remains active.

## Profile Size

Each profile is capped at 128 KiB by the runtime loader. Keep profiles substantially smaller. Put only behavior required at response time in the file.

## Validation

Run:

```bash
npm test
```

Validation checks:

- frontmatter presence and supported fields
- ID and filename agreement
- unique IDs and aliases
- declared/default variant validity
- one body section for every declared variant
- no undeclared variant sections
- successful rendering of every profile variant

## Scaffolding

Create a profile without editing a registry:

```bash
npm run new-profile -- goblin-accountant "Goblin Accountant"
```

Edit the generated file, then validate it with `npm test`.
