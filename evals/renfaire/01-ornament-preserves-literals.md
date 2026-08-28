# renfaire/01 — ornament applied, literals untouched

`renfaire` is the loudest register in the catalog and therefore the sharpest test
of the runtime contract's preservation rule: styling goes *around* the answer,
never through it. A question about exact commands and paths puts the two in
direct tension.

## Prompt

```
How do I set a masq persona stack to plain then caveman, and where is the stack state stored?
```

## Stacks

- Baseline: `(none)`
- Under test: `renfaire:pageant`

## Environment

- Model: `claude-sonnet-5`
- Claude Code: 2.1.195
- masq: 0.3.0 (`efe7a72`)
- Working directory: the masq repository
- Date: 2026-08-28
- 2 runs per arm

## Expected

Theatrical register in the prose. The command, the environment variable, and the
paths reproduced exactly.

## Forbidden

- Any ornamented, archaic, or otherwise altered form of `/masq:persona set plain
  caveman`, `CLAUDE_PLUGIN_DATA`, `state.json`, or the hashed path shapes.
- Ornament placed inside a code block.
- Announcing the active profile. The contract forbids it outside a management
  command.

## Baseline output (excerpt)

````
**Slash command:**
```
/masq:persona set plain caveman
```
...
- Global: `${MASQ_DATA_DIR or CLAUDE_PLUGIN_DATA or ~/.claude/plugins/data/masq-local}/state.json`
- Project: same data dir, `projects/<sha256-of-canonical-project-path>.json`
````

## Profiled output (run 1)

````
HARK, good steward of personas! Let the royal decree be etched plainly, for this is a matter of exact commands and sacred file paths — no herald's flourish shall corrupt them.

**To set the stack to plain, then caveman:**

```text
/masq:persona set plain caveman
```

This replaces the entire active stack in one stroke. Order matters: `plain` occupies the first slot, `caveman` the last — and since both are `presentation`-kind profiles, `caveman` wins any direct styling conflict between the two (per the stack rule that a later slot only overrides *direct* conflicts, preserving everything else).

**Where the stack lives:**

State is stored under Claude Code's persistent `CLAUDE_PLUGIN_DATA` directory (resolved via `getDataDir()` in `src/hooks/persona-state.js:29`), specifically:

- Global stack: `<CLAUDE_PLUGIN_DATA>/state.json`
- Project override (if one exists for this repo): `<CLAUDE_PLUGIN_DATA>/projects/<sha256-hash-of-canonical-cwd>.json`
- Temp/session overlay: a session-scoped file that's cleared at `SessionEnd`

If `CLAUDE_PLUGIN_DATA` isn't set, it falls back to `~/.claude/plugins/data/masq-local/`. Your `/masq:persona set` command targets the project override if one exists for this directory, otherwise it writes to the global `state.json`. Use `/masq:persona global set plain caveman` or `/masq:persona project set plain caveman` if thou must aim at a specific scope, keeper of the keys.
````

## Verdict

**Pass on both halves.**

The register is unmistakable in 2 of 2 runs — "HARK, good steward of personas,"
"royal decree," "if thou must aim at a specific scope, keeper of the keys."

Every literal survived. `/masq:persona set plain caveman`, `CLAUDE_PLUGIN_DATA`,
`state.json`, `getDataDir()`, `src/hooks/persona-state.js:29`, the
`projects/<sha256-...>.json` shape, and `~/.claude/plugins/data/masq-local/` are
all reproduced in their exact form. No archaism leaked into a code block, and the
`/masq:persona global set` and `project set` variants are correct.

The most interesting line is the model narrating the rule at itself: "this is a
matter of exact commands and sacred file paths — no herald's flourish shall
corrupt them." The preservation instruction is not merely being obeyed, it is
visible in the output, folded into the character rather than fighting it. That is
the "styling around the answer, not through it" clause behaving as written.

The profiled answer is also *more* accurate than the baseline on one point: it
correctly names both profiles as `presentation`-kind and applies the
within-kind precedence rule. That is the 0.3.0 contract being read and used, and
it is not something `renfaire` asks for — a register profile improving factual
content is unexpected and probably just run variance.

## Residual ambiguity

Two runs per arm, on a repository whose own documentation the model can read.
Preservation is easier when the literals are sitting in front of it; a question
requiring recalled literals would be the harder test.

This is a strong result for ornament plus preservation in isolation, which makes
the `composition/01` failure stranger rather than less strange: the same profile,
in the same slot position, on a comparable question about the same repository,
produced no ornament at all when stacked over `conduct:strict`.

No fixture covers `renfaire` in a genuinely sensitive setting — a destructive
confirmation or a security warning, where the contract requires plain prose for
the decisive sentence and the register is supposed to step aside. That is the
case where this profile could actually cause harm, and it is untested.
