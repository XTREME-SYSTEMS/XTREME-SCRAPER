"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import { CRMContact, getStoredCRMContacts, saveStoredCRMContacts } from "@/lib/crm";

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
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAddToCRM = (e: React.MouseEvent, lead: SavedLead) => {
    e.stopPropagation();
    try {
      const existing: CRMContact[] = getStoredCRMContacts();

      const leadNameNorm = (lead.name || "").trim().toLowerCase();
      const leadPhoneNorm = (lead.phone || "").trim().toLowerCase();

      const alreadyExists = existing.some((c) => {
        const cNameNorm = (c.name || "").trim().toLowerCase();
        const cPhoneNorm = (c.phone || "").trim().toLowerCase();

        const nameMatches = Boolean(leadNameNorm && cNameNorm && leadNameNorm === cNameNorm);
        const phoneMatches = Boolean(leadPhoneNorm && cPhoneNorm && leadPhoneNorm === cPhoneNorm);

        return nameMatches || phoneMatches;
      });

      if (alreadyExists) {
        triggerToast("Already in CRM");
        return;
      }

      const newContact: CRMContact = {
        id: lead.id || `crm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: lead.name,
        phone: lead.phone || "",
        email: lead.email || "",
        address: lead.address || "",
        source: lead.source || "Saved Leads",
        status: "New",
        priority: "Warm",
        tags: lead.industry ? [lead.industry] : ["Saved Lead"],
        notes: lead.stars ? `Rating: ${lead.stars} stars` : "",
        emailHistory: [],
        activityLog: [
          {
            date: new Date().toISOString(),
            type: "Created",
            note: "Added to CRM from Saved Leads"
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveStoredCRMContacts([newContact, ...existing]);
      triggerToast("Added to CRM!");
    } catch (err) {
      console.error("Failed to add to CRM", err);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "Inter, system-ui, sans-serif" }}>
      <Navbar />
      <div className="px-4 sm:px-6 py-6 sm:py-10" style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111", margin: 0 }}>Saved Leads</h1>
            <p style={{ color: "#666", marginTop: 4, fontSize: 14 }}>{leads.length} lead{leads.length !== 1 ? "s" : ""} saved</p>
          </div>
          <Link href="/dashboard" style={{ padding: "10px 18px", background: "#111", color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
            + Search More
          </Link>
        </div>

        {/* Toast */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 rounded-xl shadow-2xl font-semibold text-sm flex items-center gap-2 border border-yellow-400">
            <span className="text-yellow-400 font-bold">⚡</span>
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Toolbar */}
        {leads.length > 0 && (
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            <input
              ref={filterRef}
              type="text"
              placeholder="Filter leads..."
              defaultValue=""
              onChange={() => setFilter(filterRef.current?.value || "")}
              style={{ padding: "9px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, outline: "none", flex: "1 1 180px", maxWidth: "100%", boxSizing: "border-box" }}
            />
            <button onClick={selectAll} style={{ padding: "9px 14px", border: "1px solid #FFBE00", borderRadius: 8, fontSize: 14, cursor: "pointer", background: "#FFBE00", fontWeight: 600, color: "#111" }}>Select All</button>
            <button onClick={clearAll} style={{ padding: "9px 14px", border: "1px solid #999", borderRadius: 8, fontSize: 14, cursor: "pointer", background: "#f0f0f0", fontWeight: 600, color: "#333" }}>Clear</button>
            {selected.size > 0 && (
              <>
                <button onClick={handleEmailSelected} style={{ padding: "9px 16px", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Email Selected ({selected.size}) →
                </button>
                <button onClick={handleArchive} style={{ padding: "9px 16px", background: "#d1d5db", color: "#1f2937", border: "1px solid #9ca3af", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Archive ({selected.size})
                </button>
                <button onClick={handleDelete} style={{ padding: "9px 16px", background: "#fee2e2", color: "#dc2626", border: "1px solid #f87171", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
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
              <div key={lead.id} onClick={() => toggleSelect(lead.id)} style={{ border: `1px solid ${selected.has(lead.id) ? "#111" : "#e5e5e5"}`, borderRadius: 10, padding: "16px", cursor: "pointer", background: selected.has(lead.id) ? "#f9f9f9" : "#fff", transition: "border-color 0.15s", display: "flex", gap: 12, alignItems: "flex-start", overflow: "hidden", maxWidth: "100%", boxSizing: "border-box" }}>
                <input type="checkbox" checked={selected.has(lead.id)} onChange={() => toggleSelect(lead.id)} onClick={(e) => e.stopPropagation()} style={{ marginTop: 4, width: 16, height: 16, cursor: "pointer", accentColor: "#111", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#111", overflowWrap: "anywhere", wordBreak: "break-word" }}>{lead.name}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <button
                        onClick={(e) => handleAddToCRM(e, lead)}
                        style={{
                          backgroundColor: "#FFBE00",
                          color: "#000",
                          border: "none",
                          borderRadius: "8px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                        className="hover:brightness-95 transition-all shadow-xs"
                        title="Add this lead directly to your CRM"
                      >
                        + Add to CRM
                      </button>
                      {lead.source && <span style={{ background: "#f0f0f0", padding: "3px 10px", borderRadius: 20, fontSize: 12, color: "#555" }}>{lead.source}</span>}
                      {lead.stars && <span style={{ fontSize: 13, color: "#f59e0b" }}>{"★".repeat(Math.round(lead.stars))}</span>}
                    </div>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 14, color: "#555", display: "flex", flexWrap: "wrap", gap: 12, overflowWrap: "anywhere", wordBreak: "break-word" }}>
                    {lead.phone && <span>📞 {lead.phone}</span>}
                    {lead.address && <span>📍 {lead.address}</span>}
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()} style={{ color: "#2563eb", textDecoration: "none", wordBreak: "break-all" }}>✉ {lead.email}</a>
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
