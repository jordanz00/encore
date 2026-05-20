/**
 * @encore/db — schema.
 *
 * WHO THIS IS FOR: backend engineers (api + worker), data analysts, contributors.
 * WHAT IT DOES: defines every table Encore uses to store users, artists,
 *   releases, tracks, playlists, plays, comments, sales, payouts, podcasts,
 *   ingest sources, subscriptions, ads, moderation, and federation state.
 * HOW IT CONNECTS: imported by `apps/api` (HTTP handlers), `apps/worker`
 *   (background jobs), and `apps/admin` (editorial CMS).
 *
 * DESIGN NOTES:
 *   - All money in integer minor units (cents) + ISO-4217 currency code.
 *   - All timestamps are `timestamp with time zone`, default now().
 *   - Soft-delete via `deletedAt` where artists/listeners may retract content.
 *   - `pgvector` columns hold audio embeddings for content-based recs (RFC 004).
 *   - Federation columns (actorIri, inboxUrl) let us republish to ActivityPub.
 *
 * SCHEMA VERSION: 0.0.1 (pre-1.0 — breaking changes allowed)
 */

import {
  pgTable,
  pgEnum,
  text,
  varchar,
  uuid,
  integer,
  bigint,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
  doublePrecision,
  customType,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---------- Custom types ----------

/** pgvector column type (1024-dim audio embeddings). */
const vector1024 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1024)";
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    return value
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .split(",")
      .map((n) => Number(n));
  },
});

// ---------- Enums ----------

export const userRole = pgEnum("user_role", [
  "listener",
  "artist",
  "label",
  "editor",
  "moderator",
  "admin",
]);

export const releaseType = pgEnum("release_type", [
  "single",
  "ep",
  "album",
  "compilation",
  "live",
  "remix",
  "soundtrack",
  "mixtape",
]);

export const releaseStatus = pgEnum("release_status", [
  "draft",
  "scheduled",
  "published",
  "takedown",
]);

export const subscriptionTier = pgEnum("subscription_tier", [
  "free",
  "premium",
  "family",
  "student",
  "hifi",
]);

export const ingestSourceKind = pgEnum("ingest_source_kind", [
  "upload",
  "ddex",
  "podcast_rss",
  "cc_seed",
  "fediverse",
  "import",
]);

export const moderationStatus = pgEnum("moderation_status", [
  "pending",
  "approved",
  "flagged",
  "removed",
  "appealing",
]);

export const playoutSegmentSource = pgEnum("playout_segment_source", [
  "hls",
  "flac_progressive",
  "preview",
  "ad",
]);

// ---------- Auth + Users ----------

/**
 * Users — one row per authenticated person.
 * Better-Auth stores credentials in `user_credentials` and OAuth in `user_oauth`.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    handle: varchar("handle", { length: 32 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    displayName: varchar("display_name", { length: 80 }),
    avatarKey: text("avatar_key"),
    bio: text("bio"),
    role: userRole("role").default("listener").notNull(),
    locale: varchar("locale", { length: 16 }).default("en-US").notNull(),
    country: varchar("country", { length: 2 }),
    /** Privacy: when true, plays are not stored beyond aggregate counters. */
    disableDetailedPlayTracking: boolean("disable_detailed_play_tracking")
      .default(true)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    handleUnique: uniqueIndex("users_handle_unique").on(t.handle),
    emailUnique: uniqueIndex("users_email_unique").on(t.email),
  }),
);

export const userCredentials = pgTable("user_credentials", {
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .primaryKey(),
  passwordHash: text("password_hash"),
  totpSecret: text("totp_secret"),
  passkeysJson: jsonb("passkeys_json").default(sql`'[]'::jsonb`).notNull(),
});

export const userSessions = pgTable(
  "user_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    userAgent: text("user_agent"),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => ({
    tokenIdx: uniqueIndex("user_sessions_token_unique").on(t.tokenHash),
    userIdx: index("user_sessions_user_idx").on(t.userId),
  }),
);

// ---------- Artists, Labels ----------

