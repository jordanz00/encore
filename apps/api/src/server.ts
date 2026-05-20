/**
 * Fastify app composition.
 * Wires plugins (cors, helmet, cookies, rate-limit, multipart) and route groups.
 */
import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import sensible from "@fastify/sensible";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";

import { registerHealth } from "./routes/health.js";
import { registerAuth } from "./routes/auth.js";
import { registerUploads } from "./routes/uploads.js";
import { registerTracks } from "./routes/tracks.js";
import { registerReleases } from "./routes/releases.js";
import { registerArtists } from "./routes/artists.js";
import { registerPlaylists } from "./routes/playlists.js";
import { registerPlays } from "./routes/plays.js";
import { registerFollows } from "./routes/follows.js";
import { registerSearch } from "./routes/search.js";
import { registerRecommendations } from "./routes/recommendations.js";
import { registerPayments } from "./routes/payments.js";
import { registerAds } from "./routes/ads.js";
import { registerPodcastIngest } from "./routes/ingest-podcasts.js";
import { registerDdexIngest } from "./routes/ingest-ddex.js";
import { registerFederation } from "./routes/federation.js";
import { registerRadio } from "./routes/radio.js";
import { registerWaitlist } from "./routes/waitlist.js";
import { registerSubsonic } from "./routes/subsonic.js";
import { registerMedia } from "./routes/media.js";
import { registerWallet } from "./routes/wallet.js";

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      redact: ["req.headers.authorization", "req.headers.cookie"],
    },
    trustProxy: true,
    bodyLimit: 1024 * 1024 * 50, // 50 MB ceiling for JSON/multipart per request
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: (origin, cb) => {
      const allow = (process.env.CORS_ALLOWED_ORIGINS ?? "http://localhost:3000")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!origin || allow.includes(origin)) return cb(null, true);
      return cb(new Error("Origin not allowed"), false);
    },
    credentials: true,
  });
  await app.register(cookie);
  await app.register(sensible);
  await app.register(rateLimit, {
    max: 300,
    timeWindow: "1 minute",
    allowList: ["127.0.0.1"],
  });
  await app.register(multipart, {
    limits: { fileSize: 1024 * 1024 * 1024 }, // 1 GiB master upload ceiling
  });

  await app.register(registerHealth, { prefix: "/health" });
  await app.register(registerAuth, { prefix: "/auth" });
  await app.register(registerUploads, { prefix: "/uploads" });
  await app.register(registerArtists, { prefix: "/artists" });
  await app.register(registerReleases, { prefix: "/releases" });
  await app.register(registerTracks, { prefix: "/tracks" });
  await app.register(registerPlaylists, { prefix: "/playlists" });
  await app.register(registerPlays, { prefix: "/plays" });
  await app.register(registerFollows, { prefix: "/follows" });
  await app.register(registerSearch, { prefix: "/search" });
  await app.register(registerRecommendations, { prefix: "/recommendations" });
  await app.register(registerPayments, { prefix: "/payments" });
  await app.register(registerAds, { prefix: "/ads" });
  await app.register(registerPodcastIngest, { prefix: "/ingest/podcasts" });
  await app.register(registerDdexIngest, { prefix: "/ingest/ddex" });
  // ActivityPub: Webfinger + /users/* at host root (no prefix).
  await app.register(registerFederation);
  await app.register(registerRadio, { prefix: "/radio" });
  await app.register(registerWaitlist, { prefix: "/waitlist" });
  await app.register(registerSubsonic, { prefix: "/rest" });
  await app.register(registerMedia, { prefix: "/media" });
  await app.register(registerWallet, { prefix: "/wallet" });
  return app;
}
