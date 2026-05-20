"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CoverArt from "@/components/CoverArt";
import { apiClient, type Artist } from "@/lib/api";

interface FollowRow extends Artist {
  followedAt: string;
}

export default function LibraryFollows(): JSX.Element {
  const [artists, setArtists] = useState<FollowRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await apiClient.me();
        const { artists: rows } = await apiClient.myFollows();
        if (!cancelled) setArtists(rows as FollowRow[]);
      } catch {
        if (!cancelled) {
          setArtists(null);
          setError("sign_in_required");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error === "sign_in_required") {
    return (
      <p className="text-base text-ink-muted dark:text-[#a8a8b4] m-0">
        <Link href="/login?returnTo=/library" className="underline underline-offset-2">
          Sign in
        </Link>{" "}
        to see artists you follow.
      </p>
    );
  }

  if (artists === null) {
    return <p className="text-sm text-ink-muted dark:text-[#a8a8b4] m-0">Loading…</p>;
  }

  if (artists.length === 0) {
    return (
      <p className="text-base text-ink-muted dark:text-[#a8a8b4] m-0">
        You are not following anyone yet. Browse{" "}
        <Link href="/discover" className="underline underline-offset-2">
          Discover
        </Link>{" "}
        and follow artists from their profile.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 list-none p-0 m-0" role="list">
      {artists.map((a) => (
        <li key={a.id}>
          <Link
            href={`/artist/${a.slug}`}
            className="flex items-center gap-4 p-4 rounded-xl border border-ink-faint/30 dark:border-white/10 hover:bg-ink-faint/5 dark:hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <CoverArt
              coverArtKey={a.avatarKey}
              title={a.name}
              size="sm"
              className="!w-14 !h-14 rounded-full shrink-0"
            />
            <span className="min-w-0">
              <span className="block font-semibold text-lg">{a.name}</span>
              <span className="block text-sm text-ink-muted dark:text-[#a8a8b4]">
                @{a.slug}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
