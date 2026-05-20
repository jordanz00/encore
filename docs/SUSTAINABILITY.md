# Encore — long-term sustainability & durable business

Encore is engineered and operated as **durable public-interest infrastructure for music**, not a hypergrowth extraction product.

**Success** = artists still trust Encore in 20 years, contributors can maintain the stack, transparent economics stay intact, and the platform survives market cycles **without betraying its principles**.

**Not success** = vanity MAU, valuation hype, acquisition positioning, or growth-at-any-cost features.

## What Encore is / is not

| Encore **is** | Encore **is not** |
|---------------|-------------------|
| Artist-first | Venture-scale extraction machine |
| Foundation-owned (see `docs/rfcs/008-funding-governance.md`) | Ad-maximization platform |
| Open source (AGPL-3.0) | Speculative crypto / token economy |
| Federation-friendly (ActivityPub, Subsonic) | Surveillance business |
| Economically transparent (`transparency/`, `wallet_ledger`) | “Growth at any cost” startup |
| Operationally disciplined | Payola / paid ranking |

## Decision checklist (every feature or system)

Before merging significant work, answer honestly:

1. **Scale operationally?** — Can a small team run it at 10× traffic without heroics?
2. **Maintainable?** — Will a new contributor understand it in one afternoon (docs + code)?
3. **Low-budget survivable?** — Does it still work during grant gaps or lean years?
4. **Global?** — Licensing, payouts, latency, and language — any US-only traps?
5. **Trust-preserving?** — Does copy and behavior match ledger + transparency promises?
6. **Legally / financially resilient?** — Moderation, DMCA, tax, processor rules considered?
7. **Non-exploitative monetization?** — Revenue without hidden fees, dark patterns, or data resale?

If several answers are **no**, redesign, scope down, or document as **explicit beta debt** with an owner — do not ship silent optimism.

## Economic durability

### Durable revenue (favor)

- Optional listener subscriptions (user-centric pools when live)
- Artist support: tips, direct sales, patronage
- Grants and foundation patronage (`docs/rfcs/008-funding-governance.md`)
- Ethical premium tooling (self-host, pro dashboards) — **not** rent on artist income
- Operational efficiency (cache, transcode policy, cold storage)
- Federation leverage (other instances carry some social graph / discovery load)

### Avoid dependence on

- Behavioral ads and surveillance monetization
- Algorithmic addiction loops
- Speculative investment narratives
- Artificial scarcity / payola ranking
- Taking a cut of artist direct earnings ( **0% platform fee** on sales, tips, pool pass-through per charter)

### Cost realism (proposals must name)

| Cost bucket | Question to ask |
|-------------|-----------------|
| Storage | Per-track footprint? Lifecycle to cold/archive? |
| Bandwidth | Egress on stream vs presign? CDN cache hit rate? |
| Transcode | On-upload vs on-demand? Queue depth under load? |
| Moderation | Human review hours per 1k uploads? |
| Support | Self-serve docs vs ticket load? |
| Legal / admin | DMCA, payouts, cross-border tax? |

Do not propose systems whose unit economics only work at Spotify scale.

## Operational discipline

Optimize for **low overhead** and **portability**:

- **Prefer:** Postgres + object storage + stateless API; compose on Hetzner or any VPS (`docs/DEPLOY-BETA.md`)
- **Prefer:** open standards (ActivityPub, Subsonic, DDEX path in RFCs)
- **Prefer:** presigned URLs, edge caching, bounded workers — over always-on heavy transcode
- **Avoid:** hyperscaler-only services, proprietary AI lock-in, managed complexity without exit path
- **Avoid:** “big tech only” assumptions (K8s mesh, 12 microservices) unless justified in an RFC

Architecture should **degrade gracefully**: read-only mode, queue backlog visibility, federation failures isolated from checkout.

## Small team first

Assume years of:

- Lean engineering (1–5 core maintainers)
- Grant cycles and uneven funding
- Community contributors with variable availability

Therefore:

- **Readable** modules, explicit config, novice-friendly headers on public APIs
- **Reproducible** deploys (`infra/`, env templates, migration discipline)
- **Portable** infra (Docker compose, no secret sauce in one vendor console)
- **Documented** ADRs in `docs/rfcs/` for non-obvious choices

Avoid trend-driven rewrites and fragile abstraction layers that only the author understands.

## Trust as a strategic asset

Protect explicitly in product and engineering:

| Asset | Implementation direction |
|-------|---------------------------|
| Payout transparency | `wallet_ledger`, transparency reports, no fake “live” pool rates in UI |
| Honest communication | Demo vs live labels; `docs/ACCESSIBILITY.md` parity for dignity |
| Artist ownership | Export paths; no lock-in playlists |
| Federation openness | Webfinger, publish outbox, documented instance migration |
| User dignity | Privacy-minimal collection (`legal/privacy.html`) |
| Predictable governance | RFC 008 phases; no silent roadmap capture by sponsors |

**Never sacrifice trust for short-term metrics.**

## Product strategy (long horizon)

Improve over vanity dashboards:

- Artist retention and **confidence in payouts**
- Listener trust and **calm** UX (see accessibility mandate)
- Catalog quality and **legal clarity** of rights
- Reliability and honest status (`status/`)
- Discoverability **without** payola
- Operational sustainability (cost per active artist)

## Engineering for decades

Code priorities:

1. Readability and explicitness over cleverness  
2. Modularity with stable boundaries (`packages/db`, `apps/api`, `apps/web`)  
3. Documentation beside code (`docs/`, RFCs, honesty footers in agent output)  
4. Append-only money paths — never silent balance mutation  
5. Tests where they guard money, auth, or ledger — not trivia  

## Revenue safety (non-negotiable)

Sustainability must **never** rely on:

- Hidden fees on artist money flows  
- Dark patterns in subscriptions  
- Manipulative ranking for payment  
- Data resale or ad-tech surveillance  
- Predatory “creator fund” optics without ledger proof  

## Foundation durability

Design so the project survives:

- Founder transition → maintainer council (RFC 008)  
- Contributor churn → docs + RFCs + good first issues  
- Forks → AGPL ensures upstream reciprocity  
- Provider change → compose + standard SQL + S3-compatible storage  

Favor **institutional** artifacts (charter, ledger schema, transparency cadence) over personality-driven ops.

## Continuous strategic questions

While implementing, ask:

- Does this improve **long-term viability**?
- Does this reduce **operational fragility**?
- Does this **deepen trust**?
- Does this help **contributors** stay engaged without burnout?
- Does this keep Encore **independent**?
- Does this preserve **artist-first economics**?

## Reporting (end of significant cycles)

Include in ship notes or PRs:

- **Sustainability wins** (cost, simplicity, trust, portability)
- **New operational risks** (ongoing $, moderation, vendor)
- **Economic honesty** (demo vs live, fee structure unchanged?)
- **Deferred items** that need RFC or grant funding

## Related canonical docs

- `docs/ENCORE-EXECUTION-CHARTER.md` — ship gates and honesty format  
- `docs/ADVERSARIAL-FOUNDER.md` — pressure-test mode + red team  
- `docs/INVESTOR-INTERROGATION.md` — top 20 hard questions (honest beta answers)  
- `docs/ACCESSIBILITY.md` — inclusive, calm UX as trust  
- `docs/rfcs/006-payments-payouts.md` — money paths  
- `docs/rfcs/008-funding-governance.md` — foundation phases  
- `ARTIST-ECONOMICS.md`, `PLATFORM-SUCCESS-STRATEGY.md` (repo root) — product economics narrative  
