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

export const api = {
  health: () => request<{ ok: boolean }>("/health"),
  discover: () => request<{ releases: Release[] }>("/recommendations/discover"),
  freshCrate: () => request<{ releases: Release[] }>("/recommendations/fresh-crate"),
  release: (id: string) => request<{ release: Release; tracks: Track[] }>(`/releases/${id}`),
  artist: (slug: string) => request<{ artist: Artist }>(`/artists/${slug}`),
  search: (q: string) =>
    request<{ artists: unknown[]; releases: unknown[]; tracks: unknown[] }>(
      `/search?q=${encodeURIComponent(q)}`,
    ),
  reportPlay: (trackId: string, secondsDelivered: number) =>
    request<void>("/plays", {
      method: "POST",
      body: JSON.stringify({ trackId, secondsDelivered, surface: "web" }),
    }).catch(() => undefined),
};
