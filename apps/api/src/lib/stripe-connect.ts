/**
 * Stripe Connect Express — artist payout onboarding.
 *
 * 0% Encore application fee on artist checkout (transfer_data only).
 * Platform account holds ledger credits until Connect is active; checkout can
 * route directly to Connect when charges_enabled.
 */
import type Stripe from "stripe";
import { db, schema } from "@encore/db";
import { eq } from "drizzle-orm";
import { ensureArtistWallet } from "./wallet-ledger.js";

export type ConnectStatus = "not_started" | "pending" | "active" | "restricted";

export interface ConnectState {
  configured: boolean;
  status: ConnectStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  accountId: string | null;
  message: string;
}

function mapStripeStatus(account: Stripe.Account): ConnectStatus {
  if (account.requirements?.disabled_reason) return "restricted";
  if (account.charges_enabled && account.payouts_enabled) return "active";
  return "pending";
}

export async function syncConnectAccountFromStripe(
  stripe: Stripe,
  accountId: string,
  artistId: string,
): Promise<ConnectState> {
  const account = await stripe.accounts.retrieve(accountId);
  const status = mapStripeStatus(account);
  await db
    .update(schema.artistWallets)
    .set({
      stripeConnectAccountId: accountId,
      stripeConnectStatus: status,
      stripeChargesEnabled: account.charges_enabled ?? false,
      stripePayoutsEnabled: account.payouts_enabled ?? false,
      updatedAt: new Date(),
    })
    .where(eq(schema.artistWallets.artistId, artistId));

  return buildConnectState(accountId, status, account.charges_enabled ?? false, account.payouts_enabled ?? false);
}

export async function readConnectState(artistId: string): Promise<ConnectState> {
  const walletId = await ensureArtistWallet(artistId);
  const [wallet] = await db
    .select({
      stripeConnectAccountId: schema.artistWallets.stripeConnectAccountId,
      stripeConnectStatus: schema.artistWallets.stripeConnectStatus,
      stripeChargesEnabled: schema.artistWallets.stripeChargesEnabled,
      stripePayoutsEnabled: schema.artistWallets.stripePayoutsEnabled,
    })
    .from(schema.artistWallets)
    .where(eq(schema.artistWallets.id, walletId))
    .limit(1);

  if (!wallet) {
    return buildConnectState(null, "not_started", false, false);
  }

  return buildConnectState(
    wallet.stripeConnectAccountId,
    (wallet.stripeConnectStatus as ConnectStatus) ?? "not_started",
    wallet.stripeChargesEnabled,
    wallet.stripePayoutsEnabled,
  );
}

function buildConnectState(
  accountId: string | null,
  status: ConnectStatus,
  chargesEnabled: boolean,
  payoutsEnabled: boolean,
): ConnectState {
  const configured = Boolean(process.env.STRIPE_SECRET_KEY);
  let message =
    "Stripe is not configured on this server. Set STRIPE_SECRET_KEY for test checkout.";
  if (configured && status === "not_started") {
    message =
      "Connect your Stripe account to receive tips and sales directly. Encore charges 0% platform fee.";
  } else if (configured && status === "pending") {
    message = "Finish Stripe onboarding to enable direct payouts.";
  } else if (configured && status === "active") {
    message = "Stripe Connect active — checkout routes to your account (0% Encore fee).";
  } else if (configured && status === "restricted") {
    message = "Stripe account needs attention — open onboarding to resolve requirements.";
  }

  return {
    configured,
    status,
    chargesEnabled,
    payoutsEnabled,
    accountId,
    message,
  };
}

export async function getOrCreateConnectAccount(input: {
  stripe: Stripe;
  artistId: string;
  artistName: string;
  ownerEmail: string;
  country?: string;
}): Promise<string> {
  const existing = await readConnectState(input.artistId);
  if (existing.accountId) return existing.accountId;

  const account = await input.stripe.accounts.create({
    type: "express",
    country: input.country ?? process.env.STRIPE_CONNECT_COUNTRY ?? "US",
    email: input.ownerEmail,
    business_profile: { name: input.artistName.slice(0, 200) },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { encore_artist_id: input.artistId },
  });

  const walletId = await ensureArtistWallet(input.artistId);
  await db
    .update(schema.artistWallets)
    .set({
      stripeConnectAccountId: account.id,
      stripeConnectStatus: "pending",
      updatedAt: new Date(),
    })
    .where(eq(schema.artistWallets.id, walletId));

  return account.id;
}

export async function createOnboardingLink(input: {
  stripe: Stripe;
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}): Promise<string> {
  const link = await input.stripe.accountLinks.create({
    account: input.accountId,
    refresh_url: input.refreshUrl,
    return_url: input.returnUrl,
    type: "account_onboarding",
  });
  if (!link.url) throw new Error("account_link_missing_url");
  return link.url;
}

/** Destination Connect account for checkout when fully active. */
export async function resolveCheckoutDestination(artistId: string): Promise<string | null> {
  const state = await readConnectState(artistId);
  if (state.status === "active" && state.chargesEnabled && state.accountId) {
    return state.accountId;
  }
  return null;
}
