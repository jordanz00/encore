import LibraryFollows from "@/components/LibraryFollows";

export default function LibraryPage(): JSX.Element {
  return (
    <div className="encore-page max-w-prose-wide">
      <header className="encore-page-header">
        <h1 className="encore-page-title">Your library</h1>
        <p className="encore-page-lead">
          Artists you follow on Encore. Liked tracks and offline saves ship in a later pass.
        </p>
      </header>
      <section aria-labelledby="library-follows-heading">
        <h2 id="library-follows-heading" className="font-display text-xl font-semibold mb-4">
          Following
        </h2>
        <LibraryFollows />
      </section>
    </div>
  );
}
