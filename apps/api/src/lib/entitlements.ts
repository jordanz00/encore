/**
 * Subscription tier entitlements + audio-quality gating.
 *
 * Free          — 128 kbps AAC, ads, no offline, 1 active device
 * Premium       — 320 kbps AAC, no ads, offline, 5 devices, lyrics
 * Family        — Premium for up to 6 accounts under one billing
 * Student       — Premium with proof-of-enrollment
 * HiFi          — Premium + lossless FLAC + spatial audio (binaural)
 */
import { db, schema } from "@encore/db";
import { eq } from "drizzle-orm";

export type Tier = "free" | "premium" | "family" | "student" | "hifi";

export interface Entitlements {
  tier: Tier;
  maxAudioKbps: number;
  losslessAllowed: boolean;
  spatialAllowed: boolean;
  adsServed: boolean;
  offlineAllowed: boolean;
  maxActiveDevices: number;
  familyMembersAllowed: number;
  lyricsAllowed: boolean;
  pricePerMonthCents: number;
  currency: string;
}

const TABLE: Record<Tier, Omit<Entitlements, "tier">> = {
  free: {
    maxAudioKbps: 128,
    losslessAllowed: false,
    spatialAllowed: false,
    adsServed: true,
    offlineAllowed: false,
    maxActiveDevices: 1,
    familyMembersAllowed: 1,
    lyricsAllowed: false,
    pricePerMonthCents: 0,
    currency: "USD",
  },
  premium: {
    maxAudioKbps: 320,
    losslessAllowed: false,
    spatialAllowed: false,
    adsServed: false,
    offlineAllowed: true,
    maxActiveDevices: 5,
    familyMembersAllowed: 1,
    lyricsAllowed: true,
    pricePerMonthCents: 599,
    currency: "USD",
  },
  family: {
    maxAudioKbps: 320,
    losslessAllowed: false,
    spatialAllowed: false,
    adsServed: false,
    offlineAllowed: true,
    maxActiveDevices: 30,
    familyMembersAllowed: 6,
    lyricsAllowed: true,
    pricePerMonthCents: 999,
    currency: "USD",
  },
  student: {
    maxAudioKbps: 320,
    losslessAllowed: false,
    spatialAllowed: false,
    adsServed: false,
    offlineAllowed: true,
    maxActiveDevices: 5,
    familyMembersAllowed: 1,
    lyricsAllowed: true,
    pricePerMonthCents: 299,
    currency: "USD",
  },
  hifi: {
    maxAudioKbps: 1411,
    losslessAllowed: true,
    spatialAllowed: true,
    adsServed: false,
    offlineAllowed: true,
    maxActiveDevices: 5,
    familyMembersAllowed: 1,
    lyricsAllowed: true,
    pricePerMonthCents: 999,
    currency: "USD",
  },
};

export function entitlementsFor(tier: Tier): Entitlements {
  return { tier, ...TABLE[tier] };
}

export async function loadEntitlements(userId: string | null): Promise<Entitlements> {
  if (!userId) return entitlementsFor("free");
  const [sub] = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, userId))
    .limit(1);
  if (!sub) return entitlementsFor("free");
  const now = new Date();
  if (sub.cancelAt && sub.cancelAt < now) return entitlementsFor("free");
  if (sub.currentPeriodEnd && sub.currentPeriodEnd < now) return entitlementsFor("free");
  return entitlementsFor(sub.tier as Tier);
}

/**
 * Pick the best stream variant URL for a track + entitlements.
 *
 * Returns master.m3u8 with a bitrate cap by default; HiFi tier gets
 * FLAC progressive when available.
 */
export function pickQualityVariant(input: {
  hlsKey: string | null;
  flacKey: string | null;
  entitlements: Entitlements;
  cdnBase: string;
}): { url: string; format: "hls" | "flac"; bitrateCap: number } | null {
  if (input.entitlements.losslessAllowed && input.flacKey) {
    return {
      url: `${input.cdnBase}/${input.flacKey}`,
      format: "flac",
      bitrateCap: 1411,
    };
  }
  if (input.hlsKey) {
    return {
      url: `${input.cdnBase}/${input.hlsKey}`,
      format: "hls",
      bitrateCap: input.entitlements.maxAudioKbps,
    };
  }
  return null;
}
