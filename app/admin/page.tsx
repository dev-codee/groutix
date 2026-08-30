"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  FileText,
  LogOut,
  RefreshCcw,
  Plus,
  Phone,
  Mail,
  FileSpreadsheet,
  Camera,
  MessageSquare,
  Navigation,
  ShieldCheck,
  Edit3,
  Trash2,
  Search,
  CheckSquare,
  Square,
  X,
  Share2,
  Printer,
  Sparkles,
  Download,
  Send,
  MapPin,
  ExternalLink,
  Users,
  Briefcase,
  UserCheck
} from "lucide-react";
import { useAdminBasePath } from "@/components/admin/AdminProvider";
import {
  SERVICE_TEMPLATES,
  GROUTIX_QUOTE_TERMS,
  bestTemplateForTask,
  type ServiceTemplate
} from "@/lib/serviceTemplates";

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
}

export interface GpsCheckin {
  lat: number;
  lng: number;
  accuracy?: number;
  time: string;
}

export interface WarrantyDoc {
  jobNo?: string;
  completionDate?: string;
  expiryDate?: string;
  customerName?: string;
  address?: string;
  authorisedBy?: string;
  dateIssued?: string;
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
  quoteItems?: QuoteItem[];
  quoteItemCode?: string;
  quoteScope?: string;
  quoteTaxMode?: "inclusive" | "exclusive" | "none";
  quoteTaxRate?: number;
  quoteTerms?: string;
  quoteUpdated?: string;
  quoteAmount?: number;
  photos?: { name: string; contentType?: string; dataUrl: string; added?: string }[];
  messages?: CustomerMessage[];
  gps?: GpsCheckin | null;
  warranty?: WarrantyDoc;
}

export interface CrmTask {
  id: string;
  text: string;
  done: boolean;
}

const STATUS_LIST = [
  "New",
  "Contacted",
  "Waiting for Info",
  "Inspection Booked",
  "Inspection Completed",
  "Quote Pending",
  "Quote Sent",
  "Negotiation",
  "Won",
  "Lost",
  "Payment Received",
  "Job Done"
] as const;

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

function getBadgeColor(status: string) {
  switch (status) {
    case "Won":
    case "Payment Received":
    case "Job Done":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Lost":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "Quote Pending":
    case "Quote Sent":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Inspection Booked":
    case "Inspection Completed":
    case "Negotiation":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "Waiting for Info":
      return "bg-teal-100 text-teal-800 border-teal-200";
    case "Contacted":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "New":
    default:
      return "bg-red-100 text-red-700 border-red-200 font-semibold";
  }
}

