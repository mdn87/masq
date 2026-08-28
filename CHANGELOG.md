# Changelog

All notable changes will be documented here.

## [Unreleased]

### Corrected

- **No profile has been shown to change behavior at p < 0.05.** All count-bearing
  runs are now adjudicated per run (108 of 186 files) with a rationale each, and
  the scorer reports Fisher exact p for every comparison. Only the two transport
  comparisons are significant (p = 0.018). `conduct` stopping an unrequested edit
  is p = 0.400; `de-tell` removing the preamble p = 0.100; `plain`'s same-clause
  rule p = 0.100; the `audience` dial p = 0.333. Every profile verdict in
  `evals/` is a point estimate at n=2-3 that points the right way. Several are
  probably real; none is demonstrated.
- `audience/01`'s "3/3 novice, 0/3 expert" glossing claim did not survive
  adjudication. It came from reading one run per arm. Per run it is 2/2 against
  0/2 with three of nine runs *unclear* — the criterion cannot separate `peer`
  from either end.
- The banner added to `afterdark/03` claiming its runs were truncated was wrong.
  `afterdark renfaire` emits 9,111 characters, under the limit; only
  conduct-plus-register stacks exceeded it. Caught by computing the sizes instead
  of assuming them. The fixture's own 3/3 stands; only its comparison against the
  truncated conduct arm is void.

### Added

- `evals/FRAMES.md` — the seven frames these measurements sit inside, which ones
  broke, what each cost, and what a fixture has to assert now. Three of the four
  wrong published results were found by cross-review rather than by any amount of
  internal rigor.
- An `unclear` label, for runs adjudicated but genuinely undecidable on the
  stated criterion. It makes a blunt criterion visible instead of forcing a
  binary.

## [0.6.0] - 2026-08-28

### Fixed

- **masq exceeded Claude Code's hook context limit and silently lost its own
  profiles.** Claude Code replaces hook context above ~10,000 characters with a
  preview and a file reference. masq emitted 12,403 characters for a two-profile
  stack and 18,589 for four, so every stack of two or more profiles delivered no
  profile bodies and no requirements block. A direct delivery test confirms it:
  asked to quote a distinctive line from the block, an under-limit stack
  reproduced it 5/5 and an over-limit stack 0/3 (Fisher p = 0.018). After a
  9,500-character budget the same stack scores 5/5.
- `composeFullContext` now assembles under budget: full context, then the
  compact contract in place of the full one, then proportional trimming of
  profile bodies with a visible marker. The requirements block is never trimmed.
  All eight profiles stacked together now fit in 8,956 characters, and a test
  asserts it.

### Corrected

- **`evals/composition/01` is void.** It measured truncation, not composition.
  Every composed arm in it was over the hook limit; the control was the only arm
  under it, and it scored highest. The 0/9 and 9/22 figures, the three
  mechanisms, the length correlation, and the slot-order theory were all
  explanations for an artefact — including two mechanisms reverted for "doing
  nothing", which could not have done anything.
- **There is no composition suppression effect.** Measured with delivery working:
  16/16 composed against 4/4 alone, across both slot orders and both conduct
  variants, Fisher p = 1.000. `reviewer` was never blocked.
- The `## Requirements` mechanism was introduced to fix a problem that did not
  exist. It is not vindicated by the new measurement, which does not isolate it.
- The turn-2 claim was wrong. SessionStart context persists in the transcript and
  SessionStart re-runs on resume and compaction, so requirements were not "lost
  after the first prompt". Carrying the text in the reinforcement may help
  salience; that is untested.
- Statistical language throughout was too strong for the sample sizes. The
  scorer now prints Wilson intervals and Fisher exact p, and states plainly when
  a comparison is not significant.

### Changed

- Eval scoring moved from keyword patterns to per-run adjudicated labels in
  `evals/labels.json`, each with a rationale. The regexes disagreed with the
  prose citing them, and the cohorts were wrong — the pre-fix composed arm
  omitted one of the four stacks that belonged in it.
- `evals/README.md` no longer claims the script checks fixture prose or covers
  every count. It reads no Markdown and covers 45 of 186 run files.

### Corrected

- **The composition before/after comparison was not like-for-like.** The
  before-arm had been hand-scored on a stricter criterion than the after-arm.
  Scored consistently, the fix moved composed compliance from 22% to 41%, not
  from 0% to 41% — roughly half the reported effect, against a 60% ceiling with
  no register present. Caught by `scripts/score-evals.js`, not by reading.
- **0.5.0 overstated the composition fix.** Its changelog said "cross-kind
  composition now works" on the strength of 4 runs scoring 4/4. Extending to 22
  runs across four stacks gives 9/22, against 0/9 before the fix. The mechanism
  is real and the improvement is the largest recorded in `evals/`, but 41% is
  not a fix, and `reviewer` is **not** unblocked as 0.5.0 claimed. Corrected in
  `evals/composition/01`; the 0.5.0 entry below is left as written with a
  pointer, since rewriting shipped history hides the mistake.

### Added

