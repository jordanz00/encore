"use client";

import type { ReactNode } from "react";
import clsx from "clsx";
import { useSmoothProgress } from "../hooks/useSmoothProgress.js";

export interface SmoothProgressBarProps {
  /** 0–1 from real audio currentTime / duration */
  ratio: number;
  playing: boolean;
  label?: string;
  className?: string;
}

/** Hardware-like progress — rAF interpolation, respects reduced motion. */
export function SmoothProgressBar({
  ratio,
  playing,
  label = "Playback progress",
  className,
}: SmoothProgressBarProps): JSX.Element {
  const smooth = useSmoothProgress(ratio, playing);
  const pct = `${(smooth * 100).toFixed(2)}%`;

  return (
    <div
      className={clsx("encore-ui-progress", className)}
      role="progressbar"
      aria-valuenow={Math.round(smooth * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="encore-ui-progress__track">
        <div
          className={clsx("encore-ui-progress__fill", playing && "encore-ui-progress__fill--active")}
          style={{ width: pct }}
        />
      </div>
    </div>
  );
}

export interface PlayerChromeProps {
  title: string;
  subtitle?: string;
  playing: boolean;
  artUrl?: string | null;
  progressRatio: number;
  children?: React.ReactNode;
  className?: string;
}

/** Presentational player shell — wire real audio element outside. */
export function PlayerChrome({
  title,
  subtitle,
  playing,
  artUrl,
  progressRatio,
  children,
  className,
}: PlayerChromeProps): JSX.Element {
  return (
    <section className={clsx("encore-ui-player", className)} aria-label="Music player">
      <div className="encore-ui-player__row">
        {artUrl ? (
          <img
            src={artUrl}
            alt=""
            className={clsx("encore-ui-player__art", playing && "encore-ui-player__art--playing")}
            width={56}
            height={56}
          />
        ) : (
          <div className="encore-ui-player__art encore-ui-player__art--placeholder" aria-hidden="true" />
        )}
        <div className="encore-ui-player__meta">
          <h2 className="encore-ui-player__title">{title}</h2>
          {subtitle ? <p className="encore-ui-player__subtitle">{subtitle}</p> : null}
        </div>
      </div>
      <SmoothProgressBar ratio={progressRatio} playing={playing} className="encore-ui-player__progress" />
      {children}
    </section>
  );
}
