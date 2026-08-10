"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export interface FollowUpItem {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone?: string;
  dueDate: string;
  template: string;
  status: "pending" | "dismissed" | "sent";
  createdAt: string;
}

export function scheduleFollowUps(contactId: string, contactName: string, contactPhone?: string) {
  const existing: FollowUpItem[] = JSON.parse(localStorage.getItem("xts_followups") || "[]");
  // Remove any existing pending follow-ups for this contact
  const cleaned = existing.filter((f) => f.contactId !== contactId || f.status !== "pending");

  const now = new Date();
  const newItems: FollowUpItem[] = [
    {
      id: `${contactId}-d3-${Date.now()}`,
      contactId,
      contactName,
      contactPhone,
      dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      template: "Follow-Up #1",
      status: "pending",
      createdAt: now.toISOString(),
    },
    {
      id: `${contactId}-d7-${Date.now() + 1}`,
      contactId,
      contactName,
      contactPhone,
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      template: "Follow-Up #2",
      status: "pending",
      createdAt: now.toISOString(),
    },
    {
      id: `${contactId}-d14-${Date.now() + 2}`,
      contactId,
      contactName,
      contactPhone,
      dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      template: "Last Touch",
      status: "pending",
      createdAt: now.toISOString(),
    },
  ];

  localStorage.setItem("xts_followups", JSON.stringify([...newItems, ...cleaned]));
}

export function getOverdueCount(): number {
  try {
    const items: FollowUpItem[] = JSON.parse(localStorage.getItem("xts_followups") || "[]");
    const now = new Date();
    return items.filter((f) => f.status === "pending" && new Date(f.dueDate) <= now).length;
  } catch { return 0; }
}

export default function FollowUpQueue() {
  const [items, setItems] = useState<FollowUpItem[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const load = () => {
      const raw: FollowUpItem[] = JSON.parse(localStorage.getItem("xts_followups") || "[]");
      const now = new Date();
      // Show items due today or overdue
      const due = raw.filter((f) => f.status === "pending" && new Date(f.dueDate) <= now);
      setItems(due);
    };
    load();
    const iv = setInterval(load, 60000);
    return () => clearInterval(iv);
  }, []);

  const dismiss = (id: string) => {
    const all: FollowUpItem[] = JSON.parse(localStorage.getItem("xts_followups") || "[]");
    const updated = all.map((f) => f.id === id ? { ...f, status: "dismissed" as const } : f);
    localStorage.setItem("xts_followups", JSON.stringify(updated));
    setItems((prev) => prev.filter((f) => f.id !== id));
  };

  if (!items.length) return null;

  return (
    <div style={{ background: "#FEF3C7", border: "1px solid #FFBE00", borderRadius: 10, marginBottom: 20, overflow: "hidden" }}>
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", cursor: "pointer", background: "#FFBE00" }}
      >
        <span style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>
          🔔 {items.length} Follow-Up{items.length > 1 ? "s" : ""} Due Now
        </span>
        <span style={{ fontSize: 12, color: "#333" }}>{collapsed ? "▼ Show" : "▲ Hide"}</span>
      </div>
      {!collapsed && (
        <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", borderRadius: 8, padding: "10px 14px", border: "1px solid #fde68a", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{item.contactName}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{item.template} • {item.contactPhone || "No phone"} • Due: {new Date(item.dueDate).toLocaleDateString()}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Link
                  href={`/outreach?contact=${encodeURIComponent(item.contactName)}&phone=${encodeURIComponent(item.contactPhone || "")}&template=${encodeURIComponent(item.template)}`}
                  style={{ padding: "7px 14px", background: "#111", color: "#fff", borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: "none" }}
                >
                  Send Now
                </Link>
                <button
                  onClick={() => dismiss(item.id)}
                  style={{ padding: "7px 12px", background: "#e5e5e5", color: "#333", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
