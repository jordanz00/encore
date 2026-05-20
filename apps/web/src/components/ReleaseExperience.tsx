"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Track } from "@/lib/api";
import Player from "@/components/Player";
import { loadQueueIndex, saveQueueIndex } from "@/lib/player-queue";

interface ReleaseExperienceProps {
  releaseId: string;
  tracks: Track[];
}

/**
 * Release page playback — pick track from list, unified player queue index.
 */
export default function ReleaseExperience({
  releaseId,
  tracks,
}: ReleaseExperienceProps): JSX.Element {
  const [index, setIndex] = useState(0);
  const current = tracks[index];

  useEffect(() => {
    setIndex(loadQueueIndex(releaseId, tracks.length));
  }, [releaseId, tracks.length]);

  useEffect(() => {
    saveQueueIndex(releaseId, index);
  }, [releaseId, index]);

  return (
    <>
      <section aria-labelledby="tracks-heading">
        <h2 id="tracks-heading" className="font-display text-2xl font-semibold mb-4">
          Tracks
        </h2>
        <ol className="divide-y divide-black/5 dark:divide-white/10 max-w-prose-wide" role="list">
          {tracks.map((t, i) => {
            const active = i === index;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-current={active ? "true" : undefined}
                  className={`encore-track-row w-full text-left border-0 bg-transparent cursor-pointer min-h-11 transition-colors ${
                    active
                      ? "bg-accent-soft dark:bg-white/5"
                      : "hover:bg-paper-soft dark:hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <span
                      className="text-ink-dim dark:text-[#888894] w-7 text-right tabular-nums font-mono text-xs shrink-0"
                      aria-hidden="true"
                    >
                      {active ? "▶" : i + 1}
                    </span>
                    <span className="font-medium text-base truncate text-ink dark:text-[#faf6ec]">
                      {t.title}
                    </span>
                  </div>
                  <span className="text-sm text-ink-muted dark:text-[#a8a8b4] font-mono tabular-nums shrink-0">
                    {formatMs(t.durationMs)}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {current && (
          <p className="sr-only" aria-live="polite">
            Selected track {index + 1} of {tracks.length}: {current.title}
          </p>
        )}
      </section>

      <Player tracks={tracks} activeIndex={index} onTrackIndexChange={setIndex} />
    </>
  );
}

function formatMs(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, "0")}`;
}
