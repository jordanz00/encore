"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function SearchPage(): JSX.Element {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Awaited<ReturnType<typeof api.search>> | null>(null);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!q.trim()) return;
    try {
      const r = await api.search(q.trim());
      setResults(r);
    } catch {
      setResults({ artists: [], releases: [], tracks: [] });
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-black/10 dark:border-white/10 bg-transparent p-2"
          placeholder="Search artists, releases, tracks…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search query"
        />
        <button
          className="rounded-md bg-ink text-paper px-4 dark:bg-paper dark:text-ink"
          type="submit"
        >
          Search
        </button>
      </form>

      {results && (
        <div className="grid md:grid-cols-3 gap-6">
          <Section title="Artists" items={results.artists} />
          <Section title="Releases" items={results.releases} />
          <Section title="Tracks" items={results.tracks} />
        </div>
      )}
    </div>
  );
}

function Section({ title, items }: { title: string; items: unknown[] }): JSX.Element {
  return (
    <div>
      <h2 className="font-semibold mb-2">{title}</h2>
      {items.length === 0 ? (
        <div className="text-ink-muted text-sm">No results.</div>
      ) : (
        <ul className="space-y-1 text-sm">
          {items.map((it, i) => (
            <li key={i} className="truncate">
              {JSON.stringify(it)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
