"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function UploadPage(): JSX.Element {
  const [status, setStatus] = useState<string>("idle");
  const [trackTitle, setTrackTitle] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("requesting presign...");
    const presign = await fetch(`${API_URL}/uploads/presign`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "audio_master",
        contentType: file.type || "audio/wav",
        sizeBytes: file.size,
      }),
    });
    if (!presign.ok) {
      setStatus(`presign failed (${presign.status})`);
      return;
    }
    const { url, key } = (await presign.json()) as { url: string; key: string };

    setStatus("uploading bytes...");
    const put = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": file.type || "audio/wav" },
      body: file,
    });
    if (!put.ok) {
      setStatus(`upload failed (${put.status})`);
      return;
    }

    setStatus("finalising...");
    const fin = await fetch(`${API_URL}/uploads/finalize`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    setStatus(fin.ok ? "queued for transcoding" : `finalize failed (${fin.status})`);
  }

  return (
    <div className="space-y-6 max-w-xl">
      <header>
        <h1 className="text-3xl font-bold">Upload music</h1>
        <p className="text-ink-muted">
          Drop a WAV or FLAC. We&apos;ll transcode to HLS for streaming and
          keep your master for the HiFi tier.
        </p>
      </header>

      <div className="space-y-3">
        <label className="block text-sm">
          Track title
          <input
            className="mt-1 w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent p-2"
            value={trackTitle}
            onChange={(e) => setTrackTitle(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Audio file
          <input
            type="file"
            accept="audio/wav,audio/x-wav,audio/flac,audio/x-flac,audio/mpeg,audio/aac,audio/ogg,audio/opus"
            className="mt-1 block"
            onChange={onFile}
          />
        </label>
      </div>

      <p className="text-sm text-ink-muted">Status: {status}</p>
    </div>
  );
}
