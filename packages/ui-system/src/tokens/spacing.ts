/** 8pt grid only — no random values. */
export const spacing = {
  1: 4,
  2: 8,
  3: 16,
  4: 24,
  5: 32,
  6: 48,
  7: 64,
} as const;

export type SpacingKey = keyof typeof spacing;

export function space(key: SpacingKey): number {
  return spacing[key];
}
