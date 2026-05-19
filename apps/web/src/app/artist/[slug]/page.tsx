import { api } from "@/lib/api";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArtistPage({ params }: PageProps): Promise<JSX.Element> {
  const { slug } = await params;
  let artist;
  try {
    const r = await api.artist(slug);
    artist = r.artist;
  } catch {
    notFound();
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-6">
        <div className="size-32 rounded-full bg-paper-soft dark:bg-white/5" />
        <div>
          <h1 className="text-3xl font-bold">{artist!.name}</h1>
          <p className="text-ink-muted text-sm">@{artist!.slug}</p>
        </div>
      </header>
      {artist!.bio && (
        <section className="max-w-2xl">
          <h2 className="font-semibold mb-2">About</h2>
          <p className="text-ink-muted whitespace-pre-wrap">{artist!.bio}</p>
        </section>
      )}
      <section>
        <h2 className="font-semibold mb-4">Releases</h2>
        <div className="text-ink-muted text-sm">
          (Coming soon — releases by primaryArtistId.)
        </div>
      </section>
    </div>
  );
}
