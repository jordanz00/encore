/**
 * Encore UI — Apple neutral palette + single accent (Cuban: no rainbow chaos).
 */
export const colors = {
  dark: {
    bg: "#0b0c10",
    surface: "rgba(255, 255, 255, 0.04)",
    textPrimary: "rgba(255, 255, 255, 0.92)",
    textSecondary: "rgba(255, 255, 255, 0.65)",
    textTertiary: "rgba(255, 255, 255, 0.4)",
    border: "rgba(255, 255, 255, 0.08)",
    accent: "#3b82f6",
    accentEncore: "#dc2626",
    fail: "rgba(248, 113, 113, 0.85)",
    success: "rgba(74, 222, 128, 0.9)",
  },
  light: {
    bg: "#ffffff",
    surface: "rgba(10, 9, 8, 0.04)",
    textPrimary: "rgba(10, 9, 8, 0.92)",
    textSecondary: "rgba(10, 9, 8, 0.65)",
    textTertiary: "rgba(10, 9, 8, 0.4)",
    border: "rgba(10, 9, 8, 0.08)",
    accent: "#2563eb",
    accentEncore: "#dc2626",
    fail: "#b91c1c",
    success: "#15803d",
  },
  /** Encore paper mode (marketing + web light default) */
  paper: {
    bg: "#faf6ec",
    ink: "#0a0908",
    inkMuted: "#3d3934",
  },
} as const;

export type ColorTokens = typeof colors;
