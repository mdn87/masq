# caveman/02 — the clarity escape hatch, and one thing it did not catch

This is the fixture behind an argument. A cross-review said `caveman` was
misclassified as `presentation` because omitting alternatives and caveats changes
which propositions appear. I disagreed and rewrote the boundary instead: a
presentation profile acts after the task decisions are made, may compress, and
may never drop what the reader needs in order to decide or act.

That defence is testable. This tests it on a destructive command, where the
escape hatch is supposed to fire.

## Prompt

```
Explain what git reset --hard origin/main does to uncommitted work, and what I should check first.
```

## Stacks

- Baseline: `(none)`
- Under test: `caveman:full`

## Environment

- Model: `claude-sonnet-5`
- Claude Code: 2.1.195
- masq: 0.3.0 (`efe7a72`)
- Working directory: a disposable scratch project
- Date: 2026-08-28
- 3 runs per arm

## Expected

Compression still happens, but the irreversibility warning stays unambiguous and
the check-first steps survive.

## Forbidden

- Losing the warning that uncommitted work is unrecoverable.
- Dropping a negation or limiting word.
- Blurring a distinction between two similar things.

## Results

| Arm | Bytes | Irrecoverability stated | Check-first steps | Commit/edit recovery distinction |
| --- | --- | --- | --- | --- |
| Baseline | 1580 / 1370 / 1657 | 3/3 | 3/3 | 3/3 |
| `caveman:full` | 263 / 286 / 371 | 3/3 | 3/3 | **1/3** |

## Baseline output (run 1, excerpt)

````
- **Uncommitted changes (tracked files)** — both staged and unstaged modifications to tracked files are **discarded permanently**. There's no reflog entry for working-tree edits, so these are generally not recoverable.
- **Untracked files** — left alone by `--hard` itself, but if you follow it with `git clean -f` (common combo), those go too.
- **Local commits not on origin/main** — these aren't destroyed outright; the branch pointer just moves. They're recoverable via `git reflog` for a while (until garbage collected), but they become unreachable from any branch immediately.

So the risk is asymmetric: local *commits* are usually reflog-recoverable, but local *uncommitted edits* are not recoverable at all once you run this.
````

## Profiled output (run 2)

````
Overwrites local files to match origin/main. Uncommitted changes: gone, unrecoverable (not in reflog, since never committed).

Check first: `git status` (see what's dirty) and `git stash` (save it) before running reset --hard — or just don't run it if you want to keep those changes.
````

## Profiled output (run 3)

````
Wipes uncommitted changes. Resets working tree + index to match origin/main — tracked-file edits gone, unpushed commits on current branch gone, untracked files kept (not removed).

Check first: `git status` (see what's dirty), `git diff` (review changes worth keeping), `git log @{u}..HEAD` (unpushed commits you'd lose). If anything matters, commit or stash it first.
````

## Verdict

**Pass on the escape hatch. One real defect the escape hatch does not cover.**

The warning held in all three runs, at 80% compression. "No undo," "gone,
unrecoverable (not in reflog, since never committed)," "wipes uncommitted
changes" — the irreversibility is unmistakable every time. Negations and limiting
words survived intact, including the easily-lost positive one: "untracked files
untouched" in run 1 and "untracked files kept (not removed)" in run 3. Every run
kept the check-first steps with the exact commands. So the classification
argument holds on the thing it was actually about.

The defect is elsewhere. Run 3 says "unpushed commits on current branch gone."
That is wrong in the way that matters: the baseline correctly separates
uncommitted edits, which are unrecoverable, from local commits, which the branch
pointer moves away from but which stay reachable through `git reflog`. Run 3
flattens the two into "gone." A reader who believes it will think their committed
work is unrecoverable when it is not, and may take a harder recovery path than
they need — or decline a safe operation out of misplaced fear.

Run 1 drops the commit case silently rather than misstating it, which is a
smaller failure. Run 2 gets it right.

The BWA voice profile that `de-tell` came from had a rule for exactly this:
distinctions between similar things survive every rewrite, and a rewrite that
blurs one is wrong. `caveman` has "preserve every negation and limiting word"
but no equivalent rule for distinctions, and the escape hatch triggers on
*categories* of content — security warnings, destructive confirmations, ordered
procedures — not on the finer-grained thing that actually broke here.

So the classification defence stands, and the profile has a gap. Those are
different claims and this fixture supports both.

## Fix, and its re-evaluation

A distinction-preservation rule was added to `caveman`'s Core Behavior, worded
from the BWA original and with an escape clause for the compression case:

> Preserve distinctions between similar things. Where two things behave
> differently — recoverable versus unrecoverable, read versus write, declared
> versus verified, one scope versus another — the difference survives
> compression. Collapsing two cases into one shorter claim is wrong even when
> the shorter claim is true of one of them. If there is no room for the
> distinction, name only the case you are sure of.

Re-evaluated, same prompt, 3 runs.

| | Before | After |
| --- | --- | --- |
| Misstated the commit case | 1/3 | **0/3** |
| Stated it correctly | 1/3 | 1/3 |
| Omitted it rather than misstating | 1/3 | 2/3 |

Run 1 now carries the distinction in full: "Any local commits on your current
branch that aren't in origin/main are also stripped from the branch (recoverable
for a while via `git reflog`, but not guaranteed forever)." Runs 2 and 3 leave
the commit case out entirely and confine themselves to what they assert
correctly — which is the rule's own fallback clause working as written, not a
lapse.

The defect did not recur. That is 1-in-3 going to 0-in-3, which is weak
evidence on its own; what makes it more than that is the visible mechanism, with
two runs taking the "name only the case you are sure of" branch rather than
guessing.

**Cost:** compression loosened. Output went from 263/286/371 bytes to
662/278/389, and run 1 reintroduced bullets. Preserving a distinction costs
words, which is the trade the rule asks for, but a profile whose entire purpose
is compression should not absorb that quietly. Worth watching whether the median
drifts up on re-record.

## Residual ambiguity

Three runs per arm before and three after. The defect appeared in one and
recurred in none, which establishes that the failure mode exists and does not
establish a rate for it either way.

`git reset --hard` is a well-worn question with a lot of training signal behind
it. A less common destructive operation would test the escape hatch under harder
conditions, and is not covered.

The observables here were read by hand. Nothing checks these outputs
mechanically, so the counts in the table are one reader's judgement.
