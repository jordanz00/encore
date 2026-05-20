export const dynamic = "force-dynamic";

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<JSX.Element> {
  const { id } = await params;
  return (
    <div className="encore-page max-w-prose-wide">
      <header className="encore-page-header">
        <h1 className="encore-page-title">Playlist</h1>
        <p className="text-sm text-ink-dim dark:text-[#888894] font-mono">id: {id}</p>
      </header>
      <p className="text-base text-ink-muted dark:text-[#c0c0ca] leading-relaxed m-0">
        Playlist rendering scaffold. Wire to <code>GET /playlists/:id</code>.
      </p>
    </div>
  );
}
