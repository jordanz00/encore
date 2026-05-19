import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Encore Admin",
  description: "Editorial CMS for Encore curators and moderators.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <header
          style={{
            padding: "12px 24px",
            borderBottom: "1px solid #eee",
            fontWeight: 700,
          }}
        >
          Encore Admin
        </header>
        <main style={{ padding: 24 }}>{children}</main>
      </body>
    </html>
  );
}
