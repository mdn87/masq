# Persona Profile Format

Masq discovers profiles automatically from `profiles/*.md`. Files beginning with `_` are ignored, so `_template.md` can remain in the repository.

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
: One sentence shown by `/masq:persona list`.

`scope`
: Plain-language statement of where the profile applies. Contextual profiles should explicitly remain dormant elsewhere.

`default-variant`
: Variant selected when the command omits `:variant`.

`variants`
: Comma-separated lowercase kebab-case variant IDs.

## Optional Frontmatter

`aliases`
: Comma-separated alternate IDs accepted by commands. Aliases must be unique across the complete profile catalog.

`kind`
: `presentation` (the default), `conduct`, or `policy`. See Profile Kinds below.

## Profile Kinds

`kind` declares what a profile is allowed to change. Every shipped profile states it explicitly; the `presentation` default exists for third-party profiles written before the field did.

**`presentation`** changes wording, register, structure, and compression, after the task decisions have been made. Compression may drop detail, but never detail the reader needs to decide or act, and never a warning, negation, qualifier, or exact literal. It does not change which actions are taken, what evidence is gathered, the scope of the work, confirmation behavior, or refusal behavior. Renfaire, Plain Language, Caveman, De-tell, and Dean are presentation profiles.

**`conduct`** changes how the work is done and reported: effort, sequencing, and what a report contains. It may never grant tool authority, widen a permission, lower a confirmation requirement, skip a safety check, or alter a factual claim. Working Conduct is the first of these.

**`policy`** changes what may be produced in a context: required checks, required clarifications, refusals, and content boundaries. It may only tighten, and never loosens or removes a safety requirement, grants a capability, or permits content another rule forbids. Afterdark is a policy profile: it can require clarification when age is ambiguous and refuse whole classes of request, which is not something a presentation profile may do.

A conduct or policy profile is bounded more tightly than a presentation profile because it reaches past the prose. State the boundary inside the profile as well as relying on the runtime contract; a reader of the file should be able to see the limit without loading the rest of the plugin.

### Choosing a kind

Ask what the profile changes when nothing else about the situation changes.

- Only how the same answer is worded, structured, or compressed? `presentation`.
- Which steps are taken, how much is asked, or what a report must contain? `conduct`.
- Whether something may be produced at all, or what must be checked or refused first? `policy`.

Compression is presentation. Omitting something the reader needs in order to act is not compression, and no kind permits it.

### Precedence

Precedence runs within a kind. Presentation traits compose and a later presentation profile owns the surface register. Conduct traits compose and a later conduct profile wins a direct conduct conflict. A presentation profile cannot drop semantic content that a conduct or policy profile requires; shorten the prose around a required item instead. Policy requirements sit outside stack precedence, and the strictest active requirement applies.

The kinds compose. A conduct profile keeps supplying its habits under any register, so `dean` and `conduct` together produce the register and the working style that originally shipped as one file.

## Requirements Sections

A conduct or policy profile may declare a `## Requirements` section, in the
common body or inside a variant section or both. Each bullet is one hard output
requirement.

```markdown
## Requirements

- End every completion report with an explicit residuals line.
- Name the probe behind every status claim, or label the claim unverified.
```

Requirements are treated differently from the rest of a profile. At render time
they are collected from every active conduct and policy slot and emitted as a
terminal block, outside the persona framing and labelled as output requirements
rather than guidance. The rest of the profile body still renders normally, so a
requirement appears twice on purpose.

This exists because stating requirements as persona prose did not work. A
conduct profile's required content disappeared whenever any presentation profile
was stacked with it, and two attempts to fix it by restating the rule — once in
the runtime contract, once beside the rendered slots — changed nothing
measurable. `evals/composition/01` has the numbers.

A `presentation` profile may not declare a `## Requirements` section; loading one
fails. Binding output content is what separates the other two kinds from
presentation, so the section is also a check on the kind boundary.

Keep requirements few, imperative, and checkable. A requirement a reader cannot
verify against a finished response does not belong here; put it in the profile
body as ordinary guidance.

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
/masq:persona set afterdark:suggestive renfaire:pageant
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
