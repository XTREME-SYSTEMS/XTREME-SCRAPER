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
}

interface OutreachLogEntry {
  to: string;
  subject: string;
  sentAt: string;
  status: string;
  id?: string;
}

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

const TEMPLATES = [
  {
    name: "Cold Intro Pitch",
    subject: "Quick question about {company_name}",
    body: "Hi Team at {company_name},\n\nI noticed your business online in {city} and wanted to reach out. We specialize in helping local service providers expand their reach and acquire high-intent leads.\n\nWould you be open to a brief 5-minute chat this week?\n\nBest regards,\n[Your Name]",
  },
  {
    name: "Partnership Proposal",
    subject: "Partnership opportunity for {company_name}",
    body: "Hello {company_name},\n\nWe are reaching out to top-rated local providers in {city}. We have incoming client requests in your service vertical and are looking for a reliable partner to handle overflows.\n\nLet us know if you have bandwidth for new clients.\n\nBest,\n[Your Name]",
  },
  {
    name: "Follow-Up Offer",
    subject: "Exclusive offer for {company_name}",
    body: "Hi {company_name},\n\nFollowing up on our service offerings for businesses in {city}. We can deliver qualified local customer inquiries directly to your team.\n\nReply to this email if you'd like a quick preview of available leads in your area.\n\nWarm regards,\n[Your Name]",
  },
];

