"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const PLACEHOLDERS = [
  "Plumbers in Dallas...",
  "Roofing contractors in Denver...",
  "Wedding photographers in Austin...",
  "Epoxy flooring in Phoenix...",
  "Concrete contractors in Toronto...",
  "HVAC companies in Calgary...",
  "Accountants in Vancouver...",
  "Restaurants in Montreal...",
];

export default function Home() {
  const [ph, setPh] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPh(i => (i + 1) % PLACEHOLDERS.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#fff", color: "#111", fontFamily: "inherit" }}>
      {/* NAV */}
      <header style={{ borderBottom: "1px solid #f0f0f0", padding: "24px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: -0.5 }}>XTREME SCRAPER</span>
        <Link href="/dashboard" style={{ fontWeight: 700, fontSize: 14, color: "#FFBE00", letterSpacing: 1 }}>
          Go to Dashboard →
        </Link>
      </header>

      {/* HERO */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 48px", textAlign: "center" }}>
        <h1 style={{ fontSize: "clamp(42px,7vw,76px)", fontWeight: 900, lineHeight: 1, letterSpacing: -2, textTransform: "uppercase", marginBottom: 24 }}>
          Find Any Business.<br />Any Industry. Any City.
        </h1>
        <p style={{ fontSize: 18, color: "#555", maxWidth: 640, margin: "0 auto 48px", fontWeight: 600, lineHeight: 1.6 }}>
          Type what you&apos;re looking for — plumbers, realtors, contractors, photographers —
          and get a focused list of real businesses with phone numbers and addresses. Instantly.
        </p>

        {/* Fake search bar */}
        <div style={{ maxWidth: 600, margin: "0 auto 32px", border: "2px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 16px", height: 56 }}>
          <svg width="22" height="22" fill="none" stroke="#aaa" viewBox="0 0 24 24" style={{ marginRight: 12, flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <span style={{ color: "#555", fontSize: 18, fontWeight: 700, flex: 1, textAlign: "left", overflow: "hidden", whiteSpace: "nowrap" }}>
            {PLACEHOLDERS[ph]}
          </span>
          <span style={{ display: "inline-block", width: 6, height: 24, background: "#FFBE00", animation: "blink 1s infinite" }}/>
        </div>

        <Link href="/dashboard">
          <button style={{ background: "#FFBE00", color: "#111", fontWeight: 900, fontSize: 18, padding: "20px 48px", border: "none", letterSpacing: 0.5, boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
            SEARCH ANY INDUSTRY NOW →
          </button>
        </Link>

        <p style={{ marginTop: 20, fontSize: 12, color: "#aaa", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
          250+ results per search · Phone numbers included · 🇺🇸 US & 🇨🇦 Canada
        </p>
      </section>

      {/* SOURCES */}
      <section style={{ borderTop: "1px solid #f0f0f0", padding: "48px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#aaa", letterSpacing: 2, textTransform: "uppercase", marginBottom: 20, fontWeight: 700 }}>
          Powered by
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
          {["Google Maps", "BBB", "Apollo", "Firecrawl", "Yellow Pages", "BrowserWorker"].map(s => (
            <span key={s} style={{ padding: "8px 20px", border: "1px solid #e5e7eb", fontSize: 13, fontWeight: 700, color: "#555" }}>
              {s}
            </span>
          ))}
        </div>
      </section>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </main>
  );
}
