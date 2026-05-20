/**
 * Tiny API client used by Next.js server components + client components.
 * Targets apps/api on http://localhost:3001 in dev.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`api_${res.status}_${path}`);
  }
  return res.json() as Promise<T>;
}

export interface Release {
  id: string;
  primaryArtistId: string;
  title: string;
  type: string;
  status: string;
  publishedAt: string | null;
  coverArtKey: string | null;
  priceFloorCents?: number | null;
}

export interface Track {
  id: string;
  releaseId: string;
  title: string;
  durationMs: number;
  hlsKey: string | null;
  flacKey: string | null;
  waveformKey: string | null;
}

export interface Artist {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  avatarKey: string | null;
}

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

export interface StripeConnectState {
  configured: boolean;
  status: "not_started" | "pending" | "active" | "restricted";
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  accountId: string | null;
  message: string;
}

export interface SearchResponse {
  artists: SearchArtistHit[];
  releases: SearchReleaseHit[];
  tracks: SearchTrackHit[];
  source: "meilisearch" | "postgres";
  error?: "search_unavailable";
}

export const api = {
  health: () => request<{ ok: boolean }>("/health"),
  me: () => request<{ user: { id: string; handle: string; role: string } }>("/auth/me"),
  paymentsConfig: () =>
    request<{ enabled: boolean; platformFeePercent: number }>("/payments/config"),
  discover: () => request<{ releases: Release[] }>("/recommendations/discover"),
  freshCrate: () => request<{ releases: Release[] }>("/recommendations/fresh-crate"),
  release: (id: string) => request<{ release: Release; tracks: Track[] }>(`/releases/${id}`),
  artist: (slug: string) => request<{ artist: Artist }>(`/artists/${slug}`),
  artistReleases: (slug: string) =>
    request<{ artistId: string; releases: Release[] }>(`/artists/${slug}/releases`),
  search: (q: string) =>
    request<SearchResponse>(`/search?q=${encodeURIComponent(q)}`),
  reportPlay: (trackId: string, secondsDelivered: number) =>
    request<void>("/plays", {
      method: "POST",
      body: JSON.stringify({ trackId, secondsDelivered, surface: "web" }),
    }).catch(() => undefined),
};

/** Client-side calls with credentials (upload, publish). */
export const apiClient = {
  me: () =>
    fetch(`${API_URL}/auth/me`, { credentials: "include" }).then(async (r) => {
      if (!r.ok) throw new Error("unauthorized");
      return r.json() as Promise<{ user: { id: string; handle: string; role: string } }>;
    }),
  myArtist: () =>
    fetch(`${API_URL}/artists/me/profile`, { credentials: "include" }).then(async (r) => {
      if (!r.ok) throw new Error("artist_profile_failed");
      return r.json() as Promise<{ artist: Artist | null }>;
    }),
  remoteFollowerCount: () =>
    fetch(`${API_URL}/artists/me/remote-followers`, { credentials: "include" }).then(async (r) => {
      if (!r.ok) throw new Error("remote_followers_failed");
      return r.json() as Promise<{ count: number }>;
    }),
  myFollows: () =>
    fetch(`${API_URL}/follows/me`, { credentials: "include" }).then(async (r) => {
      if (!r.ok) throw new Error("follows_me_failed");
      return r.json() as Promise<{ artists: (Artist & { followedAt: string })[] }>;
    }),
  followArtist: (artistId: string) =>
    fetch(`${API_URL}/follows`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artistId }),
    }).then(async (r) => {
      if (!r.ok) throw new Error(`follow_${r.status}`);
      return r.json() as Promise<{ ok: boolean }>;
    }),
  unfollowArtist: (artistId: string) =>
    fetch(`${API_URL}/follows/${artistId}`, {
      method: "DELETE",
      credentials: "include",
    }).then(async (r) => {
      if (!r.ok) throw new Error(`unfollow_${r.status}`);
      return r.json() as Promise<{ ok: boolean }>;
    }),
  stripeConnectOnboard: (artistId: string) =>
    fetch(`${API_URL}/payments/connect/onboard`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artistId }),
    }).then(async (r) => {
      if (!r.ok) throw new Error(`connect_onboard_${r.status}`);
      return r.json() as Promise<{ url: string; accountId: string }>;
    }),
  stripeConnectSync: (artistId: string) =>
    fetch(`${API_URL}/payments/connect/sync`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artistId }),
    }).then(async (r) => {
      if (!r.ok) throw new Error(`connect_sync_${r.status}`);
      return r.json() as Promise<{ stripeConnect: StripeConnectState }>;
    }),
  createArtist: (body: { slug: string; name: string }) =>
    fetch(`${API_URL}/artists`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (r) => {
      if (!r.ok) throw new Error(`create_artist_${r.status}`);
      return r.json() as Promise<{ artist: Artist }>;
    }),
  createRelease: (body: {
    artistId: string;
    title: string;
    type: string;
    priceFloorCents?: number;
  }) =>
    fetch(`${API_URL}/releases`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (r) => {
      if (!r.ok) throw new Error(`create_release_${r.status}`);
      return r.json() as Promise<{ release: Release }>;
    }),
  createTrack: (body: {
    releaseId: string;
    title: string;
    masterKey?: string;
  }) =>
    fetch(`${API_URL}/tracks`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (r) => {
      if (!r.ok) throw new Error(`create_track_${r.status}`);
      return r.json() as Promise<{ track: Track }>;
    }),
  publishRelease: (releaseId: string) =>
    fetch(`${API_URL}/releases/${releaseId}/publish`, {
      method: "POST",
      credentials: "include",
    }).then(async (r) => {
      if (!r.ok) throw new Error(`publish_${r.status}`);
      return r.json() as Promise<{ release: Release; federated?: boolean }>;
    }),
  presignUpload: (body: { kind: string; contentType: string; sizeBytes: number }) =>
    fetch(`${API_URL}/uploads/presign`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (r) => {
      if (!r.ok) throw new Error(`presign_${r.status}`);
      return r.json() as Promise<{ url: string; key: string }>;
    }),
  finalizeUpload: (body: { key: string; trackId: string }) =>
    fetch(`${API_URL}/uploads/finalize`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (r) => {
      if (!r.ok) throw new Error(`finalize_${r.status}`);
      return r.json() as Promise<{ queued: boolean }>;
    }),
};
