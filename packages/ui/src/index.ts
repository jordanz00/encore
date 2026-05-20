/**
 * @encore/ui — re-exports @encore/ui-system tokens for backward compatibility.
 */
export { tokens, colors, spacing, typography, motion } from "@encore/ui-system";

/** @deprecated use tokens from @encore/ui-system */
export const legacyTokens = {
  color: {
    ink: "#0a0908",
    inkMuted: "#3d3934",
    inkDim: "#524d47",
    paper: "#faf6ec",
    paperSoft: "#f3eddb",
    accent: "#dc2626",
    accentDeep: "#991b1b",
  },
  font: {
    display: '"Newsreader", ui-serif, Georgia, serif',
    sans: '"Inter", ui-sans-serif, system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
} as const;

export type DesignTokens = typeof legacyTokens;