export const artists = pgTable(
  "artists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Owning user (null = label-managed or imported). */
    ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    /** Public URL slug, e.g. /artist/jordan-zabady */
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    sortName: varchar("sort_name", { length: 200 }),
    bio: text("bio"),
    location: varchar("location", { length: 120 }),
    websiteUrl: text("website_url"),
    bannerKey: text("banner_key"),
    avatarKey: text("avatar_key"),
    /** MusicBrainz Artist ID, when known. */
    musicbrainzId: varchar("musicbrainz_id", { length: 36 }),
    /** ActivityPub actor IRI for fediverse identity (RFC 005). */
    actorIri: text("actor_iri"),
    /** RSA public key (PEM). Beta: stored in DB; production should use a secrets manager. */
    actorPublicKeyPem: text("actor_public_key_pem"),
    /** RSA private key (PEM). Beta only — rotate before public launch. */
    actorPrivateKeyPem: text("actor_private_key_pem"),
    inboxUrl: text("inbox_url"),
    verified: boolean("verified").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    slugUnique: uniqueIndex("artists_slug_unique").on(t.slug),
    nameTrgm: index("artists_name_trgm_idx").using(
      "gin",
      sql`${t.name} gin_trgm_ops`,
    ),
  }),
);

export const labels = pgTable("labels", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  websiteUrl: text("website_url"),
  /** Merlin member id, if onboarded (RFC 002). */
  merlinId: varchar("merlin_id", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Releases (singles / EPs / albums) ----------

export const releases = pgTable(
  "releases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    primaryArtistId: uuid("primary_artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    labelId: uuid("label_id").references(() => labels.id, { onDelete: "set null" }),
    title: varchar("title", { length: 255 }).notNull(),
    type: releaseType("type").default("single").notNull(),
    status: releaseStatus("status").default("draft").notNull(),
    coverArtKey: text("cover_art_key"),
    upc: varchar("upc", { length: 14 }),
    /** Genre slugs, e.g. ["electronic", "ambient"]. */
    genres: jsonb("genres").default(sql`'[]'::jsonb`).notNull(),
    /** Release-level credits (producer, mastering, art direction, etc.). */
    credits: jsonb("credits").default(sql`'[]'::jsonb`).notNull(),
    description: text("description"),
    /** Wall-clock release date (separate from publishedAt for scheduling). */
    releaseDate: timestamp("release_date", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    /** Artist-controlled price floor in cents. 0 = free; null = streaming-only. */
    priceFloorCents: integer("price_floor_cents"),
    currency: varchar("currency", { length: 3 }).default("USD").notNull(),
    /** Source of ingest (upload | ddex | cc_seed | etc.). */
    sourceKind: ingestSourceKind("source_kind").default("upload").notNull(),
    sourceRef: text("source_ref"),
    /** Federation: ActivityPub object IRI when published to fediverse. */
    objectIri: text("object_iri"),
    moderation: moderationStatus("moderation").default("approved").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    primaryArtistIdx: index("releases_primary_artist_idx").on(t.primaryArtistId),
    publishedAtIdx: index("releases_published_at_idx").on(t.publishedAt),
    upcIdx: index("releases_upc_idx").on(t.upc),
  }),
);

/** Release ↔ additional artists (features, "with", remixers). */
export const releaseArtists = pgTable(
  "release_artists",
  {
    releaseId: uuid("release_id")
      .notNull()
      .references(() => releases.id, { onDelete: "cascade" }),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 32 }).default("featured").notNull(),
    position: integer("position").default(0).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.releaseId, t.artistId, t.role] }),
  }),
);

// ---------- Tracks ----------

