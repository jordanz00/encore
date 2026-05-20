/**
 * Lightweight spring-like interpolation (no dependency).
 * For rAF progress / indicator glide.
 */
export function springStep(current: number, target: number, stiffness = 0.18): number {
  const delta = target - current;
  if (Math.abs(delta) < 0.001) return target;
  return current + delta * stiffness;
}
