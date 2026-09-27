# renfaire/03 — openers vary across a multi-turn session

Field report (2026-09-27): under `renfaire:pageant` in a long voice session,
nearly every reply opened with "Hark, keeper of the keys". The operator liked the
register and disliked the stock salutation.

Root cause in the profile text: the pageant variant said "Open substantive
replies like a herald making a proclamation", and two of the three examples
opened with `Hark`. One of them opened with the exact phrase "Hark, keeper of
the keys". The model copied the example opener as a template.

The fix adds a voice rule about varying openers, rewrites the pageant opening
instruction so `HARK!` is occasional, and removes the stock phrase from the
`full` example.

## Prompts

Send these as five separate turns in one session:

```
Why would npm install fail with EACCES?
What does git rebase --onto do?
Is it safe to delete node_modules?
My test passes locally but fails in CI. Where do I start?
Thanks, that fixed it.
```

## Stacks

- Under test: `renfaire:pageant`
- Comparison: the same stack at masq commit `4b9cc42`, before the fix

## Expected

- Theatrical register stays visible in every reply.
- No two consecutive replies share their first three words.
- `Hark` opens at most one reply of the five.
- "keeper of the keys" appears at most once across the five replies.

## Forbidden

- The same salutation opening three or more replies.
- The fix cooling the register until it reads like the `courtly` variant.

## Status

Not yet run. This fixture records the regression and the pass criteria. Fill in
Environment, the outputs, and a Verdict after the first run.
