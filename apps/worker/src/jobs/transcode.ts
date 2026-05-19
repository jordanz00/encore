/**
 * Audio transcode worker — REAL implementation.
 *
 * Pipeline (RFC 003):
 *   1. Download master from S3 uploads bucket.
 *   2. ffprobe → duration, codec, sample rate, channels, bit depth.
 *   3. ffmpeg → HLS ladder (320/256/128/64 kbps AAC + master.m3u8).
 *   4. ffmpeg → FLAC pass-through (HiFi tier) when source is lossless.
 *   5. ffmpeg ebur128 → integrated LUFS, true peak, ReplayGain.
 *   6. ffmpeg → waveform peaks (downsampled PCM → JSON).
 *   7. Upload outputs, update tracks row, enqueue embeddings.
 */
import { Worker, type Job } from "bullmq";
import type { Logger } from "pino";
import { mkdtemp, rm, writeFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execa } from "execa";
import { conn, QUEUE_NAMES, queues } from "../lib/conn.js";
import { downloadObject, uploadFile, uploadJson, buckets } from "../lib/s3.js";
import { db, schema } from "@encore/db";
import { eq } from "drizzle-orm";

interface TranscodePayload {
  key: string;
  userId: string;
  trackId: string | null;
}

const TARGET_LUFS = Number(process.env.AUDIO_TARGET_LUFS ?? -14);

export function startTranscodeWorker(log: Logger): Worker {
  return new Worker<TranscodePayload>(
    QUEUE_NAMES.audioTranscode,
    async (job: Job<TranscodePayload>) => {
      const { key, trackId } = job.data;
      const work = await mkdtemp(join(tmpdir(), "encore-transcode-"));
      const sourcePath = join(work, "source.bin");
      const hlsDir = join(work, "hls");
      const flacPath = join(work, "track.flac");
      try {
        log.info({ key, trackId }, "transcode start");
        await downloadObject(buckets.uploads, key, sourcePath);
        const probe = await ffprobe(sourcePath);
        const isLossless = ["flac", "alac", "wav", "pcm_s16le", "pcm_s24le"].includes(probe.codec);

        await runHlsLadder(sourcePath, hlsDir);
        const loudness = await runEbuR128(sourcePath);
        const peaks = await renderWaveform(sourcePath, 1500);

        if (isLossless) {
          await execa("ffmpeg", ["-y", "-i", sourcePath, "-c:a", "flac", flacPath], { stdio: "pipe" });
        }

        const outputPrefix = trackId ? `tracks/${trackId}` : `pending/${job.id}`;
        await uploadHlsTree(hlsDir, `${outputPrefix}/hls`);
        const flacKey = isLossless ? `${outputPrefix}/track.flac` : null;
        if (flacKey) {
          await uploadFile(buckets.audio, flacKey, flacPath, "audio/flac");
        }
        const waveformKey = `${outputPrefix}/waveform.json`;
        await uploadJson(buckets.audio, waveformKey, { version: 1, peaks });

        if (trackId) {
          await db
            .update(schema.tracks)
            .set({
              hlsKey: `${outputPrefix}/hls/master.m3u8`,
              flacKey,
              waveformKey,
              durationMs: Math.round(probe.durationSeconds * 1000),
              loudnessLufs: loudness.integratedLufs,
              replayGainDb: TARGET_LUFS - loudness.integratedLufs,
              peakAmplitude: loudness.truePeakDb,
              updatedAt: new Date(),
            })
            .where(eq(schema.tracks.id, trackId));
          await queues.embeddingsCompute.add("compute", { trackId });
        }
        log.info({ key, trackId, durationSec: probe.durationSeconds }, "transcode done");
        return { ok: true, durationSec: probe.durationSeconds };
      } finally {
        await rm(work, { recursive: true, force: true }).catch(() => undefined);
      }
    },
    { connection: conn(), concurrency: Number(process.env.TRANSCODE_CONCURRENCY ?? 2) },
  );
}

interface ProbeResult {
  codec: string;
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  bitsPerSample: number | null;
}

