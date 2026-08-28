# Security Policy

## Supported Version

Security fixes target the current `main` branch until tagged releases begin.

## Reporting

Report security issues privately to the repository owner rather than opening a public issue when the report includes an exploitable path, sensitive local file access, prompt-context injection from untrusted state, or unsafe hook execution.

## Security Boundaries

Masq treats profile and state files as local input but still validates them defensively:

- state and profile files must be regular files, not symlinks
- state, preset, and profile sizes are capped
- profile IDs, aliases, and variants are restricted to lowercase kebab-case
- state writes use a temporary file and atomic rename
- project and session keys are SHA-256 hashes; no repository file receives plugin state
- hooks fail closed and do not interrupt Claude Code
- profile content is guidance bounded by its declared `kind` and cannot grant tool authority
- a conduct profile cannot widen a permission, lower a confirmation requirement, or skip a safety check; a policy profile can only tighten
- unknown or duplicate frontmatter fields fail profile loading, so a misspelled `kind` cannot silently classify a profile as presentation
