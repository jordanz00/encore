# Global Launch Playbook — How Encore Reaches Artists Everywhere, Not Just California

> "A YouTuber in Lagos with 500,000 subscribers cannot monetize through Patreon. A podcaster in Manila cannot be paid by Substack. African artists earn 3–4× less per Spotify stream than European artists. 68% of international creators cite payment processing as a 'significant barrier' to growth." — *Spondula Insights*, *EcoFin Agency*, *InfluenceFlow* (2025)

The single biggest unaddressed market in independent music is **the global majority of artists who cannot get paid by Western creator platforms.** Solving this is Encore's structural advantage: an OSS project beholden to no shareholder can ship payment rails Patreon and Bandcamp refuse to.

## §1. The geographic exclusion problem (audit)

### Where Western creator platforms cannot pay out

| Region | Stripe Connect (artist payout) | Patreon payout | PayPal artist receive | Bandcamp (PayPal-only) |
|---|---|---|---|---|
| **West Africa** (Nigeria, Ghana, Senegal, Côte d'Ivoire) | No | No | Partial | No |
| **East Africa** (Kenya, Uganda, Tanzania, Ethiopia, Rwanda) | No | No | Partial | No |
| **South Asia** (Pakistan, Bangladesh, Sri Lanka, Nepal) | No | No | Partial | No |
| **Southeast Asia** (Vietnam, Philippines, Indonesia partial) | Partial | No | Partial | No |
| **Latin America** (Argentina, Chile, Colombia, Peru, Venezuela) | Partial | No | Partial | No |
| **Middle East** (most of region) | Limited | No | Partial | No |

For a Nigerian Afrobeats producer who would clear ~$500/month on a fair platform, the answer today is *establish a US LLC or wait*.

### The "geographic penalty" on streaming royalties

Spotify pays African artists **3–4× less per stream** than European artists, structurally — cheaper subscriptions, ad-supported listening dominance, and global pro-rata pool dilution combine. *EcoFin Agency* (2025) documents 22% African revenue growth that does not reach African artists.

### What artists actually use, by region

| Region | Dominant payment rail for creators | Currency considerations |
|---|---|---|
| Nigeria, Ghana, Kenya, Uganda, Tanzania | Mobile money: **M-Pesa** (Kenya/Tanzania), **MTN MoMo** (West Africa), **Airtel Money**, **Orange Money** | Local currency volatility; many artists prefer USD-pegged or stablecoin settlement |
| India | **UPI** (universal — 14B+ monthly transactions) | INR; UPI fees ~0% domestic |
| Brazil | **Pix** (instant national payment) | BRL; Pix is 24/7 free for individuals |
| Indonesia, Philippines, Vietnam | **GoPay / OVO / Dana** (Indonesia), **GCash** (Philippines), **MoMo** (Vietnam) | Local digital wallets dominant |
| Argentina, Chile, Colombia, Peru | **MercadoPago** + local cards; growing **Bitcoin Lightning** adoption (Argentina inflation hedge) | High inflation risk; many prefer USD or BTC |
| Eastern Europe | **Revolut**, **Wise**, SEPA | EUR, local currencies |

## §2. Encore's regional payment architecture

The principle is simple: **artists choose how they get paid**. The system supports as many rails as legally and operationally feasible. No artist is denied a payout because they live in the wrong country.

### Tier 1 — Universal rails (all regions, day 1)

| Rail | Coverage | Use case | Notes |
|---|---|---|---|
| **Stripe Connect Express** | 40+ countries | Default for North America, EU, UK, Australia, Singapore, Japan | Stripe's native payout |
| **Wise (formerly TransferWise)** | 160+ countries, 40+ currencies | Bank payout to most countries Stripe cannot reach (Argentina, Pakistan, Bangladesh, Sri Lanka, parts of Africa) | Wise Business API integration |
| **Bitcoin Lightning Network** | Global, censorship-resistant | Tipping (V4V) + opt-in payout for any artist | Already wired in worker; spec in `packages/ingest-podcast` value tag handling |

### Tier 2 — Regional rails (rolled out after v1.0 by region demand)

| Rail | Coverage | Integration partner |
|---|---|---|
| **M-Pesa (Safaricom Daraja API)** | Kenya, Tanzania | Daraja API direct |
| **MTN MoMo Open API** | Ghana, Uganda, Côte d'Ivoire, Cameroon, Rwanda | MTN partner program |
| **Flutterwave** | 30+ African countries | Single API for cards + mobile money + bank transfer |
| **Paystack** | Nigeria, Ghana, South Africa | Stripe-owned; African market |
| **Razorpay + UPI** | India | UPI payouts at near-zero fee |
| **Pix (Banco Central API)** | Brazil | Direct integration via licensed PSP |
| **MercadoPago** | Argentina, Chile, Mexico, Colombia, Peru, Uruguay | Direct |
| **PayMaya / GCash** | Philippines | API |
| **DANA / OVO** | Indonesia | API |

### Tier 3 — Currency, tax, and remittance helpers

- **Multi-currency artist wallet.** Sales settle to artist's chosen reporting currency (USD, EUR, GBP, NGN, INR, BRL, etc.). FX is transparent — the artist sees the spot rate and the Encore conversion fee (target: ≤0.5%, half what Wise charges).
- **Tax-ready exports per jurisdiction.** US 1099-K, Canadian T4A, EU VAT-MOSS / OSS, UK Self Assessment summary, Australian GST, Indian GST, Nigerian FIRS withholding template. New jurisdictions added by community PR with maintainer sign-off.
- **Stablecoin opt-in for inflation-volatile economies.** Artists in Argentina, Venezuela, Lebanon, Zimbabwe, Turkey can opt to receive payouts in USDC or USDT stablecoins on a low-fee chain (target: Lightning + Liquid). **This is the only place Encore touches crypto** — for hedging artist purchasing power in hyperinflation, not for speculation. See [`PLATFORM-SUCCESS-STRATEGY.md`](PLATFORM-SUCCESS-STRATEGY.md) §4: no native token.

## §3. Closing the geographic penalty on streaming

The geographic penalty exists because the pro-rata pool model translates cheap local subscriptions into globally pooled per-stream payouts, then redistributes them by global market share — disadvantaging artists in regions with cheaper subscriptions.

Encore's user-centric pool fixes this structurally:

- A listener in Nigeria paying ₦900/mo (~$0.60 USD equivalent at parity) → their ₦900 (minus 30% platform overhead) is divided **only among the artists they actually played**. If those artists are also Nigerian, the local artist receives a local-currency payout. The pool is *local* by listener.
- A listener in the US paying $9.99/mo → same math, allocated to the artists *that listener played*. If the listener played Nigerian Afrobeats, the Nigerian artist gets the US-currency payout from that listener.
- No global pool dilution means **no megastar transfer from low-income markets to high-income markets** — a documented structural unfairness of pro-rata.

The result: artists in lower-income markets earn the local-currency value of their local fans plus the foreign-currency value of any international fans they win. Both halves are visible in their dashboard.

## §4. Internationalization (i18n / l10n)

### Language coverage commitments

| Tier | Languages | Notes |
|---|---|---|
| **Tier 1 — Launch** | English, Spanish, Portuguese (Brazilian), French, German, Italian, Polish, Dutch, Japanese | Covers the EU, Latin America, much of Africa via colonial-language reach, Japan |
| **Tier 2 — v0.7** | Hindi, Bengali, Punjabi, Tamil, Telugu, Marathi, Urdu, Arabic, Turkish, Vietnamese, Indonesian, Thai, Tagalog | Adds South Asia, MENA, ASEAN |
| **Tier 3 — community-led** | Swahili, Hausa, Yoruba, Igbo, Amharic, Zulu, Xhosa, isiZulu, Korean, Mandarin (Simplified + Traditional), Russian, Ukrainian, Czech, Greek, Hebrew, Persian, Burmese | Added by community via Weblate as instances request |
| **RTL support** | Arabic, Hebrew, Persian, Urdu | Day-1 RTL CSS infrastructure even before translations land |

### Translation tooling

- **Weblate self-hosted instance** at `translate.encore.audio` (Weblate is itself AGPL-compatible). Same model Funkwhale uses.
- Contributors translate via web UI; PRs auto-generated; merged after maintainer review.
- Source strings live in `packages/i18n/source/en.json` with ICU MessageFormat for plurals + gender.
- **No machine translation in production** (it lies confidently). Strings without human translations fall back to English with a "Help translate this →" link.

### Content-language-aware discovery

- Listeners select preferred languages at sign-up; recommendations weight tracks tagged with those languages.
- Editorial playlists are language-tagged so the home page shows region-relevant curation by default.
- Search supports transliteration (e.g. Devanagari ↔ Latin script for Hindi artist names) so an English-keyboard listener can find a Hindi artist.

## §5. Hosting, CDN, and infrastructure for non-Western traffic

Western SaaS platforms are slow and expensive for artists and listeners outside US/EU because of CDN egress costs and routing. Encore's federated architecture sidesteps this.

### Federation as a CDN strategy

- **Regional federated instances** run by local communities reduce cross-border bandwidth: a São Paulo instance serves São Paulo artists and listeners over local peering.
- AGPL-3.0 + clean Docker Compose means a music collective in Lagos can stand up an instance for ~$20/month on Hetzner or DigitalOcean.
- Federation propagates discovery (Follow, Like, Announce) without proxying audio streams, so the audio bandwidth bill stays local.

### Reference instance hosting commitments

For artists who do not want to self-host, Encore operates reference instances with these geographic targets by v1.0:

| Region | Reference instance | Operator |
|---|---|---|
| North America | `na.encore.audio` | Encore Foundation |
| Europe | `eu.encore.audio` | Encore Foundation (Frankfurt) |
| South America | `sa.encore.audio` | Foundation grant to a Brazilian operator |
| Africa | `af.encore.audio` | Foundation grant to a Lagos- or Nairobi-based operator |
| South Asia | `sa.encore.audio` | Foundation grant to a Bengaluru- or Mumbai-based operator |
| East Asia | `ea.encore.audio` | Foundation grant to a Singapore- or Tokyo-based operator |
| Oceania | `oc.encore.audio` | Foundation grant to a Sydney-based operator |

Each instance federates with every other instance + with Funkwhale / Mastodon / PeerTube.

### Object storage

S3-compatible (the existing `apps/api/src/lib/s3.ts` abstraction). Recommended providers by region:

| Region | Provider | Why |
|---|---|---|
| Global | **Backblaze B2** | $6/TB/month storage, $0.01/GB egress |
| EU-only artists | **Hetzner Object Storage** | Cheap, EU-data-only |
| Africa | **Cloudflare R2** + local POPs | Zero egress fees critical for high-cost African bandwidth |
| Self-hosted | **MinIO** | No vendor lock-in |

## §6. Compliance and legal posture by region

Operating globally means complying with overlapping (and sometimes conflicting) legal regimes. Encore's federated architecture turns this from a single-point-of-failure into a per-instance choice.

| Jurisdiction | Key obligation | Encore posture |
|---|---|---|
| **EU** | GDPR data minimization, DSA platform obligations, AI Act labeling for AI-generated content | Detailed play tracking off by default; AI tracks require self-disclosure flag (see [`ARTIST-PAIN-AUDIT.md`](ARTIST-PAIN-AUDIT.md) #7); DSA reporting templates shipped |
| **US** | DMCA, Section 230 (eroding), CRB rate-setting, FTC enforcement | DMCA notice + counter-notice workflow; transparency report quarterly; MLC integration for mechanical royalty distribution |
| **UK** | UK GDPR; Online Safety Act | Same as EU GDPR profile + age-verification toggle for explicit content (artist-side flag) |
| **Brazil** | LGPD | Mirrors GDPR profile |
| **India** | DPDP Act; intermediary rules | Per-instance compliance; reference instance run by Indian operator under local law |
| **Nigeria** | NDPA | Reference instance run by Nigerian operator |
| **China** | Encore makes no commitment to operate in mainland China. CN listeners may access via federation through other instances at their own risk. | No business presence; no submission to censorship requirements |
| **Russia** | Russian platforms must register with Roskomnadzor. Encore declines. | No business presence in RU; community-run instances at operator's own risk |

## §7. Localized music industry partnerships

A global launch needs local champions. The plan is to identify and fund (via foundation grants) one cornerstone partner per region.

| Region | Type of partner | What they unlock |
|---|---|---|
| West Africa | Lagos-based indie label collective (e.g. Native Records, Naijaloaded artist network) | Afrobeats scene credibility + introduction to Boomplay leadership for federation |
| East Africa | Nairobi indie label + Sauti Sol management | Bongo Flava + East African indie scene; partnership with M-Pesa for mobile money payout |
| South Africa | Spoek Mathambo network + Cape Town electronic scene | African experimental scene + introduction to Mzansi indie distributors |
| India | Indie label network (e.g. Pagal Haina, Future Sound of Bombay) + IIT music club networks | Hindi-English crossover indie + university distribution |
| Brazil | Funk Coletivo collective + Tropicália heritage labels | Brazilian funk + indie rock + samba electronic scenes |
| Argentina | Buenos Aires DIY electronic scene + Cumbia indie | Spanish-language indie reach across Latin America |
| Indonesia + Philippines | Manila + Jakarta indie scenes | Southeast Asia bridge |
| Japan | City pop revival + indie label network (e.g. Pavilion Records) | Japan-specific market + city-pop global trend |
| Eastern Europe | Warsaw, Prague, Budapest indie scenes | EU bridge to Eastern Europe |

The partnership template per region: foundation grant + permanent founder badge + early access to features + paid editorial seat on the regional reference instance + zero-fee for life on direct sales. Modeled on what Bandcamp did with Amanda Palmer, Sufjan Stevens, RJD2 in 2008–2010.

## §8. Censorship and resilience

Federated architecture is censorship-resilient by design — but only if we engineer for it deliberately.

- **Bridge mode**: any Encore instance can be configured to mirror specific artists from any other instance even if the originating instance is blocked in the listener's country.
- **Tor onion service**: every reference instance ships with a `.onion` address from day 1.
- **Static catalog snapshots**: editorial playlists publish IPFS snapshots monthly. If an instance disappears, the music does not.
- **Right to take down vs right to mirror**: if an artist removes their content from an instance, federated copies on follower-side caches expire within 30 days. This is the same model as ActivityPub deletes.

## §9. What the v1.0 global launch looks like

By v1.0 the global launch is real if every line below is true:

- [ ] Payout rails work in ≥10 countries Stripe cannot reach (Nigeria, Kenya, Pakistan, Bangladesh, Argentina, Chile, Colombia, Indonesia, Philippines, Vietnam).
- [ ] Mobile money payout works (M-Pesa, MTN MoMo) for at least one African country.
- [ ] UPI payout works for India.
- [ ] Pix payout works for Brazil.
- [ ] User-centric subscription pool eliminates the geographic penalty (listener's $9.99 routes to artists they played, not megastars they did not).
- [ ] UI translated to Tier 1 + Tier 2 languages (22 total).
- [ ] RTL infrastructure works for Arabic / Hebrew / Persian / Urdu UI.
- [ ] At least 7 reference instances operate (NA, EU, SA, AF, SA, EA, OC).
- [ ] At least 1 regional partner artist or label active per region.
- [ ] Compliance posture documented for EU GDPR, US DMCA, UK OSA, Brazil LGPD, India DPDP.
- [ ] Tor onion service live for reference instances.
- [ ] DSA / DPDP / LGPD transparency reports published quarterly.

## §10. The cost of ignoring this

The hard truth: every major Western music platform has built a product for English-speaking, US/EU-bank-account-having artists and shipped a token "international" version for everyone else. **Audius's $1.1M hack and Tidal's collapsed UCPS attempt have not been the only failure modes** — quieter failures include Bandcamp never expanding meaningful payout coverage to most of Africa or South Asia, Spotify's geographic penalty, Patreon's payout exclusions.

The artists in the regions Western platforms ignore are not absent — they are just not building wealth on those platforms. **They are the constituency Encore can serve first, with the least competition, and the most loyalty.** Building Africa-first, India-first, Brazil-first is not a charitable footnote — it is the realistic distribution strategy.

## Citations

- *Spondula Insights* (2025): "How global creators get paid — without Patreon, Ko-fi, or Stripe."
- *EthicsV1 Substack* (2025): "Excluded by Design: How Global Payment Infrastructure Marginalizes Digital Creators from the Global South."
- *InfluenceFlow* (2025): International Creator Payments Guide — 68% cite payments as significant barrier.
- *EcoFin Agency* (2025): African artists face "geographic penalty" — 22% revenue growth doesn't reach artists.
- *Audiorista*: payment accessibility impact on content monetization.
- *Xtrm Blog* (2025): Top 5 Global Payout Platforms.
- *Wise*: PayPal alternatives.
- *Instarem* (2025): Wise alternatives — Payoneer, Remitly, Revolut, etc.
- *Slash*: PayPal alternatives for international payments.
- JioSaavn product page + Google Play listing (India market).
- Boomplay product page (Africa market).
- UMAW: "Make Streaming Pay" campaign.
- *Music Ally* (Aug 19 2025): Living Wage for Musicians Act.
- *Digital Music News* (May 28 2025): NYC Council resolution on streaming.
