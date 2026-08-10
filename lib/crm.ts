export interface EmailHistoryItem {
  date: string;
  subject: string;
  body: string;
  type: 'sent' | 'received';
}

export interface ActivityLogItem {
  date: string;
  type: string;
  note: string;
}

export interface CRMContact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  source?: string;
  status: 'New' | 'Contacted' | 'Interested' | 'Proposal Sent' | 'Won' | 'Lost' | 'Nurture';
  priority: 'Hot' | 'Warm' | 'Cold';
  tags: string[];
  notes: string;
  lastContact?: string;
  nextFollowUp?: string;
  dealValue?: number;
  aiScore?: number;
  aiInsight?: string;
  emailHistory: EmailHistoryItem[];
  activityLog: ActivityLogItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedLead {
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

export const INITIAL_SEED_CONTACTS: CRMContact[] = [
  {
    id: "crm_seed_1",
    name: "Apex Epoxy Coatings",
    phone: "(602) 555-0142",
    email: "contact@apexepoxy.com",
    address: "2450 W Broadway Rd, Phoenix, AZ",
    source: "Google Maps",
    status: "New",
    priority: "Warm",
    tags: ["Flooring", "Commercial"],
    notes: "Top-rated flooring contractor in Phoenix. Highly responsive on phone.",
    dealValue: 12500,
    aiScore: 78,
    aiInsight: "High completeness lead with verified phone and email. Strong fit for epoxy outreach.",
    emailHistory: [],
    activityLog: [
      { date: new Date(Date.now() - 86400000 * 3).toISOString(), type: "Created", note: "Imported from search results" }
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: "crm_seed_2",
    name: "Pinnacle Painting Contractors",
    phone: "(480) 555-0198",
    email: "info@pinnaclepaint.com",
    address: "8820 E Gelding Dr, Scottsdale, AZ",
    source: "Apollo B2B",
    status: "Contacted",
    priority: "Hot",
    tags: ["Painting", "Industrial"],
    notes: "Spoke with operations manager. Expressed interest in commercial subcontractor leads.",
    dealValue: 24000,
    aiScore: 88,
    aiInsight: "Active decision maker contacted. High probability of proposal request within 7 days.",
    lastContact: new Date(Date.now() - 86400000 * 2).toISOString(),
    nextFollowUp: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    emailHistory: [
      {
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        subject: "Quick question about Pinnacle Painting Contractors",
        body: "Hi Team, Following up on our brief call yesterday...",
        type: "sent"
      }
    ],
    activityLog: [
      { date: new Date(Date.now() - 86400000 * 5).toISOString(), type: "Created", note: "Imported lead" },
      { date: new Date(Date.now() - 86400000 * 2).toISOString(), type: "Contacted", note: "Outreach email sent" }
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: "crm_seed_3",
    name: "Summit Commercial Roofing",
    phone: "(623) 555-0811",
    email: "bids@summitroofingaz.com",
    address: "10401 N 19th Ave, Phoenix, AZ",
    source: "BBB Directory",
    status: "Interested",
    priority: "Hot",
    tags: ["Roofing", "TPO"],
    notes: "Requested detailed service overview and pricing structure for TPO commercial roofs.",
    dealValue: 45000,
    aiScore: 94,
    aiInsight: "Hot opportunity. High contract value and active interest. Priority for proposal draft.",
    lastContact: new Date(Date.now() - 86400000 * 1).toISOString(),
    nextFollowUp: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0],
    emailHistory: [],
    activityLog: [
      { date: new Date(Date.now() - 86400000 * 6).toISOString(), type: "Created", note: "Added from BBB" },
      { date: new Date(Date.now() - 86400000 * 1).toISOString(), type: "Status Change", note: "Moved to Interested" }
    ],
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: "crm_seed_4",
    name: "Metro Janitorial Services",
    phone: "(602) 555-0322",
    email: "sales@metrojanitorial.net",
    address: "3102 N 24th St, Phoenix, AZ",
    source: "Yellow Pages",
    status: "Proposal Sent",
    priority: "Warm",
    tags: ["Cleaning", "Office"],
    notes: "Proposal submitted for annual office cleaning contract package.",
    dealValue: 18000,
    aiScore: 82,
    aiInsight: "Proposal pending review. Follow up required before end of week.",
    lastContact: new Date(Date.now() - 86400000 * 4).toISOString(),
    nextFollowUp: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    emailHistory: [],
    activityLog: [
      { date: new Date(Date.now() - 86400000 * 10).toISOString(), type: "Created", note: "Imported" },
      { date: new Date(Date.now() - 86400000 * 4).toISOString(), type: "Proposal", note: "Proposal Sent via email" }
    ],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: "crm_seed_5",
    name: "Vanguard Concrete Polishing",
    phone: "(480) 555-0744",
    email: "admin@vanguardconcrete.com",
    address: "1420 S Country Club Dr, Mesa, AZ",
    source: "Google Maps",
    status: "Won",
    priority: "Hot",
    tags: ["Concrete", "Polishing"],
    notes: "Contract signed for quarterly lead generation service.",
    dealValue: 36000,
    aiScore: 98,
    aiInsight: "Closed Won deal. Excellent relationship status. Onboarding scheduled.",
    lastContact: new Date(Date.now() - 86400000 * 1).toISOString(),
    emailHistory: [],
    activityLog: [
      { date: new Date(Date.now() - 86400000 * 14).toISOString(), type: "Created", note: "Lead created" },
      { date: new Date(Date.now() - 86400000 * 1).toISOString(), type: "Won", note: "Deal closed successfully" }
    ],
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: "crm_seed_6",
    name: "BlueSky Electrical Group",
    phone: "(623) 555-0900",
    email: "info@blueskyelectric.com",
    address: "7200 W Bell Rd, Glendale, AZ",
    source: "Yelp",
    status: "Lost",
    priority: "Cold",
    tags: ["Electrical"],
    notes: "Currently bound in long-term contract with existing marketing agency.",
    dealValue: 15000,
    aiScore: 35,
    aiInsight: "Deal lost due to existing contract term. Set reminder to re-engage in 6 months.",
    lastContact: new Date(Date.now() - 86400000 * 7).toISOString(),
    emailHistory: [],
    activityLog: [
      { date: new Date(Date.now() - 86400000 * 12).toISOString(), type: "Created", note: "Added lead" },
      { date: new Date(Date.now() - 86400000 * 7).toISOString(), type: "Lost", note: "Marked as lost - contract bound" }
    ],
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 7).toISOString()
  }
];

export function getStoredCRMContacts(): CRMContact[] {
  if (typeof window === 'undefined') return INITIAL_SEED_CONTACTS;
  try {
    const raw = localStorage.getItem('xts_crm_contacts');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // If empty or null, seed with default contacts for immediate usability
    localStorage.setItem('xts_crm_contacts', JSON.stringify(INITIAL_SEED_CONTACTS));
    return INITIAL_SEED_CONTACTS;
  } catch (err) {
    console.error('Error reading xts_crm_contacts', err);
    return INITIAL_SEED_CONTACTS;
  }
}

export function saveStoredCRMContacts(contacts: CRMContact[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('xts_crm_contacts', JSON.stringify(contacts));
  } catch (err) {
    console.error('Error saving xts_crm_contacts', err);
  }
}

export function exportContactsToCSV(contacts: CRMContact[]) {
  if (typeof window === 'undefined' || !contacts.length) return;
  
  const headers = [
    'ID', 'Name', 'Phone', 'Email', 'Address', 'Source',
    'Status', 'Priority', 'Deal Value ($)', 'AI Score',
    'AI Insight', 'Tags', 'Next Follow Up', 'Last Contact', 'Created At'
  ];

  const rows = contacts.map(c => [
    `"${c.id}"`,
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.phone || '').replace(/"/g, '""')}"`,
    `"${(c.email || '').replace(/"/g, '""')}"`,
    `"${(c.address || '').replace(/"/g, '""')}"`,
    `"${(c.source || '').replace(/"/g, '""')}"`,
    `"${c.status}"`,
    `"${c.priority}"`,
    c.dealValue || 0,
    c.aiScore || 0,
    `"${(c.aiInsight || '').replace(/"/g, '""')}"`,
    `"${(c.tags || []).join(', ').replace(/"/g, '""')}"`,
    `"${c.nextFollowUp || ''}"`,
    `"${c.lastContact || ''}"`,
    `"${c.createdAt || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `crm_contacts_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
