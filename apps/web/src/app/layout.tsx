import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Encore — open-source music for everyone",
  description:
    "Encore is a free, open-source music platform built for artists. Upload, share, sell, and stream — without surveillance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-black/5 dark:border-white/10">
          <nav
            className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between"
            aria-label="Primary"
          >
            <Link href="/" className="font-bold text-lg tracking-tight">
              Encore
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/discover" className="hover:underline">Discover</Link>
              <Link href="/editorial" className="hover:underline">Editorial</Link>
              <Link href="/search" className="hover:underline">Search</Link>
              <Link href="/library" className="hover:underline">Library</Link>
              <Link href="/upload" className="hover:underline">Upload</Link>
              <Link
                href="/login"
                className="rounded-full bg-ink text-paper px-3 py-1 dark:bg-paper dark:text-ink"
              >
                Sign in
              </Link>
            </div>
          </nav>
        </header>

        <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">{children}</main>

        <footer className="border-t border-black/5 dark:border-white/10 mt-12">
          <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-ink-muted flex flex-wrap gap-4 justify-between">
            <div>Encore. AGPL-3.0. Built for artists, not algorithms.</div>
            <div className="flex gap-4">
              <Link href="/about">About</Link>
              <Link href="/governance">Governance</Link>
              <Link href="/privacy">Privacy</Link>
              <a href="https://github.com/encore/encore">Source</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
