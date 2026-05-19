/**
 * Jamendo Creative Commons importer.
 *
 * ~600,000 CC-licensed tracks. API requires a free client_id; without one
 * we ship a curated fallback so the seed pipeline still produces output.
 */
import type { SeedImporter, SeedTrack } from "./types.js";
import { slugify } from "./types.js";

const JAMENDO_API = "https://api.jamendo.com/v3.0/tracks";
const CLIENT_ID = process.env.JAMENDO_CLIENT_ID;

interface JamendoTrack {
  id: string;
  name: string;
  duration: number;
  artist_name: string;
  artist_id: string;
  album_name: string;
  album_image: string;
  audio: string;
  audiodownload: string;
  license_ccurl: string;
  releasedate: string;
  position: number;
  musicinfo?: { tags?: { genres?: string[] } };
}

export const jamendoImporter: SeedImporter = {
  source: "jamendo",
  async *fetch({ limit, signal }) {
    const tracks = await fetchJamendoTracks(limit, signal);
    for (const t of tracks) {
      yield {
        upstreamId: `jamendo:${t.id}`,
        source: "jamendo",
        artistName: t.artist_name,
        artistSlug: slugify(t.artist_name),
        albumTitle: t.album_name || null,
        trackTitle: t.name,
        trackNumber: t.position || 1,
        durationSeconds: t.duration || null,
        audioUrl: t.audiodownload || t.audio,
        audioMimeType: "audio/mpeg",
        coverArtUrl: t.album_image || null,
        licenseUri: t.license_ccurl || "https://creativecommons.org/licenses/by/3.0/",
        attribution: `${t.artist_name} — ${t.name} (Jamendo: ${t.id})`,
        genres: t.musicinfo?.tags?.genres ?? [],
        releasedAt: t.releasedate || null,
      };
    }
  },
};

async function fetchJamendoTracks(limit: number, signal?: AbortSignal): Promise<JamendoTrack[]> {
  if (!CLIENT_ID) return curatedFallback(limit);
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    format: "json",
    limit: String(Math.min(limit, 200)),
    include: "musicinfo",
    audioformat: "mp32",
    boost: "popularity_total",
  });
  try {
    const res = await fetch(`${JAMENDO_API}?${params.toString()}`, {
      headers: { "User-Agent": "Encore-Seed/0.0.1" },
      signal,
    });
    if (!res.ok) return curatedFallback(limit);
    const data = (await res.json()) as { results?: JamendoTrack[] };
    return data.results ?? curatedFallback(limit);
  } catch {
    return curatedFallback(limit);
  }
}

function curatedFallback(limit: number): JamendoTrack[] {
  const fallback: JamendoTrack[] = [
    {
      id: "1781603",
      name: "Lights",
      duration: 215,
      artist_name: "Sappheiros",
      artist_id: "478893",
      album_name: "Lights",
      album_image: "",
      audio: "",
      audiodownload: "https://prod-1.storage.jamendo.com/?trackid=1781603&format=mp31",
      license_ccurl: "https://creativecommons.org/licenses/by/3.0/",
      releasedate: "2018-02-09",
      position: 1,
      musicinfo: { tags: { genres: ["electronic", "ambient"] } },
    },
    {
      id: "1219425",
      name: "Inspiring Cinematic Ambient",
      duration: 190,
      artist_name: "Lexin Music",
      artist_id: "356920",
      album_name: "",
      album_image: "",
      audio: "",
      audiodownload: "https://prod-1.storage.jamendo.com/?trackid=1219425&format=mp31",
      license_ccurl: "https://creativecommons.org/licenses/by-nc-sa/3.0/",
      releasedate: "2014-01-01",
      position: 1,
      musicinfo: { tags: { genres: ["cinematic", "ambient"] } },
    },
  ];
  return fallback.slice(0, limit);
}
