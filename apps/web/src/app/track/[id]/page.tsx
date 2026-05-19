import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import Player from "@/components/Player";

export const dynamic = "force-dynamic";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<JSX.Element> {
  const { id } = await params;
  let track;
  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/tracks/${id}`);
    if (!r.ok) throw new Error("not found");
    track = (await r.json()).track;
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{track!.title}</h1>
      <Player tracks={[track!]} />
    </div>
  );
}
