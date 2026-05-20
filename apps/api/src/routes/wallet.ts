/**
 * Artist Wallet — balance + ledger read API (append-only credits per ARTIST-INCOME-GUARANTEE.md).
 */
import type { FastifyInstance } from "fastify";
import { db, schema } from "@encore/db";
import { eq, desc, and } from "drizzle-orm";
import { requireUser } from "../lib/auth.js";
import { ensureArtistWallet } from "../lib/wallet-ledger.js";
import { readConnectState } from "../lib/stripe-connect.js";

export async function registerWallet(app: FastifyInstance): Promise<void> {
  /** Wallet for an artist the current user owns. */
  app.get("/artist/:artistId", async (req, reply) => {
    const user = await requireUser(req);
    const { artistId } = req.params as { artistId: string };

    const [artist] = await db
      .select({
        id: schema.artists.id,
        ownerUserId: schema.artists.ownerUserId,
        name: schema.artists.name,
      })
      .from(schema.artists)
      .where(eq(schema.artists.id, artistId))
      .limit(1);
    if (!artist || artist.ownerUserId !== user.id) {
      return reply.code(403).send({ error: "not_artist_owner" });
    }

    const walletId = await ensureArtistWallet(artistId);
    const [wallet] = await db
      .select()
      .from(schema.artistWallets)
      .where(eq(schema.artistWallets.id, walletId))
      .limit(1);

    const ledger = await db
      .select({
        id: schema.walletLedger.id,
        amountCents: schema.walletLedger.amountCents,
        reason: schema.walletLedger.reason,
        note: schema.walletLedger.note,
        createdAt: schema.walletLedger.createdAt,
      })
      .from(schema.walletLedger)
      .where(eq(schema.walletLedger.walletId, walletId))
      .orderBy(desc(schema.walletLedger.createdAt))
      .limit(50);

    const stripeConnect = await readConnectState(artistId);

    return {
      artist: { id: artist.id, name: artist.name },
      wallet: wallet
        ? {
            balanceCents: wallet.balanceCents,
            currency: wallet.currency,
            cashoutMode: wallet.cashoutMode,
          }
        : null,
      ledger,
      stripeConnect,
    };
  });

  /** Public summary — balance only, no ledger PII (for transparency dashboards later). */
  app.get("/artist/:artistId/summary", async (req, reply) => {
    const { artistId } = req.params as { artistId: string };
    const [wallet] = await db
      .select({
        balanceCents: schema.artistWallets.balanceCents,
        currency: schema.artistWallets.currency,
      })
      .from(schema.artistWallets)
      .where(eq(schema.artistWallets.artistId, artistId))
      .limit(1);
    if (!wallet) return { balanceCents: 0, currency: "USD", hasActivity: false };
    return {
      balanceCents: wallet.balanceCents,
      currency: wallet.currency,
      hasActivity: wallet.balanceCents !== 0,
    };
  });
}
