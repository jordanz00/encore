/**
 * Session-persisted playback queue index (per release id).
 * Survives refresh within the same tab; not cross-device offline storage.
 */
const STORAGE_PREFIX = "encore:queue:";

export function loadQueueIndex(releaseId: string, trackCount: number): number {
  if (typeof window === "undefined" || trackCount < 1) return 0;
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${releaseId}`);
    if (raw == null) return 0;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(trackCount - 1, n);
  } catch {
    return 0;
  }
}

export function saveQueueIndex(releaseId: string, index: number): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${releaseId}`, String(index));
  } catch {
    /* quota / private mode */
  }
}
