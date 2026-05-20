"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Artist } from "@/lib/api";
import { apiClient } from "@/lib/api";
import { putFileWithProgress } from "@/lib/upload";

type Step = "profile" | "upload" | "done";

export default function UploadPage(): JSX.Element {
  const [step, setStep] = useState<Step>("profile");
  const [loading, setLoading] = useState(true);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [status, setStatus] = useState("");
  const [statusIsError, setStatusIsError] = useState(false);
  const [authOk, setAuthOk] = useState(false);

  const [artistName, setArtistName] = useState("");
  const [artistSlug, setArtistSlug] = useState("");
  const [releaseTitle, setReleaseTitle] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [publishNow, setPublishNow] = useState(true);
  const [releaseId, setReleaseId] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { user } = await apiClient.me();
      setAuthOk(true);
      const { artist: a } = await apiClient.myArtist();
      setArtist(a);
      if (a) {
        setStep("upload");
      } else {
        setArtistSlug(user.handle.replace(/[^a-z0-9_-]/g, "").slice(0, 32) || "artist");
        setArtistName(user.handle);
        setStep("profile");
      }
    } catch {
      setAuthOk(false);
      setStatus("Sign in to upload music.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function onCreateArtist(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setStatusIsError(false);
    setStatus("Creating artist profile…");
    try {
      const { artist: a } = await apiClient.createArtist({
        slug: artistSlug.trim().toLowerCase(),
        name: artistName.trim(),
      });
      setArtist(a);
      setStep("upload");
      setStatus("");
    } catch {
      setStatusIsError(true);
      setStatus("Could not create profile — slug may be taken.");
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file || !artist) return;

    const relTitle = releaseTitle.trim() || trackTitle.trim() || "Untitled";
    const trkTitle = trackTitle.trim() || file.name.replace(/\.[^.]+$/, "");

    setStatusIsError(false);
    setStatus("Creating release…");
    try {
      const { release } = await apiClient.createRelease({
        artistId: artist.id,
        title: relTitle,
        type: "single",
        priceFloorCents: 971,
      });
      setReleaseId(release.id);

      setStatus("Preparing upload…");
      const { url, key } = await apiClient.presignUpload({
        kind: "audio_master",
        contentType: file.type || "audio/wav",
        sizeBytes: file.size,
      });

      const { track } = await apiClient.createTrack({
        releaseId: release.id,
        title: trkTitle,
        masterKey: key,
      });

      setStatus("Uploading audio…");
      setUploadPct(0);
      const contentType = file.type || "audio/wav";
      const putStatus = await putFileWithProgress(url, file, contentType, setUploadPct);
      setUploadPct(100);
      if (putStatus < 200 || putStatus >= 300) {
        setStatusIsError(true);
        setStatus(`Upload failed (${putStatus}).`);
        return;
      }

      setStatus("Queuing transcode…");
      await apiClient.finalizeUpload({ key, trackId: track.id });

      if (publishNow) {
        setStatus("Publishing…");
        await apiClient.publishRelease(release.id);
      }

      setStep("done");
      setStatus(
        publishNow
          ? "Published. Transcoding may take a few minutes before playback works."
          : "Saved as draft. Publish from your release when ready.",
      );
    } catch (err) {
      setStatusIsError(true);
      setStatus(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  if (loading) {
    return (
      <div className="encore-page max-w-prose-wide">
        <p className="text-ink-muted dark:text-[#a8a8b4]" role="status">
          Loading…
        </p>
      </div>
    );
  }

  if (!authOk) {
    return (
      <div className="encore-page max-w-prose-wide">
        <header className="encore-page-header">
          <h1 className="encore-page-title">Upload music</h1>
          <p className="encore-page-lead">{status}</p>
        </header>
        <Link href="/login" className="encore-btn-primary inline-flex">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="encore-page max-w-prose-wide">
      <header className="encore-page-header">
        <h1 className="encore-page-title">Upload music</h1>
        <p className="encore-page-lead">
          One flow: release → track → transcode → optional publish.{" "}
          <strong>0% Encore fee</strong> on direct sales and tips.
        </p>
      </header>

      {step === "profile" && (
        <form onSubmit={onCreateArtist} className="encore-card space-y-5">
          <h2 className="font-display text-xl font-semibold m-0">Artist profile</h2>
          <p className="text-sm text-ink-muted dark:text-[#a8a8b4] m-0">
            Create your public artist page before uploading.
          </p>
          <label className="block">
            Artist name
            <input
              required
              className="encore-input"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
            />
          </label>
          <label className="block">
            URL slug
            <input
              required
              pattern="[a-z0-9_-]+"
              className="encore-input font-mono text-sm"
              value={artistSlug}
              onChange={(e) => setArtistSlug(e.target.value)}
              aria-describedby="slug-hint"
            />
            <span id="slug-hint" className="text-xs text-ink-muted dark:text-[#a8a8b4]">
              encore.audio/artist/{artistSlug || "…"}
            </span>
          </label>
          <button type="submit" className="encore-btn-primary">
            Continue
          </button>
        </form>
      )}

      {step === "upload" && artist && (
        <div className="encore-card space-y-5">
          <p className="text-sm text-ink-muted dark:text-[#a8a8b4] m-0">
            Uploading as <strong>{artist.name}</strong>
          </p>
          <label className="block">
            Release title
            <input
              className="encore-input"
              value={releaseTitle}
              onChange={(e) => setReleaseTitle(e.target.value)}
              placeholder="Single or album name"
            />
          </label>
          <label className="block">
            Track title
            <input
              required
              className="encore-input"
              value={trackTitle}
              onChange={(e) => setTrackTitle(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-3 min-h-11 cursor-pointer">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
              className="w-5 h-5"
            />
            <span className="text-sm">Publish when upload completes</span>
          </label>
          <label className="block">
            Audio file (WAV, FLAC, MP3…)
            <input
              type="file"
              required
              accept="audio/wav,audio/x-wav,audio/flac,audio/x-flac,audio/mpeg,audio/aac,audio/ogg,audio/opus"
              className="mt-2 block w-full text-sm min-h-11"
              onChange={onUpload}
            />
          </label>
          {uploadPct != null && uploadPct < 100 && (
            <div
              role="progressbar"
              aria-label="Upload progress"
              aria-valuenow={uploadPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-2 rounded-full bg-paper-soft dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-accent transition-[width] duration-150"
                  style={{ width: `${uploadPct}%` }}
                />
              </div>
              <p className="text-xs text-ink-muted dark:text-[#a8a8b4] mt-1 m-0">{uploadPct}% uploaded</p>
            </div>
          )}
        </div>
      )}

      {step === "done" && releaseId && (
        <div className="encore-card space-y-4">
          <h2 className="font-display text-xl font-semibold m-0">Uploaded</h2>
          <p className="text-sm text-ink-muted dark:text-[#a8a8b4] m-0" role="status">
            {status}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/release/${releaseId}`} className="encore-btn-primary">
              View release
            </Link>
            <button
              type="button"
              className="encore-btn-secondary"
              onClick={() => {
                setStep("upload");
                setReleaseId(null);
                setStatus("");
                setReleaseTitle("");
                setTrackTitle("");
              }}
            >
              Upload another
            </button>
          </div>
        </div>
      )}

      {step !== "done" && status && (
        <p
          className={`text-sm leading-relaxed mt-4 ${
            statusIsError
              ? "text-accent dark:text-red-300"
              : "text-ink-muted dark:text-[#a8a8b4]"
          }`}
          role={statusIsError ? "alert" : "status"}
          aria-live={statusIsError ? "assertive" : "polite"}
        >
          {status}
        </p>
      )}
    </div>
  );
}
