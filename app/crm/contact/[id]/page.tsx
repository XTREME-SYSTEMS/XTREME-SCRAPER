"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import {
  CRMContact,
  getStoredCRMContacts,
  saveStoredCRMContacts
} from "@/lib/crm";

const EMAIL_TEMPLATES = [
  "Cold Intro",
  "Follow-Up #1",
  "Follow-Up #2",
  "Value Prop",
  "Last Touch",
];

const STATUS_OPTIONS: CRMContact["status"][] = [
  "New",
  "Contacted",
  "Interested",
  "Proposal Sent",
  "Won",
  "Lost",
  "Nurture",
];

const PRIORITY_OPTIONS: CRMContact["priority"][] = ["Hot", "Warm", "Cold"];

export default function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const contactId = resolvedParams.id;
  const router = useRouter();

  const [contact, setContact] = useState<CRMContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMsg] = useState<string | null>(null);

  // Email Composer state
  const [selectedTemplate, setSelectedTemplate] = useState("Cold Intro");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

  // Follow-up state
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");

  // Tag state
  const [tagInput, setTagInput] = useState("");

  // AI Re-analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Auth guard
    if (typeof window !== "undefined") {
      const authUser =
        localStorage.getItem("xts_auth_user") || localStorage.getItem("xts_user");
      if (!authUser) {
        router.push("/auth");
        return;
      }

      const all = getStoredCRMContacts();
      const found = all.find((c) => c.id === contactId);
      if (found) {
        setContact(found);
        setFollowUpDate(found.nextFollowUp || "");
      }
      setLoading(false);
    }
  }, [contactId, router]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const persistContactUpdate = (updatedContact: CRMContact, logNote?: string) => {
    let newLog = updatedContact.activityLog || [];
    if (logNote) {
      newLog = [
        {
          date: new Date().toISOString(),
          type: "Update",
          note: logNote,
        },
        ...newLog,
      ];
    }

    const finalContact: CRMContact = {
      ...updatedContact,
      updatedAt: new Date().toISOString(),
      activityLog: newLog,
    };

    setContact(finalContact);

    const all = getStoredCRMContacts();
    const updatedList = all.map((c) => (c.id === finalContact.id ? finalContact : c));
    saveStoredCRMContacts(updatedList);
  };

  // Inline Fields Updates
  const handleFieldChange = (field: keyof CRMContact, value: any) => {
    if (!contact) return;
    const updated = { ...contact, [field]: value };
    persistContactUpdate(updated);
  };

  // AI Score/Insight regeneration
  const handleAIAnalyze = async () => {
    if (!contact) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/crm-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: [contact], action: "score" }),
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.results) && data.results[0]) {
        const result = data.results[0];
        const updated = {
          ...contact,
          aiScore: result.score,
          aiInsight: result.insight,
        };
        persistContactUpdate(updated, "Regenerated AI score & insight");
        triggerToast("AI analysis updated!");
      } else {
        triggerToast("Failed to analyze contact.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error contacting AI service.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // AI Email Generation
  const handleGenerateEmail = async () => {
    if (!contact) return;
    setIsGeneratingEmail(true);
    try {
      const res = await fetch("/api/crm-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: [contact],
          action: "email",
          template: selectedTemplate,
        }),
      });
      const data = await res.json();
      if (data.ok && data.subject && data.body) {
        setEmailSubject(data.subject);
        setEmailBody(data.body);
        triggerToast("AI Email generated!");
      } else {
        triggerToast("Failed to generate email.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error generating AI email.");
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  // Send via Mailto
  const handleSendMailto = () => {
    if (!contact) return;
    if (!emailSubject.trim() || !emailBody.trim()) {
      triggerToast("Please generate or write an email first.");
      return;
    }

    const email = contact.email || "";
    const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;

    // Log to email history and activity log
    const updatedHistory = [
      {
        date: new Date().toISOString(),
        subject: emailSubject,
        body: emailBody,
        type: "sent" as const,
      },
      ...(contact.emailHistory || []),
    ];

    const updated = {
      ...contact,
      emailHistory: updatedHistory,
      lastContact: new Date().toISOString(),
    };

    persistContactUpdate(updated, `Sent email campaign: "${emailSubject}"`);
    window.location.href = mailtoUrl;
    triggerToast("Email logged and dispatched to mail client.");
  };

  // Copy Email to Clipboard
  const handleCopyEmail = () => {
    if (!emailSubject && !emailBody) {
      triggerToast("Nothing to copy.");
      return;
    }
    const fullText = `Subject: ${emailSubject}\n\n${emailBody}`;
    navigator.clipboard.writeText(fullText);
    triggerToast("Email copied to clipboard!");
  };

  // Schedule Follow-Up
  const handleScheduleFollowUp = () => {
    if (!contact || !followUpDate) {
      triggerToast("Please pick a follow-up date.");
      return;
    }

    const logText = followUpNote
      ? `Follow-up scheduled for ${followUpDate}: ${followUpNote}`
      : `Follow-up scheduled for ${followUpDate}`;

    const updated = {
      ...contact,
      nextFollowUp: followUpDate,
    };

    persistContactUpdate(updated, logText);
    setFollowUpNote("");
    triggerToast(`Follow-up set for ${followUpDate}`);
  };

  // Tags Management
  const handleAddTag = () => {
    if (!contact || !tagInput.trim()) return;
    const clean = tagInput.trim();
    if (contact.tags?.includes(clean)) {
      setTagInput("");
      return;
    }
    const updatedTags = [...(contact.tags || []), clean];
    const updated = { ...contact, tags: updatedTags };
    persistContactUpdate(updated, `Added tag: ${clean}`);
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!contact) return;
    const updatedTags = (contact.tags || []).filter((t) => t !== tagToRemove);
    const updated = { ...contact, tags: updatedTags };
    persistContactUpdate(updated, `Removed tag: ${tagToRemove}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black font-sans">
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 py-20 text-center text-gray-400 font-semibold">
          Loading contact profile...
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-white text-black font-sans">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-black text-black mb-2">Contact Not Found</h1>
          <p className="text-gray-500 mb-6">
            The requested contact record does not exist or was deleted.
          </p>
          <Link
            href="/crm"
            className="inline-block px-5 py-2.5 rounded-xl font-bold text-sm bg-black text-white hover:bg-gray-800 transition-all"
          >
            ← Back to CRM Pipeline
          </Link>
        </div>
      </div>
    );
  }

  const getPriorityBadge = (p: CRMContact["priority"]) => {
    switch (p) {
      case "Hot":
        return "bg-red-100 text-red-700 border-red-200";
      case "Warm":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Cold":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-6 py-8 flex-1">
        {/* Top Navigation & Action Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200">
          <div>
            <Link
              href="/crm"
              className="text-xs font-bold text-gray-500 hover:text-black flex items-center gap-1 mb-2 transition-all"
            >
              ← Back to CRM Pipeline
            </Link>
            <h1 className="text-3xl font-black text-black tracking-tight flex items-center gap-3">
              <span>{contact.name}</span>
            </h1>
          </div>

          {/* Quick Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-0.5">
                Pipeline Status
              </label>
              <select
                value={contact.status}
                onChange={(e) => {
                  const newStatus = e.target.value as CRMContact["status"];
                  const updated = { ...contact, status: newStatus };
                  persistContactUpdate(updated, `Status changed to ${newStatus}`);
                  triggerToast(`Status updated to ${newStatus}`);
                }}
                className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold bg-white text-black focus:outline-none"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-0.5">
                Priority
              </label>
              <select
                value={contact.priority}
                onChange={(e) => {
                  const newPriority = e.target.value as CRMContact["priority"];
                  const updated = { ...contact, priority: newPriority };
                  persistContactUpdate(updated, `Priority changed to ${newPriority}`);
                  triggerToast(`Priority set to ${newPriority}`);
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold bg-white focus:outline-none ${getPriorityBadge(
                  contact.priority
                )}`}
              >
                {PRIORITY_OPTIONS.map((pr) => (
                  <option key={pr} value={pr}>
                    {pr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* AI Insight Card */}
            <div className="bg-yellow-50/70 border-2 border-yellow-300 rounded-2xl p-6 shadow-xs relative">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-600 text-xl font-bold">⚡</span>
                  <h2 className="font-extrabold text-base text-yellow-950 uppercase tracking-wide">
                    AI Lead Score & Insight
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-white border border-yellow-400 px-3 py-1 rounded-full shadow-xs">
                    <span className="text-xs font-bold text-gray-500">Score:</span>
                    <span className="text-sm font-black text-black">
                      {contact.aiScore !== undefined ? contact.aiScore : "N/A"}
                    </span>
                    <span className="text-xs font-bold text-gray-400">/100</span>
                  </div>

                  <button
                    onClick={handleAIAnalyze}
                    disabled={isAnalyzing}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-yellow-400 text-black border border-black hover:bg-yellow-300 transition-all shadow-xs disabled:opacity-50"
                  >
                    {isAnalyzing ? "Analyzing..." : "Re-Analyze"}
                  </button>
                </div>
              </div>

              <p className="text-sm text-yellow-950 font-medium leading-relaxed">
                {contact.aiInsight ||
                  "No AI insight text generated yet. Click Re-Analyze above to generate intelligence based on contact completeness and activity."}
              </p>
            </div>

            {/* Editable Contact Info Panel */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <h2 className="font-black text-lg text-black mb-4">Contact Profile Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Company / Contact Name
                  </label>
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-semibold focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={contact.phone || ""}
                    placeholder="(602) 555-0100"
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-medium focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={contact.email || ""}
                    placeholder="contact@company.com"
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-medium focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Lead Source
                  </label>
                  <input
                    type="text"
                    value={contact.source || ""}
                    placeholder="e.g. Google Maps, Saved Leads"
                    onChange={(e) => handleFieldChange("source", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-medium focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Street Address / Location
                  </label>
                  <input
                    type="text"
                    value={contact.address || ""}
                    placeholder="123 Commercial Ave, Phoenix, AZ"
                    onChange={(e) => handleFieldChange("address", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-medium focus:outline-none focus:border-yellow-400"
                  />
                </div>
              </div>
            </div>

            {/* Email Composer Panel */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-black text-lg text-black">AI Outreach Email Composer</h2>
                  <p className="text-xs text-gray-500 font-medium">
                    Generate personalized cold emails based on contact metadata
                  </p>
                </div>

                {/* Template picker */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold bg-white text-gray-800"
                  >
                    {EMAIL_TEMPLATES.map((tpl) => (
                      <option key={tpl} value={tpl}>
                        Template: {tpl}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleGenerateEmail}
                    disabled={isGeneratingEmail}
                    className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-black text-white hover:bg-gray-800 transition-all shadow-xs disabled:opacity-50"
                  >
                    {isGeneratingEmail ? "Generating..." : "⚡ Draft Email"}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="e.g. Quick question regarding service expansion"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-semibold focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Email Body
                  </label>
                  <textarea
                    rows={8}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Draft or generate email content here..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium focus:outline-none focus:border-yellow-400 leading-relaxed"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    onClick={handleCopyEmail}
                    className="px-4 py-2 rounded-xl font-bold text-xs border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all"
                  >
                    Copy to Clipboard
                  </button>

                  <button
                    onClick={handleSendMailto}
                    className="px-5 py-2 rounded-xl font-bold text-xs text-black transition-all hover:brightness-95 shadow-xs"
                    style={{ backgroundColor: "#FFBE00" }}
                  >
                    Send via Mailto: →
                  </button>
                </div>
              </div>
            </div>

            {/* Activity Log Timeline */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <h2 className="font-black text-lg text-black mb-4">Activity Log & History</h2>

              <div className="relative pl-6 border-l-2 border-gray-200 space-y-6">
                {(contact.activityLog || []).map((item, idx) => (
                  <div key={idx} className="relative group">
                    {/* Dot */}
                    <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-black border-2 border-white ring-2 ring-gray-200" />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-extrabold text-xs text-black uppercase tracking-wider">
                          {item.type}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400">
                          {new Date(item.date).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 font-medium bg-gray-50 border border-gray-100 rounded-xl p-3">
                        {item.note}
                      </p>
                    </div>
                  </div>
                ))}

                {(!contact.activityLog || contact.activityLog.length === 0) && (
                  <p className="text-xs text-gray-400 font-medium">No activity logged yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Key Deals, Follow-up, Tags, Notes */}
          <div className="space-y-6">
            {/* Deal Value Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Estimated Deal Value ($)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-black">$</span>
                <input
                  type="number"
                  value={contact.dealValue || 0}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    handleFieldChange("dealValue", isNaN(val) ? 0 : val);
                  }}
                  className="w-full text-2xl font-black text-black border-b-2 border-gray-200 focus:border-yellow-400 focus:outline-none py-1"
                />
              </div>
            </div>

            {/* Follow-up Scheduler Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="font-black text-base text-black">Follow-Up Scheduler</h2>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-bold bg-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Follow-up Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Call regarding contract approval"
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:border-yellow-400"
                />
              </div>

              <button
                onClick={handleScheduleFollowUp}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-black text-white hover:bg-gray-800 transition-all shadow-xs"
              >
                Set Next Follow-Up
              </button>
            </div>

            {/* Tags Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <h2 className="font-black text-base text-black mb-3">Tags & Categorization</h2>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {(contact.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 border border-gray-200 text-xs font-bold text-gray-800"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-gray-400 hover:text-red-600 font-bold"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {(!contact.tags || contact.tags.length === 0) && (
                  <p className="text-xs text-gray-400">No tags added</p>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:border-yellow-400"
                />
                <button
                  onClick={handleAddTag}
                  className="px-3 py-1.5 rounded-xl font-bold text-xs border border-black bg-yellow-400 hover:bg-yellow-300 text-black shadow-xs"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Notes Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-black text-base text-black">Contact Notes</h2>
                <span className="text-[10px] font-bold text-gray-400">Auto-saved</span>
              </div>
              <textarea
                rows={6}
                value={contact.notes || ""}
                onChange={(e) => handleFieldChange("notes", e.target.value)}
                placeholder="Enter internal notes, meeting summaries, preferences..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:border-yellow-400 leading-relaxed"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 rounded-xl shadow-2xl font-semibold text-sm flex items-center gap-2 border border-yellow-400 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="text-yellow-400 font-bold">⚡</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
