"use client";

import { useEffect, useRef, useState } from "react";
import type { Track } from "@/lib/api";
import { api } from "@/lib/api";

/**
 * Encore web player (client-side).
 *
 * Today: HTMLAudioElement + MediaSession API + keyboard shortcuts +
 * verified-play reporting at 30s. Wavesurfer.js + HLS.js wiring lives
 * in packages/player/ and is loaded via dynamic import once HLS keys
 * are populated by the worker (apps/worker/src/jobs/transcode.ts).
 *
 * Roadmap (RFC 007): gapless via dual-Audio crossover, crossfade,
 * AirPlay/Cast handoff, queue, lyrics overlay.
 */
export default function Player({ tracks }: { tracks: Track[] }): JSX.Element {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reported, setReported] = useState(false);

  const track = tracks[index];

  useEffect(() => {
    setReported(false);
  }, [index]);

  useEffect(() => {
    if (!track || typeof navigator === "undefined") return;
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      album: "Encore",
    });
    navigator.mediaSession.setActionHandler("play", () => audioRef.current?.play());
    navigator.mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler("nexttrack", () =>
      setIndex((i) => Math.min(tracks.length - 1, i + 1)),
    );
    navigator.mediaSession.setActionHandler("previoustrack", () =>
      setIndex((i) => Math.max(0, i - 1)),
    );
  }, [track, tracks.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === "Space" || e.key === "k") {
        e.preventDefault();
        if (audioRef.current?.paused) audioRef.current?.play();
        else audioRef.current?.pause();
      } else if (e.key === "j") {
        if (audioRef.current) audioRef.current.currentTime -= 10;
      } else if (e.key === "l") {
        if (audioRef.current) audioRef.current.currentTime += 10;
      } else if (e.key === "ArrowRight") {
        setIndex((i) => Math.min(tracks.length - 1, i + 1));
      } else if (e.key === "ArrowLeft") {
        setIndex((i) => Math.max(0, i - 1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tracks.length]);

  function onTimeUpdate(): void {
    if (!audioRef.current || !track || reported) return;
    if (audioRef.current.currentTime >= 30) {
      setReported(true);
      void api.reportPlay(track.id, 30);
    }
  }

  if (!track) return <div className="text-ink-muted text-sm">No tracks.</div>;

  const src = track.hlsKey ?? track.flacKey ?? "";
  return (
    <div className="sticky bottom-4 rounded-2xl bg-ink text-paper p-4 dark:bg-paper dark:text-ink shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="font-medium truncate">{track.title}</div>
          <div className="text-xs opacity-60">
            Track {index + 1} of {tracks.length}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button
            className="px-2 py-1 rounded hover:bg-white/10"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            aria-label="Previous"
          >
            ⏮
          </button>
          <button
            className="px-2 py-1 rounded hover:bg-white/10"
            onClick={() => {
              if (audioRef.current?.paused) audioRef.current?.play();
              else audioRef.current?.pause();
            }}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? "⏸" : "▶"}
          </button>
          <button
            className="px-2 py-1 rounded hover:bg-white/10"
            onClick={() => setIndex((i) => Math.min(tracks.length - 1, i + 1))}
            aria-label="Next"
          >
            ⏭
          </button>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={src || undefined}
        controls
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={onTimeUpdate}
        className="w-full mt-3"
      />
      {!src && (
        <div className="text-xs opacity-60 mt-2">
          No streamable audio yet — transcoder hasn&apos;t produced an HLS key.
        </div>
      )}
    </div>
  );
}