export default function OutreachPage() {
  const [recipients, setRecipients] = useState<SavedLead[]>([]);
  const [sentCount, setSentCount] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");

  // Email sending state
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    currentRecipient: string;
  } | null>(null);

  // Sent History state
  const [sentHistory, setSentHistory] = useState<OutreachLogEntry[]>([]);
  const [historySearch, setHistorySearch] = useState("");

  // Toast notification system
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Direct DOM references for email drafting inputs
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadRecipients();
    loadSentHistory();
  }, []);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadRecipients = () => {
    try {
      const storedOutreach = localStorage.getItem("xts_outreach_leads");
      const storedQueue = localStorage.getItem("xts_outreach_queue");

      if (storedOutreach) {
        setRecipients(JSON.parse(storedOutreach));
      } else if (storedQueue) {
        setRecipients(JSON.parse(storedQueue));
      } else {
        // Fallback to all saved leads if none explicitly selected
        const savedStored = localStorage.getItem("xts_saved_leads");
        if (savedStored) {
          const allSaved: SavedLead[] = JSON.parse(savedStored);
          setRecipients(allSaved);
        }
      }
    } catch (e) {
      console.error("Failed to load outreach recipients:", e);
      setRecipients([]);
    }
  };

  const loadSentHistory = () => {
    try {
      const logRaw = localStorage.getItem("xts_outreach_log");
      if (logRaw) {
        setSentHistory(JSON.parse(logRaw));
      } else {
        // Fallback check for legacy sent key if present
        const legacyRaw = localStorage.getItem("xts_outreach_sent");
        if (legacyRaw) {
          const legacyItems = JSON.parse(legacyRaw);
          const converted: OutreachLogEntry[] = legacyItems.map((item: any) => ({
            to: item.recipientEmail || item.to || "Unknown",
            subject: item.subject || "No Subject",
            sentAt: item.sentAt || new Date().toISOString(),
            status: "sent",
            id: item.id,
          }));
          setSentHistory(converted);
        }
      }
    } catch (e) {
      console.error("Failed to load sent history:", e);
      setSentHistory([]);
    }
  };

  const personalizeText = (template: string, lead: SavedLead): string => {
    if (!template) return "";
    let text = template;
    const companyName = lead.name || "your company";
    const phone = lead.phone || "";

    let city = "your area";
    if (lead.address) {
      const parts = lead.address.split(",");
      if (parts[0]) city = parts[0].trim();
    }

    text = text.replace(/\{company_name\}/g, companyName);
    text = text.replace(/\{city\}/g, city);
    text = text.replace(/\{phone\}/g, phone);
    return text;
  };

  const applyTemplate = (tpl: (typeof TEMPLATES)[0]) => {
    if (subjectRef.current) subjectRef.current.value = tpl.subject;
    if (bodyRef.current) bodyRef.current.value = tpl.body;
  };

  const handleSendCampaign = async () => {
    const subject = subjectRef.current?.value || "";
    const body = bodyRef.current?.value || "";

    if (!recipients.length) {
      addToast("error", "No recipients selected for outreach.");
      return;
    }
    if (!subject.trim()) {
      addToast("error", "Please enter an email subject line.");
      return;
    }

    setIsSending(true);
    const total = recipients.length;
    let successfulSends = 0;
    const newLogEntries: OutreachLogEntry[] = [];
    const sessionId = `session_${Date.now()}`;

    for (let i = 0; i < total; i++) {
      const r = recipients[i];
      const personalizedSub = personalizeText(subject, r);
      const personalizedBody = personalizeText(body, r);
      const targetEmail = r.email?.trim();

      setProgress({
        current: i + 1,
        total,
        currentRecipient: r.name,
      });

      if (!targetEmail) {
        const logEntry: OutreachLogEntry = {
          to: `${r.name} (No Email)`,
          subject: personalizedSub,
          sentAt: new Date().toISOString(),
          status: "failed: missing recipient email",
        };
        newLogEntries.push(logEntry);
        addToast("error", `❌ Skipping ${r.name}: No email address listed`);
        await new Promise((res) => setTimeout(res, 200));
        continue;
      }

      try {
        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": sessionId,
          },
          body: JSON.stringify({
            to: targetEmail,
            subject: personalizedSub,
            body: personalizedBody,
            from_name: "XTS Outreach",
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          successfulSends++;
          const logEntry: OutreachLogEntry = {
            to: targetEmail,
            subject: personalizedSub,
            sentAt: new Date().toISOString(),
            status: "sent",
            id: data.id,
          };
          newLogEntries.push(logEntry);
          addToast("success", `✅ Email sent to ${r.name} (${targetEmail})`);
        } else {
          const errMsg = data.error || "Failed to send email";
          const logEntry: OutreachLogEntry = {
            to: targetEmail,
            subject: personalizedSub,
            sentAt: new Date().toISOString(),
            status: `failed: ${errMsg}`,
          };
          newLogEntries.push(logEntry);
          addToast("error", `❌ Failed for ${r.name}: ${errMsg}`);
        }
      } catch (err: any) {
        const errMsg = err.message || "Network error";
        const logEntry: OutreachLogEntry = {
          to: targetEmail,
          subject: personalizedSub,
          sentAt: new Date().toISOString(),
          status: `failed: ${errMsg}`,
        };
        newLogEntries.push(logEntry);
        addToast("error", `❌ Failed for ${r.name}: ${errMsg}`);
      }

      await new Promise((res) => setTimeout(res, 300));
    }

    // Save logs to localStorage 'xts_outreach_log'
    try {
      const existingLogRaw = localStorage.getItem("xts_outreach_log");
      const existingLog: OutreachLogEntry[] = existingLogRaw
        ? JSON.parse(existingLogRaw)
        : [];
      const updatedLog = [...newLogEntries, ...existingLog];
      localStorage.setItem("xts_outreach_log", JSON.stringify(updatedLog));
      setSentHistory(updatedLog);
    } catch (e) {
      console.error("Failed to update xts_outreach_log:", e);
    }

    // Clear queue
    localStorage.removeItem("xts_outreach_leads");
    localStorage.removeItem("xts_outreach_queue");

    setIsSending(false);
    setProgress(null);
    setSentCount(successfulSends);
  };

  const removeRecipient = (index: number) => {
    const updated = recipients.filter((_, i) => i !== index);
    setRecipients(updated);
    localStorage.setItem("xts_outreach_leads", JSON.stringify(updated));
  };

  const clearSentHistory = () => {
    if (confirm("Are you sure you want to clear your sent email history log?")) {
      localStorage.removeItem("xts_outreach_log");
      setSentHistory([]);
      addToast("info", "Sent history log cleared.");
    }
  };

  const filteredHistory = sentHistory.filter((item) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      item.to.toLowerCase().includes(q) ||
      item.subject.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col">
      <Navbar />

      {/* Floating Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto px-4 py-3 rounded-xl shadow-xl border font-semibold text-xs flex items-center justify-between gap-3 transition-all animate-fadeIn ${
                t.type === "success"
                  ? "bg-black text-white border-green-500"
                  : t.type === "error"
                  ? "bg-red-950 text-white border-red-500"
                  : "bg-gray-900 text-white border-gray-700"
              }`}
            >
              <span className="truncate">{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="text-gray-400 hover:text-white font-bold text-sm px-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sending Progress Overlay */}
      {isSending && progress && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xl max-w-md w-full text-center">
            <div
              className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center mx-auto mb-4 animate-bounce"
              style={{ backgroundColor: "#FFBE00" }}
            >
              <span className="text-xl">🚀</span>
            </div>
            <h3 className="font-extrabold text-lg text-gray-900 mb-1">
              Dispatching Email Campaign
            </h3>
            <p className="text-xs font-semibold text-gray-600 mb-4">
              Sending {progress.current} of {progress.total}:{" "}
              <span className="font-bold text-black">{progress.currentRecipient}</span>
            </p>
            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
              <div
                className="h-full transition-all duration-300 ease-out"
                style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                  backgroundColor: "#FFBE00",
                }}
              />
            </div>
            <p className="text-[11px] text-gray-400 font-medium mt-3">
              Sending via Resend API • Please keep this page open
            </p>
          </div>
        </div>
      )}

      <main className="max-w-6xl w-full mx-auto px-8 py-10 flex-1">
        {/* Header and Navigation Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-black text-3xl tracking-tight mb-1">Email Outreach Campaign</h1>
            <p className="text-gray-500 text-sm font-medium">
              Draft and dispatch personalized outreach campaigns to your selected leads
            </p>
          </div>

          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("compose")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "compose"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              ✉️ Compose Campaign
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              📜 Sent History
              {sentHistory.length > 0 && (
                <span
                  className="text-black text-[10px] px-1.5 py-0.5 rounded-full font-black"
                  style={{ backgroundColor: "#FFBE00" }}
                >
                  {sentHistory.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Compose / Send View */}
        {activeTab === "compose" && (
          <>
            {sentCount !== null ? (
              <div className="p-8 bg-green-50 border-2 border-green-200 rounded-2xl text-center my-8">
                <div className="text-5xl mb-3">✉️🎉</div>
                <h2 className="font-black text-2xl text-green-900 mb-2">
                  Campaign Dispatched Successfully!
                </h2>
                <p className="text-sm font-semibold text-green-700 max-w-md mx-auto mb-6">
                  Outreach messages processed and logged for {sentCount} recipient(s).
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => {
                      setSentCount(null);
                      loadRecipients();
                    }}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm bg-green-800 text-white hover:bg-green-900 transition-all"
                  >
                    Send Another Campaign
                  </button>
                  <button
                    onClick={() => {
                      setSentCount(null);
                      setActiveTab("history");
                    }}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm border border-green-600 text-green-800 hover:bg-green-100 transition-all"
                  >
                    View Sent History →
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Recipients list */}
                <div className="lg:col-span-1 bg-gray-50 border border-gray-200 rounded-2xl p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <h2 className="font-bold text-lg text-gray-900">
                      Recipients ({recipients.length})
                    </h2>
                    <Link href="/saved" className="text-xs font-bold text-yellow-600 hover:underline">
                      + Manage Leads
                    </Link>
                  </div>

                  {recipients.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                      <p className="text-sm font-medium mb-3">No recipients selected</p>
                      <Link
                        href="/saved"
                        className="inline-block px-4 py-2 rounded-xl text-xs font-bold text-black"
                        style={{ backgroundColor: "#FFBE00" }}
                      >
                        Select Saved Leads →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                      {recipients.map((r, i) => (
                        <div
                          key={i}
                          className="bg-white border border-gray-200 rounded-xl p-3 text-xs flex items-center justify-between gap-2 shadow-sm"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-gray-900 truncate">{r.name}</p>
                            <p className="text-gray-500 truncate">
                              {r.email || r.phone || "No direct email"}
                            </p>
                          </div>
                          <button
                            onClick={() => removeRecipient(i)}
                            className="text-gray-400 hover:text-red-500 font-bold px-1.5 py-0.5"
                            title="Remove recipient"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Col: Email Composition */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h2 className="font-bold text-lg text-gray-900 mb-4">Compose Campaign</h2>

                    {/* Templates selection */}
                    <div className="mb-5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                        Quick Templates
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {TEMPLATES.map((tpl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => applyTemplate(tpl)}
                            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-gray-50 hover:bg-yellow-50 hover:border-yellow-400 text-xs font-bold text-gray-700 transition-all"
                          >
                            ⚡ {tpl.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Email Inputs */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Subject Line
                        </label>
                        <input
                          ref={subjectRef}
                          id="outreach-subject"
                          type="text"
                          defaultValue="Quick question about {company_name}"
                          placeholder="e.g. Quick question about {company_name}"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-yellow-400 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Email Body
                        </label>
                        <textarea
                          ref={bodyRef}
                          id="outreach-body"
                          rows={10}
                          defaultValue={`Hi Team at {company_name},\n\nI noticed your business online in {city} and wanted to reach out. We specialize in helping local service providers expand their reach and acquire high-intent leads.\n\nWould you be open to a brief 5-minute chat this week?\n\nBest regards,\n[Your Name]`}
                          placeholder="Draft your message here..."
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-yellow-400 font-medium leading-relaxed"
                        />
                        <p className="text-[11px] text-gray-400 mt-1 font-medium">
                          Available variables:{" "}
                          <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">
                            &#123;company_name&#125;
                          </code>
                          ,{" "}
                          <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">
                            &#123;city&#125;
                          </code>
                          ,{" "}
                          <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">
                            &#123;phone&#125;
                          </code>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex items-center justify-between gap-4 mt-6">
                    <span className="text-xs font-semibold text-gray-500">
                      Ready to send to {recipients.length} lead(s)
                    </span>
                    <button
                      type="button"
                      onClick={handleSendCampaign}
                      disabled={recipients.length === 0 || isSending}
                      className={`px-6 py-3 rounded-xl font-extrabold text-sm text-black shadow-md transition-all ${
                        recipients.length > 0 && !isSending
                          ? "hover:brightness-95 cursor-pointer"
                          : "opacity-50 cursor-not-allowed"
                      }`}
                      style={{ backgroundColor: "#FFBE00" }}
                    >
                      {isSending ? "🚀 Dispatching..." : "🚀 Send Email Campaign →"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab 2: Sent History View */}
        {activeTab === "history" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-xl text-gray-900">Sent Email History Log</h2>
                <p className="text-xs font-medium text-gray-500 mt-0.5">
                  Logged history of all outreach emails dispatched via Resend
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Filter logs by recipient or subject..."
                  className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-yellow-400 w-64"
                />
                {sentHistory.length > 0 && (
                  <button
                    onClick={clearSentHistory}
                    className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all"
                  >
                    Clear Log
                  </button>
                )}
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <div className="text-4xl mb-3">📜</div>
                <p className="font-bold text-gray-600 text-sm">No email outreach logs found</p>
                <p className="text-xs text-gray-400 mt-1">
                  {historySearch
                    ? "No logs match your current search query."
                    : "Campaign emails dispatched will be recorded here automatically."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3">Recipient</th>
                      <th className="pb-3 px-3">Subject</th>
                      <th className="pb-3 px-3">Date Sent</th>
                      <th className="pb-3 px-3">Message ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredHistory.map((log, idx) => {
                      const isSuccess = log.status === "sent";
                      return (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isSuccess
                                  ? "bg-green-100 text-green-800 border border-green-200"
                                  : "bg-red-100 text-red-800 border border-red-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isSuccess ? "bg-green-600" : "bg-red-600"
                                }`}
                              />
                              {isSuccess ? "Sent" : "Failed"}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-gray-900 truncate max-w-[200px]">
                            {log.to}
                          </td>
                          <td className="py-3.5 px-3 font-medium text-gray-700 truncate max-w-[280px]">
                            {log.subject}
                          </td>
                          <td className="py-3.5 px-3 text-gray-500 font-medium whitespace-nowrap">
                            {new Date(log.sentAt).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 text-gray-400 font-mono text-[10px] truncate max-w-[150px]">
                            {log.id || "N/A"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