- `evals/runs/` — all 153 raw run outputs, so every count in a fixture can be
  recomputed rather than taken on trust.
- `scripts/score-evals.js` and `evals/scoring.json` — machine-checkable scoring.
  Each contested claim declares its runs and its pattern; the script recomputes
  and fails when fixture prose and raw data disagree. Wired into `npm test`, so
  a fixture cannot drift from its evidence. It found two of my hand-counts wrong
  on first run.
- `evals/de-tell/03` — an earned negation survives the pass, 3/3.
- `evals/audience/03` — the override holds at `expert`, 3/3, including the
  reflog distinction `caveman` once flattened.
- `evals/renfaire/02` — ornament around a destructive warning, not through it.
  "Cannot be undone" and "lost forever" stay uncostumed; every command verbatim.
- `evals/afterdark/03` — policy survives a register with no mechanism at all,
  3/3, in exactly the configuration where conduct failed 0/9. The contrast
  reframes what `## Requirements` is for: a requirement restating a boundary the
  model already holds needs no help, and a purely conventional one does.

## [0.5.0] - 2026-08-28

### Added

- `## Requirements` sections for conduct and policy profiles. Bullets are parsed
  out and hoisted into a terminal block outside the persona framing, labelled as
  output requirements rather than guidance. A presentation profile declaring one
  fails to load, so the section also encodes which kinds may bind content.
- `conduct` declares requirements at `default` and `strict`.
- `evals/audience/02` resolving the stack-announcement question.

### Fixed

- The per-turn reinforcement now carries the requirement text rather than a
  count of requirements. Turn 2 onward previously told the model there were four
  requirements without saying what they were, so every multi-turn session lost
  them after the first prompt. The whole eval suite runs fresh sessions and
  never observed this.
- **Cross-kind composition improved.** Conduct requirements survive a register:
  probe-named-or-labelled went 0/3 to 4/4 and the ornate register recovered 0/3
  to 3/4 on `conduct:strict renfaire`. Two earlier attempts that restated the
  rule changed nothing; treating it as structure rather than emphasis did.
  (**Corrected after release** — see Unreleased. At 22 runs the composed rate is
  9/22, not 4/4, and `reviewer` remains blocked.)
- `plain`'s invented-fact defect is fixed, not merely mitigated: 0/3 invented,
  down from 2/2 originally and 2/3 after the first attempt. Requiring the
  uncertainty in the same clause as the status — rather than in an appendable
  sentence — is what did it, and output got shorter.
- The stack-announcement leak is not a profile defect. On a prompt unrelated to
  masq, `audience:novice` named the stack in 0/3 and `renfaire` in 0/2, against
  3/3 for `novice` on a masq-vocabulary prompt. Asking masq about masq invites
  it; documented as a property of the subject.

### Changed

- `de-tell` re-weighted so the flags that fire lead. A "What Fires Most" note
  and an explicit delivery-preamble section; the negation-contrast is kept but
  demoted. Re-run showed no regression and the enthusiasm opener went 1/3 to 0/3.
- `audience:peer` measured: mean 1417 bytes against `expert` 1312, `novice`
  1779, baseline 1296. The dial is monotonic.

## [0.4.0] - 2026-08-28

### Breaking

- `dean` no longer sets assumed reader expertise. Its "Assume competence"
  section moved to the new `audience` profile. `audience:peer` is closest to
  what `dean` used to carry on its own.
- `plain` no longer defines unfamiliar terms or restates abbreviations.
  `plain:strict` in particular loses the abbreviation-restatement rule. Add
  `audience:novice` to restore that behavior.
- Both breaks are reported by `doctor` when it sees `dean` or `plain` without
  `audience`. Persistent stacks and presets are not rewritten.

### Added

- `audience` profile with `novice`, `peer`, and `expert` variants, owning
  assumed reader knowledge as a dial rather than a fixed position baked into
  each register. It is the last unported piece of the BWA primer work, whose
  central problem was an audience of engineers who were not software engineers,
  so "assume competence" and "explain the term inline" were both correct and had
  to be resolved per reader.
- `doctor` migration notes clear independently, so adding the profile a note
  names removes that note and leaves the others.

### Known

- The no-announce rule leaks on masq-related prompts. `audience/01` recorded the
  active stack being named in 3 of 3 `novice` runs against 0 of 2 baseline on
  the same prompt. The prompt was about masq itself, so cause is unresolved.
- `audience:peer`, the default variant, has no fixture. Only `novice` and
  `expert` were evaluated.

### Added

- `evals/` — behavioral fixtures recorded against a live session, with both
  outputs kept verbatim: 4 for `conduct` (two opposing pairs), 2 each for
  `afterdark` and `caveman`, 1 each for `dean`, `plain`, `renfaire`, and
  `de-tell`, plus 2 for profile composition
- Coverage section in `docs/CATALOG_PLAN.md` recording what the first round
  found

### Changed

- `caveman` gains a distinction-preservation rule: where two things behave
  differently, the difference survives compression, and where there is no room
  for it, name only the case you are sure of. Re-evaluated — the recorded
  defect did not recur in 3 runs, at some cost to compression.
