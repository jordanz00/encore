# Security Policy

## Reporting a vulnerability

**Do not open a public issue for security vulnerabilities.**

Email `security@encore.audio` with:

- A clear description of the vulnerability
- Steps to reproduce
- Affected version(s)
- Your assessment of the impact
- (Optional) Suggested fix

If you prefer encrypted email, our PGP key fingerprint will be published once the project domain is live.

## Response targets

| Stage | Target |
|---|---|
| Acknowledgement | within 48 hours |
| Initial assessment + severity rating | within 7 days |
| Fix in main branch | depends on severity (Critical: ≤14 days; High: ≤30 days; Medium/Low: ≤90 days) |
| Public disclosure | 90 days from initial report, or sooner if fix is published |

## Disclosure process

1. We acknowledge your report.
2. We confirm and rate severity.
3. We develop a fix in a private branch.
4. We coordinate a release date with you.
5. We publish a GitHub Security Advisory and request a CVE.
6. We credit you in the advisory (unless you prefer otherwise).

## Scope

In scope:

- All code under this repository (apps, packages, infra)
- Default deployment configurations
- Dependencies we ship (lockfile-pinned)

Out of scope:

- Third-party services we recommend (Stripe, Cloudflare, etc.) — report to the vendor
- Self-hosted deployments with significant configuration drift from defaults
- Social engineering, phishing of community members
- Issues already known and tracked publicly

## Hall of fame

Researchers who responsibly disclose are acknowledged in our security advisories and (with consent) in this file.

## Security defaults

Encore ships with security defaults that protect operators:

- AGPL-3.0 license — modified hosted versions must publish source.
- HTTPS-only in production (no plaintext fallback).
- Cookies: `httpOnly`, `secure` in production, `sameSite=lax`.
- Helmet HTTP headers on the API by default.
- Rate limiting on the API by default (300 req/min per IP, configurable).
- CORS allowlist (no `*` in production).
- No third-party trackers loaded by the web frontend.
- File uploads scoped via presigned PUT to a separate `uploads` bucket.
- All session tokens hashed (SHA-256) before storage.

## Common pitfalls

- Setting `AUTH_TRUST_HOST=true` while running behind an unverified reverse proxy.
- Exposing MinIO admin (`:9001`) on the public internet.
- Leaving `MEILI_MASTER_KEY` at its dev placeholder.
- Loading user-supplied audio URLs into the worker without revalidating against the upload manifest.

See `docs/roles/role-29.md` (anti-abuse) and `docs/rfcs/008-funding-governance.md` (security disclosure policy) for additional context.