export const tracks = pgTable(
  "tracks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => releases.id, { onDelete: "cascade" }),
    primaryArtistId: uuid("primary_artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    discNumber: integer("disc_number").default(1).notNull(),
    trackNumber: integer("track_number").default(1).notNull(),
    durationMs: integer("duration_ms").default(0).notNull(),
    isrc: varchar("isrc", { length: 12 }),
    iswc: varchar("iswc", { length: 15 }),
    explicit: boolean("explicit").default(false).notNull(),
    lyrics: text("lyrics"),
    languageCode: varchar("language_code", { length: 8 }),
    /** Original master audio object key (FLAC or WAV). */
    masterKey: text("master_key"),
    /** HLS playlist key (m3u8). Null until transcoder finishes. */
    hlsKey: text("hls_key"),
    /** Progressive FLAC key for HiFi tier. */
    flacKey: text("flac_key"),
    /** Waveform precompute (small JSON array of peaks). */
    waveformKey: text("waveform_key"),
    /** EBU R128 integrated loudness (LUFS). */
    loudnessLufs: doublePrecision("loudness_lufs"),
    /** ReplayGain track gain in dB. */
    replayGainDb: doublePrecision("replay_gain_db"),
    /** Peak amplitude (-1.0 .. 1.0). */
    peakAmplitude: doublePrecision("peak_amplitude"),
    /** Audio embedding for content-based recs (CLAP / OpenL3, RFC 004). */
    embedding: vector1024("embedding"),
    /** Per-track price override; falls back to release price. */
    priceCents: integer("price_cents"),
    moderation: moderationStatus("moderation").default("approved").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    releaseIdx: index("tracks_release_idx").on(t.releaseId, t.discNumber, t.trackNumber),
    isrcIdx: index("tracks_isrc_idx").on(t.isrc),
    titleTrgm: index("tracks_title_trgm_idx").using(
      "gin",
      sql`${t.title} gin_trgm_ops`,
    ),
  }),
);

/** Track ↔ contributors (writer, producer, mix, master, performer, etc.). */
export const trackCredits = pgTable("track_credits", {
  id: uuid("id").defaultRandom().primaryKey(),
  trackId: uuid("track_id")
    .notNull()
    .references(() => tracks.id, { onDelete: "cascade" }),
  artistId: uuid("artist_id").references(() => artists.id, { onDelete: "set null" }),
  /** Free-text name when artist record doesn't exist (e.g. session musician). */
  name: varchar("name", { length: 200 }),
  role: varchar("role", { length: 64 }).notNull(),
  position: integer("position").default(0).notNull(),
});

// ---------- Playlists ----------

export const playlists = pgTable(
  "playlists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    coverKey: text("cover_key"),
    isPublic: boolean("is_public").default(true).notNull(),
    isCollaborative: boolean("is_collaborative").default(false).notNull(),
    /** Editorial badge: shows "Encore Editorial" treatment. */
    isEditorial: boolean("is_editorial").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    ownerIdx: index("playlists_owner_idx").on(t.ownerUserId),
  }),
);

export const playlistItems = pgTable(
  "playlist_items",
  {
    playlistId: uuid("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    trackId: uuid("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    addedByUserId: uuid("added_by_user_id").references(() => users.id, { onDelete: "set null" }),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
    note: text("note"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.playlistId, t.position] }),
    trackIdx: index("playlist_items_track_idx").on(t.trackId),
  }),
);

// ---------- Social: follows, likes, reposts ----------

export const follows = pgTable(
  "follows",
  {
    followerUserId: uuid("follower_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.followerUserId, t.artistId] }),
    artistIdx: index("follows_artist_idx").on(t.artistId),
  }),
);

/** Remote ActivityPub followers (inbox Follow activities). */
export const remoteFollowers = pgTable(
  "remote_followers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    followerActorIri: text("follower_actor_iri").notNull(),
    followerInboxUrl: text("follower_inbox_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    artistFollowerUq: uniqueIndex("remote_followers_artist_actor_uq").on(
      t.artistId,
      t.followerActorIri,
    ),
    artistIdx: index("remote_followers_artist_idx").on(t.artistId),
  }),
);

export const likes = pgTable(
  "likes",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    trackId: uuid("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.trackId] }),
    trackIdx: index("likes_track_idx").on(t.trackId),
  }),
);

export const reposts = pgTable(
  "reposts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    trackId: uuid("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.trackId] }),
  }),
);

// ---------- Comments (waveform-anchored, like SoundCloud) ----------

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trackId: uuid("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    parentCommentId: uuid("parent_comment_id"),
    body: text("body").notNull(),
    /** Anchor to a position in the track (in milliseconds). */
    anchorMs: integer("anchor_ms"),
    moderation: moderationStatus("moderation").default("approved").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    trackIdx: index("comments_track_idx").on(t.trackId, t.anchorMs),
  }),
);

// ---------- Plays (HLS-segment counted; privacy-respecting) ----------

