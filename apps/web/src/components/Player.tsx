"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SmoothProgressBar } from "@encore/ui-system";
import type { Track } from "@/lib/api";
import { api } from "@/lib/api";
import { mediaAudioUrl } from "@/lib/media";

/**
 * Accessible web player — HLS/FLAC, queue advance, keyboard, Media Session, resilient reload.
 */
interface PlayerProps {
  tracks: Track[];
  activeIndex?: number;
  onTrackIndexChange?: (index: number) => void;
}

export default function Player({
  tracks,
  activeIndex,
  onTrackIndexChange,
}: PlayerProps): JSX.Element {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const liveRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<import("hls.js").default | null>(null);
  const [internalIndex, setInternalIndex] = useState(0);
  const index = activeIndex ?? internalIndex;
  const setIndex = onTrackIndexChange ?? setInternalIndex;
  const [playing, setPlaying] = useState(false);
  const [reported, setReported] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [progressRatio, setProgressRatio] = useState(0);

  const track = tracks[index];

  const announce = useCallback((msg: string) => {
    if (liveRef.current) liveRef.current.textContent = msg;
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(tracks.length - 1, i + 1));
  }, [setIndex, tracks.length]);

  useEffect(() => {
    setReported(false);
    setStreamError(null);
    setProgressRatio(0);
    if (track) announce(`Track ${index + 1} of ${tracks.length}: ${track.title}`);
  }, [index, track, tracks.length, announce]);

  useEffect(() => {
    if (!track || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      album: "Encore",
    });
    navigator.mediaSession.setActionHandler("play", () => {
      void audioRef.current?.play();
    });
    navigator.mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler("nexttrack", goNext);
    navigator.mediaSession.setActionHandler("previoustrack", () =>
      setIndex((i) => Math.max(0, i - 1)),
    );
    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
    };
  }, [track, goNext, setIndex]);

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === "Space" || e.key === "k") {
        e.preventDefault();
        if (audioRef.current?.paused) void audioRef.current?.play();
        else audioRef.current?.pause();
      } else if (e.key === "j") {
        e.preventDefault();
        if (audioRef.current) audioRef.current.currentTime -= 10;
      } else if (e.key === "l") {
        e.preventDefault();
        if (audioRef.current) audioRef.current.currentTime += 10;
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, setIndex]);

  useEffect(() => {
    function onVisibility(): void {
      if (document.visibilityState === "hidden" && audioRef.current && !audioRef.current.paused) {
        /* Keep playing in background where OS allows; do not force-pause on tab hide. */
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  function onTimeUpdate(): void {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.duration > 0) {
      setProgressRatio(audio.currentTime / audio.duration);
    }
    if (!track || reported) return;
    if (audio.currentTime >= 30) {
      setReported(true);
      void api.reportPlay(track.id, 30);
    }
  }

  const streamKey = track?.hlsKey ?? track?.flacKey ?? "";
  const src = mediaAudioUrl(streamKey) ?? "";
  const useHls = Boolean(track?.hlsKey);
  const trackId = track?.id ?? "";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src || !trackId) return;

    let cancelled = false;
    setBuffering(true);
    setStreamError(null);

    async function attachStream(): Promise<void> {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (useHls && typeof window !== "undefined") {
        const { default: Hls } = await import("hls.js");
        if (cancelled) return;
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            maxLoadingRetry: 4,
          });
          hlsRef.current = hls;
          hls.on(Hls.Events.ERROR, (_e, data) => {
            if (data.fatal) {
              setStreamError("Playback stalled — retrying…");
              hls.recoverMediaError();
            }
          });
          hls.loadSource(src);
          hls.attachMedia(audio);
          return;
        }
        if (audio.canPlayType("application/vnd.apple.mpegurl")) {
          audio.src = src;
          return;
        }
      }
      audio.src = src;
    }

    void attachStream().finally(() => {
      if (!cancelled) setBuffering(false);
    });

    return () => {
      cancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, [src, trackId, useHls]);

  useEffect(() => {
    if (index >= tracks.length - 1) return;
    const next = tracks[index + 1];
    const href = mediaAudioUrl(next?.hlsKey ?? next?.flacKey);
    if (!href) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "fetch";
    link.href = href;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [index, tracks]);

  if (!track) {
    return <p className="text-sm text-ink-muted dark:text-[#c0c0ca]">No tracks.</p>;
  }

  return (
    <section
      className="sticky bottom-4 rounded-2xl bg-ink text-paper p-5 sm:p-6 dark:bg-[#16140f] dark:text-[#faf6ec] shadow-lg border border-black/10"
      aria-label="Music player"
    >
      <div ref={liveRef} className="encore-sr-only" aria-live="polite" aria-atomic="true" />

      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold truncate leading-tight m-0 text-paper dark:text-[#faf6ec]">
            {track.title}
          </h2>
          <p className="text-xs text-[#d0d0d8] mt-1 tabular-nums m-0">
            Track {index + 1} of {tracks.length}
            {buffering ? " · Buffering…" : ""}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0" role="group" aria-label="Playback controls">
          <button
            type="button"
            className="min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf6ec]"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            aria-label="Previous track"
          >
            <span aria-hidden="true">⏮</span>
          </button>
          <button
            type="button"
            className="min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf6ec]"
            onClick={() => {
              if (audioRef.current?.paused) {
                void audioRef.current?.play();
                announce(`Playing ${track.title}`);
              } else {
                audioRef.current?.pause();
                announce(`Paused ${track.title}`);
              }
            }}
            aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
          >
            <span aria-hidden="true">{playing ? "⏸" : "▶"}</span>
          </button>
          <button
            type="button"
            className="min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#faf6ec]"
            onClick={goNext}
            disabled={index >= tracks.length - 1}
            aria-label="Next track"
          >
            <span aria-hidden="true">⏭</span>
          </button>
        </div>
      </div>

      <SmoothProgressBar
        ratio={progressRatio}
        playing={playing && !buffering}
        label={`Progress for ${track.title}`}
        className="mb-3"
      />

      <audio
        ref={audioRef}
        controls
        preload="metadata"
        aria-label={`Audio playback for ${track.title}`}
        onPlay={() => {
          setPlaying(true);
          announce(`Playing ${track.title}`);
        }}
        onPause={() => {
          setPlaying(false);
          announce(`Paused ${track.title}`);
        }}
        onWaiting={() => setBuffering(true)}
        onCanPlay={() => setBuffering(false)}
        onEnded={() => {
          if (index < tracks.length - 1) {
            goNext();
            void audioRef.current?.play();
          }
        }}
        onTimeUpdate={onTimeUpdate}
        className="w-full min-h-11"
      />
      {!src && (
        <p className="text-sm text-[#d0d0d8] mt-3 leading-relaxed m-0" role="status">
          No streamable audio yet — transcoder has not produced an HLS key.
        </p>
      )}
      {streamError && (
        <p className="text-sm text-amber-200 mt-2 m-0" role="status">
          {streamError}
        </p>
      )}
      <p className="text-xs text-[#b8b8c4] mt-2 m-0">
        Keyboard: Space play/pause · J/L ±10s · Arrow keys change track
      </p>
    </section>
  );
}
