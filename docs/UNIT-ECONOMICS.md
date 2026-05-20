# Unit economics & infrastructure model (beta assumptions)

**Purpose:** Answer investor and infra-engineer scrutiny with **explicit assumptions** — not live MAU claims. Update when production metering exists.

**Status:** Illustrative model (May 2026). Replace `ASSUMPTION` cells with measured values post-deploy.

Related: `docs/INVESTOR-INTERROGATION.md` Q1–2, Q16; RFC 006 overhead cap; `docs/DEPLOY-BETA.md`.

---

## 1. Architecture cost drivers (what you pay for)

| Driver | Beta posture | Scales with |
|--------|--------------|-------------|
| **Compute** | Single VPS (e.g. Hetzner CCX23 class) + API/worker processes | CPU on transcode queue, search indexing |
| **OLTP DB** | Postgres on same host or managed small instance | Rows, connection count, payout batch jobs |
| **Object storage** | S3-compatible (MinIO dev / Hetzner Object Storage prod) | Catalog GB, cover art, upload staging |
| **Egress** | Presigned GET to object storage / CDN | **Plays × bitrate × duration** (dominant variable) |
| **Transcode** | Worker + ffmpeg (upload → AAC/FLAC/HLS per schema) | **Minutes uploaded** (one-time per asset) |
| **Search** | Meilisearch | Index size, query QPS |
| **Payments** | Stripe Connect + webhooks | GMV (processor %, not Encore fee on artist sales) |
| **People** | T&S, support, editorial | Uploads, disputes, incidents — **not** automatable at scale |

Encore **does not** run a proprietary CDN network in beta; egress strategy = presign + optional CDN cache in front of bucket (P2-7).

---

## 2. Storage assumptions (per track)

| Asset | ASSUMPTION size | Notes |
|-------|-----------------|-------|
| Master upload | 40 MB | ~4 min FLAC-equivalent average |
| Served AAC 256 | 8 MB | Primary stream tier (RFC 006 free max) |
| HLS ladder | +30% | If all rungs kept |
| Cover art | 0.3 MB | WebP/JPEG |

**Catalog storage (illustrative):**

| Tracks | Raw + derivatives (ASSUMPTION) | Storage $/mo @ $0.023/GB |
|--------|--------------------------------|-------------------------|
| 600 (ship-week target) | ~35 GB | **~$1** |
| 50,000 | ~3 TB | **~$70** |
| 500,000 | ~30 TB | **~$700** |

Storage is **rarely** the first bankruptcy driver; egress and people are.

---

## 3. Bandwidth model (per listen)

Formula:

```
egress_GB ≈ (plays × avg_listen_seconds × bitrate_bps) / (8 × 10^9)
```

| ASSUMPTION | Value |
|------------|-------|
| Avg listen | 180 s (3 min) |
| Bitrate | 256 kbps AAC |
| **GB per play** | **~0.009 GB** (~9 MB) |

| Monthly plays (instance-wide) | Egress ASSUMPTION | Egress $ @ $0.05/GB |
|------------------------------|-------------------|---------------------|
| 100k | 900 GB | **$45** |
| 1M | 9 TB | **$450** |
| 10M | 90 TB | **$4,500** |

**CDN cache hit rate** (not measured yet): if 70% edge hits, divide egress bill by ~3.3 — **must be validated in prod**.

API presign traffic is negligible vs audio bytes.

---

## 4. Transcode cost (one-time per upload)

Beta: worker on same VPS — cost is **CPU time**, not a separate GPU farm.

| ASSUMPTION | Value |
|------------|-------|
| ffmpeg wall time | ~0.5× realtime (4 min track → 2 min CPU) |
| CCX23 sustained transcodes | ~2–4 parallel before listener latency suffers |

**Policy (P2-7):** queue uploads; cap concurrent transcodes; optional “FLAC only, transcode nightly” in lean funding mode.

**Do not** promise “AI mastering” or cloud transcoding marketplaces without a line item in this table.

---

## 5. Fixed monthly stack (beta instance)

Illustrative **single-region** hosted Encore (no salaries):

