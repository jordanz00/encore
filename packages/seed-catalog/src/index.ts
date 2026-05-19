/**
 * @encore/seed-catalog — CC + Public Domain importer suite.
 *
 * Public surface:
 *   - importers list (FMA, Internet Archive Live Music Archive, Jamendo)
 *   - persistSeedTrack(): upserts artist + release + track rows for one SeedTrack.
 *   - runImporter(): runs a named importer to completion with summary.
 */
import { db, schema } from "@encore/db";
import { eq, sql } from "drizzle-orm";
import type { SeedImporter, SeedRunSummary, SeedTrack } from "./types.js";
import { fmaImporter } from "./fma.js";
import { internetArchiveImporter } from "./etree.js";
import { jamendoImporter } from "./jamendo.js";

export const importers: Record<SeedTrack["source"], SeedImporter> = {
  fma: fmaImporter,
  internet_archive: internetArchiveImporter,
  jamendo: jamendoImporter,
};

export type { SeedImporter, SeedTrack, SeedRunSummary } from "./types.js";

export async function persistSeedTrack(t: SeedTrack): Promise<{ inserted: boolean; reason?: string }> {
  const existingTrack = await db.execute(sql`
    SELECT id FROM tracks
    WHERE master_key = ${`seed:${t.upstreamId}`}
    LIMIT 1
  `);
  if ((existingTrack as unknown as { rows: unknown[] }).rows?.length) {
    return { inserted: false, reason: "duplicate" };
  }

  let artistRow = (
    await db
      .select()
      .from(schema.artists)
      .where(eq(schema.artists.slug, t.artistSlug))
      .limit(1)
  )[0];
  if (!artistRow) {
    const [created] = await db
      .insert(schema.artists)
      .values({
        slug: t.artistSlug,
        name: t.artistName,
        bio: `Imported from ${t.source}.`,
      })
      .returning();
    artistRow = created!;
  }

  const [release] = await db
    .insert(schema.releases)
    .values({
      primaryArtistId: artistRow.id,
      title: t.albumTitle ?? t.trackTitle,
      type: "single",
      status: "published",
      genres: t.genres as unknown as string,
      credits: [
        {
          role: "license",
          name: t.licenseUri,
          attribution: t.attribution,
        },
      ] as unknown as string,
      releaseDate: t.releasedAt ? new Date(t.releasedAt) : null,
      publishedAt: new Date(),
      sourceKind: "cc_seed",
      sourceRef: t.upstreamId,
    })
    .returning();

  await db.insert(schema.tracks).values({
    releaseId: release!.id,
    primaryArtistId: artistRow.id,
    title: t.trackTitle,
    trackNumber: t.trackNumber,
    durationMs: t.durationSeconds ? t.durationSeconds * 1000 : 0,
    masterKey: `seed:${t.upstreamId}`,
  });
  return { inserted: true };
}

export async function runImporter(
  source: SeedTrack["source"],
  limit: number,
  opts: { signal?: AbortSignal; onProgress?: (n: number, total: number) => void } = {},
): Promise<SeedRunSummary> {
  const importer = importers[source];
  const t0 = Date.now();
  const summary: SeedRunSummary = {
    source,
    attempted: 0,
    inserted: 0,
    skipped: 0,
    failed: 0,
    durationMs: 0,
    errors: [],
  };
  for await (const seedTrack of importer.fetch({ limit, signal: opts.signal })) {
    summary.attempted += 1;
    try {
      const result = await persistSeedTrack(seedTrack);
      if (result.inserted) summary.inserted += 1;
      else summary.skipped += 1;
    } catch (err) {
      summary.failed += 1;
      summary.errors.push({
        upstreamId: seedTrack.upstreamId,
        message: (err as Error).message,
      });
    }
    opts.onProgress?.(summary.attempted, limit);
  }
  summary.durationMs = Date.now() - t0;
  return summary;
}
