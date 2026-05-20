/**
 * Payments — Stripe Connect + wallet ledger (test mode when keys set).
 *
 * Platform fee on artist sales/tips: 0 (application_fee_amount = 0).
 * Live KYB / Connect onboarding is human + Stripe — not implied by this scaffold.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import Stripe from "stripe";
import { db, schema } from "@encore/db";
import { eq } from "drizzle-orm";
import { requireUser } from "../lib/auth.js";
import { appendLedgerEntry } from "../lib/wallet-ledger.js";
import {
  createOnboardingLink,
  getOrCreateConnectAccount,
  readConnectState,
  resolveCheckoutDestination,
  syncConnectAccountFromStripe,
} from "../lib/stripe-connect.js";

function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2024-11-20.acacia" });
}

export async function registerPayments(app: FastifyInstance): Promise<void> {
  app.get("/config", async () => ({
    enabled: Boolean(process.env.STRIPE_SECRET_KEY),
    mode: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") ? "live" : "test",
    tiers: [
      { id: "free", priceCents: 0, features: ["ad_supported", "256kbps"] },
      { id: "premium", priceCents: 999, features: ["ad_free", "320kbps_aac", "offline"] },
      { id: "family", priceCents: 1599, features: ["premium_x6"] },
      { id: "student", priceCents: 499, features: ["premium", "verified_via_sheerid"] },
      { id: "hifi", priceCents: 1499, features: ["premium", "lossless_flac"] },
    ],
    payoutModel: "user_centric",
    artistRevShare: 1.0,
    platformFeePercent: 0,
    connectEnabled: Boolean(process.env.STRIPE_SECRET_KEY),
  }));

  /** Stripe Connect Express — start or resume onboarding (artist owner only). */
  app.post("/connect/onboard", async (req, reply) => {
    const user = await requireUser(req);
    const body = z.object({ artistId: z.string().uuid() }).parse(req.body);
    const stripe = stripeClient();
    if (!stripe) {
      return reply.code(501).send({
        error: "stripe_not_configured",
        message: "Set STRIPE_SECRET_KEY to enable Connect onboarding.",
      });
    }

    const [artist] = await db
      .select({
        id: schema.artists.id,
        name: schema.artists.name,
        ownerUserId: schema.artists.ownerUserId,
      })
      .from(schema.artists)
      .where(eq(schema.artists.id, body.artistId))
      .limit(1);
    if (!artist || artist.ownerUserId !== user.id) {
      return reply.code(403).send({ error: "not_artist_owner" });
    }

    const [owner] = await db
      .select({ email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1);
    if (!owner?.email) {
      return reply.code(400).send({ error: "owner_email_required" });
    }

    const accountId = await getOrCreateConnectAccount({
      stripe,
      artistId: artist.id,
      artistName: artist.name,
      ownerEmail: owner.email,
    });

    const base = process.env.WEB_PUBLIC_URL ?? "http://localhost:3000";
    const url = await createOnboardingLink({
      stripe,
      accountId,
      refreshUrl: `${base}/dashboard?connect=refresh`,
      returnUrl: `${base}/dashboard?connect=return`,
    });

    return { url, accountId };
  });

  /** Refresh Connect status from Stripe (artist owner only). */
  app.post("/connect/sync", async (req, reply) => {
    const user = await requireUser(req);
    const body = z.object({ artistId: z.string().uuid() }).parse(req.body);
    const stripe = stripeClient();
    if (!stripe) return reply.code(501).send({ error: "stripe_not_configured" });

    const [artist] = await db
      .select({
        id: schema.artists.id,
        ownerUserId: schema.artists.ownerUserId,
      })
      .from(schema.artists)
      .where(eq(schema.artists.id, body.artistId))
      .limit(1);
    if (!artist || artist.ownerUserId !== user.id) {
      return reply.code(403).send({ error: "not_artist_owner" });
    }

    const prior = await readConnectState(artist.id);
    if (!prior.accountId) {
      return { stripeConnect: prior };
    }

    const state = await syncConnectAccountFromStripe(stripe, prior.accountId, artist.id);
    return { stripeConnect: state };
  });

  app.get("/connect/status/:artistId", async (req, reply) => {
    const user = await requireUser(req);
    const { artistId } = req.params as { artistId: string };
    const [artist] = await db
      .select({ ownerUserId: schema.artists.ownerUserId })
      .from(schema.artists)
      .where(eq(schema.artists.id, artistId))
      .limit(1);
    if (!artist || artist.ownerUserId !== user.id) {
      return reply.code(403).send({ error: "not_artist_owner" });
    }
    const stripe = stripeClient();
    let state = await readConnectState(artistId);
    if (stripe && state.accountId) {
      state = await syncConnectAccountFromStripe(stripe, state.accountId, artistId);
    }
    return { stripeConnect: state };
  });

  app.post("/checkout", async (req, reply) => {
    const user = await requireUser(req);
    const body = z
      .object({
        kind: z.enum(["track", "release", "tip", "subscription"]),
        targetId: z.string().uuid().optional(),
        tier: z.enum(["premium", "family", "student", "hifi"]).optional(),
        amountCents: z.number().int().min(50).max(50_000_00).optional(),
        successUrl: z.string().url().optional(),
        cancelUrl: z.string().url().optional(),
      })
      .parse(req.body);

    const stripe = stripeClient();
    if (!stripe) {
      return reply.code(501).send({
        error: "stripe_not_configured",
        message: "Set STRIPE_SECRET_KEY; see docs/SHIP-WEEK-STATUS.md.",
      });
    }

    const base = process.env.WEB_PUBLIC_URL ?? "http://localhost:3000";
    const success = body.successUrl ?? `${base}/library?checkout=success`;
    const cancel = body.cancelUrl ?? `${base}/library?checkout=cancel`;

    if (body.kind === "tip" && body.targetId && body.amountCents) {
      const [artist] = await db
        .select({ id: schema.artists.id, name: schema.artists.name })
        .from(schema.artists)
        .where(eq(schema.artists.id, body.targetId))
        .limit(1);
      if (!artist) return reply.code(404).send({ error: "artist_not_found" });

      const destination = await resolveCheckoutDestination(artist.id);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: success,
        cancel_url: cancel,
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: body.amountCents,
              product_data: { name: `Tip — ${artist.name}` },
            },
            quantity: 1,
          },
        ],
        ...(destination
          ? {
              payment_intent_data: {
                application_fee_amount: 0,
                transfer_data: { destination },
              },
            }
          : {}),
        metadata: {
          encore_kind: "tip",
          artist_id: artist.id,
          buyer_user_id: user.id,
          connect_destination: destination ?? "",
        },
      });
      return { sessionId: session.id, url: session.url };
    }

    if (body.kind === "track" && body.targetId) {
      const [track] = await db
        .select({
          id: schema.tracks.id,
          title: schema.tracks.title,
          artistId: schema.tracks.primaryArtistId,
          priceFloor: schema.releases.priceFloorCents,
        })
        .from(schema.tracks)
        .innerJoin(schema.releases, eq(schema.tracks.releaseId, schema.releases.id))
        .where(eq(schema.tracks.id, body.targetId))
        .limit(1);
      if (!track) return reply.code(404).send({ error: "track_not_found" });
      const amount = body.amountCents ?? track.priceFloor ?? 99;

      const destination = await resolveCheckoutDestination(track.artistId);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: success,
        cancel_url: cancel,
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: amount,
              product_data: { name: track.title },
            },
            quantity: 1,
          },
        ],
        ...(destination
          ? {
              payment_intent_data: {
                application_fee_amount: 0,
                transfer_data: { destination },
              },
            }
          : {}),
        metadata: {
          encore_kind: "track",
          track_id: track.id,
          artist_id: track.artistId,
          buyer_user_id: user.id,
          connect_destination: destination ?? "",
        },
      });
      return { sessionId: session.id, url: session.url };
    }

    return reply.code(400).send({ error: "unsupported_checkout", kind: body.kind });
  });

  app.post(
    "/webhook",
    {
      config: { rawBody: true },
      preParsing: async (request, payload, done) => {
        const chunks: Buffer[] = [];
        try {
          for await (const chunk of payload as AsyncIterable<Buffer>) {
            chunks.push(chunk);
          }
          const raw = Buffer.concat(chunks);
          (request as { rawBody?: Buffer }).rawBody = raw;
          done(null, raw);
        } catch (err) {
          done(err as Error, undefined);
        }
      },
    },
    async (req, reply) => {
      const stripe = stripeClient();
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!stripe || !secret) {
        return reply.code(501).send({ error: "webhook_not_configured" });
      }

      const sig = req.headers["stripe-signature"];
      if (!sig || typeof sig !== "string") {
        return reply.code(400).send({ error: "missing_signature" });
      }

      const raw = (req as { rawBody?: Buffer }).rawBody;
      if (!raw?.length) {
        return reply.code(400).send({ error: "missing_body" });
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(raw, sig, secret);
      } catch (err) {
        req.log.warn({ err }, "stripe webhook signature failed");
        return reply.code(400).send({ error: "invalid_signature" });
      }

      if (event.type === "account.updated") {
        const account = event.data.object as Stripe.Account;
        const artistId = account.metadata?.encore_artist_id;
        if (artistId && account.id) {
          await syncConnectAccountFromStripe(stripe, account.id, artistId);
        }
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata ?? {};
        const amount = session.amount_total ?? 0;
        const artistId = meta.artist_id;
        const usedConnect = Boolean(meta.connect_destination?.trim());
        if (artistId && amount > 0 && session.id) {
          const [existingSale] = await db
            .select({ id: schema.sales.id })
            .from(schema.sales)
            .where(eq(schema.sales.paymentRef, session.id))
            .limit(1);
          const [existingTip] = await db
            .select({ id: schema.tips.id })
            .from(schema.tips)
            .where(eq(schema.tips.railRef, session.id))
            .limit(1);
          const alreadySettled = Boolean(existingSale || existingTip);

          if (!alreadySettled) {
            if (!usedConnect) {
              const reason =
                meta.encore_kind === "tip" ? "credit_tip" : ("credit_direct_sale" as const);
              await appendLedgerEntry({
                artistId,
                amountCents: amount,
                reason,
                sourceTable: "stripe_checkout",
                sourceRef: session.id,
                note: `Stripe ${meta.encore_kind ?? "payment"} (${event.livemode ? "live" : "test"})`,
              });
            }
            if (meta.encore_kind === "track" && meta.track_id && meta.buyer_user_id) {
              await db.insert(schema.sales).values({
                buyerUserId: meta.buyer_user_id,
                trackId: meta.track_id,
                artistId,
                grossCents: amount,
                platformFeeCents: 0,
                processorFeeCents: 0,
                netToArtistCents: amount,
                paymentRef: session.id,
              });
            } else if (meta.encore_kind === "tip") {
              await db.insert(schema.tips).values({
                artistId,
                fromUserId: meta.buyer_user_id ?? null,
                amountCents: amount,
                rail: "stripe",
                railRef: session.id,
              });
            }
          }
        }
      }

      return { received: true, eventId: event.id };
    },
  );
}
