export const dynamic = "force-dynamic";

export default async function PodcastPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<JSX.Element> {
  const { id } = await params;
  return (
    <div className="encore-page max-w-prose-wide">
      <header className="encore-page-header">
        <h1 className="encore-page-title">Podcast</h1>
        <p className="text-sm text-ink-dim dark:text-[#888894] font-mono">feed id: {id}</p>
      </header>
      <p className="text-base text-ink-muted dark:text-[#c0c0ca] leading-relaxed m-0">
        Podcast detail scaffold. Wire to backend once RSS poller has indexed episodes.
      </p>
    </div>
  );
}