export default function CrmDashboardPage() {
  const basePath = useAdminBasePath();
  const router = useRouter();

  // Navigation / Views
  const [currentView, setCurrentView] = useState<
    "dashboard" | "statuses" | "leads" | "quotes" | "jobs" | "customers" | "team"
  >("dashboard");

  // Core Data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

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

  const [messagesModalOpen, setMessagesModalOpen] = useState(false);
  const [activeMessageLead, setActiveMessageLead] = useState<Lead | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyChannel, setReplyChannel] = useState<"email" | "sms" | "internal">("email");

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

  // Load leads and tasks from database
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [leadsRes, tasksRes] = await Promise.all([
        fetch("/api/admin/submissions?all=true", { cache: "no-store" }),
        fetch("/api/admin/tasks", { cache: "no-store" })
      ]);

      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data.items || []);
      } else {
        const err = await leadsRes.json().catch(() => ({}));
        setError(err.error || "Could not load leads from database.");
      }

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.items || []);
      }
    } catch {
      setError("Network error while connecting to CRM backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  // Lead CRUD Operations
  async function handleSaveLead(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLead?.name?.trim()) {
      alert("Customer name is required.");
      return;
    }

    try {
      if (editingLead.id) {
        // Update existing lead
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
        // Create new lead
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
    const existingItems = Array.isArray(lead.quoteItems) && lead.quoteItems.length > 0
      ? lead.quoteItems
      : [{
          templateNo: "",
          code: "",
          service: lead.service || "Tile & Grout Works",
          scope: lead.notes || "",
          price: 0,
          qty: 1
        }];
    setQuoteItems(existingItems);
    setQuoteTaxMode(lead.quoteTaxMode || "inclusive");
    setQuoteTaxRate(lead.quoteTaxRate ?? 10);
    setQuoteTerms(lead.quoteTerms || GROUTIX_QUOTE_TERMS.slice(0, 300));
    setQuoteModalOpen(true);
  }

  function handleAutoPrepareQuote(lead: Lead) {
    const tasks = String(lead.service || "").split(",").map((x) => x.trim()).filter(Boolean);
    if (!tasks.length) tasks.push(String(lead.service || lead.notes || "General Regrouting Work").trim());

    const used = new Set<string>();
    const suggested: string[] = [];
    const newItems: QuoteItem[] = [];

    tasks.forEach((task) => {
      const t = bestTemplateForTask(task, lead.notes || "", used);
      if (t) {
        used.add(t.code);
        suggested.push(t.code);
        newItems.push({
          templateNo: t.no,
          code: t.code,
          service: t.service || task,
          scope: t.scope || "",
          price: t.price || 0,
          qty: 1
        });
      } else {
        newItems.push({
          templateNo: "",
          code: "",
          service: task,
          scope: "",
          price: 0,
          qty: 1
        });
      }
    });

    setActiveQuoteLead(lead);
    setQuoteItems(newItems);
    setQuoteTaxMode(lead.quoteTaxMode || "inclusive");
    setQuoteTaxRate(lead.quoteTaxRate ?? 10);
    setQuoteTerms(GROUTIX_QUOTE_TERMS.slice(0, 350));
    setQuoteModalOpen(true);

    // Save auto-prepared quote state
    updateLeadField(lead.id, {
      quoteItems: newItems,
      quoteItemCode: suggested[0] || "",
      quoteScope: newItems.map((x) => x.scope).filter(Boolean).join("\n\n"),
      quoteUpdated: new Date().toISOString()
    });
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

  function handlePrintQuote() {
    window.print();
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
      `\n\nPlease let us know if you would like to proceed with the booking.\n\nRegards,\nGroutix Team\n(03) 7023 8094`
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
      `\n\nStay Sealed. Stay Smiling. - Groutix`
    );
    window.open(`https://wa.me/${phone.startsWith("0") ? "61" + phone.slice(1) : phone}?text=${text}`, "_blank");
  }

  // Photos Management
  function openPhotosModal(lead: Lead) {
    setActivePhotoLead(lead);
    setPhotosModalOpen(true);
  }

  async function handleAddPhotos(files: FileList | null) {
    if (!files || !activePhotoLead) return;
    const newPhotos = [...(activePhotoLead.photos || [])];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = () => {
          newPhotos.push({
            name: file.name,
            contentType: file.type,
            dataUrl: reader.result as string,
            added: new Date().toISOString()
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    await updateLeadField(activePhotoLead.id, { photos: newPhotos });
    setActivePhotoLead((prev) => (prev ? { ...prev, photos: newPhotos } : prev));
  }

  async function handleDeletePhoto(index: number) {
    if (!activePhotoLead) return;
    const newPhotos = (activePhotoLead.photos || []).filter((_, i) => i !== index);
    await updateLeadField(activePhotoLead.id, { photos: newPhotos });
    setActivePhotoLead((prev) => (prev ? { ...prev, photos: newPhotos } : prev));
  }

  // Conversation Management
  function openMessagesModal(lead: Lead) {
    setActiveMessageLead(lead);
    setReplyText("");
    setMessagesModalOpen(true);
  }

  function getConversation(lead: Lead): CustomerMessage[] {
    const list = Array.isArray(lead.messages) ? [...lead.messages] : [];
    const initialExists = list.some((m) => m.initial);
    if (!initialExists && (lead.service || lead.notes)) {
      list.unshift({
        id: `initial_${lead.id}`,
        from: "customer",
        channel: "lead",
        subject: "Original Enquiry",
        text: [
          lead.service ? `Service: ${lead.service}` : "",
          lead.notes ? `Notes / Request: ${lead.notes}` : "",
          lead.source ? `Source: ${lead.source}` : ""
        ].filter(Boolean).join("\n"),
        time: lead.received || lead.createdAt,
        initial: true
      });
    }
    return list;
  }

  async function handleSendReply() {
    if (!activeMessageLead || !replyText.trim()) return;
    const currentMsgs = getConversation(activeMessageLead);
    const newMsg: CustomerMessage = {
      id: `msg_${Date.now()}`,
      from: "groutix",
      channel: replyChannel,
      text: replyText.trim(),
      time: new Date().toISOString()
    };
    const updated = [...currentMsgs, newMsg];
    await updateLeadField(activeMessageLead.id, { messages: updated });
    setActiveMessageLead((prev) => (prev ? { ...prev, messages: updated } : prev));

    if (replyChannel === "email" && activeMessageLead.email) {
      window.location.href = `mailto:${activeMessageLead.email}?subject=${encodeURIComponent("Re: Groutix - Your Enquiry")}&body=${encodeURIComponent(replyText)}`;
    } else if (replyChannel === "sms" && activeMessageLead.phone) {
      window.location.href = `sms:${activeMessageLead.phone.replace(/[^\d+]/g, "")}?body=${encodeURIComponent(replyText)}`;
    }
    setReplyText("");
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

    // Draw Groutix Premium 10-Year Warranty Card
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    grad.addColorStop(0, "#001f97");
    grad.addColorStop(1, "#1667e8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, 160);

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 52px Arial, sans-serif";
    ctx.fillText("GROUTIX", 60, 95);
    ctx.font = "bold 26px Arial, sans-serif";
    ctx.fillText("10-YEAR WATERPROOF WARRANTY CERTIFICATE", 380, 95);

    // Body content
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

    // Terms notice
    ctx.font = "14px Arial, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(
      "This warranty guarantees against water penetration through regrouted tiled areas under normal domestic use as specified in our warranty terms.",
      60,
      800
    );
    ctx.fillText(
      "Groutix Pty Ltd • ACN: 687 415 005 • Melbourne, VIC • Phone: (03) 7023 8094 • info@groutix.com",
      60,
      830
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

  // Invoice Logic
  function openInvoiceModal(lead: Lead) {
    setActiveInvoiceLead(lead);
    setInvoiceService(lead.service || "Complete Shower Regrouting & Waterproof Resealing");
    setInvoiceDescription(
      lead.quoteScope ||
      lead.notes ||
      "• Full removal of failed grout\n• Chemical cleaning and substrate prep\n• Regrouting with commercial epoxy grout\n• Sanitary mould-resistant silicone joints"
    );
    setInvoicePrice(lead.quoteAmount || 850);
    setInvoiceGst(10);
    setInvoiceStatus(lead.status === "Payment Received" || lead.status === "Job Done" ? "Paid" : "Unpaid");
    setInvoiceModalOpen(true);
  }

  // Filtering & Search
  const filteredLeads = useMemo(() => {
    let list = leads;
    const q = globalSearch.toLowerCase().trim();
    if (q) {
      list = list.filter((l) =>
        [l.name, l.phone, l.email, l.service, l.address, l.notes]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    if (statusFilter) {
      list = list.filter((l) => l.status === statusFilter);
    }
    if (priorityFilter) {
      list = list.filter((l) => l.priority === priorityFilter);
    }
    return list;
  }, [leads, globalSearch, statusFilter, priorityFilter]);

  // Counts for KPIs
  const counts = useMemo(() => {
    const res: Record<string, number> = {};
    STATUS_LIST.forEach((s) => {
      res[s] = leads.filter((l) => l.status === s).length;
    });
    return res;
  }, [leads]);

  return (
    <div className="flex min-h-screen bg-[#f5f7fb] text-[#14213d]">
      {/* Sidebar Navigation */}
      <aside className="w-60 bg-white border-r border-[#e4e9f1] p-4 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-3 pb-6 border-b border-[#e4e9f1]">
            <div className="w-10 h-10 rounded-xl bg-[#001f97] text-white flex items-center justify-center font-black text-xl shadow-sm">
              G
            </div>
            <div>
              <div className="font-black text-lg leading-tight text-[#001f97]">Groutix CRM</div>
              <div className="text-xs text-slate-400">Lead & Job Management</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 flex flex-col gap-1.5">
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
                Dashboard
              </span>
            </button>

            <button
              onClick={() => setCurrentView("statuses")}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                currentView === "statuses"
                  ? "bg-[#001f97] text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4" />
                Statuses
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  currentView === "statuses" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {leads.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentView("leads")}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                currentView === "leads"
                  ? "bg-[#001f97] text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4" />
                Leads
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  currentView === "leads" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {leads.length}
              </span>
            </button>

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
                {leads.filter((l) => l.status === "Quote Sent" || l.quoteItems?.length).length}
              </span>
            </button>

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
                Jobs / Bookings
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  currentView === "jobs" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {leads.filter((l) => ["Won", "Job Done", "Payment Received"].includes(l.status)).length}
              </span>
            </button>

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
            </button>

            <div className="pt-4 mt-4 border-t border-[#e4e9f1]">
              <Link
                href={`${basePath}/content`}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                <FileText className="w-4 h-4" />
                Site Content Editor
              </Link>
            </div>
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="pt-4 border-t border-[#e4e9f1] flex flex-col gap-2">
          <div className="px-2 text-xs text-slate-400">
            Connected: <span className="font-semibold text-emerald-600">Live Database</span>
          </div>
          <button
            onClick={logout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? "Signing out…" : "Sign Out"}
          </button>
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
                : currentView === "statuses"
                ? "Lead Statuses"
                : currentView === "leads"
                ? "All Leads"
                : currentView === "quotes"
                ? "Quotations"
                : currentView === "jobs"
                ? "Jobs & Bookings"
                : currentView === "customers"
                ? "Customer Directory"
                : "Team Members"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live tracking • inspections • quotes • jobs • warranty
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

            {/* Refresh Button */}
            <button
              onClick={loadData}
              title="Refresh database records"
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin text-[#001f97]" : ""}`} />
            </button>

            {/* Add Lead Button */}
            <button
              onClick={() => {
                setEditingLead({
                  status: "New",
                  assigned: "Sarah",
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

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Manager • Admin
            </div>
          </div>
        </header>

        {/* View Contents */}
        <div className="p-6 space-y-6 flex-1">
          {error && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center justify-between">
              <div>
                <b>Notice:</b> {error}
              </div>
              <button
                onClick={loadData}
                className="text-xs bg-amber-200/60 px-3 py-1 rounded-lg font-semibold hover:bg-amber-200"
              >
                Retry
              </button>
            </div>
          )}

          {/* =========================================================================
              VIEW: DASHBOARD
             ========================================================================= */}
          {currentView === "dashboard" && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <div className="bg-white p-4 rounded-2xl border border-[#e4e9f1] shadow-xs">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Leads</div>
                  <div className="text-3xl font-black text-rose-600 my-1">{counts["New"] || 0}</div>
                  <div className="text-[11px] text-slate-400">Needs attention</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#e4e9f1] shadow-xs">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contacted</div>
                  <div className="text-3xl font-black text-blue-600 my-1">{counts["Contacted"] || 0}</div>
                  <div className="text-[11px] text-slate-400">In progress</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#e4e9f1] shadow-xs">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inspections</div>
                  <div className="text-3xl font-black text-purple-600 my-1">
                    {(counts["Inspection Booked"] || 0) + (counts["Inspection Completed"] || 0)}
                  </div>
                  <div className="text-[11px] text-slate-400">Booked / done</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#e4e9f1] shadow-xs">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quotes Sent</div>
                  <div className="text-3xl font-black text-amber-600 my-1">{counts["Quote Sent"] || 0}</div>
                  <div className="text-[11px] text-slate-400">Awaiting decision</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#e4e9f1] shadow-xs">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Won Jobs</div>
                  <div className="text-3xl font-black text-emerald-600 my-1">
                    {(counts["Won"] || 0) + (counts["Job Done"] || 0) + (counts["Payment Received"] || 0)}
                  </div>
                  <div className="text-[11px] text-slate-400">Confirmed orders</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#e4e9f1] shadow-xs">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lost Leads</div>
                  <div className="text-3xl font-black text-slate-500 my-1">{counts["Lost"] || 0}</div>
                  <div className="text-[11px] text-slate-400">Closed / inactive</div>
                </div>
              </div>

              {/* Lead Pipeline Bar */}
              <div className="bg-white p-4 rounded-2xl border border-[#e4e9f1] shadow-xs">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Lead Pipeline</div>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  <div className="bg-rose-500 text-white rounded-xl py-2 px-3 text-center text-xs font-black shadow-xs">
                    New ({counts["New"] || 0})
                  </div>
                  <div className="bg-blue-600 text-white rounded-xl py-2 px-3 text-center text-xs font-black shadow-xs">
                    Contacted ({counts["Contacted"] || 0})
                  </div>
                  <div className="bg-purple-600 text-white rounded-xl py-2 px-3 text-center text-xs font-black shadow-xs">
                    Inspection ({(counts["Inspection Booked"] || 0) + (counts["Inspection Completed"] || 0)})
                  </div>
                  <div className="bg-amber-500 text-white rounded-xl py-2 px-3 text-center text-xs font-black shadow-xs">
                    Quote Sent ({counts["Quote Sent"] || 0})
                  </div>
                  <div className="bg-emerald-600 text-white rounded-xl py-2 px-3 text-center text-xs font-black shadow-xs">
                    Won ({counts["Won"] || 0})
                  </div>
                  <div className="bg-slate-500 text-white rounded-xl py-2 px-3 text-center text-xs font-black shadow-xs">
                    Lost ({counts["Lost"] || 0})
                  </div>
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
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border ${getBadgeColor(l.status)}`}>
                                {l.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-600 font-medium">{l.assigned || "Sarah"}</td>
                            <td className="py-3 px-3 text-slate-500">{l.follow ? fmtDate(l.follow) : "—"}</td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1 flex-wrap">
                                <button
                                  onClick={() => openQuoteModal(l)}
                                  className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-[11px] font-bold transition-colors"
                                  title="Open Quote Builder"
                                >
                                  Quote
                                </button>
                                <button
                                  onClick={() => handleAutoPrepareQuote(l)}
                                  className="px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-[11px] font-bold transition-colors"
                                  title="Auto Prepare Quote with Templates"
                                >
                                  <Sparkles className="w-3 h-3 inline mr-0.5" />
                                  Auto
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
                                  className="p-1 text-slate-500 hover:text-[#001f97] hover:bg-slate-100 rounded-md"
                                  title="Conversation"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openGpsModal(l)}
                                  className="p-1 text-slate-500 hover:text-[#001f97] hover:bg-slate-100 rounded-md"
                                  title="GPS"
                                >
                                  <Navigation className="w-3.5 h-3.5" />
                                </button>
                                {l.status === "Job Done" && (
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
              VIEW: STATUSES / LEADS (Full Table View)
             ========================================================================= */}
          {(currentView === "statuses" || currentView === "leads") && (
            <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs space-y-4">
              {/* Filter Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3 flex-wrap flex-1">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                  >
                    <option value="">All Statuses ({leads.length})</option>
                    {STATUS_LIST.map((s) => (
                      <option key={s} value={s}>
                        {s} ({counts[s] || 0})
                      </option>
                    ))}
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                  >
                    <option value="">All Priorities</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>

                  {(statusFilter || priorityFilter || globalSearch) && (
                    <button
                      onClick={() => {
                        setStatusFilter("");
                        setPriorityFilter("");
                        setGlobalSearch("");
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

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Received</th>
                      <th className="py-3 px-3">Contacted</th>
                      <th className="py-3 px-3">Response Time</th>
                      <th className="py-3 px-3">Service / Scope</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Assigned</th>
                      <th className="py-3 px-3">Priority</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900">{l.name || "Unnamed"}</div>
                          <div className="text-[11px] text-slate-400">{l.phone || "No phone"}</div>
                          {l.email && <div className="text-[11px] text-slate-400">{l.email}</div>}
                          {l.address && <div className="text-[10px] text-slate-400 italic">{l.address}</div>}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600">{fmtDate(l.received || l.createdAt)}</td>
                        <td className="py-3.5 px-3">
                          {l.contacted ? (
                            <span className="text-slate-700 font-medium">{fmtDate(l.contacted)}</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-500 font-semibold">
                              Not yet
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-700">
                          {calcResponseTime(l.received || l.createdAt, l.contacted)}
                        </td>
                        <td className="py-3.5 px-3 max-w-[220px]">
                          <div className="line-clamp-2 text-slate-800 font-medium" title={l.service}>
                            {l.service || "General Service"}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <select
                            value={l.status}
                            onChange={(e) => updateLeadField(l.id, { status: e.target.value })}
                            className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-hidden ${getBadgeColor(
                              l.status
                            )}`}
                          >
                            {STATUS_LIST.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-3">
                          <select
                            value={l.assigned || "Sarah"}
                            onChange={(e) => updateLeadField(l.id, { assigned: e.target.value })}
                            className="text-xs bg-transparent border-0 font-medium text-slate-700 focus:outline-hidden"
                          >
                            <option value="Sarah">Sarah</option>
                            <option value="David">David</option>
                            <option value="Manager">Manager</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              l.priority === "High"
                                ? "bg-rose-100 text-rose-700"
                                : l.priority === "Low"
                                ? "bg-slate-100 text-slate-600"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {l.priority || "Medium"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            <button
                              onClick={() => callCustomer(l)}
                              className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs"
                              title="Call Phone"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => emailCustomer(l)}
                              className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs"
                              title="Email Customer"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openQuoteModal(l)}
                              className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold"
                              title="Open Quote Builder"
                            >
                              Quote
                            </button>
                            <button
                              onClick={() => handleAutoPrepareQuote(l)}
                              className="px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold"
                              title="Auto Prepare Quote with Templates"
                            >
                              <Sparkles className="w-3 h-3 inline mr-0.5" />
                              Auto
                            </button>
                            <button
                              onClick={() => openPhotosModal(l)}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                              title="Photos"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openMessagesModal(l)}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                              title="Messages"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openGpsModal(l)}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                              title="GPS"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                            </button>
                            {l.status === "Job Done" && (
                              <button
                                onClick={() => openWarrantyModal(l)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                title="10-Year Warranty Card"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => openInvoiceModal(l)}
                              className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg"
                              title="Auto Invoice"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingLead(l);
                                setLeadModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                              title="Edit Lead"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLead(l.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredLeads.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-16 text-center text-slate-400">
                          No leads matching the current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                  {leads.filter((l) => l.quoteItems?.length || l.status === "Quote Sent").length} Quotes in System
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
                    {leads
                      .filter((l) => l.quoteItems?.length || l.status === "Quote Sent" || l.quoteTerms)
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
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] border ${getBadgeColor(l.status)}`}>
                                {l.status}
                              </span>
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
            </div>
          )}

          {/* =========================================================================
              VIEW: JOBS / BOOKINGS
             ========================================================================= */}
          {currentView === "jobs" && (
            <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs space-y-4">
              <h2 className="text-base font-black text-slate-900">Won & Completed Jobs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leads
                  .filter((l) => ["Won", "Job Done", "Payment Received", "Inspection Completed"].includes(l.status))
                  .map((l) => (
                    <div key={l.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-black text-slate-900 text-sm">{l.name}</div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getBadgeColor(l.status)}`}>
                          {l.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1">
                        <div><b>Phone:</b> {l.phone || "—"}</div>
                        <div><b>Address:</b> {l.address || "—"}</div>
                        <div><b>Service:</b> {l.service || "—"}</div>
                        <div><b>Assigned Tech:</b> {l.assigned || "David"}</div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                        <button
                          onClick={() => openWarrantyModal(l)}
                          className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 text-center"
                        >
                          10-Yr Warranty Card
                        </button>
                        <button
                          onClick={() => openInvoiceModal(l)}
                          className="py-1.5 px-3 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100"
                        >
                          Invoice
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW: CUSTOMERS
             ========================================================================= */}
          {currentView === "customers" && (
            <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs space-y-4">
              <h2 className="text-base font-black text-slate-900">Customer Directory ({leads.length} Records)</h2>
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
                    {leads.map((l) => (
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
            </div>
          )}

          {/* =========================================================================
              VIEW: TEAM
             ========================================================================= */}
          {currentView === "team" && (
            <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs space-y-4">
              <h2 className="text-base font-black text-slate-900">Groutix Operations Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                  <div className="font-black text-slate-900 text-base">Sarah</div>
                  <div className="text-xs text-blue-700 font-semibold">Office Lead & Customer Coordinator</div>
                  <div className="text-xs text-slate-600 pt-2">
                    Active assigned leads: <b>{leads.filter((l) => l.assigned === "Sarah").length}</b>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                  <div className="font-black text-slate-900 text-base">David</div>
                  <div className="text-xs text-purple-700 font-semibold">Senior Inspector & Regrouting Specialist</div>
                  <div className="text-xs text-slate-600 pt-2">
                    Active assigned leads: <b>{leads.filter((l) => l.assigned === "David").length}</b>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                  <div className="font-black text-slate-900 text-base">Manager</div>
                  <div className="text-xs text-emerald-700 font-semibold">Operations & Accounts Admin</div>
                  <div className="text-xs text-slate-600 pt-2">
                    Active assigned leads: <b>{leads.filter((l) => l.assigned === "Manager").length}</b>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* =========================================================================
          MODAL: ADD / EDIT LEAD
         ========================================================================= */}
      {leadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
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
                    {STATUS_LIST.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned To</label>
                  <select
                    value={editingLead?.assigned || "Sarah"}
                    onChange={(e) => setEditingLead({ ...editingLead, assigned: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  >
                    <option value="Sarah">Sarah</option>
                    <option value="David">David</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={editingLead?.priority || "Medium"}
                    onChange={(e) => setEditingLead({ ...editingLead, priority: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
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
                <div className="space-y-2">
                  <div className="font-bold text-slate-800 text-sm">Customer Details</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={activeQuoteLead.name || ""}
                      onChange={(e) => setActiveQuoteLead({ ...activeQuoteLead, name: e.target.value })}
                      className="p-2 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Phone"
                      value={activeQuoteLead.phone || ""}
                      onChange={(e) => setActiveQuoteLead({ ...activeQuoteLead, phone: e.target.value })}
                      className="p-2 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={activeQuoteLead.email || ""}
                      onChange={(e) => setActiveQuoteLead({ ...activeQuoteLead, email: e.target.value })}
                      className="p-2 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Property Address"
                      value={activeQuoteLead.address || ""}
                      onChange={(e) => setActiveQuoteLead({ ...activeQuoteLead, address: e.target.value })}
                      className="p-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-800 text-sm">Quote Items ({quoteItems.length})</div>
                    <button
                      type="button"
                      onClick={() =>
                        setQuoteItems([
                          ...quoteItems,
                          { templateNo: "", code: "", service: "Additional Regrouting Work", scope: "", price: 0, qty: 1 }
                        ])
                      }
                      className="px-2.5 py-1 bg-blue-50 text-[#001f97] font-bold rounded-lg hover:bg-blue-100"
                    >
                      + Add Item
                    </button>
                  </div>

                  {quoteItems.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                      <div className="flex items-center justify-between font-bold text-slate-700">
                        <span>Item #{idx + 1}</span>
                        {quoteItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setQuoteItems(quoteItems.filter((_, i) => i !== idx))}
                            className="text-rose-500 hover:underline text-[11px]"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {/* Template Selector */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                          Pick from 84 Standard Groutix Templates
                        </label>
                        <select
                          value={item.templateNo || ""}
                          onChange={(e) => {
                            const no = e.target.value;
                            const t = SERVICE_TEMPLATES.find((x) => String(x.no) === no);
                            if (t) {
                              const updated = [...quoteItems];
                              updated[idx] = {
                                ...updated[idx],
                                templateNo: t.no,
                                code: t.code,
                                service: t.service,
                                scope: t.scope,
                                price: t.price || updated[idx].price || 0
                              };
                              setQuoteItems(updated);
                            }
                          }}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="">Manual / Custom Description</option>
                          {SERVICE_TEMPLATES.map((t) => (
                            <option key={t.no} value={t.no}>
                              {t.code} - {t.service.slice(0, 45)}...
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Service Title</label>
                        <input
                          type="text"
                          value={item.service || ""}
                          onChange={(e) => {
                            const updated = [...quoteItems];
                            updated[idx].service = e.target.value;
                            setQuoteItems(updated);
                          }}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Detailed Scope</label>
                        <textarea
                          rows={3}
                          value={item.scope || ""}
                          onChange={(e) => {
                            const updated = [...quoteItems];
                            updated[idx].scope = e.target.value;
                            setQuoteItems(updated);
                          }}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Price (AUD)</label>
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
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.qty || 1}
                            onChange={(e) => {
                              const updated = [...quoteItems];
                              updated[idx].qty = parseInt(e.target.value, 10) || 1;
                              setQuoteItems(updated);
                            }}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold"
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
                          {item.scope && (
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

                <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-2">
                  <b>Conditions:</b> {quoteTerms}
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
                Print / Save PDF
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
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
              >
                <Mail className="w-3.5 h-3.5" />
                Email Quote
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
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CUSTOMER PHOTOS
         ========================================================================= */}
      {photosModalOpen && activePhotoLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
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
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleAddPhotos(e.target.files)}
                className="text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#001f97] hover:file:bg-blue-100"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto p-1">
              {(activePhotoLead.photos || []).map((photo, i) => (
                <div key={i} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 space-y-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.dataUrl}
                    alt={photo.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span className="truncate max-w-[120px]" title={photo.name}>
                      {photo.name}
                    </span>
                    <button
                      onClick={() => handleDeletePhoto(i)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                      title="Delete photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {(!activePhotoLead.photos || activePhotoLead.photos.length === 0) && (
                <div className="col-span-full py-8 text-center text-xs text-slate-400">
                  No photos uploaded for this customer yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CUSTOMER CONVERSATION (MESSAGES)
         ========================================================================= */}
      {messagesModalOpen && activeMessageLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Customer Conversation</h2>
                <div className="text-xs text-slate-500">
                  {activeMessageLead.name} • {activeMessageLead.phone || "No phone"} • {activeMessageLead.email || "No email"}
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
              {getConversation(activeMessageLead).map((msg) => {
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
                  </div>
                );
              })}
            </div>

            {/* Reply Composer */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Reply Channel:</span>
                  <select
                    value={replyChannel}
                    onChange={(e) => setReplyChannel(e.target.value as any)}
                    className="text-xs p-1.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="internal">Internal Note Only</option>
                  </select>
                </div>
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

              <div className="flex justify-end gap-2">
                <button
                  onClick={handleSendReply}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#001f97] text-white text-xs font-bold rounded-xl hover:bg-[#001777]"
                >
                  <Send className="w-3.5 h-3.5" />
                  Save & Send Reply
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

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                onClick={downloadWarrantyCard}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#001f97] text-white rounded-xl text-xs font-bold hover:bg-[#001777]"
              >
                <Download className="w-4 h-4" />
                Download PNG Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: AUTO INVOICE
         ========================================================================= */}
      {invoiceModalOpen && activeInvoiceLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
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
                className="px-5 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800"
              >
                Save Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
