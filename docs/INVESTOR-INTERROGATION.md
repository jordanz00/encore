# Investor & operator interrogation — top 20 (honest beta)

Living document. **Status key:** **Defensible** = argument + repo evidence; **Partial** = direction right, implementation incomplete; **Gap** = not built or not proven; **Risk** = known weakness under scrutiny.

Last aligned with ship-week tracker: `docs/SHIP-WEEK-STATUS.md`.

---

## Business viability

### 1. Why will this survive financially?

**Answer:** Hybrid public-good funding — grants + recurring donations + subscription overhead (≤10% target per RFC 006) + optional ethical tooling — **not** artist extraction. Direct sales/tips at **0% Encore fee** shift ops cost to listener subscriptions and foundation patronage.

| Status | **Partial** |
| Evidence | `docs/rfcs/008-funding-governance.md`, `docs/rfcs/006-payments-payouts.md` |
| Scrutiny kill-shot | “Show 18 months runway at 5k MAU with real egress bills.” → **Partial:** modeled in `docs/UNIT-ECONOMICS.md` (ASSUMPTION labels); **Gap:** live metering post-deploy. |

### 2. Why won’t infrastructure costs collapse you?

**Answer:** Lean topology: single-region VPS + Postgres + S3-compatible object storage + presigned streaming (no always-on transcode farm in beta). Scale path is cache + cold storage policy, not hyperscaler sprawl.

| Status | **Partial** |
| Evidence | `docs/DEPLOY-BETA.md` (CCX23 compose); presign routes in API |
| Scrutiny kill-shot | “Model $/GB/month at 100k DAU.” → **Partial:** egress table §3 in `UNIT-ECONOMICS.md`; **Gap:** CDN hit rate unmeasured (P2-7). |

### 3. How does 0% platform fee sustain operations?

**Answer:** **By design** artist direct revenue is not taxed; **subscription net** and **grants** fund staff/infra. Stripe processor fees remain on artist (Bandcamp-class). Platform overhead on subscriptions capped in RFC 006 (~≤10% of net).

| Status | **Defensible** (model) / **Gap** (live pools) |
| Evidence | RFC 006; `wallet_ledger`; landing copy labels demo rates |
| Scrutiny kill-shot | “Prove overhead % on real statements.” → transparency reports **stub** (`transparency/`). |

### 4. What are durable revenue streams?

**Answer:** (1) Listener subscriptions UCPS when live, (2) tips/sales volume driving Stripe Connect attach (processor only), (3) NLnet/MOSS/STF grants, (4) GitHub Sponsors / Open Collective, (5) future foundation grants — **not** ads surveillance or token speculation.

| Status | **Partial** |
| Evidence | RFC 008 funding pipeline; checkout scaffold |
| Scrutiny kill-shot | “Subscriptions without catalog depth = churn.” → catalog seed **open** (P1-1). |

### 5. What prevents another failed artist platform?

**Answer:** Structural differences: append-only ledger, published allocation methodology, federation exit, AGPL copyleft, no payola, no 1k-stream cliff in charter — **if** governance and transparency ship as documented.

| Status | **Partial** |
| Evidence | `ARTIST-ECONOMICS.md`, charter non-negotiables |
| Scrutiny kill-shot | “Execution risk — still pre-prod deploy.” → **Gap** P0-1. |

### 6. Why won’t incumbents crush this instantly?

**Answer:** They **can** copy UX; harder to copy **foundation + AGPL network copyleft + federated graph + artist trust after payouts publish**. Moat is **credibility + portability**, not secret algorithms.

| Status | **Defensible** (strategy) / **Gap** (scale) |
| Scrutiny kill-shot | “No catalog = no listener habit.” → cornerstone artists **pending**. |

### 7. What if growth outpaces moderation/support?

**Answer:** Must cap ingest rate, require verified artists in beta, queue human review — **not** “community moderation” alone. PhotoDNA / T&S **P3** — honest stub.

| Status | **Gap** |
| Evidence | `acceptable-use.html`; BACKLOG P3-3 |
| Scrutiny kill-shot | “Open upload at 100k users without T&S = legal suicide.” |

