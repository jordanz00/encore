export { colors } from "./colors.js";
export { spacing, space } from "./spacing.js";
export { typography, fontFamily } from "./typography.js";
export { motion } from "./motion.js";

import { colors } from "./colors.js";
import { spacing } from "./spacing.js";
import { typography, fontFamily } from "./typography.js";
import { motion } from "./motion.js";

export const tokens = {
  colors,
  spacing,
  typography,
  fontFamily,
  motion,
} as const;
