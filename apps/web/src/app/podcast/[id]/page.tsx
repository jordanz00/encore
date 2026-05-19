export const dynamic = "force-dynamic";

export default async function PodcastPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<JSX.Element> {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Podcast</h1>
      <p className="text-ink-muted text-sm">feed id: {id}</p>
      <p>
        Podcast detail page scaffold. Wire to backend podcast endpoints once
        the RSS poller has indexed episodes.
      </p>
    </div>
  );
}