/**
 * Plays — records a verified play event.
 * A play is counted only when at least 30 seconds (configurable) of audio
 * has been delivered, matching DSR-class definitions used by Merlin etc.
 *
 * If a user has `disableDetailedPlayTracking = true`, only the aggregate
 * counters in `track_play_counters` are incremented; no row lands here.
 */
export const plays = pgTable(
  "plays",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trackId: uuid("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    sessionFp: varchar("session_fp", { length: 64 }),
    countryCode: varchar("country_code", { length: 2 }),
    /** Source surface: "web" | "mobile" | "desktop" | "carplay" | "embed" */
    surface: varchar("surface", { length: 16 }).default("web").notNull(),
    segmentSource: playoutSegmentSource("segment_source").default("hls").notNull(),
    /** Total seconds delivered (for partial-play detection / fraud heuristics). */
    secondsDelivered: integer("seconds_delivered").default(0).notNull(),
    isVerifiedPlay: boolean("is_verified_play").default(false).notNull(),
    playedAt: timestamp("played_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    trackIdx: index("plays_track_idx").on(t.trackId, t.playedAt),
    userIdx: index("plays_user_idx").on(t.userId, t.playedAt),
  }),
);

export const trackPlayCounters = pgTable("track_play_counters", {
  trackId: uuid("track_id")
    .references(() => tracks.id, { onDelete: "cascade" })
    .primaryKey(),
  totalPlays: bigint("total_plays", { mode: "bigint" }).default(0n).notNull(),
  totalListeners: bigint("total_listeners", { mode: "bigint" }).default(0n).notNull(),
  last7d: integer("last_7d").default(0).notNull(),
  last30d: integer("last_30d").default(0).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Sales (Bandcamp-style direct purchases) ----------

export const sales = pgTable(
  "sales",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    buyerUserId: uuid("buyer_user_id").references(() => users.id, { onDelete: "set null" }),
    /** Either a track or release sale. */
    trackId: uuid("track_id").references(() => tracks.id, { onDelete: "set null" }),
    releaseId: uuid("release_id").references(() => releases.id, { onDelete: "set null" }),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    grossCents: integer("gross_cents").notNull(),
    /** Buyer-chosen "name your price" amount above floor. */
    overpaymentCents: integer("overpayment_cents").default(0).notNull(),
    /** Platform fee (target: 0% on artist sales, processor fee only). */
    platformFeeCents: integer("platform_fee_cents").default(0).notNull(),
    processorFeeCents: integer("processor_fee_cents").default(0).notNull(),
    netToArtistCents: integer("net_to_artist_cents").notNull(),
    currency: varchar("currency", { length: 3 }).default("USD").notNull(),
    paymentProvider: varchar("payment_provider", { length: 32 }).default("stripe").notNull(),
    paymentRef: text("payment_ref"),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    artistIdx: index("sales_artist_idx").on(t.artistId, t.createdAt),
    buyerIdx: index("sales_buyer_idx").on(t.buyerUserId, t.createdAt),
  }),
);

// ---------- Subscriptions + Ads ----------

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tier: subscriptionTier("tier").default("free").notNull(),
    /** Stripe subscription id, if any. */
    providerRef: text("provider_ref"),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAt: timestamp("cancel_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: uniqueIndex("subscriptions_user_unique").on(t.userId),
  }),
);

