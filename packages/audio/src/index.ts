/**
 * @encore/audio — ffmpeg + audio analysis helpers shared by api + worker.
 *
 * Exports a small, well-typed surface; ffmpeg invocation lives here so we
 * have one place to upgrade encoder flags, ladder choices, etc.
 *
 * RFC 003 governs audio quality decisions (HLS ladders, FLAC, ReplayGain,
 * EBU R128, spatial-audio binaural rendering).
 */
export interface HlsLadderRung {
  bitrateKbps: number;
  codec: "aac";
  sampleRate: 44100 | 48000;
  channels: 1 | 2;
}

export const DEFAULT_HLS_LADDER: HlsLadderRung[] = [
  { bitrateKbps: 320, codec: "aac", sampleRate: 44100, channels: 2 },
  { bitrateKbps: 256, codec: "aac", sampleRate: 44100, channels: 2 },
  { bitrateKbps: 128, codec: "aac", sampleRate: 44100, channels: 2 },
  { bitrateKbps: 64, codec: "aac", sampleRate: 44100, channels: 1 },
];

export interface LoudnessAnalysis {
  integratedLufs: number;
  truePeakDb: number;
  loudnessRangeLu: number;
  replayGainDb: number;
}

export interface AudioMetadata {
  durationMs: number;
  sampleRate: number;
  channels: number;
  codec: string;
  bitDepth?: number;
}

export interface TranscodeResult {
  hlsManifestKey: string;
  flacKey: string | null;
  waveformKey: string;
  loudness: LoudnessAnalysis;
  metadata: AudioMetadata;
}

export interface TranscodeInput {
  /** Local path or s3:// URL. The worker downloads s3:// inputs first. */
  source: string;
  /** Object-storage key prefix to write outputs under (no trailing slash). */
  outputPrefix: string;
  ladder?: HlsLadderRung[];
  enableFlac?: boolean;
  enableBinaural?: boolean;
  targetLufs?: number;
}

/**
 * Top-level API. Implementation lives in worker (this package documents
 * the contract; worker can shell out to ffmpeg directly).
 *
 * Stub here so the type-checker is happy at the api boundary.
 */
export async function transcode(_input: TranscodeInput): Promise<TranscodeResult> {
  throw new Error(
    "transcode() is implemented in apps/worker; do not call from api directly",
  );
}

export function buildFfmpegHlsArgs(input: string, outDir: string, ladder: HlsLadderRung[]): string[] {
  const args = ["-y", "-i", input];
  ladder.forEach((rung, i) => {
    args.push(
      "-map", "0:a",
      `-c:a:${i}`, "aac",
      `-b:a:${i}`, `${rung.bitrateKbps}k`,
      `-ac:${i}`, String(rung.channels),
      `-ar:${i}`, String(rung.sampleRate),
    );
  });
  args.push(
    "-f", "hls",
    "-hls_time", "6",
    "-hls_playlist_type", "vod",
    "-hls_segment_filename", `${outDir}/v%v/seg_%05d.aac`,
    "-master_pl_name", "master.m3u8",
    "-var_stream_map", ladder.map((_, i) => `a:${i}`).join(" "),
    `${outDir}/v%v/stream.m3u8`,
  );
  return args;
}

export function buildEbuR128Args(input: string): string[] {
  return [
    "-i", input,
    "-af", "ebur128=peak=true:framelog=verbose",
    "-f", "null", "-",
  ];
}
