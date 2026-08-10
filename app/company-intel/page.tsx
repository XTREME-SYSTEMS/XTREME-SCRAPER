"use client";

import { useState, useRef, useEffect } from "react";
import Navbar from "@/app/components/Navbar";
import Link from "next/link";

interface CompanyIntel {
  companyName: string;
  tagline?: string;
  services?: string[];
  highlights?: string[];
  targetAudience?: string;
  tone?: string;
  highlight?: string;
  url: string;
}

export default function CompanyIntelPage() {
  const urlRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CompanyIntel | null>(null);
  const [saved, setSaved] = useState<CompanyIntel[]>([]);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    try {
      const s = localStorage.getItem("xts_company_intel_list");
      if (s) setSaved(JSON.parse(s));
    } catch {}
  }, []);

  const handleScrape = async () => {
    const url = urlRef.current?.value?.trim();
    if (!url) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/scrape-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.ok && data.intel) {
        setResult(data.intel);
      } else {
        setError(data.error || "Failed to scrape. Make sure the URL is correct and publicly accessible.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIntel = () => {
    if (!result) return;
    const updated = [result, ...saved.filter((s) => s.url !== result.url)];
    localStorage.setItem("xts_company_intel_list", JSON.stringify(updated));
    setSaved(updated);
    setSavedMsg("Profile saved!");
    setTimeout(() => setSavedMsg(""), 2500);
  };

  const handleUseInOutreach = () => {
    if (!result) return;
    localStorage.setItem("xts_company_intel", JSON.stringify(result));
    window.location.href = "/outreach";
  };

  const handleDeleteSaved = (url: string) => {
    const updated = saved.filter((s) => s.url !== url);
    localStorage.setItem("xts_company_intel_list", JSON.stringify(updated));
    setSaved(updated);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "Inter, system-ui, sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111", margin: 0 }}>Company Intelligence Hub</h1>
          <p style={{ color: "#666", marginTop: 8, fontSize: 15 }}>
            Paste any company URL. We scrape their site, extract key insights, and use that data to craft highly personalized outreach emails.
          </p>
        </div>

        {/* URL input */}
        <div style={{ background: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: 12, padding: 24, marginBottom: 32 }}>
          <label style={{ fontWeight: 600, fontSize: 14, color: "#333", display: "block", marginBottom: 10 }}>Company Website URL</label>
          <div style={{ display: "flex", gap: 12 }}>
            <input
              ref={urlRef}
              type="url"
              placeholder="https://example.com"
              defaultValue=""
              style={{ flex: 1, padding: "12px 16px", border: "1px solid #ddd", borderRadius: 8, fontSize: 15, outline: "none" }}
              onKeyDown={(e) => e.key === "Enter" && handleScrape()}
            />
            <button
              onClick={handleScrape}
              disabled={loading}
              style={{ padding: "12px 24px", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, whiteSpace: "nowrap" }}
            >
              {loading ? "Analyzing..." : "Scrape & Analyze"}
            </button>
          </div>
          {error && <p style={{ color: "#dc2626", marginTop: 10, fontSize: 14 }}>{error}</p>}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <p style={{ fontWeight: 600 }}>Scraping and analyzing company data...</p>
            <p style={{ fontSize: 14, color: "#999" }}>This usually takes 5–10 seconds</p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, overflow: "hidden", marginBottom: 40 }}>
            <div style={{ background: "#111", color: "#fff", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{result.companyName}</div>
                <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>{result.url}</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={handleSaveIntel} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  {savedMsg || "Save Profile"}
                </button>
                <button onClick={handleUseInOutreach} style={{ padding: "8px 16px", background: "#fff", color: "#111", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  Use in Outreach →
                </button>
              </div>
            </div>
            <div style={{ padding: 24 }}>
              {result.tagline && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Tagline / Mission</div>
                  <p style={{ color: "#333", fontSize: 15, fontStyle: "italic", margin: 0 }}>"{result.tagline}"</p>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                {result.services && result.services.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Services</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {result.services.map((s, i) => (
                        <span key={i} style={{ background: "#f0f0f0", padding: "4px 10px", borderRadius: 20, fontSize: 13, color: "#333" }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Profile</div>
                  <div style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>
                    <div><strong>Audience:</strong> {result.targetAudience || "General"}</div>
                    <div><strong>Tone:</strong> {result.tone || "Professional"}</div>
                  </div>
                </div>
              </div>
              {result.highlights && result.highlights.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Key Highlights</div>
                  <ul style={{ margin: 0, padding: "0 0 0 20px", color: "#333", fontSize: 14, lineHeight: 2 }}>
                    {result.highlights.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </div>
              )}
              {result.highlight && (
                <div style={{ marginTop: 20, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#166534", marginBottom: 4 }}>Outreach Hook (used in emails)</div>
                  <p style={{ margin: 0, fontSize: 14, color: "#15803d" }}>{result.highlight}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Saved profiles */}
        {saved.length > 0 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 16 }}>Saved Company Profiles</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {saved.map((s, i) => (
                <div key={i} style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#111", fontSize: 15 }}>{s.companyName}</div>
                    <div style={{ fontSize: 13, color: "#999", marginTop: 2 }}>{s.url}</div>
                    {s.tagline && <div style={{ fontSize: 13, color: "#666", marginTop: 4, fontStyle: "italic" }}>{s.tagline.substring(0, 80)}...</div>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { localStorage.setItem("xts_company_intel", JSON.stringify(s)); window.location.href = "/outreach"; }}
                      style={{ padding: "7px 14px", background: "#111", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      Use in Outreach
                    </button>
                    <button onClick={() => handleDeleteSaved(s.url)}
                      style={{ padding: "7px 14px", background: "#fff", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {saved.length === 0 && !result && !loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#bbb" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔗</div>
            <p style={{ fontWeight: 600, color: "#999" }}>No company profiles yet</p>
            <p style={{ fontSize: 14 }}>Paste a company URL above to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
