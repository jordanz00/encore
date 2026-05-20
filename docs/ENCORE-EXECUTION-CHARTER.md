# Encore execution charter

Canonical operating spec for Cursor, ChatGPT, and human reviewers working in `jordanz00/encore`.

**Autonomous corporation mode:** `docs/ENCORE-CORPORATION.md` (multi-agent org, continuous loop, output contract).

## Mission

Ship a **public beta** of an AGPL-3.0, foundation-owned, artist-first music platform: transparent economics, federation-first, no extractive streaming playbook.

## Non-negotiables

1. **No invented claims** — metrics only from repo docs or cited sources.
2. **0% platform fee** on direct sales, tips, user-centric pool allocations, merch/live passthrough.
3. **No tokens** — Lightning as payment rail only.
4. **AGPL-3.0** — MIT limited to `@encore/sdk`.
5. **Foundation-owned** — no equity / acquisition-oriented design.
6. **Demo vs live** — demo wallet and +$0.024/play are UX only until transparency reports.
7. **No payola** — no paid ranking.
8. **No 1,000-stream cliff** — every play represented in ledger logic.
9. **Long-term sustainability** — durable public-interest platform, not hypergrowth extraction; see [`SUSTAINABILITY.md`](SUSTAINABILITY.md).
10. **Adversarial scrutiny** — survive hardest investor/engineer/musician/OSS/a11y/regulator questions; see [`ADVERSARIAL-FOUNDER.md`](ADVERSARIAL-FOUNDER.md) and [`INVESTOR-INTERROGATION.md`](INVESTOR-INTERROGATION.md).

## Output format (default)

- What Exists
- Plan
- Implementation
- Verify
- Honesty Footer
- **Scrutiny pass** (optional but required for major features): top criticisms answered + red-team gaps → `INVESTOR-INTERROGATION.md` row updates if economics/governance changed

## Roadmap priority

1. Ship week — [`SHIP-PLAN-7-DAYS.md`](../SHIP-PLAN-7-DAYS.md), tracker [`SHIP-WEEK-STATUS.md`](SHIP-WEEK-STATUS.md)
2. v0.3 — Artist Wallet, Stripe Connect, tips, `wallet_ledger`
3. v0.4 — subscription allocation jobs, transparency reports
4. v1.0 — mobile polish, WCAG, security audit, stipend program

## Canonical docs

`ARTIST-INCOME-GUARANTEE.md`, `ARTIST-ECONOMICS.md`, `PLATFORM-SUCCESS-STRATEGY.md`, `ARTIST-PAIN-AUDIT.md`, `ROADMAP.md`, `COMPETITORS.md`, `BRAND-POSITIONING.md`, `GLOBAL-LAUNCH-PLAYBOOK.md`, `CATALOG-PATHS.md`, `SUSTAINABILITY.md`, `ACCESSIBILITY.md`, `ADVERSARIAL-FOUNDER.md`, `INVESTOR-INTERROGATION.md`, `UNIT-ECONOMICS.md`, `SCRUTINY-PASS-TEMPLATE.md`

## Agent system note

In-repo corporate agents (`agents/corporate/`, `agents/encore/`) propose changes; only registered `handlerKey` values auto-apply. Most batch proposals still need deliberate implementation — see `docs/BATCH-CYCLE-LOG.md`.
