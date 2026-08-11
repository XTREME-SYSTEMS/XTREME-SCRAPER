"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";

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
  'epoxy floor contractors', 'polished concrete contractors', 'hardwood floor installers',
  'tile flooring companies', 'LVP flooring installers', 'vinyl plank flooring contractors',
  'commercial flooring subcontractors', 'warehouse floor coating companies',
  'industrial floor resurfacing', 'concrete floor grinding companies',
  'floor coating applicators', 'decorative concrete contractors',
  'resinous flooring companies', 'urethane cement flooring',
  'polyaspartic floor coating contractors', 'self-leveling floor contractors',
  'commercial painting contractors', 'interior painting companies',
  'exterior painting contractors', 'industrial painting companies',
  'commercial paint contractors', 'epoxy paint applicators',
  'commercial roofing contractors', 'flat roof contractors',
  'metal roofing companies', 'TPO roofing contractors',
  'residential roofing companies', 'roofing subcontractors',
  'concrete contractors', 'concrete repair companies',
  'masonry contractors', 'concrete cutting companies',
  'shotcrete contractors', 'concrete polishing companies',
  'general contractors', 'commercial general contractors',
  'construction management companies', 'renovation contractors',
  'remodeling contractors', 'tenant improvement contractors',
  'commercial plumbing contractors', 'plumbing companies',
  'industrial plumbing contractors',
  'HVAC contractors', 'commercial HVAC companies',
  'mechanical contractors', 'refrigeration contractors',
  'electrical contractors', 'commercial electricians',
  'industrial electrical companies',
  'landscaping companies', 'commercial landscaping contractors',
  'lawn care companies', 'irrigation contractors',
  'commercial janitorial services', 'office cleaning companies',
  'industrial cleaning contractors', 'pressure washing companies',
  'building cleaning services',
  'commercial photographers', 'real estate photographers',
  'wedding photographers', 'product photographers',
  'accounting firms', 'bookkeeping companies', 'CPA firms',
  'tax preparation services', 'payroll companies',
  'insurance agencies', 'commercial insurance brokers',
  'business insurance companies',
  'law firms', 'business attorneys', 'construction lawyers',
  'dental offices', 'dental practices', 'dentists',
  'chiropractic offices', 'physical therapy clinics',
  'gyms', 'fitness studios', 'personal training studios',
  'crossfit gyms', 'yoga studios',
  'auto repair shops', 'auto body shops', 'car dealerships',
  'towing companies', 'tire shops',
  'moving companies', 'commercial movers', 'storage companies',
  'staffing agencies', 'temp agencies', 'employment agencies',
  'pest control companies', 'exterminating companies',
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
  savedAt?: string;
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

  // Direct DOM access for search input
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

  // Saved leads state
  const [savedLeadKeys, setSavedLeadKeys] = useState<Set<string>>(new Set());

  // Results & Stats & Cache
  const [loading,          setLoading]          = useState(false);
  const [result,           setResult]           = useState<SearchResponse | null>(null);
  const [isCachedResults,  setIsCachedResults]  = useState(false);
  const [error,            setError]            = useState("");
  const [stats,            setStats]            = useState<{total_runs?:number;total_leads?:number;last_run?:string}|null>(null);

  const loadCachedFallback = useCallback(() => {
    try {
      const cached = localStorage.getItem("xts_last_results");
      if (cached) {
        const parsed: SearchResponse = JSON.parse(cached);
        if (parsed && ((parsed.results && parsed.results.length > 0) || (parsed.leads && parsed.leads.length > 0))) {
          setResult(parsed);
          setIsCachedResults(true);
        }
      }
    } catch (e) {
      console.error("Error reading xts_last_results from localStorage:", e);
    }
  }, []);

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(setStats).catch(() => {});

    // Load cached search results instantly on visit
    try {
      const cached = localStorage.getItem("xts_last_results");
      if (cached) {
        const parsed: SearchResponse = JSON.parse(cached);
        if (parsed && ((parsed.results && parsed.results.length > 0) || (parsed.leads && parsed.leads.length > 0))) {
          setResult(parsed);
          setIsCachedResults(true);
          if (parsed.query && searchInputRef.current) {
            searchInputRef.current.value = parsed.query;
          }
          if (parsed.city) setCity(parsed.city);
          if (parsed.state) setState(parsed.state);
        }
      }
    } catch (e) {
      console.error("Error parsing xts_last_results:", e);
    }

    // Sync saved leads
    try {
      const stored = localStorage.getItem("xts_saved_leads");
      if (stored) {
        const list: Result[] = JSON.parse(stored);
        const keys = new Set(
          list.map((r) => `${r.company_name}|${r.phone || ""}|${r.website || ""}`)
        );
        setSavedLeadKeys(keys);
      }
    } catch {
      setSavedLeadKeys(new Set());
    }
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

  const getLeadKey = (r: Result) => `${r.company_name}|${r.phone || ""}|${r.website || ""}`;

  const handleSaveLead = (r: Result) => {
    try {
      const key = getLeadKey(r);
      let savedList: Result[] = [];
      const stored = localStorage.getItem("xts_saved_leads");
      if (stored) savedList = JSON.parse(stored);

      const exists = savedList.some((item) => getLeadKey(item) === key);
      if (!exists) {
        const nowIso = new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        savedList.push({
          ...r,
          savedAt: nowIso,
        });
        localStorage.setItem("xts_saved_leads", JSON.stringify(savedList));
      }

      setSavedLeadKeys((prev) => new Set([...prev, key]));
    } catch (e) {
      console.error("Error saving lead:", e);
    }
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
    setLoading(true);
    setError("");
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

      let data: SearchResponse;

      if (!res.ok) {
        let scrapeRes = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            industry: Q, city: C, state: ST,
            mode: MD === "max" ? "level5" : MD,
            limit, country: CT,
            ...(selectedSources.length < ALL_SOURCES.length ? { sources: selectedSources } : {}),
          }),
        });
        data = await scrapeRes.json();
      } else {
        data = await res.json();
      }

      if (data.ok && ((data.results && data.results.length > 0) || (data.leads && data.leads.length > 0))) {
        setResult(data);
        setIsCachedResults(false);
        try {
          
          // Track search event for analytics
          try {
            const log = JSON.parse(localStorage.getItem("xts_search_log") || "[]");
            log.unshift({ query: Q, city: C, state: ST, country: CT === "CA" ? "Canada" : "US", mode: MD, resultsCount: data?.results?.length || 0, timestamp: new Date().toISOString() });
            localStorage.setItem("xts_search_log", JSON.stringify(log.slice(0, 200)));
          } catch {}
            localStorage.setItem("xts_last_results", JSON.stringify(data));
        } catch (e) {
          console.error("Failed to save xts_last_results:", e);
        }
      } else if (data.ok) {
        setResult(data);
        setIsCachedResults(false);
      } else {
        const errMsg = data.error || "Search service temporarily unavailable. Please try again in a moment.";
        setError(errMsg);
        loadCachedFallback();
      }
    } catch {
      setError("Search service temporarily unavailable. Please try again in a moment.");
      loadCachedFallback();
    } finally {
      setLoading(false);
    }
  }, [city, state, mode, limit, country, selectedSources, loadCachedFallback]);

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

  // Send to AI Outreach Engine
  const sendToOutreach = (leadsToSend: Result[]) => {
    try {
      const formatted = leadsToSend.map(r => ({
        company_name: (r.company_name || '').replace(/<[^>]+>/g, ''),
        name: (r.company_name || '').replace(/<[^>]+>/g, ''),
        email: r.email || '',
        phone: r.phone || '',
        source: r.source || 'Scraped Lead',
        industry: searchInputRef.current?.value || 'Services',
        address: r.address || '',
      }));
      localStorage.setItem('xts_outreach_queue', JSON.stringify(formatted));
      window.location.href = '/outreach';
    } catch {}
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
      <Navbar />

      {/* STATS BAR */}
      <div className="border-b border-gray-100 px-8 py-3 flex items-center gap-8 text-sm text-gray-500 bg-gray-50 flex-wrap">
        <span>Total Runs: <strong className="text-black">{stats?.total_runs ?? "—"}</strong></span>
        <span>Total Leads: <strong className="text-black">{stats?.total_leads ?? "—"}</strong></span>
        <span>Last Run: <strong className="text-black">{stats?.last_run ? new Date(stats.last_run).toLocaleString() : "—"}</strong></span>
        {result && <span style={{ color: "#16A34A" }} className="font-semibold">✓ {total} results {result.duration_ms ? `in ${result.duration_ms}ms` : ''}</span>}
      </div>

      <div className="max-w-5xl mx-auto px-8 py-12">
        <h1 className="font-black text-4xl mb-2">Level 5 Intelligence Search</h1>
        <p className="text-gray-500 mb-8">
          Any industry. Any city. Every source.{" "}
          <span className="font-semibold text-black">Google Maps · BBB · Apollo · Firecrawl · BrowserWorker · AI</span>
        </p>

        {/* ── ROW 1: Search Bar with Autocomplete & AI Assist ── */}
        <div className="mb-4">
          <div className="flex gap-3 flex-wrap">
            {/* Direct DOM Access Search Input + Autocomplete Dropdown Container */}
            <div ref={searchContainerRef} className="relative flex-1" style={{ minWidth: 260 }}>
              <input
                ref={searchInputRef}
                id="search-query-input"
                type="text"
                defaultValue="Epoxy flooring"
                onInput={handleSearchInput}
                onFocus={handleSearchInput}
                onKeyDown={handleKeyDown}
                placeholder="Search any industry... (plumbers, photographers, accountants)"
                className="w-full rounded-xl border-2 border-gray-200 px-5 py-3 text-base focus:outline-none focus:border-yellow-400 font-medium"
              />

              {/* Autocomplete Dropdown */}
              {showAutocomplete && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 flex items-center justify-between">
                    <span>Suggested Industries</span>
                    <span className="text-[10px] text-gray-400 font-normal">ESC to close</span>
                  </div>
                  {suggestions.map((kw, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(kw)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-yellow-50 hover:font-bold transition-all flex items-center gap-2 border-b border-gray-50 last:border-none"
                    >
                      <span className="text-gray-400 text-xs">🔍</span>
                      <span>{renderHighlighted(kw)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* AI Enhance Button */}
            <button
              type="button"
              onClick={handleAiEnhance}
              disabled={isEnhancing}
              className={`rounded-xl px-4 py-3 font-bold text-sm transition-all flex items-center gap-2 border-2 ${
                isEnhancing
                  ? "bg-purple-100 text-purple-700 border-purple-300 cursor-wait animate-pulse"
                  : "bg-purple-50 text-purple-900 border-purple-200 hover:border-purple-400 hover:bg-purple-100 shadow-sm"
              }`}
            >
              {isEnhancing ? (
                <>
                  <span className="inline-block animate-spin">✨</span>
                  <span>Enhancing...</span>
                </>
              ) : (
                <>
                  <span>✨ AI Assist</span>
                </>
              )}
            </button>

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
                    : { background: "#f0f0f0", borderColor: "#999", color: "#333", fontWeight: 600 })
                }}
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>🇺🇸</span>
                <span>UNITED STATES</span>
              </button>
              <button
                onClick={() => setCountry("CA")}
                className="flex items-center justify-center gap-2 rounded-xl border-2 transition-all font-black text-sm"
                style={{ width: 160, padding: "12px 0", flexShrink: 0,
                  ...(country === "CA"
                    ? { background: "#DC2626", borderColor: "#DC2626", color: "#fff", boxShadow: "0 2px 8px rgba(220,38,38,0.35)" }
                    : { background: "#f0f0f0", borderColor: "#999", color: "#333", fontWeight: 600 })
                }}
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>🇨🇦</span>
                <span>CANADA</span>
              </button>
            </div>

            {/* State / Province select */}
            {country === "US" ? (
              <select
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-24 rounded-xl border-2 border-gray-200 px-3 py-3 text-base focus:outline-none focus:border-yellow-400 bg-white"
              >
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <select
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-36 rounded-xl border-2 border-gray-200 px-3 py-3 text-base focus:outline-none focus:border-yellow-400 bg-white"
              >
                {CA_PROVINCES.map(p => <option key={p.code} value={p.code}>{p.code} - {p.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* ── CATEGORIZED INDUSTRY EXAMPLES ── */}
        <div className="mb-8 bg-gray-50 border border-gray-200/80 rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
            Explore Example Search Phrases
          </p>

          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-gray-200 mb-3 scrollbar-none">
            {CATEGORY_TABS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? "bg-black text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:text-black border border-gray-400 font-semibold"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Example Chips */}
          <div className="flex flex-wrap gap-2">
            {(CATEGORY_EXAMPLES[activeCategory] || []).map((phrase) => {
              const isSelected = selectedChip === phrase;
              return (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => handleChipClick(phrase)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    isSelected
                      ? "bg-yellow-400 text-black border-yellow-500 shadow-sm"
                      : "bg-gray-100 text-gray-700 border-gray-400 hover:border-yellow-400 hover:bg-yellow-50 font-medium"
                  }`}
                >
                  {phrase}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── ROW 2: Mode + Sources Button + Limit + Search CTA ── */}
        <div className="flex gap-3 items-center mb-8 flex-wrap">
          {/* Mode pills */}
          <div className="flex rounded-xl border-2 border-gray-200 p-1 bg-gray-100">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className="rounded-lg px-4 py-2 text-sm font-bold transition-all flex items-center gap-2"
                style={{
                  backgroundColor: mode === m.id ? m.color : "transparent",
                  color: mode === m.id ? "#fff" : "#374151",
                }}
              >
                <span>{m.label}</span>
                <span className="text-xs opacity-75 font-normal">({m.desc.split("·")[0].trim()})</span>
              </button>
            ))}
          </div>

          {/* PROMINENT SOURCES BUTTON */}
          <div className="relative">
            <button
              onClick={() => setShowSources(v => !v)}
              className="flex items-center gap-2 rounded-xl border-2 px-4 py-3 font-bold text-sm transition-all"
              style={{
                borderColor: selectedSources.length < ALL_SOURCES.length ? "#F59E0B" : "#E5E7EB",
                backgroundColor: selectedSources.length < ALL_SOURCES.length ? "#FEF3C7" : "#FFBE00",
                color: "#111827",
              }}
            >
              <span>🌐 Sources ({selectedSources.length}/{ALL_SOURCES.length})</span>
              <span className="text-xs">{showSources ? "▲" : "▼"}</span>
            </button>

            {/* Sources dropdown popover */}
            {showSources && (
              <div className="absolute left-0 mt-2 w-72 rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-2xl z-50">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                  <span className="font-bold text-xs uppercase tracking-wider text-gray-500">Select Sources</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedSources(ALL_SOURCES.map(s => s.id))}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      All
                    </button>
                    <span className="text-gray-300">·</span>
                    <button
                      onClick={() => setSelectedSources(["google_maps"])}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {ALL_SOURCES.map(s => {
                    const active = selectedSources.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleSource(s.id)}
                          className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                        />
                        <div>
                          <div className="font-bold text-xs text-gray-900">{s.label}</div>
                          <div className="text-[11px] text-gray-400">{s.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Limit selector */}
          <select
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            className="rounded-xl border-2 border-gray-200 px-3 py-3 text-sm font-semibold focus:outline-none focus:border-yellow-400 bg-white text-gray-700"
          >
            <option value={40}>Max 40</option>
            <option value={100}>Max 100</option>
            <option value={200}>Max 200</option>
            <option value={500}>Max 500</option>
          </select>

          {/* SEARCH BUTTON */}
          <button
            onClick={() => doSearch()}
            disabled={loading}
            className="flex-1 rounded-xl font-extrabold text-base py-3 px-8 text-black transition-all shadow-md hover:brightness-95 disabled:opacity-50"
            style={{ backgroundColor: "#FFBE00", minWidth: 160 }}
          >
            {loading ? "SEARCHING..." : "SEARCH NOW →"}
          </button>
        </div>

        {/* ── USER-FRIENDLY ERROR BANNER WITH TRY AGAIN BUTTON ── */}
        {error && (
          <div className="mb-8 p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">⚠️</span>
              <div>
                <h4 className="font-extrabold text-base text-amber-950">Search Notice</h4>
                <p className="text-sm font-medium text-amber-900 mt-0.5">{error}</p>
                {isCachedResults && (
                  <p className="text-xs font-semibold text-amber-800 mt-1">
                    📦 Showing last cached search results below from your previous session.
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => doSearch()}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-extrabold text-sm bg-amber-500 hover:bg-amber-600 text-black shadow transition-all flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
            >
              <span>🔄 Try Again</span>
            </button>
          </div>
        )}

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="my-16 text-center">
            <div className="inline-block w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-bold text-lg text-gray-800">Scraping Level 5 sources...</p>
            <p className="text-gray-400 text-sm mt-1">Google Maps · BBB · Apollo · Firecrawl · BrowserWorker</p>
          </div>
        )}

        {/* ── RESULTS ── */}
        {result?.ok && hits.length > 0 && (
          <div className="mt-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-black text-2xl">{total} Results</h2>
                  {isCachedResults && (
                    <span className="bg-yellow-100 text-yellow-900 border border-yellow-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
                      📦 Cached Results
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  for &quot;{result.query}&quot; in {result.city}, {result.state} {result.duration_ms ? `· ${result.duration_ms}ms` : ''} · {result.mode} mode
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => sendToOutreach(hits)}
                  className="rounded-xl px-5 py-2 font-bold text-sm bg-black text-white hover:bg-gray-800 transition-all flex items-center gap-2 shadow-sm"
                >
                  ✉️ Send All ({hits.length}) to AI Outreach →
                </button>
                <button
                  onClick={exportCSV}
                  className="rounded-xl px-5 py-2 font-bold text-sm border-2 border-gray-200 hover:border-yellow-400 transition-all"
                >
                  ⬇ Export CSV
                </button>
              </div>
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
                const leadKey = getLeadKey(r);
                const isSaved = savedLeadKeys.has(leadKey);

                return (
                  <div key={i} className="rounded-2xl border border-gray-200 p-5 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div>
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

                      <div className="space-y-1.5 text-xs text-gray-600 mb-4">
                        {r.phone && (
                          <div className="flex items-center gap-1.5">
                            <span>📞</span>
                            <a href={`tel:${r.phone}`} className="hover:underline font-semibold text-gray-800">
                              {r.phone}
                            </a>
                          </div>
                        )}
                        {r.email && (
                          <div className="flex items-center gap-1.5">
                            <span>✉️</span>
                            <a href={`mailto:${r.email}`} className="hover:underline text-blue-600 font-semibold truncate max-w-[200px]">
                              {r.email}
                            </a>
                          </div>
                        )}
                        {r.address && (
                          <div className="flex items-center gap-1.5">
                            <span>📍</span>
                            <span className="truncate">{r.address}{r.city ? `, ${r.city}` : ""}{r.state ? `, ${r.state}` : ""}</span>
                          </div>
                        )}
                        {r.website && (
                          <div className="flex items-center gap-1.5">
                            <span>🌐</span>
                            <a
                              href={r.website.startsWith("http") ? r.website : `https://${r.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline font-medium truncate max-w-[200px]"
                            >
                              {r.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                            </a>
                          </div>
                        )}
                        {r.rating && (
                          <div className="flex items-center gap-1 text-amber-500 font-bold">
                            <span>⭐</span>
                            <span>{r.rating}</span>
                            {r.review_count && <span className="text-gray-400 font-normal">({r.review_count} reviews)</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-md uppercase tracking-wider">
                        {r.source || "Google Maps"}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveLead(r)}
                          disabled={isSaved}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                            isSaved
                              ? "bg-green-50 text-green-700 border-green-200 cursor-default"
                              : "bg-gray-100 hover:bg-yellow-50 text-gray-800 border-gray-300 hover:border-yellow-400 font-semibold"
                          }`}
                        >
                          {isSaved ? "Saved ✓" : "💾 Save"}
                        </button>
                        <button
                          onClick={() => sendToOutreach([r])}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-800 transition-all"
                        >
                          Outreach →
                        </button>
                      </div>
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
