"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function LoginPage(): JSX.Element {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [status, setStatus] = useState("");

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setStatus("submitting...");
    const path = mode === "sign-in" ? "/auth/sign-in" : "/auth/sign-up";
    const body = mode === "sign-in" ? { email, password } : { email, password, handle };
    const r = await fetch(`${API_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setStatus(r.ok ? "ok — refresh to see signed-in state" : `failed (${r.status})`);
  }

  return (
    <div className="max-w-sm space-y-6">
      <h1 className="text-3xl font-bold">{mode === "sign-in" ? "Sign in" : "Create account"}</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        {mode === "sign-up" && (
          <label className="block text-sm">
            Handle
            <input
              required
              minLength={2}
              maxLength={32}
              pattern="[a-z0-9_-]+"
              className="mt-1 w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent p-2"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />
          </label>
        )}
        <label className="block text-sm">
          Email
          <input
            type="email"
            required
            className="mt-1 w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button className="w-full rounded-md bg-ink text-paper py-2 dark:bg-paper dark:text-ink" type="submit">
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </button>
      </form>
      <button
        className="text-sm underline text-ink-muted"
        onClick={() => setMode((m) => (m === "sign-in" ? "sign-up" : "sign-in"))}
      >
        {mode === "sign-in" ? "Need an account? Sign up." : "Already have one? Sign in."}
      </button>
      {status && <p className="text-sm text-ink-muted">{status}</p>}
    </div>
  );
}
