/**
 * Subsonic REST API (MVP) — Symfonium / play:Sub compatibility.
 *
 * Mounted at /rest/* (Subsonic convention). Auth via u + p (or token) query params
 * when SUBSONIC_PASSWORD is set; otherwise read-only browse for local dev.
 */
import type { FastifyInstance, FastifyRequest } from "fastify";
import { db, schema } from "@encore/db";
import { eq, desc, and, isNull } from "drizzle-orm";

const SUBSONIC_VERSION = "1.16.1";
const API_VERSION = 0;

type SubsonicQuery = {
  u?: string;
  p?: string;
  t?: string;
  s?: string;
  v?: string;
  c?: string;
  f?: string;
  id?: string;
  type?: string;
  size?: string;
  offset?: string;
};

function subsonicOk(
  req: FastifyRequest,
  inner: Record<string, unknown>,
): Record<string, unknown> {
  const q = req.query as SubsonicQuery;
  const format = q.f === "json" ? "json" : "xml";
  const payload = {
    "subsonic-response": {
      xmlns: "http://subsonic.org/restapi",
      status: "ok",
      version: SUBSONIC_VERSION,
      type: "encore",
      serverVersion: process.env.GIT_SHA?.slice(0, 7) ?? "0.0.1",
      openHome: "https://github.com/jordanz00/encore",
      ...inner,
    },
  };
  if (format === "json") return payload;
  return payload;
}

function checkAuth(req: FastifyRequest): boolean {
  const required = process.env.SUBSONIC_PASSWORD;
  if (!required) return true;
  const q = req.query as SubsonicQuery;
  const token = q.t && q.s ? `${q.t}${q.s}` : null;
  if (token && token === required) return true;
  if (q.p === required) return true;
  return false;
}

function authFail(req: FastifyRequest): Record<string, unknown> {
  return {
    "subsonic-response": {
      xmlns: "http://subsonic.org/restapi",
      status: "failed",
      version: SUBSONIC_VERSION,
      error: { code: 40, message: "Wrong username or password." },
    },
  };
}

function cdnBase(): string {
  return (process.env.CDN_BASE_URL ?? process.env.API_PUBLIC_URL ?? "http://localhost:4000").replace(
    /\/$/,
    "",
  );
}

export async function registerSubsonic(app: FastifyInstance): Promise<void> {
  const handle = async (req: FastifyRequest, reply: { code: (n: number) => { send: (b: unknown) => void } }) => {
    if (!checkAuth(req)) {
      return reply.code(401).send(authFail(req));
    }
    const path = (req.url.split("?")[0] ?? "").split("/").pop()?.replace(/\.view$/, "") ?? "";
    const q = req.query as SubsonicQuery;

    if (path === "ping") {
      return subsonicOk(req, {});
    }
    if (path === "getLicense") {
      return subsonicOk(req, {
        license: {
          valid: true,
          email: "legal@encore.audio",
          license: "AGPL-3.0 — Encore open-source music platform.",
        },
      });
    }
    if (path === "getArtists" || path === "getIndexes") {
      const artistRows = await db
        .select()
        .from(schema.artists)
        .where(isNull(schema.artists.deletedAt))
        .limit(500);
      const indexes = artistRows.map((a) => ({
        artist: [
          {
            id: a.id,
            name: a.name,
            coverArt: a.avatarKey ?? undefined,
            albumCount: 0,
          },
        ],
      }));
      return subsonicOk(req, {
        artists: { index: [{ name: "E", artist: artistRows.map((a) => ({ id: a.id, name: a.name })) }] },
        indexes: { index: indexes },
      });
    }
    if (path === "getAlbumList2") {
      const size = Math.min(Number(q.size ?? 50), 100);
      const offset = Math.max(Number(q.offset ?? 0), 0);
      const releases = await db
        .select()
        .from(schema.releases)
        .where(
          and(eq(schema.releases.status, "published"), isNull(schema.releases.deletedAt)),
        )
        .orderBy(desc(schema.releases.publishedAt))
        .limit(size)
        .offset(offset);
      return subsonicOk(req, {
        albumList2: {
          album: releases.map((r) => ({
            id: r.id,
            name: r.title,
            artist: r.primaryArtistId,
            artistId: r.primaryArtistId,
            coverArt: r.coverArtKey ?? undefined,
            songCount: 0,
            created: r.publishedAt?.toISOString() ?? r.createdAt.toISOString(),
          })),
        },
      });
    }
    if (path === "getAlbum") {
      const albumId = q.id;
      if (!albumId) return subsonicOk(req, {});
      const [release] = await db
        .select()
        .from(schema.releases)
        .where(eq(schema.releases.id, albumId))
        .limit(1);
      if (!release) return subsonicOk(req, {});
      const songs = await db
        .select()
        .from(schema.tracks)
        .where(eq(schema.tracks.releaseId, albumId))
        .orderBy(schema.tracks.discNumber, schema.tracks.trackNumber);
      const [artist] = await db
        .select()
        .from(schema.artists)
        .where(eq(schema.artists.id, release.primaryArtistId))
        .limit(1);
      return subsonicOk(req, {
        album: {
          id: release.id,
          name: release.title,
          artist: artist?.name ?? "Unknown",
          artistId: release.primaryArtistId,
          coverArt: release.coverArtKey ?? undefined,
          song: songs.map((t) => ({
            id: t.id,
            title: t.title,
            album: release.title,
            albumId: release.id,
            artist: artist?.name ?? "Unknown",
            artistId: release.primaryArtistId,
            track: t.trackNumber,
            duration: Math.round((t.durationMs ?? 0) / 1000),
            contentType: "audio/mpeg",
            path: t.id,
          })),
        },
      });
    }
    if (path === "stream") {
      const trackId = q.id;
      if (!trackId) return reply.code(400).send({ error: "id_required" });
      const [track] = await db
        .select()
        .from(schema.tracks)
        .where(eq(schema.tracks.id, trackId))
        .limit(1);
      if (!track) return reply.code(404).send({ error: "not_found" });
      const key = track.hlsKey ?? track.flacKey ?? track.masterKey;
      if (!key) return reply.code(404).send({ error: "no_audio" });
      const apiBase = (process.env.API_PUBLIC_URL ?? "http://localhost:3001").replace(/\/$/, "");
      const url = `${apiBase}/media/audio/${encodeURIComponent(key)}`;
      return reply.redirect(302, url);
    }
    if (path === "getCoverArt") {
      const id = q.id;
      if (!id) return reply.code(404).send();
      const [release] = await db
        .select({ coverArtKey: schema.releases.coverArtKey })
        .from(schema.releases)
        .where(eq(schema.releases.id, id))
        .limit(1);
      const key = release?.coverArtKey;
      if (!key) return reply.code(404).send();
      return reply.code(302).header("Location", `${cdnBase()}/images/${key}`).send();
    }
    if (path === "scrobble") {
      return subsonicOk(req, { scrobbleStatus: { ignored: 0 } });
    }

    return subsonicOk(req, {});
  };

  app.get("/*", handle);
}
