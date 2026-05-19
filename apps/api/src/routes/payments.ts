/**
 * Payments — STUB (Stripe Connect interface).
 *
 * No live keys in repo. Endpoints exist so frontend can be wired.
 * Implementation per RFC 006:
 *   - Stripe Connect Express accounts for artists
 *   - Direct charges with application_fee_amount = 0 (artist sales)
 *   - Subscription billing for listener tiers (free / premium / family / hifi)
 *   - User-centric payout: $X/month split among the artists THIS user listened to
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireUser } from "../lib/auth.js";

export async function registerPayments(app: FastifyInstance): Promise<void> {
  app.get("/config", async () => ({
    enabled: Boolean(process.env.STRIPE_SECRET_KEY),
    tiers: [
      { id: "free", priceCents: 0, features: ["ad_supported", "256kbps", "shuffle_only_on_mobile_disabled"] },
      { id: "premium", priceCents: 999, features: ["ad_free", "320kbps_aac", "offline", "all_devices"] },
      { id: "family", priceCents: 1599, features: ["premium_x6", "kids_profile", "shared_household"] },
      { id: "student", priceCents: 499, features: ["premium", "verified_via_sheerid"] },
      { id: "hifi", priceCents: 1499, features: ["premium", "lossless_flac", "binaural_spatial"] },
    ],
    payoutModel: "user_centric",
    artistRevShare: 1.0,
  }));

  app.post("/checkout", async (req, reply) => {
    await requireUser(req);
    z.object({
      kind: z.enum(["track", "release", "tip", "subscription"]),
      targetId: z.string().uuid().optional(),
      tier: z.enum(["premium", "family", "student", "hifi"]).optional(),
      amountCents: z.number().int().min(50).max(50_00000).optional(),
    }).parse(req.body);
    return reply.code(501).send({
      error: "stripe_not_configured",
      message: "Set STRIPE_SECRET_KEY + STRIPE_CONNECT_CLIENT_ID; see RFC 006.",
    });
  });

  app.post("/webhook", async (_req, reply) => {
    return reply.code(501).send({ error: "webhook_stub" });
  });
}
