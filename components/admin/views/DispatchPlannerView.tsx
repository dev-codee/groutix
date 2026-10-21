"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, CalendarClock, Check, Download, Eye, GripVertical, Home, Layers, Loader2, MapPin, Pencil, Plus, RefreshCw, Save, Search, Trash2, WandSparkles, X } from "lucide-react";
import { useAdminPageCtx } from "../AdminPageContext";
import { DispatchBookingModal } from "../modals/DispatchBookingModal";
import { EditBookingModal } from "../modals/EditBookingModal";
import { BookingStatusControl } from "../BookingStatusControl";
import type { Lead } from "../types";
import { bookingLead, leadBookings, type LeadBooking } from "@/lib/leadBookings";
import { DISPATCH_LEAD_FILTERS, dispatchLeadStage, matchesDispatchLeadStatus, type DispatchLeadFilter } from "@/lib/dispatchLeads";
import { DISPATCH_BASE_ADDRESS, DISPATCH_ZONES, emptyDispatchPlan, mergeDispatchOrder, validDispatchPlan, type DispatchPlan, type DispatchZone, type PlannerSort } from "@/lib/dispatchPlanner";
import { filterWorkBookings, sortWorkRows, workAddress, workBookingCandidates, workBookingKey, workDistances, workMinutes, workRows, type WorkMeasurement, type WorkRow } from "@/lib/dispatchWorklist";
import { todayAU, formatApptDate, formatApptTime } from "@/lib/scheduling";
import { validScheduleDate } from "@/lib/scheduleRoutes";
import { useZoneRules } from "@/lib/useZoneRules";