### 8. What happens in low funding periods?

**Answer:** Read-only mode, freeze features, federation + self-host still work on AGPL fork; reduce transcode scope; grant bridge (RFC 008). No VC cliff by design.

| Status | **Partial** |
| Evidence | `docs/SUSTAINABILITY.md`; RFC 008 Phase 0–1 BDFL + council path |

---

## Product defensibility

### 9. Why can’t Spotify copy user-centric payouts?

**Answer:** They **can** technically; incentive conflict (pro-rata pool economics). Encore aligns **org structure** with UCPS — foundation, transparent reports, no dual-class stock pressure.

| Status | **Defensible** (incentive) / **Partial** (product proof) |

### 10. Why can’t Bandcamp rebuild this?

**Answer:** Bandcamp already wins **direct sales**; Encore adds **streaming + federation + subscription pool + open stack**. Compete on **interoperability and listener habit**, not replacing Bandcamp checkout.

| Status | **Partial** — streaming + Subsonic **MVP**, not habit-forming yet |

### 11. What structural advantage exists?

**Answer:** Trust + structure + interoperability stack (see `docs/ADVERSARIAL-FOUNDER.md` advantages). Not data moat or exclusive catalog.

| Status | **Partial** until transparency + export ship |

### 12. Why does federation matter strategically?

**Answer:** Distribution without lock-in; other instances carry social graph load; artists retain audience on migration (ActivityPub). Reduces single-company enshittification surface.

| Status | **Partial** — publish + Webfinger **wired**; remote inbox **open** (BACKLOG) |

### 13. Why does foundation ownership matter economically?

**Answer:** No exit-driven fee creep; grants align with public good; RFC 008 phases reduce BDFL key-person risk.

| Status | **Partial** — foundation **proposed**, not incorporated |

### 14. Why is AGPL a moat not a liability?

**Answer:** Network copyleft forces SaaS operators to contribute back or run isolated forks; **MIT SDK** for clients. Moat = **commons velocity**, not secrecy.

| Status | **Defensible** with OSS critic caveat: “AGPL doesn’t stop AWS clone with clean-room API.” → compete on **brand trust + federation hub**.

### 15. Why will artists trust this long term?

**Answer:** Auditable schema (`platform_fee_cents = 0`), ledger, quarterly transparency, export — **when live**. Today: honest beta labels.

| Status | **Partial** — trust **earned**, not claimed (P2-5, P2-8) |

---

## Operational reality

### 16. What breaks at 10k / 100k / 1M users?

| Scale | Likely first break | Mitigation direction |
|-------|-------------------|----------------------|
| **10k** | Single DB CPU; egress bill surprise | Connection pool, CDN cache on presign, metrics |
| **100k** | Object storage $; payout job duration; support tickets | Warehouse UCPS batch (RFC 006); tier-1 playbooks |
| **1M** | Moderation staffing; multi-region latency | Federation sharding; cold archive; **not** beta scope |

| Status | **Partial** — architecture named; load tests **Gap** |

### 17. What requires human moderation vs automation?

| Human | Automated (target) |
|-------|-------------------|
| DMCA disputes, repeat infringers | Hash allowlists, rate limits |
| Rights disputes, escalations | Metadata validation on ingest |
| Payout exceptions | Ledger + Stripe webhooks |

| Status | **Gap** on automation depth |

---

## User adoption & governance (combined)

### 18. Why would artists switch / fans care?

**Answer:** Artists: higher take-home on sales/tips + UCPS + dignity + export. Fans: ethical listening + Subsonic clients + direct support. **MLP today:** upload → publish → tip/buy + federated follow — **partially wired**.

| Status | **Partial** |

### 19. What prevents corruption / enshittification?

**Answer:** AGPL + lazy consensus + mission veto (RFC 008); published funding sources; no paid ranking; transparency reports. **Gap:** trademark policy, council not live.

| Status | **Partial** |

### 20. Accessibility & global scale — real or US-only?

