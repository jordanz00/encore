/**
 * Federation — ActivityPub bridge (RFC 005).
 *
 * Register **without** a URL prefix so Webfinger and actor IRIs match
 * `ACTIVITYPUB_BASE_URL/users/:slug` (Mastodon-compatible).
 */
import type { FastifyInstance, FastifyRequest } from "fastify";
import { db, schema } from "@encore/db";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  buildPersonActor,
  buildWebfingerResponse,
  buildAcceptFollow,
  buildAnnounceCreateNote,
  generateActorKeyPair,
  signRequest,
  verifyRequest,
} from "@encore/activitypub";

function coverUrl(baseUrl: string, key: string | null): string | null {
  if (!key) return null;
  return `${baseUrl}/media/images/${encodeURIComponent(key)}`;
}

export async function registerFederation(app: FastifyInstance): Promise<void> {
  const enabled = process.env.ENABLE_ACTIVITYPUB === "true";
  const baseUrl = process.env.ACTIVITYPUB_BASE_URL ?? "https://encore.local";
  const domain = new URL(baseUrl).host;

  app.get("/federation", async () => ({
    enabled,
    spec: "https://www.w3.org/TR/activitypub/",
    baseUrl,
    webfinger: `${baseUrl}/.well-known/webfinger`,
  }));

  app.get("/.well-known/webfinger", async (req, reply) => {
    if (!enabled) return reply.code(404).send();
    const url = new URL(req.url, baseUrl);
    const resource = url.searchParams.get("resource");
    if (!resource?.startsWith("acct:")) return reply.code(400).send({ error: "bad_resource" });
    const acct = resource.slice("acct:".length);
    const [name, host] = acct.split("@");
    if (!name || host !== domain) return reply.code(404).send();
    const [artist] = await db
      .select()
      .from(schema.artists)
      .where(eq(schema.artists.slug, name))
      .limit(1);
    if (!artist) return reply.code(404).send();
    return reply
      .type("application/jrd+json")
      .send(buildWebfingerResponse({ baseUrl, acct, artistSlug: artist.slug }));
  });

  const actorHandler = async (req: FastifyRequest, reply: { code: (n: number) => { send: (b?: unknown) => void }; type: (t: string) => { send: (b: unknown) => void } }) => {
    if (!enabled) return reply.code(404).send();
    const { slug } = req.params as { slug: string };
    const [artist] = await db
      .select()
      .from(schema.artists)
      .where(eq(schema.artists.slug, slug))
      .limit(1);
    if (!artist) return reply.code(404).send();

    const config = await ensureActorKeys(artist.id, artist.slug, baseUrl);
    return reply.type("application/activity+json").send(
      buildPersonActor({
        baseUrl,
        artistSlug: artist.slug,
        preferredUsername: artist.slug,
        displayName: artist.name,
        summary: artist.bio,
        iconUrl: coverUrl(baseUrl, artist.avatarKey),
        bannerUrl: coverUrl(baseUrl, artist.bannerKey),
        publicKeyPem: config.publicKeyPem,
      }),
    );
  };

  app.get("/users/:slug", actorHandler);
  app.get("/federation/users/:slug", actorHandler);

  const outboxHandler = async (req: FastifyRequest, reply: { code: (n: number) => { send: () => void }; type: (t: string) => { send: (b: unknown) => void } }) => {
    if (!enabled) return reply.code(404).send();
    const { slug } = req.params as { slug: string };
    const [artist] = await db
      .select()
      .from(schema.artists)
      .where(eq(schema.artists.slug, slug))
      .limit(1);
    if (!artist) return reply.code(404).send();

    const releases = await db
      .select()
      .from(schema.releases)
      .where(
        and(
          eq(schema.releases.primaryArtistId, artist.id),
          eq(schema.releases.status, "published"),
        ),
      )
      .orderBy(desc(schema.releases.publishedAt))
      .limit(20);

    const items = releases.map((r) =>
      buildAnnounceCreateNote({
        baseUrl,
        artistSlug: artist.slug,
        releaseId: r.id,
        releaseTitle: r.title,
        releaseUrl: `${baseUrl}/release/${r.id}`,
        coverArtUrl: coverUrl(baseUrl, r.coverArtKey),
        publishedAt: r.publishedAt ?? r.createdAt,
      }),
    );

    return reply.type("application/activity+json").send({
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "OrderedCollection",
      totalItems: items.length,
      orderedItems: items,
    });
  };

  app.get("/users/:slug/outbox", outboxHandler);
  app.get("/federation/users/:slug/outbox", outboxHandler);

  const inboxHandler = async (req: FastifyRequest, reply: { code: (n: number) => { send: (b: unknown) => void } }) => {
    if (!enabled) return reply.code(404).send();
    const { slug } = req.params as { slug: string };
    const [artist] = await db
      .select({ id: schema.artists.id })
      .from(schema.artists)
      .where(eq(schema.artists.slug, slug))
      .limit(1);
    if (!artist) return reply.code(404).send({ error: "artist_not_found" });

    const rawBody = await collectRawBody(req);
    const verification = await verifyRequest({
      method: "POST",
      path: req.url.split("?")[0]!,
      headers: req.headers as Record<string, string | undefined>,
      body: rawBody,
      resolvePublicKey: resolveRemotePublicKey,
    });
    if (!verification.ok) {
      return reply.code(401).send({ error: "signature_invalid", reason: verification.reason });
    }
    const activity = JSON.parse(rawBody.toString("utf8")) as {
      type?: string;
      actor?: string | { id?: string; inbox?: string };
      object?: string | { id?: string };
    };
    if (activity.type === "Follow") {
      const followerActorIri = actorIri(activity.actor);
      const followActivity = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>;
      let inboxUrl =
        typeof activity.actor === "object" && activity.actor?.inbox
          ? String(activity.actor.inbox)
          : null;
      if (followerActorIri) {
        if (!inboxUrl) inboxUrl = await resolveFollowerInbox(followerActorIri);
        await db
          .insert(schema.remoteFollowers)
          .values({
            artistId: artist.id,
            followerActorIri,
            followerInboxUrl: inboxUrl,
          })
          .onConflictDoNothing();
        if (inboxUrl) {
          const keys = await ensureActorKeys(artist.id, slug, baseUrl);
          const keyId = `${baseUrl}/users/${slug}#main-key`;
          void deliverAcceptFollow({
            inboxUrl,
            followActivity,
            baseUrl,
            artistSlug: slug,
            privateKeyPem: keys.privateKeyPem,
            keyId,
          }).catch(() => undefined);
        }
      }
      return reply.code(202).send({
        accepted: true,
        kind: "Follow",
        stored: Boolean(followerActorIri),
        acceptDelivered: Boolean(followerActorIri && inboxUrl),
      });
    }
    if (activity.type === "Like" || activity.type === "Announce") {
      return reply.code(202).send({ accepted: true, kind: activity.type });
    }
    return reply.code(202).send({ accepted: true });
  };

  app.post("/users/:slug/inbox", inboxHandler);
  app.post("/federation/users/:slug/inbox", inboxHandler);
}

