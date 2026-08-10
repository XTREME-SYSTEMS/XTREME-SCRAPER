"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────
const MODES = [
  { id: "quick",  label: "Quick",       desc: "~3s · 40 results",   color: "#16A34A" },
  { id: "deep",   label: "Deep",        desc: "~15s · 150 results", color: "#2563EB" },
  { id: "max",    label: "Max",         desc: "~30s · 200 results", color: "#9333EA" },
  { id: "level5", label: "Level 5 ⚡",  desc: "~60s · 250+ results",color: "#FFBE00" },
];

const ALL_SOURCES = [
  { id: "google_maps", label: "Google Maps",    desc: "Local listings + ratings" },
  { id: "bbb",         label: "BBB",            desc: "Better Business Bureau" },
  { id: "apollo",      label: "Apollo",         desc: "B2B company intelligence" },
  { id: "firecrawl",   label: "Firecrawl",      desc: "Deep web crawl" },
  { id: "yellowpages", label: "Yellow Pages",   desc: "Traditional directory" },
  { id: "yelp",        label: "Yelp",           desc: "Consumer reviews" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const CA_PROVINCES = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland & Labrador" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NU", name: "Nunavut" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "YT", name: "Yukon" },
];

const EXAMPLES = [
  { query: "Epoxy flooring",       city: "Phoenix",   state: "AZ", country: "US" },
  { query: "Plumbers",             city: "Dallas",    state: "TX", country: "US" },
  { query: "Roofing contractors",  city: "Denver",    state: "CO", country: "US" },
  { query: "Wedding photographers",city: "Austin",    state: "TX", country: "US" },
  { query: "Accountants",          city: "Chicago",   state: "IL", country: "US" },
  { query: "HVAC companies",       city: "Miami",     state: "FL", country: "US" },
  { query: "Concrete contractors", city: "Toronto",   state: "ON", country: "CA" },
  { query: "Epoxy flooring",       city: "Calgary",   state: "AB", country: "CA" },
];

type Result = {
  company_name: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  source?: string;
  confidence?: number;
  website?: string;
  rating?: number;
  review_count?: number;
  email?: string;
};

type SearchResponse = {
  ok: boolean;
  results?: Result[];
  leads?: Result[];
  total_results?: number;
  leads_found?: number;
  duration_ms?: number;
  sources_used?: string[];
  keywords_expanded?: string[];
  query?: string;
  city?: string;
  state?: string;
  mode?: string;
  error?: string;
  intelligence?: { intel?: { opener?: string } };
};