**Answer:** WCAG 2.2 AA target (`docs/ACCESSIBILITY.md`); Stripe multi-currency **planned** (RFC 006); banking gaps need Liberapay/BTCPay **links** not forced Stripe-only. Low-bandwidth: presign + AAC tiers in RFC 006 — **not** all implemented.

| Status | **Partial** — a11y pass in progress; global payouts **test mode** |

---

## Red team summary (beta honesty)

| Strength under scrutiny | Weak under scrutiny |
|-------------------------|---------------------|
| Economic **intent** + **ASSUMPTION model** (`UNIT-ECONOMICS.md`) | Live metering + measured runway |
| 0% fee + ledger **code** | Subscription pools **unsettled** |
| Lean deploy path | **Prod** not live |
| Federation **direction** | Inbox + moderation **immature** |
| AGPL + governance RFC | Foundation **not** legal entity yet |

## Appendix — full interrogation index (mandate → doc)

Every bullet from adversarial founder mode maps here. **Bold** = primary top-20 anchor.

### Business viability

| Question | Anchor |
|----------|--------|
| Why survive financially? | **Q1** |
| Infrastructure cost collapse? | **Q2**, `UNIT-ECONOMICS.md` |
| 0% fee sustains ops? | **Q3**, `UNIT-ECONOMICS.md` §6 |
| Durable revenue streams? | **Q4** |
| Another failed artist platform? | **Q5** |
| Incumbents crush instantly? | **Q6** |
| Growth > moderation/support? | **Q7**, `UNIT-ECONOMICS.md` §8 |
| Low funding periods? | **Q8** |

### Product defensibility

| Question | Anchor |
|----------|--------|
| Spotify copy UCPS? | **Q9** |
| Bandcamp rebuild? | **Q10** |
| Structural advantage? | **Q11** |
| Federation strategically? | **Q12** |
| Foundation ownership economically? | **Q13** |
| AGPL moat vs liability? | **Q14** |
| Artists trust long term? | **Q15** |

### Operational reality

| Question | Anchor |
|----------|--------|
| Media storage cost? | **Q2**, `UNIT-ECONOMICS.md` §2 |
| Transcoding cost? | **Q2**, `UNIT-ECONOMICS.md` §4 |
| Bandwidth model? | `UNIT-ECONOMICS.md` §3 |
| Scaling bottlenecks? | **Q16** |
| Breaks at 10k / 100k / 1M? | **Q16** |
| Human moderation? | **Q17** |
| Automated systems? | **Q17** |

### User adoption

| Question | Anchor / status |
|----------|-----------------|
| Why artists switch? | **Q18** |
| Why fans care? | **Q18** |
| Minimum lovable product? | **Q18** — upload→publish→tip partial |
| Retention drivers? | **Partial** — UCPS + library + Subsonic habit |
| Network effects without lock-in? | **Q12** — federation, export (P2-8) |
| Discovery without manipulation? | **Partial** — no payola in charter; embeddings stub; editorial not payola |

### Governance

| Question | Anchor |
|----------|--------|
| Prevents corruption? | **Q19** |
| Prevents enshittification? | **Q19** |
| Foundation accountable? | **Q13**, RFC 008 |
| Community fork safely? | **Q14**, AGPL + `packages/sdk` MIT |
| Leadership changes? | **Q8**, RFC 008 phases |

### Accessibility & global scale

| Question | Anchor |
|----------|--------|
| Low-bandwidth users? | **Q20**, presign + AAC tier (RFC 006) |
| Disabled users? | **Q20**, `ACCESSIBILITY.md` |
| Non-US artists? | **Q20**, Stripe + alt rails in RFC 006 |
| Poor banking regions? | **Q20** — Liberapay/BTCPay links, not sole Stripe |
| Non-technical musician UX? | **Partial** — plain copy; upload flow still dev-heavy |

## Maintenance

- Update after: prod deploy, first transparency report, first UCPS settlement, catalog ≥600 live, **30 days metering** (fill `UNIT-ECONOMICS.md` measured column).
- Owner: any ship-week or funding milestone PR must touch **at least one row** if claims changed.
- PR template: `docs/SCRUTINY-PASS-TEMPLATE.md`
