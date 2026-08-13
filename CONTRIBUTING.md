# Contributing

## Setup

Masque requires Node 18 or newer and has no external npm dependencies.

```bash
git clone https://github.com/mdn87/masque.git
cd masque
npm test
```

## Add a Persona Profile

```bash
npm run new-profile -- profile-id "Display Name"
```

Edit the generated file under `profiles/`, follow `docs/PROFILE_FORMAT.md`, and run `npm test`.

## Pull Request Requirements

- Keep changes scoped.
- Add or update tests for runtime behavior.
- Update command documentation when command syntax changes.
- Preserve the quiet-by-default behavior.
- Do not weaken exact-content preservation or profile scope boundaries.
- Do not add a profile registry. Discovery remains filesystem-based.

## Commit Style

Use Conventional Commits where practical:

```text
feat: add noir detective profile
fix: preserve stack across resume
refactor: isolate profile token parsing
docs: clarify profile precedence
```
