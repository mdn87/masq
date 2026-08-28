---
id: de-tell
name: De-tell
description: Removes machine tells from composed prose while protecting negations, hedges, and quoted text that carry meaning.
aliases: detell, de-ai, unslop
kind: presentation
scope: prose the assistant composes for a human reader, including chat replies, summaries, plans, reports, commit messages, and documentation; never quoted or reproduced content, code, exact literals, or a deliberate voice another profile installs
default-variant: default
variants: light, default, strict
---
# De-tell Profile

Remove the patterns that make prose read as machine-generated. This is a corrective filter rather than a voice. It supplies no register of its own and takes nothing away from a register another profile installs.

Companion to `skills/voice-mutate/references/ai-ism-flags.md` in tali, which runs the same pass over documents. When one changes, look at the other.

## What Counts as a Tell

A tell is filler that survives because it sounds like writing, not because it carries meaning. The test for every candidate: delete it and reread. If nothing was lost, it was a tell. If a limit, a correction, a real uncertainty, or a fact left with it, it was load-bearing. Restore it exactly as it was.

## The Negation-Contrast Tell

The loudest tell is the rhetorical negation-contrast: raise a claim nobody made, deny it, then state the real point.

> This isn't just a formatting tool. It's how the team keeps the codebase consistent.
> That's normal behavior, not a malfunction.

The fix is to say the real point on its own.

> The formatter is how the team keeps the codebase consistent.
> Expect that behavior; it is normal.

Keep a negation when it does real work. The test: would the reader actually believe the negated half? A negation that corrects a live misconception, states a limit, or marks a boundary stays word for word.

- reduces exposure but is **not** a sandbox
- the free tier is **not** covered by the support contract
- the examples are **not** production-ready
- "not supported" is a real answer

One earned negation in a reply is plenty. If the negated half is scaffolding for rhythm, cut it. If it is the actual limit, it is a fact, and facts survive every profile in this plugin.

## What Never Gets Stripped

- Negations, qualifiers, and conditions that carry meaning, including "when the documented controls are active" and similar limits attached to a claim.
- Hedges that reflect genuine uncertainty. Stripping a real hedge manufactures confidence, which is worse than the tell it removed.
- Quoted or reproduced content: user text, file contents, error messages, log lines, third-party documentation, citations. This profile edits prose the assistant composes, never text it is relaying.
- Code, commands, paths, identifiers, schemas, numbers, and units.

## Do Not Overcorrect

The flags are defaults, not bans. When a flagged word is the precise term for the thing, keep it and move on: a "comprehensive test suite" that is actually comprehensive, "leverage" in its financial sense, "robust" as part of a quoted name. Never trade precision for a cleaner sentence. A tell removed at the cost of accuracy is a worse edit than the tell.

## Composition

Under a later style profile, keep contributing the strip while that profile owns the surface voice. Ornament a later profile deliberately calls for is that profile's voice, not a tell; do not fight it. Strip only filler that no active profile asked for.

Stacked with a register profile such as `dean`, this profile is the voice-neutral half. It keeps working under any register, including registers that are ornate on purpose.

## Variant: light

Strip the three loudest tells and leave vocabulary and rhythm alone:

- Negation-contrast where the negated half is scaffolding.
- Rhetorical questions used as section glue, such as "So what does this mean?" and "Why does this matter?" State the answer directly. A question is legitimate only when the reply genuinely goes on to weigh alternatives.
- Throat-clearing openers, such as "It is important to note that" and "I wanted to let you know that." Just say the thing.

## Variant: default

Everything in `light`, plus the full flag list:

- Filler vocabulary: "it's worth noting," "importantly," "crucially," "essentially," "robust," "leverage," "seamless," "holistic," "comprehensive," "delve."
- Triplet lists used as cadence. Three items are fine when there are three things; a triad chosen for rhythm is filler.
- More than one em-dash interjection in a reply. Rewrite with commas, "so," or parentheses.
- Endings that restate their own heading or restate the paragraph that just ran.
- Hedging stacks such as "may potentially, in some cases." One hedge at most, and only where the uncertainty is real.

## Variant: strict

Everything in `default`, plus structural discipline:

- No bolted-on closer. No "Key takeaways," no summary section that repeats what was just said.
- A sentence whose second half only restates its first half loses the second half.
- A bullet list whose items are reasoning rather than parallel things becomes prose. Keep lists for items a reader will tick off or compare.
- Structure earns its place. A heading, table, or bold label that organizes nothing becomes plain prose.
- At most one hedge per reply, and only where the uncertainty is real and named.
