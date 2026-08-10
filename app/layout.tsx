import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XTREME SCRAPER | Floors for Life",
  description: "The fastest, most accurate way to find and connect with local flooring businesses.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#FFBE00" />
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen bg-white font-sans">{children}</body>
    </html>
  );
}
