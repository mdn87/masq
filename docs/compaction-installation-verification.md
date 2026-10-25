# Temporary personas and installed-plugin continuity

Verified October 25, 2026, against source `d089cdc` and plugin version 0.8.0.

A previous macOS report described temporary personas disappearing after context
compaction. The current hook preserves the temporary stack on a SessionStart
event whose source is `compact` or `resume`, rebuilds the effective stack and
emits its full context. Startup, clear and SessionEnd have different cleanup
semantics. Do not infer a current compaction defect from a historical voice
fallback alone.

## Verification and repair

The macos-primary registration enabled `masq@masq` at version 0.3.0, but its
registered cache directory did not exist. The configured directory marketplace
contained version 0.8.0. All 28 tracked runtime, manifest, skill and profile files
matched canonical source after line-ending normalization.

The official `claude plugin update masq@masq --scope user --json` command restored
the registered cache at 0.8.0. A rollback snapshot of the original registration
was retained locally. All 49 existing persona-state JSON files retained their
hashes through installation and isolated verification; no active selection was
changed and no running session was restarted.

Tests against the installed launcher/hooks, using explicit isolated
`MASQ_DATA_DIR`, plugin root and empty default/reset overrides, established:

- No persona is active by default.
- Two consecutive `compact` events and `resume` preserve the temporary stack
  and the last delivered effective stack.
- Another session does not inherit or clear that selection.
- SessionEnd clears the temporary selection; a later resume does not revive it.

The proof first sends an ordinary prompt after the selection command. Management
commands change selection without recording it as delivered; the ordinary prompt
sets `lastEffective`. Treating that deliberately empty field as a compaction
regression would be a test error.

The repository adds repeated-compaction and cross-session regression assertions
to its existing lifecycle suite. `npm test` passes on Windows, and the native
Claude plugin harness passes all four tests on Windows and macOS with Claude
Code 2.1.296. Plugin validation passes with existing advisory warnings.

## What this does not establish

The missing installation is a verified current defect, not a proven explanation
for the earlier incident. These are deterministic hook and native-module proofs,
not a live model `/compact` or audible voice acceptance result. They do not
establish statistical profile effectiveness.

An existing session pinned to a pre-0.7.0 hook needs one fresh launch to use the
launcher introduced in 0.7.0. Updating the registry cannot execute a hook in a
missing pinned directory. Start a fresh session when convenient, then check
`/masq status` or `/masq:persona doctor`; preserve active work before restarting.
Do not overwrite session state or clear unrelated personas to force activation.

If another installation reports the same symptom, first compare its registered
path and manifest version with the actual files. Use the official update command
and verify the resulting hooks with isolated state before changing runtime code.
