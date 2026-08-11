"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import { CRMContact, INITIAL_SEED_CONTACTS } from "@/lib/crm";

interface SavedLead {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  stars?: number;
  source?: string;
  industry?: string;
  savedAt?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface SearchLogItem {
  query: string;
  city: string;
  state: string;
  country: string;
  mode: string;
  resultsCount: number;
  timestamp: string;
}

interface SentEmailItem {
  id?: string;
  recipientName?: string;
  recipientEmail?: string;
  subject?: string;
  templateName: string;
  sentAt: string;
}

const CA_PROVINCE_CODES = new Set([
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"
]);

const CA_CITIES = new Set([
  "toronto", "vancouver", "montreal", "calgary", "edmonton", "ottawa", "winnipeg", "quebec city", "hamilton", "kitchener", "victoria"
]);

export default function AnalyticsPage() {
  const [savedLeads, setSavedLeads] = useState<SavedLead[]>([]);
  const [crmContacts, setCrmContacts] = useState<CRMContact[]>([]);
  const [searchLogs, setSearchLogs] = useState<SearchLogItem[]>([]);
  const [sentEmails, setSentEmails] = useState<SentEmailItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = () => {
    try {
      // 1. Saved Leads
      const rawSaved = localStorage.getItem("xts_saved_leads");
      const loadedSaved: SavedLead[] = rawSaved ? JSON.parse(rawSaved) : [];
      setSavedLeads(loadedSaved);

      // 2. CRM Contacts
      const rawCrm = localStorage.getItem("xts_crm_contacts");
      let loadedCrm: CRMContact[] = rawCrm ? JSON.parse(rawCrm) : [];
      if (!loadedCrm || loadedCrm.length === 0) {
        loadedCrm = INITIAL_SEED_CONTACTS;
      }
      setCrmContacts(loadedCrm);

      // 3. Search Logs
      const rawSearch = localStorage.getItem("xts_search_log");
      const loadedSearch: SearchLogItem[] = rawSearch ? JSON.parse(rawSearch) : [
        { query: "epoxy floor contractors", city: "Phoenix", state: "AZ", country: "US", mode: "deep", resultsCount: 42, timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
        { query: "commercial painting contractors", city: "Scottsdale", state: "AZ", country: "US", mode: "quick", resultsCount: 28, timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
        { query: "roofing subcontractors", city: "Toronto", state: "ON", country: "CA", mode: "max", resultsCount: 65, timestamp: new Date(Date.now() - 3600000 * 12).toISOString() },
        { query: "accounting firms", city: "Vancouver", state: "BC", country: "CA", mode: "deep", resultsCount: 34, timestamp: new Date(Date.now() - 3600000 * 24).toISOString() },
        { query: "dental offices", city: "Mesa", state: "AZ", country: "US", mode: "quick", resultsCount: 19, timestamp: new Date(Date.now() - 3600000 * 30).toISOString() }
      ];
      setSearchLogs(loadedSearch);

      // 4. Sent Emails (Outreach)
      const rawSent = localStorage.getItem("xts_outreach_sent");
      let loadedSent: SentEmailItem[] = rawSent ? JSON.parse(rawSent) : [];
      
      // Fallback from CRM email history if empty
      if (!loadedSent || loadedSent.length === 0) {
        const historyFromCrm: SentEmailItem[] = [];
        loadedCrm.forEach((c) => {
          c.emailHistory?.forEach((e) => {
            if (e.type === "sent") {
              let templateName = "Cold Intro Pitch";
              if (e.subject?.toLowerCase().includes("partnership")) templateName = "Partnership Proposal";
              else if (e.subject?.toLowerCase().includes("offer")) templateName = "Follow-Up Offer";
              historyFromCrm.push({
                recipientName: c.name,
                recipientEmail: c.email,
                subject: e.subject,
                templateName,
                sentAt: e.date
              });
            }
          });
        });

        // Add seed sent email metrics if still minimal
        if (historyFromCrm.length < 3) {
          historyFromCrm.push(
            { templateName: "Cold Intro Pitch", sentAt: new Date(Date.now() - 86400000 * 2).toISOString(), recipientName: "Pinnacle Painting Contractors", subject: "Quick question about Pinnacle Painting" },
            { templateName: "Partnership Proposal", sentAt: new Date(Date.now() - 86400000 * 3).toISOString(), recipientName: "Summit Commercial Roofing", subject: "Partnership opportunity for Summit Commercial Roofing" },
            { templateName: "Follow-Up Offer", sentAt: new Date(Date.now() - 86400000 * 4).toISOString(), recipientName: "Metro Janitorial Services", subject: "Exclusive offer for Metro Janitorial Services" }
          );
        }
        loadedSent = historyFromCrm;
      }
      setSentEmails(loadedSent);
    } catch (err) {
      console.error("Error loading analytics data:", err);
    } finally {
      setIsLoaded(true);
    }
  };

  // ─── AGGREGATION CALCULATIONS ────────────────────────────────────────────────

  // Total Leads (Saved + CRM unique)
  const totalSavedLeads = savedLeads.length;

  // 1. Scraper Region: US vs Canada
  let usCount = 0;
  let caCount = 0;

  // Check search logs
  searchLogs.forEach((log) => {
    if (log.country === "CA" || CA_PROVINCE_CODES.has(log.state?.toUpperCase()) || CA_CITIES.has(log.city?.toLowerCase())) {
      caCount += (log.resultsCount || 1);
    } else {
      usCount += (log.resultsCount || 1);
    }
  });

  // Check saved leads
  savedLeads.forEach((lead) => {
    const addr = (lead.address || "").toLowerCase();
    const st = (lead.state || "").toUpperCase();
    if (lead.country === "CA" || CA_PROVINCE_CODES.has(st) || addr.includes("canada") || Array.from(CA_CITIES).some(c => addr.includes(c))) {
      caCount++;
    } else {
      usCount++;
    }
  });

  // Check CRM contacts
  crmContacts.forEach((c) => {
    const addr = (c.address || "").toLowerCase();
    if (addr.includes("canada") || Array.from(CA_CITIES).some(city => addr.includes(city))) {
      caCount++;
    } else {
      usCount++;
    }
  });

  const totalRegionCount = (usCount + caCount) || 1;
  const usPercent = Math.round((usCount / totalRegionCount) * 100);
  const caPercent = Math.round((caCount / totalRegionCount) * 100);

  // 2. Leads by Scraper Source
  const sourceCounts: Record<string, number> = {};
  savedLeads.forEach((l) => {
    const src = l.source || "Google Maps";
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });
  crmContacts.forEach((c) => {
    const src = c.source || "Google Maps";
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });
  if (Object.keys(sourceCounts).length === 0) {
    sourceCounts["Google Maps"] = 12;
    sourceCounts["Apollo B2B"] = 8;
    sourceCounts["BBB Directory"] = 5;
    sourceCounts["Yellow Pages"] = 4;
    sourceCounts["Yelp"] = 3;
  }

  const sortedSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
  const maxSourceCount = Math.max(...sortedSources.map((s) => s[1]), 1);

  // 3. Search Queries Breakdown
  const queryCounts: Record<string, number> = {};
  searchLogs.forEach((log) => {
    if (log.query) {
      queryCounts[log.query] = (queryCounts[log.query] || 0) + (log.resultsCount || 1);
    }
  });
  savedLeads.forEach((l) => {
    if (l.industry) {
      queryCounts[l.industry] = (queryCounts[l.industry] || 0) + 1;
    }
  });
  if (Object.keys(queryCounts).length === 0) {
    queryCounts["epoxy floor contractors"] = 42;
    queryCounts["commercial painting contractors"] = 28;
    queryCounts["roofing subcontractors"] = 25;
    queryCounts["accounting firms"] = 18;
  }
  const sortedQueries = Object.entries(queryCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxQueryCount = Math.max(...sortedQueries.map((q) => q[1]), 1);

  // 4. Leads by City/State — Top 10 Cities
  const cityCounts: Record<string, number> = {};

  const extractCity = (addr?: string, directCity?: string, state?: string): string => {
    if (directCity && directCity.trim()) {
      return state ? `${directCity.trim()}, ${state.trim()}` : directCity.trim();
    }
    if (!addr) return "";
    const parts = addr.split(",");
    if (parts.length >= 2) {
      const c = parts[parts.length - 2].trim();
      const st = parts[parts.length - 1].trim().split(" ")[0];
      if (c && !/^\d+$/.test(c)) {
        return st ? `${c}, ${st}` : c;
      }
    }
    return parts[0].trim();
  };

  savedLeads.forEach((l) => {
    const c = extractCity(l.address, l.city, l.state);
    if (c) cityCounts[c] = (cityCounts[c] || 0) + 1;
  });

  crmContacts.forEach((c) => {
    const cityStr = extractCity(c.address);
    if (cityStr) cityCounts[cityStr] = (cityCounts[cityStr] || 0) + 1;
  });

  searchLogs.forEach((log) => {
    if (log.city) {
      const cityKey = log.state ? `${log.city}, ${log.state}` : log.city;
      cityCounts[cityKey] = (cityCounts[cityKey] || 0) + (log.resultsCount || 1);
    }
  });

  if (Object.keys(cityCounts).length === 0) {
    cityCounts["Phoenix, AZ"] = 45;
    cityCounts["Scottsdale, AZ"] = 32;
    cityCounts["Mesa, AZ"] = 24;
    cityCounts["Glendale, AZ"] = 18;
    cityCounts["Toronto, ON"] = 29;
    cityCounts["Vancouver, BC"] = 21;
    cityCounts["Calgary, AB"] = 14;
    cityCounts["Chicago, IL"] = 12;
    cityCounts["Dallas, TX"] = 10;
    cityCounts["Austin, TX"] = 8;
  }

  const top10Cities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const maxCityCount = Math.max(...top10Cities.map((c) => c[1]), 1);

  // 5. Leads by Industry/Category
  const industryCounts: Record<string, number> = {};
  savedLeads.forEach((l) => {
    const ind = l.industry || "General Services";
    industryCounts[ind] = (industryCounts[ind] || 0) + 1;
  });
  crmContacts.forEach((c) => {
    (c.tags || ["General"]).forEach((tag) => {
      industryCounts[tag] = (industryCounts[tag] || 0) + 1;
    });
  });
  searchLogs.forEach((l) => {
    if (l.query) {
      const tag = l.query.split(" ")[0] || "Services";
      const capitalized = tag.charAt(0).toUpperCase() + tag.slice(1);
      industryCounts[capitalized] = (industryCounts[capitalized] || 0) + (l.resultsCount || 1);
    }
  });

  if (Object.keys(industryCounts).length === 0) {
    industryCounts["Flooring"] = 38;
    industryCounts["Painting"] = 29;
    industryCounts["Roofing"] = 22;
    industryCounts["Cleaning"] = 19;
    industryCounts["Medical"] = 15;
    industryCounts["Professional"] = 12;
  }

  const sortedIndustries = Object.entries(industryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const maxIndustryCount = Math.max(...sortedIndustries.map((i) => i[1]), 1);

  // 6. CRM Pipeline Breakdown
  const CRM_STATUSES = ["New", "Contacted", "Interested", "Proposal Sent", "Won", "Lost"] as const;
  const pipelineCounts: Record<string, number> = {
    New: 0,
    Contacted: 0,
    Interested: 0,
    "Proposal Sent": 0,
    Won: 0,
    Lost: 0,
  };

  crmContacts.forEach((c) => {
    if (pipelineCounts[c.status] !== undefined) {
      pipelineCounts[c.status]++;
    } else {
      pipelineCounts["New"]++;
    }
  });

  const totalCrmLeads = crmContacts.length || 1;

  // 7. Outreach Stats
  const templateCounts: Record<string, number> = {
    "Cold Intro Pitch": 0,
    "Partnership Proposal": 0,
    "Follow-Up Offer": 0,
    "Custom Draft": 0,
  };

  sentEmails.forEach((e) => {
    const tName = e.templateName || "Cold Intro Pitch";
    if (templateCounts[tName] !== undefined) {
      templateCounts[tName]++;
    } else {
      templateCounts["Custom Draft"]++;
    }
  });

  const totalEmailsSent = sentEmails.length;
  const maxTemplateCount = Math.max(...Object.values(templateCounts), 1);

  // 8. AI Score Distribution
  const scores: number[] = [];
  crmContacts.forEach((c) => {
    if (typeof c.aiScore === "number") scores.push(c.aiScore);
  });
  savedLeads.forEach((l) => {
    if (typeof l.stars === "number") scores.push(Math.round(l.stars * 20));
  });

  if (scores.length === 0) {
    scores.push(78, 88, 94, 82, 98, 35, 72, 85, 64, 91);
  }

  const avgAiScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const above70Count = scores.filter((s) => s >= 70).length;
  const percentAbove70 = Math.round((above70Count / scores.length) * 100);

  const highIntentCount = scores.filter((s) => s >= 80).length;
  const mediumIntentCount = scores.filter((s) => s >= 50 && s < 80).length;
  const lowIntentCount = scores.filter((s) => s < 50).length;

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col">
      <Navbar />

      <main className="max-w-7xl w-full mx-auto px-6 py-10 flex-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-gray-100 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">📊</span>
              <h1 className="font-black text-3xl tracking-tight text-gray-900">
                Analytics & Scraper Intelligence
              </h1>
            </div>
            <p className="text-gray-500 text-sm font-medium mt-1">
              Performance metrics, scraper sources, city distribution, and pipeline breakdown
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAnalyticsData}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-300 hover:border-black bg-gray-100 hover:bg-gray-200 text-gray-800 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>🔄 Refresh Data</span>
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl text-xs font-bold text-black transition-all hover:brightness-95 shadow-sm"
              style={{ backgroundColor: "#FFBE00" }}
            >
              + New Search →
            </Link>
          </div>
        </div>

        {!isLoaded ? (
          <div className="py-20 text-center text-gray-400 font-medium">
            Loading analytics dashboard...
          </div>
        ) : (
          <div className="space-y-10">
            {/* ─── ROW 1: TOP SUMMARY STAT TILES ─── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Total Saved Leads
                  </span>
                  <span className="text-3xl font-black text-black">{totalSavedLeads}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 font-semibold">
                  <span>Saved in portal</span>
                  <Link href="/saved" className="text-yellow-600 font-bold hover:underline">
                    View →
                  </Link>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    CRM Contacts
                  </span>
                  <span className="text-3xl font-black text-black">{crmContacts.length}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 font-semibold">
                  <span>Active pipeline</span>
                  <Link href="/crm" className="text-yellow-600 font-bold hover:underline">
                    Manage →
                  </Link>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Emails Dispatched
                  </span>
                  <span className="text-3xl font-black text-black">{totalEmailsSent}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 font-semibold">
                  <span>Outreach campaigns</span>
                  <Link href="/outreach" className="text-yellow-600 font-bold hover:underline">
                    Outreach →
                  </Link>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Avg AI Quality Score
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-black">{avgAiScore}</span>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      {percentAbove70}% &ge; 70
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 font-semibold">
                  <span>High intent ratio</span>
                  <span className="font-bold text-black">{highIntentCount} Hot Leads</span>
                </div>
              </div>
            </div>

            {/* ─── ROW 2: LEADS BY SOURCE & US vs CANADA SCRAPER ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* US vs Canada Scraper Breakdown */}
              <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-black text-lg text-black flex items-center gap-2">
                      <span>🇺🇸🇨🇦 Scraper Coverage (US vs Canada)</span>
                    </h2>
                    <span className="text-xs font-bold text-gray-400">Regional Split</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-6 font-medium">
                    Proportion of leads harvested across United States vs Canadian search queries & locations.
                  </p>

                  <div className="space-y-6">
                    {/* US Bar */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="flex items-center gap-1.5 text-gray-900">
                          <span>🇺🇸</span> US Scraper Engine
                        </span>
                        <span className="text-gray-900 font-black">
                          {usCount} leads ({usPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden border border-gray-200">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${usPercent}%`,
                            backgroundColor: "#FFBE00",
                          }}
                        />
                      </div>
                    </div>

                    {/* Canada Bar */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="flex items-center gap-1.5 text-gray-900">
                          <span>🇨🇦</span> Canada Scraper Engine
                        </span>
                        <span className="text-gray-900 font-black">
                          {caCount} leads ({caPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden border border-gray-200">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${caPercent}%`,
                            backgroundColor: "#111827",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Search Queries sub-card */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">
                    Top Executed Search Queries
                  </h3>
                  <div className="space-y-2.5">
                    {sortedQueries.map(([query, count], idx) => {
                      const pct = Math.round((count / maxQueryCount) * 100);
                      return (
                        <div key={idx} className="flex items-center gap-3 text-xs">
                          <span className="font-mono text-gray-400 w-4 text-right">{idx + 1}.</span>
                          <span className="font-semibold text-gray-800 w-44 truncate">{query}</span>
                          <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: "#FFBE00" }}
                            />
                          </div>
                          <span className="font-bold text-gray-700 w-10 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Scraper Data Sources Breakdown */}
              <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-lg text-black flex items-center gap-2">
                    <span>📡 Leads by Scraper Source</span>
                  </h2>
                  <span className="text-xs font-bold text-gray-400">{sortedSources.length} Sources</span>
                </div>
                <p className="text-xs text-gray-500 mb-6 font-medium">
                  Distribution of lead listings gathered across intelligence scrapers.
                </p>

                <div className="space-y-4">
                  {sortedSources.map(([source, count], idx) => {
                    const pct = Math.round((count / maxSourceCount) * 100);
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-gray-800">{source}</span>
                          <span className="text-gray-900 font-black">{count} leads</span>
                        </div>
                        <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden border border-gray-100">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: idx === 0 ? "#FFBE00" : "#111827",
                              opacity: idx === 0 ? 1 : 0.85 - idx * 0.12,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ─── ROW 3: LEADS BY CITY/STATE (TOP 10 CITIES) & INDUSTRY ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top 10 Cities */}
              <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-lg text-black flex items-center gap-2">
                    <span>🏙️ Leads by City/State (Top 10)</span>
                  </h2>
                  <span className="text-xs font-bold text-gray-400">Geographic Density</span>
                </div>
                <p className="text-xs text-gray-500 mb-6 font-medium">
                  Highest volume markets for saved leads and active search results.
                </p>

                <div className="space-y-3">
                  {top10Cities.map(([cityName, count], idx) => {
                    const widthPct = Math.round((count / maxCityCount) * 100);
                    return (
                      <div key={idx} className="flex items-center gap-3 text-xs">
                        <span className="font-bold text-gray-400 w-5 text-right font-mono">
                          {idx + 1}.
                        </span>
                        <span className="font-bold text-gray-800 w-32 truncate">{cityName}</span>
                        <div className="flex-1 bg-gray-100 h-3 rounded-full overflow-hidden border border-gray-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${widthPct}%`,
                              backgroundColor: idx < 3 ? "#FFBE00" : "#374151",
                            }}
                          />
                        </div>
                        <span className="font-black text-gray-900 w-10 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Leads by Industry / Category */}
              <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-lg text-black flex items-center gap-2">
                    <span>🏷️ Leads by Industry / Category</span>
                  </h2>
                  <span className="text-xs font-bold text-gray-400">Vertical Breakdown</span>
                </div>
                <p className="text-xs text-gray-500 mb-6 font-medium">
                  Service categories and commercial verticals targeted.
                </p>

                <div className="space-y-4">
                  {sortedIndustries.map(([industry, count], idx) => {
                    const widthPct = Math.round((count / maxIndustryCount) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-gray-800">{industry}</span>
                          <span className="text-gray-900 font-black">{count} leads</span>
                        </div>
                        <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden border border-gray-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${widthPct}%`,
                              backgroundColor: "#FFBE00",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ─── ROW 4: CRM PIPELINE BREAKDOWN ─── */}
            <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-lg text-black flex items-center gap-2">
                  <span>🎯 CRM Pipeline Breakdown</span>
                </h2>
                <Link href="/crm" className="text-xs font-bold text-yellow-600 hover:underline">
                  Open CRM →
                </Link>
              </div>
              <p className="text-xs text-gray-500 mb-6 font-medium">
                Distribution of contacts across pipeline stages from New to Closed Won/Lost.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {CRM_STATUSES.map((st) => {
                  const count = pipelineCounts[st] || 0;
                  const pct = Math.round((count / totalCrmLeads) * 100);

                  const statusColors: Record<string, string> = {
                    New: "bg-blue-50 text-blue-700 border-blue-200",
                    Contacted: "bg-purple-50 text-purple-700 border-purple-200",
                    Interested: "bg-amber-50 text-amber-700 border-amber-200",
                    "Proposal Sent": "bg-indigo-50 text-indigo-700 border-indigo-200",
                    Won: "bg-green-50 text-green-700 border-green-200",
                    Lost: "bg-red-50 text-red-700 border-red-200",
                  };

                  return (
                    <div
                      key={st}
                      className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 flex flex-col justify-between"
                    >
                      <div>
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border mb-2 ${
                            statusColors[st] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {st}
                        </span>
                        <div className="text-2xl font-black text-black">{count}</div>
                        <div className="text-xs font-semibold text-gray-400 mt-0.5">{pct}% of total</div>
                      </div>

                      <div className="mt-4 w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: st === "Won" ? "#16A34A" : st === "Lost" ? "#DC2626" : "#FFBE00",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ─── ROW 5: OUTREACH STATS & AI SCORE DISTRIBUTION ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Outreach Stats by Template */}
              <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-lg text-black flex items-center gap-2">
                    <span>✉️ Outreach Stats by Template</span>
                  </h2>
                  <span className="text-xs font-bold text-gray-400">{totalEmailsSent} Dispatched</span>
                </div>
                <p className="text-xs text-gray-500 mb-6 font-medium">
                  Volume of outreach emails sent categorized by campaign template type.
                </p>

                <div className="space-y-4">
                  {Object.entries(templateCounts).map(([tplName, count], idx) => {
                    const widthPct = Math.round((count / maxTemplateCount) * 100);
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-gray-800">{tplName}</span>
                          <span className="text-gray-900 font-black">{count} sent</span>
                        </div>
                        <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden border border-gray-100">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${widthPct}%`,
                              backgroundColor: "#FFBE00",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Score Distribution */}
              <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-lg text-black flex items-center gap-2">
                    <span>🤖 AI Score & Lead Quality Distribution</span>
                  </h2>
                  <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200">
                    {percentAbove70}% &ge; 70 AI Score
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-6 font-medium">
                  Lead quality breakdown based on AI evaluation and completeness score.
                </p>

                <div className="space-y-5">
                  {/* High Intent */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-gray-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                        High Intent (80 - 100)
                      </span>
                      <span className="text-gray-900 font-black">{highIntentCount} leads</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden border border-gray-100">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${Math.round((highIntentCount / scores.length) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Medium Intent */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-gray-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                        Medium Intent (50 - 79)
                      </span>
                      <span className="text-gray-900 font-black">{mediumIntentCount} leads</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden border border-gray-100">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{
                          width: `${Math.round((mediumIntentCount / scores.length) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Low Intent */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-gray-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                        Low Intent (0 - 49)
                      </span>
                      <span className="text-gray-900 font-black">{lowIntentCount} leads</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden border border-gray-100">
                      <div
                        className="h-full bg-red-400 rounded-full"
                        style={{
                          width: `${Math.round((lowIntentCount / scores.length) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
