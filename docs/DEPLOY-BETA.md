# Beta deployment (Hetzner + Caddy)

MVP runbook for `beta.encore.audio`. Assumes Docker on a single CCX23 (Frankfurt).

**Compose:** base `infra/docker/docker-compose.yml` + production overlay `infra/docker/docker-compose.prod.yml` (api, web, worker images).

## 1. Server

- Ubuntu 24.04, Docker + Compose plugin
- Clone repo, copy `.env.example` → `.env` (production secrets via host env, not git)

## 2. Required env (production)

```bash
DATABASE_URL=postgres://...
REDIS_URL=redis://...
S3_ENDPOINT=...
STRIPE_SECRET_KEY=sk_test_...   # until KYB: test mode
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_COUNTRY=US
# Stripe Dashboard → Webhooks: checkout.session.completed, account.updated
WEB_PUBLIC_URL=https://beta.encore.audio
API_PUBLIC_URL=https://beta.encore.audio
NEXT_PUBLIC_API_URL=https://beta.encore.audio
GIT_SHA=$(git rev-parse HEAD)
ENABLE_ACTIVITYPUB=true
ACTIVITYPUB_BASE_URL=https://beta.encore.audio
BETA_SIGNUP_REQUIRED=true
```

## 3. Migrate + seed

```bash
pnpm db:migrate
pnpm db:seed
pnpm seed:catalog -- --source=all --limit=200   # repeat per source for 600+
```

## 4. Caddy (example)

```caddyfile
beta.encore.audio {
  reverse_proxy /rest/* 127.0.0.1:3001
  reverse_proxy /media/* 127.0.0.1:3001
  reverse_proxy /health/* 127.0.0.1:3001
  reverse_proxy /waitlist 127.0.0.1:3001
  reverse_proxy /auth/* 127.0.0.1:3001
  reverse_proxy /payments/* 127.0.0.1:3001
  reverse_proxy /* 127.0.0.1:3000
}
```

## 5. Verify

```bash
curl -s https://beta.encore.audio/health/version
curl -s https://beta.encore.audio/health/ready
```

## Honesty

- This is a **single-node** beta layout, not HA.
- Live Stripe payouts require Connect KYB (weeks).
- Run security review before open signup without beta codes.
