"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import {
  CRMContact,
  getStoredCRMContacts,
  saveStoredCRMContacts,
  exportContactsToCSV
} from "@/lib/crm";

const PIPELINE_COLUMNS: Array<{ key: CRMContact['status']; label: string; color: string }> = [
  { key: "New", label: "New", color: "bg-gray-100 text-gray-800 border-gray-300" },
  { key: "Contacted", label: "Contacted", color: "bg-blue-50 text-blue-800 border-blue-200" },
  { key: "Interested", label: "Interested", color: "bg-yellow-50 text-yellow-900 border-yellow-300" },
  { key: "Proposal Sent", label: "Proposal Sent", color: "bg-purple-50 text-purple-800 border-purple-200" },
  { key: "Won", label: "Won", color: "bg-green-50 text-green-800 border-green-300" },
  { key: "Lost", label: "Lost", color: "bg-red-50 text-red-800 border-red-200" },
  { key: "Nurture", label: "Nurture", color: "bg-indigo-50 text-indigo-800 border-indigo-200" },
];

export default function CRMDashboard() {
  const router = useRouter();
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  
  // Search and Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");

  // Sorting for Table View
  const [sortField, setSortField] = useState<keyof CRMContact>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modals & Panels
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toastMessage, setToastMsg] = useState<string | null>(null);

  // New Contact Form State
  const [newForm, setNewForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    source: "Direct Entry",
    status: "New" as CRMContact["status"],
    priority: "Warm" as CRMContact["priority"],
    dealValue: "",
    tags: "",
    notes: "",
  });

  useEffect(() => {
    // Auth guard
    if (typeof window !== "undefined") {
      const authUser = localStorage.getItem("xts_auth_user") || localStorage.getItem("xts_user");
      if (!authUser) {
        router.push("/auth");
        return;
      }
      setContacts(getStoredCRMContacts());
    }
  }, [router]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Helper to persist updated list
  const updateContactsState = (updatedList: CRMContact[]) => {
    setContacts(updatedList);
    saveStoredCRMContacts(updatedList);
  };

  // All extracted unique tags for filter dropdown
  const allTags = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => (c.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [contacts]);

  // Filtered contacts list
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesPhone = c.phone?.toLowerCase().includes(q);
        const matchesEmail = c.email?.toLowerCase().includes(q);
        const matchesAddress = c.address?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesAddress) return false;
      }
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (priorityFilter !== "all" && c.priority !== priorityFilter) return false;
      if (tagFilter !== "all" && !(c.tags || []).includes(tagFilter)) return false;
      return true;
    });
  }, [contacts, searchTerm, statusFilter, priorityFilter, tagFilter]);

  // Sorted contacts for table view
  const sortedContacts = useMemo(() => {
    return [...filteredContacts].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredContacts, sortField, sortOrder]);

  const handleSort = (field: keyof CRMContact) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Stats
  const totalContacts = contacts.length;
  const hotLeads = contacts.filter((c) => c.priority === "Hot").length;
  const pipelineValue = contacts.reduce((sum, c) => sum + (c.dealValue || 0), 0);
  const contactsThisWeek = contacts.filter((c) => {
    if (!c.createdAt) return false;
    const diffDays = (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 3600 * 24);
    return diffDays <= 7;
  }).length;

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: CRMContact["status"]) => {
    e.preventDefault();
    const contactId = e.dataTransfer.getData("text/plain");
    if (!contactId) return;

    const targetContact = contacts.find((c) => c.id === contactId);
    if (!targetContact || targetContact.status === newStatus) return;

    const updated = contacts.map((c) => {
      if (c.id === contactId) {
        const newLog = [
          {
            date: new Date().toISOString(),
            type: "Status Change",
            note: `Status updated from ${c.status} to ${newStatus}`
          },
          ...(c.activityLog || [])
        ];
        return {
          ...c,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          activityLog: newLog
        };
      }
      return c;
    });

    updateContactsState(updated);
    if (selectedContact && selectedContact.id === contactId) {
      setSelectedContact((prev) => prev ? { ...prev, status: newStatus } : null);
    }
    triggerToast(`Moved "${targetContact.name}" to ${newStatus}`);
  };

  // AI Analysis across all contacts
  const handleAIAnalyze = async () => {
    if (!contacts.length) {
      triggerToast("No contacts available to analyze.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/crm-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts, action: "score" })
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.results)) {
        const resultMap = new Map<string, {id:string;score:number;insight:string}>(data.results.map((r: {id:string;score:number;insight:string}) => [r.id, r]));
        const updated = contacts.map((c) => {
          const match = resultMap.get(c.id);
          if (match) {
            return {
              ...c,
              aiScore: match.score,
              aiInsight: match.insight,
              updatedAt: new Date().toISOString()
            };
          }
          return c;
        });
        updateContactsState(updated);
        triggerToast("AI scoring & insights updated for all contacts!");
      } else {
        triggerToast("Failed to run AI analysis.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error connecting to AI service.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Add Contact Form submission
  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim()) return;

    const parsedVal = parseFloat(newForm.dealValue);
    const dealVal = isNaN(parsedVal) ? 0 : parsedVal;
    const tagArray = newForm.tags.split(",").map((t) => t.trim()).filter(Boolean);

    const created: CRMContact = {
      id: `crm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: newForm.name.trim(),
      phone: newForm.phone.trim() || undefined,
      email: newForm.email.trim() || undefined,
      address: newForm.address.trim() || undefined,
      source: newForm.source.trim() || "Manual Entry",
      status: newForm.status,
      priority: newForm.priority,
      dealValue: dealVal,
      tags: tagArray,
      notes: newForm.notes.trim(),
      emailHistory: [],
      activityLog: [
        {
          date: new Date().toISOString(),
          type: "Created",
          note: "Contact created manually"
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedList = [created, ...contacts];
    updateContactsState(updatedList);
    setIsAddModalOpen(false);
    setNewForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      source: "Direct Entry",
      status: "New",
      priority: "Warm",
      dealValue: "",
      tags: "",
      notes: "",
    });
    triggerToast("Contact created successfully!");
  };

  const getPriorityBadgeClass = (p: CRMContact["priority"]) => {
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

  const getScoreColor = (score?: number) => {
    if (score === undefined) return "border-gray-200 text-gray-400";
    if (score >= 80) return "border-green-500 text-green-600 bg-green-50";
    if (score >= 60) return "border-amber-500 text-amber-600 bg-amber-50";
    return "border-red-400 text-red-500 bg-red-50";
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col">
      <Navbar />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-6 py-8 flex-1">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-black flex items-center gap-2">
              <span>CRM Pipeline</span>
            </h1>
            <p className="text-gray-500 text-sm font-medium mt-1">
              AI-driven lead management, pipeline progression, and automated scoring
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleAIAnalyze}
              disabled={isAnalyzing}
              className="px-4 py-2.5 rounded-xl font-bold text-sm bg-black text-white hover:bg-gray-800 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span className="text-yellow-400 font-extrabold">⚡</span>
              <span>{isAnalyzing ? "Analyzing Contacts..." : "AI Analyze"}</span>
            </button>

            <button
              onClick={() => exportContactsToCSV(contacts)}
              className="px-4 py-2.5 rounded-xl font-bold text-sm border border-gray-400 text-gray-800 bg-gray-100 hover:bg-gray-200 transition-all shadow-sm"
            >
              Export CSV
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-black transition-all hover:brightness-95 shadow-sm"
              style={{ backgroundColor: "#FFBE00" }}
            >
              + Add Contact
            </button>
          </div>
        </div>

        {/* Top Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Total Contacts
            </p>
            <p className="text-2xl font-black text-black">{totalContacts}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Hot Leads
            </p>
            <p className="text-2xl font-black text-red-600">{hotLeads}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Deals in Pipeline
            </p>
            <p className="text-2xl font-black text-black">
              ${pipelineValue.toLocaleString()}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Contacts This Week
            </p>
            <p className="text-2xl font-black text-green-600">{contactsThisWeek}</p>
          </div>
        </div>

        {/* Filter Bar & View Toggle */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-8 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <input
                type="text"
                placeholder="Search name, phone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-yellow-400 bg-white font-medium"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-400 text-xs font-bold bg-gray-100 focus:outline-none text-gray-700"
            >
              <option value="all">All Statuses</option>
              {PIPELINE_COLUMNS.map((col) => (
                <option key={col.key} value={col.key}>
                  {col.label}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-400 text-xs font-bold bg-gray-100 focus:outline-none text-gray-700"
            >
              <option value="all">All Priorities</option>
              <option value="Hot">Hot Priority</option>
              <option value="Warm">Warm Priority</option>
              <option value="Cold">Cold Priority</option>
            </select>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-400 text-xs font-bold bg-gray-100 focus:outline-none text-gray-700"
              >
                <option value="all">All Tags</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    Tag: {t}
                  </option>
                ))}
              </select>
            )}

            {(searchTerm || statusFilter !== "all" || priorityFilter !== "all" || tagFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setTagFilter("all");
                }}
                className="text-xs font-bold text-red-600 hover:underline px-2 py-1"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-xl self-start lg:self-auto">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "kanban"
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              Kanban View
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "table"
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              Table View
            </button>
          </div>
        </div>

        {/* View Render */}
        {viewMode === "kanban" ? (
          /* Kanban Board */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start overflow-x-auto pb-6">
            {PIPELINE_COLUMNS.map((col) => {
              const colContacts = filteredContacts.filter((c) => c.status === col.key);
              const colTotalValue = colContacts.reduce((sum, c) => sum + (c.dealValue || 0), 0);

              return (
                <div
                  key={col.key}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.key)}
                  className="bg-gray-50 border border-gray-200 rounded-2xl p-3 min-h-[500px] flex flex-col"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200 px-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-gray-800">
                        {col.label}
                      </span>
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700">
                        {colContacts.length}
                      </span>
                    </div>
                    {colTotalValue > 0 && (
                      <span className="text-[11px] font-bold text-gray-500">
                        ${colTotalValue.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Cards Container */}
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-0.5">
                    {colContacts.map((contact) => (
                      <div
                        key={contact.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, contact.id)}
                        onClick={() => setSelectedContact(contact)}
                        className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-yellow-400 cursor-pointer transition-all flex flex-col gap-2 relative group"
                      >
                        {/* Top Card Row */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm text-black truncate flex-1">
                            {contact.name}
                          </h3>
                          <div
                            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-black shrink-0 ${getScoreColor(
                              contact.aiScore
                            )}`}
                            title={contact.aiInsight || `AI Score: ${contact.aiScore || "N/A"}`}
                          >
                            {contact.aiScore !== undefined ? contact.aiScore : "--"}
                          </div>
                        </div>

                        {/* Phone / Email */}
                        <div className="text-xs text-gray-600 font-medium space-y-0.5">
                          {contact.phone && <p className="truncate">📞 {contact.phone}</p>}
                          {contact.email && <p className="truncate text-gray-500">✉ {contact.email}</p>}
                        </div>

                        {/* Badges & Follow up */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 pt-2 border-t border-gray-100">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${getPriorityBadgeClass(
                              contact.priority
                            )}`}
                          >
                            {contact.priority}
                          </span>

                          {contact.dealValue ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 border border-gray-200">
                              ${contact.dealValue.toLocaleString()}
                            </span>
                          ) : null}

                          {contact.nextFollowUp && (
                            <span className="text-[10px] font-bold text-gray-500 ml-auto" title="Next follow up">
                              📅 {contact.nextFollowUp}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {colContacts.length === 0 && (
                      <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs font-semibold">
                        Drop items here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th
                      onClick={() => handleSort("name")}
                      className="px-4 py-3.5 cursor-pointer hover:bg-gray-100"
                    >
                      Name {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("status")}
                      className="px-4 py-3.5 cursor-pointer hover:bg-gray-100"
                    >
                      Status {sortField === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("priority")}
                      className="px-4 py-3.5 cursor-pointer hover:bg-gray-100"
                    >
                      Priority {sortField === "priority" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("aiScore")}
                      className="px-4 py-3.5 cursor-pointer hover:bg-gray-100"
                    >
                      AI Score {sortField === "aiScore" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("dealValue")}
                      className="px-4 py-3.5 cursor-pointer hover:bg-gray-100"
                    >
                      Deal Value {sortField === "dealValue" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="px-4 py-3.5">Contact Info</th>
                    <th className="px-4 py-3.5">Follow Up</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-gray-100 font-medium">
                  {sortedContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className="hover:bg-yellow-50/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-bold text-black">{contact.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 border border-gray-200">
                          {contact.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${getPriorityBadgeClass(
                            contact.priority
                          )}`}
                        >
                          {contact.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black border ${getScoreColor(
                            contact.aiScore
                          )}`}
                        >
                          {contact.aiScore !== undefined ? contact.aiScore : "--"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {contact.dealValue ? `$${contact.dealValue.toLocaleString()}` : "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {contact.phone || contact.email || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {contact.nextFollowUp || "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/crm/contact/${contact.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-bold text-black hover:underline"
                        >
                          Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {sortedContacts.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400 font-semibold">
                        No contacts found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Side Drawer Contact Detail Panel */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 border-l border-gray-200">
            <div>
              {/* Drawer Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200 mb-6">
                <div>
                  <h2 className="text-xl font-black text-black">{selectedContact.name}</h2>
                  <p className="text-xs font-bold text-gray-500 mt-1">
                    Source: {selectedContact.source || "Direct"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-black font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Status and Priority Quick Toggles */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={selectedContact.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as CRMContact["status"];
                      const updated = contacts.map((c) =>
                        c.id === selectedContact.id
                          ? {
                              ...c,
                              status: newStatus,
                              updatedAt: new Date().toISOString(),
                              activityLog: [
                                {
                                  date: new Date().toISOString(),
                                  type: "Status Change",
                                  note: `Status updated to ${newStatus}`
                                },
                                ...(c.activityLog || [])
                              ]
                            }
                          : c
                      );
                      updateContactsState(updated);
                      setSelectedContact((prev) => prev ? { ...prev, status: newStatus } : null);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold bg-white"
                  >
                    {PIPELINE_COLUMNS.map((col) => (
                      <option key={col.key} value={col.key}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={selectedContact.priority}
                    onChange={(e) => {
                      const newPriority = e.target.value as CRMContact["priority"];
                      const updated = contacts.map((c) =>
                        c.id === selectedContact.id
                          ? { ...c, priority: newPriority, updatedAt: new Date().toISOString() }
                          : c
                      );
                      updateContactsState(updated);
                      setSelectedContact((prev) => prev ? { ...prev, priority: newPriority } : null);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold bg-white"
                  >
                    <option value="Hot">Hot</option>
                    <option value="Warm">Warm</option>
                    <option value="Cold">Cold</option>
                  </select>
                </div>
              </div>

              {/* AI Insight Box */}
              <div className="bg-yellow-50/60 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-yellow-900 flex items-center gap-1">
                    <span>⚡ AI Insight</span>
                  </span>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white border border-yellow-300 text-yellow-900">
                    Score: {selectedContact.aiScore !== undefined ? selectedContact.aiScore : "N/A"}
                  </span>
                </div>
                <p className="text-xs text-yellow-950 font-medium leading-relaxed">
                  {selectedContact.aiInsight || "No AI insight generated yet. Click AI Analyze above."}
                </p>
              </div>

              {/* Contact Details */}
              <div className="space-y-3 text-xs font-medium text-gray-700 mb-6">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-bold text-black">{selectedContact.phone || "Not listed"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-bold text-black">{selectedContact.email || "Not listed"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Address:</span>
                  <span className="font-bold text-black">{selectedContact.address || "Not listed"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Deal Value:</span>
                  <span className="font-bold text-black">
                    {selectedContact.dealValue ? `$${selectedContact.dealValue.toLocaleString()}` : "$0"}
                  </span>
                </div>
                {selectedContact.nextFollowUp && (
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-500">Next Follow-Up:</span>
                    <span className="font-bold text-green-700">{selectedContact.nextFollowUp}</span>
                  </div>
                )}
              </div>

              {/* Activity Log Preview */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Recent Activity
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {(selectedContact.activityLog || []).map((log, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-2 text-xs border border-gray-100">
                      <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-0.5">
                        <span>{log.type}</span>
                        <span>{new Date(log.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-700 font-medium">{log.note}</p>
                    </div>
                  ))}
                  {(!selectedContact.activityLog || selectedContact.activityLog.length === 0) && (
                    <p className="text-xs text-gray-400">No activities recorded</p>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer Link to Full Detail Page */}
            <div className="pt-4 border-t border-gray-200 mt-6">
              <Link
                href={`/crm/contact/${selectedContact.id}`}
                className="w-full py-3 rounded-xl font-bold text-sm bg-black text-white text-center block hover:bg-gray-800 transition-all shadow-sm"
              >
                Open Full Contact Detail Page →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
              <h2 className="text-xl font-black text-black">Add New CRM Contact</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-black font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddContactSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Company / Contact Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Industrial Contracting"
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="(602) 555-0100"
                    value={newForm.phone}
                    onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    value={newForm.email}
                    onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="123 Commercial St, Phoenix, AZ"
                  value={newForm.address}
                  onChange={(e) => setNewForm({ ...newForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Status
                  </label>
                  <select
                    value={newForm.status}
                    onChange={(e) => setNewForm({ ...newForm, status: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold bg-white"
                  >
                    {PIPELINE_COLUMNS.map((col) => (
                      <option key={col.key} value={col.key}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Priority
                  </label>
                  <select
                    value={newForm.priority}
                    onChange={(e) => setNewForm({ ...newForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold bg-white"
                  >
                    <option value="Hot">Hot</option>
                    <option value="Warm">Warm</option>
                    <option value="Cold">Cold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Deal Value ($)
                  </label>
                  <input
                    type="number"
                    placeholder="15000"
                    value={newForm.dealValue}
                    onChange={(e) => setNewForm({ ...newForm, dealValue: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Flooring, Commercial, Phoenix"
                  value={newForm.tags}
                  onChange={(e) => setNewForm({ ...newForm, tags: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Initial notes on this contact..."
                  value={newForm.notes}
                  onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-black text-white hover:bg-gray-800 shadow-sm"
                >
                  Create Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
