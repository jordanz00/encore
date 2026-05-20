"use client";

import { useState } from "react";
import type { StripeConnectState } from "@/lib/api";
import { apiClient } from "@/lib/api";

interface StripeConnectPanelProps {
  artistId: string;
  connect: StripeConnectState;
  onUpdated: () => void;
}

const STATUS_LABEL: Record<StripeConnectState["status"], string> = {
  not_started: "Not connected",
  pending: "Onboarding in progress",
  active: "Active",
  restricted: "Needs attention",
};

export default function StripeConnectPanel({
  artistId,
  connect,
  onUpdated,
}: StripeConnectPanelProps): JSX.Element {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startOnboarding(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const { url } = await apiClient.stripeConnectOnboard(artistId);
      window.location.href = url;
    } catch {
      setError("Could not start Stripe onboarding. Check API keys and sign-in.");
    } finally {
      setBusy(false);
    }
  }

  async function refreshStatus(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await apiClient.stripeConnectSync(artistId);
      onUpdated();
    } catch {
      setError("Could not refresh Connect status.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="encore-card"
      aria-labelledby="stripe-connect-heading"
    >
      <h2 id="stripe-connect-heading" className="font-display text-xl font-semibold m-0">
        Payouts (Stripe Connect)
      </h2>
      <p className="text-sm text-ink-muted dark:text-[#a8a8b4] mt-2 mb-4 leading-relaxed">
        {connect.message}
      </p>

      <dl className="grid grid-cols-2 gap-3 text-sm mb-4 m-0">
        <div>
          <dt className="text-ink-dim dark:text-[#888894]">Status</dt>
          <dd className="font-medium text-ink dark:text-[#faf6ec] m-0 mt-0.5">
            {STATUS_LABEL[connect.status]}
          </dd>
        </div>
        <div>
          <dt className="text-ink-dim dark:text-[#888894]">Direct checkout</dt>
          <dd className="font-medium text-ink dark:text-[#faf6ec] m-0 mt-0.5">
            {connect.chargesEnabled ? "Enabled" : "Pending Connect"}
          </dd>
        </div>
      </dl>

      <p className="text-xs text-ink-faint dark:text-[#888894] m-0 mb-4">
        0% Encore platform fee on tips and track sales. Stripe processor fees still apply.
        Until Connect is active, test checkout credits your in-app ledger only.
      </p>

      <div className="flex flex-wrap gap-3">
        {connect.configured && connect.status !== "active" && (
          <button
            type="button"
            className="encore-btn-primary min-h-11"
            disabled={busy}
            aria-busy={busy}
            onClick={() => void startOnboarding()}
          >
            {connect.status === "not_started"
              ? "Connect Stripe account"
              : "Continue Stripe onboarding"}
          </button>
        )}
        {connect.configured && connect.accountId && (
          <button
            type="button"
            className="encore-btn-secondary min-h-11"
            disabled={busy}
            onClick={() => void refreshStatus()}
          >
            Refresh status
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-accent dark:text-red-300 mt-3 m-0" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
