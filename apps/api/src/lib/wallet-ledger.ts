/**
 * Artist wallet ledger — append-only credits/debits.
 *
 * Balances are derived from ledger rows; never mutate balance without a ledger entry.
 * See ARTIST-INCOME-GUARANTEE.md and packages/db wallet_ledger reason vocabulary.
 */
import { db, schema } from "@encore/db";
import { and, eq, sql } from "drizzle-orm";

export type WalletCreditReason =
  | "credit_direct_sale"
  | "credit_tip"
  | "credit_subscription_pool"
  | "credit_discovery_dividend"
  | "credit_sync_license"
  | "credit_merch"
  | "credit_live_ticket"
  | "credit_encore_day_match"
  | "credit_stipend"
  | "credit_adjustment_manual";

export type WalletDebitReason =
  | "debit_cashout"
  | "debit_refund"
  | "debit_chargeback"
  | "debit_adjustment_manual";

export type LedgerReason = WalletCreditReason | WalletDebitReason;

/** Ensure an artist has a wallet row; returns wallet id. */
export async function ensureArtistWallet(artistId: string, currency = "USD"): Promise<string> {
  const [existing] = await db
    .select({ id: schema.artistWallets.id })
    .from(schema.artistWallets)
    .where(eq(schema.artistWallets.artistId, artistId))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(schema.artistWallets)
    .values({ artistId, currency })
    .returning({ id: schema.artistWallets.id });
  if (!created) throw new Error("wallet_create_failed");
  return created.id;
}

/**
 * Append a ledger row and bump wallet balance in one transaction.
 *
 * @param amountCents — positive for credit, negative for debit
 */
export async function appendLedgerEntry(input: {
  artistId: string;
  amountCents: number;
  currency?: string;
  reason: LedgerReason;
  sourceTable?: string | null;
  sourceId?: string | null;
  /** Idempotency key for external rails (Stripe session id, etc.). */
  sourceRef?: string | null;
  note?: string | null;
}): Promise<{ walletId: string; ledgerId: string; duplicate?: boolean }> {
  if (!Number.isInteger(input.amountCents) || input.amountCents === 0) {
    throw new Error("amount_cents_must_be_nonzero_integer");
  }

  const currency = input.currency ?? "USD";
  const walletId = await ensureArtistWallet(input.artistId, currency);

  if (input.sourceTable && input.sourceRef) {
    const [existing] = await db
      .select({ id: schema.walletLedger.id })
      .from(schema.walletLedger)
      .where(
        and(
          eq(schema.walletLedger.walletId, walletId),
          eq(schema.walletLedger.sourceTable, input.sourceTable),
          eq(schema.walletLedger.sourceRef, input.sourceRef),
        ),
      )
      .limit(1);
    if (existing) {
      return { walletId, ledgerId: existing.id, duplicate: true };
    }
  }

  try {
    return await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(schema.walletLedger)
        .values({
          walletId,
          amountCents: input.amountCents,
          currency,
          reason: input.reason,
          sourceTable: input.sourceTable ?? null,
          sourceId: input.sourceId ?? null,
          sourceRef: input.sourceRef ?? null,
          note: input.note ?? null,
        })
        .returning({ id: schema.walletLedger.id });

      await tx
        .update(schema.artistWallets)
        .set({
          balanceCents: sql`${schema.artistWallets.balanceCents} + ${input.amountCents}`,
          updatedAt: new Date(),
        })
        .where(eq(schema.artistWallets.id, walletId));

      return { walletId, ledgerId: row!.id };
    });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "23505" && input.sourceTable && input.sourceRef) {
      const [existing] = await db
        .select({ id: schema.walletLedger.id })
        .from(schema.walletLedger)
        .where(
          and(
            eq(schema.walletLedger.walletId, walletId),
            eq(schema.walletLedger.sourceTable, input.sourceTable),
            eq(schema.walletLedger.sourceRef, input.sourceRef),
          ),
        )
        .limit(1);
      if (existing) return { walletId, ledgerId: existing.id, duplicate: true };
    }
    throw err;
  }
}
