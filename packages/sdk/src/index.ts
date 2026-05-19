/**
 * @encore/sdk — public TypeScript SDK for third-party clients.
 *
 * Mirrors apps/api endpoints. Safe to publish to npm under MIT license
 * separately from the AGPL-3.0 server code (see RFC 008).
 */
export interface EncoreConfig {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  apiToken?: string;
}

export interface ApiTrack {
  id: string;
  releaseId: string;
  title: string;
  durationMs: number;
  hlsKey: string | null;
  flacKey: string | null;
}

export interface ApiRelease {
  id: string;
  primaryArtistId: string;
  title: string;
  type: string;
  status: string;
  publishedAt: string | null;
}

export interface ApiArtist {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
}

export class Encore {
  private readonly cfg: EncoreConfig;
  constructor(cfg: EncoreConfig) {
    this.cfg = cfg;
  }

  private async req<T>(path: string, init?: RequestInit): Promise<T> {
    const f = this.cfg.fetchImpl ?? fetch;
    const res = await f(`${this.cfg.baseUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(this.cfg.apiToken ? { Authorization: `Bearer ${this.cfg.apiToken}` } : {}),
        ...(init?.headers ?? {}),
      },
      ...init,
    });
    if (!res.ok) throw new Error(`encore_sdk_${res.status}`);
    return (await res.json()) as T;
  }

  health(): Promise<{ ok: boolean }> {
    return this.req("/health");
  }

  getRelease(id: string): Promise<{ release: ApiRelease; tracks: ApiTrack[] }> {
    return this.req(`/releases/${id}`);
  }

  getArtist(slug: string): Promise<{ artist: ApiArtist }> {
    return this.req(`/artists/${slug}`);
  }

  search(q: string): Promise<{ artists: unknown[]; releases: unknown[]; tracks: unknown[] }> {
    return this.req(`/search?q=${encodeURIComponent(q)}`);
  }

  reportPlay(trackId: string, secondsDelivered: number): Promise<void> {
    return this.req("/plays", {
      method: "POST",
      body: JSON.stringify({ trackId, secondsDelivered, surface: "sdk" }),
    });
  }
}
