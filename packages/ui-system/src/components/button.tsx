"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion.js";

export type UIButtonVariant = "primary" | "secondary" | "accent" | "ghost";

export interface UIButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: UIButtonVariant;
  children: ReactNode;
}

export function UIButton({
  variant = "primary",
  className,
  children,
  type = "button",
  ...rest
}: UIButtonProps): JSX.Element {
  const reduced = usePrefersReducedMotion();

  return (
    <button
      type={type}
      className={clsx(
        "encore-ui-btn",
        `encore-ui-btn--${variant}`,
        reduced && "encore-ui-btn--reduced",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
