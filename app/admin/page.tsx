"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  LogOut,
  RefreshCcw,
  Plus,
  Phone,
  Mail,
  FileSpreadsheet,
  Camera,
  Upload,
  Download,
  MessageSquare,
  Navigation,
  ShieldCheck,
  Edit3,
  Save,
  Trash2,
  Search,
  CheckSquare,
  Square,
  X,
  Printer,
  Paperclip,
  Send,
  ExternalLink,
  Users,
  Bell,
  Briefcase,
  UserCheck,
  Loader2,
  ZoomIn,
  Image as ImageIcon,
  Sparkles,
  CalendarDays,
  Check,
  ChevronRight,
  ChevronDown,
  Clock,
  ArrowRight,
  ClipboardList,
  HardHat,
  Eye,
  CheckCircle2,
  Smartphone
} from "lucide-react";
import { useAdminBasePath, useAdminRole, useAdminUsername } from "@/components/admin/AdminProvider";
import { canView as roleCanView, ROLE_DEFAULT_VIEW, ROLE_LABELS, isRole, type Role } from "@/lib/roles";
import { STATUS_KEYS, STAGES, type StageGroup, inRoleQueue, stageOwner, JOB_STATUSES, INTAKE_STATUSES, INSPECTION_STATUSES, TECHNICIAN_STATUSES, FIELD_STATUSES, FINANCE_STATUSES } from "@/lib/pipeline";
import { StatCard, TimelineChart, BarList, Panel } from "@/components/admin/Charts";
import {
  SERVICE_TEMPLATES,
  DEFAULT_QUOTE_CONDITIONS,
  GROUTIX_QUOTE_TERMS
} from "@/lib/serviceTemplates";
import {
  parseCustomerServices,
  findBestTemplateForService,
  getMatchedQuoteItemsForLead
} from "@/lib/serviceMatching";
import { TemplatePicker } from "@/components/admin/TemplatePicker";
import { InspectionModal } from "@/components/admin/InspectionModal";
import type { InspectionReportDoc } from "@/lib/inspection";
import { stripQuotedReply } from "@/lib/emailClean";
import { EMAIL_TEMPLATES, renderEmailTemplate, type EmailTemplate } from "@/lib/emailTemplates";

export interface QuoteItem {
  templateNo?: string | number;
  code?: string;
  service?: string;
  scope?: string;
  description?: string;
  price?: number;
  qty?: number;
}

export interface CustomerMessage {
  id: string;
  from: "customer" | "groutix";
  channel?: "email" | "sms" | "lead" | "internal";
  subject?: string;
  text: string;
  time: string;
  initial?: boolean;
  read?: boolean;
  attachments?: {
    name: string;
    contentType?: string;
    size?: number;
    url?: string;
    secureUrl?: string;
    publicId?: string;
  }[];
}

export interface GpsCheckin {
  lat: number;
  lng: number;
  accuracy?: number;
  time: string;
}

export interface WarrantyDoc {
  jobNo?: string;
  warrantyNo?: string;
  completionDate?: string;
  expiryDate?: string;
  customerName?: string;
  address?: string;
  authorisedBy?: string;
  dateIssued?: string;
  sentAt?: string;
}

export interface ActivityEntry {
  time: string;
  actor: string;
  action: string;
  detail?: string;
}

export interface Lead {
  id: string;
  type?: "quote" | "support_ticket" | "lead";
  status: string;
  createdAt: string;
  jobNo?: string;
  name?: string;
  phone?: string;
  email?: string;
  service?: string;
  enquiry?: string;
  message?: string;
  address?: string;
  city?: string;
  state?: string;
  assigned?: string;
  technician?: string;
  technicianId?: string;
  priority?: string;
  received?: string;
  contacted?: string;
  follow?: string;
  source?: string;
  notes?: string;
  customerType?: string;
  areas?: string;
  leaking?: string;
  damagedTiles?: string;
  quoteItems?: QuoteItem[];
  quoteItemCode?: string;
  quoteScope?: string;
  quoteTaxMode?: "inclusive" | "exclusive" | "none";
  quoteTaxRate?: number;
  quoteTerms?: string;
  quoteUpdated?: string;
  quoteAmount?: number;
  photosCount?: number;
  photos?: {
    name: string;
    contentType?: string;
    url?: string;
    secureUrl?: string;
    publicId?: string;
    dataUrl?: string;
    width?: number;
    height?: number;
    size?: number;
    added?: string;
  }[];
  messages?: CustomerMessage[];
  gps?: GpsCheckin | null;
  warranty?: WarrantyDoc;
  activity?: ActivityEntry[];
  quoteNumber?: string;
  quoteAcceptedAt?: string;
  quoteDeclinedAt?: string;
  quoteSignature?: string;
  quoteSignedName?: string;
  quoteSignedAt?: string;
  followUpStage?: number;
  followUpNext?: string;
  invoiceNumber?: string;
  invoiceSentAt?: string;
  invoiceStatus?: string;
  invoiceOpenedAt?: string;
  inspectionAt?: string;
  jobAt?: string;
  inspectionReminderSent?: boolean;
  jobReminderSent?: boolean;
  inspectionReport?: InspectionReportDoc;
}

const JOB_NO_START = 1201;
const JOB_NO_PREFIX = "JOBNO-";
const NEW_LEADS_CUTOFF_KEY = "gx_new_leads_cutoff_ms";
const DEFAULT_LEGACY_CUTOFF_MS = 1789102800000; // 2026-09-11T05:00:00Z - Cutoff: only leads created after this get JOBNO-1201+

function getNewLeadsCutoffMs(): number {
  if (typeof window === "undefined") return DEFAULT_LEGACY_CUTOFF_MS;
  const existing = window.localStorage.getItem(NEW_LEADS_CUTOFF_KEY);
  if (existing) {
    const n = parseInt(existing, 10);
    if (!isNaN(n) && n > 0) return Math.min(n, DEFAULT_LEGACY_CUTOFF_MS);
  }
  try {
    window.localStorage.setItem(NEW_LEADS_CUTOFF_KEY, String(DEFAULT_LEGACY_CUTOFF_MS));
  } catch {
    /* ignore */
  }
  return DEFAULT_LEGACY_CUTOFF_MS;
}

function isLegacyLead(lead: Lead, cutoffMs: number): boolean {
  if (lead.jobNo) return false;
  const t = new Date(lead.createdAt).getTime();
  return isNaN(t) ? false : t < cutoffMs;
}

function extractJobNoNumeric(jobNo?: string): number | null {
  if (!jobNo) return null;
  const match = jobNo.match(/^(?:GQ|JobNo|JOBNO)-(\d+)$/i);
  return match ? parseInt(match[1], 10) : null;
}

function generateJobNos(leads: Lead[], cutoffMs: number): Lead[] {
  const byId = new Map<string, Lead>();
  for (const l of leads) {
    let jNo = isLegacyLead(l, cutoffMs) ? undefined : l.jobNo;
    if (jNo && /^(?:GQ|JobNo)-/i.test(jNo)) {
      jNo = jNo.replace(/^(?:GQ|JobNo)-/i, JOB_NO_PREFIX);
    }
    byId.set(l.id, { ...l, jobNo: jNo });
  }

  const newOnly = leads
    .filter((l) => !isLegacyLead(l, cutoffMs))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  let maxExisting = JOB_NO_START - 1;
  for (const ref of newOnly) {
    const l = byId.get(ref.id)!;
    const n = extractJobNoNumeric(l.jobNo);
    if (n !== null && n > maxExisting) maxExisting = n;
  }
  let next = maxExisting + 1;
  for (const ref of newOnly) {
    const l = byId.get(ref.id)!;
    if (!l.jobNo) {
      l.jobNo = `${JOB_NO_PREFIX}${next++}`;
    } else if (/^(?:GQ|JobNo)-/i.test(l.jobNo)) {
      l.jobNo = l.jobNo.replace(/^(?:GQ|JobNo)-/i, JOB_NO_PREFIX);
    }
  }
  return leads.map((l) => byId.get(l.id)!);
}

export interface CrmTask {
  id: string;
  text: string;
  done: boolean;
}

type Stats = {
  total: number;
  today: number;
  last7Days: number;
  last30Days: number;
  newCount: number;
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
  timeline: { date: string; quote: number; support_ticket: number }[];
  topEnquiries: { label: string; count: number }[];
  topCities: { label: string; count: number }[];
  topSources: { label: string; count: number }[];
};

// Ordered status list is sourced from the shared pipeline so the dashboard,
// API, and role queues never drift apart.
const STATUS_LIST: string[] = STATUS_KEYS;

// ── On-site visit micro-stages (On the Way → Reached → In Progress → Done) ──
// Both the inspection visit and the job visit share the same four-step shape;
// each step maps to the concrete pipeline status it advances the lead to.
type VisitStep = { label: string; status: string };
const INSPECTION_STEPS: VisitStep[] = [
  { label: "On the Way", status: "Inspection En Route" },
  { label: "Reached", status: "Inspection Arrived" },
  { label: "Start", status: "Inspection In Progress" },
  { label: "Complete", status: "Inspection Completed" },
];
const JOB_STEPS: VisitStep[] = [
  { label: "On the Way", status: "Job En Route" },
  { label: "Reached", status: "Job Arrived" },
  { label: "Start", status: "Job In Progress" },
  { label: "Job Done", status: "Job Done" },
];
// Which phase a lead is in, so we know which step set (if any) to show.
const INSPECTION_PHASE = [
  "Inspection Booked",
  "Inspection En Route",
  "Inspection Arrived",
  "Inspection In Progress",
];
const JOB_PHASE = [
  "Won",
  "Job Booked",
  "Scheduled",
  "Job Confirmed",
  "Job En Route",
  "Job Arrived",
  "Job In Progress",
];

/** The visit steps to show for a lead's current status, or null if not on a visit. */
function visitStepsFor(status: string): VisitStep[] | null {
  if (INSPECTION_PHASE.includes(status)) return INSPECTION_STEPS;
  if (JOB_PHASE.includes(status)) return JOB_STEPS;
  return null;
}

// Accent styling for the per-stage dashboard cards, keyed by pipeline group so
// each phase of the funnel (lead → quote → booking → job → finance → closed)
// reads as a distinct colour band.
const STAGE_GROUP_ACCENT: Record<StageGroup, { dot: string; value: string }> = {
  lead: { dot: "bg-blue-500", value: "text-[#001f97]" },
  quote: { dot: "bg-amber-500", value: "text-amber-600" },
  booking: { dot: "bg-violet-500", value: "text-violet-600" },
  job: { dot: "bg-cyan-500", value: "text-cyan-600" },
  finance: { dot: "bg-emerald-500", value: "text-emerald-600" },
  closed: { dot: "bg-slate-400", value: "text-slate-400" },
};

export function getRoleStatusOptions(role: Role, currentStatus?: string): string[] {
  let base: string[];
  if (role === "intake") base = INTAKE_STATUSES;
  else if (role === "inspection" || role === "field") base = INSPECTION_STATUSES;
  else if (role === "technician") base = TECHNICIAN_STATUSES;
  else if (role === "finance") base = FINANCE_STATUSES;
  else base = STATUS_LIST;

  if (currentStatus && !base.includes(currentStatus)) {
    return [currentStatus, ...base];
  }
  return base;
}

function normalizeStatus(s?: string): string {
  if (!s) return "New";
  const lower = s.toLowerCase().trim();
  if (lower === "new") return "New";
  if (lower === "read") return "Contacted";
  if (lower === "archived") return "Lost";
  const matched = STATUS_LIST.find((x) => x.toLowerCase() === lower);
  return matched || s;
}

