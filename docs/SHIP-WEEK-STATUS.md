# Ship week — implementation status

> Living tracker for [`SHIP-PLAN-7-DAYS.md`](../SHIP-PLAN-7-DAYS.md). Updated by engineering passes — not a launch guarantee.

## Code landed (this repo)

| Item | Status | Notes |
|------|--------|-------|
| Waitlist `POST /waitlist` + DB table | Done | `waitlist_entries`; landing form wired |
| Beta invite codes + gated signup | Done | Set `BETA_SIGNUP_REQUIRED=true`; seed adds `ENCORE-BETA-*` |
| Health `/health/version` + `GIT_SHA` | Done | Ship checklist SHA probe |
| Subsonic MVP `/rest/*` | Done | ping, getArtists, getAlbumList2, getAlbum, stream, getCoverArt, scrobble |
| Wallet ledger module | Done | `apps/api/src/lib/wallet-ledger.ts` append-only |
| Stripe checkout + webhook scaffold | Done | Needs `STRIPE_*` env; webhook needs raw body in prod |
| Landing beta CTA + guarantee link | Done | `data-encore-beta-cta`, `data-encore-guarantee-link` |
| Legal pages (beta templates) | Done | `legal/terms.html`, `privacy.html`, `acceptable-use.html` |
| DB migration `0001_waitlist_beta` | Done | Run `pnpm db:migrate` |
| Media presign `/media/audio/*` + `/media/images/*` | Done | Player + Subsonic use API redirects |
| Artist releases API + web artist page | Done | No more “coming soon” releases |
| Web checkout (tip + buy) | Wired | Needs auth cookie + Stripe keys |
| `POST /releases/:id/publish` + outbox queue | Wired | `ENABLE_ACTIVITYPUB=true` |
| Federation at host root (`/users`, Webfinger) | Fixed | Was incorrectly under `/federation` prefix |
| Stripe webhook raw body + idempotency | MVP-complete | `paymentRef` dedup |
| `/health/ready` DB probe | Done | Returns 503 if DB down |
| Legal + press + transparency pages | Expanded | Honest beta copy |
| `docs/BACKLOG.md` + `docs/DEPLOY-BETA.md` | Done | Live priority queue |

## Still human / infra (not automatable here)

| Item | Status |
|------|--------|
| Domain `encore.audio` + DNS | Pending |
| Hetzner + Caddy production deploy | Pending |
| Stripe Connect KYB live mode | Pending (1–3 weeks) |
| `pnpm seed:catalog` ×600 on production DB | Pending |
| 5 cornerstone artists onboarded | Pending |
| Mastodon interop verification | Pending |
| Symfonium / play:Sub device test | Pending |
| NLnet NGI0 proposal filed | Pending |
| Status page `status.encore.audio` | Stub only |

## Verify locally

```bash
cd ~/Desktop/encore
pnpm compose:up
export DATABASE_URL=postgres://encore:encore@localhost:5432/encore
pnpm db:migrate
pnpm db:seed
pnpm --filter @encore/api dev
```

```bash
curl -s http://localhost:3001/health/version
curl -s -X POST http://localhost:3001/waitlist -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","role":"artist"}'
curl -s 'http://localhost:3001/rest/ping.view?f=json'
```

## Honesty

- Demo player `+$0.024/play` remains **UX illustration** until transparency reports ship.
- Payments return `501` until `STRIPE_SECRET_KEY` is set.
- Subsonic stream URLs assume `CDN_BASE_URL` or API public URL + `/audio/{key}` — align with your CDN in production.
