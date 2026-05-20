export default function AboutPage(): JSX.Element {
  return (
    <article className="encore-page max-w-prose">
      <header className="encore-page-header">
        <h1 className="encore-page-title">About Encore</h1>
      </header>
      <div className="encore-prose space-y-4 text-ink-muted dark:text-[#c0c0ca]">
        <p className="m-0">
          Encore is a free, open-source music platform for artists and listeners.
          It is licensed under AGPL-3.0 — anyone can run, modify, and host it,
          and modified network versions must share source.
        </p>
        <p className="m-0">
          The project is moving toward foundation stewardship. Governance and
          economics docs live in the public GitHub repository.
        </p>
      </div>
    </article>
  );
}
