import Link from "next/link";
import { api } from "@/lib/api";
import CoverArt from "@/components/CoverArt";

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
    <div className="encore-page">
      <header className="encore-page-header">
        <h1 className="encore-page-title">Discover</h1>
        <p className="encore-page-lead">
          Chronological and editorial picks. No payola, no paid ranking.
        </p>
      </header>

      {releases.length === 0 ? (
        <div className="encore-muted-panel">
          No releases yet. The API may not be running. Try{" "}
          <code>pnpm dev</code> from the repo root.
        </div>
      ) : (
        <ul
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 list-none p-0 m-0"
          role="list"
          aria-label="Discover releases"
        >
          {releases.map((r) => (
            <li key={r.id}>
            <Link
              href={`/release/${r.id}`}
              className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              aria-label={`${r.title}, ${r.type}`}
            >
              <CoverArt
                coverArtKey={r.coverArtKey}
                title={r.title}
                size="md"
                className="mb-3"
              />
              <div className="font-medium text-base leading-snug group-hover:underline truncate text-ink dark:text-[#faf6ec]">
                {r.title}
              </div>
              <div className="text-sm text-ink-muted dark:text-[#a8a8b4] mt-0.5 capitalize">
                {r.type}
              </div>
            </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
