"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────
const MODES = [
  { id: "quick",  label: "Quick",  desc: "~3s · 40 results",    color: "#16A34A" },
  { id: "deep",   label: "Deep",   desc: "~15s · 150 results",  color: "#2563EB" },
  { id: "max",    label: "Max",    desc: "~60s · 250+ results", color: "#9333EA" },
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

const INDUSTRY_KEYWORDS: string[] = [
  // FLOORING
  'epoxy floor contractors', 'polished concrete contractors', 'hardwood floor installers',
  'tile flooring companies', 'LVP flooring installers', 'vinyl plank flooring contractors',
  'commercial flooring subcontractors', 'warehouse floor coating companies',
  'industrial floor resurfacing', 'concrete floor grinding companies',
  'floor coating applicators', 'decorative concrete contractors',
  'resinous flooring companies', 'urethane cement flooring',
  'polyaspartic floor coating contractors', 'self-leveling floor contractors',

  // PAINTING
  'commercial painting contractors', 'interior painting companies',
  'exterior painting contractors', 'industrial painting companies',
  'commercial paint contractors', 'epoxy paint applicators',

  // ROOFING
  'commercial roofing contractors', 'flat roof contractors',
  'metal roofing companies', 'TPO roofing contractors',
  'residential roofing companies', 'roofing subcontractors',

  // CONCRETE / MASONRY
  'concrete contractors', 'concrete repair companies',
  'masonry contractors', 'concrete cutting companies',
  'shotcrete contractors', 'concrete polishing companies',

  // GENERAL CONTRACTING
  'general contractors', 'commercial general contractors',
  'construction management companies', 'renovation contractors',
  'remodeling contractors', 'tenant improvement contractors',

  // PLUMBING
  'commercial plumbing contractors', 'plumbing companies',
  'industrial plumbing contractors',

  // HVAC
  'HVAC contractors', 'commercial HVAC companies',
  'mechanical contractors', 'refrigeration contractors',

  // ELECTRICAL
  'electrical contractors', 'commercial electricians',
  'industrial electrical companies',

  // LANDSCAPING
  'landscaping companies', 'commercial landscaping contractors',
  'lawn care companies', 'irrigation contractors',

  // CLEANING
  'commercial janitorial services', 'office cleaning companies',
  'industrial cleaning contractors', 'pressure washing companies',
  'building cleaning services',

  // PHOTOGRAPHY
  'commercial photographers', 'real estate photographers',
  'wedding photographers', 'product photographers',

  // ACCOUNTING
  'accounting firms', 'bookkeeping companies', 'CPA firms',
  'tax preparation services', 'payroll companies',

  // INSURANCE
  'insurance agencies', 'commercial insurance brokers',
  'business insurance companies',

  // LAW
  'law firms', 'business attorneys', 'construction lawyers',

  // MEDICAL / DENTAL
  'dental offices', 'dental practices', 'dentists',
  'chiropractic offices', 'physical therapy clinics',

  // FITNESS
  'gyms', 'fitness studios', 'personal training studios',
  'crossfit gyms', 'yoga studios',

  // AUTO
  'auto repair shops', 'auto body shops', 'car dealerships',
  'towing companies', 'tire shops',

  // MOVING
  'moving companies', 'commercial movers', 'storage companies',

  // STAFFING
  'staffing agencies', 'temp agencies', 'employment agencies',

  // PEST CONTROL
  'pest control companies', 'exterminating companies',

  // SECURITY
  'security companies', 'alarm system installers',
  'commercial security contractors'
];

const CATEGORY_TABS = [
  'Flooring', 'Painting', 'Construction', 'Cleaning',
  'Professional', 'Medical', 'Auto', 'More'
];

const CATEGORY_EXAMPLES: Record<string, string[]> = {
  'Flooring': [
    'epoxy floor contractors',
    'polished concrete contractors',
    'hardwood floor installers',
    'tile flooring companies',
    'LVP flooring installers',
    'vinyl plank flooring contractors',
    'commercial flooring subcontractors',
    'warehouse floor coating companies',
  ],
  'Painting': [
    'commercial painting contractors',
    'interior painting companies',
    'exterior painting contractors',
    'industrial painting companies',
    'commercial paint contractors',
    'epoxy paint applicators',
  ],
  'Construction': [
    'general contractors',
    'commercial general contractors',
    'concrete contractors',
    'masonry contractors',
    'commercial roofing contractors',
    'commercial plumbing contractors',
    'HVAC contractors',
    'electrical contractors',
  ],
  'Cleaning': [
    'commercial janitorial services',
    'office cleaning companies',
    'industrial cleaning contractors',
    'pressure washing companies',
    'building cleaning services',
    'carpet cleaning contractors',
  ],
  'Professional': [
    'accounting firms',
    'bookkeeping companies',
    'CPA firms',
    'commercial insurance brokers',
    'law firms',
    'business attorneys',
    'staffing agencies',
  ],
  'Medical': [
    'dental offices',
    'dental practices',
    'dentists',
    'chiropractic offices',
    'physical therapy clinics',
    'medical clinics',
  ],
  'Auto': [
    'auto repair shops',
    'auto body shops',
    'car dealerships',
    'towing companies',
    'tire shops',
    'auto detailing shops',
  ],
  'More': [
    'landscaping companies',
    'commercial photographers',
    'real estate photographers',
    'gyms',
    'moving companies',
    'pest control companies',
    'security companies',
    'alarm system installers',
  ],
};

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
  years_in_business?: number | string;
  yearsInBusiness?: number | string;
  years_active?: number | string;
  established_year?: number;
  founded?: number;
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

function getYearsInBusiness(r: Result): string | null {
  const val = r.years_in_business ?? r.yearsInBusiness ?? r.years_active;
  if (val !== undefined && val !== null && val !== "") {
    if (typeof val === "number") return `${val} yrs in business`;
    if (typeof val === "string") {
      return val.toLowerCase().includes("in business") ? val : `${val} yrs in business`;
    }
  }
  if (r.established_year || r.founded) {
    const yr = r.established_year || r.founded;
    const diff = new Date().getFullYear() - Number(yr);
    if (diff > 0) return `${diff} yrs in business`;
  }
  return null;
}

export default function Dashboard() {
  const [city,    setCity]    = useState("Phoenix");
  const [country, setCountry] = useState<"US"|"CA">("US");
  const [state,   setState]   = useState("AZ");
  const [mode,    setMode]    = useState("deep");
  const [limit,   setLimit]   = useState(200);

  // Uncontrolled Search Bar DOM access
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Autocomplete & AI Enhance State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Categorized Examples State
  const [activeCategory, setActiveCategory] = useState<string>("Flooring");
  const [selectedChip, setSelectedChip] = useState<string | null>(null);

  // Source selector
  const [showSources,     setShowSources]     = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>(ALL_SOURCES.map(s => s.id));

  // Results & Stats
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

  // Click outside listener to dismiss autocomplete
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    const Q  = q    ?? (searchInputRef.current?.value || "");
    const C  = c    ?? city;
    const ST = st   ?? state;
    const MD = md   ?? mode;
    const CT = ctry ?? country;

    if (!Q.trim()) { setError("Enter a search query"); return; }
    setLoading(true); setError(""); setResult(null);
    setShowAutocomplete(false);

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
            mode: MD === "max" ? "level5" : MD,
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
  }, [city, state, mode, limit, country, selectedSources]);

  // Handle Autocomplete Input
  const handleSearchInput = () => {
    const currentVal = searchInputRef.current?.value || "";
    if (!currentVal.trim()) {
      setSuggestions([]);
      setShowAutocomplete(false);
      return;
    }
    const lower = currentVal.toLowerCase();
    const matches = INDUSTRY_KEYWORDS.filter(kw => kw.toLowerCase().includes(lower));
    setSuggestions(matches.slice(0, 8));
    setShowAutocomplete(matches.length > 0);
  };

  // Handle Keyboard Navigation in Search Input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setShowAutocomplete(false);
    } else if (e.key === "Enter") {
      setShowAutocomplete(false);
      doSearch();
    }
  };

  // Select Suggestion
  const handleSelectSuggestion = (kw: string) => {
    if (searchInputRef.current) {
      searchInputRef.current.value = kw;
    }
    setShowAutocomplete(false);
    setSelectedChip(kw);
  };

  // Handle AI Assist
  const handleAiEnhance = async () => {
    const currentVal = searchInputRef.current?.value || "";
    if (!currentVal.trim()) return;

    setIsEnhancing(true);
    setShowAutocomplete(false);
    try {
      const res = await fetch("/api/ai-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: currentVal }),
      });
      const data = await res.json();
      if (data.enhanced && searchInputRef.current) {
        searchInputRef.current.value = data.enhanced;
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      console.error("AI Enhance error:", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Handle Category Chip Click
  const handleChipClick = (phrase: string) => {
    if (searchInputRef.current) {
      searchInputRef.current.value = phrase;
    }
    setSelectedChip(phrase);
    setShowAutocomplete(false);
  };

  // Export CSV
  const exportCSV = () => {
    const rows = result?.results ?? result?.leads ?? [];
    if (!rows.length) return;
    const searchQuery = result?.query || searchInputRef.current?.value || "search";
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
    a.download = `xtreme-scraper-${searchQuery.replace(/\s+/g,"-")}-${city}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Highlight text match in autocomplete dropdown
  const renderHighlighted = (text: string) => {
    const query = searchInputRef.current?.value || "";
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + query.length);
    const after = text.slice(idx + query.length);
    return (
      <>
        {before}
        <span className="bg-yellow-200 text-black font-extrabold px-0.5 rounded">{match}</span>
        {after}
      </>
    );
  };

  const hits  = result?.results ?? result?.leads ?? [];
  const total = result?.total_results ?? result?.leads_found ?? hits.length;
  const bySource = hits.reduce<Record<string,number>>((acc, r) => {
    const s = r.source ?? "unknown"; acc[s] = (acc[s] ?? 0) + 1; return acc;
  }, {});

  return (
    <div className="min-h-screen bg-white text-black relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-purple-900 text-white font-bold text-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-purple-500 animate-bounce">
          <span className="text-lg">✨</span>
          <span>Enhanced ✓</span>
        </div>
      )}

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

        {/* ── ROW 1: Query (with AI Assist & Autocomplete) + City + Country + State ── */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <div ref={searchContainerRef} className="relative flex-1" style={{ minWidth: 260 }}>
            <input
              ref={searchInputRef}
              id="search-input"
              type="text"
              defaultValue=""
              onInput={handleSearchInput}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                const currentVal = searchInputRef.current?.value || "";
                if (currentVal.trim()) handleSearchInput();
              }}
              placeholder="Search any industry... (plumbers, photographers, accountants)"
              className="w-full rounded-xl border-2 border-gray-200 pl-5 pr-28 py-3 text-base focus:outline-none focus:border-yellow-400"
            />
            {/* AI Assist Button */}
            <button
              type="button"
              onClick={handleAiEnhance}
              disabled={isEnhancing}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 z-10"
            >
              {isEnhancing ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Enhancing...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>AI Assist</span>
                </>
              )}
            </button>

            {/* Smart Autocomplete Dropdown */}
            {showAutocomplete && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-40 overflow-hidden divide-y divide-gray-100">
                {suggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSuggestion(item)}
                    className="px-4 py-2.5 text-sm cursor-pointer hover:bg-yellow-50 text-gray-800 flex items-center justify-between"
                  >
                    <span>{renderHighlighted(item)}</span>
                    <span className="text-xs text-gray-400">Industry</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="City"
            className="w-36 rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:outline-none focus:border-yellow-400"
          />

          {/* Country toggle — distinct colors per country */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCountry("US")}
              className="flex items-center justify-center gap-2 rounded-xl border-2 transition-all font-black text-sm"
              style={{ width: 160, padding: "12px 0", flexShrink: 0,
                ...(country === "US"
                  ? { background: "#1D4ED8", borderColor: "#1D4ED8", color: "#fff", boxShadow: "0 2px 8px rgba(29,78,216,0.35)" }
                  : { background: "#fff", borderColor: "#D1D5DB", color: "#6B7280" })
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>🇺🇸</span>
              <span>United States</span>
            </button>
            <button
              onClick={() => setCountry("CA")}
              className="flex items-center justify-center gap-2 rounded-xl border-2 transition-all font-black text-sm"
              style={{ width: 160, padding: "12px 0", flexShrink: 0,
                ...(country === "CA"
                  ? { background: "#DC2626", borderColor: "#DC2626", color: "#fff", boxShadow: "0 2px 8px rgba(220,38,38,0.35)" }
                  : { background: "#fff", borderColor: "#D1D5DB", color: "#6B7280" })
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>🇨🇦</span>
              <span>Canada</span>
            </button>
          </div>

          {/* State or Province selector */}
          {country === "US" ? (
            <select
              value={state}
              onChange={e => setState(e.target.value)}
              className="w-28 rounded-xl border-2 border-gray-200 px-3 py-3 text-base focus:outline-none focus:border-yellow-400 bg-white"
            >
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <select
              value={state}
              onChange={e => setState(e.target.value)}
              className="w-36 rounded-xl border-2 border-gray-200 px-3 py-3 text-base focus:outline-none focus:border-yellow-400 bg-white"
            >
              {CA_PROVINCES.map(p => (
                <option key={p.code} value={p.code}>{p.code} — {p.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* ── ROW 2: Mode Selector + Limit + Source Toggle + Submit ── */}
        <div className="flex gap-3 mb-6 flex-wrap items-center">
          {/* Mode pills */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  mode === m.id ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"
                }`}
              >
                {m.label}
                <span className="ml-1.5 text-xs font-normal opacity-70">{m.desc.split("·")[0]}</span>
              </button>
            ))}
          </div>

          {/* Limit selector */}
          <select
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            className="rounded-xl border-2 border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 bg-white font-semibold"
          >
            <option value={50}>50 results</option>
            <option value={100}>100 results</option>
            <option value={200}>200 results</option>
            <option value={500}>500 results</option>
          </select>

          {/* Sources button */}
          <button
            onClick={() => setShowSources(!showSources)}
            className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all ${
              selectedSources.length < ALL_SOURCES.length
                ? "border-yellow-400 bg-yellow-50 text-black"
                : "border-gray-200 hover:border-gray-300 text-gray-700"
            }`}
          >
            Sources ({selectedSources.length}/{ALL_SOURCES.length}) {showSources ? "▲" : "▼"}
          </button>

          {/* SEARCH BUTTON */}
          <button
            onClick={() => doSearch()}
            disabled={loading}
            style={{ backgroundColor: "#FFBE00" }}
            className="flex-1 rounded-xl px-8 py-3 text-black font-black text-base hover:opacity-90 transition-opacity disabled:opacity-50 min-w-36 shadow-md"
          >
            {loading ? "SEARCHING..." : "SEARCH LEADS →"}
          </button>
        </div>

        {/* ── SOURCE SELECTOR PANEL ── */}
        {showSources && (
          <div className="mb-6 p-5 rounded-2xl border-2 border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm text-gray-700">Select Data Sources</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSources(ALL_SOURCES.map(s => s.id))}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setSelectedSources(["google_maps"])}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  Google Maps Only
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ALL_SOURCES.map(src => {
                const active = selectedSources.includes(src.id);
                return (
                  <button
                    key={src.id}
                    onClick={() => toggleSource(src.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      active
                        ? "border-yellow-400 bg-white shadow-sm"
                        : "border-gray-200 bg-gray-100 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{src.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${active ? "bg-yellow-400 text-black" : "bg-gray-200 text-gray-500"}`}>
                        {active ? "ON" : "OFF"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{src.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── REBUILT CATEGORIZED EXAMPLES SECTION ── */}
        <div className="mb-8 p-6 rounded-2xl bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              💡 Try an Example Industry
            </h3>
            <span className="text-xs text-gray-400">Click any phrase to populate search bar</span>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 border-b border-gray-200 pb-3 mb-4">
            {CATEGORY_TABS.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? "bg-black text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Chips Grid */}
          <div className="flex flex-wrap gap-2">
            {(CATEGORY_EXAMPLES[activeCategory] || []).map(phrase => {
              const isSelected = selectedChip === phrase;
              return (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => handleChipClick(phrase)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    isSelected
                      ? "bg-yellow-400 text-black border-yellow-500 font-bold shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50"
                  }`}
                >
                  {phrase}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── ERROR DISPLAY ── */}
        {error && (
          <div className="p-4 mb-8 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
            ⚠️ {error}
          </div>
        )}

        {/* ── LOADING SPINNER ── */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent mb-4"></div>
            <p className="font-bold text-lg">Scraping {mode.toUpperCase()} mode...</p>
            <p className="text-sm text-gray-500">Querying all sources in parallel</p>
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
              {hits.map((r, i) => {
                const yib = getYearsInBusiness(r);
                return (
                  <div key={i} className="rounded-2xl border border-gray-200 p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h3
                        className="font-bold text-base leading-tight flex-1 mr-2"
                        dangerouslySetInnerHTML={{ __html: r.company_name }}
                      />
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {r.confidence && (
                          <span
                            className="text-xs font-bold rounded-full px-2 py-0.5"
                            style={{
                              backgroundColor: r.confidence >= 80 ? "#DCFCE7" : r.confidence >= 60 ? "#FEF9C3" : "#F3F4F6",
                              color: r.confidence >= 80 ? "#16A34A" : r.confidence >= 60 ? "#92400E" : "#6B7280",
                            }}
                          >
                            {r.confidence}%
                          </span>
                        )}
                        {yib && (
                          <span className="text-xs font-semibold rounded-full px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200">
                            {yib}
                          </span>
                        )}
                      </div>
                    </div>
                    {r.rating && (
                      <p className="text-sm text-yellow-600 font-semibold mb-2">
                        ★ {r.rating} {r.review_count ? `(${r.review_count} reviews)` : ""}
                      </p>
                    )}
                    {r.address && <p className="text-sm text-gray-500 mb-3 leading-tight">{r.address}</p>}
                    <div className="flex gap-2 flex-wrap items-center">
                      {r.phone && (
                        <a
                          href={`tel:${r.phone.replace(/\D/g,"")}`}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold border border-gray-200 hover:border-yellow-400 transition-all text-gray-800"
                        >
                          📞 {r.phone}
                        </a>
                      )}
                      {r.website && (
                        <a
                          href={r.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold border border-gray-200 hover:border-yellow-400 transition-all text-gray-800"
                        >
                          🌐 Website
                        </a>
                      )}
                      {r.email ? (
                        <a
                          href={`mailto:${r.email}`}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold border border-gray-200 hover:border-yellow-400 transition-all text-gray-800"
                        >
                          ✉ Email
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-normal text-gray-400 bg-gray-50 border border-gray-100">
                          ✉ No email listed
                        </span>
                      )}
                      {r.source && (
                        <span className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold bg-gray-50 text-gray-500">
                          {r.source}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
