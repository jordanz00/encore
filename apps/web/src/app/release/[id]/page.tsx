import { api } from "@/lib/api";
import { notFound } from "next/navigation";
import CheckoutActions from "@/components/CheckoutActions";
import CoverArt from "@/components/CoverArt";
import ReleaseExperience from "@/components/ReleaseExperience";

export const dynamic = "force-dynamic";

export default async function ReleasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<JSX.Element> {
  const { id } = await params;
  let data;
  try {
    data = await api.release(id);
  } catch {
    notFound();
  }
  const { release, tracks } = data!;

  return (
    <div className="encore-page">
      <header className="grid md:grid-cols-[220px_1fr] gap-8 items-start">
        <CoverArt coverArtKey={release.coverArtKey} title={release.title} size="lg" />
        <div className="space-y-4 max-w-prose-wide">
          <div className="text-xs font-medium uppercase tracking-wide text-ink-dim dark:text-[#888894]">
            {release.type}
          </div>
          <h1 className="encore-page-title">{release.title}</h1>
          {tracks[0] && (
            <div className="space-y-2">
              <CheckoutActions
                kind="track"
                targetId={tracks[0].id}
                label="Buy album (test checkout)"
                amountCents={release.priceFloorCents ?? 999}
              />
              <p className="text-xs text-ink-dim dark:text-[#888894] m-0 leading-relaxed">
                Requires sign-in. Stripe test mode when API keys are set.
              </p>
            </div>
          )}
        </div>
      </header>

      <ReleaseExperience releaseId={release.id} tracks={tracks} />
    </div>
  );
}
