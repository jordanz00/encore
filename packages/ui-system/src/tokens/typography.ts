/**
 * Typography — readability first (SF Pro stack via system-ui + Inter fallback).
 */
export const fontFamily = {
  system:
    '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
  display: '"Newsreader", "SF Pro Display", ui-serif, Georgia, serif',
} as const;

export const typography = {
  h1: {
    fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
    fontFamily: fontFamily.display,
  },
  h2: {
    fontSize: "clamp(2rem, 3.5vw, 2.5rem)",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: 1.15,
    fontFamily: fontFamily.display,
  },
  h3: {
    fontSize: "clamp(1.375rem, 2vw, 1.75rem)",
    fontWeight: 500,
    letterSpacing: "-0.015em",
    lineHeight: 1.3,
    fontFamily: fontFamily.system,
  },
  body: {
    fontSize: "1.0625rem",
    fontWeight: 400,
    lineHeight: 1.6,
    fontFamily: fontFamily.system,
  },
  small: {
    fontSize: "0.8125rem",
    fontWeight: 400,
    lineHeight: 1.45,
    opacity: 0.65,
    fontFamily: fontFamily.system,
  },
} as const;
