export default function AboutPage(): JSX.Element {
  return (
    <article className="prose dark:prose-invert max-w-2xl">
      <h1>About Encore</h1>
      <p>
        Encore is a free, open-source music platform for artists and
        listeners. It is licensed under the GNU Affero General Public
        License version 3.0 (AGPL-3.0). That means anyone can run, modify,
        and host it — and any modified hosted version must publish its
        source.
      </p>
      <p>
        The project is governed by a maintainer council, with a long-term
        plan to move into a non-profit foundation. See
        {" "}<a href="/governance">/governance</a> for details.
      </p>
    </article>
  );
}
