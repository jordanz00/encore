"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type CheckoutKind = "tip" | "track";

interface Props {
  kind: CheckoutKind;
  targetId: string;
  label: string;
  amountCents?: number;
}

export default function CheckoutActions({
  kind,
  targetId,
  label,
  amountCents,
}: Props): JSX.Element {
  const [status, setStatus] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function startCheckout(): Promise<void> {
    setBusy(true);
    setStatus(null);
    setIsError(false);
    try {
      const body: Record<string, unknown> = { kind, targetId };
      if (amountCents != null) body.amountCents = amountCents;
      const r = await fetch(`${API_URL}/payments/checkout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await r.json()) as { url?: string; error?: string; message?: string };
      if (!r.ok) {
        setIsError(true);
        setStatus(
          data.error === "stripe_not_configured"
            ? "Payments in test mode — set STRIPE_SECRET_KEY on the API."
            : data.message ?? `Checkout failed (${r.status})`,
        );
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setIsError(true);
      setStatus("No checkout URL returned.");
    } catch {
      setIsError(true);
      setStatus("Network error — sign in and ensure API is running.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="button"
        disabled={busy}
        aria-busy={busy}
        onClick={() => void startCheckout()}
        className="encore-btn-primary disabled:opacity-50 min-h-11"
      >
        {busy ? "Opening…" : label}
      </button>
      {status && (
        <p
          className={`text-sm max-w-md leading-relaxed m-0 ${
            isError ? "text-accent dark:text-red-300" : "text-ink-muted dark:text-[#a8a8b4]"
          }`}
          role={isError ? "alert" : "status"}
        >
          {status}
        </p>
      )}
    </div>
  );
}
