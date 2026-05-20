import type { CSSProperties } from "react";
import { motion } from "../tokens/motion.js";
import { easeOutApple } from "./easing.js";

export interface PresenceStyle {
  initial: CSSProperties;
  animate: CSSProperties;
  reduced: CSSProperties;
}

/** Card enter — fade + translateY */
export function cardPresence(reducedMotion: boolean): PresenceStyle {
  if (reducedMotion) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      reduced: { opacity: 1 },
    };
  }
  return {
    initial: { opacity: 0, transform: `translateY(${motion.distance.cardEnterY}px)` },
    animate: {
      opacity: 1,
      transform: "translateY(0)",
      transition: `opacity ${motion.duration.page}ms ${easeOutApple}, transform ${motion.duration.page}ms ${easeOutApple}`,
    },
    reduced: { opacity: 1, transform: "none" },
  };
}

/** Modal — scale 0.98 → 1 */
export function modalPresence(reducedMotion: boolean): PresenceStyle {
  if (reducedMotion) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      reduced: { opacity: 1 },
    };
  }
  return {
    initial: { opacity: 0, transform: `scale(${motion.scale.modalFrom})` },
    animate: {
      opacity: 1,
      transform: `scale(${motion.scale.modalTo})`,
      transition: `opacity ${motion.duration.uiMax}ms ${easeOutApple}, transform ${motion.duration.uiMax}ms ${easeOutApple}`,
    },
    reduced: { opacity: 1, transform: "none" },
  };
}
