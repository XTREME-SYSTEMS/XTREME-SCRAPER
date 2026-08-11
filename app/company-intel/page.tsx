"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";

type CompanyIntel = {
  companyName: string;
  tagline?: string;
  description?: string;
  highlights?: string[];
  services?: string[];
  targetAudience?: string;
  tone?: string;
  highlight?: string;
  url: string;
  scrapedAt?: string;
};

export default function CompanyIntelPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [error, setError] = useState("");
  const [intel, setIntel] = useState<CompanyIntel | null>(null);
  const [savedIntels, setSavedIntels] = useState<CompanyIntel[]>([]);

  // Load saved profiles from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("xts_saved_company_intels");
      if (stored) {
        setSavedIntels(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const handleScrape = async (targetUrl?: string) => {
    const inputUrl = (targetUrl || url).trim();
    if (!inputUrl) {
      setError("Please enter a valid website URL.");
      return;
    }

    setError("");
    setLoading(true);
    setIntel(null);
    setProgressMsg("Connecting to website server...");

    const progressTimer = setTimeout(() => {
      setProgressMsg("Extracting page HTML, text & meta tags...");
    }, 1200);

    const progressTimer2 = setTimeout(() => {
      setProgressMsg("Analyzing company services & value proposition with AI...");
    }, 2800);

    try {
      const res = await fetch("/api/scrape-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl }),
      });

      clearTimeout(progressTimer);
      clearTimeout(progressTimer2);

      const data = await res.json();
      if (!res.ok || !data.ok || !data.intel) {
        throw new Error(data.error || "Failed to scrape company website");
      }

      const scrapedIntel: CompanyIntel = {
        ...data.intel,
        scrapedAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };

      setIntel(scrapedIntel);

      // Save to history list in localStorage
      setSavedIntels((prev) => {
        const filtered = prev.filter(
          (p) => p.url.toLowerCase() !== scrapedIntel.url.toLowerCase()
        );
        const updated = [scrapedIntel, ...filtered];
        try {
          localStorage.setItem("xts_saved_company_intels", JSON.stringify(updated));
        } catch {}
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      clearTimeout(progressTimer);
      clearTimeout(progressTimer2);
      setLoading(false);
      setProgressMsg("");
    }
  };

  const handleUseInOutreach = (profile: CompanyIntel) => {
    try {
      localStorage.setItem("xts_company_intel", JSON.stringify(profile));
    } catch {}
    router.push("/outreach");
  };

  const handleDeleteSaved = (urlToDelete: string) => {
    const updated = savedIntels.filter((item) => item.url !== urlToDelete);
    setSavedIntels(updated);
    try {
      localStorage.setItem("xts_saved_company_intels", JSON.stringify(updated));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 lg:px-8 lg:py-12">
        {/* HEADER */}
        <div className="mb-8 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🏢</span>
            <h1 className="text-3xl font-black tracking-tight">Company Intelligence Hub</h1>
          </div>
          <p className="text-gray-500 font-medium text-sm">
            Extract company mission, key services, highlights, and tone of voice from any website to power personalized AI sales outreach.
          </p>
        </div>

        {/* SEARCH / SCRAPE FORM */}
        <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 mb-10 shadow-sm">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Company Website URL
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScrape()}
              placeholder="e.g. https://www.acmeflooring.com or stripe.com"
              className="flex-1 rounded-xl border-2 border-gray-300 px-4 py-3 text-base focus:outline-none focus:border-amber-400 bg-white font-medium"
            />
            <button
              onClick={() => handleScrape()}
              disabled={loading}
              className="bg-amber-400 hover:bg-amber-500 text-black font-black px-8 py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap text-base"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin"></span>
                  <span>Scraping...</span>
                </>
              ) : (
                <>
                  <span>⚡ Scrape &amp; Analyze</span>
                </>
              )}
            </button>
          </div>

          {/* Quick links preset samples */}
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 flex-wrap">
            <span className="font-bold">Try example:</span>
            <button
              onClick={() => {
                setUrl("https://www.homedepot.com");
                handleScrape("https://www.homedepot.com");
              }}
              className="hover:text-black hover:underline"
            >
              HomeDepot.com
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setUrl("https://www.floorsforlife.com");
                handleScrape("https://www.floorsforlife.com");
              }}
              className="hover:text-black hover:underline"
            >
              FloorsForLife.com
            </button>
          </div>

          {/* PROGRESS INDICATOR */}
          {loading && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
              <span className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
              <p className="text-xs font-bold text-amber-900 tracking-wide">{progressMsg}</p>
            </div>
          )}

          {/* ERROR MESSAGE */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold flex items-center justify-between">
              <span>⚠️ {error}</span>
              <button onClick={() => setError("")} className="text-red-500 hover:text-red-800 font-bold">
                ✕
              </button>
            </div>
          )}
        </div>

        {/* RESULTS PANEL */}
        {intel && (
          <div className="mb-12 bg-white border-2 border-black rounded-2xl p-6 lg:p-8 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-black">{intel.companyName}</h2>
                  {intel.tone && (
                    <span className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1 rounded-full border border-gray-200">
                      Tone: {intel.tone}
                    </span>
                  )}
                </div>
                {intel.url && (
                  <a
                    href={intel.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-amber-600 hover:underline mt-1 inline-block"
                  >
                    🔗 {intel.url}
                  </a>
                )}
              </div>

              <button
                onClick={() => handleUseInOutreach(intel)}
                className="bg-black text-white hover:bg-gray-800 font-black px-6 py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.02]"
              >
                <span>✉️ Use in Outreach</span>
                <span>→</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Tagline / Mission */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Tagline / Mission
                </h3>
                <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                  {intel.tagline || intel.description || "No mission description captured."}
                </p>
              </div>

              {/* Target Audience */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Target Audience
                </h3>
                <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                  {intel.targetAudience || "B2B & Commercial Clients"}
                </p>
              </div>
            </div>

            {/* Services / Products */}
            {intel.services && intel.services.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Services / Product Offerings
                </h3>
                <div className="flex flex-wrap gap-2">
                  {intel.services.map((srv, idx) => (
                    <span
                      key={idx}
                      className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-lg text-xs font-bold"
                    >
                      ✓ {srv}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Key Highlights */}
            {intel.highlights && intel.highlights.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Key Company Highlights
                </h3>
                <ul className="space-y-2">
                  {intel.highlights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 font-medium">
                      <span className="text-amber-500 font-black">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* SAVED PROFILES SECTION */}
        <div className="border-t border-gray-200 pt-8">
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <span>📚 Saved Company Profiles</span>
            <span className="bg-gray-200 text-gray-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {savedIntels.length}
            </span>
          </h2>

          {savedIntels.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-500 font-semibold text-sm">
                No saved company profiles yet. Enter a website URL above to generate intelligence.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedIntels.map((profile, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-xl p-5 bg-white hover:border-gray-400 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-base text-black">{profile.companyName}</h3>
                      <button
                        onClick={() => handleDeleteSaved(profile.url)}
                        className="text-gray-400 hover:text-red-600 text-xs font-bold"
                        title="Delete Profile"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                      {profile.tagline || profile.description || profile.url}
                    </p>
                    {profile.services && profile.services.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {profile.services.slice(0, 3).map((s, idx) => (
                          <span
                            key={idx}
                            className="bg-gray-100 text-gray-700 text-[11px] font-semibold px-2 py-0.5 rounded"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400 font-semibold">
                      {profile.scrapedAt || "Saved Profile"}
                    </span>
                    <button
                      onClick={() => handleUseInOutreach(profile)}
                      className="bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
                    >
                      Use in Outreach →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
