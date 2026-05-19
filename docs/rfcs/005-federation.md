# RFC 005 — Federation (ActivityPub)

- **Status:** Draft
- **Author:** Jordan Zabady (BDFL)
- **Created:** 2026-05
- **Tracks:** `apps/api/src/routes/federation.ts`, `packages/db/src/schema.ts` (`artists.actorIri`, `artists.inboxUrl`, `releases.objectIri`)

## Status
Proposed. Stub endpoints exist in `apps/api/src/routes/federation.ts` behind `ENABLE_ACTIVITYPUB=false`. This RFC promotes that stub into a first-class surface targeting v1.1 (post-launch).

## Context
Encore cannot afford to be one more silo. Mastodon proved an open social fediverse can sustain millions of users; **Funkwhale** and **Castopod** proved music and podcasting work over **ActivityPub** specifically. Federation gives us four things at once: distribution (any Mastodon user can follow an Encore artist from day one), portability (artists can move servers without losing followers via `Move` activity), resilience (no single instance is the kill-switch), and credibility (an AGPL music platform that does **not** federate looks like a closed-source platform with a free-software badge).

Constraints:
- **Privacy boundary** is non-negotiable (Role 28). Federation publishes **release metadata only** — never per-listener data, never `plays` rows, never `userSessions`. A remote server can know "Artist X published Track Y," not "User Z listened to it."
- **Spec compliance** with the W3C ActivityPub Recommendation, Activity Streams 2.0, WebFinger (RFC 7033), and HTTP Signatures (`draft-cavage-http-signatures-12`, the de-facto fediverse profile).
- **Failure isolation** — federation outages must not break local playback, search, or payouts.

## Decision
Implement Encore as an ActivityPub server with the following object mapping and security model.

### Object mapping
| Encore entity | ActivityPub type | Notes |
|---|---|---|
| **Artist** | `Person` (Actor) | One Actor per `artists` row with `actorIri` set. `preferredUsername = artists.slug`. Public key on the Actor; private key in a sibling table (see §Security). |
| **Release** | `Note` carrying a `Music`-vocab object | `Note` for compatibility with current Mastodon/Pleroma timelines (so non-music servers can render *something*). Embedded `attachment` array carries a structured object using the **schema.org Music** vocabulary (`MusicAlbum`, `MusicRecording`) until/unless the fediverse adopts a first-class `MusicRelease` type (we will track the [FEP-1b12 / FEP-music] discussion and migrate when it stabilizes). |
| **Track** | `Audio` attachment | One per track in the release `attachment` array. `mediaType` of the HLS playlist or progressive MP3; `url` is the public stream URL. Duration via `duration` (ISO 8601). |
| **Follow** | `Follow` | Inbound: `Person` (any) follows our `Person` (Artist). Recorded against `follows` (a remote-actor row, not a local `users` row). |
| **Like** | `Like` | Inbound: stored as a remote-only signal; **does not** increment local `likes`. Surfaced on the artist page as "remote likes" with a count, never with profiles. |
| **Repost** | `Announce` | Inbound: counted; outbound only when an artist re-shares another artist's release. |
| **Profile move** | `Move` | Outbound + inbound supported for both Artists and listeners (post-listener-federation, v1.2). |

### Discovery
**WebFinger** at `/.well-known/webfinger?resource=acct:<slug>@<domain>` returns the Actor IRI. Supports `rel=self` (Actor JSON) and `rel=http://webfinger.net/rel/profile-page` (HTML profile).

### Security
- **Per-artist key pair.** RSA 2048 minimum (Ed25519 once HTTP Message Signatures RFC 9421 is broadly adopted). Public key embedded in the Actor JSON. Private key stored in a new `artist_signing_keys` table — **never** exposed via the API, accessed only by the federation worker.
- **Outbound HTTP Signatures.** Every `POST /inbox` to a remote server is signed (`(request-target)`, `host`, `date`, `digest`). Required by every major fediverse server.
- **Inbound signature verification.** Every `POST /federation/actors/:slug/inbox` activity must be signed by the claimed actor's public key, fetched and cached per [HTTP Signatures]. Unsigned or mis-signed activities are dropped.
- **Blocklists.** Instance-level domain blocklist (admin-managed), plus per-artist actor blocks. Federated blocklists (e.g. `oliphant.social`-style) supported as **opt-in subscriptions**; we do not auto-import third-party blocklists by default.
- **Rate limits.** Per-remote-actor and per-remote-domain rate limits on inbox; backoff on outbound delivery (1m / 5m / 30m / 6h / 24h, then drop).
- **No listener data leaves.** The federation worker is forbidden from reading `plays`, `userSessions`, `subscriptions`, or anything tied to a `users.id`. Outbound activities are sourced exclusively from `artists`, `releases`, `tracks`, and `releaseArtists`.

### Endpoints (promoting the stub)
- `GET /.well-known/webfinger`
- `GET /federation/actors/:slug` (Actor JSON, `application/activity+json`)
- `GET /federation/actors/:slug/outbox` (paginated `OrderedCollection` of `Create(Note)` activities)
- `GET /federation/actors/:slug/followers` and `/following` (counts public, list private by default — Mastodon parity)
- `POST /federation/actors/:slug/inbox` (signature-verified)
- `GET /federation/objects/:id` (release / track lookup; respects local `moderation` status)

## Alternatives
1. **No federation; just a JSON API.** Cheaper, simpler, single-vendor risk. Loses the network effect that makes the fediverse worth more than the sum of instances.
2. **AT Protocol (Bluesky).** Smaller installed base today, music-typed records not standardized, requires PDS/AppView split. Re-evaluate at v2.
3. **Matrix rooms per artist.** Real-time-friendly but a poor model for catalog distribution; better as a *companion* surface for live listening parties later.
4. **Solid pods.** Strong on data sovereignty, weak on social-graph distribution. Could be added behind the same privacy boundary later.

ActivityPub wins on installed base (Mastodon, Funkwhale, Castopod, Pixelfed, PeerTube), spec maturity, and the privacy-friendly object model.

## Consequences
- **Positive:** Day-one reach to the fediverse audience; portability; alignment with the AGPL ethos; no ad-tech vector.
- **Operational cost:** Outbound delivery worker, inbox processing queue, key rotation, abuse handling per Role 27, blocklist tooling.
- **Compliance:** GDPR Article 13/14 notices must mention federation as a recipient category. DMCA (Role 26) becomes more complex when content is mirrored remotely; takedown actions only affect *our* canonical copy.
- **Schema additions (future):** `artist_signing_keys` (private keys), `remote_actors`, `remote_follows`, `remote_likes`, `remote_announces`, `inbox_jobs`, `outbox_jobs`, `federation_blocks`.

## Open Questions
- When does FEP-music or an equivalent music-typed object stabilize, and do we ship the schema.org-bridged `Note` first or wait?
- Listener-side federation (followers as remote actors) — v1.1 or v1.2?
- Do we honor Mastodon's `manuallyApprovesFollowers` for artists by default, or auto-accept and rely on blocks?
- Federated payouts (e.g. Funkwhale-style) — out of scope for this RFC; likely RFC 011.
- Public-key algorithm migration path: when do we cut over from RSA to Ed25519 / RFC 9421?
