import { motion } from "../tokens/motion.js";
import { easeOutApple, easeSmooth } from "./easing.js";

export const transitions = {
  micro: `transform ${motion.duration.micro}ms ${easeOutApple}, opacity ${motion.duration.micro}ms ${easeSmooth}`,
  ui: `transform ${motion.duration.ui}ms ${easeOutApple}, opacity ${motion.duration.ui}ms ${easeSmooth}`,
  page: `transform ${motion.duration.page}ms ${easeOutApple}, opacity ${motion.duration.page}ms ${easeSmooth}`,
  data: `opacity ${motion.duration.data}ms ${easeSmooth}, transform ${motion.duration.data}ms ${easeOutApple}`,
  modal: `transform ${motion.duration.uiMax}ms ${easeOutApple}, opacity ${motion.duration.uiMax}ms ${easeSmooth}`,
} as const;
