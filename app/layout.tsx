import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Xtreme Scraper — Level 5 Intelligence Search",
  description: "Find any business. Any industry. Any city. US & Canada.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
          body { background: #fff; color: #111; }
          a { color: inherit; text-decoration: none; }
          button { cursor: pointer; font-family: inherit; }
          input, select { font-family: inherit; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
