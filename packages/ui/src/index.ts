/**
 * @encore/ui — shared design tokens + primitive components.
 * Today: tokens only. shadcn-style components land per RFC 007.
 */
export const tokens = {
  color: {
    inkDefault: "#0b0b0e",
    inkMuted: "#7a7a85",
    paperDefault: "#fafafa",
    paperSoft: "#f1f1f4",
    accentDefault: "#ff5b00",
    accentSoft: "#ffb285",
  },
  radius: { sm: 4, md: 8, lg: 16, full: 9999 },
  spacing: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96],
} as const;

export type DesignTokens = typeof tokens;
