"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import StripeConnectPanel from "@/components/StripeConnectPanel";
import type { Artist, StripeConnectState } from "@/lib/api";
import { apiClient } from "@/lib/api";

interface LedgerRow {
  id: string;
  amountCents: number;
  reason: string;
  note: string | null;
  createdAt: string;
}

interface WalletResponse {
  artist: { id: string; name: string };
  wallet: { balanceCents: number; currency: string; cashoutMode: string } | null;
  ledger: LedgerRow[];
  stripeConnect: StripeConnectState;
}

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
  }).format(cents / 100);
}

export default function DashboardPage(): JSX.Element {
  const searchParams = useSearchParams();
  const connectReturn = searchParams.get("connect");

  const [loading, setLoading] = useState(true);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [remoteFollowers, setRemoteFollowers] = useState(0);
  const [error, setError] = useState("");
  const [connectNotice, setConnectNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await apiClient.me();
      const { artist: a } = await apiClient.myArtist();
      setArtist(a);
      if (!a) {
        setWallet(null);
        setRemoteFollowers(0);
        return;
      }
      if (connectReturn === "return" || connectReturn === "refresh") {
        try {
          await apiClient.stripeConnectSync(a.id);
          setConnectNotice(
            connectReturn === "return"
              ? "Returned from Stripe — status updated."
              : "Stripe session refreshed — status updated.",
          );
        } catch {
          setConnectNotice("Could not sync Stripe status yet — use Refresh status.");
        }
      }
      const [w, rf] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/wallet/artist/${a.id}`,
          { credentials: "include" },
        ).then(async (r) => {
          if (!r.ok) throw new Error("wallet_load_failed");
          return r.json() as Promise<WalletResponse>;
        }),
        apiClient.remoteFollowerCount(),
      ]);
      setWallet(w);
      setRemoteFollowers(rf.count);
    } catch {
      setError("Sign in and create an artist profile to use the dashboard.");
      setArtist(null);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, [connectReturn]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="encore-page max-w-prose-wide">
        <p role="status" className="text-ink-muted dark:text-[#a8a8b4]">
          Loading dashboard…
        </p>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="encore-page max-w-prose-wide">
        <header className="encore-page-header">
          <h1 className="encore-page-title">Artist dashboard</h1>
          <p className="encore-page-lead" role={error ? "alert" : undefined}>
            {error || "No artist profile yet."}
          </p>
        </header>
        <div className="flex flex-wrap gap-3">
          <Link href="/login?returnTo=/dashboard" className="encore-btn-primary">
            Sign in
          </Link>
          <Link href="/upload" className="encore-btn-secondary">
            Create profile via upload
          </Link>
        </div>
      </div>
    );
  }

  const balance = wallet?.wallet?.balanceCents ?? 0;
  const currency = wallet?.wallet?.currency ?? "USD";
  const connect = wallet?.stripeConnect;

  return (
    <div className="encore-page max-w-prose-wide">
      <header className="encore-page-header">
        <h1 className="encore-page-title">{artist.name}</h1>
        <p className="encore-page-lead">
          Wallet, ledger, and federation — transparent by design.{" "}
          <Link href={`/artist/${artist.slug}`} className="underline text-accent">
            Public page
          </Link>
        </p>
      </header>

      {connectNotice && (
        <p className="text-sm text-ink-muted dark:text-[#a8a8b4] mb-4 m-0" role="status">
          {connectNotice}
        </p>
      )}

      {connect && (
        <div className="mb-8">
          <StripeConnectPanel artistId={artist.id} connect={connect} onUpdated={() => void load()} />
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="encore-card">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-dim dark:text-[#888894] m-0">
            In-app balance
          </p>
          <p className="font-display text-3xl font-semibold mt-2 mb-0 tabular-nums">
            {formatMoney(balance, currency)}
          </p>
          <p className="text-xs text-ink-faint dark:text-[#888894] mt-2 m-0">
            Ledger credits from platform checkout. Direct Connect sales settle in Stripe, not
            this balance.
          </p>
        </div>
        <div className="encore-card">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-dim dark:text-[#888894] m-0">
            Federation
          </p>
          <p className="font-display text-3xl font-semibold mt-2 mb-0 tabular-nums">
            {remoteFollowers}
          </p>
          <p className="text-xs text-ink-faint dark:text-[#888894] mt-2 m-0">
            Remote ActivityPub followers stored from inbox Follow events.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/upload" className="encore-btn-primary">
          Upload music
        </Link>
        <Link href={`/artist/${artist.slug}`} className="encore-btn-secondary">
          View public profile
        </Link>
      </div>

      <section className="mt-10" aria-labelledby="ledger-heading">
        <h2 id="ledger-heading" className="font-display text-2xl font-semibold mb-4">
          Ledger
        </h2>
        {wallet?.ledger.length === 0 ? (
          <p className="text-sm text-ink-muted dark:text-[#a8a8b4]">No entries yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-black/[0.06] dark:border-white/10">
            <table className="w-full text-sm text-left">
              <caption className="sr-only">
                Wallet ledger entries for {artist.name}, newest first
              </caption>
              <thead>
                <tr className="border-b border-black/[0.06] dark:border-white/10 bg-paper-soft dark:bg-white/5">
                  <th scope="col" className="py-3 px-4 font-medium">
                    Date
                  </th>
                  <th scope="col" className="py-3 px-4 font-medium">
                    Reason
                  </th>
                  <th scope="col" className="py-3 px-4 font-medium text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {wallet?.ledger.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-black/[0.06] dark:border-white/10 last:border-0"
                  >
                    <td className="py-3 px-4 text-ink-muted dark:text-[#a8a8b4] whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-ink dark:text-[#faf6ec]">{row.reason}</span>
                      {row.note ? (
                        <span className="block text-xs text-ink-faint dark:text-[#888894]">
                          {row.note}
                        </span>
                      ) : null}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono tabular-nums ${
                        row.amountCents >= 0
                          ? "text-green-700 dark:text-green-400"
                          : "text-accent"
                      }`}
                    >
                      {row.amountCents >= 0 ? "+" : ""}
                      {formatMoney(row.amountCents, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
