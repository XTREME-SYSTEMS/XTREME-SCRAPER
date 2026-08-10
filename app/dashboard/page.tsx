"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────
const MODES = [
  { id: "quick",  label: "Quick",      desc: "~3s · 40 results",   color: "#16A34A" },
  { id: "deep",   label: "Deep",       desc: "~15s · 150 results", color: "#2563EB" },
  { id: "max",    label: "Max",        desc: "~30s · 200 results", color: "#9333EA" },
  { id: "level5", label: "Level 5 ⚡", desc: "~60s · 250+ results",color: "#FFBE00" },
];

const ALL_SOURCES = [
  { id: "google_maps", label: "Google Maps",  desc: "Local listings + ratings" },
  { id: "bbb",         label: "BBB",          desc: "Better Business Bureau" },
  { id: "apollo",      label: "Apollo",       desc: "B2B company intelligence" },
  { id: "firecrawl",   label: "Firecrawl",    desc: "Deep web crawl" },
  { id: "yellowpages", label: "Yellow Pages", desc: "Traditional directory" },
  { id: "yelp",        label: "Yelp",         desc: "Consumer reviews" },
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
  { query: "Epoxy flooring",        city: "Phoenix",   state: "AZ", country: "US" },
  { query: "Plumbers",              city: "Dallas",    state: "TX", country: "US" },
  { query: "Roofing contractors",   city: "Denver",    state: "CO", country: "US" },
  { query: "HVAC companies",        city: "Miami",     state: "FL", country: "US" },
  { query: "Concrete contractors",  city: "Toronto",   state: "ON", country: "CA" },
  { query: "Epoxy flooring",        city: "Calgary",   state: "AB", country: "CA" },
  { query: "Plumbers",              city: "Vancouver", state: "BC", country: "CA" },
  { query: "Flooring contractors",  city: "Montreal",  state: "QC", country: "CA" },
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
};

