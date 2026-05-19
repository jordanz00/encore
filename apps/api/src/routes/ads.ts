/**
 * Ads — STUB (privacy-first contextual ads).
 *
 * Ads are CONTEXTUAL ONLY: targeted by genre, mood, time-of-day, language.
 * Never behavioral profiling, no third-party trackers, no cross-site cookies.
 *
 * The ad is itself a track upload (or short audio clip) by another artist or
 * label. We never sell listener data; we sell exposure to genre context.
 */
import type { FastifyInstance } from "fastify";
import { db, schema } from "@encore/db";
import { and, eq, gt } from "drizzle-orm";

export async function registerAds(app: FastifyInstance): Promise<void> {
  app.get("/serve", async (req) => {
    const url = new URL(req.url, "http://x");
    const genre = url.searchParams.get("genre");
    const language = url.searchParams.get("lang");

    const candidates = await db.select().from(schema.adCampaigns)
      .where(and(
        eq(schema.adCampaigns.active, true),
        gt(schema.adCampaigns.budgetCents, schema.adCampaigns.spendCents),
      ))
      .limit(20);

    const filtered = candidates.filter((c) => {
      const t = (c.targetingJson ?? {}) as { genres?: string[]; languages?: string[] };
      if (t.genres?.length && genre && !t.genres.includes(genre)) return false;
      if (t.languages?.length && language && !t.languages.includes(language)) return false;
      return true;
    });

    if (filtered.length === 0) return { ad: null };
    const pick = filtered[Math.floor(Math.random() * filtered.length)];
    return { ad: { id: pick!.id, releaseId: pick!.releaseId, artistId: pick!.artistId } };
  });
}
