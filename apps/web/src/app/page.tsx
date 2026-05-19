import Link from "next/link";

export default function HomePage(): JSX.Element {
  return (
    <div className="space-y-16">
      <section className="py-12">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-3xl">
          Music, free and open. Built for the people who make it.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-ink-muted">
          Encore is an open-source music platform — a real alternative to
          Spotify and Apple Music. Artists keep their rights, their fans, and
          their pay. Listeners get a clean, fast, ad-respecting place to find
          new music. Self-host it. Federate it. Fork it.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/discover"
            className="rounded-full bg-ink text-paper px-5 py-2 dark:bg-paper dark:text-ink"
          >
            Start listening
          </Link>
          <Link
            href="/upload"
            className="rounded-full border border-black/10 dark:border-white/10 px-5 py-2"
          >
            Upload your music
          </Link>
          <a
            href="https://github.com/encore/encore"
            className="rounded-full border border-black/10 dark:border-white/10 px-5 py-2"
          >
            View source (AGPL-3.0)
          </a>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <Card title="Real artist economics">
          0% platform fee on direct sales. User-centric subscription payouts —
          your $10/month goes to the artists you actually listened to, not
          a pool that pays megastars.
        </Card>
        <Card title="No surveillance">
          Detailed listening data is off by default. No third-party trackers,
          no behavioral ad profiles. Privacy-first contextual ads only.
        </Card>
        <Card title="Federated, forever">
          ActivityPub support means Encore can talk to Mastodon and
          Funkwhale. AGPL-3.0 means no one can fork it into a closed-source
          rental product.
        </Card>
      </section>

      <section className="rounded-2xl bg-paper-soft dark:bg-white/5 p-8">
        <h2 className="text-2xl font-bold">Hear something new</h2>
        <p className="mt-2 text-ink-muted">
          Editorial picks, fresh-today releases, and deep cuts from the
          Encore community.
        </p>
        <Link
          href="/discover"
          className="mt-4 inline-block rounded-full bg-ink text-paper px-5 py-2 dark:bg-paper dark:text-ink"
        >
          Open Discover
        </Link>
      </section>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="rounded-2xl border border-black/5 dark:border-white/10 p-6">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-sm text-ink-muted">{children}</p>
    </div>
  );
}
