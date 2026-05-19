# Ship Plan — 7 Days to Public Beta

> "Ship in a week" is a real goal if scoped honestly. This document defines exactly what *can* go live in 7 days, exactly what *cannot* (no matter the effort), and a day-by-day plan a solo founder + AI pair can execute.

## §1. What "shipped" means in 7 days

A **public beta launch** that satisfies all of these on launch day:

- `encore.audio` resolves to a polished marketing site with the manifesto and the four strategy docs
- A reference instance at `beta.encore.audio` is live, on HTTPS, with:
  - Listener sign-up + browse + listen flow working end-to-end
  - Day-one CC seed catalog (≥500 tracks from Free Music Archive + Internet Archive)
  - Artist sign-up + upload + transcode flow working end-to-end
  - Direct sales checkout in **Stripe test mode** (live mode pends Stripe KYB review — see §3)
  - Federated actor + outbox visible from any Mastodon instance via Webfinger
  - Subsonic API endpoint working with at least one third-party mobile app (e.g. Symfonium, play:Sub)
- The four strategy docs (`ARTIST-ECONOMICS.md`, `PLATFORM-SUCCESS-STRATEGY.md`, `ARTIST-PAIN-AUDIT.md`, `GLOBAL-LAUNCH-PLAYBOOK.md`, `CATALOG-PATHS.md`, `COMPETITORS.md`) publicly readable
- ≥5 cornerstone artists invited, profiles set up, at least 2 releases published
- A signup waitlist with ≥1,000 self-reported artists/listeners (target — depends on launch reach)
- A funded path to v1.0 (NLnet NGI0 Commons Fund proposal submitted, fiscal sponsor selected)

## §2. What is honestly off the table in 7 days

These cannot ship in 7 days no matter the engineering effort, because of external dependencies. The strategy: ship the scaffold + invite-only beta now, ship the rest on the v0.x timeline in [`ROADMAP.md`](ROADMAP.md).

| Off-the-table | Why | When it ships |
|---|---|---|
| **iOS App Store / Google Play Store apps** | App review = 1–7 days each; Apple Developer Program registration = up to 48h; entitlement reviews (CarPlay etc.) = weeks | v0.7 mobile beta + v1.0 store submission |
| **Stripe Connect live mode for payouts** | KYB business verification = 1–3 weeks; pending entity registration | v0.3 (post fiscal-sponsor selection) |
| **Real DDEX distributor partnership** | Distributors require pilot demo + due diligence; sales cycle months | v0.5 |
| **Major-label catalog** | Not in scope at any timeline. [`CATALOG-PATHS.md`](CATALOG-PATHS.md) §6 |
| **WCAG 2.2 AA audit pass** | Audit firms book weeks out; remediation cycles needed | v1.0 |
| **Full security audit** | Same — weeks of audit cycle | v1.0 |
| **All 22 launch UI languages** | Human translators take time; v0.11 spec | v0.11 |
| **All 7 regional reference instances** | Per-region operator grants take months to issue + spin up | v0.12 |
| **Subsonic mobile app's official Encore branding** | Each third-party app has its own release cadence; we get unbranded compatibility day 1 | v0.6 official partner integrations |

## §3. The 7-day sequence

Each day is sized for a single founder + AI pair (~10h working time). Tasks are dependency-ordered.

### Day 1 — Stand up the production stack and brand

**Goal:** the website is live and the API is reachable.

| Task | Hours | Output |
|---|---|---|
| Register `encore.audio`, `encore.audio` via Cloudflare Registrar | 0.5 | Domains in hand |
| Configure Cloudflare DNS + free-tier email forwarding (`hello@`, `security@`, `partners@`, `legal@`) | 0.5 | Routable email |
| Provision Hetzner Cloud CCX23 (4 vCPU, 16 GB RAM, 240 GB SSD — ~€30/mo, Frankfurt region) | 0.5 | Server |
| Install Caddy as reverse proxy with auto-HTTPS for `*.encore.audio` | 0.5 | HTTPS live |
| `docker compose up -d` of full stack (postgres, redis, minio, meilisearch, api, web, worker) on the box | 1.5 | Production-equivalent stack running |
| Brand identity: logo (wordmark in monospace, no graphic), color palette (one accent), favicon | 2 | Brand assets in `apps/web/public/` |
| Marketing site at `encore.audio`: hero, four pillars (Artist-first / Open Source / Federated / Global), strategy docs links, waitlist form, footer | 4 | Public-facing site |
| Add waitlist endpoint: `POST /waitlist` writes to `waitlist` table; admin export to CSV | 0.5 | Capture launch audience |

### Day 2 — Wire payments and seed catalog

**Goal:** the listener experience is non-empty; the artist experience can accept money in test mode.

