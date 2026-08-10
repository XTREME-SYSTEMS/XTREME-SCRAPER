"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";

interface ArchivedLead {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  stars?: number;
  source?: string;
  archivedAt?: string;
}

export default function ArchivePage() {
  const [leads, setLeads] = useState<ArchivedLead[]>([]);

  useEffect(() => {
    try {
      const s = localStorage.getItem("xts_archived_leads");
      if (s) setLeads(JSON.parse(s));
    } catch {}
  }, []);

  const handleRestore = (id: string) => {
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;
    const { archivedAt, ...restored } = lead;
    void archivedAt;
    const savedRaw = localStorage.getItem("xts_saved_leads") || "[]";
    const savedLeads = JSON.parse(savedRaw);
    localStorage.setItem("xts_saved_leads", JSON.stringify([restored, ...savedLeads]));
    const updated = leads.filter((l) => l.id !== id);
    localStorage.setItem("xts_archived_leads", JSON.stringify(updated));
    setLeads(updated);
  };

  const handleDelete = (id: string) => {
    const updated = leads.filter((l) => l.id !== id);
    localStorage.setItem("xts_archived_leads", JSON.stringify(updated));
    setLeads(updated);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "Inter, system-ui, sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111", margin: 0 }}>Archive</h1>
          <p style={{ color: "#666", marginTop: 4, fontSize: 14 }}>{leads.length} archived lead{leads.length !== 1 ? "s" : ""}</p>
        </div>

        {leads.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {leads.map((lead) => (
              <div key={lead.id} style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>{lead.name}</div>
                  <div style={{ marginTop: 5, fontSize: 13, color: "#777", display: "flex", flexWrap: "wrap", gap: 14 }}>
                    {lead.phone && <span>{lead.phone}</span>}
                    {lead.address && <span>{lead.address}</span>}
                    {lead.email && <a href={`mailto:${lead.email}`} style={{ color: "#2563eb", textDecoration: "none" }}>{lead.email}</a>}
                    {lead.archivedAt && <span style={{ color: "#bbb" }}>Archived {new Date(lead.archivedAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleRestore(lead.id)} style={{ padding: "8px 14px", background: "#111", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Restore
                  </button>
                  <button onClick={() => handleDelete(lead.id)} style={{ padding: "8px 14px", background: "#fee2e2", color: "#dc2626", border: "1px solid #f87171", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#bbb" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
            <p style={{ fontWeight: 600, color: "#999", fontSize: 18 }}>Archive is empty</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>Leads you archive from Saved Leads will appear here</p>
            <Link href="/saved" style={{ display: "inline-block", marginTop: 20, padding: "12px 24px", background: "#111", color: "#fff", borderRadius: 8, fontWeight: 600, textDecoration: "none" }}>
              View Saved Leads
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
