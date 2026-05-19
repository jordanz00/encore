export default function EditorialPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Editorial</h1>
        <p className="text-ink-muted">
          Encore Editorial is a small, transparent team. We don&apos;t take
          payola. We rotate slots. We label our picks.
        </p>
      </header>
      <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-8 text-center text-ink-muted">
        Editorial slots will appear here once the admin app populates them.
      </div>
    </div>
  );
}
