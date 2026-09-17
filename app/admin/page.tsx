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
  ShieldAlert,
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
  Smartphone,
  MapPin,
  Wrench,
  Maximize2,
  Minimize2,
  Settings,
  GripHorizontal,
  RotateCcw,
  ArrowDown
} from "lucide-react";
import { useAdminBasePath, useAdminRole, useAdminUsername } from "@/components/admin/AdminProvider";
import { canView as roleCanView, ROLE_DEFAULT_VIEW, ROLE_LABELS, isRole, type Role } from "@/lib/roles";
import { STATUS_KEYS, STAGES, type StageGroup, inRoleQueue, stageOwner, JOB_STATUSES, INTAKE_STATUSES, INSPECTION_STATUSES, TECHNICIAN_STATUSES, FIELD_STATUSES, FINANCE_STATUSES, isFlowCompleted, isFlowInProgress } from "@/lib/pipeline";
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
import { formatAppt, formatApptDate, formatApptTime, formatApptTimeRange, apptInstantMs } from "@/lib/scheduling";
import { ScopeOfWorkPanel } from "@/components/admin/ScopeOfWorkPanel";
import { AdminPageProvider } from "@/components/admin/AdminPageContext";
import { IntakeLeadRow } from "@/components/admin/rows/IntakeLeadRow";
import { FieldLeadRow } from "@/components/admin/rows/FieldLeadRow";
import { TechnicianLeadRow } from "@/components/admin/rows/TechnicianLeadRow";
import { FinanceLeadRow } from "@/components/admin/rows/FinanceLeadRow";
import { StandardLeadCard } from "@/components/admin/rows/StandardLeadCard";
import { ManagerDashboard } from "@/components/admin/ManagerDashboard";
import type { Lead, QuoteItem, CustomerMessage, GpsCheckin, WarrantyDoc, ActivityEntry, CrmTask, StaffMember } from "@/components/admin/types";
import {
  JOB_NO_START, JOB_NO_PREFIX, STATUS_LIST,
  getNewLeadsCutoffMs, isLegacyLead, extractJobNoNumeric, generateJobNos,
  visitStepsFor, INSPECTION_STEPS, JOB_STEPS, INSPECTION_PHASE, JOB_PHASE,
  getRoleStatusOptions, normalizeStatus, esc, fmtDate, fmtDateOnly,
  fmtDateBadge, fmtTimeBadge, getLeadQuoteTotal, getWhatsAppLink,
  getStepActive, getLatestStepIndex, calcResponseTime, isRedundantScope,
  getFollowupPrompt,
} from "@/lib/adminHelpers";
import { ScheduleView } from "@/components/admin/ScheduleView";
import { AnalyticsView } from "@/components/admin/views/AnalyticsView";
import { LeadsView } from "@/components/admin/views/LeadsView";
import { QuotesView } from "@/components/admin/views/QuotesView";
import { JobsView } from "@/components/admin/views/JobsView";
import { CustomersView } from "@/components/admin/views/CustomersView";
import { TeamView } from "@/components/admin/views/TeamView";
import { TechniciansView } from "@/components/admin/views/TechniciansView";
import { CompletedView } from "@/components/admin/views/CompletedView";
import type { Stats } from "@/components/admin/views/AnalyticsView";
import { GpsModal } from "@/components/admin/modals/GpsModal";
import { PhotoLightbox } from "@/components/admin/modals/PhotoLightbox";
import { PhotosModal } from "@/components/admin/modals/PhotosModal";
import { TeamChatModal } from "@/components/admin/modals/TeamChatModal";
import { JobCardModal } from "@/components/admin/modals/JobCardModal";
import { LeadEditModal } from "@/components/admin/modals/LeadEditModal";

// How many rows/cards to show per page in the long list views.
const PAGE_SIZE = 20;


