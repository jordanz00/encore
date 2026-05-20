import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0a0908",
          soft: "#1a1815",
          muted: "#3d3934",
          dim: "#524d47",
          faint: "#6b655c",
        },
        paper: {
          DEFAULT: "#faf6ec",
          soft: "#f3eddb",
          elevated: "#f1f1f4",
        },
        accent: {
          DEFAULT: "#dc2626",
          deep: "#991b1b",
          soft: "rgba(220, 38, 38, 0.08)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "2xs": ["0.75rem", { lineHeight: "1.35" }],
        xs: ["0.8125rem", { lineHeight: "1.4" }],
        sm: ["0.9375rem", { lineHeight: "1.5" }],
        base: ["1.0625rem", { lineHeight: "1.5" }],
        lg: ["1.25rem", { lineHeight: "1.35" }],
        xl: ["1.5rem", { lineHeight: "1.22" }],
        "2xl": ["clamp(1.375rem, 3vw, 1.875rem)", { lineHeight: "1.22" }],
        "3xl": ["clamp(1.75rem, 4vw, 2.5rem)", { lineHeight: "1.15" }],
        "4xl": ["clamp(2.25rem, 5vw, 3.25rem)", { lineHeight: "1.1" }],
        hero: ["clamp(2.75rem, 6vw, 4.5rem)", { lineHeight: "1.05" }],
      },
      maxWidth: {
        prose: "42rem",
        "prose-wide": "48rem",
        "screen-readable": "72rem",
      },
      letterSpacing: {
        tight: "-0.025em",
        normal: "-0.011em",
      },
    },
  },
  plugins: [],
} satisfies Config;
