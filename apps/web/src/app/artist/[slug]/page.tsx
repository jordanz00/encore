import Link from "next/link";
import { api } from "@/lib/api";
import { notFound } from "next/navigation";
import CheckoutActions from "@/components/CheckoutActions";
import CoverArt from "@/components/CoverArt";
import FollowArtistButton from "@/components/FollowArtistButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArtistPage({ params }: PageProps): Promise<JSX.Element> {
  const { slug } = await params;
  let artist;
  let releases: Awaited<ReturnType<typeof api.artistReleases>>["releases"] = [];
  try {
    const r = await api.artist(slug);
    artist = r.artist;
    const rel = await api.artistReleases(slug);
    releases = rel.releases;
  } catch {
    notFound();
  }

  return (
    <div className="encore-page">
      <header className="flex flex-wrap items-start gap-8">
        <CoverArt
          coverArtKey={artist!.avatarKey}
          title={artist!.name}
          size="sm"
          className="!w-32 !h-32 rounded-full shrink-0"
        />
        <div className="space-y-4 min-w-0 flex-1 max-w-prose-wide">
          <div>
            <h1 className="encore-page-title">{artist!.name}</h1>
            <p className="text-sm text-ink-muted dark:text-[#a8a8b4] mt-1">@{artist!.slug}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FollowArtistButton artistId={artist!.id} artistName={artist!.name} />
            <CheckoutActions kind="tip" targetId={artist!.id} label="Tip artist" amountCents={500} />
          </div>
          <p className="text-xs text-ink-dim dark:text-[#888894] leading-relaxed m-0">
            Tips use Stripe test mode when configured. 0% Encore platform fee on tips.
          </p>
        </div>
      </header>

      {artist!.bio && (
        <section className="max-w-prose">
          <h2 className="font-display text-2xl font-semibold mb-3">About</h2>
          <p className="text-base text-ink-muted dark:text-[#c0c0ca] whitespace-pre-wrap leading-relaxed m-0">
            {artist!.bio}
          </p>
        </section>
      )}

      <section>
        <h2 className="font-display text-2xl font-semibold mb-5">Releases</h2>
        {releases.length === 0 ? (
          <p className="text-sm text-ink-muted dark:text-[#a8a8b4]">No published releases yet.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {releases.map((rel) => (
              <li key={rel.id}>
                <Link
                  href={`/release/${rel.id}`}
                  className="block rounded-xl border border-black/[0.06] dark:border-white/10 p-5 hover:bg-paper-soft dark:hover:bg-white/5 transition-colors"
                >
                  <div className="text-xs uppercase tracking-wide text-ink-dim dark:text-[#888894]">
                    {rel.type}
                  </div>
                  <div className="font-medium text-lg mt-1 text-ink dark:text-[#faf6ec]">
                    {rel.title}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
