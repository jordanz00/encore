"use client";

import type { CSSProperties, ReactNode } from "react";
import clsx from "clsx";
import { cardPresence } from "../motion/presence.js";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion.js";

export interface UICardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Real state hook — e.g. data-loaded */
  visible?: boolean;
}

export function UICard({ children, className, style, visible = true }: UICardProps): JSX.Element {
  const reduced = usePrefersReducedMotion();
  const presence = cardPresence(reduced);
  const motionStyle = visible ? presence.animate : presence.initial;

  return (
    <div
      className={clsx("encore-ui-card", className)}
      style={{ ...motionStyle, ...style }}
    >
      {children}
    </div>
  );
}
