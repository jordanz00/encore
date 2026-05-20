/**
 * @encore/ui-system — Apple-grade tokens, motion, state-aware components.
 * Source of truth for Encore product UI (web + static surfaces via CSS export).
 */
export { tokens, colors, spacing, space, typography, fontFamily, motion } from "./tokens/index.js";
export { easeOutApple, easeSmooth, transitions, springStep, cardPresence, modalPresence } from "./motion/index.js";
export { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion.js";
export { useSmoothProgress } from "./hooks/useSmoothProgress.js";
export * from "./components/index.js";