function esc(s?: string) {
  return s || "";
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function fmtDateOnly(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function fmtDateBadge(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const day = d.getDate();
  const month = d.toLocaleString("en-AU", { month: "short" }).toUpperCase();
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function fmtTimeBadge(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).toUpperCase();
}

function getLeadQuoteTotal(l: Lead): number {
  const items = Array.isArray(l.quoteItems) ? l.quoteItems : [];
  const sub = items.reduce((a, x) => a + Number(x.price || 0) * Number(x.qty || 1), 0);
  return l.quoteAmount || (l.quoteTaxMode === "exclusive" ? sub * (1 + (l.quoteTaxRate || 10) / 100) : sub);
}

function getFollowupPrompt(lead: Lead): string {
  const steps: { step: string; label: string }[] = [
    { step: "New", label: "New" },
    { step: "Inspection Booked", label: "Inspection Booked" },
    { step: "Inspection Completed", label: "Inspection Completed" },
    { step: "Quote Sent", label: "Quote Sent" },
    { step: "Job Booked", label: "Job Booked" },
    { step: "Invoice Sent", label: "Invoice Sent" },
    { step: "Payment Pending", label: "Payment Pending" },
    { step: "Payment Received", label: "Payment Received" },
    { step: "Warranty Sent", label: "Warranty Sent" },
    { step: "Completed", label: "Completed" },
  ];

  let latest = "New";
  for (const s of steps) {
    if (getStepActive(lead, s.step)) {
      latest = s.label;
    }
  }
  return latest;
}

function getWhatsAppLink(phone?: string): string {
  if (!phone) return "#";
  const clean = phone.replace(/[^0-9+]/g, "");
  if (!clean) return "#";
  const num = clean.startsWith("+")
    ? clean.replace("+", "")
    : clean.startsWith("0")
      ? "61" + clean.slice(1)
      : clean;
  return `https://wa.me/${num}`;
}

function getStepActive(lead: Lead, step: string): boolean {
  const s = lead.status;
  switch (step) {
    case "New":
      return true;
    case "Inspection Booked":
      return ["Inspection Booked", "Inspection En Route", "Inspection Arrived", "Inspection In Progress", "Inspection Completed", "Quote Pending", "Quote Sent", "Negotiation", "Won", "Job Booked", "Scheduled", "Job Confirmed", "Job En Route", "Job Arrived", "Job In Progress", "Job Done", "Invoice Sent", "Payment Request", "Payment Pending", "Payment Received", "Warranty Sent", "Completed"].includes(s);
    case "Inspection Completed":
      return ["Inspection Completed", "Quote Pending", "Quote Sent", "Negotiation", "Won", "Job Booked", "Scheduled", "Job Confirmed", "Job En Route", "Job Arrived", "Job In Progress", "Job Done", "Invoice Sent", "Payment Request", "Payment Pending", "Payment Received", "Warranty Sent", "Completed"].includes(s);
    case "Quote Sent":
      return ["Quote Sent", "Negotiation", "Won", "Job Booked", "Scheduled", "Job Confirmed", "Job En Route", "Job Arrived", "Job In Progress", "Job Done", "Invoice Sent", "Payment Request", "Payment Pending", "Payment Received", "Warranty Sent", "Completed"].includes(s);
    case "Job Booked":
      return ["Job Booked", "Scheduled", "Job Confirmed", "Job En Route", "Job Arrived", "Job In Progress", "Job Done", "Invoice Sent", "Payment Request", "Payment Pending", "Payment Received", "Warranty Sent", "Completed"].includes(s);
    case "Job Done":
      return ["Job Done", "Invoice Sent", "Payment Request", "Payment Pending", "Payment Received", "Warranty Sent", "Completed"].includes(s);
    case "Invoice Sent":
      return Boolean(lead.invoiceSentAt) || ["Invoice Sent", "Payment Request", "Payment Pending", "Payment Received", "Warranty Sent", "Completed"].includes(s);
    case "Payment Request":
      return ["Payment Request", "Invoice Sent", "Payment Pending", "Payment Received", "Warranty Sent", "Completed"].includes(s);
    case "Payment Pending":
      return ["Payment Pending", "Payment Received", "Warranty Sent", "Completed"].includes(s);
    case "Payment Received":
      return ["Payment Received", "Warranty Sent", "Completed"].includes(s);
    case "Warranty":
    case "Warranty Sent":
      return Boolean(lead.warranty?.sentAt) || ["Warranty Sent", "Completed"].includes(s);
    case "Completed":
      return s === "Completed";
    default:
      return false;
  }
}

function getLatestStepIndex(lead: Lead, steps: { step: string }[]): number {
  let latestIdx = -1;
  for (let i = 0; i < steps.length; i++) {
    if (getStepActive(lead, steps[i].step)) {
      latestIdx = i;
    }
  }
  return latestIdx;
}

function calcResponseTime(received?: string, contacted?: string) {
  if (!received || !contacted) return "—";
  const m = Math.max(0, Math.round((new Date(contacted).getTime() - new Date(received).getTime()) / 60000));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (mm > 0 || parts.length === 0) parts.push(`${mm}m`);
  return parts.join(" ");
}

// Some templates (e.g. the WARRANTY / IMPORTANT NOTICE note) put the same text
// in both the service title and the detailed scope. In the preview we render
// both, so detect that overlap and skip the scope to avoid a doubled block.
function isRedundantScope(service?: string, scope?: string): boolean {
  if (!service || !scope) return false;
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  const svc = norm(service);
  const scp = norm(scope);
  if (!svc || !scp) return false;
  return svc === scp || svc.includes(scp) || scp.includes(svc);
}

function getBadgeColor(status: string) {
  switch (status) {
    // Completed / positive outcomes — the only place we use colour.
    case "Won":
    case "Payment Received":
    case "Job Done":
    case "Warranty Sent":
    case "Inspection Completed":
    case "Completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    // Live visit micro-stages — amber so an in-flight technician stands out.
    case "Inspection En Route":
    case "Inspection Arrived":
    case "Inspection In Progress":
    case "Job En Route":
    case "Job Arrived":
    case "Job In Progress":
      return "bg-amber-50 text-amber-700 border-amber-200";
    // Closed / inactive — de-emphasised.
    case "Lost":
      return "bg-slate-100 text-slate-500 border-slate-200";
    // New — needs attention — the navy accent.
    case "New":
      return "bg-[#001f97]/10 text-[#001f97] border-[#001f97]/20 font-semibold";
    // Everything in-progress — neutral.
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

// Small indicator shown next to a lead's status when the customer accepted (or
// declined) their quote from the emailed one-click link, so staff can tell an
// online response apart from a status a colleague set by hand.
function QuoteResponseBadge({ lead }: { lead: Lead }) {
  if (lead.quoteSignature || lead.quoteSignedAt) {
    return (
      <a
        href={`/api/admin/quote/pdf/${lead.id}`}
        target="_blank"
        rel="noreferrer"
        title={`Signed online by ${lead.quoteSignedName || lead.name || "customer"} • ${fmtDate(lead.quoteSignedAt || lead.quoteAcceptedAt)} (Click to view signed PDF)`}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition-colors whitespace-nowrap cursor-pointer"
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Signed &amp; Accepted
      </a>
    );
  }
  if (lead.quoteAcceptedAt) {
    return (
      <span
        title={`Accepted online • ${fmtDate(lead.quoteAcceptedAt)}`}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap"
      >
        <CheckCircle2 className="w-3 h-3" /> Accepted online
      </span>
    );
  }
  if (lead.quoteDeclinedAt) {
    return (
      <span
        title={`Declined online • ${fmtDate(lead.quoteDeclinedAt)}`}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 whitespace-nowrap"
      >
        <X className="w-3 h-3" /> Declined online
      </span>
    );
  }
  return null;
}

// How many rows/cards to show per page in the long list views.
const PAGE_SIZE = 20;

// Reusable pager shown under long lists. Renders nothing when everything fits on
// one page. Keeps a compact window of page numbers around the current page.
function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}) {
  if (total <= pageSize) return null;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const end = Math.min(pageCount, Math.max(page + 2, 5));
  const start = Math.max(1, end - 4);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
      <div className="text-xs text-slate-500 font-medium">
        Showing <b className="text-slate-700">{from}–{to}</b> of{" "}
        <b className="text-slate-700">{total}</b>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Prev
        </button>
        {start > 1 && <span className="px-1 text-slate-400 text-xs">…</span>}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`min-w-[32px] px-2 py-1.5 rounded-lg text-xs font-bold ${p === page
                ? "bg-[#001f97] text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
          >
            {p}
          </button>
        ))}
        {end < pageCount && <span className="px-1 text-slate-400 text-xs">…</span>}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= pageCount}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ── Schedule View (booking calendar) ────────────────────────────────────────

type BookingEntry = {
  id: string;
  leadId: string;
  type: "inspection" | "job";
  date: string;
  time: string;
  zone: string;
  suburb: string | null;
  reference: string;
  createdAt: string;
  customer: { name: string; phone: string; email: string; address: string; status: string } | null;
};

function ScheduleView({ onOpenLead }: { onOpenLead: (id: string) => void }) {
  const [bookings, setBookings] = useState<BookingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bookings");
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Group bookings by date.
  const grouped = useMemo(() => {
    const map = new Map<string, BookingEntry[]>();
    for (const b of bookings) {
      const arr = map.get(b.date) || [];
      arr.push(b);
      map.set(b.date, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [bookings]);

  function fmtDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-AU", { weekday: "long", day: "2-digit", month: "short", year: "numeric" });
  }

  function fmtTime(t: string) {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  const ZONE_LABELS: Record<string, string> = {
    N: "North", NE: "North-East", E: "East", SE: "South-East",
    S: "South", SW: "South-West", W: "West", NW: "North-West",
    inner: "Inner", flexible: "Greater Melb",
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-slate-900">
          Upcoming Bookings {!loading && <span className="text-slate-400 font-medium text-sm ml-2">({bookings.length})</span>}
        </h2>
        <button onClick={load} className="text-xs font-semibold text-[#001f97] hover:underline flex items-center gap-1">
          <RefreshCcw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading schedule…
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          No upcoming bookings. Bookings from customer self-service and admin scheduling will appear here.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, entries]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-2">
                <CalendarDays className="w-4 h-4 text-[#001f97]" />
                <h3 className="text-sm font-black text-slate-800">{fmtDate(date)}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">
                  {entries.length} appointment{entries.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="ml-2 border-l-2 border-[#001f97]/10 pl-4 space-y-2">
                {entries.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                    onClick={() => onOpenLead(b.leadId)}
                  >
                    <div className="text-sm font-bold text-[#001f97] w-20 shrink-0">{fmtTime(b.time)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {b.customer?.name || "Customer"}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.type === "inspection"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                          }`}>
                          {b.type === "inspection" ? "Inspection" : "Job"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {b.customer?.address && (
                          <span className="text-[11px] text-slate-500 truncate">{b.customer.address}</span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {ZONE_LABELS[b.zone] || b.zone} · {b.reference}
                        </span>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type DashboardView =
  | "dashboard"
  | "analytics"
  | "leads"
  | "quotes"
  | "jobs"
  | "schedule"
  | "customers"
  | "team"
  | "technicians";

export default function CrmDashboardPage() {
  const basePath = useAdminBasePath();
  const realRole = useAdminRole();
  const username = useAdminUsername();
  const router = useRouter();

  // A manager can "Open Dashboard" for any staff member from the Team view to
  // preview that role's dashboard without logging out. This is a client-side
  // view override only: API calls still carry the manager's own session (which
  // has full access), so it never escalates privileges — it just narrows the UI
  // to what the chosen role sees. Non-managers can't set this.
  const isManager = realRole === "manager" || realRole === "super_admin";
  const [viewAs, setViewAs] = useState<{ role: Role; name: string } | null>(null);
  const role: Role = viewAs ? viewAs.role : realRole;
  const isTechnician = role === "technician";

  // Inspection, Technician, Intake / Office, and managers can dispatch
  // technicians to jobs. The API enforces this too; this gates the UI.
  const canManageTechs = role === "inspection" || role === "field" || role === "technician" || role === "manager" || role === "super_admin" || role === "intake";
  // Per-role visibility for the lead-row sections (managers/super-admins see all).
  // Field tools (live visit, job status, tech dispatch) reuse canManageTechs.
  const showFinanceTools = role === "finance" || role === "manager" || role === "super_admin";
  const showIntakeTools = role === "intake" || role === "manager" || role === "super_admin";

  // Human-friendly label for the effective role (e.g. "Finance / Completion").
  const roleLabel = ROLE_LABELS[role] || "Staff";

  // Which tabs this role is allowed to open.
  const canSee = useCallback((view: DashboardView) => roleCanView(role, view), [role]);

  // Navigation / Views — land on the tab this role owns.
  const [currentView, setCurrentView] = useState<DashboardView>(
    () => ROLE_DEFAULT_VIEW[role] as DashboardView
  );

  // Safety net: a role must never sit on a view it isn't allowed to open. If
  // the current view ever falls outside this role's permitted tabs (stale state,
  // a programmatic jump, a role change), snap back to the role's home tab. This
  // enforces "each role sees only its own pages" on top of the sidebar gating.
  useEffect(() => {
    if (!roleCanView(role, currentView)) {
      setCurrentView(ROLE_DEFAULT_VIEW[role] as DashboardView);
    }
  }, [role, currentView]);

  // Deep linking: support ?viewAsRole=field&viewAsName=John or ?view=team from Staff Accounts
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const vRole = params.get("viewAsRole");
    const vName = params.get("viewAsName");
    const vView = params.get("view");
    if (vRole && isRole(vRole)) {
      if (vRole === "manager" || vRole === "super_admin") {
        setViewAs(null);
        setCurrentView("dashboard");
      } else {
        setViewAs({ role: vRole, name: vName ? decodeURIComponent(vName) : (ROLE_LABELS[vRole] || vRole) });
        setCurrentView((ROLE_DEFAULT_VIEW[vRole] as DashboardView) || "leads");
      }
    } else if (vView && roleCanView(realRole, vView)) {
      setCurrentView(vView as DashboardView);
    }
  }, [realRole]);

  // Current page for the long list views. One shared page is fine because only
  // one view renders at a time; it resets whenever the view or filters change so
  // you never land on an out-of-range page.
  const [page, setPage] = useState(1);

  // Staff directory (all roles) for the Team view and assignee pickers.
  const [staff, setStaff] = useState<
    { id: string; username: string; name: string; role: string; active: boolean }[]
  >([]);

  // Field-technician roster (name + email) and staff technicians.
  const [technicians, setTechnicians] = useState<
    { id: string; name: string; email: string; active: boolean; createdAt: string; hasLogin?: boolean; username?: string }[]
  >([]);
  const [techName, setTechName] = useState("");
  const [techEmail, setTechEmail] = useState("");
  const [techBusy, setTechBusy] = useState(false);
  const [techError, setTechError] = useState("");
  const [deletingTechId, setDeletingTechId] = useState<string | null>(null);

  // Internal team chat (staff-to-staff messaging from the Team view).
  const [chatWith, setChatWith] = useState<{
    username: string;
    name: string;
    role: string;
  } | null>(null);
  const [chatMessages, setChatMessages] = useState<
    { id: string; from: string; to: string; text: string; createdAt: string }[]
  >([]);
  const [chatText, setChatText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  // Unread message counts keyed by the sender's username (badges the cards).
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Core Data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [syncingEmails, setSyncingEmails] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  // Finance cards: which leads have their "Previous Details" panel expanded.
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});
  const [priorityFilter, setPriorityFilter] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [newLeadsCutoffMs, setNewLeadsCutoffMs] = useState<number>(0);
  const [showLegacyLeads, setShowLegacyLeads] = useState(false);
  // Tracks the last-seen unread-reply count so we only fire a desktop
  // notification when the number actually goes UP (a genuinely new reply).
  const prevUnreadReplies = useRef<number | null>(null);

  // Analytics View State (Previous Dashboard)
  const [analyticsDays, setAnalyticsDays] = useState<number>(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Active Modals state
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Partial<Lead> | null>(null);

  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [activeQuoteLead, setActiveQuoteLead] = useState<Lead | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [quoteTaxMode, setQuoteTaxMode] = useState<"inclusive" | "exclusive" | "none">("inclusive");
  const [quoteTaxRate, setQuoteTaxRate] = useState<number>(10);
  const [quoteTerms, setQuoteTerms] = useState<string>(
    "Final scope is subject to the details stated in this quotation. Any additional work not listed will require approval before proceeding."
  );

  const [photosModalOpen, setPhotosModalOpen] = useState(false);
  const [activePhotoLead, setActivePhotoLead] = useState<Lead | null>(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [deletingPhotoIndex, setDeletingPhotoIndex] = useState<number | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; name: string } | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [messagesModalOpen, setMessagesModalOpen] = useState(false);
  const [activeMessageLead, setActiveMessageLead] = useState<Lead | null>(null);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(EMAIL_TEMPLATES);
  const [manageTemplatesModalOpen, setManageTemplatesModalOpen] = useState(false);
  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formCategory, setFormCategory] = useState("General");
  const [formName, setFormName] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [replySubject, setReplySubject] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [replyText, setReplyText] = useState("");
  // Files staged to email along with the next reply. `content` is base64 for the
  // API; the rest is metadata used for the chip UI and the logged message.
  const [replyAttachments, setReplyAttachments] = useState<
    { name: string; content: string; contentType?: string; size?: number }[]
  >([]);
  const [sendingReply, setSendingReply] = useState(false);
  const replyFileRef = useRef<HTMLInputElement | null>(null);

  // SMS messaging states (Texto integration)
  const [messageChannel, setMessageChannel] = useState<"email" | "sms">("email");
  const [smsText, setSmsText] = useState("");
  const [sendingSms, setSendingSms] = useState(false);

  const [gpsModalOpen, setGpsModalOpen] = useState(false);
  const [activeGpsLead, setActiveGpsLead] = useState<Lead | null>(null);
  const [gpsStatusMessage, setGpsStatusMessage] = useState("");

  const [warrantyModalOpen, setWarrantyModalOpen] = useState(false);
  const [activeWarrantyLead, setActiveWarrantyLead] = useState<Lead | null>(null);
  const [warrantyTab, setWarrantyTab] = useState<"page1" | "page2">("page1");
  const [warrantyJobNo, setWarrantyJobNo] = useState("");
  const [warrantyCompletion, setWarrantyCompletion] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [warrantyCustomer, setWarrantyCustomer] = useState("");
  const [warrantyAddress, setWarrantyAddress] = useState("");
  const [warrantyAuthorised, setWarrantyAuthorised] = useState("GROUTIX PTY LTD");
  const [warrantyIssued, setWarrantyIssued] = useState("");
  const [warrantyLogo, setWarrantyLogo] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Preload the Groutix logo image once so the warranty card renders the real
  // brand mark (not "GROUTIX" text) and is present when exporting to PNG.
  useEffect(() => {
    const img = new Image();
    img.onload = () => setWarrantyLogo(img);
    img.src = "/logo.png";
  }, []);

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [activeInvoiceLead, setActiveInvoiceLead] = useState<Lead | null>(null);
  // Manager "Client Job Card" workflow modal (full pipeline timeline + advance).
  const [jobCardLead, setJobCardLead] = useState<Lead | null>(null);
  const [invoiceService, setInvoiceService] = useState("");
  const [invoiceDescription, setInvoiceDescription] = useState("");
  const [invoicePrice, setInvoicePrice] = useState<number>(0);
  const [invoiceGst, setInvoiceGst] = useState<number>(10);
  const [invoiceStatus, setInvoiceStatus] = useState("Unpaid");
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [invoiceBankName, setInvoiceBankName] = useState("ANZ");
  const [invoiceAccountName, setInvoiceAccountName] = useState("Groutix Pty Ltd");
  const [invoiceAccountNumber, setInvoiceAccountNumber] = useState("123456789");
  const [invoiceBsb, setInvoiceBsb] = useState("013442");
  const [invoiceDueDate, setInvoiceDueDate] = useState("Within 7 days of invoice date");

  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [activeInspectionLead, setActiveInspectionLead] = useState<Lead | null>(null);

  function openInspectionModal(lead: Lead) {
    setActiveInspectionLead(lead);
    setInspectionModalOpen(true);
  }

  const handleSyncEmails = async () => {
    setSyncingEmails(true);
    try {
      // Vercel cron endpoints often expect a GET, but we'll just hit it normally
      // We don't have CRON_SECRET attached here, so it might fail if we require it.
      // Actually, if we just want it to work for the admin, we should maybe hit an admin route.
      // But the cron route works too if we don't strictly require CRON_SECRET for admin sessions,
      // OR we just build an admin route. Since this is just a demo/admin sync button, we'll try it.
      const res = await fetch("/api/cron/sync-emails");
      if (res.ok) {
        alert("Emails synced successfully!");
        loadData();
      } else {
        alert("Failed to sync emails (check CRON_SECRET or server logs).");
      }
    } catch (err) {
      console.error(err);
      alert("Error syncing emails.");
    } finally {
      setSyncingEmails(false);
    }
  };

  // Load leads and tasks from database. Pass { silent: true } for background
  // polling so the refresh spinner doesn't flicker on every auto-refresh.
  const loadData = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError("");
    const cutoffMs = getNewLeadsCutoffMs();
    setNewLeadsCutoffMs(cutoffMs);
    try {
      const [leadsRes, tasksRes] = await Promise.all([
        fetch("/api/admin/submissions?all=true", { cache: "no-store" }),
        fetch("/api/admin/tasks", { cache: "no-store" })
      ]);

      if (leadsRes.ok) {
        const data = await leadsRes.json();
        const rawItems = data.items || [];
        const normalized = rawItems.map((l: any) => ({
          ...l,
          status: normalizeStatus(l.status),
          service: l.service || l.enquiry || l.message || "General Quote Request",
          address: l.address || [l.city, l.state].filter(Boolean).join(", ") || "",
        }));
        const withJobNos = generateJobNos(normalized, cutoffMs);
        const changes: { id: string; jobNo: string | undefined }[] = [];
        for (let i = 0; i < withJobNos.length; i++) {
          const before = rawItems[i]?.jobNo;
          const after = withJobNos[i]?.jobNo;
          if (before !== after) changes.push({ id: withJobNos[i].id, jobNo: after });
        }
        if (changes.length > 0) {
          Promise.all(
            changes.map((c) =>
              fetch(`/api/admin/submissions/${c.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobNo: c.jobNo ?? null }),
              }).catch(() => {})
            )
          ).catch(() => {});
        }
        setLeads(withJobNos);
      } else {
        const err = await leadsRes.json().catch(() => ({}));
        setError(err.error || "Could not load leads from database.");
      }

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.items || []);
      }
    } catch {
      if (!opts?.silent) setError("Network error while connecting to CRM backend.");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  const loadAnalytics = useCallback(async (days: number) => {
    setLoadingStats(true);
    try {
      const res = await fetch(`/api/admin/stats?days=${days}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || null);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Team-chat data loaders (declared before the polling effects that use them).
  const loadUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/team-messages", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUnread(data.unread || {});
      }
    } catch {
      /* ignore */
    }
  }, []);

  const loadConversation = useCallback(async (withUsername: string) => {
    try {
      const res = await fetch(
        `/api/admin/team-messages?with=${encodeURIComponent(withUsername)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.messages || []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh leads/tasks in the background so customer replies synced by the
  // email cron appear without a manual page refresh. Silent so it doesn't spin
  // the refresh icon. Pauses while the tab is hidden to save the free-plan quota,
  // and refreshes immediately when the tab regains focus.
  useEffect(() => {
    const REFRESH_MS = 30000;
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      loadData({ silent: true });
    };
    const id = setInterval(tick, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") loadData({ silent: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadData]);

  useEffect(() => {
    if (currentView === "analytics") {
      loadAnalytics(analyticsDays);
    }
  }, [currentView, analyticsDays, loadAnalytics]);

  // Ask once for permission to show desktop notifications for new replies.
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(() => { });
    }
  }, []);

  // Reset to the first page whenever the view or any filter changes, so we never
  // show a stale/out-of-range page for the new (shorter) list.
  useEffect(() => {
    setPage(1);
  }, [currentView, statusFilter, priorityFilter, globalSearch, onlyUnread, showLegacyLeads]);

  // Load the staff directory for every role (drives the Team view and all
  // assignee pickers) so nothing is hardcoded. Read-only names/roles only.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/staff", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setStaff(data.staff || []);
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the field-technician roster (drives the Technicians view and the
  // dispatch picker on job cards). Only the roles allowed to see it fetch it.
  const loadTechnicians = useCallback(() => {
    fetch("/api/admin/technicians", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setTechnicians(data.technicians || []);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    loadTechnicians();
  }, [loadTechnicians]);

  // Poll unread team-chat counts so the Team cards badge new messages, and keep
  // an open conversation live-updating while the chat panel is on screen.
  useEffect(() => {
    loadUnread();
    const id = setInterval(loadUnread, 20000);
    return () => clearInterval(id);
  }, [loadUnread]);

  useEffect(() => {
    if (!chatWith) return;
    const id = setInterval(() => loadConversation(chatWith.username), 6000);
    return () => clearInterval(id);
  }, [chatWith, loadConversation]);

  // Keep the chat scrolled to the newest message.
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatWith]);

  // Fetch dynamic email templates (persisted in DB or localStorage)
  const fetchTemplates = useCallback(async () => {
    try {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("gx_email_templates");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setEmailTemplates(parsed);
            }
          } catch {}
        }
      }
      const res = await fetch("/api/admin/email-templates");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.templates) && data.templates.length > 0) {
          setEmailTemplates(data.templates);
          if (typeof window !== "undefined") {
            localStorage.setItem("gx_email_templates", JSON.stringify(data.templates));
          }
        }
      }
    } catch (err) {
      console.error("Failed to load email templates:", err);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Total unread team-chat messages across all senders — badges the Team nav.
  const totalUnread = useMemo(
    () => Object.values(unread).reduce((sum, n) => sum + (n || 0), 0),
    [unread]
  );

  // The customer-conversation modal reads a snapshot taken when it opened; re-derive
  // it from the latest `leads` so background refreshes surface new replies live.
  const activeMessageLeadLive = useMemo(
    () =>
      activeMessageLead
        ? leads.find((l) => l.id === activeMessageLead.id) || activeMessageLead
        : null,
    [activeMessageLead, leads]
  );

  // Unified technicians list: combines both the dispatch roster (`technicians`) and
  // staff accounts created with role === "technician" (`staff`).
  const assignableTechnicians = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; email?: string; active?: boolean; hasLogin?: boolean; username?: string }
    >();

    // 1. Add roster technicians (which may already include staff techs from API)
    for (const t of technicians) {
      map.set(t.id, {
        id: t.id,
        name: t.name,
        email: t.email,
        active: t.active !== false,
        hasLogin: (t as any).hasLogin || false,
        username: (t as any).username || "",
      });
    }

    // 2. Also merge staff accounts with role === "technician"
    for (const s of staff) {
      if (s.role === "technician" && s.active !== false) {
        const displayName = (s.name && s.name.trim()) ? s.name.trim() : s.username;
        const lowerName = displayName.toLowerCase();
        const existing = Array.from(map.values()).find(
          (t) => t.id === s.id || t.name.trim().toLowerCase() === lowerName || (t.username && t.username.toLowerCase() === s.username.toLowerCase())
        );
        if (existing) {
          existing.hasLogin = true;
          existing.username = s.username;
          if (!existing.name) existing.name = displayName;
        } else {
          map.set(s.id, {
            id: s.id,
            name: displayName,
            email: s.username.includes("@") ? s.username : "",
            active: true,
            hasLogin: true,
            username: s.username,
          });
        }
      }
    }

    return Array.from(map.values());
  }, [technicians, staff]);

  // Staff accounts with the inspection feature/role
  const inspectionStaff = useMemo(
    () =>
      staff.filter(
        (s) => s.active !== false && (s.role === "inspection" || s.role === "field")
      ),
    [staff]
  );

  // Check if a given name or account corresponds to a field technician
  const isTechnicianName = useCallback(
    (name?: string) => {
      if (!name) return false;
      const lower = name.trim().toLowerCase();
      return (
        assignableTechnicians.some((t) => t.name.trim().toLowerCase() === lower || (t.username && t.username.toLowerCase() === lower)) ||
        staff.some((s) => s.role === "technician" && (s.name.trim().toLowerCase() === lower || s.username.trim().toLowerCase() === lower))
      );
    },
    [assignableTechnicians, staff]
  );

  // Build assignee options scoped to the role that owns a lead's current stage,
  // so e.g. an inspection-stage lead only offers Field staff, a quoting-stage
  // lead only offers Intake staff, etc. Falls back to all active staff when no
  // one holds that role (so the picker is never empty), and always keeps the
  // lead's current value visible. Technicians are excluded as they are dispatched
  // separately via the dedicated technician dropdown.
  const assigneeOptionsFor = useCallback(
    (status?: string, current?: string) => {
      const active = staff.filter(
        (s) => s.active && s.role !== "technician" && !isTechnicianName(s.name)
      );
      const owner = status ? stageOwner(status) : null;
      let pool = owner
        ? active.filter(
            (s) => s.role === owner || (owner === "inspection" && s.role === "field")
          )
        : active;
      if (pool.length === 0) pool = active;
      const names = new Set<string>(pool.map((s) => s.name));
      if (current && current !== "Unassigned" && !isTechnicianName(current)) {
        names.add(current);
      }
      const list = Array.from(names).filter((n) => n && n !== "Unassigned");
      return ["Unassigned", ...list];
    },
    [staff, isTechnicianName]
  );

  // Options for the "Assigned To" picker in the lead modal (scoped to the
  // editing lead's stage owner), plus whatever it is currently assigned to.
  const assigneeOptions = useMemo(
    () => assigneeOptionsFor(editingLead?.status, editingLead?.assigned),
    [assigneeOptionsFor, editingLead?.status, editingLead?.assigned]
  );

  // Options for a row-level assignee picker (staff owning that lead's stage).
  const rowAssigneeOptions = useCallback(
    (current?: string, status?: string) => assigneeOptionsFor(status, current),
    [assigneeOptionsFor]
  );

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    router.replace(`${basePath}/login`);
    router.refresh();
  }

  // ── Manager "Open Dashboard" (view-as) ──────────────────────────────────────
  // Preview a staff member's dashboard without logging out. Managers and super admins.
  function openAsRole(member: { role: string; name: string }) {
    if (!isManager || !isRole(member.role)) return;
    if (member.role === "manager" || member.role === "super_admin") {
      // The manager's own dashboard — just drop the override.
      returnToManager();
      return;
    }
    setViewAs({ role: member.role, name: member.name });
    setCurrentView(ROLE_DEFAULT_VIEW[member.role] as DashboardView);
    setPage(1);
  }

  function returnToManager() {
    setViewAs(null);
    setCurrentView("dashboard");
    setPage(1);
    if (typeof window !== "undefined" && window.location.search) {
      router.replace(basePath);
    }
  }

  // ── Team chat ───────────────────────────────────────────────────────────────
  async function openChat(member: { username: string; name: string; role: string }) {
    setChatWith(member);
    setChatMessages([]);
    setChatLoading(true);
    await loadConversation(member.username);
    setChatLoading(false);
    // Opening clears unread for this sender; refresh the badges. 
    loadUnread();
  }

  async function sendChat() {
    const text = chatText.trim();
    if (!text || !chatWith || chatSending) return;
    setChatSending(true);
    try {
      const res = await fetch("/api/admin/team-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: chatWith.username, text }),
      });
      if (res.ok) {
        const { message } = await res.json();
        if (message) setChatMessages((prev) => [...prev, message]);
        setChatText("");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Could not send message.");
      }
    } catch {
      alert("Network error while sending message.");
    } finally {
      setChatSending(false);
    }
  }

  async function handleDeleteStaff(member: { id: string; name: string }) {
    if (!isManager) return;
    if (!confirm(`Delete team member "${member.name}"? This cannot be undone.`)) return;
    setDeletingStaffId(member.id);
    try {
      const res = await fetch(`/api/admin/users/${member.id}`, { method: "DELETE" });
      if (res.ok) {
        setStaff((prev) => prev.filter((s) => s.id !== member.id));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Could not delete team member.");
      }
    } catch {
      alert("Network error while deleting team member.");
    } finally {
      setDeletingStaffId(null);
    }
  }

  // ── Technician roster CRUD ───────────────────────────────────────────────────
  async function handleAddTechnician(e: React.FormEvent) {
    e.preventDefault();
    const name = techName.trim();
    const email = techEmail.trim();
    if (name.length < 2 || !email) {
      setTechError("Enter the technician's name and a valid email.");
      return;
    }
    setTechBusy(true);
    setTechError("");
    try {
      const res = await fetch("/api/admin/technicians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.technician) {
        setTechnicians((prev) => [data.technician, ...prev]);
        setTechName("");
        setTechEmail("");
      } else {
        setTechError(data.error || "Could not add technician.");
      }
    } catch {
      setTechError("Network error while adding technician.");
    } finally {
      setTechBusy(false);
    }
  }

  async function handleDeleteTechnician(t: { id: string; name: string }) {
    if (!confirm(`Remove technician "${t.name}" from the roster?`)) return;
    setDeletingTechId(t.id);
    try {
      const res = await fetch(`/api/admin/technicians/${t.id}`, { method: "DELETE" });
      if (res.ok) {
        setTechnicians((prev) => prev.filter((x) => x.id !== t.id));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Could not remove technician.");
      }
    } catch {
      alert("Network error while removing technician.");
    } finally {
      setDeletingTechId(null);
    }
  }

  // Lead CRUD Operations
  async function handleSaveLead(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLead?.name?.trim()) {
      alert("Customer name is required.");
      return;
    }

    try {
      if (editingLead.id) {
        const res = await fetch(`/api/admin/submissions/${editingLead.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingLead)
        });
        if (res.ok) {
          setLeads((prev) =>
            prev.map((l) => (l.id === editingLead.id ? ({ ...l, ...editingLead } as Lead) : l))
          );
          setLeadModalOpen(false);
        } else {
          alert("Failed to update lead.");
        }
      } else {
        let maxN = JOB_NO_START - 1;
        for (const l of leads) {
          const n = extractJobNoNumeric(l.jobNo);
          if (n !== null && n > maxN) maxN = n;
        }
        const newJobNo = `${JOB_NO_PREFIX}${maxN + 1}`;
        const leadToCreate: Partial<Lead> = { ...editingLead, jobNo: newJobNo };
        const res = await fetch("/api/admin/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(leadToCreate)
        });
        if (res.ok) {
          const { item } = await res.json();
          setLeads((prev) => [{ ...item, jobNo: newJobNo }, ...prev]);
          setLeadModalOpen(false);
        } else {
          alert("Failed to create lead.");
        }
      }
    } catch {
      alert("Error saving lead.");
    }
  }

  async function handleDeleteLead(id: string) {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
      } else {
        alert("Failed to delete lead.");
      }
    } catch {
      alert("Error deleting lead.");
    }
  }

  async function updateLeadField(id: string, updates: Partial<Lead>) {
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }

  // Task Operations
  async function handleAddTask() {
    const text = prompt("Enter new task:");
    if (!text || !text.trim()) return;
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() })
      });
      if (res.ok) {
        const { item } = await res.json();
        setTasks((prev) => [item, ...prev]);
      }
    } catch {
      alert("Error creating task.");
    }
  }

  async function handleToggleTask(id: string, done: boolean) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
    try {
      await fetch(`/api/admin/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done })
      });
    } catch {
      /* ignore */
    }
  }

  async function handleDeleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/admin/tasks/${id}`, { method: "DELETE" });
    } catch {
      /* ignore */
    }
  }

  // Quick Communication
  function callCustomer(l: Lead) {
    if (!l.phone) return alert("No phone number saved.");
    const phone = l.phone.replace(/[^\d+]/g, "");
    window.location.href = `tel:${phone}`;
  }

  // Log a phone-call outcome against a lead (intake call follow-up). Refreshes
  // the lead so the new activity entry + any status change show immediately.
  async function logCall(leadId: string, outcome: string) {
    try {
      const res = await fetch(`/api/admin/lead/${leadId}/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Could not log the call.");
        return;
      }
      await loadData({ silent: true });
      // Reflect the new activity in the open modal without a full reopen.
      setEditingLead((prev) => {
        if (!prev || prev.id !== leadId) return prev;
        const entry: ActivityEntry = {
          time: new Date().toISOString(),
          actor: username || "staff",
          action: `Call — ${outcome}`,
        };
        return { ...prev, activity: [...(prev.activity || []), entry] };
      });
    } catch {
      alert("Network error while logging the call.");
    }
  }

  function emailCustomer(l: Lead) {
    if (!l.email) return alert("This customer does not have an email address saved.");
    openMessagesModal(l);
  }

  // Quote Builder Logic
  function openQuoteModal(lead: Lead) {
    setActiveQuoteLead(lead);

    // If existing quote items were saved, use them; otherwise auto-match templates based on customer choices
    const hasExistingItems =
      Array.isArray(lead.quoteItems) &&
      lead.quoteItems.length > 0 &&
      lead.quoteItems.some(
        (it) => it.templateNo || (it.price && it.price > 0) || (it.scope && it.scope.length > 20)
      );

    const initialItems: QuoteItem[] = hasExistingItems
      ? lead.quoteItems!
      : getMatchedQuoteItemsForLead(lead);

    setQuoteItems(initialItems);
    setQuoteTaxMode(lead.quoteTaxMode || "inclusive");
    setQuoteTaxRate(lead.quoteTaxRate ?? 10);
    const existingTerms = (lead.quoteTerms || "").trim();
    const isFullTermsDump = existingTerms.length > 500 || /^Groutix terms and conditions/i.test(existingTerms);
    setQuoteTerms(!existingTerms || isFullTermsDump ? DEFAULT_QUOTE_CONDITIONS : existingTerms);
    setQuoteModalOpen(true);
  }

  function quoteTotals() {
    const subtotal = quoteItems.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.qty) || 1), 0);
    let gst = 0;
    let total = subtotal;

    if (quoteTaxMode === "exclusive") {
      gst = subtotal * (quoteTaxRate / 100);
      total = subtotal + gst;
    } else if (quoteTaxMode === "inclusive") {
      gst = subtotal - subtotal / (1 + quoteTaxRate / 100);
      total = subtotal;
    }

    return { subtotal, gst, total };
  }

  async function handleSaveQuote() {
    if (!activeQuoteLead) return;
    const { total } = quoteTotals();
    const updates: Partial<Lead> = {
      quoteItems,
      quoteTaxMode,
      quoteTaxRate,
      quoteTerms,
      quoteAmount: total,
      quoteUpdated: new Date().toISOString()
    };
    await updateLeadField(activeQuoteLead.id, updates);
    alert(isTechnician ? "Scope of work saved successfully." : "Quote saved successfully.");
  }

  async function handleMarkQuoteSent() {
    if (!activeQuoteLead) return;
    const { total } = quoteTotals();
    const updates: Partial<Lead> = {
      quoteItems,
      quoteTaxMode,
      quoteTaxRate,
      quoteTerms,
      quoteAmount: total,
      status: "Quote Sent",
      quoteUpdated: new Date().toISOString()
    };
    await updateLeadField(activeQuoteLead.id, updates);
    setQuoteModalOpen(false);
  }

  async function handleMarkNegotiation() {
    if (!activeQuoteLead) return;
    const { total } = quoteTotals();
    const updates: Partial<Lead> = {
      quoteItems,
      quoteTaxMode,
      quoteTaxRate,
      quoteTerms,
      quoteAmount: total,
      status: "Negotiation",
      quoteUpdated: new Date().toISOString()
    };
    await updateLeadField(activeQuoteLead.id, updates);
    setQuoteModalOpen(false);
  }

  // Server-side send: emails the customer via Brevo, mints a quote number,
  // sets status to Quote Sent, and starts the follow-up timer automatically.
  async function handleSendQuoteEmail() {
    if (!activeQuoteLead) return;
    if (!activeQuoteLead.email) return alert("No email address saved for this customer.");
    // Persist the latest edits first so the emailed quote matches the screen.
    const { total } = quoteTotals();
    await updateLeadField(activeQuoteLead.id, {
      quoteItems,
      quoteTaxMode,
      quoteTaxRate,
      quoteTerms,
      quoteAmount: total,
      quoteUpdated: new Date().toISOString(),
    });
    try {
      const res = await fetch("/api/admin/quote/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activeQuoteLead.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return alert(data.error || "Could not send the quote.");
      alert(`Quote ${data.quoteNumber} emailed to ${activeQuoteLead.email}.`);
      setQuoteModalOpen(false);
      loadData();
    } catch {
      alert("Network error while sending the quote.");
    }
  }

  // Persist current edits, then open the branded server-generated PDF.
  async function handlePrintQuote() {
    if (!activeQuoteLead) return window.print();
    const { total } = quoteTotals();
    await updateLeadField(activeQuoteLead.id, {
      quoteItems,
      quoteTaxMode,
      quoteTaxRate,
      quoteTerms,
      quoteAmount: total,
      quoteUpdated: new Date().toISOString(),
    });
    const itemsParam = encodeURIComponent(JSON.stringify(quoteItems));
    const notesParam = encodeURIComponent(quoteTerms || "");
    const typeParam = isTechnician ? "&type=scope" : "";
    window.open(`/api/admin/quote/pdf/${activeQuoteLead.id}?items=${itemsParam}&notes=${notesParam}${typeParam}&t=${Date.now()}`, "_blank");
  }

  function handleEmailQuote() {
    if (!activeQuoteLead?.email) return alert("No email address saved for this customer.");
    const { total } = quoteTotals();
    const subject = encodeURIComponent(`Groutix Quotation - AUD $${total.toFixed(2)}`);
    const body = encodeURIComponent(
      `Hi ${activeQuoteLead.name || ""},\n\n` +
      `Thank you for your enquiry. We have prepared your quotation for AUD $${total.toFixed(2)}.\n\n` +
      `Items:\n` +
      quoteItems.map((item, i) => `${i + 1}. ${item.service} - $${Number(item.price || 0).toFixed(2)}`).join("\n") +
      `\n\nOfficial Groutix terms and conditions and warranty details are included in the attached quotation document.\n\n` +
      `Please let us know if you would like to proceed with the booking.\n\nRegards,\nGroutix Team\n1300 476 884`
    );
    window.location.href = `mailto:${activeQuoteLead.email}?subject=${subject}&body=${body}`;
  }

  function handleWhatsappQuote() {
    if (!activeQuoteLead?.phone) return alert("No phone number saved for this customer.");
    const phone = activeQuoteLead.phone.replace(/[^\d]/g, "");
    const { total } = quoteTotals();
    const text = encodeURIComponent(
      `Hi ${activeQuoteLead.name || ""}, your Groutix quote is ready for AUD $${total.toFixed(2)}.\n\n` +
      quoteItems.map((item, i) => `• ${item.service}: $${Number(item.price || 0).toFixed(2)}`).join("\n") +
      `\n\nOfficial terms and conditions are included directly with your quote document.\n\nStay Sealed. Stay Smiling. - Groutix`
    );
    window.open(`https://wa.me/${phone.startsWith("0") ? "61" + phone.slice(1) : phone}?text=${text}`, "_blank");
  }

  // Photos Management with on-demand load and Cloudinary integration
  async function openPhotosModal(lead: Lead) {
    setActivePhotoLead(lead);
    setPhotosModalOpen(true);
    setLoadingPhotos(true);
    try {
      const res = await fetch(`/api/admin/submissions/${lead.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.item) {
          setActivePhotoLead(data.item);
          setLeads((prev) =>
            prev.map((l) =>
              l.id === lead.id
                ? { ...l, photos: data.item.photos, photosCount: data.item.photos?.length || 0 }
                : l
            )
          );
        }
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingPhotos(false);
    }
  }

  async function handleAddPhotos(files: FileList | null) {
    if (!files || files.length === 0 || !activePhotoLead) return;
    setUploadingPhotos(true);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("photos", files[i]);
      }

      const res = await fetch(`/api/admin/submissions/${activePhotoLead.id}/photos`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.photos) {
          setActivePhotoLead((prev) =>
            prev ? { ...prev, photos: data.photos, photosCount: data.photos.length } : prev
          );
          setLeads((prev) =>
            prev.map((l) =>
              l.id === activePhotoLead.id
                ? { ...l, photos: data.photos, photosCount: data.photos.length }
                : l
            )
          );
        }
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error || "Failed to upload photos.");
      }
    } catch (err: any) {
      alert("Error uploading photos: " + (err?.message || "Network error"));
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      setUploadingPhotos(false);
    }
  }

  async function handleDeletePhoto(index: number) {
    if (!activePhotoLead) return;
    const photo = activePhotoLead.photos?.[index];
    if (!photo) return;

    if (!confirm(`Are you sure you want to delete "${photo.name || "this photo"}"?`)) return;

    setDeletingPhotoIndex(index);
    try {
      const res = await fetch(`/api/admin/submissions/${activePhotoLead.id}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: photo.publicId, index }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.photos) {
          setActivePhotoLead((prev) =>
            prev ? { ...prev, photos: data.photos, photosCount: data.photos.length } : prev
          );
          setLeads((prev) =>
            prev.map((l) =>
              l.id === activePhotoLead.id
                ? { ...l, photos: data.photos, photosCount: data.photos.length }
                : l
            )
          );
        }
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error || "Failed to delete photo.");
      }
    } catch (err: any) {
      alert("Error deleting photo: " + (err?.message || "Network error"));
    } finally {
      setDeletingPhotoIndex(null);
    }
  }

  // Conversation Management
  async function openMessagesModal(lead: Lead, initialChannel: "email" | "sms" = "email") {
    let currentLead = lead;

    // If there are any unread messages from customer, mark them read instantly
    if (lead.messages?.some(m => m.from === "customer" && m.read === false)) {
      const updatedMessages = lead.messages.map(m =>
        (m.from === "customer" && m.read === false) ? { ...m, read: true } : m
      );

      currentLead = { ...lead, messages: updatedMessages };
      setLeads(prev => prev.map(l => l.id === lead.id ? currentLead : l));

      // Update backend silently
      updateLeadField(lead.id, { messages: updatedMessages }).catch(console.error);
    }

    setActiveMessageLead(currentLead);
    setMessageChannel(initialChannel);
    setSelectedTemplateId("");
    setReplySubject(`Re: Groutix Enquiry - ${currentLead.name || "Customer"}`);
    setReplyText("");
    const firstName = currentLead.name ? currentLead.name.trim().split(/\s+/)[0] : "there";
    setSmsText(`Hi ${firstName}, regarding your Groutix service: `);
    setReplyAttachments([]);
    setMessagesModalOpen(true);
  }

  function getConversation(lead: Lead): CustomerMessage[] {
    const list = Array.isArray(lead.messages) ? [...lead.messages] : [];
    const initialExists = list.some((m) => m.initial);
    if (!initialExists && (lead.service || lead.notes || lead.message)) {
      list.unshift({
        id: `initial_${lead.id}`,
        from: "customer",
        channel: "lead",
        subject: "Original Enquiry",
        text: [
          lead.service ? `Service: ${lead.service}` : "",
          lead.notes ? `Notes: ${lead.notes}` : "",
          lead.message ? `Customer Message: ${lead.message}` : "",
          lead.source ? `Source: ${lead.source}` : ""
        ].filter(Boolean).join("\n"),
        time: lead.received || lead.createdAt,
        initial: true
      });
    }
    return list;
  }

  // Read picked files into base64 so they can be posted as JSON and forwarded as
  // email attachments. Cap total size to keep the request (and the mailbox) sane.
  const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB total
  async function handleAttachReplyFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const existing = replyAttachments.reduce((n, a) => n + (a.size || 0), 0);
    let running = existing;
    const next: typeof replyAttachments = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (running + file.size > MAX_ATTACHMENT_BYTES) {
        alert(`"${file.name}" skipped — attachments must total under 10 MB.`);
        continue;
      }
      running += file.size;
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || "");
          // Strip the "data:*/*;base64," prefix to leave the raw base64 payload.
          resolve(result.includes(",") ? result.split(",")[1] : result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      next.push({ name: file.name, content, contentType: file.type || undefined, size: file.size });
    }
    setReplyAttachments((prev) => [...prev, ...next]);
    if (replyFileRef.current) replyFileRef.current.value = "";
  }

  function removeReplyAttachment(index: number) {
    setReplyAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSelectEmailTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const template = emailTemplates.find((t) => t.id === templateId);
    if (!template || !activeMessageLead) return;

    const leadCtx = activeMessageLeadLive || activeMessageLead;
    const rendered = renderEmailTemplate(template, leadCtx);

    if (replyText.trim() && replyText.trim() !== "") {
      const confirmReplace = window.confirm("Replace your current email text with the selected template?");
      if (!confirmReplace) return;
    }

    setReplySubject(rendered.subject);
    setReplyText(rendered.body);
  }

  function handleOpenCreateTemplate() {
    setEditingTemplate(null);
    setFormCategory("General");
    setFormName("");
    setFormSubject("");
    setFormBody("");
    setFormDescription("");
    setTemplateFormOpen(true);
  }

  function handleOpenEditTemplate(tmpl: EmailTemplate) {
    setEditingTemplate(tmpl);
    setFormCategory(tmpl.category || "General");
    setFormName(tmpl.name);
    setFormSubject(tmpl.subject);
    setFormBody(tmpl.body);
    setFormDescription(tmpl.description || "");
    setTemplateFormOpen(true);
  }

  async function handleSaveTemplate() {
    if (!formName.trim()) {
      alert("Please enter a template name.");
      return;
    }
    if (!formBody.trim()) {
      alert("Please enter the email body text.");
      return;
    }

    setSavingTemplate(true);
    const tmpl: EmailTemplate = {
      id: editingTemplate ? editingTemplate.id : `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      category: formCategory.trim() || "General",
      name: formName.trim(),
      description: formDescription.trim(),
      subject: formSubject.trim() || "Re: Groutix Enquiry",
      body: formBody.trim(),
    };

    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tmpl),
      });
      if (!res.ok) throw new Error("Failed to save template");

      setEmailTemplates((prev) => {
        const exists = prev.some((t) => t.id === tmpl.id);
        const updated = exists ? prev.map((t) => (t.id === tmpl.id ? tmpl : t)) : [...prev, tmpl];
        if (typeof window !== "undefined") {
          localStorage.setItem("gx_email_templates", JSON.stringify(updated));
        }
        return updated;
      });

      setTemplateFormOpen(false);
      setEditingTemplate(null);
    } catch (err) {
      console.error(err);
      alert("Could not save to server. Saved locally.");
      setEmailTemplates((prev) => {
        const exists = prev.some((t) => t.id === tmpl.id);
        const updated = exists ? prev.map((t) => (t.id === tmpl.id ? tmpl : t)) : [...prev, tmpl];
        if (typeof window !== "undefined") {
          localStorage.setItem("gx_email_templates", JSON.stringify(updated));
        }
        return updated;
      });
      setTemplateFormOpen(false);
      setEditingTemplate(null);
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleDeleteTemplate(id: string) {
    const tmpl = emailTemplates.find((t) => t.id === id);
    if (!window.confirm(`Are you sure you want to delete the template "${tmpl?.name || id}"?`)) return;

    try {
      await fetch(`/api/admin/email-templates?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error(err);
    }

    setEmailTemplates((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem("gx_email_templates", JSON.stringify(updated));
      }
      return updated;
    });

    if (selectedTemplateId === id) {
      setSelectedTemplateId("");
    }
  }

  async function handleResetTemplates() {
    if (!window.confirm("Reset all templates back to standard Groutix defaults? Any custom templates will be removed.")) return;
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.templates)) {
          setEmailTemplates(data.templates);
          if (typeof window !== "undefined") {
            localStorage.setItem("gx_email_templates", JSON.stringify(data.templates));
          }
          return;
        }
      }
    } catch (err) {
      console.error(err);
    }
    // Fallback reset
    setEmailTemplates(EMAIL_TEMPLATES);
    if (typeof window !== "undefined") {
      localStorage.setItem("gx_email_templates", JSON.stringify(EMAIL_TEMPLATES));
    }
  }

  function handleInsertVariable(variableName: string) {
    if (!activeMessageLead) return;
    const leadCtx = activeMessageLeadLive || activeMessageLead;
    let val = "";
    switch (variableName) {
      case "name":
        val = leadCtx.name?.trim() || "Customer";
        break;
      case "firstName":
        val = leadCtx.name?.trim().split(/\s+/)[0] || "there";
        break;
      case "service":
        val = leadCtx.service?.trim() || "tiling & grouting service";
        break;
      case "address":
        val = leadCtx.address?.trim() || [leadCtx.city, leadCtx.state].filter(Boolean).join(", ") || "your property";
        break;
      case "phone":
        val = leadCtx.phone || "";
        break;
      case "quoteAmount":
        val = leadCtx.quoteAmount ? `$${Number(leadCtx.quoteAmount).toFixed(2)}` : "";
        break;
      case "technician":
        val = leadCtx.technician || leadCtx.assigned || "our specialist";
        break;
      default:
        val = "";
    }
    if (!val) return;
    setReplyText((prev) => (prev ? `${prev} ${val}` : val));
  }

  function handleOpenMailApp() {
    if (!activeMessageLead?.email) {
      alert("This customer does not have an email address on file.");
      return;
    }
    const subj = encodeURIComponent(replySubject.trim() || `Re: Groutix Enquiry - ${activeMessageLead.name || "Customer"}`);
    const body = encodeURIComponent(replyText.trim());
    window.location.href = `mailto:${activeMessageLead.email}?subject=${subj}&body=${body}`;
  }

  async function handleSendReply() {
    if (!activeMessageLead) return;
    if (!replyText.trim() && replyAttachments.length === 0) return;

    if (!activeMessageLead.email) {
      alert("This customer does not have an email address on file.");
      return;
    }

    setSendingReply(true);
    try {
      const res = await fetch(`/api/admin/lead/${activeMessageLead.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: replySubject.trim() || `Re: Groutix Enquiry - ${activeMessageLead.name || "Customer"}`,
          text: replyText.trim(),
          attachments: replyAttachments,
        })
      });
      if (!res.ok) throw new Error("Failed to send email");

      const data = await res.json();
      const currentMsgs = getConversation(activeMessageLead);
      const updated = [...currentMsgs, data.message];

      setActiveMessageLead((prev) => (prev ? { ...prev, messages: updated } : prev));
      setLeads((prev) => prev.map(l => l.id === activeMessageLead.id ? { ...l, messages: updated } : l));
      setReplyText("");
      setSelectedTemplateId("");
      setReplyAttachments([]);
    } catch (err) {
      alert("Failed to send email reply. Check console for details.");
      console.error(err);
    } finally {
      setSendingReply(false);
    }
  }

  async function handleSendSmsReply() {
    if (!activeMessageLead) return;
    if (!smsText.trim()) return;

    if (!activeMessageLead.phone) {
      alert("This customer does not have a phone number on file.");
      return;
    }

    setSendingSms(true);
    try {
      const res = await fetch(`/api/admin/lead/${activeMessageLead.id}/sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: smsText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to send SMS.");
        return;
      }

      const currentMsgs = getConversation(activeMessageLead);
      const updated = [...currentMsgs, data.message];

      setActiveMessageLead((prev) => (prev ? { ...prev, messages: updated } : prev));
      setLeads((prev) => prev.map((l) => (l.id === activeMessageLead.id ? { ...l, messages: updated } : l)));
      setSmsText("");
      alert(`SMS successfully sent via Texto!${typeof data.creditsRemaining === "number" ? ` (${data.creditsRemaining} credits remaining)` : ""}`);
    } catch (err) {
      alert("Failed to send SMS. Check console or verify your TEXTO_API_KEY.");
      console.error(err);
    } finally {
      setSendingSms(false);
    }
  }

  async function handleAddCustomerDemoReply() {
    if (!activeMessageLead) return;
    const text = prompt("Enter message received from customer:");
    if (!text || !text.trim()) return;
    const currentMsgs = getConversation(activeMessageLead);
    const newMsg: CustomerMessage = {
      id: `msg_${Date.now()}`,
      from: "customer",
      channel: "email",
      text: text.trim(),
      time: new Date().toISOString()
    };
    const updated = [...currentMsgs, newMsg];
    await updateLeadField(activeMessageLead.id, { messages: updated });
    setActiveMessageLead((prev) => (prev ? { ...prev, messages: updated } : prev));
  }

  // GPS Check-in
  function openGpsModal(lead: Lead) {
    setActiveGpsLead(lead);
    setGpsStatusMessage("");
    setGpsModalOpen(true);
  }

  function handleCaptureGps() {
    if (!navigator.geolocation || !activeGpsLead) {
      alert("Geolocation is not supported in this browser.");
      return;
    }
    setGpsStatusMessage("Acquiring current GPS location...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const gps: GpsCheckin = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          time: new Date().toISOString()
        };
        await updateLeadField(activeGpsLead.id, { gps });
        setActiveGpsLead((prev) => (prev ? { ...prev, gps } : prev));
        setGpsStatusMessage("GPS Check-in recorded successfully.");
      },
      (err) => {
        setGpsStatusMessage(`GPS error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  // Warranty Card Logic
  function openWarrantyModal(lead: Lead) {
    setActiveWarrantyLead(lead);
    const today = new Date().toISOString().slice(0, 10);
    const exp = new Date();
    exp.setFullYear(exp.getFullYear() + 10);
    const expiryStr = exp.toISOString().slice(0, 10);

    setWarrantyJobNo(lead.jobNo || lead.warranty?.jobNo || `JOBNO-${lead.id.slice(-6).toUpperCase()}`);
    setWarrantyCompletion(lead.warranty?.completionDate || today);
    setWarrantyExpiry(lead.warranty?.expiryDate || expiryStr);
    setWarrantyCustomer(lead.warranty?.customerName || lead.name || "");
    setWarrantyAddress(lead.warranty?.address || lead.address || "");
    setWarrantyAuthorised(lead.warranty?.authorisedBy || "GROUTIX PTY LTD");
    setWarrantyIssued(lead.warranty?.dateIssued || today);
    setWarrantyTab("page1");
    setWarrantyModalOpen(true);
  }

  useEffect(() => {
    if (!warrantyModalOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // A4 portrait: 1000 x 1414
    const W = canvas.width;
    const H = canvas.height;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // Decorative corner waves (on both pages)
    const drawCornerSwooshes = () => {
      // Top-right swooshes
      ctx.save();
      // Outer cyan curve
      ctx.beginPath();
      ctx.arc(W + 50, -30, 230, 0, Math.PI * 2);
      ctx.strokeStyle = "#00a8cc";
      ctx.lineWidth = 14;
      ctx.stroke();

      // Inner navy circle
      ctx.beginPath();
      ctx.arc(W + 50, -30, 200, 0, Math.PI * 2);
      ctx.fillStyle = "#071c4d";
      ctx.fill();
      ctx.restore();

      // Bottom-left swooshes
      ctx.save();
      // Outer cyan curve
      ctx.beginPath();
      ctx.arc(-50, H + 30, 230, 0, Math.PI * 2);
      ctx.strokeStyle = "#00a8cc";
      ctx.lineWidth = 14;
      ctx.stroke();

      // Inner navy circle
      ctx.beginPath();
      ctx.arc(-50, H + 30, 200, 0, Math.PI * 2);
      ctx.fillStyle = "#071c4d";
      ctx.fill();
      ctx.restore();
    };

    drawCornerSwooshes();

    // Helper text wrapper
    function wrapText(
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      lineHeight: number
    ): number {
      const words = text.split(" ");
      let line = "";
      let curY = y;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx!.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx!.fillText(line, x, curY);
          line = words[n] + " ";
          curY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx!.fillText(line, x, curY);
      return curY + lineHeight;
    }

    // Shared: draw the real Groutix logo (falls back to text only if unavailable)
    const drawLogo = (x: number, y: number, targetH: number) => {
      if (warrantyLogo && warrantyLogo.naturalWidth) {
        const w = (warrantyLogo.naturalWidth / warrantyLogo.naturalHeight) * targetH;
        ctx!.drawImage(warrantyLogo, x, y, w, targetH);
      } else {
        ctx!.fillStyle = "#071c4d";
        ctx!.font = "bold 40px Arial, sans-serif";
        ctx!.fillText("GROUTIX", x, y + targetH * 0.78);
      }
    };

    // Shared: navy footer banner with contact badges + page label
    const drawWarrantyFooter = (pageLabel: string) => {
      const fY = H - 70;
      ctx!.fillStyle = "#071c4d";
      ctx!.fillRect(0, fY, W, 70);
      const cy = fY + 35;
      const badge = (cx: number, icon: string) => {
        ctx!.beginPath();
        ctx!.arc(cx, cy, 13, 0, Math.PI * 2);
        ctx!.fillStyle = "#00a8cc";
        ctx!.fill();
        ctx!.fillStyle = "#ffffff";
        ctx!.font = "bold 13px Arial, sans-serif";
        ctx!.textAlign = "center";
        ctx!.fillText(icon, cx, cy + 5);
        ctx!.textAlign = "left";
      };
      ctx!.textBaseline = "middle";
      badge(78, "P");
      ctx!.fillStyle = "#ffffff";
      ctx!.font = "bold 16px Arial, sans-serif";
      ctx!.fillText("70238094", 100, cy);
      ctx!.fillStyle = "#3f5f9a";
      ctx!.font = "16px Arial, sans-serif";
      ctx!.fillText("|", 300, cy);
      badge(330, "@");
      ctx!.fillStyle = "#ffffff";
      ctx!.font = "bold 16px Arial, sans-serif";
      ctx!.fillText("info@groutix.com", 352, cy);
      ctx!.fillStyle = "#3f5f9a";
      ctx!.font = "16px Arial, sans-serif";
      ctx!.fillText("|", 610, cy);
      badge(640, "W");
      ctx!.fillStyle = "#ffffff";
      ctx!.font = "bold 16px Arial, sans-serif";
      ctx!.fillText("www.groutix.com", 662, cy);
      ctx!.textAlign = "right";
      ctx!.fillStyle = "#9cc3f0";
      ctx!.font = "13px Arial, sans-serif";
      ctx!.fillText(pageLabel, W - 60, cy);
      ctx!.textAlign = "left";
      ctx!.textBaseline = "alphabetic";
    };

    if (warrantyTab === "page1") {
      // ==========================================
      // PAGE 1: WARRANTY CERTIFICATE
      // ==========================================

      // 1. Top-Left Logo (real brand mark)
      drawLogo(60, 46, 74);

      // 2. Top-Right Stacked Title (navy)
      ctx.textAlign = "right";
      ctx.fillStyle = "#071c4d";
      ctx.font = "bold 30px Arial, sans-serif";
      ctx.fillText("10-YEAR", W - 60, 82);
      ctx.fillText("FULL SHOWER", W - 60, 118);
      ctx.fillText("RE-GROUT WARRANTY", W - 60, 154);
      ctx.textAlign = "left";

      // 3. Navy Ribbon
      ctx.fillStyle = "#071c4d";
      ctx.fillRect(0, 185, W, 44);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 19px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("YOUR PEACE OF MIND. ENGINEERED TO LAST.", W / 2, 213);
      ctx.textAlign = "left";

      // 4. Warranting statement
      ctx.fillStyle = "#0f172a";
      ctx.font = "500 15px Arial, sans-serif";
      wrapText(
        "Groutix Pty Ltd trading as Groutix warrants that a qualifying full shower re-grout performed by Groutix will remain waterproof for a period of 10 years from the date of the Services are completed, subject to the terms, conditions and exclusions set out in this Warranty Document.",
        60,
        272,
        W - 120,
        24
      );

      // 5. Left Shield Badge & Right 4 Checkmark bullets (titles only)
      const sx = 132;
      const sy = 428;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 55, sy + 25);
      ctx.lineTo(sx + 55, sy + 105);
      ctx.quadraticCurveTo(sx + 55, sy + 175, sx, sy + 205);
      ctx.quadraticCurveTo(sx - 55, sy + 175, sx - 55, sy + 105);
      ctx.lineTo(sx - 55, sy + 25);
      ctx.closePath();
      ctx.fillStyle = "#e8f4fc";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#071c4d";
      ctx.stroke();

      // Shield droplet icon
      ctx.beginPath();
      ctx.moveTo(sx, sy + 62);
      ctx.quadraticCurveTo(sx + 26, sy + 100, sx + 26, sy + 128);
      ctx.arc(sx, sy + 128, 26, 0, Math.PI, false);
      ctx.quadraticCurveTo(sx - 26, sy + 100, sx, sy + 62);
      ctx.fillStyle = "#071c4d";
      ctx.fill();
      ctx.restore();

      // Right 4 Bullets (titles only, matching official card)
      const bx = 262;
      const bulletTitles = [
        "10 YEARS WORKMANSHIP WARRANTY",
        "WATERPROOF PROTECTION",
        "QUALITY MATERIALS",
        "EXPERT INSTALLATION",
      ];
      bulletTitles.forEach((title, i) => {
        const itemY = 470 + i * 52;
        // Cyan circle
        ctx.beginPath();
        ctx.arc(bx + 14, itemY - 5, 15, 0, Math.PI * 2);
        ctx.fillStyle = "#00a8cc";
        ctx.fill();
        // White checkmark
        ctx.beginPath();
        ctx.moveTo(bx + 8, itemY - 5);
        ctx.lineTo(bx + 12, itemY - 1);
        ctx.lineTo(bx + 21, itemY - 11);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();
        // Title
        ctx.fillStyle = "#071c4d";
        ctx.font = "bold 18px Arial, sans-serif";
        ctx.fillText(title, bx + 42, itemY);
      });

      // 6. Australian Consumer Law callout box (light blue)
      const aclY = 690;
      const aclW = W - 120;
      const aclH = 66;
      ctx.save();
      ctx.fillStyle = "#e8f4fc";
      ctx.strokeStyle = "#bce1f8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(60, aclY, aclW, aclH, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#071c4d";
      ctx.font = "500 15px Arial, sans-serif";
      wrapText(
        "This warranty is in addition to any rights and remedies available under the Australian Consumer Law.",
        84,
        aclY + 28,
        aclW - 48,
        22
      );
      ctx.restore();

      // 7. Certificate detail fields (single column with underlines)
      let fldY = 812;
      const drawField = (label: string, value: string) => {
        ctx.fillStyle = "#071c4d";
        ctx.font = "bold 15px Arial, sans-serif";
        ctx.fillText(label, 60, fldY);
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(360, fldY + 6);
        ctx.lineTo(W - 60, fldY + 6);
        ctx.stroke();
        if (value) {
          ctx.fillStyle = "#0f172a";
          ctx.font = "15px Arial, sans-serif";
          ctx.fillText(value, 372, fldY);
        }
        fldY += 48;
      };
      drawField("JOB / INVOICE NO.:", warrantyJobNo);
      drawField("COMPLETION DATE:", fmtDateOnly(warrantyCompletion));
      drawField("WARRANTY EXPIRY DATE:", fmtDateOnly(warrantyExpiry));
      drawField("CUSTOMER NAME:", warrantyCustomer);
      drawField("PROPERTY ADDRESS:", warrantyAddress);
      fldY += 18;
      drawField("AUTHORISED BY GROUTIX:", warrantyAuthorised);
      drawField("DATE ISSUED:", fmtDateOnly(warrantyIssued));

      // 8. Bottom footer banner
      drawWarrantyFooter("Page 1 of 2");
    } else {
      // ==========================================
      // PAGE 2: TERMS & CONDITIONS
      // ==========================================

      // 1. Header: logo left, TERMS & CONDITIONS pill right + subtitle
      drawLogo(60, 40, 66);

      const pillW = 320;
      const pillH = 44;
      const pillX = W - 60 - pillW;
      const pillY = 46;
      ctx.save();
      ctx.fillStyle = "#071c4d";
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 8);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("TERMS & CONDITIONS", pillX + pillW / 2, pillY + 29);
      ctx.textAlign = "left";
      ctx.restore();

      ctx.fillStyle = "#071c4d";
      ctx.font = "bold 13px Arial, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("10-YEAR FULL SHOWER RE-GROUT WARRANTY", W - 60, pillY + pillH + 22);
      ctx.textAlign = "left";

      // Divider
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(60, 150);
      ctx.lineTo(W - 60, 150);
      ctx.stroke();

      // Two-column layout
      const c1X = 60;
      const colGap = 40;
      const colW = (W - 120 - colGap) / 2;
      const c2X = c1X + colW + colGap;

      // Section banner helper
      const banner = (title: string, x: number, y: number) => {
        ctx!.save();
        ctx!.fillStyle = "#e8f4fc";
        ctx!.beginPath();
        ctx!.roundRect(x, y, colW, 30, 6);
        ctx!.fill();
        ctx!.fillStyle = "#071c4d";
        ctx!.font = "bold 14px Arial, sans-serif";
        ctx!.fillText(title, x + 12, y + 20);
        ctx!.restore();
        return y + 42;
      };

      // Paragraph flow helper (returns next y)
      const para = (
        text: string,
        x: number,
        y: number,
        opts?: { color?: string; indent?: number }
      ) => {
        const indent = opts?.indent || 0;
        ctx!.fillStyle = opts?.color || "#334155";
        ctx!.font = "11px Arial, sans-serif";
        const ny = wrapText(text, x + indent, y, colW - indent, 15);
        return ny + 3;
      };

      // ---- COLUMN 1 ----
      let y1 = 175;
      y1 = banner("1. Service Warranty", c1X, y1);
      y1 = para(
        "1.1 Groutix warrants that, subject to the terms and conditions of this warranty, for a period of 10 years from the date of supply of the Service to the party who purchased the Service from Groutix:",
        c1X,
        y1,
        { color: "#1e293b" }
      );
      y1 = para("(1) The grout applied to the tiled surface or tile installation during the Service will stay waterproof.", c1X, y1, { indent: 14 });
      y1 = para("(2) If the grout applied to the tiled surface or tile installation during the Service does not stay waterproof, it will at Groutix's election, be replaced or repaired without cost to you or you will be refunded the price you paid for the Service.", c1X, y1, { indent: 14 });

      y1 += 8;
      y1 = banner("2. Exclusions and limitations", c1X, y1);
      y1 = para("2.1 This warranty is not transferable to any subsequent owner of your property.", c1X, y1);
      y1 = para("2.2 This warranty will be void where:", c1X, y1);
      y1 = para("(1) The tiled surface or tile installation has been subjected to misuse, negligence or accident by you or any third party; or", c1X, y1, { indent: 14 });
      y1 = para("(2) The tiled surface or tile installation has been modified, repaired or altered by you or any third party; or", c1X, y1, { indent: 14 });
      y1 = para("(3) The tiled surface or tile installation is affixed to a building which has experienced structural movement and/or defects and/or cracking; or", c1X, y1, { indent: 14 });
      y1 = para("(4) You have not followed the after-care and maintenance instructions we provided to you.", c1X, y1, { indent: 14 });
      y1 = para("2.3 This warranty does not apply to a partial shower re-grout service. It applies only to a full shower re-grout service.", c1X, y1);
      y1 = para("2.4 This warranty applies only to grouting services and where grout has been applied. It does not apply to silicone and where silicone has been applied.", c1X, y1);
      y1 = para("2.5 This warranty only applies if the grout applied to the tiled surface or tile installation during the Service is no longer waterproof. It does not apply to shower leaks or mould.", c1X, y1);

      // ---- COLUMN 2 ----
      let y2 = 175;
      y2 = para("2.6 Groutix will not be liable under this warranty for any damages, losses, costs or expenses including, without limitation, loss of market, loss of profit, loss of production or for any financial or economic loss including indirect or consequential loss or damage which may be suffered by you or by any third party arising out of or in any way connected with failure of the Service or any defect in materials and workmanship except as provided by this warranty.", c2X, y2);
      y2 = para("2.7 The obligations of Groutix under this warranty will be limited to one of the following at the election of Groutix:", c2X, y2);
      y2 = para("(1) Repair of the tiled surface or tile installation the subject of the Service; or", c2X, y2, { indent: 14 });
      y2 = para("(2) Provision of a replacement Service or, where this is not possible for any reason, the provision of an equivalent service or product; or", c2X, y2, { indent: 14 });
      y2 = para("(3) A refund of the price you paid for the Service.", c2X, y2, { indent: 14 });
      y2 = para("2.8 Notwithstanding any other provision of this warranty, Groutix's liability arising from, under or in connection with this warranty will be limited to the full replacement value of the Service.", c2X, y2);
      y2 = para("2.9 Whilst Groutix will endeavor to ensure that the color and texture of the grout and any other materials used in any repair or replacement will match any existing grout and other relevant materials, it does not warrant that they will be an exact match and will not be liable if they are not an exact match.", c2X, y2);
      y2 = para("2.10 You acknowledge that Groutix is not the manufacturer of the materials used to provide the Service. To the extent permitted by law, Groutix shall not be liable as the manufacturer of the materials used to provide the Service.", c2X, y2);
      y2 = para("2.11 This warranty is only valid and enforceable in Australia.", c2X, y2);

      y2 += 8;
      y2 = banner("3. How to claim", c2X, y2);
      y2 = para(
        "3.1 Upon discovery of any evidence that the grout applied to the tiled surface or tile installation during the Service is no longer waterproof and to make a claim under this warranty, you must promptly contact Groutix by email at info@groutix.com. You must provide a copy of your invoice and proof of payment for the Service, and photographs of the relevant surface or installation.",
        c2X,
        y2,
        { color: "#1e293b" }
      );

      // Bottom footer banner
      drawWarrantyFooter("Page 2 of 2");
    }
  }, [
    warrantyModalOpen,
    warrantyTab,
    warrantyJobNo,
    warrantyCustomer,
    warrantyAddress,
    warrantyCompletion,
    warrantyExpiry,
    warrantyAuthorised,
    warrantyIssued,
    warrantyLogo
  ]);

  function downloadWarrantyCard() {
    if (!canvasRef.current || !activeWarrantyLead) return;
    const link = document.createElement("a");
    const suffix = warrantyTab === "page1" ? "Certificate" : "Terms";
    link.download = `Groutix_Warranty_${(activeWarrantyLead.name || "Customer").replace(/[^a-zA-Z0-9]/g, "_")}_${suffix}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  // Server-side send: emails the warranty card, mints a warranty number, and
  // sets status to Warranty Sent automatically.
  async function handleSendWarranty() {
    if (!activeWarrantyLead) return;
    if (!activeWarrantyLead.email) return alert("No email address saved for this customer.");
    const imageDataUrl = canvasRef.current?.toDataURL("image/png");
    try {
      const res = await fetch("/api/admin/warranty/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeWarrantyLead.id,
          imageDataUrl,
          warranty: {
            jobNo: warrantyJobNo,
            completionDate: warrantyCompletion,
            expiryDate: warrantyExpiry,
            customerName: warrantyCustomer,
            address: warrantyAddress,
            authorisedBy: warrantyAuthorised,
            dateIssued: warrantyIssued,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return alert(data.error || "Could not send the warranty.");
      alert(`Warranty ${data.warrantyNo} emailed to ${activeWarrantyLead.email}.`);
      setWarrantyModalOpen(false);
      loadData();
    } catch {
      alert("Network error while sending the warranty.");
    }
  }

  // Invoice Logic
  function openInvoiceModal(lead: Lead) {
    setActiveInvoiceLead(lead);
    setInvoiceService(lead.service || "Complete Shower Regrouting & Waterproof Resealing");
    setInvoiceDescription(
      lead.quoteScope ||
      lead.notes ||
      lead.message ||
      "• Full removal of failed grout\n• Chemical cleaning and substrate prep\n• Regrouting with commercial epoxy grout\n• Sanitary mould-resistant silicone joints"
    );
    setInvoicePrice(lead.quoteAmount || 850);
    setInvoiceGst(10);
    // Default to Unpaid; only pre-mark Paid if payment was already recorded.
    setInvoiceStatus(lead.status === "Payment Received" ? "Paid" : "Unpaid");
    try {
      setInvoiceBankName(localStorage.getItem("groutix_inv_bank") || "ANZ");
      setInvoiceAccountName(localStorage.getItem("groutix_inv_acc_name") || "Groutix Pty Ltd");
      setInvoiceAccountNumber(localStorage.getItem("groutix_inv_acc_num") || "123456789");
      setInvoiceBsb(localStorage.getItem("groutix_inv_bsb") || "013442");
      setInvoiceDueDate(localStorage.getItem("groutix_inv_due_date") || "Within 7 days of invoice date");
    } catch {}
    setInvoiceModalOpen(true);
  }

  // Server-side send: emails a branded invoice (with PDF) to the customer, and
  // if marked Paid moves the lead to "Payment Received" automatically.
  async function handleSendInvoice() {
    if (!activeInvoiceLead) return;
    if (!activeInvoiceLead.email) {
      alert("No email address saved for this customer.");
      return;
    }
    setSendingInvoice(true);
    try {
      const res = await fetch("/api/admin/invoice/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeInvoiceLead.id,
          service: invoiceService,
          description: invoiceDescription,
          price: invoicePrice,
          gst: invoiceGst,
          status: invoiceStatus,
          bankName: invoiceBankName,
          accountName: invoiceAccountName,
          accountNumber: invoiceAccountNumber,
          bsb: invoiceBsb,
          dueDate: invoiceDueDate,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Could not send the invoice.");
        return;
      }
      alert(`Invoice ${data.invoiceNumber} emailed to ${activeInvoiceLead.email}.`);
      setInvoiceModalOpen(false);
      loadData();
    } catch {
      alert("Network error while sending the invoice.");
    } finally {
      setSendingInvoice(false);
    }
  }

  // ── Login 1 (Intake / Leads) Custom Horizontal Lead Card ───────────────────
  // Shows ONLY the items from the user-specified template in a clean horizontal row
  function renderIntakeLeadRow(l: Lead) {
    const photosTotal = l.photos?.length || l.photosCount || 0;
    const hasCustomerUnread = l.messages?.some((m) => m.from === "customer" && m.read === false);
    const statusOptions = getRoleStatusOptions(role, l.status);
    const assigneeOptions = rowAssigneeOptions(l.assigned, l.status);
    const followupPrompt = getFollowupPrompt(l);

    return (
      <div
        key={l.id}
        className="py-4 px-4 hover:bg-slate-50/80 transition-colors rounded-xl border border-slate-200/80 bg-white mb-3 shadow-2xs"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 items-start">
          {/* SECTION 1: Client Info & Details Box (3 columns) */}
          <div className="xl:col-span-3 min-w-0 space-y-1.5">
            <div>
              <button
                type="button"
                onClick={() => {
                  setEditingLead(l);
                  setLeadModalOpen(true);
                }}
                className="font-black text-slate-900 text-base hover:text-[#001f97] hover:underline text-left transition-colors cursor-pointer truncate block w-full"
                title={l.name || "Unnamed Customer"}
              >
                {l.name || "Unnamed Customer"}
              </button>
              {(l.message || l.notes) && (
                <div className="text-xs text-slate-500 line-clamp-1">
                  {l.message || l.notes}
                </div>
              )}
            </div>

            {/* Details Box */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-2.5 text-xs space-y-1 mt-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Job No:</span>
                <span className="font-bold text-slate-900 truncate text-right">{l.jobNo || "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Phone:</span>
                <span className="font-bold text-slate-900 truncate text-right">{l.phone || "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Email:</span>
                <span className="font-medium text-slate-700 truncate text-right" title={l.email}>{l.email || "—"}</span>
              </div>
              {l.address && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400 font-semibold shrink-0">Address:</span>
                  <span className="font-medium text-slate-700 truncate text-right" title={l.address}>{l.address}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Service:</span>
                <span className="font-semibold text-slate-900 truncate text-right" title={l.service}>{l.service || "Standard Work"}</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: STATUS, ASSIGNED & FOLLOW-UP (3 columns) */}
          <div className="xl:col-span-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  STATUS
                </label>
                <select
                  value={l.status || "New"}
                  onChange={(e) => updateLeadField(l.id, { status: e.target.value })}
                  className="w-full text-xs font-bold text-emerald-700 bg-emerald-50/70 border border-emerald-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden cursor-pointer hover:border-emerald-400 truncate"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  ASSIGNED
                </label>
                <select
                  value={l.assigned && !isTechnicianName(l.assigned) ? l.assigned : "Unassigned"}
                  onChange={(e) => updateLeadField(l.id, { assigned: e.target.value === "Unassigned" ? "" : e.target.value })}
                  className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden cursor-pointer hover:border-slate-300 truncate"
                >
                  {assigneeOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Follow-up card */}
            <div className="bg-[#fee2e2]/70 border border-rose-200/80 rounded-xl p-2.5">
              <div className="text-[10px] font-black tracking-wider text-rose-800 uppercase">
                FOLLOW-UP
              </div>
              <div className="text-xs font-bold text-slate-900 mt-0.5 leading-snug">
                {followupPrompt}
              </div>
            </div>
          </div>

          {/* SECTION 3: INTAKE WORKFLOW STAGES (3 columns) */}
          <div className="xl:col-span-3 space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              INTAKE WORKFLOW STAGES
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "New", status: "New", active: l.status === "New", color: "bg-blue-600 hover:bg-blue-700" },
                { label: "Contacted", status: "Contacted", active: l.status === "Contacted", color: "bg-purple-600 hover:bg-purple-700" },
                { label: "Inspections", status: "Inspection Booked", active: l.status.startsWith("Inspection"), color: "bg-teal-600 hover:bg-teal-700" },
                { label: "Quotes", status: "Quote Sent", active: l.status.startsWith("Quote") || l.status === "Won" || l.status === "Negotiation", color: "bg-amber-600 hover:bg-amber-700" },
                { label: "Job Booked", status: "Job Booked", active: l.status === "Job Booked" || l.status === "Scheduled" || l.status === "Job Confirmed", color: "bg-emerald-600 hover:bg-emerald-700" },
              ].map((st) => (
                <button
                  key={st.label}
                  type="button"
                  onClick={() =>
                    updateLeadField(l.id, {
                      status: st.status,
                      ...(st.status === "Contacted" && !l.contacted ? { contacted: new Date().toISOString() } : {}),
                    })
                  }
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 text-center leading-tight min-h-[32px] cursor-pointer ${
                    st.active
                      ? `${st.color} text-white shadow-2xs`
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80"
                  }`}
                  title={`Set status: ${st.label}`}
                >
                  {st.active && <Check className="w-2.5 h-2.5 stroke-[2.5] shrink-0" />}
                  <span className="text-center leading-tight">{st.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 4: ACTIONS (3 columns) */}
          <div className="xl:col-span-3 flex flex-col justify-between h-full space-y-2.5 xl:pl-2">
            {/* Top row: Phone, Mail, Quote, Inspection */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => callCustomer(l)}
                className="p-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                title="Call customer"
              >
                <Phone className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => emailCustomer(l)}
                className="p-1.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                title="Email customer"
              >
                <Mail className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => openQuoteModal(l)}
                className="px-3 py-1.5 border border-amber-200 bg-[#fef3c7] text-[#b45309] rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                title="Open Quote Builder"
              >
                Quote
              </button>

              <button
                type="button"
                onClick={() => openInspectionModal(l)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  l.inspectionReport?.status === "completed"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                    : "border border-cyan-300 bg-[#ecfeff] text-[#0f766e] hover:bg-cyan-100"
                }`}
                title="Inspection Report Form"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Inspection</span>
              </button>
            </div>

            {/* Bottom row: Photos, Messages, Share, and on right Edit/Delete */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openPhotosModal(l)}
                  className="relative p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 cursor-pointer"
                  title="Photos"
                >
                  <Camera className="w-4 h-4" />
                  {photosTotal > 0 && (
                    <span className="absolute -top-1 -right-1 px-1 min-w-[15px] h-3.5 bg-blue-600 text-white rounded-full text-[8px] font-black flex items-center justify-center">
                      {photosTotal}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => openMessagesModal(l)}
                  className="relative p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 cursor-pointer"
                  title="Messages"
                >
                  <MessageSquare className="w-4 h-4" />
                  {hasCustomerUnread && (
                    <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </button>

                {l.address ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 cursor-pointer flex items-center gap-1"
                    title="GPS Location"
                  >
                    <Navigation className="w-4 h-4" />
                    <span className="text-[10px] font-bold">GPS</span>
                  </a>
                ) : (
                  <div
                    className="p-1.5 text-slate-400 cursor-not-allowed flex items-center gap-1"
                    title="No address provided"
                  >
                    <Navigation className="w-4 h-4 opacity-50" />
                    <span className="text-[10px] font-bold opacity-50">GPS</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 text-slate-400">
                <button
                  type="button"
                  onClick={() => {
                    setEditingLead(l);
                    setLeadModalOpen(true);
                  }}
                  className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  title="Edit Lead"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteLead(l.id)}
                  className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                  title="Delete Lead"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Login 2 (Field / Scheduling) Custom Horizontal Lead Card ───────────────
  // Shows ONLY the items from the user-specified template in a clean horizontal row
  function renderFieldLeadRow(l: Lead) {
    const photosTotal = l.photos?.length || l.photosCount || 0;
    const hasCustomerUnread = l.messages?.some((m) => m.from === "customer" && m.read === false);
    const statusOptions = getRoleStatusOptions(role, l.status);
    const assigneeOptions = rowAssigneeOptions(l.assigned, l.status);


    return (
      <div
        key={l.id}
        className="py-4 px-4 hover:bg-slate-50/80 transition-colors rounded-xl border border-slate-200/80 bg-white mb-3 shadow-2xs"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 items-center">
          {/* SECTION 1: Client Info & Details Box (3 columns) */}
          <div className="xl:col-span-3 min-w-0 space-y-1.5">
            <div>
              <button
                type="button"
                onClick={() => {
                  setEditingLead(l);
                  setLeadModalOpen(true);
                }}
                className="font-black text-slate-900 text-base hover:text-[#001f97] hover:underline text-left transition-colors cursor-pointer truncate block w-full"
                title={l.name || "Unnamed Customer"}
              >
                {l.name || "Unnamed Customer"}
              </button>
              {(l.message || l.notes) && (
                <div className="text-xs text-slate-500 line-clamp-1">
                  {l.message || l.notes}
                </div>
              )}
            </div>

            {/* Details Box with Phone, Email, Service, and Inspection */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-2.5 text-xs space-y-1 mt-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Job No:</span>
                <span className="font-bold text-slate-900 truncate text-right">{l.jobNo || "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Phone:</span>
                <span className="font-bold text-slate-900 truncate text-right">{l.phone || "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Email:</span>
                <span className="font-medium text-slate-700 truncate text-right" title={l.email}>{l.email || "—"}</span>
              </div>
              {l.address && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400 font-semibold shrink-0">Address:</span>
                  <span className="font-medium text-slate-700 truncate text-right" title={l.address}>{l.address}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Service:</span>
                <span className="font-semibold text-slate-900 truncate text-right" title={l.service}>{l.service || "Standard Work"}</span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-slate-200/50">
                <span className="text-slate-400 font-semibold shrink-0">Inspection:</span>
                <span className="font-bold text-[#001f97] truncate text-right">
                  {l.inspectionAt ? fmtDate(l.inspectionAt) : "Not scheduled"}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: STATUS, ASSIGNED & TECHNICIAN ON SITE (3 columns) */}
          <div className="xl:col-span-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  STATUS
                </label>
                <select
                  value={l.status || "Inspection Booked"}
                  onChange={(e) => updateLeadField(l.id, { status: e.target.value })}
                  className="w-full text-xs font-bold text-emerald-700 bg-emerald-50/70 border border-emerald-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden cursor-pointer hover:border-emerald-400 truncate"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  ASSIGNED
                </label>
                <select
                  value={
                    inspectionStaff.some((s) => s.name === l.assigned || s.username === l.assigned)
                      ? (inspectionStaff.find((s) => s.name === l.assigned || s.username === l.assigned)?.name || l.assigned)
                      : "Unassigned"
                  }
                  onChange={(e) => updateLeadField(l.id, { assigned: e.target.value === "Unassigned" ? "" : e.target.value })}
                  className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden cursor-pointer hover:border-slate-300 truncate"
                >
                  <option value="Unassigned">Unassigned</option>
                  {inspectionStaff.map((s) => {
                    const label = s.name?.trim() || s.username;
                    return (
                      <option key={s.id} value={label}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <HardHat className="w-3 h-3 text-slate-500" />
                <span>TECHNICIAN ON SITE</span>
              </label>
              <select
                value={l.technicianId || ""}
                onChange={(e) => {
                  const tech = assignableTechnicians.find((t) => t.id === e.target.value);
                  updateLeadField(l.id, {
                    technicianId: e.target.value,
                    technician: tech?.name || "",
                  });
                }}
                className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden cursor-pointer hover:border-slate-300 truncate"
              >
                <option value="">Unassigned</option>
                {assignableTechnicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}{t.hasLogin ? " (Portal)" : ""}{!t.active ? " (inactive)" : ""}
                  </option>
                ))}
                {l.technicianId && !assignableTechnicians.some((t) => t.id === l.technicianId) && (
                  <option value={l.technicianId}>{l.technician || "Former technician"}</option>
                )}
              </select>
            </div>
          </div>

          {/* SECTION 3: INSPECTION LIVE VISIT & REPORT (3 columns) */}
          <div className="xl:col-span-3 space-y-2">
            {/* Inspection Live Visit micro-stages */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                INSPECTION LIVE VISIT
              </label>
              <div className="grid grid-cols-5 gap-1">
                {[
                  { label: "On the\nWay", status: "Inspection En Route", color: "bg-orange-500 hover:bg-orange-600" },
                  { label: "Reached", status: "Inspection Arrived", color: "bg-[#1e3a5f] hover:bg-[#162d4a]" },
                  { label: "Start", status: "Inspection In Progress", color: "bg-slate-600 hover:bg-slate-700" },
                  { label: "Inspection\nForm", status: "__open_form__", color: "bg-emerald-600 hover:bg-emerald-700" },
                  { label: "Complete", status: "Inspection Completed", color: "bg-teal-600 hover:bg-teal-700" },
                ].map((st) => {
                  const isFormBtn = st.status === "__open_form__";
                  const isCurrent = !isFormBtn && l.status === st.status;
                  const formFilled = l.inspectionReport?.status === "completed";
                  return (
                    <button
                      key={st.label}
                      type="button"
                      onClick={() => {
                        if (isFormBtn) { openInspectionModal(l); return; }
                        updateLeadField(l.id, { status: st.status });
                      }}
                      className={`px-1 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-0.5 text-center leading-tight min-h-[36px] cursor-pointer ${
                        isFormBtn
                          ? formFilled
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                          : isCurrent
                            ? `${st.color} text-white shadow-sm`
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80"
                      }`}
                      title={isFormBtn ? "Open Inspection Form" : `Set status: ${st.status}`}
                    >
                      {isCurrent && <Check className="w-2.5 h-2.5 stroke-[2.5] shrink-0" />}
                      <span className="text-center leading-tight whitespace-pre-line">{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Share to Booking Office banner */}
            {l.status === "Inspection Completed" ? (
              <div className="w-full px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="truncate">Shared to Booking Office — awaiting quote</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => updateLeadField(l.id, { status: "Inspection Completed" })}
                className="w-full px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Share to Booking Office"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Share to Booking Office</span>
              </button>
            )}

            {/* GROUTIX Field Inspection Report */}
            <div
              onClick={() => openInspectionModal(l)}
              className="w-full px-3 py-1.5 bg-[#001f97] hover:bg-[#001777] text-white rounded-lg flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
              title="Open Groutix Field Inspection Report"
            >
              <span className="flex items-center gap-1.5 text-xs font-bold truncate">
                <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">GROUTIX Field Inspection Report</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded shrink-0 ml-1">
                {l.inspectionReport?.status === "completed" ? "VIEW FORM" : "FILL / VIEW FORM"}
              </span>
            </div>
          </div>

          {/* SECTION 4: ACTIONS (3 columns) */}
          <div className="xl:col-span-3 flex flex-col justify-between h-full space-y-2.5 xl:pl-2">
            {/* Top row: Phone, Mail, Quote, Inspection */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => callCustomer(l)}
                className="p-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                title="Call customer"
              >
                <Phone className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => emailCustomer(l)}
                className="p-1.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                title="Email customer"
              >
                <Mail className="w-4 h-4" />
              </button>


              <button
                type="button"
                onClick={() => openInspectionModal(l)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  l.inspectionReport?.status === "completed"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                    : "border border-cyan-300 bg-[#ecfeff] text-[#0f766e] hover:bg-cyan-100"
                }`}
                title="Inspection Report Form"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Inspection</span>
              </button>
            </div>

            {/* Bottom row: Photos, Messages, Share, and on right Edit/Delete */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openPhotosModal(l)}
                  className="relative p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 cursor-pointer"
                  title="Photos"
                >
                  <Camera className="w-4 h-4" />
                  {photosTotal > 0 && (
                    <span className="absolute -top-1 -right-1 px-1 min-w-[15px] h-3.5 bg-blue-600 text-white rounded-full text-[8px] font-black flex items-center justify-center">
                      {photosTotal}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => openMessagesModal(l)}
                  className="relative p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 cursor-pointer"
                  title="Messages"
                >
                  <MessageSquare className="w-4 h-4" />
                  {hasCustomerUnread && (
                    <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </button>

                {l.address ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 cursor-pointer flex items-center gap-1"
                    title="GPS Location"
                  >
                    <Navigation className="w-4 h-4" />
                    <span className="text-[10px] font-bold">GPS</span>
                  </a>
                ) : (
                  <div
                    className="p-1.5 text-slate-400 cursor-not-allowed flex items-center gap-1"
                    title="No address provided"
                  >
                    <Navigation className="w-4 h-4 opacity-50" />
                    <span className="text-[10px] font-bold opacity-50">GPS</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 text-slate-400">
                <button
                  type="button"
                  onClick={() => {
                    setEditingLead(l);
                    setLeadModalOpen(true);
                  }}
                  className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  title="Edit Lead"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteLead(l.id)}
                  className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                  title="Delete Lead"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Login 3 (Technician / Job Execution) Custom Horizontal Lead Card ────────
  // Dedicated technician dashboard showing job execution micro-stages, checklist,
  // photos, customer contact, and one-click completion to Finance.
  function renderTechnicianLeadRow(l: Lead) {
    const photosTotal = l.photos?.length || l.photosCount || 0;
    const hasCustomerUnread = l.messages?.some((m) => m.from === "customer" && m.read === false);
    const statusOptions = getRoleStatusOptions("technician", l.status);
    const assigneeOptions = rowAssigneeOptions(l.assigned, l.status);
    const waUrl = getWhatsAppLink(l.phone);

    return (
      <div
        key={l.id}
        className="py-4 px-4 hover:bg-slate-50/80 transition-colors rounded-xl border border-slate-200/80 bg-white mb-3 shadow-2xs"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 items-center">
          {/* SECTION 1: Client Info & Details Box (3 columns) */}
          <div className="xl:col-span-3 min-w-0 space-y-1.5">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {l.jobNo || "Job"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingLead(l);
                    setLeadModalOpen(true);
                  }}
                  className="font-black text-slate-900 text-base hover:text-[#001f97] hover:underline text-left transition-colors cursor-pointer truncate block flex-1"
                  title={l.name || "Unnamed Customer"}
                >
                  {l.name || "Unnamed Customer"}
                </button>
              </div>
              {(l.message || l.notes) && (
                <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                  {l.message || l.notes}
                </div>
              )}
            </div>

            {/* Details Box with Phone, Email, Address, Service, and Job Date */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-2.5 text-xs space-y-1 mt-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Job No:</span>
                <span className="font-bold text-slate-900 truncate text-right">{l.jobNo || "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Phone:</span>
                <span className="font-bold text-slate-900 truncate text-right">{l.phone || "—"}</span>
              </div>
              {l.address && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400 font-semibold shrink-0">Address:</span>
                  <span className="font-medium text-slate-700 truncate text-right" title={l.address}>{l.address}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Service:</span>
                <span className="font-semibold text-slate-900 truncate text-right" title={l.service}>{l.service || "Standard Work"}</span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-slate-200/50">
                <span className="text-slate-400 font-semibold shrink-0">Job Date:</span>
                <span className="font-bold text-[#001f97] truncate text-right">
                  {l.jobAt ? fmtDate(l.jobAt) : l.inspectionAt ? fmtDate(l.inspectionAt) : "Booked"}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: JOB STATUS & ASSIGNED (3 columns) */}
          <div className="xl:col-span-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  JOB STATUS
                </label>
                <select
                  value={l.status || "Job Booked"}
                  onChange={(e) => updateLeadField(l.id, { status: e.target.value })}
                  className="w-full text-xs font-bold text-cyan-700 bg-cyan-50/70 border border-cyan-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden cursor-pointer hover:border-cyan-400 truncate"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  COORDINATOR
                </label>
                <select
                  value={l.assigned && !isTechnicianName(l.assigned) ? l.assigned : "Unassigned"}
                  onChange={(e) => updateLeadField(l.id, { assigned: e.target.value === "Unassigned" ? "" : e.target.value })}
                  className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden cursor-pointer hover:border-slate-300 truncate"
                >
                  {assigneeOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <HardHat className="w-3 h-3 text-slate-500" />
                <span>TECHNICIAN ON SITE</span>
              </label>
              <div className="w-full text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 truncate">
                {l.technician || "Unassigned"}
              </div>
            </div>
          </div>

          {/* SECTION 3: JOB LIVE VISIT & COMPLETION (3 columns) */}
          <div className="xl:col-span-3 space-y-2">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                JOB LIVE VISIT
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: "On the\nWay", status: "Job En Route", color: "bg-orange-500 hover:bg-orange-600" },
                  { label: "Reached", status: "Job Arrived", color: "bg-[#1e3a5f] hover:bg-[#162d4a]" },
                  { label: "In\nProgress", status: "Job In Progress", color: "bg-blue-600 hover:bg-blue-700" },
                  { label: "Job\nDone", status: "Job Done", color: "bg-emerald-600 hover:bg-emerald-700" },
                ].map((st) => {
                  const isCurrent = l.status === st.status;
                  return (
                    <button
                      key={st.label}
                      type="button"
                      onClick={() => updateLeadField(l.id, { status: st.status })}
                      className={`px-1 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-0.5 text-center leading-tight min-h-[36px] cursor-pointer ${
                        isCurrent
                          ? `${st.color} text-white shadow-sm`
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80"
                      }`}
                      title={`Set status: ${st.status}`}
                    >
                      {isCurrent && <Check className="w-2.5 h-2.5 stroke-[2.5] shrink-0" />}
                      <span className="text-center leading-tight whitespace-pre-line">{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hand-off banner / Mark Job Done */}
            {l.status === "Job Done" ? (
              <div className="w-full px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="truncate">Job Completed — Handed to Finance</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => updateLeadField(l.id, { status: "Job Done" })}
                className="w-full px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Mark Job Completed"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Mark Job Done &amp; Complete</span>
              </button>
            )}
          </div>

          {/* SECTION 4: ACTIONS (3 columns) */}
          <div className="xl:col-span-3 flex flex-col justify-between h-full space-y-2.5 xl:pl-2">
            {/* Top row: Phone, Mail, WhatsApp, Scope */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => callCustomer(l)}
                className="p-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                title="Call customer"
              >
                <Phone className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => emailCustomer(l)}
                className="p-1.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                title="Email customer"
              >
                <Mail className="w-4 h-4" />
              </button>

              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 border border-emerald-300 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                  title="WhatsApp customer"
                >
                  <Send className="w-4 h-4" />
                </a>
              )}

              <button
                type="button"
                onClick={() => openQuoteModal(l)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-200 bg-indigo-50 text-indigo-800 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
                title="View Scope of Work & Job Specifications"
              >
                <ClipboardList className="w-3.5 h-3.5 text-indigo-600" />
                <span>Scope of Work</span>
              </button>
            </div>

            {/* Bottom row: Photos, Messages, Mark Job Done */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openPhotosModal(l)}
                  className="relative p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 cursor-pointer"
                  title="Job Photos"
                >
                  <Camera className="w-4 h-4" />
                  {photosTotal > 0 && (
                    <span className="absolute -top-1 -right-1 px-1 min-w-[15px] h-3.5 bg-blue-600 text-white rounded-full text-[8px] font-black flex items-center justify-center">
                      {photosTotal}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => openMessagesModal(l)}
                  className="relative p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 cursor-pointer"
                  title="Messages"
                >
                  <MessageSquare className="w-4 h-4" />
                  {hasCustomerUnread && (
                    <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </button>
              </div>

              {l.status !== "Job Done" && (
                <button
                  type="button"
                  onClick={() => updateLeadField(l.id, { status: "Job Done" })}
                  className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="Finish Job"
                >
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  <span>Finish Job</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Login 3 (Finance / Completion) Custom Horizontal Lead Card ──────────────
  // Shows ONLY the items from the user-specified template in a clean horizontal row
  function renderFinanceLeadRow(l: Lead) {
    const photosTotal = l.photos?.length || l.photosCount || 0;
    const hasCustomerUnread = l.messages?.some((m) => m.from === "customer" && m.read === false);
    const statusOptions = getRoleStatusOptions(role, l.status);
    const assigneeOptions = rowAssigneeOptions(l.assigned, l.status);

    const financeStages = [
      { label: "Job Done", status: "Job Done", color: "bg-[#0284c7] hover:bg-[#0369a1]" },
      { label: "Payment Pending", status: "Payment Pending", color: "bg-amber-600 hover:bg-amber-700" },
      { label: "Payment Received", status: "Payment Received", color: "bg-emerald-600 hover:bg-emerald-700" },
      { label: "Warranty Sent", status: "Warranty Sent", color: "bg-indigo-600 hover:bg-indigo-700" },
      { label: "Completed", status: "Completed", color: "bg-emerald-700 hover:bg-emerald-800" },
    ];

    const leadRows = ([
      ["Address", l.address],
      ["Phone", l.phone],
      ["Email", l.email],
      ["Service", l.service],
      ["Leaking", l.leaking],
      ["Damaged tiles", l.damagedTiles],
      ["Notes", l.notes || l.message],
    ] as [string, string | undefined][]).filter((r) => r[1]) as [string, string][];

    const photoCount = l.photosCount ?? l.photos?.length ?? 0;
    const inspectionRows = ([
      ["Inspection date", l.inspectionAt ? fmtDate(l.inspectionAt) : undefined],
      [
        "Inspection report",
        l.inspectionReport?.status === "completed" ? "Completed" : l.inspectionReport ? "Draft" : undefined,
      ],
      ["Photos", photoCount > 0 ? String(photoCount) : undefined],
    ] as [string, string | undefined][]).filter((r) => r[1]) as [string, string][];

    const quoteTotal = getLeadQuoteTotal(l);
    const quoteRows = ([
      [isTechnician ? "Scope / Job Ref" : "Quote #", l.jobNo || l.quoteNumber],
      [!isTechnician && quoteTotal > 0 ? "Quote value" : "", !isTechnician && quoteTotal > 0 ? `AUD $${quoteTotal.toFixed(2)}` : undefined],
      ["Scope", l.quoteScope || l.service],
      [isTechnician ? "Scope updated" : "Quote sent", l.quoteUpdated ? fmtDate(l.quoteUpdated) : undefined],
      [
        "Quote response",
        !isTechnician && l.quoteAcceptedAt ? `Accepted ${fmtDate(l.quoteAcceptedAt)}` : !isTechnician && l.quoteDeclinedAt ? `Declined ${fmtDate(l.quoteDeclinedAt)}` : undefined,
      ],
    ] as [string, string | undefined][]).filter((r) => r[0] && r[1]) as [string, string][];

    const sections: [string, [string, string][]][] = [
      ["Lead", leadRows],
      ["Inspection", inspectionRows],
      [isTechnician ? "Scope of Work" : "Quote", quoteRows],
    ];
    const hasAny = sections.some(([, rows]) => rows.length > 0);
    const isOpen = !!openDetails[l.id];

    return (
      <div
        key={l.id}
        className="py-4 px-4 hover:bg-slate-50/80 transition-colors rounded-xl border border-slate-200/80 bg-white mb-3 shadow-2xs"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 items-start">
          {/* SECTION 1: Client Info & Details Box (3 columns) */}
          <div className="xl:col-span-3 min-w-0 space-y-1.5">
            <div>
              <button
                type="button"
                onClick={() => {
                  setEditingLead(l);
                  setLeadModalOpen(true);
                }}
                className="font-black text-slate-900 text-base hover:text-[#001f97] hover:underline text-left transition-colors cursor-pointer truncate block w-full"
                title={l.name || "Unnamed Customer"}
              >
                {l.name || "Unnamed Customer"}
              </button>
              {(l.address || l.notes || l.message) && (
                <div className="text-xs text-slate-500 line-clamp-1">
                  {l.address || l.notes || l.message}
                </div>
              )}
              {l.status === "Completed" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
                  🏆 Completed
                </span>
              )}
            </div>

            {/* Details Box with Phone, Email, Service */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-2.5 text-xs space-y-1 mt-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Job No:</span>
                <span className="font-bold text-slate-900 truncate text-right">{l.jobNo || "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Phone:</span>
                <span className="font-bold text-slate-900 truncate text-right">{l.phone || "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Email:</span>
                <span className="font-medium text-slate-700 truncate text-right" title={l.email}>{l.email || "—"}</span>
              </div>
              {l.address && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400 font-semibold shrink-0">Address:</span>
                  <span className="font-medium text-slate-700 truncate text-right" title={l.address}>{l.address}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Service:</span>
                <span className="font-semibold text-slate-900 truncate text-right" title={l.service}>{l.service || "Other"}</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: STATUS, ASSIGNED, REPORT & ACCORDION (3 columns) */}
          <div className="xl:col-span-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  STATUS
                </label>
                <select
                  value={l.status || "Job Done"}
                  onChange={(e) => updateLeadField(l.id, { status: e.target.value })}
                  className="w-full text-xs font-bold text-emerald-700 bg-emerald-50/70 border border-emerald-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden cursor-pointer hover:border-emerald-400 truncate"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s === "Completed" ? "Completed 🏆" : s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  ASSIGNED
                </label>
                <select
                  value={l.assigned && !isTechnicianName(l.assigned) ? l.assigned : "Unassigned"}
                  onChange={(e) => updateLeadField(l.id, { assigned: e.target.value === "Unassigned" ? "" : e.target.value })}
                  className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden cursor-pointer hover:border-slate-300 truncate"
                >
                  {assigneeOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inspection Report Banner */}
            <div
              onClick={() => openInspectionModal(l)}
              className="w-full px-3 py-1.5 bg-[#001f97] hover:bg-[#001777] text-white rounded-lg flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
              title="Open Groutix Field Inspection Report"
            >
              <span className="flex items-center gap-1.5 text-xs font-bold truncate">
                <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">GROUTIX Field Inspection Report</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded shrink-0 ml-1">
                {l.inspectionReport?.status === "completed" ? "VIEW FORM" : "FILL / VIEW FORM"}
              </span>
            </div>

            {/* Previous Details Accordion */}
            <div>
              <button
                type="button"
                onClick={() => setOpenDetails((prev) => ({ ...prev, [l.id]: !prev[l.id] }))}
                className="w-full px-3 py-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-slate-700 rounded-lg text-xs font-bold flex items-center justify-between transition-colors cursor-pointer border border-slate-200/60"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <ClipboardList className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span className="truncate">Previous Details — Lead → Quote</span>
                </span>
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="mt-1.5 text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80 space-y-2 max-h-56 overflow-y-auto">
                  {!hasAny && <div className="text-slate-400 italic">No earlier details recorded.</div>}
                  {sections.map(([title, rows]) =>
                    rows.length === 0 ? null : (
                      <div key={title} className="space-y-1">
                        <div className="text-[9px] font-black uppercase tracking-wider text-[#001f97]/70">{title}</div>
                        {rows.map(([k, v]) => (
                          <div key={k} className="flex items-start justify-between gap-2">
                            <span className="text-slate-400 shrink-0">{k}:</span>
                            <span className="font-semibold text-slate-700 text-right break-words">{v}</span>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: FINANCE & COMPLETION STAGES (3 columns) */}
          <div className="xl:col-span-3 space-y-2">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                FINANCE &amp; COMPLETION STAGES
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {financeStages.map((st, idx) => {
                  const isCurrent = l.status === st.status;
                  const isLast = idx === financeStages.length - 1;
                  return (
                    <button
                      key={st.label}
                      type="button"
                      onClick={() => updateLeadField(l.id, { status: st.status })}
                      className={`px-2 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 text-center leading-tight min-h-[36px] cursor-pointer ${
                        isLast ? "col-span-2" : ""
                      } ${
                        isCurrent
                          ? `${st.color} text-white shadow-2xs`
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80"
                      }`}
                      title={`Set status: ${st.label}`}
                    >
                      {isCurrent && <Check className="w-3 h-3 stroke-[2.5] shrink-0" />}
                      {st.status === "Completed" && <span className="text-xs">🏆</span>}
                      <span className="text-center leading-tight">{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 4: ACTIONS (3 columns) */}
          <div className="xl:col-span-3 flex flex-col justify-between h-full space-y-2.5 xl:pl-2">
            {/* Top row: Phone, Mail, Quote, Inspection, Invoice */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => callCustomer(l)}
                className="p-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                title="Call customer"
              >
                <Phone className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => emailCustomer(l)}
                className="p-1.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                title="Email customer"
              >
                <Mail className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => openQuoteModal(l)}
                className="px-2.5 py-1.5 border border-amber-200 bg-[#fef3c7] text-[#b45309] rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                title="Open Quote Builder"
              >
                Quote
              </button>

              <button
                type="button"
                onClick={() => openInspectionModal(l)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  l.inspectionReport?.status === "completed"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                    : "border border-cyan-300 bg-[#ecfeff] text-[#0f766e] hover:bg-cyan-100"
                }`}
                title="Inspection Report Form"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Inspection</span>
              </button>

              <button
                type="button"
                onClick={() => openInvoiceModal(l)}
                className="px-3 py-1.5 bg-[#001f97] hover:bg-[#001777] text-white rounded-lg text-xs font-black transition-colors shadow-2xs cursor-pointer"
                title="Invoice Details & Send"
              >
                Invoice
              </button>
            </div>

            {/* Bottom row: 10-Yr Warranty, Photos, Messages, Share, Edit, Trash */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => openWarrantyModal(l)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-emerald-300 bg-[#ecfdf5] text-emerald-800 hover:bg-emerald-100"
                  title="10-Year Service Warranty Certificate"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>10-Yr Warranty</span>
                </button>

                <button
                  type="button"
                  onClick={() => openPhotosModal(l)}
                  className="relative p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 cursor-pointer"
                  title="Photos"
                >
                  <Camera className="w-4 h-4" />
                  {photosTotal > 0 && (
                    <span className="absolute -top-1 -right-1 px-1 min-w-[15px] h-3.5 bg-blue-600 text-white rounded-full text-[8px] font-black flex items-center justify-center">
                      {photosTotal}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => openMessagesModal(l)}
                  className="relative p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 cursor-pointer"
                  title="Messages"
                >
                  <MessageSquare className="w-4 h-4" />
                  {hasCustomerUnread && (
                    <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => openInvoiceModal(l)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 cursor-pointer"
                  title="Send Invoice"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1 text-slate-400">
                <button
                  type="button"
                  onClick={() => {
                    setEditingLead(l);
                    setLeadModalOpen(true);
                  }}
                  className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  title="Edit Lead"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteLead(l.id)}
                  className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                  title="Delete Lead"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // ── Standard 4-Column Lead Card (Used in Leads & Bookings/Jobs views) ───────
  function renderStandardLeadCard(l: Lead) {
    const total = getLeadQuoteTotal(l);
    const photosTotal = l.photos?.length || l.photosCount || 0;
    const followupPrompt = getFollowupPrompt(l);
    const waUrl = getWhatsAppLink(l.phone);
    const hasCustomerUnread = l.messages?.some((m) => m.from === "customer" && m.read === false);
    const hasReplied = l.messages?.some((m) => m.from === "customer");

    return (
      <div
        key={l.id}
        className="py-5 px-3 hover:bg-slate-50/60 transition-colors rounded-xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          {/* COLUMN 0: CLIENT (includes Service & Photos) */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2.5">
              {/* Left: Client info */}
              <div className="flex-1 min-w-0">
                <div className="xl:hidden text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Job No
                </div>
                <div className="font-black text-[#001f97] text-sm xl:text-base whitespace-nowrap tracking-tight mb-1">
                  {l.jobNo || "—"}
                </div>
                <div className="font-bold text-slate-900 text-sm truncate" title={l.name || "Unnamed Customer"}>
                  {l.name || "Unnamed Customer"}
                </div>

                <div className="space-y-1 text-xs text-slate-600 mt-1">
                  {l.email ? (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate" title={l.email}>{l.email}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span>No email</span>
                    </div>
                  )}

                  {l.phone ? (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{l.phone}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>No phone</span>
                    </div>
                  )}

                  {l.address && (
                    <div className="text-[11px] text-slate-400 italic pt-0.5 truncate" title={l.address}>
                      {l.address}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Manual Status Dropdown & Badges */}
              <div className="w-[145px] shrink-0 space-y-1.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={l.status || "New"}
                    onChange={(e) => updateLeadField(l.id, { status: e.target.value })}
                    className={`w-full text-xs px-2 py-1.5 rounded-lg border font-semibold min-h-[34px] cursor-pointer shadow-2xs transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#001f97] ${
                      l.status === "Completed"
                        ? "bg-emerald-50/60 border-emerald-300 text-emerald-900 hover:border-emerald-400"
                        : "bg-white border-slate-200 text-slate-800 hover:border-[#001f97]"
                    }`}
                    title="Change status manually"
                  >
                    {(role === "intake" ? getRoleStatusOptions(role, l.status) : Array.from(new Set([l.status, ...STATUS_LIST, "Payment Request"])).filter(Boolean)).map((s) => (
                      <option key={s} value={s}>
                        {s === "Completed" ? "Completed 🏆" : s === "Won" ? "Won (Quote Accepted)" : s === "Lost" ? "Lost / Closed" : s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-1">
                  {l.status === "Completed" && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
                      🏆 Completed
                    </span>
                  )}
                  {l.invoiceOpenedAt && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 whitespace-nowrap"
                    >
                      <Eye className="w-2.5 h-2.5 text-emerald-600" />
                      Opened
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Service & Received */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <div className="font-bold text-xs text-slate-900 line-clamp-2 uppercase tracking-tight" title={l.service}>
                {l.service || "Standard Work"}
              </div>

              <div />
            </div>

            {/* Photos / Camera Button */}
            <div className="pt-0.5">
              <button
                onClick={() => openPhotosModal(l)}
                className="w-full px-3 py-2 bg-[#f1f5f9] hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-between border border-slate-200/80 transition-colors cursor-pointer"
                title="View & upload job / inspection photos"
              >
                <span className="flex items-center gap-2 text-slate-800">
                  <Camera className="w-3.5 h-3.5 text-slate-600" />
                  <span>Photos / Camera</span>
                </span>
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-blue-100 text-[#001f97] text-[11px] font-black flex items-center justify-center">
                  {photosTotal}
                </span>
              </button>
            </div>

            {/* Contact Action Buttons */}
            <div className="space-y-1.5 pt-0.5">
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => callCustomer(l)}
                  className="flex items-center justify-center gap-1 py-1.5 px-1 bg-[#e8f0fe] hover:bg-blue-100 text-[#1e40af] rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                  title="Call customer phone"
                >
                  <Phone className="w-3 h-3 shrink-0" />
                  <span>Call</span>
                </button>

                <button
                  type="button"
                  onClick={() => emailCustomer(l)}
                  className="flex items-center justify-center gap-1 py-1.5 px-1 bg-[#e8f0fe] hover:bg-blue-100 text-[#1e40af] rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                  title="Send email"
                >
                  <Mail className="w-3 h-3 shrink-0" />
                  <span>Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => openMessagesModal(l, "sms")}
                  className="flex items-center justify-center gap-1 py-1.5 px-1 bg-[#e8f0fe] hover:bg-blue-100 text-[#1e40af] rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                  title="Send SMS"
                >
                  <span>SMS</span>
                </button>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 py-1.5 px-1 bg-[#e8f0fe] hover:bg-blue-100 text-[#1e40af] rounded-lg text-xs font-bold transition-colors shadow-2xs"
                  title="Open WhatsApp chat"
                >
                  <span>WhatsApp</span>
                </a>
              </div>

              {/* Conversation and Edit buttons on same line */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openMessagesModal(l)}
                  className="flex-1 py-2 px-3 bg-[#e8f0fe]/80 hover:bg-blue-100 text-[#1e40af] rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-blue-200/70 transition-colors cursor-pointer"
                  title="Open messaging conversation"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>
                    {hasCustomerUnread
                      ? "Customer replied!"
                      : hasReplied
                        ? "Customer replied"
                        : "Conversation"}
                  </span>
                  {hasCustomerUnread && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </button>

                <button
                  onClick={() => {
                    setEditingLead(l);
                    setLeadModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#dbeafe] hover:bg-blue-200 text-[#1d4ed8] text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleDeleteLead(l.id)}
                  title="Delete Lead"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#fee2e2] hover:bg-rose-200 text-rose-700 text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* COLUMN 2: INSPECTION & QUOTE */}
          <div className="space-y-2.5">
            {/* ── 1. Inspection Booked & Assigned Dropdown ── */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Inspection &amp; Assigned
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 items-center">
                <button
                  type="button"
                  onClick={() => updateLeadField(l.id, { status: "Inspection Booked" })}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 text-center leading-tight min-h-[34px] cursor-pointer ${
                    l.status === "Inspection Booked" || INSPECTION_PHASE.includes(l.status)
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80"
                  }`}
                  title="Set status: Inspection Booked"
                >
                  {(l.status === "Inspection Booked" || INSPECTION_PHASE.includes(l.status)) && (
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  )}
                  <span className="text-center leading-tight">Inspection Booked</span>
                </button>

                <select
                  value={
                    inspectionStaff.some((s) => s.name === l.assigned || s.username === l.assigned)
                      ? (inspectionStaff.find((s) => s.name === l.assigned || s.username === l.assigned)?.name || l.assigned)
                      : "Unassigned"
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    updateLeadField(l.id, {
                      assigned: val === "Unassigned" ? "" : val,
                    });
                  }}
                  className="w-full text-[11px] px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-hidden min-h-[34px] cursor-pointer"
                  title="Assign inspector"
                >
                  <option value="Unassigned">Unassigned</option>
                  {inspectionStaff.map((s) => {
                    const label = s.name?.trim() || s.username;
                    return (
                      <option key={s.id} value={label}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* ── 2. Inspection Live Visit ── */}
            {(() => {
              const steps = visitStepsFor(l.status) || INSPECTION_STEPS;
              const currentIdx = steps.findIndex((s) => s.status === l.status);
              return (
                <div className="pt-0.5">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    Inspection live visit
                  </label>
                  <div className="grid grid-cols-5 gap-1">
                    {steps.map((step, idx) => {
                      const done = currentIdx >= 0 && idx <= currentIdx;
                      const isNext = idx === currentIdx + 1;
                      if (step.label === "Start") {
                        return (
                          <div key={step.status + "-group"} className="contents">
                            <button
                              key={step.status}
                              type="button"
                              onClick={() => updateLeadField(l.id, { status: step.status })}
                              className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                                done
                                  ? "bg-amber-500 text-white"
                                  : isNext
                                    ? "bg-[#001f97] text-white hover:bg-[#001777]"
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                              }`}
                              title={`Set status: ${step.status}`}
                            >
                              {step.label}
                            </button>
                            <button
                              key="inspection-form-inline"
                              type="button"
                              onClick={() => openInspectionModal(l)}
                              className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                                l.inspectionReport?.status === "completed"
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                              }`}
                              title={l.inspectionReport?.status === "completed" ? "Inspection form completed" : "Open Inspection form"}
                            >
                              Inspection form
                            </button>
                          </div>
                        );
                      }
                      return (
                        <button
                          key={step.status}
                          type="button"
                          onClick={() => updateLeadField(l.id, { status: step.status })}
                          className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                            done
                              ? "bg-amber-500 text-white"
                              : isNext
                                ? "bg-[#001f97] text-white hover:bg-[#001777]"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                          title={`Set status: ${step.status}`}
                        >
                          {step.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* ── 3. Hand-off: Share to Booking Office ── */}
            <div className="pt-0.5">
              {l.status === "Inspection Completed" ? (
                <div className="w-full px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  Shared to Booking Office — awaiting quote
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => updateLeadField(l.id, { status: "Inspection Completed" })}
                  className="w-full px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  title="Send this lead back to the Booking Office (Login 1) with all inspection info so they can send the quote"
                >
                  <Send className="w-4 h-4" />
                  Share to Booking Office
                </button>
              )}
            </div>

            {/* ── 4. Quote quick status ── */}
            <div className="grid grid-cols-4 gap-1.5 items-center">
              <button
                onClick={() => openQuoteModal(l)}
                className="px-1 py-1.5 rounded-lg text-[10px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Open quote builder"
              >
                Quote
              </button>
              {([
                { label: "Sent", status: "Quote Sent", color: "bg-blue-600 hover:bg-blue-700" },
                { label: "Job Booked", status: "Job Booked", color: "bg-violet-600 hover:bg-violet-700" },
              ] as const).map((st) => (
                <button
                  key={st.status}
                  type="button"
                  onClick={() => updateLeadField(l.id, { status: st.status })}
                  className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                    l.status === st.status
                      ? st.color + " text-white ring-2 ring-offset-1 ring-current"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                  title={`Set: ${st.status}`}
                >
                  {st.label}
                </button>
              ))}
              <select
                value={
                  assignableTechnicians.find(
                    (t) => t.id === l.technicianId || (l.technician && t.name.toLowerCase() === l.technician.toLowerCase())
                  )?.id || ""
                }
                onChange={(e) => {
                  const tech = assignableTechnicians.find((t) => t.id === e.target.value);
                  updateLeadField(l.id, {
                    technicianId: e.target.value,
                    technician: tech?.name || "",
                  });
                }}
                className="w-full text-[10px] px-1 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-hidden cursor-pointer truncate"
                title="Assign technician"
              >
                <option value="">Assign Tech</option>
                {assignableTechnicians
                  .filter((t) => t.active !== false)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                {l.technicianId && !assignableTechnicians.some((t) => t.id === l.technicianId) && (
                  <option value={l.technicianId}>{l.technician || "Former tech"}</option>
                )}
              </select>
            </div>

            {/* ── 5. Job Status ── */}
            {(() => {
              const steps = JOB_STEPS;
              const currentIdx = steps.findIndex((s) => s.status === l.status);
              return (
                <div className="pt-0.5">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    Job Status
                  </label>
                  <div className="grid grid-cols-5 gap-1">
                    {steps.map((step, idx) => {
                      const done = currentIdx >= 0 && idx <= currentIdx;
                      const isNext = idx === currentIdx + 1;
                      const isJobDone = step.status === "Job Done";
                      if (step.label === "Start") {
                        return (
                          <div key={step.status + "-group"} className="contents">
                            <button
                              key={step.status}
                              type="button"
                              onClick={() => updateLeadField(l.id, { status: step.status })}
                              className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                                done
                                  ? "bg-amber-500 text-white"
                                  : isNext
                                    ? "bg-[#001f97] text-white hover:bg-[#001777]"
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                              }`}
                              title={`Set status: ${step.status}`}
                            >
                              {step.label}
                            </button>
                            <button
                              key="job-done-inline"
                              type="button"
                              onClick={() => updateLeadField(l.id, { status: "Job Done" })}
                              className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                                l.status === "Job Done"
                                  ? "bg-sky-600 text-white ring-2 ring-offset-1 ring-current"
                                  : ["Job Done", "Invoice Sent", "Payment Request", "Payment Pending", "Payment Received", "Warranty Sent", "Completed"].includes(l.status)
                                    ? "bg-sky-600 text-white"
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                              }`}
                              title="Set: Job Done"
                            >
                              Job Done
                            </button>
                          </div>
                        );
                      }
                      if (isJobDone) return null;
                      return (
                        <button
                          key={step.status}
                          type="button"
                          onClick={() => updateLeadField(l.id, { status: step.status })}
                          className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                            done
                              ? "bg-amber-500 text-white"
                              : isNext
                                ? "bg-[#001f97] text-white hover:bg-[#001777]"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                          title={`Set status: ${step.status}`}
                        >
                          {step.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => openGpsModal(l)}
                      title={l.gps ? "GPS Location Recorded" : "GPS Navigation"}
                      className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center justify-center ${
                        l.gps
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200"
                      }`}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* COLUMN 3: FOLLOW-UP & CONVERSATION */}
          <div className="space-y-2.5">
            {/* ── FINANCE SUMMARY ── */}
            <div className="p-2 space-y-1.5">
              {/* Invoice & Payment status badges */}
                {l.invoiceSentAt && (
                  <div className="text-[10px] font-bold px-2 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>Invoice Sent — {fmtDate(l.invoiceSentAt)}</span>
                  </div>
                )}
                {l.invoiceOpenedAt ? (
                  <div className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Invoice Opened</span>
                    </span>
                    <span className="text-[9.5px] font-black text-emerald-700">
                      {fmtDate(l.invoiceOpenedAt)}
                    </span>
                  </div>
                ) : l.invoiceSentAt ? (
                  <div className="text-[10px] font-medium px-2 py-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-slate-400 shrink-0 opacity-40" />
                      <span>Invoice Opened</span>
                    </span>
                    <span className="text-[9px] text-amber-600 font-semibold">Not opened yet</span>
                  </div>
                ) : null}
                {l.quoteAcceptedAt && (
                  <div className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>Quote Accepted — {fmtDate(l.quoteAcceptedAt)}</span>
                  </div>
                )}

                {l.status === "Completed" && (
                  <div className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span>🏆</span>
                      <span>Saved in Achievements</span>
                    </span>
                    <span className="text-[9px] font-bold bg-emerald-700 text-white px-1.5 py-0.5 rounded">Completed Record</span>
                  </div>
                )}

                {/* Finance quick actions */}
                <div className="grid grid-cols-1 gap-2">
                  {([
                    { label: "Invoice", step: "Invoice Sent", color: "bg-sky-600 hover:bg-sky-700" },
                    { label: "Sent", step: "Payment Request", color: "bg-blue-600 hover:bg-blue-700" },
                    { label: "Pending Payment", step: "Payment Pending", color: "bg-amber-600 hover:bg-amber-700" },
                    { label: "Received", step: "Payment Received", color: "bg-green-600 hover:bg-green-700" },
                    { label: "Warranty Sent", step: "Warranty Sent", color: "bg-slate-700 hover:bg-slate-800" },
                    { label: "Completed Jobs", step: "Completed", color: "bg-emerald-600 hover:bg-emerald-700" },
                  ] as const).map((st) => {
                    const isActive = getStepActive(l, st.step);
                    return (
                      <button
                        key={st.step}
                        type="button"
                        onClick={() => {
                          if (st.step === "Invoice Sent") openInvoiceModal(l);
                          else if (st.step === "Warranty Sent") openWarrantyModal(l);
                          else updateLeadField(l.id, { status: st.step });
                        }}
                        className={`px-2 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer text-center ${
                          isActive
                            ? st.color + " text-white ring-2 ring-offset-1 ring-current shadow-xs"
                            : "bg-[#001f97] text-white hover:bg-[#0029c4]"
                        }`}
                        title={`${st.label}`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>
          </div>

          {/* COLUMN 4: WORKFLOW */}
          <div className="space-y-2">
            {/* Follow-up card */}
            <div className="bg-[#fee2e2]/70 border border-rose-200/80 rounded-xl p-2.5">
              <div className="text-[10px] font-black tracking-wider text-rose-800 uppercase">
                FOLLOW-UP
              </div>
              <div className="text-xs font-semibold text-slate-800 mt-0.5">
                {followupPrompt}
              </div>
            </div>

            {/* 6 Step Checklist */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "New", step: "New" },
                { label: "Inspection Booked", step: "Inspection Booked" },
                { label: "Inspection Completed", step: "Inspection Completed" },
                { label: "Quote Sent", step: "Quote Sent" },
                { label: "Job Booked", step: "Job Booked" },
                { label: "Invoice Sent", step: "Invoice Sent" },
                { label: "Payment Pending", step: "Payment Pending" },
                { label: "Payment Received", step: "Payment Received" },
                { label: "Warranty Sent", step: "Warranty Sent" }
              ].map(({ label, step }) => {
                const isActive = getStepActive(l, step);
                return (
                  <button
                    key={step}
                    onClick={() => {
                      if (step === "Invoice Sent") openInvoiceModal(l);
                      else if (step === "Warranty Sent") openWarrantyModal(l);
                      else updateLeadField(l.id, { status: step });
                    }}
                    className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${isActive
                        ? "bg-[#ccfbf1]/80 text-[#0f766e] border-teal-200/80 shadow-2xs"
                        : "bg-[#f8fafc] text-slate-600 border-slate-200/70 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    title={`Click to manage ${label}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{label}</span>
                      {step === "Invoice Sent" && l.invoiceOpenedAt && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-0.5 whitespace-nowrap"
                        >
                          <Eye className="w-2.5 h-2.5 text-emerald-600" />
                          Opened
                        </span>
                      )}
                    </div>
                    {isActive ? (
                      <Check className="w-3.5 h-3.5 text-[#0f766e] stroke-[2.5]" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Complete & Archive Button */}
            {l.status === "Completed" ? (
              <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-xl text-center text-xs font-black text-emerald-800 flex items-center justify-center gap-1.5">
                <span>🏆</span>
                <span>Completed & Saved To Achievements</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => updateLeadField(l.id, { status: "Completed" })}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Mark this lead as completed and save to Achievements"
              >
                <span>Complete &amp; Save to Achievements 🏆</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }


  // Role queue: non-managers only see the leads whose current stage their role
  // owns. Managers see the whole book. Legacy leads are hidden by default
  // unless the manager explicitly toggles showLegacyLeads.
  const scopedLeads = useMemo(() => {
    const roleScoped =
      role === "manager" || role === "super_admin"
        ? leads
        : leads.filter((l) => {
            if (!inRoleQueue(role, l.status)) return false;
            // When logged in as technician or viewing as technician:
            if (role === "technician") {
              const myStaff = staff.find((s) => s.username === username);
              const targetName = (viewAs ? viewAs.name : (myStaff?.name || username || "")).trim().toLowerCase();
              const targetUser = (viewAs ? viewAs.name : username).trim().toLowerCase();
              const targetId = viewAs ? null : myStaff?.id;
              if (l.technicianId || l.technician) {
                const assignedId = l.technicianId;
                const assignedName = (l.technician || "").trim().toLowerCase();
                const matches =
                  (targetId && assignedId === targetId) ||
                  (assignedId && (assignedId.toLowerCase() === targetUser || assignedId.toLowerCase() === targetName)) ||
                  (assignedName && (assignedName === targetName || assignedName === targetUser));
                return matches;
              }
              // Allow technicians to view unassigned leads in their queue
              return true;
            }
            return true;
          });
    if (showLegacyLeads) return roleScoped;
    if (newLeadsCutoffMs <= 0) return roleScoped;
    return roleScoped.filter((l) => !isLegacyLead(l, newLeadsCutoffMs));
  }, [leads, role, showLegacyLeads, newLeadsCutoffMs, staff, username, viewAs]);

  const hiddenLegacyCount = useMemo(() => {
    if (newLeadsCutoffMs <= 0) return 0;
    const pool = (role === "manager" || role === "super_admin") ? leads : leads.filter((l) => inRoleQueue(role, l.status));
    return pool.filter((l) => isLegacyLead(l, newLeadsCutoffMs)).length;
  }, [leads, role, newLeadsCutoffMs]);

  // Filtering & Search
  const filteredLeads = useMemo(() => {
    let list = scopedLeads;
    const q = globalSearch.toLowerCase().trim();
    if (q) {
      // Support searching by job number e.g. "1201", "JobNo-1201", "job 1201", "job-1201", "GQ-1201", "#1201"
      const numMatch = q.match(/^(?:job(?:no)?[\s#-]*|gq[\s#-]*|#)?(\d+)$/i);
      const searchNum = numMatch ? numMatch[1] : null;

      list = list.filter((l) => {
        if (searchNum && l.jobNo) {
          const lDigits = l.jobNo.replace(/\D/g, "");
          if (lDigits.includes(searchNum)) return true;
        }
        return [l.jobNo, l.name, l.phone, l.email, l.service, l.address, l.notes, l.message]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      });
    }
    if (statusFilter) {
      // statusFilter may be a single status (dropdown) or a "|"-joined group
      // of statuses (KPI cards like Inspections / Won that cover several stages).
      const wanted = statusFilter.split("|");
      list = list.filter((l) => wanted.includes(l.status));
    }
    if (priorityFilter) {
      list = list.filter((l) => l.priority === priorityFilter);
    }
    if (onlyUnread) {
      list = list.filter((l) =>
        l.messages?.some((m) => m.from === "customer" && m.read === false)
      );
    }
    return list;
  }, [scopedLeads, globalSearch, statusFilter, priorityFilter, onlyUnread]);

  // Leads with at least one unread customer reply — drives the header bell badge.
  const unreadReplyCount = useMemo(
    () =>
      scopedLeads.filter((l) =>
        l.messages?.some((m) => m.from === "customer" && m.read === false)
      ).length,
    [scopedLeads]
  );

  // When the unread-reply count rises, alert in-app: a desktop notification
  // (if permitted) plus a count in the browser tab title so it's noticeable
  // even from another tab. Only fires on an increase, never on first load.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title =
        unreadReplyCount > 0 ? `(${unreadReplyCount}) Groutix CRM` : "Groutix CRM";
    }
    const prev = prevUnreadReplies.current;
    prevUnreadReplies.current = unreadReplyCount;
    if (prev === null || unreadReplyCount <= prev) return;
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        const n = new Notification("New customer reply", {
          body: `${unreadReplyCount} conversation${unreadReplyCount === 1 ? "" : "s"} with unread customer replies.`,
          icon: "/logo.png",
          tag: "groutix-reply",
        });
        n.onclick = () => {
          window.focus();
          n.close();
        };
      } catch {
        /* ignore */
      }
    }
  }, [unreadReplyCount]);

  // Counts for KPIs (scoped to the role's queue)
  const counts = useMemo(() => {
    const res: Record<string, number> = {};
    STATUS_LIST.forEach((s) => {
      res[s] = scopedLeads.filter((l) => l.status === s).length;
    });
    return res;
  }, [scopedLeads]);

  // Derived lists backing the Quotes and Jobs views, so we can both count them
  // and paginate the same array.
  const quoteLeads = useMemo(
    () => filteredLeads.filter((l) => l.quoteItems?.length || l.status === "Quote Sent" || l.quoteTerms),
    [filteredLeads]
  );
  const jobLeads = useMemo(
    () =>
      filteredLeads.filter((l) =>
        role === "finance"
          ? FINANCE_STATUSES.includes(l.status)
          : role === "intake"
            ? INTAKE_STATUSES.includes(l.status)
            : role === "technician"
              ? TECHNICIAN_STATUSES.includes(l.status) || Boolean(l.technicianId) || Boolean(l.technician)
              : role === "inspection" || role === "field"
                ? INSPECTION_STATUSES.includes(l.status)
                : JOB_STATUSES.includes(l.status)
      ),
    [filteredLeads, role]
  );

  // Keep the page in range if the current view's list shrinks (e.g. a lead was
  // deleted while paging), so we don't get stuck on an empty page.
  useEffect(() => {
    const total =
      currentView === "leads"
        ? filteredLeads.length
        : currentView === "quotes"
          ? quoteLeads.length
          : currentView === "jobs"
            ? jobLeads.length
            : currentView === "customers"
              ? scopedLeads.length
              : 0;
    const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (page > maxPage) setPage(maxPage);
  }, [currentView, page, filteredLeads.length, quoteLeads.length, jobLeads.length, scopedLeads.length]);

  // Clicking a dashboard KPI card drops the user into the full leads table with
  // that stage (or group of stages) pre-filtered. Groups are passed as several
  // statuses and joined with "|" so filteredLeads matches any of them.
  const openLeadsFiltered = useCallback(
    (statuses: string[]) => {
      setPriorityFilter("");
      setGlobalSearch("");
      setOnlyUnread(false);
      setStatusFilter(statuses.join("|"));
      setCurrentView("leads");
    },
    []
  );

  // Open the "inbox": the leads table filtered to conversations that have an
  // unread customer reply. Used by the header bell and the hero's Open Inbox.
  const openInbox = useCallback(() => {
    setPriorityFilter("");
    setGlobalSearch("");
    setStatusFilter("");
    setOnlyUnread(true);
    setCurrentView("leads");
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(() => { });
    }
  }, []);

  // Start a brand-new lead from anywhere (hero button, etc.).
  const startNewLead = useCallback(() => {
    setEditingLead({
      status: "New",
      assigned: "",
      priority: "Medium",
      received: new Date().toISOString().slice(0, 16),
    });
    setLeadModalOpen(true);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f5f7fb] text-[#14213d]">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-[#e4e9f1] p-4 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-3 pb-6 border-b border-[#e4e9f1]">
            <div className="w-10 h-10 rounded-xl bg-[#001f97] text-white flex items-center justify-center font-black text-xl shadow-sm">
              G
            </div>
            <div>
              <div className="font-black text-lg leading-tight text-[#001f97]">Groutix Portal</div>
              <div className="text-xs text-slate-400">CRM & Administration</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-5 flex flex-col gap-1.5">
            {canSee("dashboard") && (
              <button
                onClick={() => setCurrentView("dashboard")}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${currentView === "dashboard"
                    ? "bg-[#001f97] text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100"
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  CRM Dashboard
                </span>
              </button>
            )}

            {canSee("leads") && (
              <button
                onClick={() => setCurrentView("leads")}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${currentView === "leads"
                    ? "bg-[#001f97] text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100"
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <Users className="w-4 h-4" />
                  Leads
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${currentView === "leads" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                >
                  {scopedLeads.length}
                </span>
              </button>
            )}

            {canSee("quotes") && (
              <button
                onClick={() => setCurrentView("quotes")}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${currentView === "quotes"
                    ? "bg-[#001f97] text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100"
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  Quotes
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${currentView === "quotes" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                >
                  {scopedLeads.filter((l) => l.status === "Quote Sent" || l.quoteItems?.length).length}
                </span>
              </button>
            )}

            {canSee("jobs") && (
              <button
                onClick={() => setCurrentView("jobs")}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${currentView === "jobs"
                    ? "bg-[#001f97] text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100"
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4" />
                  {role === "finance"
                    ? "Finance & Jobs"
                    : role === "intake"
                      ? "Leads & Bookings"
                      : role === "technician"
                        ? "Jobs & Work"
                        : role === "inspection" || role === "field"
                          ? "Inspections"
                          : "Bookings & Jobs"}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${currentView === "jobs" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                >
                  {role === "finance"
                    ? scopedLeads.filter((l) => FINANCE_STATUSES.includes(l.status)).length
                    : role === "intake"
                      ? scopedLeads.filter((l) => INTAKE_STATUSES.includes(l.status)).length
                      : role === "technician"
                        ? scopedLeads.filter((l) => TECHNICIAN_STATUSES.includes(l.status)).length
                        : role === "inspection" || role === "field"
                          ? scopedLeads.filter((l) => INSPECTION_STATUSES.includes(l.status)).length
                          : scopedLeads.filter((l) => JOB_STATUSES.includes(l.status)).length}
                </span>
              </button>
            )}

            {canSee("schedule") && (
              <button
                onClick={() => setCurrentView("schedule")}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${currentView === "schedule"
                    ? "bg-[#001f97] text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100"
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4" />
                  Schedule
                </span>
              </button>
            )}

            {canSee("customers") && (
              <button
                onClick={() => setCurrentView("customers")}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${currentView === "customers"
                    ? "bg-[#001f97] text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100"
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <Users className="w-4 h-4" />
                  Customers
                </span>
              </button>
            )}

            {canSee("team") && (
              <button
                onClick={() => setCurrentView("team")}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${currentView === "team"
                    ? "bg-[#001f97] text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100"
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4" />
                  Team
                </span>
                {totalUnread > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center">
                    {totalUnread}
                  </span>
                )}
              </button>
            )}

            {canSee("technicians") && (
              <button
                onClick={() => setCurrentView("technicians")}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${currentView === "technicians"
                    ? "bg-[#001f97] text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100"
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <HardHat className="w-4 h-4" />
                  Technicians
                </span>
              </button>
            )}

            {canSee("analytics") && (
              <button
                onClick={() => setCurrentView("analytics")}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${currentView === "analytics"
                    ? "bg-[#001f97] text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100"
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4" />
                  Analytics Overview
                </span>
              </button>
            )}

            {(role === "manager" || role === "super_admin") && (
              <div className="pt-3 mt-3 border-t border-[#e4e9f1] flex flex-col gap-1.5">
                <Link
                  href={`${basePath}/users`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  <UserCheck className="w-4 h-4" />
                  Staff Accounts
                </Link>
                <Link
                  href={`${basePath}/content`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  <FileText className="w-4 h-4" />
                  Site Content Editor
                </Link>
              </div>
            )}
          </nav>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-20 bg-white border-b border-[#e4e9f1] px-6 flex items-center justify-between gap-4 sticky top-0 z-10 shadow-xs">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight capitalize">
              {currentView === "dashboard"
                ? "Manager Dashboard"
                : currentView === "analytics"
                  ? "Analytics & Performance"
                  : currentView === "leads"
                    ? "All Leads"
                    : currentView === "quotes"
                      ? "Quotations"
                      : currentView === "jobs"
                        ? "Jobs & Bookings"
                        : currentView === "customers"
                          ? "Customer Directory"
                          : currentView === "schedule"
                            ? "Schedule & Calendar"
                            : currentView === "technicians"
                              ? "Field Technicians"
                              : "Team Members"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Search */}
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search job #, name, phone, service..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#001f97] focus:bg-white transition-colors"
              />
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <button
              onClick={logout}
              disabled={loggingOut}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              {loggingOut ? "Signing out…" : "Sign Out"}
            </button>


            {/* Unread customer replies bell — visible on every view/role. */}
            <button
              onClick={openInbox}
              title={
                unreadReplyCount > 0
                  ? `${unreadReplyCount} conversation(s) with unread replies`
                  : "No unread customer replies"
              }
              className="relative p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Bell className={`w-4 h-4 ${unreadReplyCount > 0 ? "text-[#001f97]" : ""}`} />
              {unreadReplyCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                  {unreadReplyCount}
                </span>
              )}
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => loadData()}
              title="Refresh database records"
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin text-[#001f97]" : ""}`} />
            </button>

            {/* Sync Emails Button */}
            <button
              onClick={handleSyncEmails}
              disabled={syncingEmails}
              title="Sync Inbox"
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <Mail className={`w-4 h-4 ${syncingEmails ? "animate-pulse" : ""}`} />
              Sync Inbox
            </button>

            {/* Add Lead Button */}
            <button
              onClick={() => {
                setEditingLead({
                  status: "New",
                  assigned: "",
                  priority: "Medium",
                  received: new Date().toISOString().slice(0, 16)
                });
                setLeadModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#001f97] text-white text-xs font-bold rounded-xl hover:bg-[#001777] shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Lead
            </button>

            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${viewAs
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-slate-200 bg-white text-slate-700"
                }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${viewAs ? "bg-amber-500" : "bg-emerald-500"
                  }`}
              ></span>
              {viewAs
                ? `Viewing as ${viewAs.name} • ${roleLabel}`
                : username
                  ? `${username} • ${roleLabel}`
                  : roleLabel}
            </div>
          </div>
        </header>

        {/* View Contents */}
        <div className="p-6 space-y-6 flex-1">
          {/* Impersonation banner — manager previewing another role's dashboard. */}
          {viewAs && (
            <div className="p-3 px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  You are viewing <b>{viewAs.name}</b>&rsquo;s dashboard ({roleLabel}).
                  Changes you make still act as the manager account.
                </span>
              </div>
              <button
                onClick={returnToManager}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Return to Manager
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center justify-between">
              <div>
                <b>Notice:</b> {error}
              </div>
              <button
                onClick={() => loadData()}
                className="text-xs bg-amber-200/60 px-3 py-1 rounded-lg font-semibold hover:bg-amber-200"
              >
                Retry
              </button>
            </div>
          )}

          {/* =========================================================================
              VIEW: ANALYTICS OVERVIEW (Previous Admin Dashboard)
             ========================================================================= */}
          {currentView === "analytics" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#e4e9f1]">
                <h2 className="text-base font-black text-slate-900">Submission Analytics & Trends</h2>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-slate-300 bg-white p-0.5">
                    {[7, 14, 30, 90].map((r) => (
                      <button
                        key={r}
                        onClick={() => setAnalyticsDays(r)}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${analyticsDays === r ? "bg-[#001f97] text-white" : "text-slate-600 hover:bg-slate-100"
                          }`}
                      >
                        {r}d
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => loadAnalytics(analyticsDays)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    <RefreshCcw className={`h-3.5 w-3.5 ${loadingStats ? "animate-spin" : ""}`} />
                    Refresh Stats
                  </button>
                </div>
              </div>

              {stats ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    <StatCard label="Total leads" value={stats.total} accent />
                    <StatCard label="New / unread" value={stats.newCount} />
                    <StatCard label="Today" value={stats.today} />
                    <StatCard label="Last 7 days" value={stats.last7Days} />
                    <StatCard label="Last 30 days" value={stats.last30Days} />
                  </div>

                  <Panel title={`Submissions over the last ${analyticsDays} days`}>
                    <TimelineChart data={stats.timeline} />
                  </Panel>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <Panel title="By enquiry type">
                      <BarList
                        items={[
                          { label: "Quote requests", count: stats.byType.find((t) => t.type === "quote")?.count ?? 0 },
                          { label: "Support tickets", count: stats.byType.find((t) => t.type === "support_ticket")?.count ?? 0 },
                        ]}
                      />
                    </Panel>
                    <Panel title="By status">
                      <BarList
                        items={stats.byStatus.map((s) => ({
                          label: s.status[0].toUpperCase() + s.status.slice(1),
                          count: s.count,
                        }))}
                      />
                    </Panel>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-3">
                    <Panel title="Top enquiry categories">
                      <BarList items={stats.topEnquiries} />
                    </Panel>
                    <Panel title="Top cities / suburbs">
                      <BarList items={stats.topCities} />
                    </Panel>
                    <Panel title="Top source pages">
                      <BarList items={stats.topSources} />
                    </Panel>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-slate-400">Loading analytics data...</div>
              )}
            </div>
          )}

          {/* =========================================================================
              VIEW: CRM DASHBOARD
             ========================================================================= */}
          {currentView === "dashboard" && (
            <div className="space-y-6">
              {/* Today at a glance — hero shortcut bar to run the whole business
                  from one screen. */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#001f97] to-[#0a34c4] text-white p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">
                      Groutix Operations
                    </div>
                    <h2 className="text-2xl font-black mt-1">Today at a glance</h2>
                    <p className="text-sm text-white/70 mt-1">
                      Run the whole business from one screen.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => setCurrentView("jobs")}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold transition-colors backdrop-blur-sm"
                    >
                      <Briefcase className="w-4 h-4" />
                      Open Dispatch
                    </button>
                    <button
                      onClick={openInbox}
                      className="relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold transition-colors backdrop-blur-sm"
                    >
                      <Mail className="w-4 h-4" />
                      Open Inbox
                      {unreadReplyCount > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center">
                          {unreadReplyCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={startNewLead}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-[#001f97] text-sm font-black hover:bg-white/90 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      New Lead
                    </button>
                    {isManager && (
                      <button
                        onClick={() => setShowLegacyLeads((v) => !v)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors backdrop-blur-sm ${
                          showLegacyLeads
                            ? "bg-amber-400 text-[#001f97] hover:bg-amber-300"
                            : "bg-white/15 text-white hover:bg-white/25"
                        }`}
                        title={showLegacyLeads ? "Hide legacy leads" : `Show ${hiddenLegacyCount > 0 ? hiddenLegacyCount : ""} archived legacy leads`}
                      >
                        {showLegacyLeads ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                        {showLegacyLeads ? "Hide Legacy" : "Show Legacy"}
                        {!showLegacyLeads && hiddenLegacyCount > 0 && (
                          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center">
                            {hiddenLegacyCount}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Full pipeline breakdown — one clickable box per lead status so
                  every stage is visible and filters the leads table on click.
                  Sourced from the shared STAGES list so it can never drift from
                  the real pipeline. */}
              <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-slate-900">Pipeline by Stage</h2>
                  <span className="text-[11px] text-slate-400">Click any stage to filter the leads table</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {([
                    { label: "Total Leads", group: "lead" as StageGroup, statuses: [] as string[], totalCount: true },
                    { label: "New leads", group: "lead" as StageGroup, statuses: ["New"] },
                    { label: "Contacted", group: "lead" as StageGroup, statuses: ["Contacted", "Waiting for Info"] },
                    {
                      label: "Inspection",
                      group: "booking" as StageGroup,
                      statuses: [
                        "Inspection Booked",
                        "Inspection En Route",
                        "Inspection Arrived",
                        "Inspection In Progress",
                        "Inspection Completed",
                      ],
                    },
                    { label: "Quotes", group: "quote" as StageGroup, statuses: ["Quote Pending", "Quote Sent", "Negotiation", "Won"] },
                    { label: "Pending Quote", group: "quote" as StageGroup, statuses: ["Quote Pending"] },
                    {
                      label: "Job Booked",
                      group: "job" as StageGroup,
                      statuses: ["Job Booked", "Scheduled", "Job Confirmed", "Job En Route", "Job Arrived", "Job In Progress"],
                    },
                    { label: "Job Done", group: "finance" as StageGroup, statuses: ["Job Done"] },
                    { label: "Payment Pending", group: "finance" as StageGroup, statuses: ["Payment Pending"] },
                    { label: "Payment Received", group: "finance" as StageGroup, statuses: ["Invoice Sent", "Payment Pending", "Payment Received"] },
                    { label: "Warranty Sent", group: "finance" as StageGroup, statuses: ["Warranty Sent"] },
                    { label: "Achievements", group: "closed" as StageGroup, statuses: ["Completed"] },
                  ] as { label: string; group: StageGroup; statuses: string[]; totalCount?: boolean }[]).map((grp) => {
                    const accent = STAGE_GROUP_ACCENT[grp.group];
                    const value = grp.totalCount
                      ? scopedLeads.length
                      : grp.statuses.reduce((a, k) => a + (counts[k] || 0), 0);
                    const filterKey = grp.statuses.join("|");
                    const active = grp.totalCount
                      ? statusFilter === ""
                      : statusFilter === filterKey;
                    return (
                      <button
                        key={grp.label}
                        type="button"
                        onClick={() => grp.totalCount ? openLeadsFiltered([]) : openLeadsFiltered(grp.statuses)}
                        className={`p-3 rounded-xl border text-left transition-all hover:shadow-sm focus:outline-hidden focus:ring-2 focus:ring-[#001f97]/30 cursor-pointer ${active
                            ? "border-[#001f97] bg-[#001f97]/5"
                            : "border-slate-200 bg-slate-50/60 hover:border-[#001f97]/40"
                          }`}
                        title={grp.totalCount ? "Show all leads (clear stage filter)" : `Show ${grp.label} leads`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`w-2 h-2 rounded-full ${grp.totalCount ? "bg-[#001f97]" : accent.dot}`} />
                          <span className="text-[11px] font-bold text-slate-600 leading-tight line-clamp-1">
                            {grp.label}
                          </span>
                        </div>
                        <div className={`text-2xl font-black ${value ? (grp.totalCount ? "text-[#001f97]" : accent.value) : "text-slate-300"}`}>
                          {value}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Grid: Recent Leads & Today's Attention */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Lead Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-black text-slate-900">Recent Customer Leads</h2>
                    <button
                      onClick={() => setCurrentView("leads")}
                      className="text-xs font-bold text-[#001f97] hover:underline"
                    >
                      View All ({leads.length}) →
                    </button>
                  </div>

                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Customer</th>
                          <th className="py-2.5 px-3">Service / Task</th>
                          <th className="py-2.5 px-3">Stage</th>
                          <th className="py-2.5 px-3">Assigned</th>
                          <th className="py-2.5 px-3">Follow-Up</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredLeads.slice(0, 10).map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-black text-[#001f97] text-[11px] tracking-tight mb-0.5">{l.jobNo || "—"}</div>
                              <div className="font-bold text-slate-900">{l.name || "Unnamed"}</div>
                              <div className="text-[11px] text-slate-400">{l.phone || l.email || "No contact"}</div>
                            </td>
                            <td className="py-3 px-3 max-w-[200px]">
                              <div className="line-clamp-2 text-slate-700 font-medium" title={l.service}>
                                {l.service || "General enquiry"}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex flex-col items-start gap-1">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border ${getBadgeColor(l.status)}`}>
                                  {l.status}
                                </span>
                                <QuoteResponseBadge lead={l} />
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-600 font-medium">{l.assigned || "Unassigned"}</td>
                            <td className="py-3 px-3 text-slate-500">{l.follow ? fmtDate(l.follow) : "—"}</td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1 flex-nowrap">
                                <button
                                  onClick={() => openQuoteModal(l)}
                                  className="px-2 py-1 bg-[#001f97]/10 text-[#001f97] hover:bg-[#001f97]/20 rounded-lg text-[11px] font-bold transition-colors"
                                  title="Open Quote Builder"
                                >
                                  Quote
                                </button>
                                <button
                                  onClick={() => openPhotosModal(l)}
                                  className="p-1 text-slate-500 hover:text-[#001f97] hover:bg-slate-100 rounded-md"
                                  title="Photos"
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openMessagesModal(l)}
                                  className="relative p-1 text-slate-500 hover:text-[#001f97] hover:bg-slate-100 rounded-md"
                                  title="Conversation"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  {l.messages?.some(m => m.from === "customer" && m.read === false) && (
                                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white" />
                                  )}
                                </button>
                                <button
                                  onClick={() => openGpsModal(l)}
                                  className="p-1 text-slate-500 hover:text-[#001f97] hover:bg-slate-100 rounded-md"
                                  title="GPS"
                                >
                                  <Navigation className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openInspectionModal(l)}
                                  className={`p-1 rounded-md transition-colors ${l.inspectionReport?.status === "completed"
                                      ? "text-emerald-600 hover:bg-emerald-50"
                                      : "text-slate-500 hover:text-[#001f97] hover:bg-slate-100"
                                    }`}
                                  title="Inspection Report Form"
                                >
                                  <ClipboardList className="w-3.5 h-3.5" />
                                </button>
                                {l.status === "Payment Received" && (
                                  <button
                                    onClick={() => openWarrantyModal(l)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md"
                                    title="10-Year Warranty Card"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setEditingLead(l);
                                    setLeadModalOpen(true);
                                  }}
                                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md"
                                  title="Edit"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLead(l.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredLeads.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400">
                              {loading ? "Loading leads from database…" : "No customer leads in the database yet."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Col: Attention & Task Panel */}
                <div className="space-y-6">
                  {/* Attention Card */}
                  <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs">
                    <h2 className="text-base font-black text-slate-900 mb-3">Today's Attention</h2>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-bold">
                        <span>New Uncontacted Leads</span>
                        <span className="px-2 py-0.5 bg-rose-200/70 rounded-md font-black">{counts["New"] || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-xs font-bold">
                        <span>Quotes Pending Approval</span>
                        <span className="px-2 py-0.5 bg-amber-200/70 rounded-md font-black">{counts["Quote Pending"] || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-800 text-xs font-bold">
                        <span>Waiting For Customer Info</span>
                        <span className="px-2 py-0.5 bg-purple-200/70 rounded-md font-black">{counts["Waiting for Info"] || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-xs font-bold">
                        <span>Active Negotiations</span>
                        <span className="px-2 py-0.5 bg-blue-200/70 rounded-md font-black">{counts["Negotiation"] || 0}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW: LEADS (Modern 4-Column Card Layout)
             ========================================================================= */}
          {currentView === "leads" && (
            <div className="space-y-6">
              {/* Today at a glance — hero shortcut bar to run the whole business from one screen. */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#001f97] to-[#0a34c4] text-white p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">
                      Groutix Operations
                    </div>
                    <h2 className="text-2xl font-black mt-1">Today at a glance</h2>
                    <p className="text-sm text-white/70 mt-1">
                      Run the whole business from one screen.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setCurrentView("jobs")}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold transition-colors backdrop-blur-sm cursor-pointer"
                    >
                      <Briefcase className="w-4 h-4" />
                      Open Dispatch
                    </button>
                    <button
                      type="button"
                      onClick={openInbox}
                      className="relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold transition-colors backdrop-blur-sm cursor-pointer"
                    >
                      <Mail className="w-4 h-4" />
                      Open Inbox
                      {unreadReplyCount > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center">
                          {unreadReplyCount}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={startNewLead}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-[#001f97] text-sm font-black hover:bg-white/90 transition-colors cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      New Lead
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLegacyLeads((v) => !v)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors backdrop-blur-sm cursor-pointer ${
                        showLegacyLeads
                          ? "bg-amber-400 text-[#001f97] hover:bg-amber-300"
                          : "bg-white/15 text-white hover:bg-white/25"
                      }`}
                      title={showLegacyLeads ? "Hide legacy leads" : `Show ${hiddenLegacyCount > 0 ? hiddenLegacyCount : ""} archived legacy leads`}
                    >
                      <Eye className="w-4 h-4" />
                      {showLegacyLeads ? "Hide Legacy" : "Show Legacy"}
                      {!showLegacyLeads && hiddenLegacyCount > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center">
                          {hiddenLegacyCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Pipeline by Stage (for Leads view / Login 1) */}
              <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-900">Pipeline by Stage</h2>
                    {statusFilter && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#001f97]/10 text-[#001f97]">
                        Filtered: {statusFilter}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {statusFilter && (
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("");
                          setPage(1);
                        }}
                        className="text-[11px] font-bold text-[#001f97] hover:underline cursor-pointer"
                      >
                        Clear Filter
                      </button>
                    )}
                    <span className="text-[11px] text-slate-400 hidden sm:inline">Click any stage to filter the leads table</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {(() => {
                    // Grouped dashboard "buttons" per role (matches the login sketches).
                    // Each button filters the leads table to all of its statuses.
                    type Grp = { label: string; group: StageGroup; statuses: string[]; totalCount?: boolean };
                    const intakeGroups: Grp[] = [
                      { label: "Total Leads", group: "lead", statuses: [], totalCount: true },
                      { label: "New leads", group: "lead", statuses: ["New"] },
                      { label: "Contacted", group: "lead", statuses: ["Contacted", "Waiting for Info"] },
                      {
                        label: "Inspections",
                        group: "booking",
                        statuses: [
                          "Inspection Booked",
                          "Inspection En Route",
                          "Inspection Arrived",
                          "Inspection In Progress",
                          "Inspection Completed",
                        ],
                      },
                      { label: "Quotes", group: "quote", statuses: ["Quote Pending", "Quote Sent", "Negotiation", "Won"] },
                      { label: "Pending Quote", group: "quote", statuses: ["Quote Pending"] },
                      { label: "Job Booked", group: "job", statuses: ["Job Booked", "Scheduled", "Job Confirmed"] },
                    ];
                    // Manager sees the full pipeline end-to-end across every login.
                    const managerGroups: Grp[] = [
                      { label: "Total Leads", group: "lead", statuses: [], totalCount: true },
                      { label: "New leads", group: "lead", statuses: ["New"] },
                      { label: "Contacted", group: "lead", statuses: ["Contacted", "Waiting for Info"] },
                      {
                        label: "Inspection",
                        group: "booking",
                        statuses: [
                          "Inspection Booked",
                          "Inspection En Route",
                          "Inspection Arrived",
                          "Inspection In Progress",
                          "Inspection Completed",
                        ],
                      },
                      { label: "Quotes", group: "quote", statuses: ["Quote Pending", "Quote Sent", "Negotiation", "Won"] },
                      { label: "Pending Quote", group: "quote", statuses: ["Quote Pending"] },
                      {
                        label: "Job Booked",
                        group: "job",
                        statuses: [
                          "Job Booked",
                          "Scheduled",
                          "Job Confirmed",
                          "Job En Route",
                          "Job Arrived",
                          "Job In Progress",
                        ],
                      },
                      { label: "Job Done", group: "finance", statuses: ["Job Done"] },
                      { label: "Payment Pending", group: "finance", statuses: ["Payment Pending"] },
                      { label: "Payment Received", group: "finance", statuses: ["Invoice Sent", "Payment Pending", "Payment Received"] },
                      { label: "Warranty Sent", group: "finance", statuses: ["Warranty Sent"] },
                      { label: "Achievements", group: "closed", statuses: ["Completed"] },
                    ];
                    const groups: Grp[] =
                      role === "intake"
                        ? intakeGroups
                        : role === "manager"
                          ? managerGroups
                          : [
                            { label: "Total Leads", group: "lead", statuses: [], totalCount: true },
                            ...STAGES.map((s) => ({ label: s.label, group: s.group, statuses: [s.key] })),
                          ];
                    return groups.map((grp) => {
                      const accent = STAGE_GROUP_ACCENT[grp.group] || { dot: "bg-blue-500", value: "text-[#001f97]" };
                      const value = grp.totalCount
                        ? scopedLeads.length
                        : grp.statuses.reduce((a, k) => a + (counts[k] || 0), 0);
                      const joined = grp.statuses.join("|");
                      const active = grp.totalCount
                        ? statusFilter === ""
                        : statusFilter === joined;
                      return (
                        <button
                          key={grp.label}
                          type="button"
                          onClick={() => {
                            if (grp.totalCount) {
                              setStatusFilter("");
                            } else {
                              setStatusFilter(active ? "" : joined);
                            }
                            setPage(1);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all hover:shadow-sm focus:outline-hidden focus:ring-2 focus:ring-[#001f97]/30 cursor-pointer ${active
                              ? "border-[#001f97] bg-[#001f97]/5 ring-1 ring-[#001f97]"
                              : "border-slate-200 bg-slate-50/60 hover:border-[#001f97]/40"
                            }`}
                          title={grp.totalCount ? "Show all leads (clear stage filter)" : `Show ${grp.label} leads`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`w-2 h-2 rounded-full ${grp.totalCount ? "bg-[#001f97]" : accent.dot}`} />
                            <span className="text-[11px] font-bold text-slate-600 leading-tight line-clamp-1">
                              {grp.label}
                            </span>
                          </div>
                          <div className={`text-2xl font-black ${value ? (grp.totalCount ? "text-[#001f97]" : accent.value) : "text-slate-300"}`}>
                            {value}
                          </div>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs space-y-4">
                {/* Filter Toolbar matching screenshot */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3 flex-wrap flex-1">
                    <div className="relative flex-1 min-w-[280px]">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search job #, name, phone, email, service..."
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#001f97] focus:bg-white transition-colors"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-hidden"
                    >
                      <option value="">All statuses ({leads.length})</option>
                      {STATUS_LIST.map((s) => (
                        <option key={s} value={s}>
                          {s} ({counts[s] || 0})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => setOnlyUnread((v) => !v)}
                      className={`flex items-center gap-1.5 text-xs px-3.5 py-2.5 rounded-xl border font-semibold transition-colors ${onlyUnread
                          ? "bg-[#001f97] text-white border-[#001f97]"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      title="Show only conversations with an unread customer reply"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Unread replies
                      {unreadReplyCount > 0 && (
                        <span
                          className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center ${onlyUnread ? "bg-white/25 text-white" : "bg-rose-500 text-white"
                            }`}
                        >
                          {unreadReplyCount}
                        </span>
                      )}
                    </button>

                    {(statusFilter || globalSearch || onlyUnread) && (
                      <button
                        onClick={() => {
                          setStatusFilter("");
                          setPriorityFilter("");
                          setGlobalSearch("");
                          setOnlyUnread(false);
                        }}
                        className="text-xs text-rose-600 hover:underline font-semibold"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>

                  <div className="text-xs font-semibold text-slate-500">
                    Showing {filteredLeads.length} of {leads.length} leads
                  </div>
                </div>

                {/* Table / Card Header Bar */}
                {role === "intake" ? (
                  <div className="hidden xl:grid grid-cols-12 gap-4 px-5 py-3 bg-[#e8f0fe] text-[#1e3a8a] text-xs font-black uppercase tracking-wider rounded-xl mb-3">
                    <div className="col-span-3">CLIENT DETAILS</div>
                    <div className="col-span-3">STATUS &amp; FOLLOW-UP</div>
                    <div className="col-span-3">INTAKE WORKFLOW STAGES</div>
                    <div className="col-span-3">ACTIONS</div>
                  </div>
                ) : role === "inspection" || role === "field" ? (
                  <div className="hidden xl:grid grid-cols-12 gap-4 px-5 py-3 bg-[#e8f0fe] text-[#1e3a8a] text-xs font-black uppercase tracking-wider rounded-xl mb-3">
                    <div className="col-span-3">CLIENT DETAILS</div>
                    <div className="col-span-3">INSPECTION &amp; ASSIGNED</div>
                    <div className="col-span-3">INSPECTION LIVE VISIT</div>
                    <div className="col-span-3">ACTIONS</div>
                  </div>
                ) : role === "technician" ? (
                  <div className="hidden xl:grid grid-cols-12 gap-4 px-5 py-3 bg-[#e8f0fe] text-[#1e3a8a] text-xs font-black uppercase tracking-wider rounded-xl mb-3">
                    <div className="col-span-3">CLIENT DETAILS</div>
                    <div className="col-span-3">JOB STATUS &amp; ASSIGNED</div>
                    <div className="col-span-3">JOB LIVE VISIT</div>
                    <div className="col-span-3">ACTIONS</div>
                  </div>
                ) : role === "finance" ? (
                  <div className="hidden xl:grid grid-cols-12 gap-4 px-5 py-3 bg-[#e8f0fe] text-[#1e3a8a] text-xs font-black uppercase tracking-wider rounded-xl mb-3">
                    <div className="col-span-3">CLIENT DETAILS</div>
                    <div className="col-span-3">STATUS &amp; REPORTS</div>
                    <div className="col-span-3">FINANCE &amp; COMPLETION STAGES</div>
                    <div className="col-span-3">ACTIONS</div>
                  </div>
                ) : (
                  <div className="hidden xl:grid grid-cols-4 gap-6 px-5 py-3 bg-[#e8f0fe] text-[#1e3a8a] text-xs font-black uppercase tracking-wider rounded-xl">
                    <div>CLIENT</div>
                    <div>INSPECTION &amp; QUOTE</div>
                    <div>FINANCE</div>
                    <div>WORKFLOW</div>
                  </div>
                )}

                {/* Leads List */}
                <div className="divide-y divide-slate-200/80">
                  {filteredLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((l) => {
                    if ((role as string) === "intake") {
                      return renderIntakeLeadRow(l);
                    }
                    if ((role as string) === "inspection" || (role as string) === "field") {
                      return renderFieldLeadRow(l);
                    }
                    if ((role as string) === "technician") {
                      return renderTechnicianLeadRow(l);
                    }
                    if ((role as string) === "finance") {
                      return renderFinanceLeadRow(l);
                    }
                    return renderStandardLeadCard(l);
                  })}

                  {filteredLeads.length === 0 && (
                    <div className="py-16 text-center text-slate-400">
                      No leads matching the current filters.
                    </div>
                  )}
                </div>

                <Pagination page={page} pageSize={PAGE_SIZE} total={filteredLeads.length} onPage={setPage} />
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW: QUOTES
             ========================================================================= */}
          {currentView === "quotes" && (
            <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-black text-slate-900">Active & Prepared Quotations</h2>
                  <div className="text-xs text-slate-500">
                    {quoteLeads.length} Quotes in System
                  </div>
                </div>
                <div className="relative w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search job #, customer, phone..."
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#001f97] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Phone</th>
                      <th className="py-3 px-3">Service Scope</th>
                      <th className="py-3 px-3">Quote Total</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Updated</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quoteLeads
                      .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                      .map((l) => {
                        const items = Array.isArray(l.quoteItems) ? l.quoteItems : [];
                        const sub = items.reduce((a, x) => a + Number(x.price || 0) * Number(x.qty || 1), 0);
                        const total = l.quoteAmount || (l.quoteTaxMode === "exclusive" ? sub * (1 + (l.quoteTaxRate || 10) / 100) : sub);
                        return (
                          <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-black text-[#001f97] text-[11px] tracking-tight mb-0.5">{l.jobNo || "—"}</div>
                              <div className="font-bold text-slate-900">{l.name || "Customer"}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-600">{l.phone || "—"}</td>
                            <td className="py-3 px-3 text-slate-700 max-w-[240px] truncate">
                              {l.service || items[0]?.service || "Standard Work"}
                            </td>
                            <td className="py-3 px-3 font-black text-slate-900">
                              AUD ${total.toFixed(2)}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex flex-col items-start gap-1">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] border ${getBadgeColor(l.status)}`}>
                                  {l.status}
                                </span>
                                <QuoteResponseBadge lead={l} />
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-500">{l.quoteUpdated ? fmtDate(l.quoteUpdated) : "—"}</td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => openQuoteModal(l)}
                                className="px-3 py-1.5 bg-[#001f97] text-white hover:bg-[#001777] rounded-lg text-xs font-bold transition-colors"
                              >
                                Open Quote
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pageSize={PAGE_SIZE} total={quoteLeads.length} onPage={setPage} />
            </div>
          )}

          {/* =========================================================================
              VIEW: JOBS / BOOKINGS
             ========================================================================= */}
          {currentView === "jobs" && (
            <div className="space-y-6">
              {/* Pipeline by Stage (for Jobs & Finance view / Login 2 & 3) */}
              <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-900">
                      {role === "finance" ? "Finance Pipeline by Stage" : "Jobs Pipeline by Stage"}
                    </h2>
                    {statusFilter && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#001f97]/10 text-[#001f97]">
                        Filtered: {statusFilter}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {statusFilter && (
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("");
                          setPage(1);
                        }}
                        className="text-[11px] font-bold text-[#001f97] hover:underline cursor-pointer"
                      >
                        Clear Filter
                      </button>
                    )}
                    <span className="text-[11px] text-slate-400 hidden sm:inline">Click any stage to filter jobs</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {(() => {
                    // Grouped dashboard "buttons" per role (matches the login sketches).
                    // Each button filters the board to all of its statuses.
                    type Grp = { label: string; group: StageGroup; statuses: string[]; totalCount?: boolean };
                    const single = (keys: string[]) =>
                      STAGES.filter((s) => keys.includes(s.key)).map((s) => ({
                        label: s.label,
                        group: s.group,
                        statuses: [s.key],
                      }));
                    const groups: Grp[] =
                      role === "intake"
                        ? [
                          { label: "Total Leads", group: "lead", statuses: [], totalCount: true },
                          { label: "New leads", group: "lead", statuses: ["New"] },
                          { label: "Contacted", group: "lead", statuses: ["Contacted", "Waiting for Info"] },
                          {
                            label: "Inspections",
                            group: "booking",
                            statuses: [
                              "Inspection Booked",
                              "Inspection En Route",
                              "Inspection Arrived",
                              "Inspection In Progress",
                              "Inspection Completed",
                            ],
                          },
                          { label: "Quotes", group: "quote", statuses: ["Quote Pending", "Quote Sent", "Negotiation", "Won"] },
                          { label: "Pending Quote", group: "quote", statuses: ["Quote Pending"] },
                          { label: "Job Booked", group: "job", statuses: ["Job Booked", "Scheduled", "Job Confirmed"] },
                        ]
                        : role === "finance"
                          ? [
                            { label: "Total Leads", group: "lead", statuses: [], totalCount: true },
                            ...single(["Job Done", "Payment Pending", "Payment Received", "Warranty Sent", "Completed"]),
                          ]
                          : role === "inspection" || role === "field"
                            ? [
                              { label: "Total Inspections", group: "lead", statuses: [], totalCount: true },
                              ...single(["Inspection Booked", "Inspection Completed"]),
                            ]
                          : role === "technician"
                            ? [
                              { label: "Total Jobs", group: "job", statuses: [], totalCount: true },
                              ...single(["Job Booked", "Scheduled", "Job Confirmed", "Job Done"]),
                            ]
                            : role === "manager"
                              ? [
                                { label: "Total Leads", group: "lead", statuses: [], totalCount: true },
                                { label: "New leads", group: "lead", statuses: ["New"] },
                                { label: "Contacted", group: "lead", statuses: ["Contacted", "Waiting for Info"] },
                                {
                                  label: "Inspection",
                                  group: "booking",
                                  statuses: [
                                    "Inspection Booked",
                                    "Inspection En Route",
                                    "Inspection Arrived",
                                    "Inspection In Progress",
                                    "Inspection Completed",
                                  ],
                                },
                                { label: "Quotes", group: "quote", statuses: ["Quote Pending", "Quote Sent", "Negotiation", "Won"] },
                                { label: "Pending Quote", group: "quote", statuses: ["Quote Pending"] },
                                {
                                  label: "Job Booked",
                                  group: "job",
                                  statuses: ["Job Booked", "Scheduled", "Job Confirmed", "Job En Route", "Job Arrived", "Job In Progress"],
                                },
                                { label: "Job Done", group: "finance", statuses: ["Job Done"] },
                                { label: "Payment Pending", group: "finance", statuses: ["Payment Pending"] },
                                { label: "Payment Received", group: "finance", statuses: ["Invoice Sent", "Payment Pending", "Payment Received"] },
                                { label: "Warranty Sent", group: "finance", statuses: ["Warranty Sent"] },
                                { label: "Achievements", group: "closed", statuses: ["Completed"] },
                              ]
                              : [
                                { label: "Total Leads", group: "lead", statuses: [], totalCount: true },
                                ...STAGES.filter((s) => FIELD_STATUSES.includes(s.key) || FINANCE_STATUSES.includes(s.key)).map((s) => ({
                                  label: s.label,
                                  group: s.group,
                                  statuses: [s.key],
                                })),
                              ];
                    return groups.map((grp) => {
                      const accent = STAGE_GROUP_ACCENT[grp.group] || { dot: "bg-cyan-500", value: "text-cyan-600" };
                      const value = grp.totalCount
                        ? scopedLeads.length
                        : grp.statuses.reduce((a, k) => a + (counts[k] || 0), 0);
                      const joined = grp.statuses.join("|");
                      const active = grp.totalCount
                        ? statusFilter === ""
                        : statusFilter === joined;
                      return (
                        <button
                          key={grp.label}
                          type="button"
                          onClick={() => {
                            if (grp.totalCount) {
                              setStatusFilter("");
                            } else {
                              setStatusFilter(active ? "" : joined);
                            }
                            setPage(1);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all hover:shadow-sm focus:outline-hidden focus:ring-2 focus:ring-[#001f97]/30 cursor-pointer ${active
                              ? "border-[#001f97] bg-[#001f97]/5 ring-1 ring-[#001f97]"
                              : "border-slate-200 bg-slate-50/60 hover:border-[#001f97]/40"
                            }`}
                          title={grp.totalCount ? "Show all leads (clear stage filter)" : `Filter by ${grp.label}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`w-2 h-2 rounded-full ${grp.totalCount ? "bg-[#001f97]" : accent.dot}`} />
                            <span className="text-[11px] font-bold text-slate-600 leading-tight line-clamp-1">
                              {grp.label}
                            </span>
                          </div>
                          <div className={`text-2xl font-black ${value ? (grp.totalCount ? "text-[#001f97]" : accent.value) : "text-slate-300"}`}>
                            {value}
                          </div>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs space-y-4">
                <div className="space-y-3 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-black text-slate-900">
                        {role === "finance"
                          ? "Finance & Job Completion"
                          : role === "intake"
                            ? "Leads & Bookings"
                            : role === "technician"
                              ? "Technician Jobs & Work"
                              : role === "inspection" || role === "field"
                                ? "Inspection Visits"
                                : "Bookings & Jobs"}
                      </h2>
                      <div className="text-xs text-slate-500">
                        {role === "finance"
                          ? `Showing ${jobLeads.length} completed jobs for invoicing, payment & warranty`
                          : role === "intake"
                            ? `Showing ${jobLeads.length} active leads from New to Job Booked`
                            : role === "technician"
                              ? `Showing ${jobLeads.length} assigned jobs from Booked to Job Done`
                              : role === "inspection" || role === "field"
                                ? `Showing ${jobLeads.length} inspection bookings and visit reports`
                                : `Showing ${jobLeads.length} bookings & jobs from Inspection Booked to Job Done`}
                      </div>
                    </div>
                  </div>

                  {/* Filter Toolbar for all roles */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-2 pt-1">
                    <div className="flex items-center gap-3 flex-wrap flex-1">
                      <div className="relative flex-1 min-w-[280px]">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search job #, name, phone, email, service..."
                          value={globalSearch}
                          onChange={(e) => setGlobalSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#001f97] focus:bg-white transition-colors"
                        />
                      </div>

                      {/* Quick Status Filter Dropdown */}
                      {(() => {
                        // Full role status set drives the "All Active" count; the dropdown
                        // itself lists only the curated stages that match the dashboard
                        // buttons (the micro-stages stay out of the filter to reduce noise).
                        const boardStatuses = getRoleStatusOptions(role);
                        const filterOptions =
                          role === "inspection" || role === "field"
                            ? ["Inspection Booked", "Inspection En Route", "Inspection Arrived", "Inspection In Progress", "Inspection Completed"]
                            : role === "technician"
                              ? ["Job Booked", "Scheduled", "Job Confirmed", "Job En Route", "Job Arrived", "Job In Progress", "Job Done"]
                              : role === "finance"
                                ? ["Job Done", "Payment Pending", "Payment Received", "Warranty Sent", "Completed"]
                                : role === "intake"
                                  ? ["New", "Contacted", "Inspection Booked", "Quote Pending", "Job Booked"]
                                  : boardStatuses;
                        const allLabel =
                          role === "finance"
                            ? "All Finance Jobs"
                            : role === "intake"
                              ? "All Leads"
                              : "All Active";
                        const totalActive = scopedLeads.filter((l) => boardStatuses.includes(l.status)).length;
                        return (
                          <select
                            value={filterOptions.includes(statusFilter) ? statusFilter : ""}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-hidden"
                          >
                            <option value="">{allLabel} ({totalActive})</option>
                            {filterOptions.map((st) => {
                              const count = scopedLeads.filter((l) => l.status === st).length;
                              return (
                                <option key={st} value={st}>
                                  {st} ({count})
                                </option>
                              );
                            })}
                          </select>
                        );
                      })()}

                      {(statusFilter || globalSearch) && (
                        <button
                          onClick={() => {
                            setStatusFilter("");
                            setGlobalSearch("");
                          }}
                          className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1 rounded-md hover:bg-rose-50 transition-colors"
                        >
                          Clear filter
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Table / Card Header Bar */}
                {role === "intake" ? (
                  <div className="hidden xl:grid grid-cols-12 gap-4 px-5 py-3 bg-[#e8f0fe] text-[#1e3a8a] text-xs font-black uppercase tracking-wider rounded-xl mb-3">
                    <div className="col-span-3">CLIENT DETAILS</div>
                    <div className="col-span-3">STATUS &amp; FOLLOW-UP</div>
                    <div className="col-span-3">INTAKE WORKFLOW STAGES</div>
                    <div className="col-span-3">ACTIONS</div>
                  </div>
                ) : role === "inspection" || role === "field" ? (
                  <div className="hidden xl:grid grid-cols-12 gap-4 px-5 py-3 bg-[#e8f0fe] text-[#1e3a8a] text-xs font-black uppercase tracking-wider rounded-xl mb-3">
                    <div className="col-span-3">CLIENT DETAILS</div>
                    <div className="col-span-3">INSPECTION &amp; ASSIGNED</div>
                    <div className="col-span-3">INSPECTION LIVE VISIT</div>
                    <div className="col-span-3">ACTIONS</div>
                  </div>
                ) : role === "technician" ? (
                  <div className="hidden xl:grid grid-cols-12 gap-4 px-5 py-3 bg-[#e8f0fe] text-[#1e3a8a] text-xs font-black uppercase tracking-wider rounded-xl mb-3">
                    <div className="col-span-3">CLIENT DETAILS</div>
                    <div className="col-span-3">JOB STATUS &amp; ASSIGNED</div>
                    <div className="col-span-3">JOB LIVE VISIT</div>
                    <div className="col-span-3">ACTIONS</div>
                  </div>
                ) : role === "finance" ? (
                  <div className="hidden xl:grid grid-cols-12 gap-4 px-5 py-3 bg-[#e8f0fe] text-[#1e3a8a] text-xs font-black uppercase tracking-wider rounded-xl mb-3">
                    <div className="col-span-3">CLIENT DETAILS</div>
                    <div className="col-span-3">STATUS &amp; REPORTS</div>
                    <div className="col-span-3">FINANCE &amp; COMPLETION STAGES</div>
                    <div className="col-span-3">ACTIONS</div>
                  </div>
                ) : (
                  <div className="hidden xl:grid grid-cols-4 gap-6 px-5 py-3 bg-[#e8f0fe] text-[#1e3a8a] text-xs font-black uppercase tracking-wider rounded-xl">
                    <div>CLIENT</div>
                    <div>INSPECTION &amp; QUOTE</div>
                    <div>FINANCE</div>
                    <div>WORKFLOW</div>
                  </div>
                )}

                {/* Jobs / Bookings List */}
                <div className="divide-y divide-slate-200/80">
                  {jobLeads
                    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                    .map((l) => {
                      if ((role as string) === "intake") {
                        return renderIntakeLeadRow(l);
                      }
                      if ((role as string) === "inspection" || (role as string) === "field") {
                        return renderFieldLeadRow(l);
                      }
                      if ((role as string) === "technician") {
                        return renderTechnicianLeadRow(l);
                      }
                      if ((role as string) === "finance") {
                        return renderFinanceLeadRow(l);
                      }
                      return renderStandardLeadCard(l);
                    })}

                  {jobLeads.length === 0 && (
                    <div className="py-16 text-center text-slate-400 text-sm">
                      No bookings or jobs matching this filter.
                    </div>
                  )}
                </div>
                <Pagination page={page} pageSize={PAGE_SIZE} total={jobLeads.length} onPage={setPage} />
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW: CUSTOMERS
             ========================================================================= */}
          {currentView === "customers" && (
            <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-black text-slate-900">Customer Directory ({filteredLeads.length} Records)</h2>
                  <div className="text-xs text-slate-500">
                    Live client contact and property records
                  </div>
                </div>
                <div className="relative w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search job #, customer, phone, address..."
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#001f97] focus:bg-white transition-colors"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Customer Name</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Property Address</th>
                      <th className="py-2.5 px-3">Total Work Value</th>
                      <th className="py-2.5 px-3">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3">
                          <div className="font-black text-[#001f97] text-[11px] tracking-tight mb-0.5">{l.jobNo || "—"}</div>
                          <div className="font-bold text-slate-900">{l.name || "Customer"}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{l.phone || "—"}</td>
                        <td className="py-3 px-3 text-slate-600">{l.email || "—"}</td>
                        <td className="py-3 px-3 text-slate-600">{l.address || "Melbourne, VIC"}</td>
                        <td className="py-3 px-3 font-bold text-emerald-700">
                          {l.quoteAmount ? `AUD $${l.quoteAmount.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-3 px-3 text-slate-400">{fmtDate(l.received || l.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pageSize={PAGE_SIZE} total={filteredLeads.length} onPage={setPage} />
            </div>
          )}

          {/* =========================================================================
              VIEW: SCHEDULE
             ========================================================================= */}
          {currentView === "schedule" && (
            <ScheduleView onOpenLead={(id: string) => {
              const lead = leads.find((l) => l.id === id);
              if (lead) {
                setEditingLead(lead);
                setLeadModalOpen(true);
              }
            }} />
          )}

          {/* =========================================================================
              VIEW: TEAM
             ========================================================================= */}
          {currentView === "team" && (
            <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-slate-900">Groutix Operations Team</h2>
                {isManager && (
                  <Link
                    href={`${basePath}/users`}
                    className="text-xs font-semibold text-[#001f97] hover:underline"
                  >
                    Manage staff accounts →
                  </Link>
                )}
              </div>
              {staff.length === 0 ? (
                <div className="text-sm text-slate-400 py-8 text-center">
                  No staff accounts yet. Add them under Staff Accounts.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {staff.map((s) => {
                    const activeLeads = leads.filter(
                      (l) => l.assigned === s.name
                    ).length;
                    const isSelf =
                      s.username.toLowerCase() === (username || "").toLowerCase();
                    const unreadCount = unread[s.username.toLowerCase()] || 0;
                    return (
                      <div
                        key={s.id}
                        className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2 flex flex-col"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-black text-slate-900 text-base">
                            {s.name}
                            {isSelf && (
                              <span className="ml-2 text-[10px] font-bold text-slate-400">(you)</span>
                            )}
                          </div>
                          {!s.active && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
                              disabled
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-[#001f97]">
                          {s.role}
                        </div>
                        <div className="text-xs text-slate-600 pt-2">
                          Assigned leads: <b>{activeLeads}</b>
                        </div>

                        {/* Team actions */}
                        <div className="flex flex-wrap gap-2 pt-3 mt-auto">
                          {isManager && (
                            <button
                              onClick={() => openAsRole(s)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#001f97] text-white text-xs font-bold hover:bg-[#001777] transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Open Dashboard
                            </button>
                          )}
                          <button
                            onClick={() => openChat(s)}
                            disabled={isSelf}
                            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title={isSelf ? "This is you" : `Message ${s.name}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Contact
                            {unreadCount > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                                {unreadCount}
                              </span>
                            )}
                          </button>
                          {isManager && (
                            <button
                              onClick={() => handleDeleteStaff(s)}
                              disabled={isSelf || deletingStaffId === s.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-white text-rose-600 text-xs font-bold hover:bg-rose-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              title={isSelf ? "You can't delete your own account here" : `Delete ${s.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {deletingStaffId === s.id ? "…" : "Delete"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              VIEW: TECHNICIANS (Field roster — add + dispatch)
             ========================================================================= */}
          {currentView === "technicians" && (
            <div className="space-y-5">
              {/* Add technician */}
              <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <HardHat className="w-4 h-4 text-[#001f97]" />
                  <h2 className="text-base font-black text-slate-900">Add a Field Technician</h2>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Technicians are dispatched to jobs. To allow a technician to log into the portal, create their account in Staff Accounts with the <b>Technician</b> role.
                </p>
                <form onSubmit={handleAddTechnician} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={techName}
                    onChange={(e) => setTechName(e.target.value)}
                    placeholder="Technician name"
                    className="flex-1 p-2.5 border border-slate-200 rounded-xl text-sm"
                  />
                  <input
                    type="email"
                    value={techEmail}
                    onChange={(e) => setTechEmail(e.target.value)}
                    placeholder="Email address"
                    className="flex-1 p-2.5 border border-slate-200 rounded-xl text-sm"
                  />
                  <button
                    type="submit"
                    disabled={techBusy}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#001f97] text-white text-sm font-bold hover:bg-[#001777] transition-colors disabled:opacity-50"
                  >
                    {techBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add
                  </button>
                </form>
                {techError && <p className="text-xs text-rose-600 font-semibold mt-2">{techError}</p>}
              </div>

              {/* Roster */}
              <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs">
                <h2 className="text-base font-black text-slate-900 mb-4">
                  Technician Roster
                  <span className="ml-2 text-xs font-semibold text-slate-400">
                    {assignableTechnicians.length} total
                  </span>
                </h2>
                {assignableTechnicians.length === 0 ? (
                  <div className="text-sm text-slate-400 py-8 text-center">
                    No technicians yet. Add your first one above or in Staff Accounts.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {assignableTechnicians.map((t) => {
                      const activeJobs = leads.filter(
                        (l) => l.technicianId === t.id || (l.technician && l.technician.toLowerCase() === t.name.toLowerCase())
                      ).length;
                      return (
                        <div
                          key={t.id}
                          className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2 flex flex-col"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-black text-slate-900 text-base">{t.name}</div>
                            <div className="flex items-center gap-1.5">
                              {t.hasLogin ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800" title={`Username: ${t.username}`}>
                                  Portal Login
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                                  Dispatch Roster
                                </span>
                              )}
                              {!t.active && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                                  inactive
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-slate-600 break-all">
                            {t.email ? t.email : t.username ? `Username: ${t.username}` : "No email specified"}
                          </div>
                          <div className="text-xs text-slate-600 pt-2">
                            Active jobs: <b>{activeJobs}</b>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-3 mt-auto">
                            {t.hasLogin ? (
                              <Link
                                href={`${basePath}/users`}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-blue-600 text-xs font-bold hover:bg-blue-50 transition-colors"
                              >
                                Edit in Staff Accounts
                              </Link>
                            ) : (
                              <button
                                onClick={() => handleDeleteTechnician(t)}
                                disabled={deletingTechId === t.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-white text-rose-600 text-xs font-bold hover:bg-rose-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {deletingTechId === t.id ? "…" : "Remove"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* =========================================================================
          MODAL: ADD / EDIT LEAD
         ========================================================================= */}
      {leadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center p-4 sm:pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">
                {editingLead?.id ? "Edit Customer Lead" : "Add New Customer Lead"}
              </h2>
              <button
                onClick={() => setLeadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={editingLead?.name || ""}
                    onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editingLead?.phone || ""}
                    onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editingLead?.email || ""}
                    onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Property Address</label>
                  <input
                    type="text"
                    value={editingLead?.address || ""}
                    onChange={(e) => setEditingLead({ ...editingLead, address: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Service / Task Required</label>
                  <input
                    type="text"
                    value={editingLead?.service || ""}
                    onChange={(e) => setEditingLead({ ...editingLead, service: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    placeholder="e.g. Shower Regrouting, Epoxy, Balcony"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lead Status</label>
                  <select
                    value={editingLead?.status || "New"}
                    onChange={(e) => setEditingLead({ ...editingLead, status: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  >
                    {getRoleStatusOptions(role, editingLead?.status).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned To</label>
                  <select
                    value={
                      editingLead?.assigned && !isTechnicianName(editingLead.assigned)
                        ? editingLead.assigned
                        : assigneeOptions[0] || "Unassigned"
                    }
                    onChange={(e) => setEditingLead({ ...editingLead, assigned: e.target.value === "Unassigned" ? "" : e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  >
                    {assigneeOptions.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contacted Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editingLead?.contacted ? editingLead.contacted.slice(0, 16) : ""}
                    onChange={(e) => setEditingLead({ ...editingLead, contacted: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Next Follow-Up</label>
                  <input
                    type="datetime-local"
                    value={editingLead?.follow ? editingLead.follow.slice(0, 16) : ""}
                    onChange={(e) => setEditingLead({ ...editingLead, follow: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Inspection Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    value={editingLead?.inspectionAt ? editingLead.inspectionAt.slice(0, 16) : ""}
                    onChange={(e) =>
                      setEditingLead({
                        ...editingLead,
                        inspectionAt: e.target.value,
                        // Any reschedule re-arms the 24h reminder.
                        inspectionReminderSent: false,
                      })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-[10px] text-slate-400">Triggers a 24-hour reminder to the customer.</p>
                    {editingLead?.id && (
                      <button
                        type="button"
                        className="text-[10px] font-semibold text-[#001f97] hover:text-[#001777] whitespace-nowrap"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/admin/booking-link/${editingLead.id}`);
                            const data = await res.json();
                            if (data.inspectionUrl) {
                              await navigator.clipboard.writeText(data.inspectionUrl);
                              const btn = document.activeElement as HTMLButtonElement;
                              const orig = btn.textContent;
                              btn.textContent = "✓ Copied!";
                              setTimeout(() => { btn.textContent = orig; }, 1500);
                            }
                          } catch { /* silently fail */ }
                        }}
                      >
                        📋 Copy Inspection Booking Link
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Job Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    value={editingLead?.jobAt ? editingLead.jobAt.slice(0, 16) : ""}
                    onChange={(e) =>
                      setEditingLead({
                        ...editingLead,
                        jobAt: e.target.value,
                        jobReminderSent: false,
                      })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-[10px] text-slate-400">Triggers a 24-hour reminder to the customer.</p>
                    {editingLead?.id && (
                      <button
                        type="button"
                        className="text-[10px] font-semibold text-[#001f97] hover:text-[#001777] whitespace-nowrap"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/admin/booking-link/${editingLead.id}`);
                            const data = await res.json();
                            if (data.jobUrl) {
                              await navigator.clipboard.writeText(data.jobUrl);
                              const btn = document.activeElement as HTMLButtonElement;
                              const orig = btn.textContent;
                              btn.textContent = "✓ Copied!";
                              setTimeout(() => { btn.textContent = orig; }, 1500);
                            }
                          } catch { /* silently fail */ }
                        }}
                      >
                        📋 Copy Job Booking Link
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lead Notes & Customer Request Details</label>
                <textarea
                  rows={3}
                  value={editingLead?.notes || ""}
                  onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                  placeholder="Enter details, observations or quote instructions..."
                />
              </div>

              {editingLead?.id && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Log a Call</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Call Attempted",
                      "Connected",
                      "No Answer",
                      "Callback Requested",
                      "Customer Interested",
                      "Not Interested",
                    ].map((outcome) => (
                      <button
                        key={outcome}
                        type="button"
                        onClick={() => logCall(editingLead.id!, outcome)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:border-[#001f97]/40 transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        {outcome}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {editingLead?.activity && editingLead.activity.length > 0 && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Activity History</label>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/70 divide-y divide-slate-100">
                    {[...editingLead.activity].reverse().map((a, i) => (
                      <div key={i} className="flex items-start justify-between gap-3 px-3 py-2 text-[11px]">
                        <div>
                          <span className="font-semibold text-slate-800">{a.action}</span>
                          {a.detail ? <span className="text-slate-500"> — {a.detail}</span> : null}
                          <div className="text-slate-400">by {a.actor}</div>
                        </div>
                        <div className="shrink-0 text-slate-400">{fmtDate(a.time)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLeadModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#001f97] text-white rounded-xl font-bold hover:bg-[#001777]"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: QUOTE BUILDER & DOCUMENT PREVIEW
         ========================================================================= */}
      {quoteModalOpen && activeQuoteLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 sm:pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full p-6 space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Create & Send Groutix Quotation</h2>
                <div className="text-xs text-slate-500">Customer: {activeQuoteLead.name}</div>
              </div>
              <button
                onClick={() => setQuoteModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 text-xs max-h-[72vh] overflow-y-auto p-1">
              {/* Left Column: Quote Form Controls */}
              <div className="space-y-4">
                {/* Customer Request & Selected Services Details Card */}
                <div className="p-3.5 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/90 via-slate-50 to-indigo-50/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-[#001f97]" />
                      <span>Customer Request & Selected Services</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const matched = getMatchedQuoteItemsForLead(activeQuoteLead);
                        setQuoteItems(matched);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#001f97] text-white font-bold text-[11px] hover:bg-[#001777] transition-colors shadow-2xs"
                      title="Re-populate quote items using the best matching standard templates"
                    >
                      Auto-Match All Items
                    </button>
                  </div>

                  {/* Selected Services Badges */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Selected Service(s):
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {parseCustomerServices(activeQuoteLead.service || activeQuoteLead.enquiry).map((svc, sIdx) => {
                        const matchedTemplate = findBestTemplateForService(svc, activeQuoteLead.areas);
                        return (
                          <div
                            key={sIdx}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-blue-200 rounded-lg shadow-2xs text-xs font-semibold text-slate-800"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#001f97]"></span>
                            <span>{svc}</span>
                            {matchedTemplate && (
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                                {matchedTemplate.code}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Field Inspection Report Summary */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-teal-200 text-xs">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-teal-700 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900">Field Inspection Report: </span>
                        <span className={activeQuoteLead.inspectionReport ? "text-emerald-700 font-semibold" : "text-slate-500"}>
                          {activeQuoteLead.inspectionReport
                            ? `${activeQuoteLead.inspectionReport.status === "completed" ? "Completed" : "Draft saved"} by ${activeQuoteLead.inspectionReport.inspectorName || "Inspector"}`
                            : "Not filled yet"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openInspectionModal(activeQuoteLead)}
                      className="px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 text-[11px] font-bold cursor-pointer shrink-0"
                    >
                      {activeQuoteLead.inspectionReport ? "View Findings" : "Open Form"}
                    </button>
                  </div>

                  {/* Additional Property & Condition Details */}
                  {(activeQuoteLead.areas || activeQuoteLead.leaking || activeQuoteLead.damagedTiles) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-200/70 text-[11px]">
                      {activeQuoteLead.areas && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-slate-700">
                          <span className="text-slate-400 font-medium">Areas:</span>
                          <b>{activeQuoteLead.areas}</b>
                        </div>
                      )}
                      {activeQuoteLead.leaking && (
                        <div
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${activeQuoteLead.leaking.toLowerCase() === "yes"
                              ? "bg-rose-50 border-rose-200 text-rose-800 font-bold"
                              : "bg-slate-100 border-slate-200 text-slate-700 font-medium"
                            }`}
                        >
                          <span>Leaking:</span>
                          <b>{activeQuoteLead.leaking}</b>
                        </div>
                      )}
                      {activeQuoteLead.damagedTiles && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-md text-amber-900">
                          <span className="text-amber-600 font-medium">Tiles:</span>
                          <b>{activeQuoteLead.damagedTiles}</b>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Customer Enquiry / Message */}
                  {(activeQuoteLead.message || activeQuoteLead.notes) && (
                    <div className="p-2 rounded-lg bg-white/90 border border-slate-200/80 text-[11px] text-slate-700 space-y-0.5">
                      <div className="text-[10px] font-bold text-slate-400">Customer Note / Message:</div>
                      <div className="italic leading-relaxed whitespace-pre-wrap">
                        &ldquo;{activeQuoteLead.message || activeQuoteLead.notes}&rdquo;
                      </div>
                    </div>
                  )}

                  {/* Quick Click-to-Add Individual Services */}
                  <div className="space-y-1 pt-1.5 border-t border-slate-200/60">
                    <div className="text-[10px] font-bold text-slate-400">
                      Click to append matching item to quote:
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {parseCustomerServices(activeQuoteLead.service || activeQuoteLead.enquiry).map((svc, sIdx) => {
                        const matchedTemplate = findBestTemplateForService(svc, activeQuoteLead.areas);
                        return (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => {
                              if (matchedTemplate) {
                                setQuoteItems([
                                  ...quoteItems,
                                  {
                                    templateNo: matchedTemplate.no,
                                    code: matchedTemplate.code,
                                    service: matchedTemplate.service,
                                    scope: matchedTemplate.scope,
                                    price: Number(matchedTemplate.price) || 0,
                                    qty: 1
                                  }
                                ]);
                              } else {
                                setQuoteItems([
                                  ...quoteItems,
                                  {
                                    templateNo: "",
                                    code: "",
                                    service: svc,
                                    scope: activeQuoteLead.message || activeQuoteLead.notes || "",
                                    price: 0,
                                    qty: 1
                                  }
                                ]);
                              }
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-blue-200 text-[#001f97] text-[11px] font-semibold hover:bg-blue-50 shadow-2xs transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add &ldquo;{svc}&rdquo;</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Customer Details Form */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-800 text-sm">Customer Details</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={activeQuoteLead.name || ""}
                      onChange={(e) => setActiveQuoteLead({ ...activeQuoteLead, name: e.target.value })}
                      className="p-2 border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Phone"
                      value={activeQuoteLead.phone || ""}
                      onChange={(e) => setActiveQuoteLead({ ...activeQuoteLead, phone: e.target.value })}
                      className="p-2 border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={activeQuoteLead.email || ""}
                      onChange={(e) => setActiveQuoteLead({ ...activeQuoteLead, email: e.target.value })}
                      className="p-2 border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Property Address"
                      value={activeQuoteLead.address || ""}
                      onChange={(e) => setActiveQuoteLead({ ...activeQuoteLead, address: e.target.value })}
                      className="p-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-800 text-sm">Quote Items ({quoteItems.length})</div>
                    <div className="flex items-center gap-1.5">
                      <TemplatePicker
                        onSelectTemplate={(t) => {
                          if (t) {
                            setQuoteItems([
                              ...quoteItems,
                              {
                                templateNo: t.no,
                                code: t.code,
                                service: t.service,
                                scope: t.scope,
                                price: Number(t.price) || 0,
                                qty: 1
                              }
                            ]);
                          } else {
                            setQuoteItems([
                              ...quoteItems,
                              {
                                templateNo: "",
                                code: "",
                                service: "Custom Service Item",
                                scope: "",
                                price: 0,
                                qty: 1
                              }
                            ]);
                          }
                        }}
                        buttonLabel="Search Library"
                        triggerClassName="flex items-center gap-1 px-2.5 py-1 bg-[#001f97] text-white font-bold text-xs rounded-lg hover:bg-[#001777] shadow-2xs transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setQuoteItems([
                            ...quoteItems,
                            { templateNo: "", code: "", service: "Additional Regrouting Work", scope: "", price: 0, qty: 1 }
                          ])
                        }
                        className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 text-xs transition-colors"
                      >
                        + Add Custom
                      </button>
                    </div>
                  </div>

                  {/* Spreadsheet-style items table (Item Code | Item Name | Qty | Price | Total) */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full table-fixed border-collapse text-xs" style={{ minWidth: 900 }}>
                      <colgroup>
                        <col style={{ width: 36 }} />
                        <col style={{ width: 260 }} />
                        <col />
                        <col style={{ width: 60 }} />
                        <col style={{ width: 100 }} />
                        <col style={{ width: 100 }} />
                        <col style={{ width: 40 }} />
                      </colgroup>
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 text-left">
                          <th className="py-2 px-2 font-bold text-center">#</th>
                          <th className="py-2 px-2 font-bold">Item Code</th>
                          <th className="py-2 px-2 font-bold">Item Name</th>
                          <th className="py-2 px-2 font-bold text-center">Qty</th>
                          <th className="py-2 px-2 font-bold text-right">Price ex GST</th>
                          <th className="py-2 px-2 font-bold text-right">Total ex GST</th>
                          <th className="py-2 px-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {quoteItems.map((item, idx) => (
                          <tr key={idx} className="bg-white hover:bg-slate-50/70 align-top">
                            <td className="py-2 px-2 text-center font-black text-slate-400">{idx + 1}</td>

                            {/* Item Code — template picker */}
                            <td className="py-2 px-2">
                              <TemplatePicker
                                selectedTemplateNo={item.templateNo}
                                onSelectTemplate={(t) => {
                                  const updated = [...quoteItems];
                                  if (t) {
                                    updated[idx] = {
                                      ...updated[idx],
                                      templateNo: t.no,
                                      code: t.code,
                                      service: t.service,
                                      scope: t.scope,
                                      price: Number(t.price) || updated[idx].price || 0
                                    };
                                  } else {
                                    updated[idx] = {
                                      ...updated[idx],
                                      templateNo: "",
                                      code: ""
                                    };
                                  }
                                  setQuoteItems(updated);
                                }}
                              />
                            </td>

                            {/* Item Name — editable title + scope */}
                            <td className="py-2 px-2 space-y-1.5">
                              <input
                                type="text"
                                value={item.service || ""}
                                onChange={(e) => {
                                  const updated = [...quoteItems];
                                  updated[idx].service = e.target.value;
                                  setQuoteItems(updated);
                                }}
                                className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                                placeholder="Service title..."
                              />
                              <textarea
                                rows={3}
                                value={item.scope || ""}
                                onChange={(e) => {
                                  const updated = [...quoteItems];
                                  updated[idx].scope = e.target.value;
                                  setQuoteItems(updated);
                                }}
                                className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-[11px] leading-relaxed text-slate-600"
                                placeholder="Detailed scope of works..."
                              />
                            </td>

                            {/* Qty */}
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                min="1"
                                value={item.qty || 1}
                                onChange={(e) => {
                                  const updated = [...quoteItems];
                                  updated[idx].qty = parseInt(e.target.value, 10) || 1;
                                  setQuoteItems(updated);
                                }}
                                className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold text-xs text-center"
                              />
                            </td>

                            {/* Price ex GST */}
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.price ?? ""}
                                onChange={(e) => {
                                  const updated = [...quoteItems];
                                  updated[idx].price = parseFloat(e.target.value) || 0;
                                  setQuoteItems(updated);
                                }}
                                className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold text-xs text-right"
                              />
                            </td>

                            {/* Total ex GST */}
                            <td className="py-2 px-2 text-right font-bold text-slate-900 whitespace-nowrap">
                              ${(Number(item.price || 0) * Number(item.qty || 1)).toFixed(2)}
                            </td>

                            {/* Remove */}
                            <td className="py-2 px-2 text-center">
                              {quoteItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setQuoteItems(quoteItems.filter((_, i) => i !== idx))}
                                  className="text-rose-400 hover:text-rose-600"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tax Settings */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="font-bold text-slate-800 text-xs">Tax Calculation Settings</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Tax Mode</label>
                      <select
                        value={quoteTaxMode}
                        onChange={(e) => setQuoteTaxMode(e.target.value as any)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="inclusive">GST Inclusive (prices include tax)</option>
                        <option value="exclusive">GST Exclusive (tax added on top)</option>
                        <option value="none">No Tax</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">GST Rate</label>
                      <select
                        value={quoteTaxRate}
                        onChange={(e) => setQuoteTaxRate(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="10">10%</option>
                        <option value="0">0%</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quote Conditions / Special Notes</label>
                  <textarea
                    rows={3}
                    value={quoteTerms}
                    onChange={(e) => setQuoteTerms(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Right Column: Branded Quotation Document Preview (Matches official 10-page layout) */}
              <div className="border border-slate-300 rounded-xl p-6 bg-white shadow-sm font-sans space-y-4 max-h-[70vh] overflow-y-auto">
                {/* 1. Header: Logo (left) & Right-Aligned Address + Gold Quote + ACN + Quote # + Date */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <img
                      src="/logo.png"
                      alt="Groutix"
                      className="h-11 w-auto object-contain"
                    />
                  </div>
                  <div className="text-right text-[10.5px] leading-tight text-slate-700 space-y-0.5">
                    <div>1/14 St Andrews St</div>
                    <div>Brighton VIC 3186</div>
                    <div>1300 476 884</div>
                    <div>info@groutix.com.au</div>
                    <div className="pt-2 font-bold text-base text-[#d4af37]">Quote</div>
                    <div className="font-bold text-slate-900">ACN: 687 415 005</div>
                    <div className="pt-1.5 text-slate-900">Quote # {activeQuoteLead.jobNo || `JOBNO-${activeQuoteLead.id.slice(-6).toUpperCase()}`}</div>
                    <div className="text-slate-600">{new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })}</div>
                  </div>
                </div>

                {/* 2. Customer Details / Billing Address («job.instantpost_billing_address») */}
                <div className="text-[11px] leading-relaxed text-slate-800 pt-3">
                  <div className="font-bold text-slate-900">{activeQuoteLead.name || "Customer Name"}</div>
                  {activeQuoteLead.address && <div>{activeQuoteLead.address}</div>}
                  {(activeQuoteLead.phone || activeQuoteLead.email) && (
                    <div className="text-slate-500 text-[10.5px]">
                      {[activeQuoteLead.phone, activeQuoteLead.email].filter(Boolean).join(" • ")}
                    </div>
                  )}
                </div>

                {/* 3. JOB DESCRIPTION («job.work_done_description») */}
                <div className="pt-2 space-y-1">
                  <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wide">JOB DESCRIPTION:</div>
                  <div className="text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {activeQuoteLead.quoteScope || activeQuoteLead.message || activeQuoteLead.enquiry || "Tile regrouting and waterproof resealing works as specified."}
                  </div>
                </div>

                {/* 4. Table: DESCRIPTION | QTY | UNIT PRICE | TOTAL PRICE with light-gray bar */}
                <table className="w-full text-left text-[11px] border-collapse mt-2">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-[9.5px]">
                      <th className="py-2 px-2.5">DESCRIPTION</th>
                      <th className="py-2 px-2.5 text-right">QTY</th>
                      <th className="py-2 px-2.5 text-right">UNIT PRICE</th>
                      <th className="py-2 px-2.5 text-right">TOTAL PRICE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {quoteItems.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-2.5">
                          {item.code && <div className="text-[9px] font-bold text-blue-700">{item.code}</div>}
                          <div className="font-bold text-slate-900 text-xs">{item.service}</div>
                          {item.scope && !isRedundantScope(item.service, item.scope) && (
                            <div className="text-[10px] text-slate-600 whitespace-pre-wrap mt-1 leading-relaxed">
                              {item.scope}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-2.5 text-right">{item.qty || 1}</td>
                        <td className="py-2.5 px-2.5 text-right">${Number(item.price || 0).toFixed(2)}</td>
                        <td className="py-2.5 px-2.5 text-right font-bold">
                          ${(Number(item.price || 0) * Number(item.qty || 1)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 5. Totals */}
                <div className="pt-3 flex flex-col items-end text-xs space-y-1 text-slate-800">
                  <div className="flex justify-end gap-6">
                    <span className="text-slate-600 font-medium">SUBTOTAL:</span>
                    <span className="w-24 text-right font-semibold">${quoteTotals().subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end gap-6">
                    <span className="text-slate-600 font-medium">GST ({quoteTaxRate}%):</span>
                    <span className="w-24 text-right font-semibold">${quoteTotals().gst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end gap-6 pt-1 text-sm font-black text-slate-900 border-t border-slate-200">
                    <span>TOTAL:</span>
                    <span className="w-24 text-right">${quoteTotals().total.toFixed(2)}</span>
                  </div>
                </div>

                {/* 6. Centered «final_note» */}
                <div className="pt-4 text-center">
                  <div className="text-[10px] text-slate-500 italic">
                    {quoteTerms && quoteTerms.length < 500 && !/^Groutix terms/i.test(quoteTerms)
                      ? quoteTerms
                      : DEFAULT_QUOTE_CONDITIONS}
                  </div>
                </div>

                {/* 7. Full Text of All 20 Terms & Conditions Clauses Preview */}
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 text-[10.5px] text-amber-950 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#b8860b]">✓ 10-Page Quotation Template Active</span>
                      <span className="text-[10px] text-slate-600">All 20 Clauses &amp; Signature block printed in PDF (No external terms links)</span>
                    </div>
                  </div>

                  <details className="text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <summary className="font-bold text-slate-800 cursor-pointer hover:text-[#001f97] select-none">
                      Preview All 20 Terms &amp; Conditions Clauses (Pages 2–10)
                    </summary>
                    <div className="mt-3 text-[10px] text-slate-700 space-y-2 whitespace-pre-wrap max-h-60 overflow-y-auto font-mono bg-white p-2.5 rounded border border-slate-200">
                      {GROUTIX_QUOTE_TERMS}
                    </div>
                  </details>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrintQuote}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
              >
                <Printer className="w-3.5 h-3.5" />
                Preview / Save PDF
              </button>
              <button
                type="button"
                onClick={handleWhatsappQuote}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
              >
                WhatsApp Quote
              </button>
              <button
                type="button"
                onClick={handleEmailQuote}
                className="flex items-center gap-1.5 px-3 py-2 border border-blue-600 text-blue-600 rounded-xl font-bold hover:bg-blue-50"
                title="Open your mail app with a draft"
              >
                <Mail className="w-3.5 h-3.5" />
                Email (draft)
              </button>
              <button
                type="button"
                onClick={handleSendQuoteEmail}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                title="Send the quote to the customer automatically"
              >
                <Send className="w-3.5 h-3.5" />
                Send Quote
              </button>
              <button
                type="button"
                onClick={handleSaveQuote}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900"
              >
                Save Quote
              </button>
              <button
                type="button"
                onClick={handleMarkQuoteSent}
                className="px-4 py-2 bg-[#001f97] text-white rounded-xl font-bold hover:bg-[#001777]"
              >
                Mark Quote Sent
              </button>
              <button
                type="button"
                onClick={handleMarkNegotiation}
                className="px-4 py-2 border-2 border-purple-600 text-purple-700 bg-purple-50 rounded-xl font-bold hover:bg-purple-100"
              >
                Mark Negotiation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CUSTOMER PHOTOS
         ========================================================================= */}
      {photosModalOpen && activePhotoLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center p-4 sm:pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Customer Job Photos</h2>
                <div className="text-xs text-slate-500">Customer: {activePhotoLead.name}</div>
              </div>
              <button
                onClick={() => setPhotosModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Upload New Photo(s)</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={uploadingPhotos}
                    className="flex items-center gap-2 px-3 py-2 bg-[#001f97] text-white rounded-xl text-xs font-bold hover:bg-blue-800 disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" /> Take Photo
                  </button>
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhotos}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-[#001f97] rounded-xl text-xs font-bold hover:bg-blue-100 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" /> Browse Gallery
                  </button>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleAddPhotos(e.target.files)}
                  />
                  <input
                    ref={photoInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleAddPhotos(e.target.files)}
                  />
                </div>
                {uploadingPhotos && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#001f97] animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading to Cloudinary...</span>
                  </div>
                )}
              </div>
            </div>

            {loadingPhotos ? (
              <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#001f97]" />
                <span>Loading customer photos...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[55vh] overflow-y-auto p-1">
                {(activePhotoLead.photos || []).map((photo, i) => {
                  const imgSrc = photo.secureUrl || photo.url || photo.dataUrl || "";
                  const isDeleting = deletingPhotoIndex === i;
                  return (
                    <div
                      key={i}
                      className="group relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 space-y-1.5 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div
                        className="relative w-full h-36 bg-slate-200 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => imgSrc && setPreviewPhoto({ url: imgSrc, name: photo.name })}
                      >
                        {imgSrc ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={imgSrc}
                            alt={photo.name}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-400 p-2 text-center">
                            <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                            {photo.name}
                          </div>
                        )}

                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <span className="p-1.5 bg-white/90 rounded-lg text-slate-700 shadow-xs hover:bg-white">
                            <ZoomIn className="w-4 h-4" />
                          </span>
                        </div>

                        {photo.publicId && (
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-emerald-600/90 backdrop-blur-xs text-[10px] font-bold text-white rounded-md shadow-xs">
                            Cloud
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                        <span className="truncate max-w-[130px] font-medium" title={photo.name}>
                          {photo.name}
                        </span>
                        <div className="flex items-center gap-1">
                          {imgSrc && (
                            <a
                              href={imgSrc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-slate-700 p-1"
                              title="Open original in new tab"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDeletePhoto(i)}
                            className="text-rose-500 hover:text-rose-700 p-1 disabled:opacity-50"
                            title="Delete photo"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!activePhotoLead.photos || activePhotoLead.photos.length === 0) && (
                  <div className="col-span-full py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                    <span>No photos uploaded for this customer yet.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: FULLSCREEN PHOTO LIGHTBOX PREVIEW
         ========================================================================= */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 text-white">
              <span className="text-xs font-semibold truncate max-w-md">{previewPhoto.name}</span>
              <div className="flex items-center gap-2">
                <a
                  href={previewPhoto.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Original
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-2 flex items-center justify-center bg-black/40 max-h-[80vh] overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPhoto.url}
                alt={previewPhoto.name}
                className="max-h-[75vh] max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CUSTOMER CONVERSATION (MESSAGES)
         ========================================================================= */}
      {messagesModalOpen && activeMessageLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center p-4 sm:pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Customer Conversation</h2>
                <div className="text-xs text-slate-500">
                  {activeMessageLeadLive?.name} • {activeMessageLeadLive?.phone || "No phone"} • {activeMessageLeadLive?.email || "No email"}
                </div>
              </div>
              <button
                onClick={() => setMessagesModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversation Messages Box */}
            <div className="h-72 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              {getConversation(activeMessageLeadLive || activeMessageLead).map((msg) => {
                const isCustomer = msg.from === "customer";
                return (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-2xl max-w-[85%] text-xs shadow-xs space-y-1 ${isCustomer
                        ? "mr-auto bg-white border border-slate-200 text-slate-800"
                        : "ml-auto bg-[#001f97] text-white"
                      }`}
                  >
                    <div
                      className={`flex items-center justify-between gap-4 text-[10px] font-bold ${isCustomer ? "text-slate-400" : "text-blue-200"
                        }`}
                    >
                      <span>{isCustomer ? "Customer" : "Groutix Team"} ({msg.channel || "note"})</span>
                      <span>{fmtDate(msg.time)}</span>
                    </div>
                    {msg.subject && <div className="font-bold">{msg.subject}</div>}
                    {(() => {
                      const isCustomerEmail = isCustomer && !msg.initial;
                      const cleanText = isCustomerEmail ? stripQuotedReply(msg.text) : msg.text;
                      const hasQuoted = isCustomerEmail && cleanText !== msg.text;
                      return (
                        <div className="space-y-1">
                          <div className="whitespace-pre-wrap leading-relaxed">{cleanText}</div>
                          {hasQuoted && (
                            <details className="mt-1 text-[10px] text-slate-400">
                              <summary className="cursor-pointer hover:text-slate-600 select-none font-medium">
                                ••• Show quoted email history
                              </summary>
                              <div className="mt-1 p-2 bg-slate-100 rounded-lg text-slate-600 whitespace-pre-wrap border border-slate-200 text-[10px] max-h-40 overflow-y-auto">
                                {msg.text}
                              </div>
                            </details>
                          )}
                        </div>
                      );
                    })()}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.attachments.map((att, i) => {
                          const href = att.secureUrl || att.url;
                          const chipClass = `inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${isCustomer ? "bg-slate-100 text-slate-600" : "bg-white/15 text-white"
                            }`;
                          return href ? (
                            <a
                              key={i}
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${chipClass} underline hover:opacity-80`}
                              title={`Open ${att.name}`}
                            >
                              <Paperclip className="w-2.5 h-2.5" />
                              {att.name}
                            </a>
                          ) : (
                            <span key={i} className={chipClass}>
                              <Paperclip className="w-2.5 h-2.5" />
                              {att.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Reply Composer */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 p-0.5 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setMessageChannel("email")}
                    className={`flex items-center gap-1.5 py-1 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      messageChannel === "email"
                        ? "bg-white text-[#001f97] shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageChannel("sms")}
                    className={`flex items-center gap-1.5 py-1 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      messageChannel === "sms"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>SMS (Texto)</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomerDemoReply}
                  className="text-[11px] text-[#001f97] font-semibold hover:underline"
                >
                  + Add Customer Message Note
                </button>
              </div>

              {messageChannel === "sms" ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-emerald-600" />
                        <span>Send SMS to:</span>
                        <span className="font-black text-slate-900">
                          {activeMessageLeadLive?.phone || activeMessageLead?.phone || "No phone number available"}
                        </span>
                      </span>
                      {(() => {
                        const preview = smsText.toLowerCase().includes("groutix") ? smsText.trim() : `Groutix: ${smsText.trim()}`;
                        const charCount = preview.length;
                        const isUnder160 = charCount <= 160;
                        return (
                          <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${isUnder160 ? "text-emerald-700" : "text-amber-700"}`}>
                            <span>{charCount}/160 chars</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isUnder160 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                              {isUnder160 ? "1 Credit" : "Trimmed to 1 Credit"}
                            </span>
                          </span>
                        );
                      })()}
                    </div>

                    {!Boolean(activeMessageLeadLive?.phone || activeMessageLead?.phone) && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                        ⚠️ This customer does not have a phone number recorded. Please add a phone number before sending an SMS.
                      </div>
                    )}
                  </div>

                  {/* SMS Quick Variables */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-500 mr-1">Insert:</span>
                    <button
                      type="button"
                      onClick={() => setSmsText(prev => prev + (activeMessageLeadLive?.name ? activeMessageLeadLive.name.split(" ")[0] : "there"))}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-600 rounded-md text-[10px] font-semibold transition cursor-pointer"
                    >
                      + Name
                    </button>
                    <button
                      type="button"
                      onClick={() => setSmsText(prev => prev + (activeMessageLeadLive?.service || "grouting service"))}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-600 rounded-md text-[10px] font-semibold transition cursor-pointer"
                    >
                      + Service
                    </button>
                    <button
                      type="button"
                      onClick={() => setSmsText(prev => prev + (activeMessageLeadLive?.address || "your property"))}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-600 rounded-md text-[10px] font-semibold transition cursor-pointer"
                    >
                      + Address
                    </button>
                    {activeMessageLeadLive?.technician && (
                      <button
                        type="button"
                        onClick={() => setSmsText(prev => prev + activeMessageLeadLive.technician)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-600 rounded-md text-[10px] font-semibold transition cursor-pointer"
                      >
                        + Specialist
                      </button>
                    )}
                  </div>

                  {/* SMS Body */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">SMS Text Message:</label>
                    <textarea
                      rows={5}
                      placeholder="Type your SMS message to send via Texto API..."
                      value={smsText}
                      onChange={(e) => setSmsText(e.target.value)}
                      className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 leading-relaxed font-sans"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="text-[11px] text-slate-400">
                      ⚡ Direct gateway via <b>Texto SMS API</b>
                    </div>
                    <button
                      type="button"
                      onClick={handleSendSmsReply}
                      disabled={sendingSms || !smsText.trim() || !Boolean(activeMessageLeadLive?.phone || activeMessageLead?.phone)}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm cursor-pointer"
                    >
                      {sendingSms ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>{sendingSms ? "Sending SMS…" : "Send SMS"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>

              {/* Template Picker Dropdown */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Choose Predefined Template:</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setManageTemplatesModalOpen(true);
                        handleOpenCreateTemplate();
                      }}
                      className="text-[11px] text-[#001f97] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Template</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setManageTemplatesModalOpen(true)}
                      className="text-[11px] text-slate-600 hover:text-slate-900 underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Manage / Remove</span>
                    </button>
                    {selectedTemplateId && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTemplateId("");
                          setReplyText("");
                          setReplySubject(
                            `Re: Groutix Enquiry - ${activeMessageLeadLive?.name || activeMessageLead?.name || "Customer"}`
                          );
                        }}
                        className="text-[11px] text-slate-400 hover:text-slate-700 underline font-medium ml-1 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleSelectEmailTemplate(e.target.value)}
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#001f97]/20 focus:border-[#001f97] transition shadow-2xs cursor-pointer"
                >
                  <option value="">-- Select an Email Template (or write custom) --</option>
                  {Array.from(new Set(emailTemplates.map((t) => t.category))).map((cat) => (
                    <optgroup key={cat} label={cat}>
                      {emailTemplates.filter((t) => t.category === cat).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                {selectedTemplateId && (
                  <p className="text-[11px] text-slate-500 italic">
                    {emailTemplates.find((t) => t.id === selectedTemplateId)?.description}
                  </p>
                )}
              </div>

              {/* Subject Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Email Subject:</label>
                <input
                  type="text"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  placeholder="Enter email subject line..."
                  className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001f97]/20 focus:border-[#001f97]"
                />
              </div>

              {/* Quick-Insert Variables */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">
                  Insert Tag:
                </span>
                <button
                  type="button"
                  onClick={() => handleInsertVariable("firstName")}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-600 rounded-md text-[10px] font-semibold transition cursor-pointer"
                >
                  + First Name
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertVariable("name")}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-600 rounded-md text-[10px] font-semibold transition cursor-pointer"
                >
                  + Full Name
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertVariable("service")}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-600 rounded-md text-[10px] font-semibold transition cursor-pointer"
                >
                  + Service
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertVariable("address")}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-600 rounded-md text-[10px] font-semibold transition cursor-pointer"
                >
                  + Address
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertVariable("phone")}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-600 rounded-md text-[10px] font-semibold transition cursor-pointer"
                >
                  + Phone
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertVariable("technician")}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-600 rounded-md text-[10px] font-semibold transition cursor-pointer"
                >
                  + Specialist
                </button>
                {Boolean(activeMessageLeadLive?.quoteAmount || activeMessageLead?.quoteAmount) && (
                  <button
                    type="button"
                    onClick={() => handleInsertVariable("quoteAmount")}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-600 rounded-md text-[10px] font-semibold transition cursor-pointer"
                  >
                    + Quote Total
                  </button>
                )}
              </div>

              {/* Email Body */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Email Message:</label>
                <textarea
                  rows={6}
                  placeholder="Type your email message or pick a template from the dropdown above..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001f97]/20 focus:border-[#001f97] leading-relaxed font-sans"
                />
              </div>

              {/* Staged attachments */}
              {replyAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {replyAttachments.map((att, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700"
                    >
                      <Paperclip className="w-3 h-3 text-slate-400" />
                      <span className="max-w-[160px] truncate">{att.name}</span>
                      <button
                        type="button"
                        onClick={() => removeReplyAttachment(i)}
                        className="text-slate-400 hover:text-rose-600"
                        title="Remove attachment"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <input
                ref={replyFileRef}
                type="file"
                multiple
                hidden
                onChange={(e) => handleAttachReplyFiles(e.target.files)}
              />

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => replyFileRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                    title="Attach files to email"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Attach Files</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenMailApp}
                    className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                    title="Open your default desktop email client with this draft"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Mail App</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={sendingReply || (!replyText.trim() && replyAttachments.length === 0)}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-[#001f97] text-white text-xs font-bold rounded-xl hover:bg-[#001777] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm cursor-pointer"
                >
                  {sendingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{sendingReply ? "Sending…" : "Save & Send Email"}</span>
                </button>
              </div>
            </>
          )}
        </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: MANAGE EMAIL TEMPLATES (ADD / EDIT / REMOVE / RESET)
         ========================================================================= */}
      {manageTemplatesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 sm:pt-8 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-5 border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#001f97]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">Email Templates Manager</h2>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#001f97] text-xs font-bold border border-blue-200">
                      {emailTemplates.length} templates
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Add, customize, or remove email templates used across the CRM dashboard.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!templateFormOpen && (
                  <>
                    <button
                      type="button"
                      onClick={handleResetTemplates}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      title="Reset all templates back to standard Groutix defaults"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                      <span>Reset Defaults</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenCreateTemplate}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#001f97] hover:bg-[#001777] rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Template</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setManageTemplatesModalOpen(false);
                    setTemplateFormOpen(false);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Add / Edit Form */}
            {templateFormOpen ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-blue-600" />
                    <span>{editingTemplate ? "Edit Template" : "Create New Email Template"}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setTemplateFormOpen(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Template Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Booking Deposit Request"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#001f97]/20 focus:border-[#001f97]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Category *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#001f97]/20 focus:border-[#001f97]"
                    >
                      <option value="Enquiries & Leads">Enquiries & Leads</option>
                      <option value="Inspections">Inspections</option>
                      <option value="Quotations">Quotations</option>
                      <option value="Bookings">Bookings</option>
                      <option value="Job Completion & Care">Job Completion & Care</option>
                      <option value="Billing">Billing</option>
                      <option value="General">General</option>
                      <option value="Promotions">Promotions</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Short Description</label>
                  <input
                    type="text"
                    placeholder="Brief note on when staff should use this template"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#001f97]/20 focus:border-[#001f97]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Email Subject Line *</label>
                  <input
                    type="text"
                    placeholder="e.g. Your Groutix Booking Confirmation - {first_name}"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#001f97]/20 focus:border-[#001f97]"
                  />
                </div>

                {/* Variable helper chips */}
                <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-xl text-[11px]">
                  <span className="font-bold text-[#001f97] mr-1">Insert Dynamic Tag:</span>
                  {[
                    { label: "+ First Name", val: "{first_name}" },
                    { label: "+ Full Name", val: "{customer_name}" },
                    { label: "+ Service", val: "{service}" },
                    { label: "+ Address", val: "{address}" },
                    { label: "+ Phone", val: "{phone}" },
                    { label: "+ Specialist", val: "{technician_name}" },
                    { label: "+ Inspection Date", val: "{inspection_date}" },
                    { label: "+ Booking Date", val: "{booking_date}" },
                    { label: "+ Quote #", val: "{quote_number}" },
                    { label: "+ Invoice #", val: "{invoice_number}" },
                    { label: "+ Total Due", val: "{invoice_total}" },
                  ].map((chip) => (
                    <button
                      key={chip.val}
                      type="button"
                      onClick={() => setFormBody((prev) => `${prev} ${chip.val}`)}
                      className="px-2 py-0.5 bg-white border border-blue-200 rounded-md text-slate-700 hover:bg-blue-100 hover:text-blue-900 font-medium transition cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Message Body *</label>
                  <textarea
                    rows={8}
                    placeholder="Write your email body here... You can use variables like {first_name}, {service}, etc."
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    className="w-full p-3 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#001f97]/20 focus:border-[#001f97] leading-relaxed font-sans"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setTemplateFormOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    disabled={savingTemplate || !formName.trim() || !formBody.trim()}
                    className="px-5 py-2 bg-[#001f97] text-white text-xs font-bold rounded-xl hover:bg-[#001777] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {savingTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{savingTemplate ? "Saving..." : editingTemplate ? "Update Template" : "Create Template"}</span>
                  </button>
                </div>
              </div>
            ) : null}

            {/* Template List Cards */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {Array.from(new Set(emailTemplates.map((t) => t.category))).map((cat) => {
                const group = emailTemplates.filter((t) => t.category === cat);
                return (
                  <div key={cat} className="space-y-2">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-500">{cat}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                        {group.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.map((t) => (
                        <div
                          key={t.id}
                          className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-3.5 space-y-2.5 transition shadow-2xs flex flex-col justify-between"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-black text-slate-800 line-clamp-1">{t.name}</h4>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditTemplate(t)}
                                  className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                                  title="Edit this template"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTemplate(t.id)}
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                  title="Delete this template"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {t.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-1">{t.description}</p>
                            )}

                            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-600 space-y-1">
                              <div className="font-semibold text-slate-700 truncate">
                                Subject: <span className="font-normal text-slate-600">{t.subject}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                                {t.body}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectEmailTemplate(t.id);
                                setManageTemplatesModalOpen(false);
                              }}
                              className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-[#001f97] font-bold rounded-lg text-center transition cursor-pointer"
                            >
                              Use in Composer →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {emailTemplates.length === 0 && (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold">No templates found.</p>
                  <button
                    type="button"
                    onClick={handleResetTemplates}
                    className="text-xs text-[#001f97] underline font-bold cursor-pointer"
                  >
                    Click here to load standard default templates
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* =========================================================================
          MODAL: INSPECTION GPS
         ========================================================================= */}
      {gpsModalOpen && activeGpsLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">Inspection GPS Check-in</h2>
              <button
                onClick={() => setGpsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="font-bold text-slate-800">{activeGpsLead.name}</div>
                <div>{activeGpsLead.address || "No address saved"}</div>
              </div>

              {activeGpsLead.gps ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl space-y-1">
                  <div className="font-black">GPS Check-in Recorded:</div>
                  <div>Latitude: {activeGpsLead.gps.lat.toFixed(6)}</div>
                  <div>Longitude: {activeGpsLead.gps.lng.toFixed(6)}</div>
                  <div>Accuracy: ±{Math.round(activeGpsLead.gps.accuracy || 0)}m</div>
                  <div>Time: {fmtDate(activeGpsLead.gps.time)}</div>
                  <a
                    href={`https://www.google.com/maps?q=${activeGpsLead.gps.lat},${activeGpsLead.gps.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 underline mt-1"
                  >
                    Open Location in Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400">
                  {gpsStatusMessage || "No GPS check-in recorded yet."}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleCaptureGps}
                className="w-full py-2.5 bg-[#001f97] text-white text-xs font-bold rounded-xl hover:bg-[#001777]"
              >
                Record Current GPS Location
              </button>
              {activeGpsLead.address && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeGpsLead.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 text-center"
                >
                  Navigate to Customer Property
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: 10-YEAR WARRANTY CARD (HTML5 Canvas)
         ========================================================================= */}
      {warrantyModalOpen && activeWarrantyLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 sm:pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">10-Year Waterproof Warranty Certificate</h2>
                <div className="text-xs text-slate-500">Customer: {activeWarrantyLead.name}</div>
              </div>
              <button
                onClick={() => setWarrantyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warranty Form Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Job / Certificate No.</label>
                <input
                  type="text"
                  value={warrantyJobNo}
                  onChange={(e) => setWarrantyJobNo(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Completion Date</label>
                <input
                  type="date"
                  value={warrantyCompletion}
                  onChange={(e) => {
                    setWarrantyCompletion(e.target.value);
                    const d = new Date(e.target.value);
                    if (!isNaN(d.getTime())) {
                      d.setFullYear(d.getFullYear() + 10);
                      setWarrantyExpiry(d.toISOString().slice(0, 10));
                    }
                  }}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Warranty Expiry (10 Yrs)</label>
                <input
                  type="date"
                  value={warrantyExpiry}
                  readOnly
                  className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg font-bold text-emerald-700"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Date Issued</label>
                <input
                  type="date"
                  value={warrantyIssued}
                  onChange={(e) => setWarrantyIssued(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer Name</label>
                <input
                  type="text"
                  value={warrantyCustomer}
                  onChange={(e) => setWarrantyCustomer(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Authorised By</label>
                <input
                  type="text"
                  value={warrantyAuthorised}
                  onChange={(e) => setWarrantyAuthorised(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Property Address</label>
                <input
                  type="text"
                  value={warrantyAddress}
                  onChange={(e) => setWarrantyAddress(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center justify-between border-b border-slate-200 pt-2 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWarrantyTab("page1")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    warrantyTab === "page1"
                      ? "bg-[#071c4d] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Page 1: Warranty Certificate
                </button>
                <button
                  type="button"
                  onClick={() => setWarrantyTab("page2")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    warrantyTab === "page2"
                      ? "bg-[#071c4d] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Page 2: Terms &amp; Conditions
                </button>
              </div>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                Official 2-Page Executive Template
              </span>
            </div>

            {/* Canvas Preview */}
            <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-200 max-h-[60vh] overflow-y-auto flex justify-center p-3">
              <canvas
                ref={canvasRef}
                width={1000}
                height={1414}
                className="w-full max-w-[650px] h-auto shadow-md rounded bg-white block"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 gap-1 px-1">
              <span>Warranty governed by Australian Consumer Law &amp; Groutix 10-Year Shower Warranty Terms</span>
              <a
                href="/terms-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#001f97] underline font-bold inline-flex items-center gap-1 hover:text-blue-900"
              >
                <span>View Full Terms &amp; Conditions</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="text-[11px] text-slate-500">
                <span>Both pages are included in the official PDF &amp; customer email.</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const q = new URLSearchParams({
                      jobNo: warrantyJobNo,
                      completion: warrantyCompletion,
                      expiry: warrantyExpiry,
                      customer: warrantyCustomer,
                      address: warrantyAddress,
                      authorised: warrantyAuthorised,
                      issued: warrantyIssued,
                      t: String(Date.now()),
                    });
                    window.open(`/api/admin/warranty/pdf/${activeWarrantyLead.id}?${q.toString()}`, "_blank");
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
                  title="Print or view official 2-page PDF warranty certificate"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / View PDF
                </button>
                <button
                  type="button"
                  onClick={downloadWarrantyCard}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100"
                >
                  <Download className="w-4 h-4" />
                  Download PNG
                </button>
                <button
                  type="button"
                  onClick={handleSendWarranty}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                  title="Email the official 2-page warranty certificate to the customer and mark it sent"
                >
                  <Send className="w-4 h-4" />
                  Email to Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CLIENT JOB CARD (Manager workflow — full pipeline timeline)
         ========================================================================= */}
      {jobCardLead && (() => {
        const l = leads.find((x) => x.id === jobCardLead.id) || jobCardLead;
        const milestones: { label: string; status: string }[] = [
          { label: "Lead Received", status: "New" },
          { label: "Contacted", status: "Contacted" },
          { label: "Inspection Booked", status: "Inspection Booked" },
          { label: "Inspection Completed", status: "Inspection Completed" },
          { label: "Quote Created", status: "Quote Pending" },
          { label: "Quote Sent", status: "Quote Sent" },
          { label: "Quote Accepted", status: "Won" },
          { label: "Job Booked", status: "Job Booked" },
          { label: "Job Done", status: "Job Done" },
          { label: "Invoice Sent", status: "Invoice Sent" },
          { label: "Payment Pending", status: "Payment Pending" },
          { label: "Payment Received", status: "Payment Received" },
          { label: "Warranty Sent", status: "Warranty Sent" },
          { label: "Completed", status: "Completed" },
        ];
        const currentIdx = STATUS_KEYS.indexOf(l.status);
        const next = milestones.find((m) => {
          const mi = STATUS_KEYS.indexOf(m.status);
          return mi !== -1 && mi > currentIdx;
        });
        const total = getLeadQuoteTotal(l);
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 sm:pt-10 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-6 space-y-5 my-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">{l.name || "Customer"} — Client Job Card</h2>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {[l.email, l.phone, l.address].filter(Boolean).join("  •  ")}
                  </div>
                </div>
                <button
                  onClick={() => setJobCardLead(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Current Stage", value: l.status, strong: true },
                  { label: "Service", value: l.service || "Standard Service" },
                  { label: "Quote / Job Value", value: `AUD $${total.toFixed(2)}`, strong: true },
                ].map((c) => (
                  <div key={c.label} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{c.label}</div>
                    <div className={`text-slate-900 ${c.strong ? "text-base font-black" : "text-xs font-semibold leading-snug"}`}>
                      {c.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pipeline timeline */}
              <div className="flex items-start overflow-x-auto pb-2 no-scrollbar">
                {milestones.map((m, i) => {
                  const mi = STATUS_KEYS.indexOf(m.status);
                  const done = mi !== -1 && mi <= currentIdx;
                  const current = m.status === l.status;
                  return (
                    <div key={m.status} className="flex items-center shrink-0">
                      {i > 0 && <div className={`h-0.5 w-8 ${done ? "bg-emerald-500" : "bg-slate-200"}`} />}
                      <div className="flex flex-col items-center w-24 px-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 border border-slate-200"
                            } ${current ? "ring-2 ring-[#001f97] ring-offset-2" : ""}`}
                        >
                          {done ? <Check className="w-4 h-4 stroke-[3]" /> : <span className="text-[10px] font-black">{i + 1}</span>}
                        </div>
                        <span
                          className={`mt-1.5 text-[10px] font-bold text-center leading-tight ${current ? "text-[#001f97]" : done ? "text-slate-600" : "text-slate-400"
                            }`}
                        >
                          {m.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Workflow action */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div>
                  <div className="text-sm font-black text-slate-900">Workflow Action</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Current: <b className="text-slate-700">{l.status}</b>
                    {next ? (
                      <> → Next: <b className="text-slate-700">{next.label}</b></>
                    ) : (
                      <> → Fully completed 🏆</>
                    )}
                  </div>
                </div>
                {next && (
                  <button
                    type="button"
                    onClick={() => updateLeadField(l.id, { status: next.status })}
                    className="px-5 py-2.5 bg-[#001f97] hover:bg-[#001777] text-white rounded-xl text-sm font-black shadow-xs transition-colors cursor-pointer"
                  >
                    Move to {next.label} →
                  </button>
                )}
              </div>

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Conversation — updates every few seconds
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">🏅 Finance &amp; Automation</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          MODAL: AUTO INVOICE
         ========================================================================= */}
      {invoiceModalOpen && activeInvoiceLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center p-4 sm:pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6 space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Tax Invoice Generator</h2>
                {activeInvoiceLead.invoiceOpenedAt && (
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-0.5">
                    <Eye className="w-3 h-3 text-emerald-600" />
                    Customer opened invoice email
                  </div>
                )}
              </div>
              <button
                onClick={() => setInvoiceModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer</label>
                  <input
                    type="text"
                    readOnly
                    value={activeInvoiceLead.name || ""}
                    className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Service</label>
                  <input
                    type="text"
                    value={invoiceService}
                    onChange={(e) => setInvoiceService(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Description</label>
                  <textarea
                    rows={4}
                    value={invoiceDescription}
                    onChange={(e) => setInvoiceDescription(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Total (incl GST)</label>
                    <input
                      type="number"
                      value={invoicePrice}
                      onChange={(e) => setInvoicePrice(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Payment Status</label>
                    <select
                      value={invoiceStatus}
                      onChange={(e) => setInvoiceStatus(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                </div>

                {/* Editable Payment Information Box */}
                <div className="pt-2.5 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      💳 Payment &amp; Bank Details
                    </label>
                    <span className="text-[10px] text-slate-400">Shown in payment box</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Bank Name</label>
                      <input
                        type="text"
                        value={invoiceBankName}
                        onChange={(e) => {
                          setInvoiceBankName(e.target.value);
                          try { localStorage.setItem("groutix_inv_bank", e.target.value); } catch {}
                        }}
                        placeholder="ANZ"
                        className="w-full p-2 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">BSB</label>
                      <input
                        type="text"
                        value={invoiceBsb}
                        onChange={(e) => {
                          setInvoiceBsb(e.target.value);
                          try { localStorage.setItem("groutix_inv_bsb", e.target.value); } catch {}
                        }}
                        placeholder="013442"
                        className="w-full p-2 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Account Name</label>
                      <input
                        type="text"
                        value={invoiceAccountName}
                        onChange={(e) => {
                          setInvoiceAccountName(e.target.value);
                          try { localStorage.setItem("groutix_inv_acc_name", e.target.value); } catch {}
                        }}
                        placeholder="Groutix Pty Ltd"
                        className="w-full p-2 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Account Number</label>
                      <input
                        type="text"
                        value={invoiceAccountNumber}
                        onChange={(e) => {
                          setInvoiceAccountNumber(e.target.value);
                          try { localStorage.setItem("groutix_inv_acc_num", e.target.value); } catch {}
                        }}
                        placeholder="123456789"
                        className="w-full p-2 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Payment Due Date Note</label>
                    <input
                      type="text"
                      value={invoiceDueDate}
                      onChange={(e) => {
                        setInvoiceDueDate(e.target.value);
                        try { localStorage.setItem("groutix_inv_due_date", e.target.value); } catch {}
                      }}
                      placeholder="Within 7 days of invoice date"
                      className="w-full p-2 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Preview (Matches official Groutix Tax Invoice layout) */}
              <div className="border border-slate-300 rounded-xl p-5 bg-white space-y-3 font-sans shadow-sm text-slate-800 max-h-[70vh] overflow-y-auto">
                {/* 1. Header: Logo & Right Column */}
                <div className="flex items-start justify-between gap-4 pb-1">
                  <div>
                    <img src="/logo.png" alt="Groutix" className="h-10 object-contain" />
                  </div>
                  <div className="text-right text-[10px] leading-tight text-slate-700 space-y-0.5">
                    <div>Melbourne, VIC</div>
                    <div>1300 476 884</div>
                    <div>info@groutix.com.au</div>
                    <div className="pt-1.5 font-black text-xs text-slate-900">TAX INVOICE</div>
                    <div className="font-bold text-slate-900">ACN: 687 415 005</div>
                    <div className="pt-1.5 font-bold text-slate-900">Tax Invoice No: INV-{activeInvoiceLead.id.slice(-6).toUpperCase()}</div>
                    <div className="text-slate-600">{new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })}</div>
                  </div>
                </div>

                {/* 2. Customer / Billing Address */}
                <div className="text-[11px] leading-relaxed text-slate-800">
                  <div className="font-bold text-slate-900">{activeInvoiceLead.name}</div>
                  {activeInvoiceLead.address && <div>{activeInvoiceLead.address}</div>}
                  {(activeInvoiceLead.phone || activeInvoiceLead.email) && (
                    <div className="text-slate-500 text-[10px]">
                      {[activeInvoiceLead.phone, activeInvoiceLead.email].filter(Boolean).join(" • ")}
                    </div>
                  )}
                </div>

                {/* 3. WORK COMPLETED */}
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#e5a910] uppercase tracking-wide">WORK COMPLETED</div>
                  <div className="text-[11px] text-slate-700 whitespace-pre-wrap">
                    {invoiceDescription || invoiceService || "Full shower epoxy regrouting, deep clean, and perimeter silicone reseal."}
                  </div>
                </div>

                {/* 4. Table */}
                <div>
                  <div className="grid grid-cols-12 text-[10px] font-bold text-[#e5a910] uppercase pb-1 border-b border-slate-200">
                    <div className="col-span-6">DESCRIPTION</div>
                    <div className="col-span-2 text-right">QUANTITY</div>
                    <div className="col-span-2 text-right">PRICE</div>
                    <div className="col-span-2 text-right">TOTAL</div>
                  </div>
                  <div className="grid grid-cols-12 text-[11px] text-slate-800 py-1.5 border-b border-slate-200">
                    <div className="col-span-6 font-medium">{invoiceService || "Shower Cubicle Regrouting"}</div>
                    <div className="col-span-2 text-right">1</div>
                    <div className="col-span-2 text-right">${(invoicePrice || 0).toFixed(2)}</div>
                    <div className="col-span-2 text-right font-bold">${(invoicePrice || 0).toFixed(2)}</div>
                  </div>
                </div>

                {/* 5. Financial Summary */}
                <div className="text-right text-[11px] space-y-1 text-slate-800">
                  <div className="flex justify-end gap-6"><span className="text-slate-500 font-bold">SUBTOTAL</span> <span className="w-20">${((invoicePrice / 1.1) || 0).toFixed(2)}</span></div>
                  <div className="flex justify-end gap-6"><span className="text-slate-500 font-bold">GST (10%)</span> <span className="w-20">${(invoicePrice - (invoicePrice / 1.1) || 0).toFixed(2)}</span></div>
                  <div className="flex justify-end gap-6 font-bold"><span className="text-slate-900">TOTAL</span> <span className="w-20">${invoicePrice.toFixed(2)}</span></div>
                  <div className="flex justify-end gap-6"><span className="text-slate-500 font-bold">AMOUNT PAID</span> <span className="w-20">${invoiceStatus === "Paid" ? invoicePrice.toFixed(2) : "0.00"}</span></div>
                  <div className="flex justify-end gap-6 font-black text-sm text-slate-900"><span>BALANCE DUE</span> <span className="w-20">${invoiceStatus === "Paid" ? "0.00" : invoicePrice.toFixed(2)}</span></div>
                </div>

                {/* 6. HOW TO PAY: */}
                <div className="space-y-1 pt-1">
                  <div className="text-xs font-bold text-[#e5a910] uppercase tracking-wide">HOW TO PAY:</div>
                  <div className="text-[10px] text-slate-700">We accept payment by: Deposit</div>
                  
                  {/* Coral/red payment box with dynamic values */}
                  <div className="border border-red-300 rounded-lg p-2.5 bg-red-50/20 max-w-sm text-[10px] space-y-0.5">
                    <div className="font-black text-[11px] text-slate-900 pb-0.5">PAYMENT INFORMATION</div>
                    <div className="text-slate-700">• Bank Name: <span className="font-bold text-slate-900">{invoiceBankName || "ANZ"}</span></div>
                    <div className="text-slate-700">• Account Name: <span className="font-bold text-slate-900">{invoiceAccountName || "Groutix Pty Ltd"}</span></div>
                    <div className="text-slate-700">• Account Number: <span className="font-bold text-slate-900">{invoiceAccountNumber || "123456789"}</span></div>
                    <div className="text-slate-700">• BSB: <span className="font-bold text-slate-900">{invoiceBsb || "013442"}</span></div>
                  </div>
                </div>

                {/* 7. TERMS & CONDITIONS */}
                <div className="text-center pt-2 space-y-0.5">
                  <div className="text-xs font-black text-[#1e4e8c] tracking-wide uppercase">TERMS &amp; CONDITIONS</div>
                  <div className="text-[10px] text-slate-600 space-y-0.5">
                    <div>• Payment is due {invoiceDueDate || "within 7 days of invoice date"}</div>
                    <div>• Access our Terms &amp; Conditions</div>
                    <a
                      href="https://groutix.com/terms-and-conditions/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline font-medium"
                    >
                      https://groutix.com/terms-and-conditions/
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const q = new URLSearchParams({
                    bankName: invoiceBankName,
                    accountName: invoiceAccountName,
                    accountNumber: invoiceAccountNumber,
                    bsb: invoiceBsb,
                    dueDate: invoiceDueDate,
                    price: String(invoicePrice),
                    status: invoiceStatus,
                    service: invoiceService,
                    description: invoiceDescription,
                  });
                  window.open(`/api/admin/invoice/pdf/${activeInvoiceLead.id}?${q.toString()}`, "_blank");
                }}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
                title="Print or view official PDF invoice with current payment information"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / View PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  updateLeadField(activeInvoiceLead.id, {
                    quoteAmount: invoicePrice,
                    status: invoiceStatus === "Paid" ? "Payment Received" : activeInvoiceLead.status
                  });
                  setInvoiceModalOpen(false);
                }}
                className="px-5 py-2 bg-white border border-teal-700 text-teal-700 rounded-xl text-xs font-bold hover:bg-teal-50"
              >
                Save Invoice
              </button>
              <button
                type="button"
                onClick={handleSendInvoice}
                disabled={sendingInvoice || !activeInvoiceLead.email}
                title={!activeInvoiceLead.email ? "No email address saved for this customer" : "Email this invoice to the customer"}
                className="flex items-center gap-1.5 px-5 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingInvoice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {sendingInvoice ? "Sending…" : "Send Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: GROUTIX FIELD INSPECTION REPORT
         ========================================================================= */}
      {inspectionModalOpen && activeInspectionLead && (
        <InspectionModal
          isOpen={inspectionModalOpen}
          onClose={() => {
            setInspectionModalOpen(false);
            setActiveInspectionLead(null);
          }}
          lead={activeInspectionLead}
          currentUsername={username || undefined}
          onSave={async (report, markCompleted) => {
            const updates: Partial<Lead> = {
              inspectionReport: report,
            };
            if (markCompleted) {
              updates.status = "Inspection Completed";
            }
            const ok = await updateLeadField(activeInspectionLead.id, updates);
            if (ok) {
              setActiveInspectionLead((prev) => (prev ? { ...prev, ...updates } : null));
            }
            return ok;
          }}
        />
      )}

      {/* =========================================================================
          MODAL: TEAM CHAT (staff-to-staff)
         ========================================================================= */}
      {chatWith && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                  {chatWith.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="font-black text-slate-900 leading-tight">{chatWith.name}</div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[#001f97]">
                    {ROLE_LABELS[chatWith.role as Role] || chatWith.role}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setChatWith(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60 min-h-[240px]"
            >
              {chatLoading ? (
                <div className="text-center text-slate-400 text-sm py-8 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading conversation…
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="text-center text-slate-400 text-sm py-8">
                  No messages yet. Say hello to {chatWith.name.split(" ")[0]}.
                </div>
              ) : (
                chatMessages.map((m) => {
                  const mine = m.from.toLowerCase() === (username || "").toLowerCase();
                  return (
                    <div
                      key={m.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm shadow-xs ${mine
                            ? "bg-[#001f97] text-white rounded-br-sm"
                            : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                          }`}
                      >
                        <div className="whitespace-pre-wrap break-words">{m.text}</div>
                        <div
                          className={`text-[10px] mt-1 ${mine ? "text-white/60" : "text-slate-400"
                            }`}
                        >
                          {new Date(m.createdAt).toLocaleString("en-AU", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-slate-100 flex items-end gap-2">
              <textarea
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendChat();
                  }
                }}
                rows={1}
                placeholder={`Message ${chatWith.name.split(" ")[0]}…`}
                className="flex-1 resize-none p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-[#001f97] max-h-32"
              />
              <button
                onClick={sendChat}
                disabled={chatSending || !chatText.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#001f97] text-white text-xs font-bold rounded-xl hover:bg-[#001777] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {chatSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
