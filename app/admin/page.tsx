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
  MessageSquare,
  Navigation,
  ShieldCheck,
  Edit3,
  Trash2,
  Search,
  CheckSquare,
  Square,
  X,
  Printer,
  Paperclip,
  CheckCircle2,
  Download,
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
  Clock,
  ArrowRight,
  ClipboardList
} from "lucide-react";
import { useAdminBasePath, useAdminRole, useAdminUsername } from "@/components/admin/AdminProvider";
import { canView as roleCanView, ROLE_DEFAULT_VIEW, ROLE_LABELS, isRole, type Role } from "@/lib/roles";
import { STATUS_KEYS, STAGES, type StageGroup, inRoleQueue, JOB_STATUSES, INTAKE_STATUSES, FIELD_STATUSES, FINANCE_STATUSES } from "@/lib/pipeline";
import { StatCard, TimelineChart, BarList, Panel } from "@/components/admin/Charts";
import {
  SERVICE_TEMPLATES,
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
  attachments?: { name: string; contentType?: string; size?: number }[];
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
  else if (role === "field") base = FIELD_STATUSES;
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
  const hasUnread = lead.messages?.some((m) => m.from === "customer" && m.read === false);
  if (hasUnread) return "Customer replied! Answer enquiry";
  if (["Job Done", "Invoice Sent", "Payment Pending", "Payment Request"].includes(lead.status)) {
    return "Track outstanding payment";
  }
  if (["Payment Received", "Warranty Sent", "Completed"].includes(lead.status)) {
    return "Job complete — 10-year warranty active";
  }
  if (lead.status === "Contacted") {
    return "Customer replied? Schedule inspection";
  }
  if (lead.status === "Inspection Booked" || lead.status === "Inspection Scheduled") {
    return lead.inspectionAt ? `Inspection booked: ${fmtDate(lead.inspectionAt)}` : "Inspection booked — Prepare assessment";
  }
  if (lead.status === "Quote Sent") {
    return "Follow up on quotation offer";
  }
  if (lead.status === "New") {
    return "New enquiry — Contact customer";
  }
  return "Review lead status & workflow";
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
      return Boolean(lead.warranty?.sentAt) || ["Warranty Sent", "Completed"].includes(s);
    default:
      return false;
  }
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
            className={`min-w-[32px] px-2 py-1.5 rounded-lg text-xs font-bold ${
              p === page
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
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.type === "inspection"
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
  | "team";

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
  const [priorityFilter, setPriorityFilter] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
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
  const [replyText, setReplyText] = useState("");
  // Files staged to email along with the next reply. `content` is base64 for the
  // API; the rest is metadata used for the chip UI and the logged message.
  const [replyAttachments, setReplyAttachments] = useState<
    { name: string; content: string; contentType?: string; size?: number }[]
  >([]);
  const [sendingReply, setSendingReply] = useState(false);
  const replyFileRef = useRef<HTMLInputElement | null>(null);

  const [gpsModalOpen, setGpsModalOpen] = useState(false);
  const [activeGpsLead, setActiveGpsLead] = useState<Lead | null>(null);
  const [gpsStatusMessage, setGpsStatusMessage] = useState("");

  const [warrantyModalOpen, setWarrantyModalOpen] = useState(false);
  const [activeWarrantyLead, setActiveWarrantyLead] = useState<Lead | null>(null);
  const [warrantyJobNo, setWarrantyJobNo] = useState("");
  const [warrantyCompletion, setWarrantyCompletion] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [warrantyCustomer, setWarrantyCustomer] = useState("");
  const [warrantyAddress, setWarrantyAddress] = useState("");
  const [warrantyAuthorised, setWarrantyAuthorised] = useState("GROUTIX PTY LTD");
  const [warrantyIssued, setWarrantyIssued] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [activeInvoiceLead, setActiveInvoiceLead] = useState<Lead | null>(null);
  const [invoiceService, setInvoiceService] = useState("");
  const [invoiceDescription, setInvoiceDescription] = useState("");
  const [invoicePrice, setInvoicePrice] = useState<number>(0);
  const [invoiceGst, setInvoiceGst] = useState<number>(10);
  const [invoiceStatus, setInvoiceStatus] = useState("Unpaid");
  const [sendingInvoice, setSendingInvoice] = useState(false);

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
        setLeads(normalized);
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
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Reset to the first page whenever the view or any filter changes, so we never
  // show a stale/out-of-range page for the new (shorter) list.
  useEffect(() => {
    setPage(1);
  }, [currentView, statusFilter, priorityFilter, globalSearch, onlyUnread]);

  // Load the staff directory for every role (drives the Team view and all
  // assignee pickers) so nothing is hardcoded. Read-only names/roles only.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/staff", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setStaff(data.staff || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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

  // Active staff names for assignee dropdowns.
  const staffNames = useMemo(
    () => staff.filter((s) => s.active).map((s) => s.name),
    [staff]
  );

  // Options for the "Assigned To" picker: active staff, plus whatever the lead
  // is currently assigned to (so an auto-assigned value always shows).
  const assigneeOptions = useMemo(() => {
    const names = new Set<string>(staffNames);
    if (editingLead?.assigned) names.add(editingLead.assigned);
    if (names.size === 0) names.add("Unassigned");
    return Array.from(names);
  }, [staffNames, editingLead?.assigned]);

  // Options for a row-level assignee picker (active staff + the row's value).
  const rowAssigneeOptions = useCallback(
    (current?: string) => {
      const names = new Set<string>(staffNames);
      if (current) names.add(current);
      if (names.size === 0) names.add("Unassigned");
      return Array.from(names);
    },
    [staffNames]
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
        const res = await fetch("/api/admin/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingLead)
        });
        if (res.ok) {
          const { item } = await res.json();
          setLeads((prev) => [item, ...prev]);
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
    if (!l.email) return alert("No email address saved.");
    const subject = encodeURIComponent("Groutix - Your Enquiry");
    const body = encodeURIComponent(
      `Hi ${l.name || ""},\n\nThank you for contacting Groutix regarding your enquiry.\n\nRegards,\nGroutix Team`
    );
    window.location.href = `mailto:${l.email}?subject=${subject}&body=${body}`;
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
    setQuoteTerms(lead.quoteTerms || GROUTIX_QUOTE_TERMS.slice(0, 300));
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
    alert("Quote saved successfully.");
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
    window.open(`/api/admin/quote/pdf/${activeQuoteLead.id}`, "_blank");
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
      `\n\nAll works are subject to Groutix Terms & Conditions: https://groutix.com.au/terms-conditions\n\n` +
      `Please let us know if you would like to proceed with the booking.\n\nRegards,\nGroutix Team\n(03) 7023 8094`
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
      `\n\nTerms & Conditions: https://groutix.com.au/terms-conditions\n\nStay Sealed. Stay Smiling. - Groutix`
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
  async function openMessagesModal(lead: Lead) {
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
    setReplyText("");
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
          subject: "Re: Groutix Enquiry",
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
      setReplyAttachments([]);
    } catch (err) {
      alert("Failed to send email reply. Check console for details.");
      console.error(err);
    } finally {
      setSendingReply(false);
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

    setWarrantyJobNo(lead.warranty?.jobNo || `GX-${lead.id.slice(-6).toUpperCase()}`);
    setWarrantyCompletion(lead.warranty?.completionDate || today);
    setWarrantyExpiry(lead.warranty?.expiryDate || expiryStr);
    setWarrantyCustomer(lead.warranty?.customerName || lead.name || "");
    setWarrantyAddress(lead.warranty?.address || lead.address || "");
    setWarrantyAuthorised(lead.warranty?.authorisedBy || "GROUTIX PTY LTD");
    setWarrantyIssued(lead.warranty?.dateIssued || today);
    setWarrantyModalOpen(true);
  }

  useEffect(() => {
    if (!warrantyModalOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    grad.addColorStop(0, "#001f97");
    grad.addColorStop(1, "#1667e8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, 160);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 52px Arial, sans-serif";
    ctx.fillText("GROUTIX", 60, 95);
    ctx.font = "bold 26px Arial, sans-serif";
    ctx.fillText("10-YEAR WATERPROOF WARRANTY CERTIFICATE", 380, 95);

    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 24px Arial, sans-serif";
    ctx.fillText("Customer Details & Work Information", 60, 230);

    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 260, canvas.width - 120, 480);

    ctx.font = "20px Arial, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("Job / Certificate No:", 90, 320);
    ctx.fillText("Customer Name:", 90, 390);
    ctx.fillText("Property Address:", 90, 460);
    ctx.fillText("Completion Date:", 90, 530);
    ctx.fillText("Warranty Expiry Date:", 90, 600);
    ctx.fillText("Authorised Issuer:", 90, 670);

    ctx.font = "bold 22px Arial, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText(warrantyJobNo, 380, 320);
    ctx.fillText(warrantyCustomer, 380, 390);
    ctx.fillText(warrantyAddress, 380, 460);
    ctx.fillText(fmtDateOnly(warrantyCompletion), 380, 530);
    ctx.fillStyle = "#16a05e";
    ctx.fillText(fmtDateOnly(warrantyExpiry) + " (10 Years Guaranteed)", 380, 600);
    ctx.fillStyle = "#0f172a";
    ctx.fillText(warrantyAuthorised, 380, 670);

    ctx.font = "14px Arial, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(
      "This warranty guarantees against water penetration through regrouted tiled areas under normal domestic use subject to Clause 12 of Groutix Terms & Conditions.",
      60,
      790
    );
    ctx.fillText(
      "Terms & Conditions: https://groutix.com.au/terms-conditions  •  Claims must be submitted in writing within 10 business days of defect.",
      60,
      820
    );
    ctx.fillText(
      "Groutix Pty Ltd • ACN: 687 415 005 • Melbourne, VIC • Phone: (03) 7023 8094 • info@groutix.com",
      60,
      850
    );
  }, [
    warrantyModalOpen,
    warrantyJobNo,
    warrantyCustomer,
    warrantyAddress,
    warrantyCompletion,
    warrantyExpiry,
    warrantyAuthorised
  ]);

  function downloadWarrantyCard() {
    if (!canvasRef.current || !activeWarrantyLead) return;
    const link = document.createElement("a");
    link.download = `Groutix_Warranty_${(activeWarrantyLead.name || "Customer").replace(/[^a-zA-Z0-9]/g, "_")}.png`;
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
    setInvoiceStatus(lead.status === "Payment Received" || lead.status === "Job Done" ? "Paid" : "Unpaid");
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

  // Role queue: non-managers only see the leads whose current stage their role
  // owns. Managers see the whole book.
  const scopedLeads = useMemo(
    () => (role === "manager" ? leads : leads.filter((l) => inRoleQueue(role, l.status))),
    [leads, role]
  );

  // Filtering & Search
  const filteredLeads = useMemo(() => {
    let list = scopedLeads;
    const q = globalSearch.toLowerCase().trim();
    if (q) {
      list = list.filter((l) =>
        [l.name, l.phone, l.email, l.service, l.address, l.notes, l.message]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
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
        role === "finance" ? FINANCE_STATUSES.includes(l.status) : JOB_STATUSES.includes(l.status)
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
      Notification.requestPermission().catch(() => {});
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
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                currentView === "dashboard"
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

            {canSee("analytics") && (
            <button
              onClick={() => setCurrentView("analytics")}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                currentView === "analytics"
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

            {canSee("leads") && (
            <button
              onClick={() => setCurrentView("leads")}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                currentView === "leads"
                  ? "bg-[#001f97] text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                Leads
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  currentView === "leads" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {scopedLeads.length}
              </span>
            </button>
            )}

            {canSee("quotes") && (
            <button
              onClick={() => setCurrentView("quotes")}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                currentView === "quotes"
                  ? "bg-[#001f97] text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4" />
                Quotes
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  currentView === "quotes" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {scopedLeads.filter((l) => l.status === "Quote Sent" || l.quoteItems?.length).length}
              </span>
            </button>
            )}

            {canSee("jobs") && (
            <button
              onClick={() => setCurrentView("jobs")}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                currentView === "jobs"
                  ? "bg-[#001f97] text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4" />
                {role === "finance" ? "Invoicing & Warranty" : "Jobs / Bookings"}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  currentView === "jobs" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {role === "finance"
                  ? scopedLeads.filter((l) => FINANCE_STATUSES.includes(l.status)).length
                  : scopedLeads.filter((l) => JOB_STATUSES.includes(l.status)).length}
              </span>
            </button>
            )}

            {canSee("schedule") && (
            <button
              onClick={() => setCurrentView("schedule")}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                currentView === "schedule"
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
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                currentView === "customers"
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
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                currentView === "team"
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
                : "Team Members"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live tracking • {leads.length} records • inspections • quotes • jobs • warranty
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Search */}
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search leads, phone, service..."
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
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
                viewAs
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  viewAs ? "bg-amber-500" : "bg-emerald-500"
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
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                          analyticsDays === r ? "bg-[#001f97] text-white" : "text-slate-600 hover:bg-slate-100"
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
                  {STAGES.map((stage) => {
                    const accent = STAGE_GROUP_ACCENT[stage.group];
                    const value = counts[stage.key] || 0;
                    const active = statusFilter === stage.key;
                    return (
                      <button
                        key={stage.key}
                        type="button"
                        onClick={() => openLeadsFiltered([stage.key])}
                        className={`p-3 rounded-xl border text-left transition-all hover:shadow-sm focus:outline-hidden focus:ring-2 focus:ring-[#001f97]/30 cursor-pointer ${
                          active
                            ? "border-[#001f97] bg-[#001f97]/5"
                            : "border-slate-200 bg-slate-50/60 hover:border-[#001f97]/40"
                        }`}
                        title={`Show ${stage.label} leads`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`w-2 h-2 rounded-full ${accent.dot}`} />
                          <span className="text-[11px] font-bold text-slate-600 leading-tight line-clamp-1">
                            {stage.label}
                          </span>
                        </div>
                        <div className={`text-2xl font-black ${value ? accent.value : "text-slate-300"}`}>
                          {value}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Grid: Recent Leads & Task Panel */}
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
                                  className={`p-1 rounded-md transition-colors ${
                                    l.inspectionReport?.status === "completed"
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
                            <td colSpan={6} className="py-12 text-center text-slate-400">
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

                  {/* Task Panel */}
                  <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-black text-slate-900">Task Panel</h2>
                      <button
                        onClick={handleAddTask}
                        className="text-xs font-bold text-[#001f97] bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        + Add Task
                      </button>
                    </div>

                    <div className="space-y-2">
                      {tasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl border border-slate-100 hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={() => handleToggleTask(t.id, !t.done)}
                              className="text-slate-400 hover:text-[#001f97]"
                            >
                              {t.done ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                            <span
                              className={`text-xs truncate ${
                                t.done ? "line-through text-slate-400" : "text-slate-800 font-medium"
                              }`}
                            >
                              {t.text}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteTask(t.id)}
                            className="text-slate-300 hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {tasks.length === 0 && (
                        <div className="text-xs text-slate-400 text-center py-4">No tasks pending.</div>
                      )}
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
                  {(role === "intake"
                    ? STAGES.filter((s) =>
                        [
                          "New",
                          "Contacted",
                          "Waiting for Info",
                          "Inspection Booked",
                          "Inspection Completed",
                          "Quote Pending",
                          "Quote Sent",
                          "Negotiation",
                          "Won",
                          "Job Booked",
                          "Lost",
                        ].includes(s.key)
                      )
                    : STAGES
                  ).map((stage) => {
                    const accent = STAGE_GROUP_ACCENT[stage.group] || { dot: "bg-blue-500", value: "text-[#001f97]" };
                    const value = counts[stage.key] || 0;
                    const active = statusFilter === stage.key;
                    return (
                      <button
                        key={stage.key}
                        type="button"
                        onClick={() => {
                          setStatusFilter(active ? "" : stage.key);
                          setPage(1);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all hover:shadow-sm focus:outline-hidden focus:ring-2 focus:ring-[#001f97]/30 cursor-pointer ${
                          active
                            ? "border-[#001f97] bg-[#001f97]/5 ring-1 ring-[#001f97]"
                            : "border-slate-200 bg-slate-50/60 hover:border-[#001f97]/40"
                        }`}
                        title={`Show ${stage.label} leads`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`w-2 h-2 rounded-full ${accent.dot}`} />
                          <span className="text-[11px] font-bold text-slate-600 leading-tight line-clamp-1">
                            {stage.label}
                          </span>
                        </div>
                        <div className={`text-2xl font-black ${value ? accent.value : "text-slate-300"}`}>
                          {value}
                        </div>
                      </button>
                    );
                  })}
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
                      placeholder="Search name, phone, email, service..."
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
                    className={`flex items-center gap-1.5 text-xs px-3.5 py-2.5 rounded-xl border font-semibold transition-colors ${
                      onlyUnread
                        ? "bg-[#001f97] text-white border-[#001f97]"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                    title="Show only conversations with an unread customer reply"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Unread replies
                    {unreadReplyCount > 0 && (
                      <span
                        className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center ${
                          onlyUnread ? "bg-white/25 text-white" : "bg-rose-500 text-white"
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
              <div className="hidden xl:grid grid-cols-4 gap-6 px-5 py-3 bg-[#e8f0fe] text-[#1e3a8a] text-xs font-black uppercase tracking-wider rounded-xl">
                <div>CLIENT</div>
                <div>SERVICE &amp; PHOTOS</div>
                <div>FOLLOW-UP &amp; CONVERSATION</div>
                <div>FINANCE &amp; COMPLETION</div>
              </div>

              {/* Leads List */}
              <div className="divide-y divide-slate-200/80">
                {filteredLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((l) => {
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
                        {/* COLUMN 1: CLIENT */}
                        <div className="space-y-2">
                          <div className="font-bold text-slate-900 text-sm">
                            {l.name || "Unnamed Customer"}
                          </div>

                          <div className="space-y-1 text-xs text-slate-600">
                            {l.email ? (
                              <div className="flex items-center gap-2 text-slate-600">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate" title={l.email}>{l.email}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-slate-400">
                                <Mail className="w-3.5 h-3.5 shrink-0" />
                                <span>No email</span>
                              </div>
                            )}

                            {l.phone ? (
                              <div className="flex items-center gap-2 text-slate-600">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{l.phone}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-slate-400">
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

                          <div className="pt-2">
                            <button
                              onClick={() => {
                                setEditingLead(l);
                                setLeadModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#dbeafe] hover:bg-blue-200 text-[#1d4ed8] text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
                            >
                              <span>Open Client / Workflow</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* COLUMN 2: SERVICE & PHOTOS */}
                        <div className="space-y-2.5">
                          <div className="font-bold text-xs text-slate-900 line-clamp-2 uppercase tracking-tight" title={l.service}>
                            {l.service || "Standard Work"}
                          </div>

                          <div>
                            <div className="inline-flex flex-wrap items-center gap-2 px-2.5 py-1 bg-[#e8f0fe] text-[#1e40af] text-[11px] font-bold rounded-md">
                              <span>RECEIVED</span>
                              <span className="flex items-center gap-1">
                                📅 {fmtDateBadge(l.received || l.createdAt)}
                              </span>
                              {(l.received || l.createdAt) && (
                                <span className="flex items-center gap-1">
                                  🕒 {fmtTimeBadge(l.received || l.createdAt)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 pt-0.5">
                            {/* Photos / Camera Button */}
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

                            {/* Inspection Report Button */}
                            <button
                              onClick={() => openInspectionModal(l)}
                              className={`w-full px-3 py-2 font-bold rounded-xl text-xs flex items-center justify-between border transition-colors cursor-pointer ${
                                l.inspectionReport?.status === "completed"
                                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : "bg-teal-50/70 hover:bg-teal-100/80 text-teal-900 border-teal-200"
                              }`}
                              title="Open Groutix Inspection Report form"
                            >
                              <span className="flex items-center gap-2">
                                <ClipboardList className="w-3.5 h-3.5 text-teal-700" />
                                <span>Inspection Form</span>
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  l.inspectionReport?.status === "completed"
                                    ? "bg-emerald-600 text-white"
                                    : "bg-teal-200 text-teal-800"
                                }`}
                              >
                                {l.inspectionReport?.status === "completed" ? "Done" : "Fill"}
                              </span>
                            </button>

                            {/* Quote Button */}
                            <button
                              onClick={() => openQuoteModal(l)}
                              className="w-full px-3 py-2 bg-[#f1f5f9] hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-between border border-slate-200/80 transition-colors cursor-pointer"
                              title="Open quote builder"
                            >
                              <span className="flex items-center gap-2 text-slate-800">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                <span>Quote</span>
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold">
                                Finalize &amp; Share
                              </span>
                            </button>
                          </div>

                          <div className="text-[10px] text-slate-400 italic">
                            Service is taken from the Quote Form.
                          </div>
                        </div>

                        {/* COLUMN 3: FOLLOW-UP & CONVERSATION */}
                        <div className="space-y-2.5">
                          {/* Auto status header & dropdown */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">AUTO STATUS</span>
                            </div>

                            <select
                              value={l.status}
                              onChange={(e) => updateLeadField(l.id, { status: e.target.value })}
                              className="text-xs font-bold text-slate-700 bg-transparent border-0 text-right focus:outline-none cursor-pointer hover:text-[#001f97]"
                            >
                              {getRoleStatusOptions(role, l.status).map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* ── Login 1 (Intake / Leads): New, Contacted, Inspections, Quotes, Job Booked ── */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Intake Workflow
                              </span>
                            </div>
                            <div className="grid grid-cols-5 gap-1">
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
                                  className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-0.5 cursor-pointer ${
                                    st.active
                                      ? `${st.color} text-white shadow-2xs`
                                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80"
                                  }`}
                                  title={`Set status: ${st.label}`}
                                >
                                  {st.active && <Check className="w-2.5 h-2.5 stroke-[2.5] shrink-0" />}
                                  <span className="truncate">{st.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Follow-up card */}
                          <div className="bg-[#fee2e2]/70 border border-rose-200/80 rounded-xl p-2.5">
                            <div className="text-[10px] font-black tracking-wider text-rose-800 uppercase">
                              FOLLOW-UP
                            </div>
                            <div className="text-xs font-semibold text-slate-800 mt-0.5">
                              {followupPrompt}
                            </div>
                          </div>

                          {/* 4 Quick Action Buttons */}
                          <div className="grid grid-cols-4 gap-1.5">
                            <button
                              onClick={() => callCustomer(l)}
                              className="flex items-center justify-center gap-1 py-1.5 px-1 bg-[#e8f0fe] hover:bg-blue-100 text-[#1e40af] rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                              title="Call customer phone"
                            >
                              <Phone className="w-3 h-3 shrink-0" />
                              <span>Call</span>
                            </button>

                            <button
                              onClick={() => emailCustomer(l)}
                              className="flex items-center justify-center gap-1 py-1.5 px-1 bg-[#e8f0fe] hover:bg-blue-100 text-[#1e40af] rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                              title="Send email"
                            >
                              <Mail className="w-3 h-3 shrink-0" />
                              <span>Email</span>
                            </button>

                            <button
                              onClick={() => openMessagesModal(l)}
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

                          {/* Customer replied / conversation button */}
                          <button
                            onClick={() => openMessagesModal(l)}
                            className="w-full py-2 px-3 bg-[#e8f0fe]/80 hover:bg-blue-100 text-[#1e40af] rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-blue-200/70 transition-colors cursor-pointer"
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
                        </div>

                        {/* COLUMN 4: FINANCE & COMPLETION */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between pb-1">
                            <div className="font-black text-slate-900 text-sm">
                              AUD ${total.toFixed(2)}
                            </div>

                            {/* Utility icons: GPS, Edit, Delete */}
                            <div className="flex items-center gap-1 text-slate-400">
                              <button
                                onClick={() => openGpsModal(l)}
                                title="GPS Navigation"
                                className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingLead(l);
                                  setLeadModalOpen(true);
                                }}
                                title="Edit Lead"
                                className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteLead(l.id)}
                                title="Delete Lead"
                                className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* 6 Step Checklist */}
                          <div className="space-y-1.5">
                            {[
                              { label: "Job Done", step: "Job Done" },
                              { label: "Invoice Sent", step: "Invoice Sent" },
                              { label: "Payment Request", step: "Payment Request" },
                              { label: "Payment Pending", step: "Payment Pending" },
                              { label: "Payment Received", step: "Payment Received" },
                              { label: "Warranty", step: "Warranty" }
                            ].map(({ label, step }) => {
                              const isActive = getStepActive(l, step);
                              return (
                                <button
                                  key={step}
                                  onClick={() => {
                                    if (step === "Invoice Sent") openInvoiceModal(l);
                                    else if (step === "Warranty") openWarrantyModal(l);
                                    else updateLeadField(l.id, { status: step });
                                  }}
                                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                                    isActive
                                      ? "bg-[#ccfbf1]/80 text-[#0f766e] border-teal-200/80 shadow-2xs"
                                      : "bg-[#f8fafc] text-slate-600 border-slate-200/70 hover:bg-slate-100 hover:border-slate-300"
                                  }`}
                                  title={`Click to manage ${label}`}
                                >
                                  <span>{label}</span>
                                  {isActive ? (
                                    <Check className="w-3.5 h-3.5 text-[#0f766e] stroke-[2.5]" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
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
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-slate-900">Active & Prepared Quotations</h2>
                <div className="text-xs text-slate-500">
                  {quoteLeads.length} Quotes in System
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
                            <td className="py-3 px-3 font-bold text-slate-900">{l.name || "Customer"}</td>
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
                  {(role === "finance"
                    ? STAGES.filter((s) => FINANCE_STATUSES.includes(s.key))
                    : role === "field"
                    ? STAGES.filter((s) =>
                        [
                          "Inspection Booked",
                          "Inspection En Route",
                          "Inspection Arrived",
                          "Inspection In Progress",
                          "Inspection Completed",
                          "Quote Pending",
                          "Won",
                          "Job Booked",
                          "Scheduled",
                          "Job Confirmed",
                          "Job En Route",
                          "Job Arrived",
                          "Job In Progress",
                          "Job Done",
                        ].includes(s.key)
                      )
                    : STAGES.filter((s) => FIELD_STATUSES.includes(s.key) || FINANCE_STATUSES.includes(s.key))
                  ).map((stage) => {
                    const accent = STAGE_GROUP_ACCENT[stage.group] || { dot: "bg-cyan-500", value: "text-cyan-600" };
                    const value = counts[stage.key] || 0;
                    const active = statusFilter === stage.key;
                    return (
                      <button
                        key={stage.key}
                        type="button"
                        onClick={() => {
                          setStatusFilter(active ? "" : stage.key);
                          setPage(1);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all hover:shadow-sm focus:outline-hidden focus:ring-2 focus:ring-[#001f97]/30 cursor-pointer ${
                          active
                            ? "border-[#001f97] bg-[#001f97]/5 ring-1 ring-[#001f97]"
                            : "border-slate-200 bg-slate-50/60 hover:border-[#001f97]/40"
                        }`}
                        title={`Filter by ${stage.label}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`w-2 h-2 rounded-full ${accent.dot}`} />
                          <span className="text-[11px] font-bold text-slate-600 leading-tight line-clamp-1">
                            {stage.label}
                          </span>
                        </div>
                        <div className={`text-2xl font-black ${value ? accent.value : "text-slate-300"}`}>
                          {value}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs space-y-4">
                <div className="space-y-3 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-black text-slate-900">
                        {role === "finance" ? "Finance & Job Completion" : "Bookings &amp; Jobs"}
                      </h2>
                    <div className="text-xs text-slate-500">
                      {role === "finance"
                        ? `Showing ${jobLeads.length} completed jobs for invoicing, payment & warranty`
                        : `Showing ${jobLeads.length} bookings & jobs from Inspection Booked to Job Done`}
                    </div>
                  </div>
                </div>

                {/* Quick Status Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                  {role === "finance" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setStatusFilter("")}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs shrink-0 ${
                          !statusFilter
                            ? "bg-[#001f97] text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        All Finance Jobs ({scopedLeads.filter((l) => FINANCE_STATUSES.includes(l.status)).length})
                      </button>
                      {FINANCE_STATUSES.map((st) => {
                        const active = statusFilter === st;
                        const count = scopedLeads.filter((l) => l.status === st).length;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setStatusFilter(active ? "" : st)}
                            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-xs flex items-center gap-1.5 shrink-0 ${
                              active
                                ? "bg-[#001f97] text-white shadow-xs"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            <span>{st}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setStatusFilter("")}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs shrink-0 ${
                          !statusFilter
                            ? "bg-[#001f97] text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        All Active ({scopedLeads.filter((l) => JOB_STATUSES.includes(l.status)).length})
                      </button>
                      {JOB_STATUSES.map((st) => {
                        const active = statusFilter === st;
                        const count = scopedLeads.filter((l) => l.status === st).length;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setStatusFilter(active ? "" : st)}
                            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-xs flex items-center gap-1.5 shrink-0 ${
                              active
                                ? "bg-[#001f97] text-white shadow-xs"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            <span>{st}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobLeads
                  .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                  .map((l) => (
                    <div
                      key={l.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all shadow-2xs space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        {/* Card Header: Customer Name & Status/Priority */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLead(l);
                                setLeadModalOpen(true);
                              }}
                              className="font-black text-slate-900 text-sm hover:text-[#001f97] hover:underline text-left transition-colors"
                            >
                              {l.name || "Customer"}
                            </button>
                            {l.address && (
                              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={l.address}>
                                {l.address}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <QuoteResponseBadge lead={l} />
                            {l.invoiceOpenedAt && (
                              <span
                                title={`Invoice opened • ${fmtDate(l.invoiceOpenedAt)}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Invoice opened
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Customer & Job Details */}
                        <div className="text-xs text-slate-600 space-y-1 bg-white p-2.5 rounded-xl border border-slate-200/80">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Phone:</span>
                            <span className="font-semibold text-slate-800">{l.phone || "—"}</span>
                          </div>
                          {l.email && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Email:</span>
                              <span className="font-medium text-slate-700 truncate max-w-[180px]" title={l.email}>
                                {l.email}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Service:</span>
                            <span className="font-semibold text-slate-800 text-right truncate max-w-[170px]" title={l.service}>
                              {l.service || "Standard Service"}
                            </span>
                          </div>
                          {l.quoteAmount && l.quoteAmount > 0 ? (
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                              <span className="text-slate-400">Quote Value:</span>
                              <span className="font-black text-emerald-700">AUD ${l.quoteAmount.toFixed(2)}</span>
                            </div>
                          ) : null}
                        </div>

                        {/* Status & Assigned Technician Controls */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase tracking-wider">
                              Status
                            </label>
                            <select
                              value={l.status}
                              onChange={(e) => updateLeadField(l.id, { status: e.target.value })}
                              className={`w-full text-[11px] font-bold px-2 py-1.5 rounded-lg border focus:outline-hidden ${getBadgeColor(
                                l.status
                              )}`}
                            >
                              {(role === "finance"
                                ? FINANCE_STATUSES
                                : role === "field"
                                ? JOB_STATUSES
                                : [...new Set([...JOB_STATUSES, ...FINANCE_STATUSES])]
                              ).map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase tracking-wider">
                              Assigned
                            </label>
                            <select
                              value={l.assigned || "Unassigned"}
                              onChange={(e) => updateLeadField(l.id, { assigned: e.target.value })}
                              className="w-full text-[11px] px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-hidden"
                            >
                              {rowAssigneeOptions(l.assigned).map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* ── Login 1 (Intake / Leads): New, Contacted, Inspections, Quotes, Job Booked ── */}
                        {(role === "intake" || role === "manager") && (
                          <div className="pt-1">
                            <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                              Intake Workflow Stages
                            </label>
                            <div className="grid grid-cols-5 gap-1">
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
                                  className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-0.5 cursor-pointer ${
                                    st.active
                                      ? `${st.color} text-white shadow-2xs`
                                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80"
                                  }`}
                                  title={`Set status: ${st.label}`}
                                >
                                  {st.active && <Check className="w-2.5 h-2.5 stroke-[2.5] shrink-0" />}
                                  <span className="truncate">{st.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── Login 2 (Field / Scheduling): Inspection Booked, Inspection Completed, Quote Pending, Job Booked ── */}
                        {(role === "field" || role === "manager" || (!FINANCE_STATUSES.includes(l.status) && role !== "finance")) && (
                          <div className="pt-1">
                            <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                              Field Workflow Stages
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              {[
                                { label: "Inspection Booked", status: "Inspection Booked", color: "bg-blue-600 hover:bg-blue-700" },
                                { label: "Inspection Completed", status: "Inspection Completed", color: "bg-teal-600 hover:bg-teal-700" },
                                { label: "Quote Pending", status: "Quote Pending", color: "bg-amber-600 hover:bg-amber-700" },
                                { label: "Job Booked", status: "Job Booked", color: "bg-emerald-600 hover:bg-emerald-700" },
                              ].map((st) => {
                                const isCurrent = l.status === st.status;
                                return (
                                  <button
                                    key={st.status}
                                    type="button"
                                    onClick={() => updateLeadField(l.id, { status: st.status })}
                                    className={`px-1.5 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                      isCurrent
                                        ? `${st.color} text-white shadow-xs`
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80"
                                    }`}
                                    title={`Set status: ${st.label}`}
                                  >
                                    {isCurrent && <Check className="w-3 h-3 stroke-[2.5]" />}
                                    <span className="truncate">{st.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* On-site visit tracker: On the Way → Reached → Start →
                            Complete. Each button advances the lead's status (and
                            is auto-logged with a timestamp on the server). */}
                        {(() => {
                          const steps = visitStepsFor(l.status);
                          if (!steps) return null;
                          const currentIdx = steps.findIndex((s) => s.status === l.status);
                          return (
                            <div className="pt-0.5">
                              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                                {INSPECTION_PHASE.includes(l.status) ? "Inspection live visit" : "Job live visit"}
                              </label>
                              <div className="grid grid-cols-4 gap-1">
                                {steps.map((step, idx) => {
                                  const done = currentIdx >= 0 && idx <= currentIdx;
                                  const isNext = idx === currentIdx + 1;
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

                        {/* ── Inspection Report Action (Field / Intake / Manager) ── */}
                        <div className="pt-1.5 pb-0.5">
                          <button
                            type="button"
                            onClick={() => openInspectionModal(l)}
                            className="w-full px-3 py-2 bg-[#001f97] hover:bg-[#001777] text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-xs transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <ClipboardList className="w-4 h-4 text-white" />
                              <span>GROUTIX Field Inspection Report</span>
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                l.inspectionReport?.status === "completed"
                                  ? "bg-emerald-500 text-white"
                                  : "bg-white/20 text-white"
                              }`}
                            >
                              {l.inspectionReport?.status === "completed" ? "Completed" : "Fill / View Form"}
                            </span>
                          </button>
                        </div>

                        {/* ── Login 3 (Finance / Completion): Job Done, Payment Pending, Payment Received, Warranty Sent ── */}
                        {(role === "finance" || role === "manager" || FINANCE_STATUSES.includes(l.status)) && (
                          <div className="pt-1">
                            <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                              Finance &amp; Completion Stages
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              {[
                                { label: "Job Done", status: "Job Done", color: "bg-sky-600 hover:bg-sky-700" },
                                { label: "Payment Pending", status: "Payment Pending", color: "bg-amber-600 hover:bg-amber-700" },
                                { label: "Payment Received", status: "Payment Received", color: "bg-emerald-600 hover:bg-emerald-700" },
                                { label: "Warranty Sent", status: "Warranty Sent", color: "bg-[#001f97] hover:bg-[#001777]" },
                              ].map((st) => {
                                const isCurrent = l.status === st.status;
                                return (
                                  <button
                                    key={st.status}
                                    type="button"
                                    onClick={() => {
                                      updateLeadField(l.id, { status: st.status });
                                      if (st.status === "Warranty Sent") {
                                        openWarrantyModal(l);
                                      }
                                    }}
                                    className={`px-1.5 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                      isCurrent
                                        ? `${st.color} text-white shadow-xs`
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80"
                                    }`}
                                    title={`Set status: ${st.label}`}
                                  >
                                    {isCurrent && <Check className="w-3 h-3 stroke-[2.5]" />}
                                    <span className="truncate">{st.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Full Action Buttons Toolbar */}
                      <div className="flex items-center justify-between gap-1 pt-3 border-t border-slate-200/80 mt-2">
                        <div className="flex items-center gap-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => callCustomer(l)}
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs transition-colors"
                            title="Call Phone"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => emailCustomer(l)}
                            className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs transition-colors"
                            title="Email Customer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openQuoteModal(l)}
                            className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-[11px] font-bold transition-colors"
                            title="Open Quote Builder"
                          >
                            Quote
                          </button>

                          {/* Invoice Action (shown for 3rd login - Finance & Manager) */}
                          {(role === "finance" || role === "manager") && (
                            <button
                              type="button"
                              onClick={() => openInvoiceModal(l)}
                              className="px-2.5 py-1 bg-[#001f97] text-white hover:bg-[#001777] rounded-lg text-[11px] font-bold transition-colors shadow-2xs"
                              title="Generate / Email Invoice"
                            >
                              Invoice
                            </button>
                          )}

                          {/* Warranty Action (shown for Finance & Manager, or when Payment Received) */}
                          {(role === "finance" || role === "manager" || l.status === "Payment Received" || l.status === "Warranty Sent") && (
                            <button
                              type="button"
                              onClick={() => openWarrantyModal(l)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ${
                                l.status === "Warranty Sent"
                                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                  : l.status === "Payment Received"
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs"
                                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                              }`}
                              title="10-Year Warranty Card Generator"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>10-Yr Warranty</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openPhotosModal(l)}
                            className="relative p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                            title="Photos"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            {((l.photos && l.photos.length > 0) || (l.photosCount && l.photosCount > 0)) && (
                              <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-blue-600 text-white rounded-full text-[9px] font-bold">
                                {l.photos?.length || l.photosCount}
                              </span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => openMessagesModal(l)}
                            className="relative p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                            title="Messages"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {l.messages?.some((m) => m.from === "customer" && m.read === false) && (
                              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => openGpsModal(l)}
                            className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                            title="GPS Check-in"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLead(l);
                              setLeadModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                            title="Edit Lead Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLead(l.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                {jobLeads.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-400 text-sm">
                    No bookings or jobs yet.
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
              <h2 className="text-base font-black text-slate-900">Customer Directory ({scopedLeads.length} Records)</h2>
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
                    {scopedLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-bold text-slate-900">{l.name || "Customer"}</td>
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
              <Pagination page={page} pageSize={PAGE_SIZE} total={scopedLeads.length} onPage={setPage} />
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
                    value={editingLead?.assigned || assigneeOptions[0]}
                    onChange={(e) => setEditingLead({ ...editingLead, assigned: e.target.value })}
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-6 space-y-4 my-6">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs max-h-[72vh] overflow-y-auto p-1">
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
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                            activeQuoteLead.leaking.toLowerCase() === "yes"
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

                  {quoteItems.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                      <div className="flex items-center justify-between font-bold text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-black">
                            {idx + 1}
                          </span>
                          <span>Item #{idx + 1}</span>
                          {item.code && (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                              {item.code}
                            </span>
                          )}
                        </span>
                        {quoteItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setQuoteItems(quoteItems.filter((_, i) => i !== idx))}
                            className="text-rose-500 hover:text-rose-700 text-[11px] font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      {/* Template Selector with Search */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Pick from 84 Standard Groutix Templates
                        </label>
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
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                          Service Title <span className="text-slate-400 font-normal">(Editable)</span>
                        </label>
                        <input
                          type="text"
                          value={item.service || ""}
                          onChange={(e) => {
                            const updated = [...quoteItems];
                            updated[idx].service = e.target.value;
                            setQuoteItems(updated);
                          }}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                          placeholder="Service title..."
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                          Detailed Scope <span className="text-slate-400 font-normal">(Editable)</span>
                        </label>
                        <textarea
                          rows={3}
                          value={item.scope || ""}
                          onChange={(e) => {
                            const updated = [...quoteItems];
                            updated[idx].scope = e.target.value;
                            setQuoteItems(updated);
                          }}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed"
                          placeholder="Detailed scope of works..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Price (AUD)</label>
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
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.qty || 1}
                            onChange={(e) => {
                              const updated = [...quoteItems];
                              updated[idx].qty = parseInt(e.target.value, 10) || 1;
                              setQuoteItems(updated);
                            }}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
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

              {/* Right Column: Branded Quotation Document Preview */}
              <div className="border border-slate-300 rounded-xl p-6 bg-white shadow-sm font-sans space-y-4">
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <div className="text-2xl font-black text-[#001f97]">GROUTIX</div>
                    <div className="text-[11px] text-slate-600 leading-tight mt-1">
                      Melbourne, VIC<br />
                      Phone: (03) 7023 8094<br />
                      Email: info@groutix.com
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-700 space-y-0.5">
                    <div className="text-lg font-black text-slate-900">QUOTATION</div>
                    <div><b>ACN:</b> 687 415 005</div>
                    <div><b>Quote #:</b> GQ-{activeQuoteLead.id.slice(-6).toUpperCase()}</div>
                    <div><b>Date:</b> {new Date().toLocaleDateString("en-AU")}</div>
                  </div>
                </div>

                <div className="text-[11px] font-semibold text-slate-700 italic">
                  Thank you for choosing Groutix. Stay Sealed. Stay Smiling.
                </div>

                <div className="text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900">{activeQuoteLead.name || "Customer Name"}</div>
                  <div>{activeQuoteLead.phone}</div>
                  <div>{activeQuoteLead.email}</div>
                  <div>{activeQuoteLead.address}</div>
                </div>

                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-100 font-bold uppercase text-[9px] text-slate-700">
                      <th className="py-2 px-2">Description / Scope</th>
                      <th className="py-2 px-2 text-right">Qty</th>
                      <th className="py-2 px-2 text-right">Unit Price</th>
                      <th className="py-2 px-2 text-right">Total Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {quoteItems.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-2">
                          {item.code && <div className="text-[9px] font-bold text-blue-700">{item.code}</div>}
                          <div className="font-black text-slate-900 text-xs">{item.service}</div>
                          {item.scope && !isRedundantScope(item.service, item.scope) && (
                            <div className="text-[10px] text-slate-600 whitespace-pre-wrap mt-1 leading-relaxed">
                              {item.scope}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-right">{item.qty || 1}</td>
                        <td className="py-2.5 px-2 text-right">${Number(item.price || 0).toFixed(2)}</td>
                        <td className="py-2.5 px-2 text-right font-bold">
                          ${(Number(item.price || 0) * Number(item.qty || 1)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="border-t border-slate-800 pt-3 flex flex-col items-end text-xs space-y-1">
                  <div>
                    Subtotal: <b>AUD ${quoteTotals().subtotal.toFixed(2)}</b>
                  </div>
                  <div>
                    GST ({quoteTaxRate}%): <b>AUD ${quoteTotals().gst.toFixed(2)}</b>
                  </div>
                  <div className="text-base font-black text-[#001f97] border-t border-slate-300 pt-1">
                    TOTAL: AUD ${quoteTotals().total.toFixed(2)}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-2 space-y-1">
                  <div>
                    <b>Conditions:</b> {quoteTerms}
                  </div>
                  <div className="pt-1">
                    <a
                      href="/terms-conditions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#001f97] underline font-bold hover:text-blue-900 inline-flex items-center gap-1"
                    >
                      <span>View Official Terms &amp; Conditions (groutix.com.au/terms-conditions)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
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
                    className={`p-3 rounded-2xl max-w-[85%] text-xs shadow-xs space-y-1 ${
                      isCustomer
                        ? "mr-auto bg-white border border-slate-200 text-slate-800"
                        : "ml-auto bg-[#001f97] text-white"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between gap-4 text-[10px] font-bold ${
                        isCustomer ? "text-slate-400" : "text-blue-200"
                      }`}
                    >
                      <span>{isCustomer ? "Customer" : "Groutix Team"} ({msg.channel || "note"})</span>
                      <span>{fmtDate(msg.time)}</span>
                    </div>
                    {msg.subject && <div className="font-bold">{msg.subject}</div>}
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.attachments.map((att, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              isCustomer ? "bg-slate-100 text-slate-600" : "bg-white/15 text-white"
                            }`}
                          >
                            <Paperclip className="w-2.5 h-2.5" />
                            {att.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Reply Composer */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Reply via Email:</span>
                <button
                  onClick={handleAddCustomerDemoReply}
                  className="text-xs text-[#001f97] font-semibold hover:underline"
                >
                  + Add Customer Message
                </button>
              </div>

              <textarea
                rows={3}
                placeholder="Type your reply or internal note here..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
              />

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

              <div className="flex justify-between gap-2">
                <button
                  onClick={() => replyFileRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50"
                  title="Attach files to email"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  Attach
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={sendingReply || (!replyText.trim() && replyAttachments.length === 0)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#001f97] text-white text-xs font-bold rounded-xl hover:bg-[#001777] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {sendingReply ? "Sending…" : "Save & Send Reply"}
                </button>
              </div>
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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
                <label className="font-bold text-slate-700 block mb-1">Customer Name</label>
                <input
                  type="text"
                  value={warrantyCustomer}
                  onChange={(e) => setWarrantyCustomer(e.target.value)}
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

            {/* Canvas Preview */}
            <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-100">
              <canvas
                ref={canvasRef}
                width={1536}
                height={900}
                className="w-full h-auto block"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 gap-1 px-1">
              <span>Warranty governed by Clause 12 of Groutix Terms &amp; Conditions</span>
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

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                onClick={downloadWarrantyCard}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </button>
              <button
                onClick={handleSendWarranty}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                title="Email the warranty card to the customer and mark it sent"
              >
                <Send className="w-4 h-4" />
                Email to Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: AUTO INVOICE
         ========================================================================= */}
      {invoiceModalOpen && activeInvoiceLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center p-4 sm:pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">Tax Invoice Generator</h2>
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
              </div>

              {/* Invoice Preview */}
              <div className="border border-slate-300 rounded-xl p-5 bg-white space-y-3 font-sans shadow-xs">
                <div className="flex items-start justify-between border-b border-slate-300 pb-3">
                  <div>
                    <div className="text-xl font-black text-teal-700">GROUTIX</div>
                    <div className="text-[10px] text-slate-500">Professional Re-Grouting Services</div>
                  </div>
                  <div className="text-right text-[10px] text-slate-600">
                    <div className="font-black text-sm text-slate-900">TAX INVOICE</div>
                    <div>Date: {new Date().toLocaleDateString("en-AU")}</div>
                    <div>Inv #: INV-{activeInvoiceLead.id.slice(-6).toUpperCase()}</div>
                  </div>
                </div>

                <div className="text-[11px]">
                  <b>Bill To:</b> {activeInvoiceLead.name}<br />
                  {activeInvoiceLead.address}<br />
                  {activeInvoiceLead.email}
                </div>

                <div className="border-t border-slate-200 pt-2 space-y-1">
                  <div className="font-bold text-slate-900">{invoiceService}</div>
                  <div className="text-[10px] text-slate-600 whitespace-pre-wrap">{invoiceDescription}</div>
                </div>

                <div className="border-t border-slate-300 pt-3 text-right space-y-0.5">
                  <div className="text-xs">Subtotal: ${((invoicePrice / 1.1) || 0).toFixed(2)}</div>
                  <div className="text-xs">GST: ${(invoicePrice - (invoicePrice / 1.1) || 0).toFixed(2)}</div>
                  <div className="text-base font-black text-teal-800">Total: ${invoicePrice.toFixed(2)}</div>
                  <div className="text-xs font-bold text-slate-600">Status: {invoiceStatus}</div>
                </div>

                <div className="border-t border-slate-200 pt-2 text-[10px] text-slate-500">
                  <span>Payment is subject to </span>
                  <a
                    href="/terms-conditions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#001f97] underline font-bold"
                  >
                    Groutix Terms &amp; Conditions (groutix.com.au/terms-conditions)
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Print Invoice
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
          currentUsername={adminUsername || undefined}
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
                        className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm shadow-xs ${
                          mine
                            ? "bg-[#001f97] text-white rounded-br-sm"
                            : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">{m.text}</div>
                        <div
                          className={`text-[10px] mt-1 ${
                            mine ? "text-white/60" : "text-slate-400"
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
