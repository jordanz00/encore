/**
 * Common types for CC / Public Domain catalog importers.
 */
export interface SeedTrack {
  upstreamId: string;
  source: "fma" | "internet_archive" | "jamendo";
  artistName: string;
  artistSlug: string;
  albumTitle: string | null;
  trackTitle: string;
  durationSeconds: number | null;
  trackNumber: number;
  audioUrl: string;
  audioMimeType: string | null;
  coverArtUrl: string | null;
  licenseUri: string;
  attribution: string;
  genres: string[];
  releasedAt: string | null;
}

export interface SeedRunSummary {
  source: SeedTrack["source"];
  attempted: number;
  inserted: number;
  skipped: number;
  failed: number;
  durationMs: number;
  errors: { upstreamId: string; message: string }[];
}

export interface SeedImporter {
  source: SeedTrack["source"];
  fetch(opts: { limit: number; signal?: AbortSignal }): AsyncGenerator<SeedTrack>;
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "untitled";
}