const button = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-blue-600";
const field = "rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:outline-2 focus:outline-blue-500";
const panel = "rounded-xl border border-slate-200 bg-white shadow-xs";
const formatDuration = (minutes: number) => `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}h ` : ""}${minutes % 60 || !minutes ? `${minutes % 60}m` : ""}`.trim();
const ref = (lead: Lead) => lead.jobNo || lead.id.slice(-6).toUpperCase();
const draftKey = (username: string) => `groutix:dispatch-worklist:v1:${username}`;
const zoneInfo = (id: DispatchZone) => DISPATCH_ZONES.find(zone => zone.id === id)!;
function ZoneBadge({ zone }: { zone: DispatchZone }) {
  const info = zoneInfo(zone);
  return <span className="inline-flex shrink-0 rounded-md border px-1.5 py-1 text-[10px] font-bold" style={{ color: info.color, backgroundColor: `${info.color}10`, borderColor: `${info.color}30` }} title={`${info.name} · ${info.direction}`}>{zone === "unlocated" ? "?" : zone}</span>;
}
function Dialog({ title, busy, onClose, children }: { title: string; busy?: boolean; onClose: () => void; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; box.current?.focus(); return () => previous?.focus(); }, []);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onKeyDown={event => {
    if (event.key === "Escape" && !busy) onClose();
    if (event.key === "Tab") {
      const items = box.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]');
      if (!items?.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === box.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === box.current)) { event.preventDefault(); first.focus(); }
    }
  }}><div ref={box} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl outline-none"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-bold">{title}</h2><button className={button} aria-label="Close dialog" disabled={busy} onClick={onClose}><X className="h-4 w-4" /></button></div>{children}</div></div>;
}

export function DispatchPlannerView() {
  const { scopedLeads, upsertLead, openJobCard, setEditingLead, setLeadModalOpen, loading: leadsLoading, username } = useAdminPageCtx();
  const rules = useZoneRules();
  const [plan, setPlan] = useState<DispatchPlan>(emptyDispatchPlan);
  const planRef = useRef(plan), dirtyRef = useRef(false);
  const [dirty, setDirty] = useState(false), [loaded, setLoaded] = useState(false), [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [zoneIds, setZoneIds] = useState<DispatchZone[]>(DISPATCH_ZONES.map(zone => zone.id));
  const [zoneTab, setZoneTab] = useState("all"), [stage, setStage] = useState<DispatchLeadFilter>("active"), [query, setQuery] = useState("");
  const [sort, setSort] = useState<PlannerSort>("manual"), [visitType, setVisitType] = useState("all"), [staffFilter, setStaffFilter] = useState("all");
  const [dateMode, setDateMode] = useState("all"), [from, setFrom] = useState(todayAU), [to, setTo] = useState(todayAU);
  const [includeUnbooked, setIncludeUnbooked] = useState(true), [showTravel, setShowTravel] = useState(true);
  const [choices, setChoices] = useState<Record<string, string>>({}), [selected, setSelected] = useState<string[]>([]), [dragged, setDragged] = useState<string | null>(null);
  const touchDrag = useRef<{ id: string; target: string } | null>(null);
  const [measurements, setMeasurements] = useState<Record<string, WorkMeasurement>>({}), [measuring, setMeasuring] = useState(false), [roadError, setRoadError] = useState("");
  const [create, setCreate] = useState<{ ids: string[]; index: number; type: "inspection" | "job" } | null>(null);
  const [editQueue, setEditQueue] = useState<{ lead: Lead; booking: LeadBooking }[]>([]), [editing, setEditing] = useState<{ lead: Lead; booking: LeadBooking } | null>(null);
  const [opening, setOpening] = useState(false), [cancelling, setCancelling] = useState(false), [cancel, setCancel] = useState<{ lead: Lead; booking: LeadBooking } | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null), [metadata, setMetadata] = useState<"zone" | "group" | null>(null);
  const [newZone, setNewZone] = useState<DispatchZone | "auto">("auto"), [groupName, setGroupName] = useState("");
  const busy = saving || opening || cancelling;
  const allRows = useMemo(() => workRows(scopedLeads, plan, rules.flexRadiusKm, choices), [scopedLeads, plan, rules.flexRadiusKm, choices]);
  const searched = useMemo(() => allRows.filter(row => [row.id, row.lead.name, row.lead.jobNo, row.lead.address, row.lead.city, row.lead.phone, row.lead.email, row.lead.service, row.group]
    .some(value => value?.toLowerCase().includes(query.trim().toLowerCase()))), [allRows, query]);
  const stageRows = useMemo(() => searched.filter(row => matchesDispatchLeadStatus(row.lead.status, stage)), [searched, stage]);
  const validDates = validScheduleDate(from) && validScheduleDate(to) && from <= to;
  const filtered = useMemo(() => filterWorkBookings(stageRows.filter(row => zoneIds.includes(row.zone)), {
    visitType, staff: staffFilter, includeUnbooked, from: dateMode === "range" ? from : undefined, to, validDates,
  }), [stageRows, zoneIds, visitType, includeUnbooked, staffFilter, dateMode, validDates, from, to]);
  const rows = useMemo(() => sortWorkRows(filtered, sort, plan), [filtered, sort, plan]);
  const distances = useMemo(() => workDistances(rows, measurements), [rows, measurements]);
  const chosen = rows.filter(row => selected.includes(row.id));
  const crewChoices = [...new Set(allRows.flatMap(row => row.bookings.map(booking => (booking.type === "job" ? booking.technician : booking.assigned) || "Unassigned")))].sort();
  const visibleZones = DISPATCH_ZONES.filter(zone => zone.id === "unlocated" ? allRows.some(row => row.zone === zone.id) : zoneTab === "all" || (zoneTab === "inner" ? zone.inner : !zone.inner));
  const routeSignature = JSON.stringify(rows.map(row => [row.id, workAddress(row)]));
  const history = allRows.find(row => row.id === historyId);
  const totals = distances.reduce((sum, entry) => {
    if (entry.fromPrevious.km === null) sum.missing++;
    else { sum.km += entry.fromPrevious.km; sum.minutes += entry.fromPrevious.minutes || 0; }
    if (!entry.fromPrevious.road) sum.estimated = true;
    sum.work += workMinutes(entry.row.booking);
    return sum;
  }, { km: 0, minutes: 0, work: 0, missing: 0, estimated: false });
  const last = distances.at(-1);
  if (last) {
    if (last.returnToBase.km === null) totals.missing++; else { totals.km += last.returnToBase.km; totals.minutes += last.returnToBase.minutes || 0; }
    if (!last.returnToBase.road) totals.estimated = true;
  }

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      await Promise.resolve();
      try {
        if (!dirtyRef.current) {
          try { const cached = JSON.parse(window.sessionStorage.getItem(draftKey(username)) || "null"); if (validDispatchPlan(cached)) { planRef.current = cached; dirtyRef.current = true; setPlan(cached); setDirty(true); } } catch { /* Optional local recovery. */ }
        }
        const response = await fetch("/api/admin/dispatch-workspace", { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !validDispatchPlan(data.plan)) throw new Error(data.error || "Could not load the shared dispatch order.");
        if (controller.signal.aborted) return;
        if (!dirtyRef.current) { planRef.current = data.plan; setPlan(data.plan); }
        setLoaded(true); setError("");
      } catch (err) { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Could not load the shared dispatch order."); }
    }
    void load(); return () => controller.abort();
  }, [reload, username]);
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", guard); return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  useEffect(() => {
    const route = JSON.parse(routeSignature) as [string, string][];
    const controller = new AbortController();
    const timer = setTimeout(() => {
      async function measure() {
        if (!route.length) { setMeasuring(false); return; }
        setMeasuring(true); setRoadError("");
        try {
          for (let start = 0; start < route.length; start += 40) {
            if (controller.signal.aborted) return;
            const response = await fetch("/api/admin/dispatch-workspace", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ids: route.slice(start, start + 40).map(([id]) => id), previousId: start ? route[start - 1][0] : null, lastBatch: start + 40 >= route.length }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Road distances are temporarily unavailable.");
            if (controller.signal.aborted) return;
            setMeasurements(current => ({ ...current, ...Object.fromEntries((data.measurements as WorkMeasurement[]).map(value => [value.id, value])) }));
          }
        } catch (err) { if (!controller.signal.aborted) setRoadError(err instanceof Error ? err.message : "Road distances are temporarily unavailable."); }
        finally { if (!controller.signal.aborted) setMeasuring(false); }
      }
      void measure();
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [routeSignature]);

  function changePlan(next: DispatchPlan) {
    if (!loaded || busy) return;
    planRef.current = next; dirtyRef.current = true; setPlan(next); setDirty(true); setNotice("");
    try { window.sessionStorage.setItem(draftKey(username), JSON.stringify(next)); } catch { /* Saving the shared plan remains available. */ }
  }
  function keepOrder(order: string[]) {
    const allIds = allRows.map(row => row.id);
    const full = [...planRef.current.order.filter(id => allIds.includes(id)), ...allIds.filter(id => !planRef.current.order.includes(id))];
    changePlan({ ...planRef.current, order: mergeDispatchOrder(full, order) }); setSort("manual");
  }
  function move(source: string, target: string) {
    if (!loaded || busy || source === target) return;
    const ordered = rows.map(row => row.id), fromIndex = ordered.indexOf(source), toIndex = ordered.indexOf(target);
    if (fromIndex < 0 || toIndex < 0) return;
    ordered.splice(fromIndex, 1); ordered.splice(toIndex, 0, source); keepOrder(ordered);
  }
  async function save() {
    if (!loaded || busy || !dirtyRef.current) return;
    setSaving(true); setError("");
    try {
      const ids = new Set(scopedLeads.map(lead => lead.id));
      const current = planRef.current;
      const clean = { ...current, order: current.order.filter(id => ids.has(id)), zones: Object.fromEntries(Object.entries(current.zones).filter(([id]) => ids.has(id))), groups: Object.fromEntries(Object.entries(current.groups).filter(([id]) => ids.has(id))) };
      const response = await fetch("/api/admin/dispatch-workspace", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: clean }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save the planning order.");
      planRef.current = data.plan; setPlan(data.plan); dirtyRef.current = false; setDirty(false);
      try { window.sessionStorage.removeItem(draftKey(username)); } catch { /* Optional local cache. */ }
      setNotice("Dispatch order saved. No booking times or customer notifications were changed.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save the dispatch order."); }
    finally { setSaving(false); }
  }
  function discard() {
    dirtyRef.current = false; setDirty(false); setLoaded(false);
    try { window.sessionStorage.removeItem(draftKey(username)); } catch { /* Optional local cache. */ }
    setReload(value => value + 1);
  }
  const openEditor = useCallback(async (queue: { lead: Lead; booking: LeadBooking }[]) => {
    if (!queue.length) return;
    setOpening(true); setError("");
    try {
      const target = queue[0];
      const response = await fetch(`/api/admin/submissions/${target.lead.id}`, { cache: "no-store" }); const data = await response.json();
      if (!response.ok || !data.item) throw new Error(data.error || "This customer could not be loaded.");
      const lead = data.item as Lead;
      const booking = leadBookings(lead).find(booking => booking.type === target.booking.type && `${booking.date}T${booking.time}` === `${target.booking.date}T${target.booking.time}` && (!target.booking.bookingId || booking.bookingId === target.booking.bookingId));
      if (!booking || booking.status === "Cancelled" || ["Lost", "Cancelled"].includes(lead.status)) throw new Error("This visit changed. Refresh before editing it.");
      setEditing({ lead: bookingLead(lead, booking), booking }); setEditQueue(queue.slice(1)); setHistoryId(null);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not open this visit."); }
    finally { setOpening(false); }
  }, []);
  async function cancelBooking() {
    if (!cancel || cancelling) return;
    setCancelling(true); setError("");
    try {
      const response = await fetch(`/api/admin/submissions/${cancel.lead.id}/bookings`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId: cancel.booking.bookingId, type: cancel.booking.type, start: `${cancel.booking.date}T${cancel.booking.time}`, status: "Cancelled" }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not cancel the visit.");
      upsertLead(data.item); setCancel(null); setNotice("Selected visit cancelled. Other bookings are retained.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not cancel this visit."); }
    finally { setCancelling(false); }
  }
  function applyMetadata(removeGroup = false) {
    const zones = { ...planRef.current.zones }, groups = { ...planRef.current.groups };
    for (const row of chosen) {
      if (removeGroup) delete groups[row.id];
      else if (metadata === "zone") { if (newZone === "auto") delete zones[row.id]; else zones[row.id] = newZone; }
      else if (groupName.trim()) groups[row.id] = groupName.trim();
    }
    changePlan({ ...planRef.current, zones, groups });
    if (metadata === "zone" && newZone !== "auto") setZoneIds(ids => [...new Set([...ids, newZone])]);
    setMetadata(null);
  }
  function exportRows() {
    const data = [["Order", "Reference", "Customer", "Address", "Zone", "Lead status", "Booking type", "Date", "Time", "Staff", "From base km", "Base source", "From previous km", "Previous source"],
      ...distances.map((entry, index) => [index + 1, ref(entry.row.lead), entry.row.lead.name, workAddress(entry.row), entry.row.zone, entry.row.lead.status, entry.row.booking?.type, entry.row.booking?.date, entry.row.booking?.time,
        entry.row.booking?.type === "job" ? entry.row.booking.technician : entry.row.booking?.assigned, entry.fromBase.km, entry.fromBase.road ? "Road" : "Estimate", entry.fromPrevious.km, entry.fromPrevious.road ? "Road" : "Estimate"])];
    const csv = data.map(row => row.map(cell => { let value = String(cell ?? ""); if (/^[=+@\-\t\r]/.test(value)) value = `'${value}`; return `"${value.replaceAll('"', '""')}"`; }).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = "dispatch-worklist.csv"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const distanceLabel = (value: { km: number | null; road: boolean }) => value.km === null ? "Unavailable" : `${value.road ? "" : "~"}${value.km.toFixed(1)} km`;

  return <div className="mx-auto w-full max-w-[1760px] space-y-4 pb-8 text-slate-800">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-blue-600">Operations</p><h2 className="mt-1 text-2xl font-bold tracking-tight">Dispatch planner</h2><p className="mt-1 text-xs text-slate-500">One worklist for leads, bookings and route planning · Melbourne time</p></div><div className="flex gap-2"><button className={button} disabled={!rows.length} onClick={exportRows}><Download className="h-4 w-4" />Export</button><button className={`${button} !border-blue-600 !bg-blue-600 !text-white`} disabled={busy || leadsLoading} onClick={() => setCreate({ ids: [], index: 0, type: visitType === "job" ? "job" : "inspection" })}><Plus className="h-4 w-4" />Book a visit</button></div></header>
    <div className={`${panel} flex flex-wrap items-end gap-3 p-3`}>
      <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase text-slate-500">Lead status<select className={field} aria-label="Filter leads by status" value={stage} onChange={event => { setStage(event.target.value as DispatchLeadFilter); setSelected([]); }}><option value="active">All active leads</option>{DISPATCH_LEAD_FILTERS.map(value => <option key={value.id} value={value.id}>{value.label}</option>)}</select></label>
      <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase text-slate-500">Visit type<select className={field} aria-label="Filter visit type" value={visitType} onChange={event => setVisitType(event.target.value)}><option value="all">All visits</option><option value="inspection">Inspection</option><option value="job">Job</option></select></label>
      <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase text-slate-500">Staff<select className={field} aria-label="Filter staff" value={staffFilter} onChange={event => setStaffFilter(event.target.value)}><option value="all">All staff</option><option value="unassigned">Unassigned</option>{crewChoices.filter(value => value !== "Unassigned").map(value => <option key={value} value={value.toLowerCase()}>{value}</option>)}</select></label>
      <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase text-slate-500">Booking dates<select className={field} aria-label="Booking date scope" value={dateMode} onChange={event => setDateMode(event.target.value)}><option value="all">Any date</option><option value="range">Selected dates</option></select></label>
      {dateMode === "range" && <><label className="flex flex-col gap-1 text-[10px] text-slate-500">From<input className={field} type="date" aria-label="From date" value={from} onChange={event => setFrom(event.target.value)} /></label><label className="flex flex-col gap-1 text-[10px] text-slate-500">To<input className={field} type="date" aria-label="To date" value={to} min={from} onChange={event => setTo(event.target.value)} /></label></>}
      <label className="relative min-w-48 flex-1"><Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" /><input type="search" className={`${field} w-full pl-9`} aria-label="Search zone leads" placeholder="Name, address, reference or group" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <label className="flex items-center gap-1.5 py-2 text-[11px]"><input type="checkbox" checked={includeUnbooked} onChange={event => setIncludeUnbooked(event.target.checked)} className="accent-blue-600" />Include unbooked</label>
      <button className={button} onClick={() => { setStage("active"); setQuery(""); setVisitType("all"); setStaffFilter("all"); setDateMode("all"); setIncludeUnbooked(true); setSelected([]); }}>Reset filters</button>
    </div>
    {dateMode === "range" && !validDates && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Choose a valid date range. Unbooked leads remain visible.</p>}
    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"><span>{error}</span><button className={button} disabled={busy} onClick={() => setReload(value => value + 1)}><RefreshCw className="h-3.5 w-3.5" />Reload order</button></div>}
    {notice && <div role="status" className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800"><span className="flex items-center gap-2"><Check className="h-4 w-4" />{notice}</span><button aria-label="Dismiss notice" onClick={() => setNotice("")}><X className="h-4 w-4" /></button></div>}
    {dirty && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs"><span className="text-amber-900">Unsaved planning order / grouping changes. Booking times stay unchanged.</span><div className="flex gap-2"><button className={button} disabled={busy} onClick={discard}>Discard changes</button><button className={`${button} !bg-slate-900 !text-white`} disabled={!loaded || busy} onClick={() => void save()}>{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Save plan</button></div></div>}
    <div className="grid items-start gap-4 xl:grid-cols-[210px_minmax(0,1fr)]">
      <aside className="space-y-3">
        <section className={`${panel} overflow-hidden`}><div className="border-b border-slate-100 p-3"><h3 className="text-sm font-bold">Service areas / zones</h3><div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">{["all", "inner", "outer"].map(value => <button key={value} aria-pressed={zoneTab === value} className={`rounded py-1.5 text-[10px] font-semibold ${zoneTab === value ? "bg-white shadow-sm" : "text-slate-500"}`} onClick={() => setZoneTab(value)}>{value === "all" ? "All" : value === "inner" ? `≤ ${rules.flexRadiusKm} km` : `> ${rules.flexRadiusKm} km`}</button>)}</div></div><div className="space-y-1 p-2">{visibleZones.map(zone => <div key={zone.id} className="flex items-center rounded-lg border" style={{ borderColor: zoneIds.includes(zone.id) ? `${zone.color}40` : "#f1f5f9", backgroundColor: zoneIds.includes(zone.id) ? `${zone.color}08` : "white" }}><button className="flex min-w-0 flex-1 items-center gap-2 p-2.5 text-left" aria-label={`Show ${zone.id} leads`} onClick={() => { setZoneIds([zone.id]); setSelected([]); }}><ZoneBadge zone={zone.id} /><span><span className="block text-[11px] font-bold">{zone.name}</span><span className="text-[10px] text-slate-500">{stageRows.filter(row => row.zone === zone.id).length} leads</span></span></button><input type="checkbox" className="mr-3 h-3.5 w-3.5 accent-blue-600" aria-label={`Include ${zone.id} in selection`} checked={zoneIds.includes(zone.id)} onChange={() => { setZoneIds(ids => ids.includes(zone.id) ? ids.filter(id => id !== zone.id) : [...ids, zone.id]); setSelected([]); }} /></div>)}</div><div className="flex justify-between border-t border-slate-100 p-3 text-[10px] font-semibold"><button className="text-blue-600" onClick={() => setZoneIds(DISPATCH_ZONES.map(zone => zone.id))}>All zones</button><button className="text-slate-500" onClick={() => setZoneIds([])}>Clear</button></div></section>
        <section className={`${panel} space-y-3 p-3`}><h3 className="text-xs font-bold">Order & distance</h3><select aria-label="Sort worklist" className={`${field} w-full`} value={sort} onChange={event => setSort(event.target.value as PlannerSort)}><option value="manual">Manual / saved order</option><option value="nearest">Nearest to base first</option><option value="farthest">Farthest from base first</option><option value="schedule">Booking date & time</option><option value="smart">Nearest-neighbour suggestion</option></select><button className={`${button} w-full !border-blue-100 !text-blue-700`} disabled={!loaded || busy || rows.length < 2} onClick={() => keepOrder(sortWorkRows(rows, "smart", plan).map(row => row.id))}><WandSparkles className="h-3.5 w-3.5" />Suggest route order</button><button className={`${button} w-full`} disabled={!loaded || busy || !rows.length} onClick={() => keepOrder(rows.map(row => row.id))}>Keep displayed order</button><label className="flex items-center gap-2 text-[11px]"><input type="checkbox" checked={showTravel} onChange={event => setShowTravel(event.target.checked)} className="accent-blue-600" />Show travel columns</label><p className="text-[10px] leading-relaxed text-slate-400">Drag any row or use its arrows. Suggestions use suburb locations; road distances are checked after ordering.</p></section>
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-3"><h3 className="flex items-center gap-2 text-xs font-bold"><Home className="h-3.5 w-3.5 text-blue-600" />Base</h3><p className="mt-2 text-[10px] leading-relaxed text-slate-500">{DISPATCH_BASE_ADDRESS}</p></section>
      </aside>
      <main className="min-w-0 space-y-4">
        <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">{[
          ["Visible leads", String(rows.length), `${rows.filter(row => !row.booking).length} ready to book`],
          ["Planned route distance", `${totals.estimated ? "~" : ""}${totals.km.toFixed(1)} km`, totals.missing ? "Partial · missing locations" : "Includes return to base"],
          ["Travel time", formatDuration(totals.minutes), totals.estimated ? "Includes estimated legs" : "Road travel estimate"],
          ["Booked work", formatDuration(totals.work), `${rows.filter(row => row.booking).length} selected visits`],
        ].map(([label, value, detail]) => <div key={label} className={`${panel} p-3`}><p className="text-[10px] font-semibold text-slate-500">{label}</p><p className="mt-2 text-xl font-bold">{value}</p><p className="mt-1 text-[10px] text-slate-400">{detail}</p></div>)}</div>
        <section className={`${panel} overflow-hidden`}><div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3"><div><h3 className="text-sm font-bold">Dispatch worklist</h3><p className="mt-1 text-[10px] text-slate-400">{zoneIds.filter(id => id !== "unlocated").join(" · ") || "No geographic zones selected"} · Planning order does not change appointment times or staff</p></div><div className="flex items-center gap-3 text-[11px]"><span className="text-blue-600">{chosen.length} selected</span><button className="text-slate-500" onClick={() => setSelected([])}>Clear</button></div></div>
          {showTravel && <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[10px] text-slate-500">{measuring && <Loader2 className="h-3 w-3 animate-spin" />}{measuring ? "Checking road distances…" : roadError || "Road distances use saved addresses. Values marked ~ are suburb estimates; travel times exclude live traffic."}</div>}
          {leadsLoading ? <p role="status" className="p-10 text-center text-sm text-slate-500">Loading leads…</p> : !rows.length ? <div className="p-10 text-center"><MapPin className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-semibold">No leads match this zone and filter</p><p className="mt-1 text-xs text-slate-400">Select another zone or reset the filters above.</p></div> : <div className="max-h-[72vh] overflow-auto">
            <table className={`w-full table-fixed text-left text-[11px] ${showTravel ? "min-w-[1130px]" : "min-w-[990px]"}`} aria-label="Unified dispatch worklist"><colgroup><col style={{ width: 34 }} /><col style={{ width: 68 }} /><col style={{ width: 175 }} /><col style={{ width: 130 }} />{showTravel && <col style={{ width: 140 }} />}<col style={{ width: 190 }} /><col style={{ width: 190 }} /><col style={{ width: 203 }} /></colgroup>
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] uppercase text-slate-500"><tr><th className="px-3 py-3"><input type="checkbox" aria-label="Select all visible leads" className="accent-blue-600" checked={chosen.length === rows.length && !!rows.length} onChange={event => setSelected(event.target.checked ? rows.map(row => row.id) : [])} /></th><th className="p-2">Order</th><th className="p-3">Customer</th><th className="p-3">Area / zone</th>{showTravel && <th className="p-3">Base / previous</th>}<th className="p-3">Booking / staff</th><th className="p-3">Status</th><th className="sticky right-0 border-l border-slate-200 bg-slate-50 p-3 text-right">Actions</th></tr></thead>
              <tbody>{distances.map((entry, index) => {
                const { row } = entry, booking = row.booking, key = booking && workBookingKey(booking), selectedRow = selected.includes(row.id);
                const closed = ["Lost", "Cancelled"].includes(row.lead.status);
                const candidates = workBookingCandidates(row).filter(visit => (visitType === "all" || visit.type === visitType)
                  && (staffFilter === "all" || ((visit.type === "job" ? visit.technician : visit.assigned) || "unassigned").toLowerCase() === staffFilter)
                  && (dateMode === "all" || (validDates && visit.date <= to && (visit.endAt?.slice(0, 10) || visit.date) >= from)));
                return <tr key={row.id} data-dispatch-row={row.id} data-lead-id={row.id} className={`border-b border-slate-100 ${dragged === row.id ? "bg-blue-100/70" : selectedRow ? "bg-blue-50/70" : "hover:bg-slate-50/60"}`} onDragOver={event => { if (dragged) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; } }} onDrop={event => { event.preventDefault(); if (dragged) move(dragged, row.id); setDragged(null); }}>
                  <td className="px-3 py-3 align-middle"><input type="checkbox" className="accent-blue-600" aria-label={`Select lead ${row.id}`} checked={selectedRow} onChange={() => setSelected(ids => ids.includes(row.id) ? ids.filter(id => id !== row.id) : [...ids, row.id])} /></td>
                  <td className="p-2 align-middle"><div className="flex items-center gap-1"><button draggable={loaded && !busy} disabled={!loaded || busy} aria-label={`Drag lead ${row.id}`} title="Drag to reorder this worklist" className="touch-none cursor-grab rounded p-0.5 text-slate-400 active:cursor-grabbing disabled:opacity-30" onDragStart={event => { setDragged(row.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", row.id); }} onDragEnd={() => setDragged(null)}
                    onPointerDown={event => { if (event.pointerType === "mouse" || !loaded || busy) return; touchDrag.current = { id: row.id, target: row.id }; setDragged(row.id); event.currentTarget.setPointerCapture(event.pointerId); }}
                    onPointerMove={event => { if (!touchDrag.current) return; const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("tr[data-dispatch-row]"); if (target?.dataset.dispatchRow) touchDrag.current.target = target.dataset.dispatchRow; const container = event.currentTarget.closest("div.overflow-auto"); if (container) { const bounds = container.getBoundingClientRect(); if (event.clientY > bounds.bottom - 45) container.scrollTop += 15; else if (event.clientY < bounds.top + 65) container.scrollTop -= 15; } }}
                    onPointerUp={() => { if (touchDrag.current) move(touchDrag.current.id, touchDrag.current.target); touchDrag.current = null; setDragged(null); }} onPointerCancel={() => { touchDrag.current = null; setDragged(null); }}><GripVertical className="h-3.5 w-3.5" /></button><span className="min-w-3 font-semibold text-slate-500">{index + 1}</span><span className="flex flex-col"><button aria-label={`Move ${row.id} up`} disabled={!loaded || busy || !index} className="p-0.5 text-slate-400 disabled:opacity-20" onClick={() => move(row.id, rows[index - 1].id)}><ArrowUp className="h-3 w-3" /></button><button aria-label={`Move ${row.id} down`} disabled={!loaded || busy || index === rows.length - 1} className="p-0.5 text-slate-400 disabled:opacity-20" onClick={() => move(row.id, rows[index + 1].id)}><ArrowDown className="h-3 w-3" /></button></span></div></td>
                  <td className="p-3 align-middle"><button className="font-bold text-blue-700 hover:underline" aria-label={`View lead ${row.id}`} onClick={() => openJobCard(row.lead)}>{ref(row.lead)}</button><p className="mt-1 truncate font-semibold" title={row.lead.name}>{row.lead.name || "Name missing"}</p><p className="mt-0.5 truncate text-[10px] text-slate-400" title={row.lead.phone || row.lead.email}>{row.lead.phone || row.lead.email || "Contact missing"}</p>{row.group && <span className="mt-1 inline-block max-w-full truncate rounded bg-violet-50 px-1.5 py-0.5 text-[9px] text-violet-700">{row.group}</span>}</td>
                  <td className="p-3 align-middle"><div className="flex items-center gap-2"><ZoneBadge zone={row.zone} /><span className="truncate capitalize">{row.point?.label || row.lead.city || "Unlocated"}</span></div><p className="mt-1 truncate text-[10px] text-slate-400" title={workAddress(row)}>{workAddress(row) || "Address missing"}</p></td>
                  {showTravel && <td className="p-3 align-middle"><p className="font-semibold">{distanceLabel(entry.fromBase)} <span className="text-[9px] font-normal text-slate-400">base</span></p><p className="mt-1 font-semibold text-blue-700">{distanceLabel(entry.fromPrevious)} <span className="text-[9px] font-normal text-slate-400">{index ? "previous" : "first stop"}</span></p><p className="mt-0.5 text-[9px] text-slate-400">{entry.fromPrevious.minutes === null ? "Travel unavailable" : `${entry.fromPrevious.minutes} min${entry.fromPrevious.road ? " · road" : " · estimate"}`}</p></td>}
                  <td className="p-3 align-middle">{booking ? <><p className="font-semibold">{booking.type === "job" ? "Job" : "Inspection"} · {formatApptTime(`${booking.date}T${booking.time}`)}</p><p className="mt-1 text-[10px] text-slate-500">{formatApptDate(`${booking.date}T${booking.time}`)} · {formatDuration(workMinutes(booking))}</p><p className="mt-0.5 truncate text-[10px] text-slate-400">{(booking.type === "job" ? booking.technician : booking.assigned) || "Unassigned"}</p>{candidates.length > 1 && <select aria-label={`Select visit for ${row.id}`} className="mt-1 w-full min-w-0 rounded border border-slate-200 px-1 py-1 text-[9px]" value={key} onChange={event => setChoices(current => ({ ...current, [row.id]: event.target.value }))}>{candidates.map(visit => <option key={workBookingKey(visit)} value={workBookingKey(visit)}>{visit.type} · {visit.date} {visit.time} · {(visit.type === "job" ? visit.technician : visit.assigned) || "Unassigned"}</option>)}</select>}</> : <><span className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">Unbooked</span><p className="mt-2 text-[10px] text-slate-400">Choose Inspection or Job to book</p></>}{row.bookings.length > 0 && <button className="mt-1 text-[9px] text-blue-600" onClick={() => setHistoryId(row.id)}>{row.bookings.length} saved visit{row.bookings.length === 1 ? "" : "s"}</button>}</td>
                  <td className="p-3 align-middle"><span className="inline-block rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold">{dispatchLeadStage(row.lead.status)?.label || row.lead.status}</span>{booking && <div className="mt-2"><BookingStatusControl leadId={row.id} booking={booking} disabled={busy} compact /></div>}</td>
                  <td className={`sticky right-0 border-l border-slate-100 p-3 align-middle ${selectedRow ? "bg-blue-50" : "bg-white"}`}><div className="flex justify-end gap-1"><button className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1.5 text-[10px] font-semibold text-blue-700 disabled:opacity-40" aria-label={`Book inspection for ${row.id}`} disabled={busy || closed} onClick={() => setCreate({ ids: [row.id], index: 0, type: "inspection" })}><Plus className="mr-0.5 inline h-3 w-3" />Inspection</button><button className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1.5 text-[10px] font-semibold text-emerald-700 disabled:opacity-40" aria-label={`Book job for ${row.id}`} disabled={busy || closed} onClick={() => setCreate({ ids: [row.id], index: 0, type: "job" })}><Plus className="mr-0.5 inline h-3 w-3" />Job</button></div><div className="mt-2 flex items-center justify-end gap-1">{booking && <button className="rounded p-1.5 text-blue-600 hover:bg-blue-50 disabled:opacity-40" aria-label={`Reschedule ${row.id}`} title="Reschedule or reassign this selected visit" disabled={busy || closed} onClick={() => void openEditor([{ lead: row.lead, booking }])}><CalendarClock className="h-3.5 w-3.5" /></button>}<button className="rounded p-1.5 text-slate-400 hover:bg-slate-100" aria-label={`Edit lead ${row.id}`} title="Edit lead details" onClick={() => { setEditingLead(row.lead); setLeadModalOpen(true); }}><Pencil className="h-3.5 w-3.5" /></button><button className="rounded p-1.5 text-slate-400 hover:bg-slate-100" aria-label={`Open customer ${row.id}`} title="View customer" onClick={() => openJobCard(row.lead)}><Eye className="h-3.5 w-3.5" /></button>{booking && <button className="rounded p-1.5 text-rose-400 hover:bg-rose-50 disabled:opacity-40" aria-label={`Cancel booking ${row.id}`} title="Cancel selected visit" disabled={busy || closed} onClick={() => { setError(""); setCancel({ lead: row.lead, booking }); }}><Trash2 className="h-3.5 w-3.5" /></button>}</div></td>
                </tr>;
              })}</tbody>
            </table>
          </div>}
          {!!last && showTravel && <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 text-[10px] text-slate-500"><Home className="h-3.5 w-3.5" />Return to base<span className="ml-auto font-semibold">{distanceLabel(last.returnToBase)} · {last.returnToBase.minutes === null ? "Travel unavailable" : `${last.returnToBase.minutes} min`}</span></div>}
        </section>
        {!!rows.length && <section className={`${panel} p-3`}><h3 className="mb-2 text-xs font-bold">Route preview · same worklist order</h3><div className="flex items-center gap-2 overflow-x-auto pb-1"><span className="shrink-0 rounded-lg bg-slate-100 p-3 text-[10px]"><Home className="mb-1 h-3.5 w-3.5" />Base</span>{distances.map((entry, index) => <div className="flex shrink-0 items-center gap-2" key={entry.row.id}><span className="text-center text-[9px] text-slate-400">→<br />{showTravel && distanceLabel(entry.fromPrevious)}</span><button className="min-w-24 rounded-lg border p-2 text-left" style={{ backgroundColor: `${zoneInfo(entry.row.zone).color}08`, borderColor: `${zoneInfo(entry.row.zone).color}30` }} onClick={() => openJobCard(entry.row.lead)}><span className="text-[10px] font-bold">{index + 1}. {ref(entry.row.lead)}</span><p className="mt-1 max-w-32 truncate text-[9px] capitalize">{entry.row.point?.label || workAddress(entry.row)}</p></button></div>)}<span className="shrink-0 text-[10px] text-slate-400">→</span><span className="shrink-0 rounded-lg bg-blue-50 p-3 text-[10px] text-blue-700"><Home className="mb-1 h-3.5 w-3.5" />Base</span></div></section>}
        <section className={`${panel} p-3`}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-bold">Actions for selected rows</h3><p className="text-[10px] text-slate-400">{chosen.filter(row => row.booking).length} booked · {chosen.filter(row => !row.booking).length} unbooked</p></div><div className="mt-3 flex flex-wrap gap-2"><button className={button} disabled={!chosen.length || busy} onClick={() => setCreate({ ids: chosen.map(row => row.id), index: 0, type: "inspection" })}><Plus className="h-3.5 w-3.5" />Book inspections</button><button className={button} disabled={!chosen.length || busy} onClick={() => setCreate({ ids: chosen.map(row => row.id), index: 0, type: "job" })}><Plus className="h-3.5 w-3.5" />Book jobs</button><button className={button} disabled={!chosen.some(row => row.booking) || busy} onClick={() => void openEditor(chosen.filter((row): row is WorkRow & { booking: LeadBooking } => !!row.booking).map(row => ({ lead: row.lead, booking: row.booking })))}><CalendarClock className="h-3.5 w-3.5" />Reschedule / reassign</button><button className={button} disabled={!chosen.length || !loaded || busy} onClick={() => { setNewZone("auto"); setMetadata("zone"); }}><MapPin className="h-3.5 w-3.5" />Change zone</button><button className={button} disabled={chosen.length < 2 || !loaded || busy} onClick={() => { setGroupName(""); setMetadata("group"); }}><Layers className="h-3.5 w-3.5" />Group</button><button className={button} disabled={!chosen.some(row => row.group) || !loaded || busy} onClick={() => applyMetadata(true)}>Ungroup</button></div><p className="mt-2 text-[10px] text-slate-400">Booking actions review each customer/visit before saving. Dragging, grouping and saving this plan send no customer email or SMS.</p></section>
      </main>
    </div>
    {opening && <div role="status" className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs text-white shadow-xl"><Loader2 className="h-4 w-4 animate-spin" />Opening selected visit…</div>}
    {create && <DispatchBookingModal key={`${create.ids[create.index] || "new"}:${create.index}`} initialLeadId={create.ids[create.index]} initialType={create.type} date={dateMode === "range" && validDates && from >= todayAU() ? from : todayAU()} time="09:00" onClose={() => setCreate(null)} onBooked={(_date, message) => { setNotice(message); if (create.index + 1 < create.ids.length) setCreate({ ...create, index: create.index + 1 }); else { setCreate(null); setSelected([]); } }} />}
    {editing && <EditBookingModal key={`${editing.lead.id}:${workBookingKey(editing.booking)}`} lead={editing.lead} type={editing.booking.type} onClose={() => { setEditing(null); setEditQueue([]); }} onSaved={(_date, message) => { setNotice(message); setEditing(null); if (editQueue.length) void openEditor(editQueue); else setSelected([]); }} />}
    {cancel && <Dialog title="Cancel selected visit?" busy={cancelling} onClose={() => setCancel(null)}><p className="text-sm font-semibold">{ref(cancel.lead)} · {cancel.lead.name}</p><p className="mt-2 text-xs text-slate-500">{cancel.booking.type} · {formatApptDate(`${cancel.booking.date}T${cancel.booking.time}`)} · {formatApptTime(`${cancel.booking.date}T${cancel.booking.time}`)}</p><p className="mt-3 text-xs text-slate-500">Cancels this whole visit, including continued days. Other visits and the customer record are retained.</p>{error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}<div className="mt-5 flex justify-end gap-2"><button className={button} disabled={cancelling} onClick={() => setCancel(null)}>Keep visit</button><button className={`${button} !bg-rose-600 !text-white`} disabled={cancelling} onClick={() => void cancelBooking()}>Cancel visit</button></div></Dialog>}
    {history && <Dialog title={`${ref(history.lead)} · saved visits`} onClose={() => setHistoryId(null)}><div className="space-y-2">{history.bookings.map(booking => <div className="rounded-lg border border-slate-200 p-3" key={workBookingKey(booking)}><p className="text-xs font-semibold">{booking.type} · {formatApptDate(`${booking.date}T${booking.time}`)} · {formatApptTime(`${booking.date}T${booking.time}`)}</p><p className="mt-1 text-[10px] text-slate-500">{booking.status} · {(booking.type === "job" ? booking.technician : booking.assigned) || "Unassigned"}</p><button className={`${button} mt-2`} disabled={busy || booking.status === "Cancelled"} onClick={() => void openEditor([{ lead: history.lead, booking }])}>Edit this visit</button></div>)}</div></Dialog>}
    {metadata && <Dialog title={metadata === "zone" ? "Change dispatch zone" : "Group selected leads"} onClose={() => setMetadata(null)}><p className="mb-4 text-xs text-slate-500">{chosen.length} selected leads. These changes belong to the dispatch plan; customer service-area rules are managed in Settings.</p>{metadata === "zone" ? <select aria-label="Dispatch zone" className={`${field} w-full`} value={newZone} onChange={event => setNewZone(event.target.value as DispatchZone | "auto")}><option value="auto">Automatic from address</option>{DISPATCH_ZONES.map(zone => <option key={zone.id} value={zone.id}>{zone.id} · {zone.name}</option>)}</select> : <label className="text-xs font-semibold">Group name<input className={`${field} mt-2 w-full`} maxLength={60} value={groupName} onChange={event => setGroupName(event.target.value)} /></label>}<div className="mt-5 flex justify-end gap-2"><button className={button} onClick={() => setMetadata(null)}>Cancel</button><button className={`${button} !bg-blue-600 !text-white`} disabled={!chosen.length || (metadata === "group" && !groupName.trim())} onClick={() => applyMetadata()}>Apply to plan</button></div></Dialog>}
  </div>;
}
