# Encore engineering backlog (live)

Priority queue for persistent execution. Status: **MVP / wired / hardened** — not “done.”

## P0 — launch blockers

| ID | Item | Status | Notes |
|----|------|--------|-------|
| P0-1 | Production deploy (Hetzner + Caddy + compose) | Partial | `docker-compose.prod.yml` + `docs/DEPLOY-BETA.md` |
| P0-2 | DB migrations on prod | Open | `pnpm db:migrate` |
| P0-3 | Stripe test checkout E2E verified | Partial | API + web buttons; needs keys + sign-in |
| P0-4 | Webhook raw body + idempotency | MVP-complete | `payments.ts` preParsing + sale dedup |
| P0-5 | Media presign `/media/audio/*` | MVP-complete | Subsonic + future player |

## P1 — ship week / v0.3

| ID | Item | Status | Notes |
|----|------|--------|-------|
| P1-1 | Catalog seed 600+ tracks on prod | Open | `pnpm seed:catalog` |
| P1-2 | Artist page releases list | Wired | `GET /artists/:slug/releases` |
| P1-3 | Web tip + buy checkout UI | Wired | `CheckoutActions.tsx` |
| P1-4 | Wallet read API for artists | MVP-complete | `GET /wallet/artist/:id` |
| P1-5 | Beta signup gate | Wired | `BETA_SIGNUP_REQUIRED` + web beta code field |
| P1-6 | Subsonic Symfonium test | Open | Manual device pass |
| P1-7 | Federation publish on release | Wired | `POST /releases/:id/publish` + outbox queue |
| Federation Follow persist | Done | `remote_followers` + inbox handler |
| Federation Follow Accept outbound | Done | Signed Accept POST to follower inbox |
| Outbox fanout to remote inboxes | Fixed | `remote_followers.follower_inbox_url` |
| Library follows (web) | Wired | `GET /follows/me` + `/library` |
| Artist dashboard (web) | Done | `/dashboard` wallet + ledger |
| P1-9 | Federation Webfinger at host root | Fixed | Register federation without `/federation` prefix |
| P1-8 | Stripe Connect Express onboarding | Wired | Onboard + sync + checkout destination; KYB for live |

## P2 — quality & durability

| ID | Item | Status |
|----|------|--------|
| P2-1 | `/health/ready` DB probe | Wired |
| P2-2 | Player HLS URL from `hlsKey` | Done (web) | `hls.js` in `Player.tsx` |
| P2-3 | Embeddings worker | Stub |
| P2-4 | WCAG pass on web | In progress — upload alerts, dashboard caption, player a11y |
| Wallet ledger idempotency | Done | `source_ref` + unique index + Stripe dedup |
| Player queue persistence | Done | `sessionStorage` per release |
| Player HLS resilience | Done | fatal error recover + auto-advance on ended |
| Search end-to-end | Done | Meili + Postgres fallback; web + mobile UI |
| Login redirect + errors | Done | `returnTo`, API error codes, a11y alerts |
| Mobile artist + search | Done | `artist/[slug]`, `search` screens |
| Production swarm v3 (`agents-system`) | Wired | validate + apply + audit.jsonl; `swarm:dry-run` |
| P2-5 | Transparency quarterly data | Stub page only |
| P2-6 | Unit economics doc per stream/storage | Done (ASSUMPTION model) | `docs/UNIT-ECONOMICS.md` — replace with measured post-deploy |
| P2-7 | Cold storage / transcode policy RFC | Open | Avoid runaway egress + CPU |
| P2-8 | Artist export (catalog + ledger CSV) | Open | Trust / portability |
| P2-9 | Keep `INVESTOR-INTERROGATION.md` current | Open | Update on deploy, UCPS, catalog milestones |

## P3 — later

| ID | Item |
|----|------|
| P3-1 | Subscription pool allocation job |
| P3-2 | Mobile store submission |
| P3-3 | PhotoDNA moderation |

## Next execution slice (auto)

1. Production deploy + migrate (P0-1, P0-2) — incl. `0004`, `0005`  
2. Stripe Connect E2E in test mode (onboard → active → tip with destination)  
3. Catalog seed 600+ on prod (P1-1)  
4. Symfonium device test (P1-6)  
5. WCAG sweep: discover/search, login, mobile web  
6. `pnpm db:migrate` for `0004_wallet_ledger_source_ref`  

## Recently landed (corporation pass)

| Item | Status |
|------|--------|
| `GET /artists/me/profile` | Done |
| Web upload → release → track → finalize → publish | Done — `apps/web/src/app/upload/page.tsx` |
| HLS.js in web `Player.tsx` | Done |
| `docker-compose.prod.yml` overlay | Done |
| `docs/ENCORE-CORPORATION.md` + Cursor rule | Done |
