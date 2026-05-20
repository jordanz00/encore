"use client";

import type { ReactNode } from "react";
import clsx from "clsx";

export interface UIContainerProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "main" | "section";
}

export function UIContainer({ children, className, as = "div" }: UIContainerProps): JSX.Element {
  const Tag = as;
  return <Tag className={clsx("encore-ui-container", className)}>{children}</Tag>;
}

/** Optional ambient layer — stops when prefers-reduced-motion */
export function UIAmbientBackground({ enabled = true }: { enabled?: boolean }): JSX.Element | null {
  if (!enabled) return null;
  return (
    <div
      className="encore-ui-ambient"
      aria-hidden="true"
      data-reduced-motion="respect"
    />
  );
}