| Line item | ASSUMPTION USD/mo |
|-----------|-------------------|
| VPS (CCX23 class) | 45 |
| Object storage + backup | 15 |
| Domain, email, monitoring | 10 |
| Stripe fixed | 0 (pay-as-go) |
| **Subtotal infra** | **~70** |

Adding **one** part-time maintainer ($3k/mo) dominates → **grants/donations required** until subscription overhead scales (RFC 008). This is intentional.

---

## 6. How 0% platform fee closes the books (honest)

| Revenue line | Who pays | Beta status |
|--------------|----------|-------------|
| Artist sales / tips | Stripe % from artist | **Wired** (0% Encore in schema intent) |
| Subscription **platform overhead** | Listener (≤10% of net per RFC 006) | **Not live** — UCPS job stub |
| Grants / donations | Patrons | **Pipeline** RFC 008, NLnet pending |

**Illustrative overhead math (NOT live pricing promise):**

- Premium **$9.99/mo**, Stripe ~3% → net ~$9.69  
- Platform overhead **10%** → **~$0.97 / subscriber / month** to fund ops (upper bound per RFC)

| Monthly ops need (ASSUMPTION) | Subscribers at $0.97 overhead |
|------------------------------|-------------------------------|
| $500 (infra only) | ~515 |
| $5,000 (infra + part-time) | ~5,150 |
| $25,000 (small team) | ~25,800 |

**Conclusion under scrutiny:** Early years **must** be grant/donation-backed; subscriptions are **long-run** sustainability, not day-one proof. Saying otherwise fails the Shark Tank test.

---

## 7. Scale breakpoints (engineering view)

| Scale | First pain | Mitigation |
|-------|------------|------------|
| **10k MAU** | DB connections; egress surprise | Pooling, metrics, CDN |
| **100k MAU** | Egress $; payout batch; support queue | UCPS in warehouse; tier-1 macros |
| **1M MAU** | Moderation headcount; multi-region | Federation sharding; cold archive; **not beta** |

---

## 8. Moderation economics (do not hand-wave)

| Volume ASSUMPTION | Human minutes | @ $40/hr loaded |
|-------------------|---------------|-----------------|
| 100 uploads/day, 2 min review | 200 min/day | **~$130/day** |
| 1,000 uploads/day | — | **unsustainable without automation + caps** |

Beta posture: **invite-only**, low upload velocity, DMCA agent on file — see `legal/acceptable-use.html`. Open signup without automation = **kill-shot** in interrogation Q7.

---

## 9. Failure modes (what investors will attack)

| Attack | Response |
|--------|----------|
| “Egress eats you” | Model in §3; CDN cache; cap free tier bitrate; federation offloads some discovery traffic |
| “Transcode cluster costs millions” | Queue on VPS; defer HLS; RFC P2-7 |
| “0% fee means no revenue” | Overhead on **subscriptions** + grants; direct sales are **trust**, not ops funding |
| “Spotify scales economics” | We do not pro-rata; we accept **smaller** listener pool with **higher** artist trust |
| “Show me runway” | §5–6 + actual bank balance — **not in repo**; do not invent |

---

## 10. What to measure post-deploy

| Metric | Source |
|--------|--------|
| Egress GB / day | Object storage billing |
| Storage GB / catalog | Bucket metrics |
| Transcode queue depth | Worker metrics |
| Cost per 1k plays | Derived |
| Support tickets / 1k MAU | Zendesk or equivalent |
| Payout job duration | Job logs |

Replace ASSUMPTION tables with a **“Measured”** column in this doc after 30 days on `beta.encore.audio`.

---

## Scrutiny verdict (beta)

| Question | Verdict |
|----------|---------|
| Can a **foundation + grants** run beta infra? | **Yes** (~$70/mo infra + labor via grants) |
| Can subscriptions alone fund a **team** at 5k MAU? | **No** — unless ARPU and overhead prove otherwise |
| Is the model **honest** vs Spotify? | **Yes** — different cost structure, different scale expectations |
| Is this doc **proof**? | **No** — it is structured reasoning until metering ships |
