/**
 * Media URL helpers — presigned redirect endpoints on the API.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function mediaImageUrl(key: string | null | undefined): string | null {
  if (!key?.trim()) return null;
  return `${API_URL}/media/images/${encodeURIComponent(key)}`;
}

export function mediaAudioUrl(key: string | null | undefined): string | null {
  if (!key?.trim()) return null;
  return `${API_URL}/media/audio/${encodeURIComponent(key)}`;
}
