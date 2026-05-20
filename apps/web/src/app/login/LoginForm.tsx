"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function LoginForm(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/library";

  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [betaCode, setBetaCode] = useState("");
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setIsError(false);
    setStatus("Submitting…");
    const path = mode === "sign-in" ? "/auth/sign-in" : "/auth/sign-up";
    const body =
      mode === "sign-in"
        ? { email, password }
        : { email, password, handle, ...(betaCode ? { betaCode: betaCode.trim() } : {}) };
    try {
      const r = await fetch(`${API_URL}${path}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        setStatus("Signed in. Redirecting…");
        router.push(returnTo.startsWith("/") ? returnTo : "/library");
        router.refresh();
        return;
      }
      setIsError(true);
      let message = `Sign-in failed (${r.status}).`;
      try {
        const json = (await r.json()) as { error?: string };
        if (json.error === "beta_code_required") message = "Beta invite code is required.";
        else if (json.error === "invalid_beta_code") message = "Invalid beta code.";
        else if (json.error === "invalid_credentials") message = "Email or password is incorrect.";
        else if (json.error) message = `Error: ${json.error}`;
      } catch {
        /* non-json body */
      }
      setStatus(message);
    } catch {
      setIsError(true);
      setStatus("Could not reach the API. Is it running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="encore-page-header">
        <h1 className="encore-page-title">
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </h1>
        <p className="encore-page-lead">
          {mode === "sign-up"
            ? "Beta may require an invite code from your welcome email."
            : "Listener or artist accounts use the same sign-in."}
        </p>
      </header>

      <form onSubmit={onSubmit} className="encore-card space-y-5" noValidate>
        {mode === "sign-up" && (
          <label className="block">
            <span className="block text-sm font-medium mb-1">Beta code (if required)</span>
            <input
              className="encore-input"
              value={betaCode}
              onChange={(e) => setBetaCode(e.target.value)}
              placeholder="ENCORE-BETA-01"
              autoComplete="off"
              disabled={busy}
            />
          </label>
        )}
        {mode === "sign-up" && (
          <label className="block">
            <span className="block text-sm font-medium mb-1">Handle</span>
            <input
              required
              minLength={2}
              maxLength={32}
              pattern="[a-z0-9_-]+"
              className="encore-input font-mono text-sm"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              autoComplete="username"
              disabled={busy}
              aria-describedby="handle-hint"
            />
            <span id="handle-hint" className="text-xs text-ink-muted dark:text-[#a8a8b4]">
              Lowercase letters, numbers, underscore, hyphen only.
            </span>
          </label>
        )}
        <label className="block">
          <span className="block text-sm font-medium mb-1">Email</span>
          <input
            type="email"
            required
            className="encore-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={busy}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1">Password</span>
          <input
            type="password"
            required
            minLength={8}
            className="encore-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            disabled={busy}
          />
        </label>
        <button
          type="submit"
          className="encore-btn-primary w-full min-h-11"
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        className="text-sm text-ink-muted dark:text-[#a8a8b4] underline underline-offset-4 min-h-11 mt-4"
        onClick={() => {
          setMode((m) => (m === "sign-in" ? "sign-up" : "sign-in"));
          setStatus("");
          setIsError(false);
        }}
      >
        {mode === "sign-in" ? "Need an account? Sign up." : "Already have one? Sign in."}
      </button>

      <p className="text-sm mt-6 m-0">
        <Link href="/discover" className="underline underline-offset-2">
          Browse without signing in
        </Link>
      </p>

      {status ? (
        <p
          className={`text-sm leading-relaxed mt-4 ${
            isError ? "text-accent dark:text-red-300" : "text-ink-muted dark:text-[#b0b0bc]"
          }`}
          role={isError ? "alert" : "status"}
          aria-live={isError ? "assertive" : "polite"}
        >
          {status}
        </p>
      ) : null}
    </>
  );
}
