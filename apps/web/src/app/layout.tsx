import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Newsreader, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Encore — open-source music for everyone",
  description:
    "Encore is a free, open-source music platform built for artists. Upload, share, sell, and stream — without surveillance.",
};

const navItems = [
  { href: "/discover", label: "Discover" },
  { href: "/library", label: "Library" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/search", label: "Search" },
  { href: "/upload", label: "Upload" },
  { href: "/system", label: "System" },
] as const;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${newsreader.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <header className="sticky top-0 z-50 border-b border-black/[0.06] dark:border-white/10 bg-paper/90 dark:bg-[#0b0b0e]/90 backdrop-blur-md">
          <nav
            className="encore-container py-3 flex items-center justify-between gap-6"
            aria-label="Primary"
          >
            <Link
              href="/"
              className="font-display text-xl font-semibold tracking-tight text-ink dark:text-[#faf6ec] min-h-11 inline-flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Encore
            </Link>
            <ul className="flex flex-wrap items-center gap-x-1 gap-y-2 list-none m-0 p-0">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="encore-nav-link">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/login" className="encore-btn-primary text-sm py-2 px-4">
                  Sign in
                </Link>
              </li>
            </ul>
          </nav>
        </header>

        <main
          id="main-content"
          className="flex-1 encore-container py-10 sm:py-12"
          tabIndex={-1}
        >
          {children}
        </main>

        <footer className="border-t border-black/[0.06] dark:border-white/10 mt-16">
          <div className="encore-container py-8 flex flex-wrap gap-6 justify-between text-sm text-ink-muted dark:text-[#c0c0ca] leading-relaxed">
            <p className="max-w-prose m-0">
              Encore. AGPL-3.0. Built for artists, not algorithms.
            </p>
            <nav aria-label="Footer">
              <ul className="flex flex-wrap gap-5 list-none m-0 p-0">
                <li>
                  <Link href="/about" className="encore-nav-link">
                    About
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/jordanz00/encore"
                    className="encore-nav-link"
                    rel="noopener noreferrer"
                  >
                    Source
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
