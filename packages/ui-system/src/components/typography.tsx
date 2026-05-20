"use client";

import type { CSSProperties, ReactNode } from "react";
import clsx from "clsx";
import { typography } from "../tokens/typography.js";

type Variant = "h1" | "h2" | "h3" | "body" | "small";

const variantStyle: Record<Variant, CSSProperties> = {
  h1: typography.h1,
  h2: typography.h2,
  h3: typography.h3,
  body: typography.body,
  small: typography.small,
};

const variantTag: Record<Variant, "h1" | "h2" | "h3" | "p"> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  body: "p",
  small: "p",
};

export interface UITextProps {
  variant?: Variant;
  className?: string;
  children: ReactNode;
  id?: string;
}

export function UIText({ variant = "body", className, children, id }: UITextProps): JSX.Element {
  const Tag = variantTag[variant];
  return (
    <Tag id={id} className={clsx("encore-ui-text", `encore-ui-text--${variant}`, className)} style={variantStyle[variant]}>
      {children}
    </Tag>
  );
}