function actorIri(actor: unknown): string | null {
  if (typeof actor === "string" && actor.startsWith("http")) return actor;
  if (actor && typeof actor === "object" && "id" in actor) {
    const id = (actor as { id?: string }).id;
    if (typeof id === "string" && id.startsWith("http")) return id;
  }
  return null;
}

async function ensureActorKeys(
  artistId: string,
  slug: string,
  baseUrl: string,
): Promise<{ publicKeyPem: string; privateKeyPem: string }> {
  const [row] = await db
    .select({
      publicKeyPem: schema.artists.actorPublicKeyPem,
      privateKeyPem: schema.artists.actorPrivateKeyPem,
    })
    .from(schema.artists)
    .where(eq(schema.artists.id, artistId))
    .limit(1);

  if (row?.publicKeyPem && row?.privateKeyPem) {
    return { publicKeyPem: row.publicKeyPem, privateKeyPem: row.privateKeyPem };
  }

  const keys = generateActorKeyPair();
  await db
    .update(schema.artists)
    .set({
      actorPublicKeyPem: keys.publicKeyPem,
      actorPrivateKeyPem: keys.privateKeyPem,
      actorIri: `${baseUrl}/users/${slug}`,
      updatedAt: new Date(),
    })
    .where(eq(schema.artists.id, artistId));
  return keys;
}

async function resolveRemotePublicKey(keyId: string): Promise<string | null> {
  try {
    const actorIri = keyId.split("#")[0]!;
    const res = await fetch(actorIri, {
      headers: { Accept: "application/activity+json" },
    });
    if (!res.ok) return null;
    const actor = (await res.json()) as { publicKey?: { publicKeyPem?: string } };
    return actor.publicKey?.publicKeyPem ?? null;
  } catch {
    return null;
  }
}

const FED_USER_AGENT = "Encore-Federation/0.0.1";

async function resolveFollowerInbox(actorIri: string): Promise<string | null> {
  try {
    const res = await fetch(actorIri, {
      headers: { Accept: "application/activity+json", "User-Agent": FED_USER_AGENT },
    });
    if (!res.ok) return null;
    const actor = (await res.json()) as { inbox?: string | string[] };
    if (typeof actor.inbox === "string") return actor.inbox;
    if (Array.isArray(actor.inbox) && typeof actor.inbox[0] === "string") {
      return actor.inbox[0];
    }
    return null;
  } catch {
    return null;
  }
}

async function deliverAcceptFollow(opts: {
  inboxUrl: string;
  followActivity: Record<string, unknown>;
  baseUrl: string;
  artistSlug: string;
  privateKeyPem: string;
  keyId: string;
}): Promise<{ ok: boolean; status?: number }> {
  const accept = buildAcceptFollow({
    baseUrl: opts.baseUrl,
    artistSlug: opts.artistSlug,
    followActivity: opts.followActivity,
  });
  const body = JSON.stringify(accept);
  const headers = signRequest({
    method: "POST",
    url: opts.inboxUrl,
    body,
    privateKeyPem: opts.privateKeyPem,
    keyId: opts.keyId,
  });
  const res = await fetch(opts.inboxUrl, {
    method: "POST",
    headers: { ...headers, "User-Agent": FED_USER_AGENT },
    body,
  });
  return { ok: res.ok || res.status === 202, status: res.status };
}

async function collectRawBody(req: FastifyRequest): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body, "utf8");
  return Buffer.from(JSON.stringify(req.body ?? {}), "utf8");
}
