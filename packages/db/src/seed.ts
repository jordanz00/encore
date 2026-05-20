/**
 * Dev seed — creates a demo listener, an artist, and a sample release with
 * one (HLS-less) track so the UI has something to render on first boot.
 *
 * Usage: pnpm --filter @encore/db seed
 */
import { db, schema } from "./index.js";

async function main(): Promise<void> {
  const [user] = await db
    .insert(schema.users)
    .values({
      handle: "demo",
      email: "demo@encore.local",
      displayName: "Demo Listener",
      role: "listener",
    })
    .onConflictDoNothing()
    .returning();

  const [artist] = await db
    .insert(schema.artists)
    .values({
      slug: "encore-house-band",
      name: "Encore House Band",
      bio: "Public-domain house demo for testing the platform.",
      ownerUserId: user?.id ?? null,
      verified: true,
    })
    .onConflictDoNothing()
    .returning();

  if (!artist) {
    console.log("[seed] artist already exists; nothing to do.");
    return;
  }

  const [release] = await db
    .insert(schema.releases)
    .values({
      primaryArtistId: artist.id,
      title: "First Light",
      type: "ep",
      status: "published",
      genres: ["electronic", "ambient"],
      publishedAt: new Date(),
      releaseDate: new Date(),
      sourceKind: "upload",
      moderation: "approved",
    })
    .returning();

  await db.insert(schema.tracks).values([
    {
      releaseId: release!.id,
      primaryArtistId: artist.id,
      title: "Open Tone",
      trackNumber: 1,
      durationMs: 187_000,
      moderation: "approved",
    },
    {
      releaseId: release!.id,
      primaryArtistId: artist.id,
      title: "Common Chord",
      trackNumber: 2,
      durationMs: 224_000,
      moderation: "approved",
    },
  ]);

  const betaCodes = ["ENCORE-BETA-01", "ENCORE-BETA-02", "ENCORE-BETA-03"];
  for (const code of betaCodes) {
    await db
      .insert(schema.betaInviteCodes)
      .values({ code, maxUses: 100, note: "dev seed" })
      .onConflictDoNothing();
  }

  console.log("[seed] done. demo user + artist + release + beta codes created.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
