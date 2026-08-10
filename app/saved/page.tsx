"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";

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
}

export default function SavedPage() {
  const filterRef = useRef<HTMLInputElement>(null);
  const [leads, setLeads] = useState<SavedLead[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");

  useEffect(() => {
    try {
      const s = localStorage.getItem("xts_saved_leads");
      if (s) setLeads(JSON.parse(s));
    } catch {}
  }, []);

  const filtered = leads.filter((l) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return l.name?.toLowerCase().includes(q) || l.address?.toLowerCase().includes(q) || l.industry?.toLowerCase().includes(q);
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(filtered.map((l) => l.id)));
  const clearAll = () => setSelected(new Set());

  const handleDelete = () => {
    if (!selected.size) return;
    const updated = leads.filter((l) => !selected.has(l.id));
    localStorage.setItem("xts_saved_leads", JSON.stringify(updated));
    setLeads(updated);
    setSelected(new Set());
  };

  const handleArchive = () => {
    if (!selected.size) return;
    const toArchive = leads.filter((l) => selected.has(l.id)).map((l) => ({ ...l, archivedAt: new Date().toISOString() }));
    const existing = JSON.parse(localStorage.getItem("xts_archived_leads") || "[]");
    localStorage.setItem("xts_archived_leads", JSON.stringify([...toArchive, ...existing]));
    const updated = leads.filter((l) => !selected.has(l.id));
    localStorage.setItem("xts_saved_leads", JSON.stringify(updated));
    setLeads(updated);
    setSelected(new Set());
  };

  const handleEmailSelected = () => {
    const queue = leads.filter((l) => selected.has(l.id));
    localStorage.setItem("xts_outreach_queue", JSON.stringify(queue));
    window.location.href = "/outreach";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "Inter, system-ui, sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111", margin: 0 }}>Saved Leads</h1>
            <p style={{ color: "#666", marginTop: 4, fontSize: 14 }}>{leads.length} lead{leads.length !== 1 ? "s" : ""} saved</p>
          </div>
          <Link href="/dashboard" style={{ padding: "10px 18px", background: "#111", color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
            + Search More
          </Link>
        </div>

        {/* Toolbar */}
        {leads.length > 0 && (
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            <input
              ref={filterRef}
              type="text"
              placeholder="Filter leads..."
              defaultValue=""
              onChange={() => setFilter(filterRef.current?.value || "")}
              style={{ padding: "9px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, outline: "none", minWidth: 200 }}
            />
            <button onClick={selectAll} style={{ padding: "9px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, cursor: "pointer", background: "#fff" }}>Select All</button>
            <button onClick={clearAll} style={{ padding: "9px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, cursor: "pointer", background: "#fff" }}>Clear</button>
            {selected.size > 0 && (
              <>
                <button onClick={handleEmailSelected} style={{ padding: "9px 16px", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Email Selected ({selected.size}) →
                </button>
                <button onClick={handleArchive} style={{ padding: "9px 16px", background: "#fff", color: "#555", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>
                  Archive ({selected.size})
                </button>
                <button onClick={handleDelete} style={{ padding: "9px 16px", background: "#fff", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>
                  Delete ({selected.size})
                </button>
              </>
            )}
          </div>
        )}

        {/* Lead cards */}
        {filtered.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((lead) => (
              <div key={lead.id} onClick={() => toggleSelect(lead.id)} style={{ border: `1px solid ${selected.has(lead.id) ? "#111" : "#e5e5e5"}`, borderRadius: 10, padding: "16px 20px", cursor: "pointer", background: selected.has(lead.id) ? "#f9f9f9" : "#fff", transition: "border-color 0.15s", display: "flex", gap: 16, alignItems: "flex-start" }}>
                <input type="checkbox" checked={selected.has(lead.id)} onChange={() => toggleSelect(lead.id)} onClick={(e) => e.stopPropagation()} style={{ marginTop: 4, width: 16, height: 16, cursor: "pointer", accentColor: "#111" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>{lead.name}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {lead.source && <span style={{ background: "#f0f0f0", padding: "3px 10px", borderRadius: 20, fontSize: 12, color: "#555" }}>{lead.source}</span>}
                      {lead.stars && <span style={{ fontSize: 13, color: "#f59e0b" }}>{"★".repeat(Math.round(lead.stars))}</span>}
                    </div>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 14, color: "#555", display: "flex", flexWrap: "wrap", gap: 16 }}>
                    {lead.phone && <span>📞 {lead.phone}</span>}
                    {lead.address && <span>📍 {lead.address}</span>}
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()} style={{ color: "#2563eb", textDecoration: "none" }}>✉ {lead.email}</a>
                    ) : (
                      <span style={{ color: "#bbb" }}>No email listed</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#bbb" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔖</div>
            <p style={{ fontWeight: 600, color: "#999", fontSize: 18 }}>{filter ? "No leads match your filter" : "No saved leads yet"}</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>{filter ? "Try clearing the filter" : "Search for businesses and save leads from the results"}</p>
            {!filter && (
              <Link href="/dashboard" style={{ display: "inline-block", marginTop: 20, padding: "12px 24px", background: "#111", color: "#fff", borderRadius: 8, fontWeight: 600, textDecoration: "none" }}>
                Start Searching
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