type SearchResponse = {
  ok: boolean;
  results?: Result[];
  leads?: Result[];
  total_results?: number;
  leads_found?: number;
  duration_ms?: number;
  sources_used?: string[];
  error?: string;
  intelligence?: { intel?: { opener?: string } };
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
  page:      { minHeight: "100vh", background: "#fff", color: "#111" },
  nav:       { borderBottom: "1px solid #f0f0f0", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky" as const, top: 0, background: "#fff", zIndex: 50 },
  statsBar:  { borderBottom: "1px solid #f0f0f0", padding: "10px 32px", display: "flex", alignItems: "center", gap: 32, fontSize: 13, color: "#777", background: "#fafafa", flexWrap: "wrap" as const },
  main:      { maxWidth: 1000, margin: "0 auto", padding: "40px 32px" },
  input:     { flex: 1, border: "2px solid #e5e7eb", borderRadius: 12, padding: "12px 18px", fontSize: 15, outline: "none", fontFamily: "inherit" },
  btn:       (active: boolean, color: string) => ({
    border: "2px solid " + (active ? color : "#e5e7eb"),
    borderRadius: 12,
    padding: "10px 18px",
    fontSize: 13,
    fontWeight: 700,
    background: active ? color : "#fff",
    color: active ? (color === "#FFBE00" ? "#111" : "#fff") : "#111",
    cursor: "pointer",
    transition: "all 0.15s",
  }),
  searchBtn: (loading: boolean) => ({
    width: "100%",
    background: "#FFBE00",
    color: "#111",
    border: "none",
    borderRadius: 12,
    padding: "16px",
    fontSize: 17,
    fontWeight: 900,
    marginBottom: 32,
    opacity: loading ? 0.7 : 1,
    cursor: loading ? "not-allowed" : "pointer",
  }),
  resultRow: {
    border: "2px solid #f0f0f0",
    borderRadius: 12,
    padding: "16px 20px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 10,
    transition: "border-color 0.15s",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [query,   setQuery]   = useState("");
  const [city,    setCity]    = useState("Phoenix");
  const [country, setCountry] = useState<"US"|"CA">("US");
  const [state,   setState]   = useState("AZ");
  const [mode,    setMode]    = useState("deep");
  const [limit,   setLimit]   = useState(200);

  // Source selector
  const [showSources,      setShowSources]      = useState(false);
  const [selectedSources,  setSelectedSources]  = useState<string[]>(ALL_SOURCES.map(s => s.id));

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
      if (!res.ok) res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry: Q, city: C, state: ST, mode: MD === "level5" ? "max" : MD, limit, country: CT, sources: selectedSources }),
      });

      const data: SearchResponse = await res.json();
      setResult(data);
      if (!data.ok) setError(data.error ?? "Search failed");
    } catch {
      setError("Network error — check connection");
    } finally {
      setLoading(false);
    }
  }, [query, city, state, mode, limit, country, selectedSources]);

  const hits  = result?.results ?? result?.leads ?? [];
  const total = result?.total_results ?? result?.leads_found ?? hits.length;
  const bySource = hits.reduce<Record<string,number>>((acc, r) => {
    const s = r.source ?? "unknown"; acc[s] = (acc[s] ?? 0) + 1; return acc;
  }, {});

  return (
    <div style={S.page}>
      {/* NAV */}
      <nav style={S.nav}>
        <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: -0.5 }}>XTREME SCRAPER</span>
        <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "#FFBE00" }}>← Home</Link>
      </nav>

      {/* STATS BAR */}
      <div style={S.statsBar}>
        <span>Total Runs: <strong style={{ color: "#111" }}>{stats?.total_runs ?? "—"}</strong></span>
        <span>Total Leads: <strong style={{ color: "#111" }}>{stats?.total_leads ?? "—"}</strong></span>
        <span>Last Run: <strong style={{ color: "#111" }}>{stats?.last_run ? new Date(stats.last_run).toLocaleString() : "—"}</strong></span>
        {result && <span style={{ color: "#16A34A", fontWeight: 700 }}>✓ {total} results in {result.duration_ms}ms</span>}
      </div>

      <div style={S.main}>
        <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 6 }}>Level 5 Intelligence Search</h1>
        <p style={{ color: "#777", marginBottom: 28, fontSize: 15 }}>
          Any industry. Any city. Every source.{" "}
          <strong style={{ color: "#111" }}>Google Maps · BBB · Apollo · Firecrawl · BrowserWorker · AI</strong>
        </p>

        {/* ── ROW 1: Query + City + Country/State ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <input
            style={S.input}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doSearch()}
            placeholder="Search any industry... (plumbers, photographers, accountants)"
          />
          <input
            style={{ ...S.input, flex: "none", width: 140 }}
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="City"
          />

          {/* Country + State picker */}
          <div style={{ display: "flex", border: "2px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            <button
              onClick={() => setCountry("US")}
              style={{ padding: "10px 14px", fontWeight: 700, fontSize: 13, border: "none", background: country === "US" ? "#FFBE00" : "#fff", color: "#111", borderRight: "1px solid #e5e7eb" }}
            >
              🇺🇸 US
            </button>
            <button
              onClick={() => setCountry("CA")}
              style={{ padding: "10px 14px", fontWeight: 700, fontSize: 13, border: "none", background: country === "CA" ? "#FFBE00" : "#fff", color: "#111", borderRight: "1px solid #e5e7eb" }}
            >
              🇨🇦 CA
            </button>
            <select
              value={state}
              onChange={e => setState(e.target.value)}
              style={{ padding: "10px 12px", fontSize: 14, border: "none", background: "#fff", fontFamily: "inherit", cursor: "pointer" }}
            >
              {country === "US"
                ? US_STATES.map(s => <option key={s} value={s}>{s}</option>)
                : CA_PROVINCES.map(p => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)
              }
            </select>
          </div>
        </div>

        {/* ── ROW 2: Mode + Limit ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={S.btn(mode === m.id, m.color)}>
              {m.label} <span style={{ fontWeight: 400, opacity: 0.7 }}>{m.desc}</span>
            </button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#777" }}>Limit:</span>
            <select
              value={limit}
              onChange={e => setLimit(Number(e.target.value))}
              style={{ border: "2px solid #e5e7eb", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: "inherit" }}
            >
              {[50, 100, 200, 500, 1000].map(n => <option key={n} value={n}>{n === 1000 ? "All" : n}</option>)}
            </select>
          </div>
        </div>

        {/* ── SOURCE SELECTOR ── */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => setShowSources(v => !v)}
            style={{ background: "none", border: "none", fontSize: 13, fontWeight: 700, color: "#555", display: "flex", alignItems: "center", gap: 8, padding: 0 }}
          >
            <span style={{ border: "2px solid #FFBE00", borderRadius: 4, width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#FFBE00" }}>✓</span>
            Sources ({selectedSources.length}/{ALL_SOURCES.length} active)
            <span style={{ color: "#aaa", fontWeight: 400 }}>{showSources ? "▲" : "▼"}</span>
          </button>

          {showSources && (
            <div style={{ marginTop: 10, padding: "16px 20px", border: "2px solid #f0f0f0", borderRadius: 12, background: "#fafafa", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
              {ALL_SOURCES.map(src => {
                const active = selectedSources.includes(src.id);
                return (
                  <label key={src.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleSource(src.id)}
                      style={{ marginTop: 3, width: 16, height: 16, accentColor: "#FFBE00" }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: active ? "#111" : "#999" }}>{src.label}</div>
                      <div style={{ fontSize: 11, color: "#aaa" }}>{src.desc}</div>
                    </div>
                  </label>
                );
              })}
              <div style={{ gridColumn: "1/-1", borderTop: "1px solid #e5e7eb", paddingTop: 10, display: "flex", gap: 16 }}>
                <button onClick={() => setSelectedSources(ALL_SOURCES.map(s => s.id))} style={{ background: "none", border: "none", fontSize: 12, color: "#2563EB", fontWeight: 600, padding: 0, cursor: "pointer" }}>Select all</button>
                <button onClick={() => setSelectedSources([ALL_SOURCES[0].id])} style={{ background: "none", border: "none", fontSize: 12, color: "#aaa", fontWeight: 600, padding: 0, cursor: "pointer" }}>Clear all</button>
              </div>
            </div>
          )}
        </div>

        {/* ── SEARCH BUTTON ── */}
        <button onClick={() => doSearch()} disabled={loading} style={S.searchBtn(loading)}>
          {loading ? `Searching ${selectedSources.length} source${selectedSources.length > 1 ? "s" : ""}…` : `Search ${mode.charAt(0).toUpperCase() + mode.slice(1)} →`}
        </button>

        {/* ── ERROR ── */}
        {error && <div style={{ marginBottom: 20, padding: "14px 18px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 14, fontWeight: 600 }}>{error}</div>}

        {/* ── EXAMPLES ── */}
        {!result && !loading && (
          <div>
            <p style={{ fontSize: 12, color: "#aaa", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Try an example:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(ex.query); setCity(ex.city); setCountry(ex.country as "US"|"CA"); setState(ex.state);
                    doSearch(ex.query, ex.city, ex.state, mode, ex.country as "US"|"CA");
                  }}
                  style={{ padding: "8px 16px", borderRadius: 999, border: "2px solid #e5e7eb", fontSize: 13, fontWeight: 600, background: "#fff", cursor: "pointer" }}
                >
                  {ex.query} in {ex.city}, {ex.state} {ex.country === "CA" ? "🇨🇦" : "🇺🇸"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ height: 64, borderRadius: 12, background: "#f0f0f0", marginBottom: 10, opacity: 1 - i * 0.15, animation: "pulse 1.5s ease-in-out infinite" }}/>
            ))}
          </div>
        )}

        {/* ── RESULTS ── */}
        {result && !loading && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div>
                <span style={{ fontWeight: 900, fontSize: 26 }}>{total}</span>
                <span style={{ color: "#777", marginLeft: 8, fontSize: 14 }}>
                  results from {result.sources_used?.join(", ") ?? selectedSources.join(", ")}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(bySource).map(([src, count]) => (
                  <span key={src} style={{ padding: "4px 12px", borderRadius: 999, background: "#f0f0f0", fontSize: 12, fontWeight: 700, color: "#555" }}>
                    {src}: {count}
                  </span>
                ))}
              </div>
            </div>

            {result.intelligence?.intel?.opener && (
              <div style={{ marginBottom: 20, padding: "14px 18px", borderRadius: 12, background: "#fffbeb", border: "1px solid #fde68a", fontSize: 14, color: "#555", lineHeight: 1.6 }}>
                <strong style={{ color: "#92400e" }}>AI: </strong>{result.intelligence.intel.opener}
              </div>
            )}

            {hits.map((r, i) => (
              <div key={i} style={S.resultRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontWeight: 900, fontSize: 15 }} dangerouslySetInnerHTML={{ __html: r.company_name }}/>
                    {r.source && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "#f0f0f0", color: "#777" }}>{r.source}</span>}
                    {r.confidence !== undefined && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: r.confidence > 80 ? "#16A34A" : "#d97706" }}>{r.confidence}%</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "#777" }}>
                    {[r.address, r.city, r.state].filter(Boolean).join(", ")}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {r.phone && (
                    <a href={`tel:${r.phone}`} style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>{r.phone}</a>
                  )}
                  {r.website && (
                    <div style={{ marginTop: 4 }}>
                      <a href={r.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#2563EB" }}>Website →</a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
