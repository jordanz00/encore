export const dynamic = "force-dynamic";

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<JSX.Element> {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Playlist</h1>
        <p className="text-ink-muted text-sm">id: {id}</p>
      </header>
      <p className="text-ink-muted">
        Playlist rendering scaffold. Wire to <code>GET /playlists/:id</code>.
      </p>
    </div>
  );
}
