"use client";

import Link from "next/link";
import { useId, useState } from "react";
import CoverArt from "@/components/CoverArt";
import {
  api,
  type SearchArtistHit,
  type SearchReleaseHit,
  type SearchResponse,
  type SearchTrackHit,
} from "@/lib/api";

export default function SearchPage(): JSX.Element {
  const formId = useId();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResponse | null>(null);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const r = await api.search(query);
      if (r.error === "search_unavailable") {
        setError("Search is temporarily unavailable. Try again shortly.");
      }
      setResults(r);
    } catch {
      setError("Could not reach the API. Is it running on port 3001?");
      setResults({ artists: [], releases: [], tracks: [], source: "postgres" });
    } finally {
      setLoading(false);
    }
  }

  const total =
    results == null
      ? 0
      : results.artists.length + results.releases.length + results.tracks.length;

  return (
    <div className="encore-page">
      <header className="encore-page-header">
        <h1 className="encore-page-title">Search</h1>
        <p className="encore-page-lead">
          Artists, releases, and tracks. Fast index when Meilisearch is up; database
          fallback otherwise.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="flex flex-col sm:flex-row gap-3 max-w-prose-wide"
        aria-labelledby={`${formId}-label`}
      >
        <label id={`${formId}-label`} htmlFor={`${formId}-input`} className="sr-only">
          Search query
        </label>
        <input
          id={`${formId}-input`}
          className="encore-input flex-1 mt-0"
          placeholder="Search artists, releases, tracks…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
          maxLength={200}
          disabled={loading}
        />
        <button
          type="submit"
          className="encore-btn-primary shrink-0 min-h-11"
          disabled={loading || !q.trim()}
          aria-busy={loading}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-accent dark:text-red-300 mt-4 m-0" role="alert">
          {error}
        </p>
      )}

      {results && !loading && (
        <div className="mt-8 space-y-10" role="region" aria-label="Search results">
          <p className="text-xs text-ink-dim dark:text-[#888894] m-0" role="status">
            {total === 0
              ? `No results for “${q.trim()}”.`
              : `${total} result${total === 1 ? "" : "s"} · source: ${results.source}`}
          </p>

          <SearchSection title="Artists" count={results.artists.length}>
            {results.artists.map((a) => (
              <ArtistResult key={a.id} artist={a} />
            ))}
          </SearchSection>

          <SearchSection title="Releases" count={results.releases.length}>
            {results.releases.map((r) => (
              <ReleaseResult key={r.id} release={r} />
            ))}
          </SearchSection>

          <SearchSection title="Tracks" count={results.tracks.length}>
            {results.tracks.map((t) => (
              <TrackResult key={t.id} track={t} />
            ))}
          </SearchSection>
        </div>
      )}
    </div>
  );
}

function SearchSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}): JSX.Element {
  const headingId = `search-${title.toLowerCase()}`;
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="font-display text-xl font-semibold mb-4">
        {title}
        <span className="text-sm font-normal text-ink-muted dark:text-[#a8a8b4] ml-2">
          ({count})
        </span>
      </h2>
      {count === 0 ? (
        <p className="text-sm text-ink-muted dark:text-[#a8a8b4] m-0">No matches.</p>
      ) : (
        <ul className="grid gap-3 list-none p-0 m-0" role="list">
          {children}
        </ul>
      )}
    </section>
  );
}

function ArtistResult({ artist }: { artist: SearchArtistHit }): JSX.Element {
  return (
    <li>
      <Link
        href={`/artist/${artist.slug}`}
        className="flex items-center gap-3 p-3 rounded-xl border border-black/[0.06] dark:border-white/10 hover:bg-paper-soft dark:hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 min-h-11"
      >
        <span className="font-medium text-ink dark:text-[#faf6ec]">{artist.name}</span>
        <span className="text-sm text-ink-muted dark:text-[#a8a8b4]">@{artist.slug}</span>
      </Link>
    </li>
  );
}

function ReleaseResult({ release }: { release: SearchReleaseHit }): JSX.Element {
  return (
    <li>
      <Link
        href={`/release/${release.id}`}
        className="flex items-center gap-4 p-3 rounded-xl border border-black/[0.06] dark:border-white/10 hover:bg-paper-soft dark:hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 min-h-11"
      >
        <CoverArt coverArtKey={release.coverArtKey} title={release.title} size="sm" className="!w-14 !h-14 shrink-0" />
        <span className="min-w-0">
          <span className="block font-medium truncate text-ink dark:text-[#faf6ec]">
            {release.title}
          </span>
          <span className="block text-sm text-ink-muted dark:text-[#a8a8b4] capitalize">
            {release.type}
            {release.primaryArtistName ? ` · ${release.primaryArtistName}` : ""}
          </span>
        </span>
      </Link>
    </li>
  );
}

function TrackResult({ track }: { track: SearchTrackHit }): JSX.Element {
  return (
    <li>
      <Link
        href={`/release/${track.releaseId}`}
        className="flex items-center justify-between gap-4 p-3 rounded-xl border border-black/[0.06] dark:border-white/10 hover:bg-paper-soft dark:hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 min-h-11"
      >
        <span className="min-w-0">
          <span className="block font-medium truncate text-ink dark:text-[#faf6ec]">
            {track.title}
          </span>
          <span className="block text-sm text-ink-muted dark:text-[#a8a8b4] truncate">
            {track.releaseTitle}
            {track.primaryArtistName ? ` · ${track.primaryArtistName}` : ""}
          </span>
        </span>
        <span className="text-sm font-mono tabular-nums text-ink-dim dark:text-[#888894] shrink-0">
          {formatMs(track.durationMs)}
        </span>
      </Link>
    </li>
  );
}

function formatMs(ms: number): string {
  if (!ms || ms < 0) return "—";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, "0")}`;
}