| Task | Hours | Output |
|---|---|---|
| Run `pnpm seed:catalog --source=fma --limit=200` against production DB | 0.5 | 200 FMA tracks live |
| Run `pnpm seed:catalog --source=internet_archive --limit=200` | 0.5 | 200 Internet Archive tracks live |
| Run `pnpm seed:catalog --source=jamendo --limit=200` (curated fallback) | 0.5 | 200 Jamendo tracks live |
| Stripe account creation in test mode + Connect Express onboarding flow | 2 | Test-mode payment infra wired |
| Direct sale checkout: track page → "Buy" → Stripe Checkout (test mode) → success → DB row in `sales` | 3 | End-to-end purchase flow |
| Tip flow: artist page → tip button → Stripe Checkout (test mode) | 1.5 | Tipping works |
| Submit Stripe Connect KYB application + entity documentation (will take 1–3 weeks to approve in parallel) | 1.5 | Live mode pipeline started |
| File NLnet NGI0 Commons Fund proposal (deadline 1 June 2026 per `PLATFORM-SUCCESS-STRATEGY.md`) | 0.5 | Funding pipeline started |

### Day 3 — Onboard cornerstone artists

**Goal:** the platform has real artists with real music, not just CC seed.

| Task | Hours | Output |
|---|---|---|
| Hand-craft "Founder Artist" invite email template with permanent 0%-fee + founder badge offer | 1 | Outreach template |
| Send invites to first 10 cornerstone artists in personal network — friends of friends, scenes you know, indie artists who left Spotify in the 2025 exodus and need a new home | 2 | Invites out |
| For each artist who accepts (target: 5 in first 24h): onboarding video call, white-glove upload of their first release, set up federated actor, set up custom domain (`artist.encore.audio` for now) | 5 | 5 cornerstone artists live with releases |
| Editorial Pack: "Founder Artists" playlist featuring the first 5 published | 1 | Discovery surface working |
| Quick-fix anything broken from these flows; this is the day bugs surface | 1 | UX polish |

### Day 4 — Federation interop + Subsonic API

**Goal:** Encore plays nice with the fediverse and with existing self-hosted-music mobile apps.

| Task | Hours | Output |
|---|---|---|
| Verify Webfinger resolves from `mastodon.social` (or any large instance): search `@artist@beta.encore.audio` and the profile renders | 2 | Mastodon followability confirmed |
| Test outbox publish: publish a release on Encore, verify the Create(Note) lands in the inbox of a Mastodon test account that follows the artist | 2 | Federation publish working |
| Ship Subsonic API surface in `apps/api/src/routes/subsonic.ts` — implement core endpoints: `getArtists`, `getAlbumList2`, `getAlbum`, `stream`, `getCoverArt`, `scrobble`, `ping` | 4 | Subsonic compatible |
| Test against Symfonium (Android) and play:Sub (iOS) — confirm browse, playback, scrobble work | 1 | Mobile playback confirmed |
| Federate with Funkwhale: configure `beta.encore.audio` as a known peer of at least one public Funkwhale instance; confirm cross-discovery | 1 | Funkwhale interop confirmed |

### Day 5 — Polish, accessibility pass, content moderation, and beta gating

**Goal:** the experience does not feel rough; obvious safety / moderation gaps closed; beta is invite-gated to keep load and bad actors manageable.

