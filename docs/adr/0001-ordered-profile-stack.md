# ADR 0001: Use an Ordered Profile Stack

- Status: Accepted
- Date: 2026-08-12

## Context

A single persona toggle cannot combine independent concerns such as voice, domain posture, workflow, and contextual boundaries. A flat set also cannot resolve direct conflicts deterministically.

## Decision

Store active profiles as an ordered array of canonical `{ id, variant }` entries. Apply profiles from first to last. A later profile wins only direct style conflicts while earlier non-conflicting traits remain active.

## Consequences

- Composition order is visible and deterministic.
- Reordering can change presentation without rewriting profiles.
- Profiles must state scope and compose without claiming authority over other instructions.
- The runtime must preserve order across persistence and canonicalization.
