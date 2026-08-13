# Security Policy

## Supported Version

Security fixes target the current `main` branch until tagged releases begin.

## Reporting

Report security issues privately to the repository owner rather than opening a public issue when the report includes an exploitable path, sensitive local file access, prompt-context injection from untrusted state, or unsafe hook execution.

## Security Boundaries

Masq treats profile and state files as local input but still validates them defensively:

- state and profile files must be regular files, not symlinks
- state size and profile size are capped
- profile IDs, aliases, and variants are restricted to lowercase kebab-case
- state writes use a temporary file and atomic rename
- hooks fail closed and do not interrupt Claude Code
- profile content is presentation guidance and cannot grant tool authority
