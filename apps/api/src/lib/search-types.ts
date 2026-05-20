/** Stable search hit shapes for web, mobile, and SDK consumers. */

export interface SearchArtistHit {
  id: string;
  name: string;
  slug: string;
}

export interface SearchReleaseHit {
  id: string;
  title: string;
  type: string;
  coverArtKey: string | null;
  primaryArtistName: string;
  primaryArtistSlug: string;
}

export interface SearchTrackHit {
  id: string;
  title: string;
  releaseId: string;
  releaseTitle: string;
  primaryArtistName: string;
  durationMs: number;
}

export interface SearchResponse {
  artists: SearchArtistHit[];
  releases: SearchReleaseHit[];
  tracks: SearchTrackHit[];
  source: "meilisearch" | "postgres";
  error?: "search_unavailable";
}
