import { api } from "@/lib/api";
import { notFound } from "next/navigation";
import Player from "@/components/Player";

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
    <div className="space-y-8">
      <header className="grid md:grid-cols-[200px_1fr] gap-6">
        <div className="aspect-square rounded-xl bg-paper-soft dark:bg-white/5" />
        <div>
          <div className="text-sm uppercase tracking-wide text-ink-muted">
            {release.type}
          </div>
          <h1 className="text-3xl font-bold">{release.title}</h1>
        </div>
      </header>

      <section>
        <h2 className="font-semibold mb-4">Tracks</h2>
        <ol className="divide-y divide-black/5 dark:divide-white/10">
          {tracks.map((t, i) => (
            <li key={t.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-ink-muted w-6 text-right">{i + 1}</span>
                <span>{t.title}</span>
              </div>
              <span className="text-sm text-ink-muted">
                {Math.floor(t.durationMs / 60000)}:
                {String(Math.floor((t.durationMs % 60000) / 1000)).padStart(2, "0")}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <Player tracks={tracks} />
    </div>
  );
}