type DashboardView =
  | "dashboard"
  | "analytics"
  | "leads"
  | "quotes"
  | "jobs"
  | "completed"
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

  // On-The-Way / GPS notification state
  const [onTheWayLoading, setOnTheWayLoading] = useState<string | null>(null);
  const [etaToast, setEtaToast] = useState<{ leadId: string; msg: string } | null>(null);
  const [notifyPrompt, setNotifyPrompt] = useState<{ lead: Lead; eventType: "en_route" | "arrived" } | null>(null);
  const [startJobPrompt, setStartJobPrompt] = useState<{ lead: Lead } | null>(null);
  const [startJobDays, setStartJobDays] = useState(1);
  const [staffLocations, setStaffLocations] = useState<any[]>([]);
  const [locationTrackingActive, setLocationTrackingActive] = useState(false);
  const locationWatchRef = useRef<number | null>(null);

  // Live AUS clock — updates every second
  const [liveAusTime, setLiveAusTime] = useState(() =>
    new Date().toLocaleTimeString("en-AU", { timeZone: "Australia/Sydney", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
  );
  const [liveAusDate, setLiveAusDate] = useState(() =>
    new Date().toLocaleDateString("en-AU", { timeZone: "Australia/Sydney", weekday: "short", day: "numeric", month: "short" })
  );
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setLiveAusTime(now.toLocaleTimeString("en-AU", { timeZone: "Australia/Sydney", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
      setLiveAusDate(now.toLocaleDateString("en-AU", { timeZone: "Australia/Sydney", weekday: "short", day: "numeric", month: "short" }));
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

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
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [addressSuggestionsOpen, setAddressSuggestionsOpen] = useState(false);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const [addressDropdownStyle, setAddressDropdownStyle] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  async function fetchAddressSuggestions(input: string) {
    if (input.length < 3) { setAddressSuggestions([]); setAddressSuggestionsOpen(false); return; }
    if (addressInputRef.current) {
      const rect = addressInputRef.current.getBoundingClientRect();
      setAddressDropdownStyle({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
    }
    try {
      const res = await fetch(`/api/admin/address-autocomplete?input=${encodeURIComponent(input)}`);
      const data = await res.json();
      const preds = data.predictions || [];
      setAddressSuggestions(preds);
      setAddressSuggestionsOpen(preds.length > 0);
    } catch { setAddressSuggestions([]); setAddressSuggestionsOpen(false); }
  }

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
  const [convFullscreen, setConvFullscreen] = useState(false);
  const [convPos, setConvPos] = useState<{ x: number; y: number } | null>(null);
  const convModalRef = useRef<HTMLDivElement>(null);
  const convScrollRef = useRef<HTMLDivElement>(null);
  const convDraggingRef = useRef<{ startX: number; startY: number; modalLeft: number; modalTop: number } | null>(null);
  const [isConvScrolledUp, setIsConvScrolledUp] = useState(false);
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

  // Auto-scroll customer conversation to bottom (WhatsApp style)
  const scrollToLatestMessage = useCallback((smooth = true) => {
    if (convScrollRef.current) {
      convScrollRef.current.scrollTo({
        top: convScrollRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  }, []);

  const handleConvScroll = () => {
    if (!convScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = convScrollRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 80;
    setIsConvScrolledUp(isUp);
  };

  const handleConvPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || convFullscreen) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select")) return;

    const modalEl = convModalRef.current;
    if (!modalEl) return;

    const rect = modalEl.getBoundingClientRect();
    convDraggingRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      modalLeft: rect.left,
      modalTop: rect.top,
    };

    if (!convPos) {
      setConvPos({ x: rect.left, y: rect.top });
    }

    const handlePointerMove = (moveEv: PointerEvent) => {
      if (!convDraggingRef.current || !convModalRef.current) return;
      const dx = moveEv.clientX - convDraggingRef.current.startX;
      const dy = moveEv.clientY - convDraggingRef.current.startY;

      const modalRect = convModalRef.current.getBoundingClientRect();
      const rawX = convDraggingRef.current.modalLeft + dx;
      const rawY = convDraggingRef.current.modalTop + dy;

      const maxX = Math.max(10, window.innerWidth - modalRect.width - 10);
      const maxY = Math.max(10, window.innerHeight - 80);
      const clampedX = Math.min(Math.max(10, rawX), maxX);
      const clampedY = Math.min(Math.max(10, rawY), maxY);

      setConvPos({ x: clampedX, y: clampedY });
    };

    const handlePointerUp = () => {
      convDraggingRef.current = null;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  useEffect(() => {
    if (!messagesModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMessagesModalOpen(false);
        setConvFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [messagesModalOpen]);

  useEffect(() => {
    if (messagesModalOpen) {
      const t = setTimeout(() => {
        scrollToLatestMessage(false);
      }, 50);
      return () => clearTimeout(t);
    }
  }, [messagesModalOpen, messageChannel, activeMessageLead?.id, scrollToLatestMessage]);

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
  const [warrantyProvided, setWarrantyProvided] = useState(true);
  const [warrantyLogo, setWarrantyLogo] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [siteLogoUrl, setSiteLogoUrl] = useState("/new_logo.jpeg");
  const [logoSettingsOpen, setLogoSettingsOpen] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => { if (d.logoUrl) setSiteLogoUrl(d.logoUrl); })
      .catch(() => {});
  }, []);

  // Preload the Groutix logo image so the warranty card renders the brand mark.
  useEffect(() => {
    const img = new Image();
    img.onload = () => setWarrantyLogo(img);
    img.src = siteLogoUrl;
  }, [siteLogoUrl]);

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [activeInvoiceLead, setActiveInvoiceLead] = useState<Lead | null>(null);
  // Manager "Client Job Card" workflow modal (full pipeline timeline + advance).
  const [jobCardLead, setJobCardLead] = useState<Lead | null>(null);
  const [invoiceService, setInvoiceService] = useState("");
  const [invoiceDescription, setInvoiceDescription] = useState("");
  const [invoiceExtraWork, setInvoiceExtraWork] = useState("");
  const [invoiceExtraCharge, setInvoiceExtraCharge] = useState<number>(0);
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

  // Fetch dynamic email templates (persisted in DB or localStorage)
  const fetchTemplates = useCallback(async () => {
    const sanitizeTpls = (list: any[]) =>
      list.map((t) => ({
        ...t,
        subject: (t.subject || "")
          .replace(/1300\s*476\s*884/gi, "7023 8094")
          .replace(/\(03\)\s*7023\s*8094/gi, "7023 8094")
          .replace(/groutix\.com\.au/gi, "groutix.com"),
        body: (t.body || "")
          .replace(
            /📞\s*(?:1300\s*476\s*884|\(03\)\s*7023\s*8094|7023\s*8094)\s*\|\s*✉️\s*info@groutix\.com(?:\.au)?/gi,
            "📞 7023 8094\n✉️ info@groutix.com"
          )
          .replace(/1300\s*476\s*884/gi, "7023 8094")
          .replace(/\(03\)\s*7023\s*8094/gi, "7023 8094")
          .replace(/groutix\.com\.au/gi, "groutix.com"),
      }));

    try {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("gx_email_templates");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const cleaned = sanitizeTpls(parsed);
              setEmailTemplates(cleaned);
              localStorage.setItem("gx_email_templates", JSON.stringify(cleaned));
            }
          } catch {}
        }
      }
      const res = await fetch("/api/admin/email-templates");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.templates) && data.templates.length > 0) {
          const cleaned = sanitizeTpls(data.templates);
          setEmailTemplates(cleaned);
          if (typeof window !== "undefined") {
            localStorage.setItem("gx_email_templates", JSON.stringify(cleaned));
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

  // ── On-The-Way / GPS handlers ─────────────────────────────────────────────

  async function handleOnTheWay(lead: Lead, eventType: "en_route" | "arrived") {
    // 1. Update status immediately (optimistic)
    const newStatus =
      eventType === "en_route"
        ? lead.status?.startsWith("Inspection")
          ? "Inspection En Route"
          : "Job En Route"
        : lead.status?.startsWith("Inspection")
          ? "Inspection Arrived"
          : "Job Arrived";
    await updateLeadField(lead.id, { status: newStatus });

    // 2. Ask staff whether to notify the customer
    setNotifyPrompt({ lead, eventType });
  }

  async function executeOnTheWayNotification(lead: Lead, eventType: "en_route" | "arrived") {
    setNotifyPrompt(null);

    // Get GPS location and send notification
    if (!navigator.geolocation) {
      setEtaToast({ leadId: lead.id, msg: "Location not available — notification sent without ETA." });
      fetch("/api/admin/on-the-way", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, lat: null, lng: null, eventType }),
      }).catch(() => {});
      setTimeout(() => setEtaToast(null), 5000);
      return;
    }

    setOnTheWayLoading(lead.id);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch("/api/admin/on-the-way", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leadId: lead.id, lat, lng, eventType }),
          });
          const data = await res.json();
          setEtaToast({
            leadId: lead.id,
            msg:
              eventType === "en_route"
                ? `Customer notified! ETA: ~${data.eta || "unknown"}`
                : `Customer notified of your arrival!`,
          });
          fetch("/api/admin/staff/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lng, leadId: lead.id }),
          }).catch(() => {});
        } catch {
          setEtaToast({ leadId: lead.id, msg: "Notification sent (no ETA)." });
        } finally {
          setOnTheWayLoading(null);
          setTimeout(() => setEtaToast(null), 6000);
        }
      },
      () => {
        setOnTheWayLoading(null);
        setEtaToast({
          leadId: lead.id,
          msg: "Location denied — customer still notified without ETA.",
        });
        fetch("/api/admin/on-the-way", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: lead.id, lat: null, lng: null, eventType }),
        }).catch(() => {});
        setTimeout(() => setEtaToast(null), 5000);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }

  // Auto-share location for inspector/technician roles while dashboard is open
  useEffect(() => {
    if (role !== "inspection" && role !== "technician") return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetch("/api/admin/staff/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }),
          }).catch(() => {});
          setLocationTrackingActive(true);
        },
        () => setLocationTrackingActive(false),
        { timeout: 8000, maximumAge: 30000 }
      );
    };

    sendLocation();
    const id = setInterval(sendLocation, 60000);
    return () => clearInterval(id);
  }, [role]);

  // Load staff locations every 30s (managers/super_admin only)
  const loadStaffLocations = useCallback(async () => {
    if (role !== "manager" && role !== "super_admin") return;
    try {
      const res = await fetch("/api/admin/staff/location", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStaffLocations(data.locations || []);
      }
    } catch {
      // non-fatal
    }
  }, [role]);

  useEffect(() => {
    loadStaffLocations();
    const id = setInterval(loadStaffLocations, 30000);
    return () => clearInterval(id);
  }, [loadStaffLocations]);

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
          // Prefer the staff account id (MongoDB _id) so the login filter
          // (staff.find(s => s.username === username)?.id) matches technicianId.
          const oldKey = Array.from(map.entries()).find(([, v]) => v === existing)?.[0];
          if (oldKey && oldKey !== s.id) {
            map.delete(oldKey);
            map.set(s.id, existing);
          }
          existing.id = s.id;
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
      `Please let us know if you would like to proceed with the booking.\n\nRegards,\nGroutix Team\n📞 7023 8094\n✉️ info@groutix.com\n🌐 www.groutix.com`
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
    setTimeout(() => {
      scrollToLatestMessage(false);
    }, 60);
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
      setTimeout(() => {
        scrollToLatestMessage(true);
      }, 60);
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
      setEtaToast({ leadId: activeMessageLead.id, msg: "No phone number on file for this customer." });
      setTimeout(() => setEtaToast(null), 4000);
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
        setEtaToast({ leadId: activeMessageLead.id, msg: data.error || "Failed to send SMS." });
        setTimeout(() => setEtaToast(null), 4000);
        return;
      }

      const currentMsgs = getConversation(activeMessageLead);
      const updated = [...currentMsgs, data.message];

      setActiveMessageLead((prev) => (prev ? { ...prev, messages: updated } : prev));
      setLeads((prev) => prev.map((l) => (l.id === activeMessageLead.id ? { ...l, messages: updated } : l)));
      setSmsText("");
      setEtaToast({ leadId: activeMessageLead.id, msg: "SMS sent." });
      setTimeout(() => setEtaToast(null), 3000);
      setTimeout(() => {
        scrollToLatestMessage(true);
      }, 60);
    } catch (err) {
      console.error(err);
      setEtaToast({ leadId: activeMessageLead.id, msg: "Failed to send SMS. Check server logs." });
      setTimeout(() => setEtaToast(null), 4000);
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
    setLeads((prev) => prev.map((l) => (l.id === activeMessageLead.id ? { ...l, messages: updated } : l)));
    setTimeout(() => {
      scrollToLatestMessage(true);
    }, 60);
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

    const isProvided = lead.warrantyProvided !== false && lead.warranty?.provided !== false;
    setWarrantyProvided(isProvided);
    setWarrantyJobNo(lead.jobNo || lead.warranty?.jobNo || `Job No-${lead.id.slice(-6).toUpperCase()}`);
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
            provided: true,
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
    setInvoiceExtraWork("");
    setInvoiceExtraCharge(0);
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
          extraWork: invoiceExtraWork,
          extraCharge: invoiceExtraCharge,
          price: invoicePrice + invoiceExtraCharge,
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



  // Role queue: non-managers only see the leads whose current stage their role
  // owns. Managers see the whole book. Legacy leads are hidden by default
  // unless the manager explicitly toggles showLegacyLeads.
  const scopedLeads = useMemo(() => {
    const roleScoped =
      role === "manager" || role === "super_admin"
        ? leads
        : leads.filter((l) => {
            if (role === "technician") {
              const targetStaffRecord = viewAs
                ? staff.find((s) => s.name === viewAs.name || s.username === viewAs.name)
                : staff.find((s) => s.username === username);
              const targetName = viewAs
                ? viewAs.name.trim().toLowerCase()
                : (targetStaffRecord?.name || username || "").trim().toLowerCase();
              const targetUser = viewAs ? viewAs.name.trim().toLowerCase() : (username || "").trim().toLowerCase();
              const targetId = targetStaffRecord?.id;
              // Collect all known IDs for this tech (staff id + any roster entries sharing the same name/username)
              const targetAllIds = new Set<string>(targetId ? [targetId] : []);
              assignableTechnicians.forEach((t) => {
                if (t.username && (t.username.toLowerCase() === targetUser || t.username.toLowerCase() === targetName)) targetAllIds.add(t.id);
                if (t.name.trim().toLowerCase() === targetName || t.name.trim().toLowerCase() === targetUser) targetAllIds.add(t.id);
              });

              const isAssigned =
                Boolean(l.technicianUsername && targetUser && l.technicianUsername.toLowerCase() === targetUser) ||
                Boolean(l.technicianId && targetAllIds.has(l.technicianId)) ||
                Boolean(l.technicianId && (l.technicianId.toLowerCase() === targetUser || l.technicianId.toLowerCase() === targetName)) ||
                Boolean(l.technician && (l.technician.trim().toLowerCase() === targetName || l.technician.trim().toLowerCase() === targetUser)) ||
                Boolean(targetId && l.inspectorId === targetId) ||
                Boolean(l.assigned && l.assigned.trim().toLowerCase() !== "unassigned" && (l.assigned.trim().toLowerCase() === targetName || l.assigned.trim().toLowerCase() === targetUser));

              if (!isAssigned) return false;
              return inRoleQueue(role, l.status) || isFlowInProgress(role, l.status, l) || isFlowCompleted(role, l.status, l);
            }
            if (role === "inspection" || role === "field") {
              const targetStaff = viewAs
                ? staff.find((s) => s.name === viewAs.name || s.username === viewAs.name)
                : staff.find((s) => s.username === username);
              const targetId = targetStaff?.id;
              const targetName = (targetStaff?.name || (viewAs ? viewAs.name : username) || "").trim().toLowerCase();
              const targetUser = (viewAs ? viewAs.name : username || "").trim().toLowerCase();

              const isAssigned =
                Boolean(targetId && l.inspectorId === targetId) ||
                Boolean(targetId && l.technicianId === targetId) ||
                Boolean(l.assigned && l.assigned.trim().toLowerCase() !== "unassigned" && (l.assigned.trim().toLowerCase() === targetName || l.assigned.trim().toLowerCase() === targetUser));

              if (!isAssigned) return false;
              return inRoleQueue(role, l.status) || isFlowInProgress(role, l.status, l) || isFlowCompleted(role, l.status, l);
            }
            if (!inRoleQueue(role, l.status) && !isFlowInProgress(role, l.status, l) && !isFlowCompleted(role, l.status, l)) return false;
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
      list = list.filter((l) => {
        if (wanted.includes("Inspection Completed") && (role === "inspection" || role === "field")) {
          return isFlowCompleted(role, l.status, l);
        }
        return wanted.includes(l.status);
      });
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
          icon: siteLogoUrl,
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
      filteredLeads.filter((l) => {
        if (role === "technician") {
          // If a status filter is specifically applied (e.g. from pill/filter), allow it
          if (statusFilter) {
            return TECHNICIAN_STATUSES.includes(l.status) || isFlowCompleted(role, l.status, l);
          }
          // Default: only active in-progress jobs show on the technician dashboard
          return isFlowInProgress(role, l.status, l);
        }
        if (role === "inspection" || role === "field") {
          if (statusFilter) {
            return INSPECTION_STATUSES.includes(l.status) || isFlowCompleted(role, l.status, l);
          }
          // Default: only active in-progress inspections show on the inspection dashboard
          return isFlowInProgress(role, l.status, l);
        }
        if (role === "finance") {
          if (statusFilter) return FINANCE_STATUSES.includes(l.status);
          return isFlowInProgress(role, l.status, l);
        }
        if (role === "intake") return INTAKE_STATUSES.includes(l.status);
        return JOB_STATUSES.includes(l.status);
      }),
    [filteredLeads, role, statusFilter]
  );

  const completedLeads = useMemo(
    () =>
      filteredLeads.filter((l) => {
        if (role === "technician" || role === "inspection" || role === "field") {
          return isFlowCompleted(role, l.status, l);
        }
        return isFlowCompleted(role, l.status, l) || l.status === "Job Done" || l.status === "Completed" || l.status === "Inspection Completed";
      }),
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
            : currentView === "completed"
              ? completedLeads.length
              : currentView === "customers"
                ? scopedLeads.length
                : 0;
    const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (page > maxPage) setPage(maxPage);
  }, [currentView, page, filteredLeads.length, quoteLeads.length, jobLeads.length, completedLeads.length, scopedLeads.length]);

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

  // ── Context value object ─────────────────────────────────────────────────────
  const pageCtx = {
    // Identity
    role, username,
    // Core data
    staff, assignableTechnicians, inspectionStaff, scopedLeads, counts,
    // Row UI state
    onTheWayLoading, openDetails, setOpenDetails, unreadReplyCount,
    // Lead CRUD
    updateLeadField, handleDeleteLead, setEditingLead, setLeadModalOpen,
    setStartJobPrompt, setStartJobDays,
    statusFilter, setStatusFilter, setPage,
    // Communication
    callCustomer, openMessagesModal,
    // Modal openers
    openGpsModal, openInspectionModal, openPhotosModal,
    openQuoteModal, openWarrantyModal, openInvoiceModal,
    // On-the-way
    handleOnTheWay,
    // Assignee helpers
    rowAssigneeOptions, isTechnicianName,
    // Navigation
    setCurrentView, openLeadsFiltered, openInbox, startNewLead,
    // Manager dashboard extras
    staffLocations, leads, loading, filteredLeads,
    // Shared view state
    page, globalSearch, setGlobalSearch, quoteLeads, jobLeads, completedLeads,
    onlyUnread, setOnlyUnread, setPriorityFilter,
  };


  return (
    <AdminPageProvider value={pageCtx}>
    <div className="flex h-screen overflow-hidden bg-[#f5f7fb] text-[#14213d]">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-[#e4e9f1] p-4 flex flex-col justify-between shrink-0 h-screen overflow-y-auto sticky top-0">
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
                    ? scopedLeads.filter((l) => isFlowInProgress(role, l.status, l)).length
                    : role === "intake"
                      ? scopedLeads.filter((l) => INTAKE_STATUSES.includes(l.status)).length
                      : role === "technician"
                        ? scopedLeads.filter((l) => isFlowInProgress(role, l.status, l)).length
                        : role === "inspection" || role === "field"
                          ? scopedLeads.filter((l) => isFlowInProgress(role, l.status, l)).length
                          : scopedLeads.filter((l) => isFlowInProgress(role, l.status, l)).length}
                </span>
              </button>
            )}

            {canSee("completed") && (
              <button
                onClick={() => setCurrentView("completed")}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${currentView === "completed"
                    ? "bg-[#001f97] text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100"
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Completed
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${currentView === "completed" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                >
                  {scopedLeads.filter((l) => isFlowCompleted(role, l.status, l)).length}
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

            {role === "manager" && (
              <div className="pt-3 mt-3 border-t border-[#e4e9f1] flex flex-col gap-1.5">
                <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Settings</p>
                <button
                  onClick={() => setLogoSettingsOpen(true)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 text-left"
                >
                  <Settings className="w-4 h-4" />
                  Logo Settings
                </button>
              </div>
            )}
          </nav>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
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
                        : currentView === "completed"
                          ? "Completed Records Archive"
                          : currentView === "customers"
                            ? "Customer Directory"
                            : currentView === "schedule"
                              ? "Schedule & Calendar"
                              : currentView === "technicians"
                                ? "Field Technicians"
                                : "Team Members"}
            </h1>
          </div>

          {/* Live AUS Time */}
          <div className="hidden md:flex flex-col items-center px-3 py-1 rounded-xl bg-[#001f97]/5 border border-[#001f97]/10 min-w-[100px]">
            <span className="text-[13px] font-black text-[#001f97] tabular-nums tracking-tight leading-tight">{liveAusTime}</span>
            <span className="text-[10px] font-semibold text-slate-400 leading-tight">{liveAusDate} · AEST</span>
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


            {/* Unread customer replies bell — hidden for inspection & technician */}
            {role !== "inspection" && role !== "field" && role !== "technician" && (
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
            )}

            {/* Refresh Button */}
            <button
              onClick={() => loadData()}
              title="Refresh database records"
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin text-[#001f97]" : ""}`} />
            </button>

            {/* Sync Emails Button — hidden for inspection & technician */}
            {role !== "inspection" && role !== "field" && role !== "technician" && (
              <button
                onClick={handleSyncEmails}
                disabled={syncingEmails}
                title="Sync Inbox"
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <Mail className={`w-4 h-4 ${syncingEmails ? "animate-pulse" : ""}`} />
                Sync Inbox
              </button>
            )}

            {/* Add Lead Button — manager only */}
            {(role === "manager" || role === "super_admin") && (
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
            )}

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

            {/* Location sharing indicator (inspector / technician only) */}
            {(role === "inspection" || role === "technician") && (
              <div
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
                  locationTrackingActive
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    locationTrackingActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                  }`}
                />
                {locationTrackingActive ? "Location sharing active" : "Location sharing off"}
              </div>
            )}
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
          {/* =========================================================================
              VIEW: ANALYTICS OVERVIEW
             ========================================================================= */}
          {currentView === "analytics" && (
            <AnalyticsView
              analyticsDays={analyticsDays}
              setAnalyticsDays={setAnalyticsDays}
              loadAnalytics={loadAnalytics}
              loadingStats={loadingStats}
              stats={stats}
            />
          )}

          {/* =========================================================================
              VIEW: CRM DASHBOARD
             ========================================================================= */}
          {currentView === "dashboard" && <ManagerDashboard />}

          {/* =========================================================================
          {/* =========================================================================
              VIEW: LEADS
             ========================================================================= */}
          {currentView === "leads" && <LeadsView />}

          {/* =========================================================================
              VIEW: QUOTES
             ========================================================================= */}
          {currentView === "quotes" && <QuotesView />}

          {/* =========================================================================
              VIEW: JOBS / BOOKINGS
             ========================================================================= */}
          {currentView === "jobs" && <JobsView />}

          {/* =========================================================================
              VIEW: COMPLETED RECORDS ARCHIVE
             ========================================================================= */}
          {currentView === "completed" && <CompletedView />}

          {/* =========================================================================
              VIEW: CUSTOMERS
             ========================================================================= */}
          {currentView === "customers" && <CustomersView />}

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
          {/* =========================================================================
              VIEW: TEAM
             ========================================================================= */}
          {currentView === "team" && (
            <TeamView
              isManager={isManager}
              basePath={basePath}
              openAsRole={openAsRole}
              openChat={openChat}
              handleDeleteStaff={handleDeleteStaff}
              deletingStaffId={deletingStaffId}
              unread={unread}
            />
          )}

          {/* =========================================================================
              VIEW: TECHNICIANS (Field roster — add + dispatch)
             ========================================================================= */}
          {currentView === "technicians" && (
            <TechniciansView
              basePath={basePath}
              techName={techName}
              setTechName={setTechName}
              techEmail={techEmail}
              setTechEmail={setTechEmail}
              handleAddTechnician={handleAddTechnician}
              techBusy={techBusy}
              techError={techError}
              deletingTechId={deletingTechId}
              handleDeleteTechnician={handleDeleteTechnician}
            />
          )}
        </div>
      </main>

      {/* =========================================================================
          MODAL: ADD / EDIT LEAD
         ========================================================================= */}
      {leadModalOpen && (
        <LeadEditModal
          editingLead={editingLead}
          setEditingLead={setEditingLead}
          setLeadModalOpen={setLeadModalOpen}
          handleSaveLead={handleSaveLead}
          addressInputRef={addressInputRef}
          addressDebounceRef={addressDebounceRef}
          fetchAddressSuggestions={fetchAddressSuggestions}
          addressSuggestions={addressSuggestions}
          setAddressSuggestionsOpen={setAddressSuggestionsOpen}
          setAddressDropdownStyle={setAddressDropdownStyle}
          role={role}
          isTechnician={isTechnician}
          isTechnicianName={isTechnicianName}
          assigneeOptions={assigneeOptions}
          logCall={logCall}
        />
      )}

      {/* =========================================================================
          MODAL: QUOTE BUILDER & DOCUMENT PREVIEW
         ========================================================================= */}
      {quoteModalOpen && activeQuoteLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 sm:pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full p-6 space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">{isTechnician ? "Create Scope of Work" : "Create & Send Groutix Quotation"}</h2>
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
                          {!isTechnician && (
                            <>
                              <th className="py-2 px-2 font-bold text-right">Price ex GST</th>
                              <th className="py-2 px-2 font-bold text-right">Total ex GST</th>
                            </>
                          )}
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
                                    const normalizedScope = (t.scope || "")
                                      .split("\n")
                                      .map((line) => line.replace(/^o\s+/, "• "))
                                      .join("\n");
                                    updated[idx] = {
                                      ...updated[idx],
                                      templateNo: t.no,
                                      code: t.code,
                                      service: t.service,
                                      scope: normalizedScope,
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
                                rows={Math.max(4, (item.scope || "").split("\n").length + 1)}
                                value={item.scope || ""}
                                onChange={(e) => {
                                  const updated = [...quoteItems];
                                  updated[idx].scope = e.target.value
                                    .split("\n")
                                    .map((line) => line.replace(/^o\s+/, "• "))
                                    .join("\n");
                                  setQuoteItems(updated);
                                }}
                                className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-[11px] leading-relaxed text-slate-600"
                                placeholder="Detailed scope of works (one bullet per line)..."
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
                            {!isTechnician && (
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.price || ""}
                                  onChange={(e) => {
                                    const updated = [...quoteItems];
                                    updated[idx].price = parseFloat(e.target.value) || 0;
                                    setQuoteItems(updated);
                                  }}
                                  className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold text-xs text-right"
                                />
                              </td>
                            )}

                            {/* Total ex GST */}
                            {!isTechnician && (
                              <td className="py-2 px-2 text-right font-bold text-slate-900 whitespace-nowrap">
                                ${(Number(item.price || 0) * Number(item.qty || 1)).toFixed(2)}
                              </td>
                            )}

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
                {!isTechnician && (
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
                )}

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
                      src={siteLogoUrl}
                      alt="Groutix"
                      className="h-11 w-auto object-contain"
                    />
                  </div>
                  <div className="text-right text-[10.5px] leading-tight text-slate-700 space-y-0.5">
                    <div>Melbourne</div>
                    <div>VIC</div>
                    <div>7023 8094</div>
                    <div>info@groutix.com</div>
                    <div className="pt-2 font-bold text-base text-[#d4af37]">Quote</div>
                    <div className="font-bold text-slate-900">ACN: 687 415 005</div>
                    <div className="pt-1.5 text-slate-900">Quote # {activeQuoteLead.jobNo || `JOBNO-${activeQuoteLead.id.slice(-6).toUpperCase()}`}</div>
                    <div className="text-slate-600">{new Date().toLocaleDateString("en-AU", { timeZone: "Australia/Sydney", day: "2-digit", month: "short", year: "numeric" })}</div>
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
                      {!isTechnician && (
                        <>
                          <th className="py-2 px-2.5 text-right">UNIT PRICE</th>
                          <th className="py-2 px-2.5 text-right">TOTAL PRICE</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {quoteItems.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-2.5">
                          {item.code && <div className="text-[9px] font-bold text-blue-700">{item.code}</div>}
                          <div className="font-bold text-slate-900 text-xs">{item.service}</div>
                          {item.scope && !isRedundantScope(item.service, item.scope) && (
                            <ul className="mt-1 space-y-0.5">
                              {item.scope.split("\n").filter(l => l.trim()).map((line, li) => {
                                const clean = line.replace(/^[•o]\s*/, "").trim();
                                return (
                                  <li key={li} className="flex items-start gap-1 text-[10px] text-slate-600 leading-snug">
                                    <span className="shrink-0 text-[#001f97] font-bold mt-px">•</span>
                                    <span>{clean}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </td>
                        <td className="py-2.5 px-2.5 text-right">{item.qty || 1}</td>
                        {!isTechnician && (
                          <>
                            <td className="py-2.5 px-2.5 text-right">${Number(item.price || 0).toFixed(2)}</td>
                            <td className="py-2.5 px-2.5 text-right font-bold">
                              ${(Number(item.price || 0) * Number(item.qty || 1)).toFixed(2)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 5. Totals */}
                {!isTechnician && (
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
                )}

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
              {!isTechnician && (
                <>
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
                </>
              )}
              <button
                type="button"
                onClick={handleSaveQuote}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900"
              >
                {isTechnician ? "Save Scope" : "Save Quote"}
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

      {/* Address autocomplete dropdown — rendered outside any overflow container */}
      {addressSuggestionsOpen && addressSuggestions.length > 0 && (
        <ul
          className="fixed z-[9999] bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto text-sm"
          style={{ top: addressDropdownStyle.top + 4, left: addressDropdownStyle.left, width: addressDropdownStyle.width }}
        >
          {addressSuggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={(e) => { e.preventDefault(); setEditingLead((prev) => prev ? { ...prev, address: s } : prev); setAddressSuggestionsOpen(false); setAddressSuggestions([]); }}
              className="px-3 py-2.5 cursor-pointer hover:bg-blue-50 hover:text-[#001f97] text-slate-700 border-b border-slate-100 last:border-0"
            >
              {s}
            </li>
          ))}
        </ul>
      )}

      {/* =========================================================================
          MODAL: CUSTOMER PHOTOS
         ========================================================================= */}
      {photosModalOpen && activePhotoLead && (
        <PhotosModal
          lead={activePhotoLead}
          uploadingPhotos={uploadingPhotos}
          loadingPhotos={loadingPhotos}
          deletingPhotoIndex={deletingPhotoIndex}
          onClose={() => setPhotosModalOpen(false)}
          onAddPhotos={handleAddPhotos}
          onDeletePhoto={handleDeletePhoto}
          onPreviewPhoto={setPreviewPhoto}
        />
      )}
      {/* =========================================================================
      {/* =========================================================================
          MODAL: FULLSCREEN PHOTO LIGHTBOX PREVIEW
         ========================================================================= */}
      {previewPhoto && (
        <PhotoLightbox photo={previewPhoto} onClose={() => setPreviewPhoto(null)} />
      )}

      {/* =========================================================================
          MODAL: CUSTOMER CONVERSATION (MESSAGES)
         ========================================================================= */}
      {messagesModalOpen && activeMessageLead && (
        <div
          className={`fixed inset-0 z-50 pointer-events-none bg-slate-900/25 backdrop-blur-[0.5px] ${
            convFullscreen ? "p-0" : !convPos ? "flex items-center justify-center p-4" : ""
          }`}
        >
          <div
            ref={convModalRef}
            className={`bg-white pointer-events-auto flex flex-col gap-4 shadow-2xl border border-slate-200 transition-[border-radius,box-shadow] duration-150 ${
              convFullscreen
                ? "w-full h-full rounded-none shadow-none p-6"
                : "rounded-2xl w-full max-w-5xl p-6 resize overflow-auto"
            }`}
            style={
              convFullscreen
                ? { position: "fixed", inset: 0, width: "100vw", height: "100vh", margin: 0 }
                : convPos
                ? {
                    position: "fixed",
                    left: `${convPos.x}px`,
                    top: `${convPos.y}px`,
                    margin: 0,
                    height: "90vh",
                    minHeight: "500px",
                    minWidth: "400px",
                    maxWidth: "min(96vw, 1024px)",
                  }
                : { height: "90vh", minHeight: "500px", minWidth: "400px", maxWidth: "min(96vw, 1024px)" }
            }
          >
            {/* Header: Draggable handle */}
            <div
              onPointerDown={handleConvPointerDown}
              onDoubleClick={() => setConvPos(null)}
              className={`flex items-center justify-between border-b border-slate-100 pb-3 shrink-0 select-none ${
                convFullscreen
                  ? ""
                  : "cursor-grab active:cursor-grabbing hover:bg-slate-50/70 -m-2 p-2 rounded-xl transition-colors"
              }`}
              title={convFullscreen ? undefined : "Drag to move window anywhere on screen • Double-click to center"}
            >
              <div className="flex items-center gap-2.5">
                {!convFullscreen && (
                  <div className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Drag to move">
                    <GripHorizontal className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>Customer Conversation</span>
                    {!convFullscreen && (
                      <span className="text-[10px] font-medium text-slate-400 hidden sm:inline">
                        (Movable window)
                      </span>
                    )}
                  </h2>
                  <div className="text-xs text-slate-500">
                    {activeMessageLeadLive?.name} • {activeMessageLeadLive?.phone || "No phone"} • {activeMessageLeadLive?.email || "No email"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {convPos && !convFullscreen && (
                  <button
                    type="button"
                    onClick={() => setConvPos(null)}
                    title="Center window on screen"
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Center</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setConvFullscreen((f) => !f)}
                  title={convFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  {convFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => { setMessagesModalOpen(false); setConvFullscreen(false); }}
                  title="Close conversation (Esc)"
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conversation Messages Box — filtered by active tab with WhatsApp-style scroll */}
            <div className="relative flex flex-col shrink-0" style={{ minHeight: "240px" }}>
              <div
                ref={convScrollRef}
                onScroll={handleConvScroll}
                className="overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                style={{ flex: "0 0 auto", minHeight: "240px", height: "clamp(240px, 38vh, 480px)" }}
              >
                {getConversation(activeMessageLeadLive || activeMessageLead)
                  .filter((msg) =>
                    messageChannel === "sms"
                      ? msg.channel === "sms"
                      : msg.channel !== "sms"
                  )
                  .map((msg) => {
                  const isCustomer = msg.from === "customer";
                  return (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-2xl max-w-[96%] text-xs shadow-xs space-y-1 ${isCustomer
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

              {/* WhatsApp-style floating "Latest messages" jump button */}
              {isConvScrolledUp && (
                <button
                  type="button"
                  onClick={() => scrollToLatestMessage(true)}
                  className="absolute bottom-3 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-[#001f97] text-white text-xs font-bold rounded-full shadow-lg hover:bg-[#001777] transition-all animate-bounce cursor-pointer z-20"
                  title="Jump to latest conversation"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>Latest messages</span>
                </button>
              )}
            </div>

            {/* Reply Composer */}
            <div className="space-y-3 pt-2 border-t border-slate-200 flex-1 min-h-0 overflow-y-auto">
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
                      className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 leading-relaxed font-sans resize-y min-h-[80px]"
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

              {/* Quick Action: Send Inspection Booking Link */}
              <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded-xl">
                <span className="text-[11px] font-bold text-slate-600 shrink-0">Quick Send:</span>
                <button
                  type="button"
                  onClick={async () => {
                    const lead = activeMessageLeadLive || activeMessageLead;
                    if (!lead?.id) return;
                    try {
                      const res = await fetch(`/api/admin/booking-link/${lead.id}`);
                      const data = await res.json();
                      if (data.inspectionUrl) {
                        const firstName = (lead.name || "there").trim().split(/\s+/)[0];
                        setReplySubject(`Book Your Free Groutix Inspection — ${lead.name || "Customer"}`);
                        setReplyText(`Hi ${firstName},\n\nThank you for your enquiry with Groutix!\n\nTo book your FREE inspection, please click the link below and choose a time that suits you:\n\n${data.inspectionUrl}\n\nIf you have any questions, feel free to reply to this email or call us on 7023 8094.\n\nKind regards,\nGroutix Team\n📞 7023 8094\n✉️ info@groutix.com\n🌐 www.groutix.com`);
                      }
                    } catch { /* silently fail */ }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#001f97] text-white text-[11px] font-bold rounded-lg hover:bg-[#001777] transition cursor-pointer"
                >
                  <CalendarDays className="w-3 h-3" />
                  <span>Inspection Booking</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const lead = activeMessageLeadLive || activeMessageLead;
                    if (!lead?.id) return;
                    try {
                      const res = await fetch(`/api/admin/booking-link/${lead.id}`);
                      const data = await res.json();
                      if (data.jobUrl) {
                        const firstName = (lead.name || "there").trim().split(/\s+/)[0];
                        setReplySubject(`Confirm Your Job Booking — ${lead.name || "Customer"}`);
                        setReplyText(`Hi ${firstName},\n\nGreat news! Your Groutix job is ready to be scheduled.\n\nTo confirm your booking date and time, please click the link below:\n\n${data.jobUrl}\n\nIf you have any questions, feel free to reply to this email or call us on 7023 8094.\n\nKind regards,\nGroutix Team\n📞 7023 8094\n✉️ info@groutix.com\n🌐 www.groutix.com`);
                      }
                    } catch { /* silently fail */ }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-[11px] font-bold rounded-lg hover:bg-violet-700 transition cursor-pointer"
                >
                  <Wrench className="w-3 h-3" />
                  <span>Job Booking</span>
                </button>
              </div>

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

              {/* Email Body */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Email Message:</label>
                <textarea
                  rows={6}
                  placeholder="Type your email message or pick a template from the dropdown above..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001f97]/20 focus:border-[#001f97] leading-relaxed font-sans resize-y min-h-[100px]"
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
      {/* =========================================================================
          MODAL: INSPECTION GPS
         ========================================================================= */}
      {gpsModalOpen && activeGpsLead && (
        <GpsModal
          lead={activeGpsLead}
          statusMessage={gpsStatusMessage}
          onClose={() => setGpsModalOpen(false)}
          onCapture={handleCaptureGps}
        />
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

            {/* Warranty ON / OFF Slider Switch */}
            <div className={`p-4 rounded-xl border transition-all ${
              warrantyProvided
                ? "bg-emerald-50/80 border-emerald-300 shadow-2xs"
                : "bg-rose-50/90 border-rose-300 shadow-2xs"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    warrantyProvided ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}>
                    {warrantyProvided ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : (
                      <ShieldAlert className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-slate-900">
                        10-Year Waterproof Warranty:
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide ${
                        warrantyProvided
                          ? "bg-emerald-600 text-white"
                          : "bg-rose-600 text-white"
                      }`}>
                        {warrantyProvided ? "Warranty Provided (ON)" : "Warranty Not Provided (OFF)"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {warrantyProvided
                        ? "Warranty is active for this inquiry. Official certificate will be generated and marked 'Warranty Provided'."
                        : "Warranty is turned OFF. Groutix is NOT providing warranty for this job. Marked as 'Warranty Not Provided'."}
                    </div>
                  </div>
                </div>

                {/* Interactive Slider Switch */}
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center bg-white/80 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className={`text-xs font-bold transition-colors ${!warrantyProvided ? "text-rose-700 font-black" : "text-slate-400"}`}>
                    OFF
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={warrantyProvided}
                    onClick={() => {
                      const nextVal = !warrantyProvided;
                      setWarrantyProvided(nextVal);
                      if (activeWarrantyLead) {
                        updateLeadField(activeWarrantyLead.id, {
                          warrantyProvided: nextVal,
                          warranty: {
                            ...(activeWarrantyLead.warranty || {}),
                            provided: nextVal,
                          },
                        });
                        setActiveWarrantyLead({
                          ...activeWarrantyLead,
                          warrantyProvided: nextVal,
                          warranty: {
                            ...(activeWarrantyLead.warranty || {}),
                            provided: nextVal,
                          },
                        });
                      }
                    }}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#001f97] focus:ring-offset-2 ${
                      warrantyProvided ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                    title={warrantyProvided ? "Click slider to Turn OFF Warranty" : "Click slider to Turn ON Warranty"}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                        warrantyProvided ? "translate-x-8" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-bold transition-colors ${warrantyProvided ? "text-emerald-700 font-black" : "text-slate-400"}`}>
                    ON
                  </span>
                </div>
              </div>
            </div>

            {/* When Warranty is turned OFF */}
            {!warrantyProvided ? (
              <div className="p-5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rose-100 rounded-lg shrink-0 text-rose-700 mt-0.5">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-rose-900">Warranty Coverage Disabled For This Inquiry</h3>
                    <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                      You have set this query to <strong>Warranty Not Provided</strong>. No 10-year waterproof warranty certificate will be emailed to the customer. When completed, this query will be explicitly stamped with <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-rose-200 text-rose-900 font-black text-[10px]">⚠️ Warranty Not Provided</span> across all reports, client cards, and achievements.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-rose-200">
                  <div className="text-xs text-rose-600 font-medium">
                    To re-enable warranty, click the slider switch above to <strong>ON</strong>.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setWarrantyModalOpen(false)}
                      className="px-4 py-2 border border-slate-300 bg-white rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeWarrantyLead) {
                          updateLeadField(activeWarrantyLead.id, {
                            warrantyProvided: false,
                            warranty: {
                              ...(activeWarrantyLead.warranty || {}),
                              provided: false,
                            },
                          });
                        }
                        setWarrantyModalOpen(false);
                      }}
                      className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer"
                    >
                      Save &amp; Confirm (Warranty Not Provided)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
      {/* =========================================================================
          MODAL: CLIENT JOB CARD (Manager workflow)
         ========================================================================= */}
      {jobCardLead && (
        <JobCardModal lead={jobCardLead} onClose={() => setJobCardLead(null)} />
      )}
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
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <label className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">Extra / Add-On Work (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Additional silicone replacement in second bathroom"
                    value={invoiceExtraWork}
                    onChange={(e) => setInvoiceExtraWork(e.target.value)}
                    className="w-full p-2 border border-amber-200 rounded-lg text-xs bg-white"
                  />
                  <div className="flex items-center gap-2">
                    <label className="font-bold text-slate-600 text-xs whitespace-nowrap">Extra Charge ($):</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      value={invoiceExtraCharge || ""}
                      onChange={(e) => setInvoiceExtraCharge(parseFloat(e.target.value) || 0)}
                      className="w-24 p-2 border border-amber-200 rounded-lg text-xs font-bold bg-white"
                    />
                    {invoiceExtraCharge > 0 && (
                      <span className="text-xs text-amber-700 font-semibold">
                        New total: ${(invoicePrice + invoiceExtraCharge).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Total (incl GST)</label>
                    <input
                      type="number"
                      value={invoicePrice || ""}
                      placeholder="0.00"
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
                    <img src={siteLogoUrl} alt="Groutix" className="h-10 object-contain" />
                  </div>
                  <div className="text-right text-[10px] leading-tight text-slate-700 space-y-0.5">
                    <div>Melbourne</div>
                    <div>VIC</div>
                    <div>7023 8094</div>
                    <div>info@groutix.com</div>
                    <div className="pt-2 font-bold text-base text-[#d4af37]">Tax Invoice</div>
                    <div className="font-bold text-slate-900">ACN: 687 415 005</div>
                    <div className="pt-1.5 text-slate-900">Invoice # {activeInvoiceLead.invoiceNumber || `INV-${activeInvoiceLead.id.slice(-6).toUpperCase()}`}</div>
                    <div className="text-slate-600">{new Date().toLocaleDateString("en-AU", { timeZone: "Australia/Sydney", day: "2-digit", month: "short", year: "numeric" })}</div>
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
                  {(() => {
                    const workText = invoiceDescription || invoiceService || "Full shower epoxy regrouting, deep clean, and perimeter silicone reseal.";
                    const lines = workText.split("\n").filter((l) => l.trim());
                    if (lines.length <= 1) {
                      return <div className="text-[11px] text-slate-700">{workText}</div>;
                    }
                    return (
                      <ul className="space-y-0.5">
                        {lines.map((line, i) => (
                          <li key={i} className="flex items-start gap-1 text-[11px] text-slate-700 leading-snug">
                            <span className="text-[#e5a910] font-bold shrink-0 mt-px">•</span>
                            <span>{line.replace(/^[•o]\s*/, "").trim()}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>

                {/* 4. Table */}
                {(() => {
                  const effectiveTotal = (invoicePrice || 0) + (invoiceExtraCharge || 0);
                  const subtotal = effectiveTotal / 1.1;
                  const gst = effectiveTotal - subtotal;
                  return (
                    <>
                      <div>
                        <div className="grid grid-cols-12 text-[10px] font-bold text-[#e5a910] uppercase pb-1 border-b border-slate-200">
                          <div className="col-span-6">DESCRIPTION</div>
                          <div className="col-span-2 text-right">QUANTITY</div>
                          <div className="col-span-2 text-right">PRICE</div>
                          <div className="col-span-2 text-right">TOTAL</div>
                        </div>
                        <div className="grid grid-cols-12 text-[11px] text-slate-800 py-1.5 border-b border-slate-200 items-start">
                          <div className="col-span-6">
                            <div className="font-semibold">{invoiceService || "Shower Cubicle Regrouting"}</div>
                            {invoiceDescription && (
                              <ul className="mt-1 space-y-0.5">
                                {invoiceDescription.split("\n").filter((l) => l.trim()).map((line, li) => (
                                  <li key={li} className="flex items-start gap-1 text-[10px] text-slate-500 leading-snug">
                                    <span className="text-[#001f97] font-bold shrink-0 mt-px">•</span>
                                    <span>{line.replace(/^[•o]\s*/, "").trim()}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div className="col-span-2 text-right">1</div>
                          <div className="col-span-2 text-right">${(invoicePrice || 0).toFixed(2)}</div>
                          <div className="col-span-2 text-right font-bold">${(invoicePrice || 0).toFixed(2)}</div>
                        </div>
                        {invoiceExtraWork && invoiceExtraCharge > 0 && (
                          <div className="grid grid-cols-12 text-[11px] text-slate-800 py-1.5 border-b border-slate-200 items-start">
                            <div className="col-span-6">
                              <div className="font-semibold text-amber-700">Additional Work</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{invoiceExtraWork}</div>
                            </div>
                            <div className="col-span-2 text-right">1</div>
                            <div className="col-span-2 text-right">${invoiceExtraCharge.toFixed(2)}</div>
                            <div className="col-span-2 text-right font-bold">${invoiceExtraCharge.toFixed(2)}</div>
                          </div>
                        )}
                      </div>

                      {/* 5. Financial Summary */}
                      <div className="text-right text-[11px] space-y-1 text-slate-800">
                        <div className="flex justify-end gap-6"><span className="text-slate-500 font-bold">SUBTOTAL</span> <span className="w-20">${subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-end gap-6"><span className="text-slate-500 font-bold">GST (10%)</span> <span className="w-20">${gst.toFixed(2)}</span></div>
                        <div className="flex justify-end gap-6 font-bold"><span className="text-slate-900">TOTAL</span> <span className="w-20">${effectiveTotal.toFixed(2)}</span></div>
                        <div className="flex justify-end gap-6"><span className="text-slate-500 font-bold">AMOUNT PAID</span> <span className="w-20">${invoiceStatus === "Paid" ? effectiveTotal.toFixed(2) : "0.00"}</span></div>
                        <div className="flex justify-end gap-6 font-black text-sm text-slate-900"><span>BALANCE DUE</span> <span className="w-20">${invoiceStatus === "Paid" ? "0.00" : effectiveTotal.toFixed(2)}</span></div>
                      </div>
                    </>
                  );
                })()}

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
          technicians={assignableTechnicians}
          onSave={async (report, markCompleted) => {
            const updates: Partial<Lead> = {
              inspectionReport: report,
            };
            if (markCompleted) {
              updates.status = "Inspection Completed";
            }
            if (report.suggestedTechnician) {
              const tech = assignableTechnicians.find((t) => t.name === report.suggestedTechnician);
              updates.technician = report.suggestedTechnician;
              updates.technicianId = tech?.id || "";
            }
            // Propagate inspector's warranty selection to the finance-stage fields
            if (report.warrantyEligible === "NO") {
              updates.warrantyProvided = false;
              updates.warranty = { ...(activeInspectionLead.warranty || {}), provided: false };
            } else if (report.warrantyEligible === "YES") {
              updates.warrantyProvided = true;
              updates.warranty = { ...(activeInspectionLead.warranty || {}), provided: true };
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
      {/* =========================================================================
          MODAL: TEAM CHAT (staff-to-staff)
         ========================================================================= */}
      {chatWith && (
        <TeamChatModal
          chatWith={chatWith}
          chatMessages={chatMessages}
          chatText={chatText}
          chatLoading={chatLoading}
          chatSending={chatSending}
          username={username || ""}
          onClose={() => setChatWith(null)}
          setChatText={setChatText}
          onSend={sendChat}
        />
      )}

      {/* Start Job — days prompt */}
      {startJobPrompt && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full mx-4 space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Start Job</h3>
              <p className="text-xs text-slate-500 mt-0.5">{startJobPrompt.lead.name || "Customer"} · {startJobPrompt.lead.address || ""}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">How many days will this job take?</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStartJobDays((d) => Math.max(1, d - 1))}
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-black text-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >−</button>
                <span className="text-2xl font-black text-[#001f97] w-8 text-center">{startJobDays}</span>
                <button
                  type="button"
                  onClick={() => setStartJobDays((d) => Math.min(14, d + 1))}
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-black text-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >+</button>
                <span className="text-xs text-slate-400 font-semibold">{startJobDays === 1 ? "Single day" : `${startJobDays} days`}</span>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  updateLeadField(startJobPrompt.lead.id, {
                    status: "Job Started",
                    jobTotalDays: startJobDays,
                    jobDaysDone: 1,
                  });
                  setStartJobPrompt(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#001f97] text-white font-bold text-sm hover:bg-[#001777] transition-colors cursor-pointer"
              >
                Start Job
              </button>
              <button
                type="button"
                onClick={() => setStartJobPrompt(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notify customer prompt for On the Way / Reached */}
      {notifyPrompt && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full mx-4">
            <h3 className="text-base font-black text-slate-900 mb-1">
              {notifyPrompt.eventType === "en_route" ? "Notify customer you're on the way?" : "Notify customer you've arrived?"}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {notifyPrompt.eventType === "en_route"
                ? `An SMS with your ETA will be sent to ${notifyPrompt.lead.name || "the customer"}.`
                : `An SMS will be sent letting ${notifyPrompt.lead.name || "the customer"} know you've arrived.`}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => executeOnTheWayNotification(notifyPrompt.lead, notifyPrompt.eventType)}
                className="flex-1 py-2.5 rounded-xl bg-[#001f97] text-white font-bold text-sm hover:bg-[#001777] transition-colors"
              >
                Yes, notify
              </button>
              <button
                type="button"
                onClick={() => setNotifyPrompt(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logo Settings Modal */}
      {logoSettingsOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Logo Settings</h3>
              <button onClick={() => setLogoSettingsOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center min-h-[80px]">
              <img src={siteLogoUrl} alt="Current logo" className="h-14 w-auto max-w-full object-contain" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">Upload a new JPEG or PNG to replace the logo across the website, emails, and PDFs. Changes take effect immediately.</p>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Upload New Logo</label>
              <input
                type="file"
                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#001f97] file:text-white hover:file:bg-[#001777] cursor-pointer"
                disabled={logoUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setLogoUploading(true);
                  const fd = new FormData();
                  fd.append("logo", file);
                  fetch("/api/admin/settings/logo", { method: "POST", body: fd })
                    .then((r) => r.json())
                    .then((d) => {
                      if (d.ok) setSiteLogoUrl(`/${d.logoFile}?v=${d.logoVersion}`);
                    })
                    .catch(console.error)
                    .finally(() => setLogoUploading(false));
                }}
              />
              {logoUploading && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading logo…
                </div>
              )}
            </div>
            <button
              onClick={() => setLogoSettingsOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ETA / notification toast */}
      {etaToast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <span>{etaToast.msg}</span>
          <button
            onClick={() => setEtaToast(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            ✕
          </button>
        </div>
      )}
    </div>
    </AdminPageProvider>
  );
}