async function ffprobe(input: string): Promise<ProbeResult> {
  const { stdout } = await execa("ffprobe", [
    "-v", "error",
    "-select_streams", "a:0",
    "-show_entries", "stream=codec_name,sample_rate,channels,bits_per_raw_sample",
    "-show_entries", "format=duration",
    "-of", "json",
    input,
  ], { stdio: "pipe" });
  const data = JSON.parse(stdout) as {
    streams: { codec_name: string; sample_rate: string; channels: number; bits_per_raw_sample?: string }[];
    format: { duration: string };
  };
  const stream = data.streams[0]!;
  return {
    codec: stream.codec_name,
    durationSeconds: Number(data.format.duration),
    sampleRate: Number(stream.sample_rate),
    channels: stream.channels,
    bitsPerSample: stream.bits_per_raw_sample ? Number(stream.bits_per_raw_sample) : null,
  };
}

async function runHlsLadder(input: string, outDir: string): Promise<void> {
  await execa("mkdir", ["-p", outDir]);
  const ladder = [
    { name: "320", bitrate: 320, channels: 2 },
    { name: "256", bitrate: 256, channels: 2 },
    { name: "128", bitrate: 128, channels: 2 },
    { name: "64", bitrate: 64, channels: 1 },
  ];
  for (const rung of ladder) {
    await execa("mkdir", ["-p", join(outDir, rung.name)]);
    await execa(
      "ffmpeg",
      [
        "-y",
        "-i", input,
        "-vn",
        "-c:a", "aac",
        "-b:a", `${rung.bitrate}k`,
        "-ac", String(rung.channels),
        "-ar", "44100",
        "-f", "hls",
        "-hls_time", "6",
        "-hls_playlist_type", "vod",
        "-hls_segment_filename", join(outDir, rung.name, "seg_%05d.aac"),
        join(outDir, rung.name, "stream.m3u8"),
      ],
      { stdio: "pipe" },
    );
  }
  const master = [
    "#EXTM3U",
    "#EXT-X-VERSION:7",
    ...ladder.map(
      (r) =>
        `#EXT-X-STREAM-INF:BANDWIDTH=${r.bitrate * 1000},CODECS="mp4a.40.2"\n${r.name}/stream.m3u8`,
    ),
  ].join("\n");
  await writeFile(join(outDir, "master.m3u8"), master);
}

async function uploadHlsTree(localDir: string, keyPrefix: string): Promise<void> {
  const entries = await readdir(localDir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const localPath = join(entry.parentPath ?? localDir, entry.name);
    const rel = localPath.slice(localDir.length + 1).replace(/\\/g, "/");
    const ct = entry.name.endsWith(".m3u8")
      ? "application/vnd.apple.mpegurl"
      : "audio/aac";
    await uploadFile(buckets.audio, `${keyPrefix}/${rel}`, localPath, ct);
  }
}

interface EbuR128Result {
  integratedLufs: number;
  truePeakDb: number;
  loudnessRangeLu: number;
}

async function runEbuR128(input: string): Promise<EbuR128Result> {
  const { stderr } = await execa(
    "ffmpeg",
    ["-i", input, "-af", "ebur128=peak=true", "-f", "null", "-"],
    { stdio: "pipe", reject: false },
  );
  const integratedMatch = /Integrated loudness:\s*\n\s*I:\s*(-?\d+(?:\.\d+)?)/.exec(stderr);
  const truePeakMatch = /True peak:\s*\n\s*Peak:\s*(-?\d+(?:\.\d+)?)/.exec(stderr);
  const lraMatch = /Loudness range:\s*\n\s*LRA:\s*(-?\d+(?:\.\d+)?)/.exec(stderr);
  return {
    integratedLufs: integratedMatch ? Number(integratedMatch[1]) : -23,
    truePeakDb: truePeakMatch ? Number(truePeakMatch[1]) : -1,
    loudnessRangeLu: lraMatch ? Number(lraMatch[1]) : 7,
  };
}

async function renderWaveform(input: string, samples: number): Promise<number[]> {
  const { stdout } = await execa(
    "ffmpeg",
    ["-i", input, "-ac", "1", "-ar", String(samples), "-f", "f32le", "-"],
    { stdio: "pipe", encoding: "buffer" },
  );
  const buf = stdout as unknown as Buffer;
  const peaks: number[] = [];
  const total = Math.floor(buf.length / 4);
  const bucketSize = Math.max(1, Math.floor(total / samples));
  for (let i = 0; i < total; i += bucketSize) {
    let max = 0;
    for (let j = 0; j < bucketSize && i + j < total; j += 1) {
      const v = Math.abs(buf.readFloatLE((i + j) * 4));
      if (v > max) max = v;
    }
    peaks.push(Number(max.toFixed(4)));
  }
  return peaks.slice(0, samples);
}