/** Privacy-first contextual ads (no behavioral profiling). */
export const adCampaigns = pgTable("ad_campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  advertiserUserId: uuid("advertiser_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  artistId: uuid("artist_id").references(() => artists.id, { onDelete: "cascade" }),
  releaseId: uuid("release_id").references(() => releases.id, { onDelete: "cascade" }),
  /** Targeting: contextual only — genres, moods, time-of-day, language. */
  targetingJson: jsonb("targeting_json").default(sql`'{}'::jsonb`).notNull(),
  budgetCents: integer("budget_cents").notNull(),
  spendCents: integer("spend_cents").default(0).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  active: boolean("active").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Payouts (artist accounting) ----------

export const payouts = pgTable("payouts", {
  id: uuid("id").defaultRandom().primaryKey(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  salesCents: integer("sales_cents").default(0).notNull(),
  streamingCents: integer("streaming_cents").default(0).notNull(),
  tipsCents: integer("tips_cents").default(0).notNull(),
  adjustmentsCents: integer("adjustments_cents").default(0).notNull(),
  totalCents: integer("total_cents").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: varchar("status", { length: 16 }).default("pending").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Podcasts ----------

export const podcastFeeds = pgTable(
  "podcast_feeds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    feedUrl: text("feed_url").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    coverKey: text("cover_key"),
    language: varchar("language", { length: 8 }),
    categories: jsonb("categories").default(sql`'[]'::jsonb`).notNull(),
    explicit: boolean("explicit").default(false).notNull(),
    /** podcast:guid (Podcasting 2.0). */
    podcastGuid: varchar("podcast_guid", { length: 36 }),
    websiteUrl: text("website_url"),
    addedByUserId: uuid("added_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),
    nextFetchAt: timestamp("next_fetch_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    feedUnique: uniqueIndex("podcast_feeds_url_unique").on(t.feedUrl),
  }),
);

export const podcastEpisodes = pgTable(
  "podcast_episodes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    feedId: uuid("feed_id")
      .notNull()
      .references(() => podcastFeeds.id, { onDelete: "cascade" }),
    guid: varchar("guid", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    enclosureUrl: text("enclosure_url").notNull(),
    enclosureType: varchar("enclosure_type", { length: 64 }),
    durationMs: integer("duration_ms"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    chaptersJson: jsonb("chapters_json").default(sql`'[]'::jsonb`).notNull(),
    transcriptKey: text("transcript_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    feedGuidUnique: uniqueIndex("podcast_episodes_feed_guid_unique").on(t.feedId, t.guid),
    publishedIdx: index("podcast_episodes_published_idx").on(t.publishedAt),
  }),
);

// ---------- Ingest sources (DDEX, CC seed, fediverse, etc.) ----------

export const ingestSources = pgTable("ingest_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: ingestSourceKind("kind").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  /** Distributor identifier (e.g. "DistroKid", "CD Baby") for DDEX kind. */
  distributorRef: varchar("distributor_ref", { length: 100 }),
  configJson: jsonb("config_json").default(sql`'{}'::jsonb`).notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ingestJobs = pgTable(
  "ingest_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceId: uuid("source_id").references(() => ingestSources.id, {
      onDelete: "set null",
    }),
    kind: ingestSourceKind("kind").notNull(),
    payloadRef: text("payload_ref").notNull(),
    status: varchar("status", { length: 16 }).default("queued").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index("ingest_jobs_status_idx").on(t.status, t.createdAt),
  }),
);

// ---------- Moderation ----------

export const moderationReports = pgTable("moderation_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  reporterUserId: uuid("reporter_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  /** Subject type: "track" | "release" | "user" | "comment" | "podcast_episode". */
  subjectType: varchar("subject_type", { length: 32 }).notNull(),
  subjectId: uuid("subject_id").notNull(),
  reason: varchar("reason", { length: 64 }).notNull(),
  details: text("details"),
  status: varchar("status", { length: 16 }).default("open").notNull(),
  reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  outcome: varchar("outcome", { length: 32 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const dmcaNotices = pgTable("dmca_notices", {
  id: uuid("id").defaultRandom().primaryKey(),
  claimantName: varchar("claimant_name", { length: 200 }).notNull(),
  claimantEmail: varchar("claimant_email", { length: 254 }).notNull(),
  goodFaithStatement: boolean("good_faith_statement").notNull(),
  perjuryStatement: boolean("perjury_statement").notNull(),
  /** Subject content references. */
  subjectsJson: jsonb("subjects_json").default(sql`'[]'::jsonb`).notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
  /** "valid" | "invalid" | "counter_noticed" | "withdrawn" */
  status: varchar("status", { length: 32 }).default("valid").notNull(),
  publishedToTransparencyReport: boolean("published_to_transparency_report")
    .default(false)
    .notNull(),
});

// ============================================================
// Artist Income Guarantee (see /ARTIST-INCOME-GUARANTEE.md)
//
// These tables enforce the "every working artist gets paid something"
// design contract. Six revenue streams default-on per artist;
// schema-level invariants block the failure modes catalogued in
// /ARTIST-PAIN-AUDIT.md (1,000-stream gate, bundle discounts on
// publishing-side payouts, ghost-catalog dilution, payment exclusion,
// platform-takes-first).
// ============================================================

// ---------- Artist Wallet (the "artist gets paid first" account) ----------

export const artistWallets = pgTable("artist_wallets", {
  id: uuid("id").defaultRandom().primaryKey(),
  artistId: uuid("artist_id")
    .notNull()
    .unique()
    .references(() => artists.id, { onDelete: "cascade" }),
  /** Wallet balance in artist's preferred currency, integer minor units. */
  balanceCents: bigint("balance_cents", { mode: "number" }).default(0).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  /** Auto-cashout schedule: "weekly" | "manual" | "threshold". */
  cashoutMode: varchar("cashout_mode", { length: 16 }).default("weekly").notNull(),
  /** Minimum balance before auto cash-out fires (for "threshold" mode). */
  cashoutThresholdCents: integer("cashout_threshold_cents").default(0).notNull(),
  lastCashoutAt: timestamp("last_cashout_at", { withTimezone: true }),
  /** Stripe Connect Express account id (acct_…). */
  stripeConnectAccountId: varchar("stripe_connect_account_id", { length: 64 }),
  /** not_started | pending | active | restricted */
  stripeConnectStatus: varchar("stripe_connect_status", { length: 24 })
    .default("not_started")
    .notNull(),
  stripeChargesEnabled: boolean("stripe_charges_enabled").default(false).notNull(),
  stripePayoutsEnabled: boolean("stripe_payouts_enabled").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Append-only ledger of every wallet credit and debit.
 * Every row MUST have a `reason` from a controlled vocabulary;
 * the audit view v_audit_wallet_reasons rejects any other value.
 */
export const walletLedger = pgTable(
  "wallet_ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => artistWallets.id, { onDelete: "cascade" }),
    /** Positive = credit (artist earned), negative = debit (cash-out / refund). */
    amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    /**
     * Controlled vocabulary:
     *   credit_direct_sale | credit_tip | credit_subscription_pool |
     *   credit_discovery_dividend | credit_sync_license | credit_merch |
     *   credit_live_ticket | credit_encore_day_match | credit_stipend |
     *   credit_adjustment_manual |
     *   debit_cashout | debit_refund | debit_chargeback |
     *   debit_adjustment_manual
     */
    reason: varchar("reason", { length: 32 }).notNull(),
    sourceTable: varchar("source_table", { length: 64 }),
    sourceId: uuid("source_id"),
    /** External idempotency key (e.g. Stripe checkout session id). */
    sourceRef: varchar("source_ref", { length: 200 }),
    /** Human-readable note for the artist dashboard. */
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    walletCreatedIdx: index("wallet_ledger_wallet_created_idx").on(t.walletId, t.createdAt),
    reasonIdx: index("wallet_ledger_reason_idx").on(t.reason),
    sourceDedupUq: uniqueIndex("wallet_ledger_wallet_source_dedup_uq")
      .on(t.walletId, t.sourceTable, t.sourceRef)
      .where(sql`${t.sourceTable} is not null and ${t.sourceRef} is not null`),
  }),
);

// ---------- Tips (one-off + recurring fan-to-artist) ----------

export const tips = pgTable(
  "tips",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    fromUserId: uuid("from_user_id").references(() => users.id, { onDelete: "set null" }),
    /** Anonymous tip flag (user's display name hidden from artist). */
    anonymous: boolean("anonymous").default(false).notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: varchar("currency", { length: 3 }).default("USD").notNull(),
    /** "one_off" | "monthly" | "annual" */
    cadence: varchar("cadence", { length: 16 }).default("one_off").notNull(),
    /** Rail used: "stripe" | "lightning" | "wise" | "mpesa" | "momo" | etc. */
    rail: varchar("rail", { length: 24 }).notNull(),
    railRef: varchar("rail_ref", { length: 200 }),
    /** Message from the fan (optional, 500 char limit). */
    message: varchar("message", { length: 500 }),
    /** Encore Day or other matching bonus applied. */
    matchedAmountCents: integer("matched_amount_cents").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    artistCreatedIdx: index("tips_artist_created_idx").on(t.artistId, t.createdAt),
  }),
);

// ---------- Subscription allocation (user-centric pool slice per artist per period) ----------

export const subscriptionAllocationPeriods = pgTable("subscription_allocation_periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  /** Subscription net revenue this period (after processor fees), excludes Discovery Dividend slice. */
  netRevenueCents: bigint("net_revenue_cents", { mode: "number" }).notNull(),
  /** What % of net goes to artist user-centric pool (default 70). */
  artistPoolPercent: integer("artist_pool_percent").default(70).notNull(),
  status: varchar("status", { length: 16 }).default("open").notNull(),
  settledAt: timestamp("settled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Per-artist payout for a subscription allocation period.
 * Sum of all rows for a period MUST equal the period's user-centric
 * pool slice (audited via v_audit_user_centric_allocation).
 */
export const subscriptionAllocations = pgTable(
  "subscription_allocations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    periodId: uuid("period_id")
      .notNull()
      .references(() => subscriptionAllocationPeriods.id, { onDelete: "cascade" }),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    contributingListeners: integer("contributing_listeners").notNull(),
    payoutCents: bigint("payout_cents", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    periodArtistUnique: uniqueIndex("sub_allocations_period_artist_unique").on(
      t.periodId,
      t.artistId,
    ),
  }),
);

// ---------- Discovery Dividend (every-verified-play earns, regardless of fan habit) ----------

export const discoveryDividendPeriods = pgTable("discovery_dividend_periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  /** Pool funded by: 10% of subscription revenue + 100% of contextual ad revenue. */
  poolCents: bigint("pool_cents", { mode: "number" }).notNull(),
  totalVerifiedPlays: bigint("total_verified_plays", { mode: "number" }).notNull(),
  /** Per-play rate in micro-cents (1/1,000,000 of a cent) for precision. */
  perPlayRateMicroCents: bigint("per_play_rate_micro_cents", { mode: "number" }).notNull(),
  status: varchar("status", { length: 16 }).default("open").notNull(),
  settledAt: timestamp("settled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const discoveryDividendPayouts = pgTable(
  "discovery_dividend_payouts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    periodId: uuid("period_id")
      .notNull()
      .references(() => discoveryDividendPeriods.id, { onDelete: "cascade" }),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    verifiedPlays: integer("verified_plays").notNull(),
    payoutCents: bigint("payout_cents", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    periodArtistUnique: uniqueIndex("disc_div_payouts_period_artist_unique").on(
      t.periodId,
      t.artistId,
    ),
  }),
);

// ---------- Sync licensing (catalog opt-in, low blanket rate) ----------

export const syncLicenseOptIn = pgTable("sync_license_opt_in", {
  id: uuid("id").defaultRandom().primaryKey(),
  trackId: uuid("track_id")
    .notNull()
    .unique()
    .references(() => tracks.id, { onDelete: "cascade" }),
  /**
   * Tier 1 = $5/use (indie podcast under 5k DLs),
   * Tier 2 = $50/use (indie film under $100k budget),
   * Tier 3 = $500/use (commercial under $1M ad spend).
   * Higher tiers require artist negotiation (not auto-cleared).
   */
  enabledTiers: jsonb("enabled_tiers").default(sql`'[1]'::jsonb`).notNull(),
  allowDerivatives: boolean("allow_derivatives").default(false).notNull(),
  /** Brand categories the artist refuses (e.g. ["tobacco","weapons","fast_food"]). */
  brandExclusions: jsonb("brand_exclusions").default(sql`'[]'::jsonb`).notNull(),
  optedInAt: timestamp("opted_in_at", { withTimezone: true }).defaultNow().notNull(),
});

export const syncLicenseUsage = pgTable("sync_license_usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  trackId: uuid("track_id")
    .notNull()
    .references(() => tracks.id, { onDelete: "cascade" }),
  licenseeUserId: uuid("licensee_user_id").references(() => users.id, { onDelete: "set null" }),
  tier: integer("tier").notNull(),
  useType: varchar("use_type", { length: 32 }).notNull(),
  useDescription: text("use_description").notNull(),
  feeCents: integer("fee_cents").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  /** Artist gets 85%, foundation legal-ops sub-pool gets 15%. Platform fee = 0. */
  artistShareCents: integer("artist_share_cents").notNull(),
  legalOpsShareCents: integer("legal_ops_share_cents").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Live events (Bandsintown / Songkick / native) ----------

export const liveEvents = pgTable(
  "live_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    venueName: varchar("venue_name", { length: 200 }),
    venueAddress: text("venue_address"),
    city: varchar("city", { length: 120 }),
    country: varchar("country", { length: 2 }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    ticketUrl: text("ticket_url"),
    /** "native" | "bandsintown" | "songkick" */
    source: varchar("source", { length: 16 }).default("native").notNull(),
    sourceRef: varchar("source_ref", { length: 200 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    artistStartsIdx: index("live_events_artist_starts_idx").on(t.artistId, t.startsAt),
  }),
);

// ---------- Merch (Printful / Printify / self fulfillment passthrough) ----------

export const merchItems = pgTable("merch_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  sku: varchar("sku", { length: 64 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  /** Fulfillment partner: "printful" | "printify" | "self". */
  fulfillment: varchar("fulfillment", { length: 16 }).default("self").notNull(),
  partnerSku: varchar("partner_sku", { length: 200 }),
  imageKey: text("image_key"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const merchSales = pgTable("merch_sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  itemId: uuid("item_id")
    .notNull()
    .references(() => merchItems.id, { onDelete: "cascade" }),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  buyerUserId: uuid("buyer_user_id").references(() => users.id, { onDelete: "set null" }),
  quantity: integer("quantity").notNull(),
  grossCents: integer("gross_cents").notNull(),
  partnerCostCents: integer("partner_cost_cents").default(0).notNull(),
  /** Artist nets gross - partnerCost - processor fee. Platform fee = 0. */
  artistNetCents: integer("artist_net_cents").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  shippingCents: integer("shipping_cents").default(0).notNull(),
  status: varchar("status", { length: 16 }).default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Encore Day (matched-tip monthly event) ----------

export const encoreDayPeriods = pgTable("encore_day_periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  dayDate: timestamp("day_date", { withTimezone: true }).notNull().unique(),
  /** Funded by listener round-ups + foundation surplus + dedicated grants. */
  matchPoolCents: bigint("match_pool_cents", { mode: "number" }).notNull(),
  matchRatePercent: integer("match_rate_percent").default(25).notNull(),
  poolRemainingCents: bigint("pool_remaining_cents", { mode: "number" }).notNull(),
  settledAt: timestamp("settled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Working Musician Stipend (Year 2+ foundation grant program) ----------

export const stipendEnrollments = pgTable("stipend_enrollments", {
  id: uuid("id").defaultRandom().primaryKey(),
  artistId: uuid("artist_id")
    .notNull()
    .unique()
    .references(() => artists.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 16 }).default("pending").notNull(),
  /** "baseline" | "developing" | "living_wage" */
  tier: varchar("tier", { length: 16 }).default("baseline").notNull(),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).defaultNow().notNull(),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
});

/**
 * Stipend payouts. Funding source MUST be foundation grants, never
 * the subscription pool — enforced by application code in
 * apps/worker/src/jobs/stipend-disburse.ts and auditable via
 * v_audit_stipend_funding_source.
 */
export const stipendDisbursements = pgTable("stipend_disbursements", {
  id: uuid("id").defaultRandom().primaryKey(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  /** YYYY-MM, the month this stipend covers. */
  periodMonth: varchar("period_month", { length: 7 }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  /** Always "foundation_grants" — code-enforced. Never "subscription_pool". */
  fundingSource: varchar("funding_source", { length: 32 })
    .default("foundation_grants")
    .notNull(),
  status: varchar("status", { length: 16 }).default("pending").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Launch waitlist + beta invite codes (ship week) ----------

export const waitlistEntries = pgTable(
  "waitlist_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 254 }).notNull().unique(),
    /** "listener" | "artist" | "both" */
    role: varchar("role", { length: 16 }).default("listener").notNull(),
    source: varchar("source", { length: 64 }).default("landing").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
);

export const betaInviteCodes = pgTable(
  "beta_invite_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 32 }).notNull().unique(),
    maxUses: integer("max_uses").default(1).notNull(),
    uses: integer("uses").default(0).notNull(),
    note: varchar("note", { length: 200 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
);
