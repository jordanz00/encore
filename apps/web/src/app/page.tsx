import Link from "next/link";

export default function HomePage(): JSX.Element {
  return (
    <div className="encore-page space-y-20">
      <section className="max-w-prose-wide">
        <h1 className="font-display text-hero font-semibold tracking-tight text-ink dark:text-[#faf6ec] max-w-4xl">
          Music, free and open. Built for the people who make it.
        </h1>
        <p className="mt-6 text-lg text-ink-muted dark:text-[#c0c0ca] leading-relaxed max-w-prose-wide">
          Encore is an open-source music platform — a real alternative to
          extractive streaming. Artists keep their rights, their fans, and their
          pay. Listeners get a calm, readable place to discover music. Self-host
          it. Federate it. Fork it.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/discover" className="encore-btn-primary">
            Start listening
          </Link>
          <Link href="/upload" className="encore-btn-secondary">
            Upload your music
          </Link>
          <a
            href="https://github.com/jordanz00/encore"
            className="encore-btn-secondary"
            rel="noopener noreferrer"
          >
            View source (AGPL-3.0)
          </a>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6 lg:gap-8">
        <Card title="Real artist economics">
          0% platform fee on direct sales. User-centric subscription payouts —
          your subscription follows the artists you actually listened to.
        </Card>
        <Card title="No surveillance">
          Detailed listening data is off by default. No third-party trackers,
          no behavioral ad profiles.
        </Card>
        <Card title="Federated, forever">
          ActivityPub support and AGPL-3.0 — interoperability without lock-in.
        </Card>
      </section>

      <section className="encore-card max-w-prose-wide">
        <h2 className="font-display text-3xl font-semibold">Hear something new</h2>
        <p className="mt-3 text-base text-ink-muted dark:text-[#c0c0ca] leading-relaxed m-0">
          Editorial picks, fresh releases, and community catalog.
        </p>
        <Link href="/discover" className="encore-btn-primary mt-6 inline-flex">
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
    <div className="encore-card h-full">
      <h3 className="font-display text-xl font-semibold text-ink dark:text-[#faf6ec]">
        {title}
      </h3>
      <p className="mt-3 text-sm text-ink-muted dark:text-[#b0b0bc] leading-relaxed m-0">
        {children}
      </p>
    </div>
  );
}
