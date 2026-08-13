# ADR 0002: Discover Profiles from the Filesystem

- Status: Accepted
- Date: 2026-08-12

## Context

A central profile registry would require every new profile to modify runtime code or a shared manifest, creating unnecessary merge conflicts and duplication.

## Decision

Discover profile definitions from regular `profiles/*.md` files. Ignore files whose names begin with `_`. Require each filename to match its declared lowercase kebab-case ID.

## Consequences

- Adding a profile is one-file work.
- Validation must detect duplicate IDs, aliases, and variant declarations.
- Profiles remain declarative and cannot execute code.