| Task | Hours | Output |
|---|---|---|
| Invite-code beta gate: `POST /auth/signup` requires a beta code (admin-issued) | 1 | Controlled rollout |
| ~~Generate 100 beta codes~~ Pre-allocate 100 codes and queue them for the waitlist (handed out in batches as we scale) | 0.5 | First wave |
| Accessibility quick pass: keyboard navigation works on player + signup + upload, focus visible, alt text on images, color contrast meets WCAG AA on primary surfaces | 2 | a11y for launch |
| Reduced-motion toggle in user preferences | 0.5 | a11y for launch |
| Moderation safety: hand-curate the home page editorial Pack; manual review queue for all uploads in beta period; PhotoDNA stub for image uploads (real integration v0.4) | 2 | Safe to launch |
| DMCA workflow: `legal@encore.audio` inbox triages to a takedown form; takedown removes track + sends counter-notice URL to uploader | 1.5 | DMCA-ready |
| ToS, Privacy Policy, Acceptable Use Policy — short, plain-English, AGPL-3.0-aligned. Templates from [Open Source Collective](https://opencollective.com/) and Bandcamp's published ToS for reference | 2 | Legal pages live |
| Status page at `status.encore.audio` | 0.5 | Public uptime visibility |

### Day 6 — Launch comms + outreach prep

**Goal:** day 7 launch reaches the right audience; the project is legible to journalists and music industry observers.

| Task | Hours | Output |
|---|---|---|
| Launch blog post on `encore.audio/blog/launch`: 800–1200 words, links to all four strategy docs, the four pillars, the cornerstone artists | 3 | Anchor post |
| Mastodon account `@encore@mastodon.social` (or self-hosted) with prepared launch thread | 1 | Mastodon presence |
| Bluesky account with same | 0.5 | Bluesky presence |
| Twitter account (read-only / cross-post mirror) — Twitter is hostile to indie launches but indexable | 0.5 | Twitter reach |
| Prepared press kit at `encore.audio/press`: logo, screenshots, founder bio, fact sheet, "What's different about Encore" one-pager | 2 | Press-ready |
| Outreach list draft: 30 indie music journalists + bloggers (Liz Pelly, Cherie Hu, Dan Runcie, The FADER, NME, Pitchfork, Stereogum, Hypebot, Music Ally, Music Business Worldwide, etc.) + 10 OSS press outlets (Hacker News, The Register, OMG Ubuntu, FOSS Force) | 2 | Outreach list |
| Hacker News "Show HN" draft post; Reddit r/WeAreTheMusicMakers + r/selfhosted + r/opensource draft posts | 1 | Post drafts |

### Day 7 — Launch

**Goal:** ship it.

| Task | Hours | Output |
|---|---|---|
| Pre-launch checklist: status page green, all five cornerstone artists confirmed, waitlist autoresponder working, beta codes ready to issue, Caddy logs forwarded to log aggregator, on-call schedule decided (you + AI) | 1 | Launch checklist green |
| Publish launch blog post | 0.5 | Anchor post live |
| Post to Mastodon `@encore` + boost from cornerstone artists | 0.5 | Fediverse launch |
| Post to Bluesky | 0.5 | Bluesky launch |
| Post "Show HN: Encore — open-source, artist-first music platform" | 0.5 | HN launch |
| Post to r/WeAreTheMusicMakers, r/selfhosted, r/opensource | 0.5 | Reddit launch |
| Email press list with the press kit URL | 1 | Press launch |
| Monitor + respond to launch traffic, scale Hetzner box vertically if needed (Hetzner CCX33 / CCX43 are one-click upgrades) | 6 | Reactive ops |

## §4. The pre-launch checklist (the morning of Day 7)

Cut & paste this into a tracking issue. If any item is red, hold the launch.

```
[ ] DNS for encore.audio resolves; HTTPS valid on all subdomains
[ ] beta.encore.audio loads in < 2s p95 from US East, EU, Singapore
[ ] /health returns ok; /version returns the committed SHA
[ ] At least 500 tracks browseable on /discover
[ ] At least 5 cornerstone artist profiles live with at least 2 released albums
[ ] Sign-up works end-to-end with email verification
[ ] Direct sale in test mode completes and writes a sales row
[ ] Tip in test mode completes
[ ] Mastodon WebFinger lookup for one cornerstone artist resolves
[ ] Outbox shows that artist's published releases
[ ] Subsonic API: Symfonium can browse + play a track
[ ] All four strategy docs render on the marketing site
[ ] Status page green
[ ] DMCA / abuse inbox monitored (legal@, abuse@)
[ ] On-call rotation defined for the next 72h
[ ] Launch blog post drafted and proofread
[ ] Press kit URL works and contains the screenshots + fact sheet
```

## §5. Post-launch week 1 (days 8–14) — what we do with traction

If the launch hits, the most likely outcomes are:

| Signal | Response |
|---|---|
| HN front page | Have the marketing site, status page, and waitlist scale-tested in advance. Hetzner vertical scaling is one click. |
| Mastodon viral thread (200+ boosts) | Pin cornerstone artist accounts to the Encore homepage; queue 5 more cornerstone artist onboardings |
| Press inquiries | Founder responds within 24h with the press kit + 30-min interview availability. Liz Pelly, Cherie Hu, Dan Runcie are highest-leverage |
| Hostile pushback from incumbent platform stakeholders | Stay factual — every claim in the strategy docs is cited. Do not engage Twitter spam |
| 1,000+ waitlist signups | Issue 500 beta codes by Friday of week 1; manual artist invite to most-active waitlist signers |
| Funkwhale community engagement | Reach out to Funkwhale lead maintainer (`@eliotberriot@mastodon.social` historically); propose joint announcement and federation interop spec |
| NLnet grant queue update | The proposal filed on Day 2 will not have a decision yet — that's fine. Keep momentum independent of the grant outcome |

## §6. Honesty footer

This 7-day plan is **realistic for a founder + AI pair if and only if** every dependency in §3 is met. Real risks:

- Stripe KYB application can be slower than expected if business entity registration is not done first
- DNS propagation can take longer than expected (use Cloudflare for fast updates)
- Audio transcoding on a single Hetzner box is fine for small beta; will need horizontal worker scaling after ~50 concurrent uploads
- Mastodon federation interop has historically had edge cases — budget 2h on Day 4 specifically for debugging Signature header serialization
- The five cornerstone artists are the highest-risk dependency. If only two say yes by Day 3, push launch by 3 days and recruit three more rather than launch without enough artist signal

**The 7-day target is the right ambition** — but the launch day moves *one week max* if a real blocker emerges. The strategy docs are the platform's true competitive moat; they remain valid whether the code launches on Day 7 or Day 14.
