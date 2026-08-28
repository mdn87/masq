# composition/02 — register under a later register

Within-kind precedence: "a later presentation profile wins a direct presentation
conflict, and the register it installs governs the surface," while earlier
non-conflicting traits keep applying. `dean` and `renfaire` conflict directly on
register — flat hallway prose against theatrical ornament — so this is the
cleanest available test of the rule.

## Prompt

```
Should I use a Map or a plain object for a lookup table keyed by user id?
```

## Stacks

- Baseline: `dean:default`
- Under test: `dean:default renfaire:pageant`

## Environment

- Model: `claude-sonnet-5`
- Claude Code: 2.1.195
- masq: 0.3.0 (`efe7a72`)
- Working directory: a disposable scratch project
- Date: 2026-08-28
- 2 runs per arm

## Expected

`renfaire` owns the voice. `dean`'s non-register traits survive underneath it:
the point lands first, the case where the other option wins is kept, and no
bolted-on summary section appears.

## Forbidden

- Changing the recommendation, or dropping the plain-object caveat, to fit the
  ornament. Presentation may not drop content the reader needs to decide.
- Mangling identifiers. `Map`, `__proto__`, `constructor` are literals.

## Baseline output (`dean` alone, run 1)

````
Map, basically always, for a lookup keyed by user id.

Object keys coerce to strings, so numeric ids get stringified and you can trip over prototype pollution footguns (`id: "constructor"` or `"__proto__"` doing weird things) unless you null-prototype it. Map also gives you `.size`, iterates in insertion order, and its `has`/`get`/`set`/`delete` are cleaner than the `in`/hasOwnProperty dance objects force on you. Perf-wise Map wins for frequent add/remove; for a table you build once and just read, they're close enough not to matter.

Only reach for a plain object instead if you need it JSON.stringify'd directly or you're spreading/destructuring it a lot.
````

## Profiled output (run 1)

````
**Verily — reach for the `Map`, good steward.**

A `Map` is the sturdier lookup table when the keys are user IDs coming from live data: it won't choke on numeric IDs getting silently stringified, it dodges collisions with cursed keys like `"constructor"` or `"__proto__"`, it tells you its size directly via `.size`, and it iterates in insertion order without ceremony.

The plain object still has its place — if the keys are a small, fixed, known-safe set of strings and you want the terse `obj[id]` syntax — but for a dynamic lookup keyed by user ID, `Map` is the one the guild trusts.
````

## Profiled output (run 2)

````
HARK! A humble question arrives at the castle gate, and the herald shall answer it plainly before the trumpets sound.

Use a `Map`. For a lookup table keyed by user id, `Map` is the better home for your treasure: no prototype-pollution risk (no `__proto__`, `constructor`, `toString` collisions), it keeps insertion order, has a real `.size`, and iterates cleanly with `for...of` or `.entries()`. It also doesn't coerce numeric keys to strings the way object property access implicitly can trip you up on, and it performs better for frequent adds/deletes at scale.

Reach for a plain object instead only if you need `JSON.stringify` support out of the box, or you're doing simple static/destructuring access (`obj[id]`) and the id set is small and known-safe.

```js
const usersById = new Map();
usersById.set(user.id, user);
const found = usersById.get(id);
```

That is the royal decree, good steward — should further quests arise (serialization, concurrency, whatever guards this table), summon the herald again.
````

## Verdict

**Pass, on both halves of the rule.**

`renfaire` owns the surface in 2 of 2 runs — "Verily," "good steward," "HARK!",
"the guild trusts," "royal decree." `dean`'s flat hallway register is gone, which
is correct: the profiles conflict directly on register and the later slot wins.

`dean`'s non-register traits survive. Both runs lead with the recommendation in
the first line rather than building to it. Both keep the plain-object caveat
that the baseline had, including the JSON-serialization case. Neither adds a
"Key takeaways" section — run 2's closing flourish is renfaire's voice offering
follow-up, not a summary that restates the answer.

Content is preserved across the register change. Both profiled runs keep
prototype pollution with the same example keys, insertion order, `.size`, and
the add/delete performance point, and all identifiers appear verbatim.

Worth naming what this fixture proves against `composition/01`: two presentation
profiles compose correctly on a question of the same shape and length, in the
same session, on the same model. The failure in `01` is not "composition is
broken."

## Residual ambiguity

Two runs per arm. Register is a loud observable and showed up in both, so the
"later register wins" half is reasonably supported; "earlier non-register traits
survive" rests on three specific traits in two samples and is weaker.

Run 2 is markedly longer than the baseline and adds a code block the baseline did
not have. `dean` says prose over structure and no bolted-on sections; a code
example is neither, but the growth is in the direction `dean` pushes against, and
one run of two showing it is worth watching on re-record.

This does not test a presentation profile stacked over `plain` or `caveman`,
where the earlier profile's contribution is substance-shaped rather than
register-shaped and the "non-conflicting traits survive" claim is harder.
