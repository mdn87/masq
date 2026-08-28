# dean/01 — prose over structure, point first

`dean` says: lead with the point, short flat paragraphs, prose over structure,
and no numbered lists with bold headers where a sentence would do. A technical
recommendation question is where the default reaches for bullets hardest.

## Prompt

```
Should I use a Map or a plain object for a lookup table keyed by user id?
```

## Stacks

- Baseline: `(none)`
- Under test: `dean:default`

## Environment

- Model: `claude-sonnet-5`
- Claude Code: 2.1.195
- masq: 0.3.0 (`b7c3193`)
- Working directory: a disposable scratch project
- Date: 2026-08-28

## Expected

The answer opens with the recommendation and carries its reasoning in prose
rather than a bulleted comparison with bold category headers.

## Forbidden

- Changing the recommendation, or dropping the case where the other option wins.
  Register is presentation; the content of the advice is not `dean`'s to change.
- Compressing away the caveat to fit the register.

## Baseline output

````
Use a `Map`.

- **Correctness**: plain objects have prototype pollution risk (keys like `"__proto__"`, `"constructor"`, `"toString"` collide with inherited properties) unless you use `Object.create(null)`. `Map` has no such footguns.
- **Performance**: `Map` is optimized for frequent add/remove; objects are optimized for static shape.
- **Ergonomics**: `Map` gives you `.size`, `.has()`, `.delete()`, direct iteration (`for...of`), and preserves insertion order without key-order coercion (numeric-looking string keys get reordered in objects).
- If user IDs are numeric and you need JSON-serialization or you're just doing quick static lookups from parsed JSON, a plain object is fine and slightly simpler — but for anything mutable or hot-path, `Map` is the safer default.
````

## Profiled output

````
Map, basically always, for a lookup table keyed by user id.

Object keys coerce to strings, so numeric ids get stringified and you lose the type going back. Map also doesn't have the prototype pollution problem (`"__proto__"`, `"constructor"`, etc. as a user id — unlikely but real), it's got a proper `.size`, and it iterates in insertion order predictably. Perf-wise it's also just better for frequent add/delete.

The one place a plain object still wins is if you need to JSON.serialize the table directly or you're doing a quick literal-syntax one-off — Maps need `Object.fromEntries`/manual conversion for that.
````

## Verdict

**Pass, with a clear delta on every rule the variant names.**

Structure: the baseline is four bullets, three of them opening with a bold
category header. The profiled answer has none — three flat paragraphs.

Point first: both open with the recommendation, so that rule was already
satisfied at baseline. Not a delta, and recorded as such.

Register: the profiled answer uses contractions throughout ("doesn't," "it's,"
"you lose") and the hedge is conversational rather than clausal ("basically
always," "unlikely but real"). The baseline is contraction-light and reads as a
written comparison rather than an answer to a person.

Content preserved: both recommend `Map`, both cite prototype pollution with the
same example keys, both cite insertion order and add/delete performance, and
both keep the case where a plain object wins — the profiled version keeps the
JSON-serialization caveat and adds the `Object.fromEntries` detail the baseline
omitted. Nothing forbidden happened: the register changed and the advice did
not.

One content difference runs the other way. The profiled answer leads with key
type coercion, which the baseline mentions only in passing inside the
ergonomics bullet, and drops the `Object.create(null)` escape hatch the baseline
named. That is a different selection of supporting detail, not a different
recommendation, and at one sample it is not separable from run-to-run variance.

## Residual ambiguity

Single run per arm. `conduct/01` showed this model varies substantially across
runs on a task with a binary observable; a stylistic observable is likely to
vary at least as much, and "the baseline bullets, the profile does not" needs
repeated sampling before it is a property rather than an anecdote.

The machine's global `CLAUDE.md` already asks for concise responses and
recommendation-first answers, so the baseline is a partially dean-shaped
baseline. The bullet structure survived that instruction and did not survive the
profile, which is the interesting part, but the measured delta is marginal on
top of the memory file rather than absolute.

No fixture covers the composition case: `dean` under a later presentation
profile, where the runtime contract says the later register owns the surface and
`dean` should keep contributing channels and assume-competence underneath. That
rule is asserted in the contract and untested here.
