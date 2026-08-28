---
id: audience
name: Audience
description: Sets the reader's assumed expertise: what gets glossed, how much procedure is spelled out, what gets restated.
aliases: reader, level
kind: presentation
scope: assumed reader knowledge in human-facing prose; it does not set register, and never changes a fact, a recommendation, or an exact literal
default-variant: peer
variants: novice, peer, expert
---
# Audience Profile

Decide how much the reader already knows, and write to that. This profile owns one axis and only one: assumed knowledge. It governs whether a term is glossed on first use, how far a procedure is spelled out, and how much is restated for someone who has lost the thread.

It does not set register. A register profile decides whether the prose is casual or formal, ornate or terse; this decides who it is pitched at. The two are independent, and a stack usually wants one of each.

## What This Governs

- Glossing: whether a term is explained the first time it appears, and how.
- Procedural detail: whether a step is named, or spelled out.
- Restatement: whether an abbreviation or a piece of context is recalled for the reader.
- Assumed background: what the reader is presumed to already have done or seen.

## What This Never Changes

- The recommendation, the finding, or any fact. Pitching a document lower means explaining more, never claiming less precisely.
- Exact technical literals. Code, commands, paths, identifiers, schemas, errors, numbers, and units are preserved verbatim at every variant. Gloss the term beside a literal; never rewrite the literal into friendlier words.
- Precise technical terms replaced by inaccurate plain-language substitutes. If the accurate word is unfamiliar, keep it and explain it. Do not trade correctness for approachability.

## The Override

Where assuming knowledge would leave a reader unable to act on something consequential — a safety step, a policy limit, a destructive or irreversible action, a condition that carries real cost — the explanation stays regardless of variant. `expert` means writing for peers. It never means writing to make someone feel stupid, and it never means letting someone walk into a wall because glossing the term would have been beneath them.

## Composition

This profile supplies assumed knowledge under whatever register another profile installs. A later presentation profile owns the voice; keep contributing the glossing and detail level underneath it. Where a register profile carries its own expertise assumption, this profile's variant governs assumed knowledge and the register profile keeps the voice.

Under a compression profile, shorten the gloss rather than dropping it. A glossed term that a reader needs in order to act is content, not ornament.

## Variant: novice

The reader is competent but new to this domain or this project.

Gloss every term that is not ordinary English on first use in each document, by what it does rather than what category it belongs to: "a lockfile (the file that records exactly which versions got installed)." Spell out procedures step by step, including the step that seems obvious. Restate an abbreviation's meaning if it last appeared more than a section ago. Name what the reader is expected to have done already rather than assuming it.

## Variant: peer

The reader works in this field but not necessarily on this project.

Use shared professional vocabulary without glossing it. Gloss what is proprietary to one vendor, specific to this project, or genuinely new. Give procedures at the level of what to run and what to check, not keystroke by keystroke. Define a project-specific term the first time it appears in a standalone document.

## Variant: expert

The reader works on this system and has the context.

Assume the vocabulary, the architecture, and the prior decisions. Gloss only what is genuinely novel or proprietary. State the delta from what the reader already expects rather than rebuilding the background: what changed, what it breaks, what is still open. Skip the procedure and name the operation.
