import Link from "next/link";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function DiscoverPage(): Promise<JSX.Element> {
  let releases: Awaited<ReturnType<typeof api.discover>>["releases"] = [];
  try {
    const r = await api.discover();
    releases = r.releases;
  } catch {
    releases = [];
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Discover</h1>
        <p className="text-ink-muted mt-1">
          Chronological + editorial picks. No payola, no algorithmic playlist
          replacement.
        </p>
      </header>

      {releases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-8 text-center text-ink-muted">
          No releases yet. The API may not be running. Try{" "}
          <code>pnpm dev</code> from the repo root.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {releases.map((r) => (
            <Link
              key={r.id}
              href={`/release/${r.id}`}
              className="group block"
            >
              <div className="aspect-square rounded-xl bg-paper-soft dark:bg-white/5 mb-3 overflow-hidden" />
              <div className="font-medium group-hover:underline truncate">
                {r.title}
              </div>
              <div className="text-sm text-ink-muted">{r.type}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