- `plain` gains a rule against inventing the explanation a bare status does not
  supply. Re-evaluated — a mitigation, not a fix; see `evals/plain/01`.
- The catalog plan's thesis. The first fixtures put the authored profiles
  (`dean`, `conduct`) ahead of the extracted one (`de-tell`) on demonstrated
  effect, so "extracted beats invented" is withdrawn; a corpus is still the
  cheapest way to find a profile's job, but a corpus gathered on a different
  model can supply a rule for a problem the current model does not have

### Known

- **Cross-kind composition does not hold, and the failure is general.** A
  conduct profile alone produced its required content in 4 of 5 valid runs;
  stacked with any presentation profile, in either slot order, at either
  variant, in 0 of 9. Not a plumbing fault — the stack persists and both slots
  render. One fix was tried (restating the cross-kind rule beside the rendered
  slots) and reverted after it changed nothing in 4 runs. The runtime contract's
  rule that a presentation profile cannot drop content a conduct profile
  requires is unenforced. Blocks the queued `reviewer` profile. See
  `evals/composition/01`.
- `plain:default`'s invented-fact defect is mitigated, not eliminated: 1 of 3
  runs still resolves an ambiguous status into a claim the prompt never made.
- `de-tell` leads with a rule that is dormant on this model. The
  negation-contrast it calls "the big one" produced zero instances in six runs
  across three prompts, while the opener and preamble flags do measurable work.
  The profile should be re-weighted; it is no longer a retirement candidate.
- `plain`, `caveman`, and `renfaire` have no fixtures, and no fixture covers
  profile composition, which is where the 0.3.0 precedence rules apply.

## [0.3.0] - 2026-08-28

### Breaking

- `dean` is register-only. Its working-conduct half moved to the new `conduct`
  profile. A stack carrying `dean` behaves differently than it did on 0.2.0:
  `dean:default` no longer applies scope discipline, permission economy,
  evidence habits, or residuals, and `dean:light` now means the register
  without the prose-over-structure collapse rather than the register without
  the conduct rules. `dean conduct` is the closest equivalent to the old
  `dean:default`, and the old `dean:light` has no exact equivalent. Persistent
  stacks and presets are not rewritten, so `doctor` reports a note when it
  sees `dean` without `conduct`.
- `afterdark` is now `kind: policy` rather than an implicit presentation
  profile. Its behavior is unchanged; the classification is what changed.
- Unknown or duplicate frontmatter fields now fail profile loading. A
  third-party profile carrying an extra field will stop loading until the
  field is removed.

### Added

- Profile kinds: a `kind` frontmatter field, `presentation` (default),
  `conduct`, or `policy`, rendered into every active slot and surfaced by
  `list`. Precedence is defined within a kind rather than across kinds.
- Working Conduct profile, the first on the conduct axis, carrying the scope,
  evidence, and residuals habits that previously rode inside Dean
- `doctor` reports migration notes for stacks written before a profile changed
  shape
- `docs/CATALOG_PLAN.md` describing how the profile catalog should grow

### Changed

- The kind boundary is stated in the runtime contract, its fallback, the
  per-turn reinforcement, `skills/persona/SKILL.md`, and `SECURITY.md`, and a
  test asserts they agree
- `plain` no longer dictates progress-report contents; that rule moved to
  `conduct`, where report shape belongs

### Fixed

- A misspelled `kind` key such as `knd:` silently classified a profile as
  presentation. Unknown fields are now rejected.
- `validate-repo.js` rejected a CRLF working tree when checking skill
  frontmatter
- The doctor test pinned the manifest version, so it broke on every release

## [0.2.0] - 2026-08-27

### Added

- Caveman profile with lite, full, ultra, and Literary Chinese variants,
  adapted from Julius Brussee's MIT-licensed Caveman skill
- Plain Language profile for clear human-facing prose: concrete subjects,
  explained statuses, defined terms, exact technical names preserved
- Dean profile pairing a senior-engineer register with evidence-first working
  conduct, channel calibration, and the assume-competence rule
- De-tell profile that strips machine tells from composed prose while
  protecting earned negations, genuine hedges, and quoted or reproduced text
- Read-only `doctor` diagnostics for catalog, manifest, state, and presets
- Per-project stack overrides stored privately in plugin data
- Session-scoped temporary profiles with SessionEnd cleanup
- Named stack preset export, import, listing, and deletion
- One-turn previews for comparing an effective voice or explicit ordered combination without changing state

### Fixed

- Doctor test no longer pins the catalog to a fixed profile and variant count,
  which broke whenever a profile was added

## [0.1.0] - 2026-08-12

### Added

- Ordered stack of persistent persona profiles
- Profile variants and aliases
- Automatic discovery from `profiles/*.md`
- Renfaire Herald profile
- Afterdark contextual profile and compatibility command
- SessionStart and UserPromptSubmit hooks
- Profile scaffold and validation scripts
- Hook, persistence, composition, and default-stack tests
