"use client";

import { useEffect, useRef, useState } from "react";
import { springStep } from "../motion/spring.js";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion.js";

/**
 * rAF-smoothed progress (0–1) for player bar — no jitter from timeupdate alone.
 */
export function useSmoothProgress(targetRatio: number, active: boolean): number {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(targetRatio);
  const targetRef = useRef(targetRatio);

  targetRef.current = Math.min(1, Math.max(0, targetRatio));

  useEffect(() => {
    if (reduced || !active) {
      setDisplay(targetRef.current);
      return;
    }

    let frame = 0;
    const tick = (): void => {
      setDisplay((prev) => {
        const next = springStep(prev, targetRef.current, 0.2);
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [targetRatio, active, reduced]);

  return display;
}
