"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import { SavedLead } from "@/app/saved/page.tsx";

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

  // Direct DOM references for email drafting inputs
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadRecipients();
  }, []);

  const loadRecipients = () => {
    try {
      const stored = localStorage.getItem("xts_outreach_leads");
      if (stored) {
        setRecipients(JSON.parse(stored));
      } else {
        // Fallback to all saved leads with email if none explicitly selected
        const savedStored = localStorage.getItem("xts_saved_leads");
        if (savedStored) {
          const allSaved: SavedLead[] = JSON.parse(savedStored);
          setRecipients(allSaved);
        }
      }
    } catch {
      setRecipients([]);
    }
  };

  const applyTemplate = (tpl: (typeof TEMPLATES)[0]) => {
    if (subjectRef.current) subjectRef.current.value = tpl.subject;
    if (bodyRef.current) bodyRef.current.value = tpl.body;
  };

  const handleSendCampaign = () => {
    const subject = subjectRef.current?.value || "";
    const body = bodyRef.current?.value || "";

    if (!recipients.length) {
      alert("No recipients selected for outreach.");
      return;
    }
    if (!subject.trim()) {
      alert("Please enter an email subject line.");
      return;
    }

    // Simulate sending campaign
    setSentCount(recipients.length);
    setTimeout(() => {
      // Clear outreach leads
      localStorage.removeItem("xts_outreach_leads");
    }, 1000);
  };

  const removeRecipient = (index: number) => {
    const updated = recipients.filter((_, i) => i !== index);
    setRecipients(updated);
    localStorage.setItem("xts_outreach_leads", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-8 py-10 flex-1">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-black text-3xl tracking-tight mb-1">Email Outreach Campaign</h1>
          <p className="text-gray-500 text-sm font-medium">
            Draft and dispatch personalized outreach campaigns to your selected leads
          </p>
        </div>

        {sentCount !== null ? (
          <div className="p-8 bg-green-50 border-2 border-green-200 rounded-2xl text-center my-8">
            <div className="text-5xl mb-3">✉️🎉</div>
            <h2 className="font-black text-2xl text-green-900 mb-2">
              Campaign Dispatched Successfully!
            </h2>
            <p className="text-sm font-semibold text-green-700 max-w-md mx-auto mb-6">
              Outreach messages queued and sent to {sentCount} selected recipient(s).
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setSentCount(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-green-800 text-white hover:bg-green-900 transition-all"
              >
                Send Another Campaign
              </button>
              <Link
                href="/saved"
                className="px-5 py-2.5 rounded-xl font-bold text-sm border border-green-300 text-green-900 bg-white hover:bg-green-50 transition-all"
              >
                Return to Saved Leads
              </Link>
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
                        <p className="font-bold text-gray-900 truncate">{r.company_name}</p>
                        <p className="text-gray-500 truncate">{r.email || r.phone || "No direct email"}</p>
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

            {/* Right Col: Email Composition with Direct DOM Access Inputs */}
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
                        className="px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-yellow-50 hover:border-yellow-400 text-xs font-bold text-gray-700 transition-all"
                      >
                        ⚡ {tpl.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct DOM Access Inputs */}
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
                      Available variables: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">&#123;company_name&#125;</code>, <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">&#123;city&#125;</code>, <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">&#123;phone&#125;</code>
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
                  disabled={recipients.length === 0}
                  className={`px-6 py-3 rounded-xl font-extrabold text-sm text-black shadow-md transition-all ${
                    recipients.length > 0
                      ? "hover:brightness-95 cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  style={{ backgroundColor: "#FFBE00" }}
                >
                  🚀 Send Email Campaign →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
