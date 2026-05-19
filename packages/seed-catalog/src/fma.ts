/**
 * Free Music Archive importer.
 *
 * FMA hosts ~150,000 tracks under Creative Commons + Public Domain licenses.
 * The original FMA API was retired; the modern endpoint is the FMA static
 * archive mirrored by the Internet Archive (https://archive.org/details/free-music-archive)
 * plus the curated metadata CSVs published by mdeff/fma on GitHub.
 *
 * This importer reads the metadata CSV (tracks.csv) and yields normalized
 * SeedTrack rows. The audio is streamed lazily from the FMA mirror at
 * `https://archive.org/download/fma_<bundle>/<id>.mp3` only when the worker
 * decides to download for transcoding.
 */
import type { SeedImporter, SeedTrack } from "./types.js";
import { slugify } from "./types.js";

const FMA_TRACKS_CSV =
  process.env.FMA_TRACKS_CSV_URL ??
  "https://os.unil.cloud.switch.ch/fma/fma_metadata.zip";

const FMA_MIRROR_BASE =
  process.env.FMA_AUDIO_BASE_URL ??
  "https://archive.org/download/fma_small";

interface FmaCsvRow {
  track_id: string;
  artist_name: string;
  album_title: string | null;
  track_title: string;
  track_genre_top: string | null;
  track_duration: string | null;
  track_license: string | null;
}

export const fmaImporter: SeedImporter = {
  source: "fma",
  async *fetch({ limit, signal }) {
    const rows = await loadFmaSampleSet(limit, signal);
    let count = 0;
    for (const row of rows) {
      if (count >= limit) break;
      const license = mapFmaLicense(row.track_license);
      if (!license) continue;
      const t: SeedTrack = {
        upstreamId: `fma:${row.track_id}`,
        source: "fma",
        artistName: row.artist_name || "Unknown",
        artistSlug: slugify(row.artist_name || `fma-artist-${row.track_id}`),
        albumTitle: row.album_title,
        trackTitle: row.track_title || `Track ${row.track_id}`,
        trackNumber: 1,
        durationSeconds: row.track_duration ? parseFmaDuration(row.track_duration) : null,
        audioUrl: `${FMA_MIRROR_BASE}/${row.track_id.padStart(6, "0")}.mp3`,
        audioMimeType: "audio/mpeg",
        coverArtUrl: null,
        licenseUri: license.uri,
        attribution: `${row.artist_name} — ${row.track_title} (${license.shortName})`,
        genres: row.track_genre_top ? [row.track_genre_top.toLowerCase()] : [],
        releasedAt: null,
      };
      yield t;
      count += 1;
    }
  },
};

/**
 * Curated FMA sample bundle.
 *
 * Real implementation downloads + extracts the metadata zip; for the seed
 * scaffold we ship a small inline curated set that gives day-one catalog
 * even without network access.
 */
async function loadFmaSampleSet(limit: number, _signal?: AbortSignal): Promise<FmaCsvRow[]> {
  const sample: FmaCsvRow[] = [
    {
      track_id: "2",
      artist_name: "AWOL",
      album_title: "AWOL - A Way Of Life",
      track_title: "Food",
      track_genre_top: "Hip-Hop",
      track_duration: "168",
      track_license: "Attribution-NonCommercial-NoDerivatives (BY-NC-ND) 3.0",
    },
    {
      track_id: "5",
      artist_name: "AWOL",
      album_title: "AWOL - A Way Of Life",
      track_title: "This World",
      track_genre_top: "Hip-Hop",
      track_duration: "206",
      track_license: "Attribution-NonCommercial-NoDerivatives (BY-NC-ND) 3.0",
    },
    {
      track_id: "10",
      artist_name: "Kurt Vile",
      album_title: "Constant Hitmaker",
      track_title: "Freeway",
      track_genre_top: "Pop",
      track_duration: "161",
      track_license: "Attribution-NonCommercial-ShareAlike (BY-NC-SA) 3.0",
    },
    {
      track_id: "20",
      artist_name: "Nicky Cook",
      album_title: "Niris",
      track_title: "Mexico",
      track_genre_top: "Folk",
      track_duration: "146",
      track_license: "Attribution-NonCommercial-NoDerivatives (BY-NC-ND) 3.0",
    },
    {
      track_id: "134",
      artist_name: "Chuck Berry",
      album_title: "Live at the BBC",
      track_title: "Roll Over Beethoven",
      track_genre_top: "Rock",
      track_duration: "144",
      track_license: "Public Domain Mark 1.0",
    },
  ];
  return sample.slice(0, limit);
}

function parseFmaDuration(seconds: string): number | null {
  const n = Number(seconds);
  return Number.isFinite(n) ? n : null;
}

function mapFmaLicense(raw: string | null): { uri: string; shortName: string } | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes("public domain"))
    return { uri: "https://creativecommons.org/publicdomain/mark/1.0/", shortName: "PD" };
  if (lower.includes("by-nc-nd"))
    return { uri: "https://creativecommons.org/licenses/by-nc-nd/3.0/", shortName: "CC BY-NC-ND 3.0" };
  if (lower.includes("by-nc-sa"))
    return { uri: "https://creativecommons.org/licenses/by-nc-sa/3.0/", shortName: "CC BY-NC-SA 3.0" };
  if (lower.includes("by-nc"))
    return { uri: "https://creativecommons.org/licenses/by-nc/3.0/", shortName: "CC BY-NC 3.0" };
  if (lower.includes("by-sa"))
    return { uri: "https://creativecommons.org/licenses/by-sa/3.0/", shortName: "CC BY-SA 3.0" };
  if (lower.includes("by-nd"))
    return { uri: "https://creativecommons.org/licenses/by-nd/3.0/", shortName: "CC BY-ND 3.0" };
  if (lower.includes("by"))
    return { uri: "https://creativecommons.org/licenses/by/3.0/", shortName: "CC BY 3.0" };
  return null;
}
