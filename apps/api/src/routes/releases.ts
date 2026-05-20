import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, schema } from "@encore/db";
import { eq, and, desc } from "drizzle-orm";
import { requireUser } from "../lib/auth.js";
import { queues } from "../lib/queue.js";
import { generateActorKeyPair, buildAnnounceCreateNote } from "@encore/activitypub";

export async function registerReleases(app: FastifyInstance): Promise<void> {
  app.get("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const [release] = await db
      .select()
      .from(schema.releases)
      .where(eq(schema.releases.id, id))
      .limit(1);
    if (!release) return reply.code(404).send({ error: "not_found" });
    const tracks = await db
      .select()
      .from(schema.tracks)
      .where(eq(schema.tracks.releaseId, id))
      .orderBy(schema.tracks.discNumber, schema.tracks.trackNumber);
    return { release, tracks };
  });

  app.get("/", async (req) => {
    const url = new URL(req.url, "http://x");
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 24), 100);
    const releases = await db
      .select()
      .from(schema.releases)
      .where(eq(schema.releases.status, "published"))
      .orderBy(desc(schema.releases.publishedAt))
      .limit(limit);
    return { releases };
  });

  const createSchema = z.object({
    artistId: z.string().uuid(),
    title: z.string().min(1).max(255),
    type: z.enum([
      "single",
      "ep",
      "album",
      "compilation",
      "live",
      "remix",
      "soundtrack",
      "mixtape",
    ]),
    releaseDate: z.string().datetime().optional(),
    priceFloorCents: z.number().int().min(0).max(1_000_000).optional(),
    currency: z.string().length(3).optional(),
    genres: z.array(z.string().max(40)).max(8).optional(),
  });

  app.post("/", async (req, reply) => {
    const user = await requireUser(req);
    const body = createSchema.parse(req.body);

    // Verify the user owns the artist they're publishing as.
    const [artist] = await db
      .select({
        id: schema.artists.id,
        ownerUserId: schema.artists.ownerUserId,
      })
      .from(schema.artists)
      .where(
        and(
          eq(schema.artists.id, body.artistId),
          eq(schema.artists.ownerUserId, user.id),
        ),
      )
      .limit(1);
    if (!artist) return reply.code(403).send({ error: "not_artist_owner" });

    const [release] = await db
      .insert(schema.releases)
      .values({
        primaryArtistId: artist.id,
        title: body.title,
        type: body.type,
        releaseDate: body.releaseDate ? new Date(body.releaseDate) : null,
        priceFloorCents: body.priceFloorCents ?? null,
        currency: body.currency ?? "USD",
        genres: body.genres ?? [],
      })
      .returning();
    return { release };
  });

  app.post("/:id/publish", async (req, reply) => {
    const user = await requireUser(req);
    const { id } = req.params as { id: string };

    const [release] = await db
      .select()
      .from(schema.releases)
      .where(eq(schema.releases.id, id))
      .limit(1);
    if (!release) return reply.code(404).send({ error: "not_found" });

    const [artist] = await db
      .select({
        id: schema.artists.id,
        slug: schema.artists.slug,
        name: schema.artists.name,
        ownerUserId: schema.artists.ownerUserId,
      })
      .from(schema.artists)
      .where(eq(schema.artists.id, release.primaryArtistId))
      .limit(1);
    if (!artist || artist.ownerUserId !== user.id) {
      return reply.code(403).send({ error: "not_artist_owner" });
    }

    const now = new Date();
    const [published] = await db
      .update(schema.releases)
      .set({ status: "published", publishedAt: now, updatedAt: now })
      .where(eq(schema.releases.id, id))
      .returning();

    if (process.env.ENABLE_ACTIVITYPUB === "true") {
      const baseUrl = process.env.ACTIVITYPUB_BASE_URL ?? "https://encore.local";
      const [keysRow] = await db
        .select({
          publicKeyPem: schema.artists.actorPublicKeyPem,
          privateKeyPem: schema.artists.actorPrivateKeyPem,
        })
        .from(schema.artists)
        .where(eq(schema.artists.id, artist.id))
        .limit(1);
      let privateKeyPem = keysRow?.privateKeyPem;
      let publicKeyPem = keysRow?.publicKeyPem;
      if (!privateKeyPem || !publicKeyPem) {
        const minted = generateActorKeyPair();
        privateKeyPem = minted.privateKeyPem;
        publicKeyPem = minted.publicKeyPem;
        await db
          .update(schema.artists)
          .set({
            actorPublicKeyPem: publicKeyPem,
            actorPrivateKeyPem: privateKeyPem,
            actorIri: `${baseUrl}/users/${artist.slug}`,
          })
          .where(eq(schema.artists.id, artist.id));
      }
      const releaseUrl = `${baseUrl}/release/${id}`;
      const coverArtUrl = release.coverArtKey
        ? `${baseUrl}/media/images/${encodeURIComponent(release.coverArtKey)}`
        : null;
      const activity = buildAnnounceCreateNote({
        baseUrl,
        artistSlug: artist.slug,
        releaseId: id,
        releaseTitle: release.title,
        releaseUrl,
        coverArtUrl,
        publishedAt: now,
      });
      await queues.outboxFanout.add(
        "publish-release",
        {
          artistId: artist.id,
          activity,
          privateKeyPem: privateKeyPem!,
          keyId: `${baseUrl}/users/${artist.slug}#main-key`,
        },
        { removeOnComplete: 100, attempts: 3 },
      );
    }

    return { release: published, federated: process.env.ENABLE_ACTIVITYPUB === "true" };
  });
}