export default function Dashboard() {
  const [query,   setQuery]   = useState("");
  const [city,    setCity]    = useState("Phoenix");
  const [country, setCountry] = useState<"US"|"CA">("US");
  const [state,   setState]   = useState("AZ");
  const [mode,    setMode]    = useState("deep");
  const [limit,   setLimit]   = useState(200);

  // Source selector (NEW)
  const [showSources,     setShowSources]     = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>(ALL_SOURCES.map(s => s.id));

  // Results
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<SearchResponse | null>(null);
  const [error,    setError]    = useState("");
  const [stats,    setStats]    = useState<{total_runs?:number;total_leads?:number;last_run?:string}|null>(null);

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  // Reset state when country changes
  useEffect(() => {
    setState(country === "US" ? "AZ" : "ON");
  }, [country]);

  const toggleSource = (id: string) => {
    setSelectedSources(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(s => s !== id) : prev
        : [...prev, id]
    );
  };

  const doSearch = useCallback(async (
    q?: string, c?: string, st?: string, md?: string, ctry?: "US"|"CA"
  ) => {
    const Q  = q    ?? query;
    const C  = c    ?? city;
    const ST = st   ?? state;
    const MD = md   ?? mode;
    const CT = ctry ?? country;

    if (!Q.trim()) { setError("Enter a search query"); return; }
    setLoading(true); setError(""); setResult(null);

    try {
      const body: Record<string, unknown> = {
        query: Q, city: C, state: ST, mode: MD, limit, country: CT,
      };
      if (selectedSources.length < ALL_SOURCES.length) body.sources = selectedSources;

      let res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        res = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            industry: Q, city: C, state: ST,
            mode: MD === "level5" ? "max" : MD,
            limit, country: CT,
            ...(selectedSources.length < ALL_SOURCES.length ? { sources: selectedSources } : {}),
          }),
        });
      }
      const data: SearchResponse = await res.json();
      setResult(data);
      if (!data.ok) setError(data.error ?? "Search failed");
    } catch {
      setError("Network error — check connection");
    } finally {
      setLoading(false);
    }
  }, [query, city, state, mode, limit, country, selectedSources]);

  const exportCSV = () => {
    const rows = result?.results ?? result?.leads ?? [];
    if (!rows.length) return;
    const csv = [
      "Company Name,Phone,Email,Website,Address,City,State,Rating,Reviews,Source,Confidence",
      ...rows.map(r =>
        [r.company_name, r.phone||"", r.email||"", r.website||"", r.address||"",
         r.city||"", r.state||"", r.rating||"", r.review_count||"",
         r.source||"", r.confidence||""]
          .map(v => `"${String(v).replace(/"/g,'""')}"`)
          .join(",")
      )
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `xtreme-scraper-${query.replace(/\s+/g,"-")}-${city}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hits  = result?.results ?? result?.leads ?? [];
  const total = result?.total_results ?? result?.leads_found ?? hits.length;
  const bySource = hits.reduce<Record<string,number>>((acc, r) => {
    const s = r.source ?? "unknown"; acc[s] = (acc[s] ?? 0) + 1; return acc;
  }, {});

  return (
    <div className="min-h-screen bg-white text-black">
      {/* NAV */}
      <nav className="border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 bg-white z-50">
        <span className="font-black text-xl">XTREME SCRAPER</span>
        <Link href="/" className="text-sm font-semibold" style={{ color: "#FFBE00" }}>← Home</Link>
      </nav>

      {/* STATS BAR */}
      <div className="border-b border-gray-100 px-8 py-3 flex items-center gap-8 text-sm text-gray-500 bg-gray-50 flex-wrap">
        <span>Total Runs: <strong className="text-black">{stats?.total_runs ?? "—"}</strong></span>
        <span>Total Leads: <strong className="text-black">{stats?.total_leads ?? "—"}</strong></span>
        <span>Last Run: <strong className="text-black">{stats?.last_run ? new Date(stats.last_run).toLocaleString() : "—"}</strong></span>
        {result && <span style={{ color: "#16A34A" }} className="font-semibold">✓ {total} results in {result.duration_ms}ms</span>}
      </div>

      <div className="max-w-5xl mx-auto px-8 py-12">
        <h1 className="font-black text-4xl mb-2">Level 5 Intelligence Search</h1>
        <p className="text-gray-500 mb-8">
          Any industry. Any city. Every source.{" "}
          <span className="font-semibold text-black">Google Maps · BBB · Apollo · Firecrawl · BrowserWorker · AI</span>
        </p>

        {/* ── ROW 1: Query + City + Country + State ── */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doSearch()}
            placeholder="Search any industry... (plumbers, photographers, accountants)"
            className="flex-1 rounded-xl border-2 border-gray-200 px-5 py-3 text-base focus:outline-none focus:border-yellow-400"
            style={{ minWidth: 260 }}
          />
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="City"
            className="w-36 rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:outline-none focus:border-yellow-400"
          />

          {/* Country toggle + State/Province */}
          <div className="flex rounded-xl border-2 border-gray-200 overflow-hidden">
            <button
              onClick={() => setCountry("US")}
              className="px-4 py-2 text-sm font-bold border-r border-gray-200"
              style={{ background: country === "US" ? "#FFBE00" : "#fff", color: "#111" }}
            >
              🇺🇸 US
            </button>
            <button
              onClick={() => setCountry("CA")}
              className="px-4 py-2 text-sm font-bold border-r border-gray-200"
              style={{ background: country === "CA" ? "#FFBE00" : "#fff", color: "#111" }}
            >
              🇨🇦 CA
            </button>
            <select
              value={state}
              onChange={e => setState(e.target.value)}
              className="w-24 px-3 py-3 text-base focus:outline-none bg-white"
            >
              {country === "US"
                ? US_STATES.map(s => <option key={s} value={s}>{s}</option>)
                : CA_PROVINCES.map(p => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)
              }
            </select>
          </div>
        </div>

        {/* ── ROW 2: Modes + Limit ── */}
        <div className="flex gap-3 mb-4 flex-wrap">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className="rounded-xl px-5 py-2.5 text-sm font-bold transition-all border-2"
              style={mode === m.id
                ? { backgroundColor: m.color, borderColor: m.color, color: m.id === "level5" ? "#111" : "white" }
                : { backgroundColor: "white", borderColor: "#E5E7EB", color: "#111" }
              }
            >
              {m.label} <span className="font-normal opacity-70 text-xs ml-1">{m.desc}</span>
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-gray-500">Limit:</label>
            <select
              value={limit}
              onChange={e => setLimit(Number(e.target.value))}
              className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
            >
              {[50, 100, 200, 500, 0].map(n => (
                <option key={n} value={n}>{n === 0 ? "All" : n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── SOURCE SELECTOR (NEW) ── */}
        <div className="mb-5">
          <button
            onClick={() => setShowSources(v => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-black transition-colors"
          >
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold border-2"
              style={{ borderColor: "#FFBE00", color: "#FFBE00" }}
            >✓</span>
            Sources ({selectedSources.length}/{ALL_SOURCES.length} active)
            <span className="text-gray-300 font-normal">{showSources ? "▲" : "▼"}</span>
          </button>

          {showSources && (
            <div className="mt-3 p-5 rounded-xl border-2 border-gray-100 bg-gray-50 grid grid-cols-2 gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}>
              {ALL_SOURCES.map(src => {
                const active = selectedSources.includes(src.id);
                return (
                  <label key={src.id} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleSource(src.id)}
                      className="mt-0.5 w-4 h-4"
                      style={{ accentColor: "#FFBE00" }}
                    />
                    <div>
                      <div className={`text-sm font-bold ${active ? "text-black" : "text-gray-400"}`}>{src.label}</div>
                      <div className="text-xs text-gray-400">{src.desc}</div>
                    </div>
                  </label>
                );
              })}
              <div className="col-span-full border-t border-gray-200 pt-3 flex gap-4">
                <button
                  onClick={() => setSelectedSources(ALL_SOURCES.map(s => s.id))}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >Select all</button>
                <button
                  onClick={() => setSelectedSources([ALL_SOURCES[0].id])}
                  className="text-xs font-semibold text-gray-400 hover:underline"
                >Clear all</button>
              </div>
            </div>
          )}
        </div>

        {/* ── SEARCH BUTTON ── */}
        <button
          onClick={() => doSearch()}
          disabled={loading}
          className="w-full rounded-xl py-4 font-black text-lg text-black transition-all hover:scale-[1.01] disabled:opacity-60"
          style={{ backgroundColor: "#FFBE00" }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Searching {selectedSources.length} source{selectedSources.length > 1 ? "s" : ""}...
            </span>
          ) : `Search ${mode === "level5" ? "⚡ Level 5" : mode.charAt(0).toUpperCase() + mode.slice(1)} →`}
        </button>

        {/* ── ERROR ── */}
        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-5 py-3 text-red-700 text-sm">{error}</div>
        )}

        {/* ── EXAMPLES ── */}
        {!result && !loading && (
          <div className="mt-8">
            <p className="text-sm text-gray-400 mb-3">Try an example:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(ex.query);
                    setCity(ex.city);
                    setCountry(ex.country as "US"|"CA");
                    setState(ex.state);
                    setTimeout(() => doSearch(ex.query, ex.city, ex.state, mode, ex.country as "US"|"CA"), 50);
                  }}
                  className="rounded-full border border-gray-200 px-4 py-1.5 text-sm hover:border-yellow-400 transition-all font-medium"
                >
                  {ex.query} in {ex.city}, {ex.state} {ex.country === "CA" ? "🇨🇦" : ""}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {result?.ok && hits.length > 0 && (
          <div className="mt-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="font-black text-2xl">{total} Results</h2>
                <p className="text-gray-500 text-sm">
                  for &quot;{result.query}&quot; in {result.city}, {result.state} · {result.duration_ms}ms · {result.mode} mode
                </p>
              </div>
              <button
                onClick={exportCSV}
                className="rounded-xl px-5 py-2 font-bold text-sm border-2 border-gray-200 hover:border-yellow-400 transition-all"
              >
                ⬇ Export CSV
              </button>
            </div>

            {/* Source breakdown */}
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.entries(bySource).map(([src, count]) => (
                <span key={src} className="rounded-full px-3 py-1 text-xs font-semibold border border-gray-200 bg-gray-50">
                  {src}: {count}
                </span>
              ))}
            </div>

            {/* Keywords expanded */}
            {result.keywords_expanded && result.keywords_expanded.length > 1 && (
              <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">
                  Keywords searched ({result.keywords_expanded.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {result.keywords_expanded.map((kw, i) => (
                    <span key={i} className="text-xs bg-white border border-gray-200 rounded-full px-2 py-0.5">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* AI summary */}
            {result.intelligence?.intel?.opener && (
              <div className="mb-6 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                <strong className="text-yellow-800 text-xs font-bold uppercase tracking-wider">AI Insight: </strong>
                <span className="text-sm text-gray-700">{result.intelligence.intel.opener}</span>
              </div>
            )}

            {/* Card grid — matches original 3-col layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hits.map((r, i) => (
                <div key={i} className="rounded-2xl border border-gray-200 p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3
                      className="font-bold text-base leading-tight flex-1 mr-2"
                      dangerouslySetInnerHTML={{ __html: r.company_name }}
                    />
                    {r.confidence && (
                      <span
                        className="text-xs font-bold rounded-full px-2 py-0.5 flex-shrink-0"
                        style={{
                          backgroundColor: r.confidence >= 80 ? "#DCFCE7" : r.confidence >= 60 ? "#FEF9C3" : "#F3F4F6",
                          color: r.confidence >= 80 ? "#16A34A" : r.confidence >= 60 ? "#92400E" : "#6B7280",
                        }}
                      >
                        {r.confidence}%
                      </span>
                    )}
                  </div>
                  {r.rating && (
                    <p className="text-sm text-yellow-600 font-semibold mb-2">
                      ★ {r.rating} {r.review_count ? `(${r.review_count} reviews)` : ""}
                    </p>
                  )}
                  {r.address && <p className="text-sm text-gray-500 mb-3 leading-tight">{r.address}</p>}
                  <div className="flex gap-2 flex-wrap">
                    {r.phone && (
                      <a
                        href={`tel:${r.phone.replace(/\D/g,"")}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold border border-gray-200 hover:border-yellow-400 transition-all"
                      >
                        📞 {r.phone}
                      </a>
                    )}
                    {r.website && (
                      <a
                        href={r.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold border border-gray-200 hover:border-yellow-400 transition-all"
                      >
                        🌐 Website
                      </a>
                    )}
                    {r.email && (
                      <a
                        href={`mailto:${r.email}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold border border-gray-200 hover:border-yellow-400 transition-all"
                      >
                        ✉ Email
                      </a>
                    )}
                    {r.source && (
                      <span className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold bg-gray-50 text-gray-500">
                        {r.source}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
