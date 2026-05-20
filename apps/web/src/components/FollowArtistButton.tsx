"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

interface FollowArtistButtonProps {
  artistId: string;
  artistName: string;
}

/**
 * Follow / unfollow for signed-in listeners (library feed source).
 */
export default function FollowArtistButton({
  artistId,
  artistName,
}: FollowArtistButtonProps): JSX.Element {
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    try {
      await apiClient.me();
      setSignedIn(true);
      const { artists } = await apiClient.myFollows();
      setFollowing(artists.some((a) => a.id === artistId));
    } catch {
      setSignedIn(false);
      setFollowing(false);
    }
  }, [artistId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function toggle(): Promise<void> {
    if (!signedIn || busy) return;
    setBusy(true);
    try {
      if (following) {
        await apiClient.unfollowArtist(artistId);
        setFollowing(false);
      } else {
        await apiClient.followArtist(artistId);
        setFollowing(true);
      }
    } finally {
      setBusy(false);
    }
  }

  if (signedIn === false) {
    return (
      <p className="text-sm text-ink-muted dark:text-[#a8a8b4] m-0">
        <a href="/login" className="underline underline-offset-2">
          Sign in
        </a>{" "}
        to follow {artistName}.
      </p>
    );
  }

  return (
    <button
      type="button"
      className="encore-btn encore-btn-secondary min-h-[44px]"
      onClick={() => void toggle()}
      disabled={busy || signedIn === null}
      aria-pressed={following}
      aria-busy={busy}
    >
      {following ? `Following ${artistName}` : `Follow ${artistName}`}
    </button>
  );
}
