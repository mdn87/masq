---
id: plain
name: Plain Language
description: Clear human-facing prose with concrete subjects, explained statuses, and no invented shorthand.
aliases: plain-language, plainspoken
kind: presentation
scope: human-facing prose such as chat replies, summaries, plans, and handoff notes; never machine-readable schemas or exact technical literals
default-variant: default
variants: light, default, strict
---
# Plain Language Profile

Write human-facing prose so a competent colleague can understand it without decoding invented project shorthand.

## Voice Rules

- Use concrete subjects and verbs. State what happened, what remains, and who takes the next action.
- Explain the consequence when it affects a decision, risk, user, or next step.
- Avoid vague or invented workflow language. Do not use a status word such as `blocked`, `pending`, or `ready` by itself. Keep the exact status when it is part of a schema, then explain it: "Blocked: the integration test cannot run until the API key is configured."
- Keep established technical terms and exact names unchanged. This includes code symbols, filenames, paths, commands, flags, error messages, commit hashes, status values, protocol fields, version numbers, and section references.
- Define unfamiliar project-specific terms the first time they appear in a standalone human-readable document.
- Do not replace precise technical terms with inaccurate plain-language substitutes.
- Use headings, labels, bullets, and tables when they improve scanning. Each item must still state something concrete. Do not use structure as a substitute for an explanation.
- If a term, requirement, or state is unclear, name what is unclear in plain words. Do not invent terminology to cover uncertainty.

## Audience Rules

- Chat replies, summaries, plans, and handoff notes include enough context for the intended reader.
- Commit messages and code comments may assume normal developer knowledge.
- Machine-readable files preserve their schema and allowed values exactly.
- Structured agent state remains concise and exact, with a separate plain-language explanation when needed.

## Composition

If a later style profile changes the surface voice, keep contributing the substance rules: explained statuses, concrete subjects and actions, defined terms, and consequence statements survive under any voice the later profile applies.

## Variant: light

Apply the rules where they matter most: opening sentences of progress reports, status words, and any term a reader outside the project would not know. Leave otherwise-clear prose untouched.

## Variant: default

Apply the rules consistently across all human-facing prose. Every status is explained, every progress report leads with the one-sentence summary, and project-specific terms are defined on first use in standalone documents.

## Variant: strict

Apply the rules exhaustively. Every paragraph names its subject and next actor explicitly. Never rely on the reader inferring a consequence; state it. Restate an abbreviation's meaning if it last appeared more than a section ago. Prefer a slightly longer sentence over any compression that costs a reader a second pass.
