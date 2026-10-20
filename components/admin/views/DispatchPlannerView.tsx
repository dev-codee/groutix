"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUp, CalendarClock, Check, ChevronLeft, ChevronRight, Download, Eye, GripVertical, Home, Layers, Loader2, MapPin, Plus, RefreshCw, Save, Search, Settings2, Trash2, Truck, Users, WandSparkles, X } from "lucide-react";
import { useAdminPageCtx } from "../AdminPageContext";
import { DispatchBookingModal } from "../modals/DispatchBookingModal";
import { EditBookingModal } from "../modals/EditBookingModal";
import { BookingStatusControl } from "../BookingStatusControl";
import type { Lead } from "../types";
import type { DayAppointment } from "@/lib/bookings";
import { bookingLead, leadBookings, type LeadBooking } from "@/lib/leadBookings";
import { todayAU, addDaysYmd, formatApptDate, formatApptTime } from "@/lib/scheduling";
import { useZoneRules } from "@/lib/useZoneRules";
import { appointmentKey, validScheduleDate } from "@/lib/scheduleRoutes";
import { DISPATCH_BASE_ADDRESS, DISPATCH_ZONES, dispatchBase, dispatchStop, emptyDispatchPlan, mergeDispatchOrder, routeLanes, sortDispatchStops, stopMinutes, travelLeg, validDispatchPlan, type DispatchPlan, type DispatchStop, type DispatchZone, type PlannerSort } from "@/lib/dispatchPlanner";

const button = "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
const field = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-2 focus:outline-blue-500 disabled:opacity-50";
const panel = "rounded-xl border border-slate-200 bg-white shadow-xs";
const duration = (minutes: number) => `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}h ` : ""}${minutes % 60 || !minutes ? `${minutes % 60}m` : ""}`.trim();
const zoneInfo = (id: DispatchZone) => DISPATCH_ZONES.find(zone => zone.id === id)!;
const reference = (stop: DispatchStop) => stop.jobNo || stop.leadId.slice(-6).toUpperCase();
const draftKey = (username: string) => `groutix:dispatch-drafts:v1:${username}`;
function persistDrafts(username: string, dates: string[], plans: Record<string, DispatchPlan>, snapshots: Record<string, string[]>) {
  try {
    if (!dates.length) window.sessionStorage.removeItem(draftKey(username));
    else window.sessionStorage.setItem(draftKey(username), JSON.stringify({
      plans: Object.fromEntries(dates.map(date => [date, plans[date]])),
      snapshots: Object.fromEntries(dates.map(date => [date, snapshots[date]])),
    }));
  } catch { /* Shared saves remain available when browser session storage is disabled. */ }
}
function selectedBooking(stop: DispatchStop): LeadBooking {
  const start = stop.bookingStart || `${stop.date}T${stop.time}`;
  return { ...stop, date: start.slice(0, 10), time: start.slice(11, 16), status: stop.status as LeadBooking["status"] };
}
function ZoneBadge({ id }: { id: DispatchZone }) {
  const zone = zoneInfo(id);
  return <span title={`${zone.name} · ${zone.direction}`} className="inline-flex min-w-8 items-center justify-center rounded-md border px-1.5 py-1 text-[11px] font-bold" style={{ color: zone.color, backgroundColor: `${zone.color}10`, borderColor: `${zone.color}30` }}>{id === "unlocated" ? "?" : id}</span>;
}
function Dialog({ title, onClose, children, busy = false }: { title: string; onClose: () => void; children: ReactNode; busy?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    return () => previous?.focus();
  }, []);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onKeyDown={event => {
    if (event.key === "Escape" && !busy) onClose();
    if (event.key === "Tab") {
      const elements = ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]');
      if (!elements?.length) return;
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { event.preventDefault(); first.focus(); }
    }
  }}>
    <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl outline-none">
      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-bold text-slate-900">{title}</h2><button type="button" className={button} aria-label="Close dialog" disabled={busy} onClick={onClose}><X className="h-4 w-4" /></button></div>{children}
    </div>
  </div>;
}

export function DispatchPlannerView() {
  const { scopedLeads, upsertLead, openJobCard, assignableTechnicians, inspectionStaff, loading: leadsLoading, username } = useAdminPageCtx();
  const zoneRules = useZoneRules();
  const [from, setFrom] = useState(todayAU);
  const [to, setTo] = useState(todayAU);
  const [appointments, setAppointments] = useState<DayAppointment[]>([]);
  const [plans, setPlans] = useState<Record<string, DispatchPlan>>({});
  const [dirty, setDirty] = useState<string[]>([]);
  const dirtyRef = useRef<string[]>([]);
  const plansRef = useRef(plans);
  const draftSnapshots = useRef<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  const [rangeLoaded, setRangeLoaded] = useState("");
  const [zoneIds, setZoneIds] = useState<DispatchZone[]>(DISPATCH_ZONES.map(zone => zone.id));
  const [zoneTab, setZoneTab] = useState<"all" | "inner" | "outer">("all");
  const [crewFilter, setCrewFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<PlannerSort>("manual");
  const [showTravel, setShowTravel] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [dragged, setDragged] = useState<string | null>(null);
  const [create, setCreate] = useState(false);
  const [editor, setEditor] = useState<{ stops: DispatchStop[]; index: number; purpose: string } | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [opening, setOpening] = useState(false);
  const [metadata, setMetadata] = useState<"zone" | "group" | null>(null);
  const [newZone, setNewZone] = useState<DispatchZone | "auto">("auto");
  const [groupName, setGroupName] = useState("");
  const [cancelStop, setCancelStop] = useState<DispatchStop | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [discard, setDiscard] = useState(false);
  const busy = saving || opening || cancelling;
  const validRange = validScheduleDate(from) && validScheduleDate(to) && to >= from && (Date.parse(to) - Date.parse(from)) / 86400000 <= 30;
  const ready = validRange && rangeLoaded === `${from}:${to}` && !loading;

  useEffect(() => {
    let active = true;
    // Recover the same user's draft when returning from another CRM page.
    void Promise.resolve().then(() => {
      if (!active) return;
      try {
        const cached = JSON.parse(window.sessionStorage.getItem(draftKey(username)) || "null");
        if (!cached?.plans || !cached?.snapshots) return;
        const recovered = Object.entries(cached.plans).filter(([date, plan]) => validScheduleDate(date) && validDispatchPlan(plan)
          && Array.isArray(cached.snapshots[date]) && cached.snapshots[date].every((id: unknown) => typeof id === "string" && id.length <= 250));
        if (!recovered.length) return;
        const next = Object.fromEntries(recovered) as Record<string, DispatchPlan>;
        plansRef.current = next; dirtyRef.current = Object.keys(next);
        draftSnapshots.current = Object.fromEntries(recovered.map(([date]) => [date, cached.snapshots[date]]));
        setPlans(next); setDirty(Object.keys(next)); setNotice("Your unsaved dispatch changes were restored. Review and save the plan, or discard them.");
      } catch { /* A damaged or unavailable browser draft must not block live bookings. */ }
    });
    return () => { active = false; };
  }, [username]);
  useEffect(() => {
    if (!validRange || saving) return;
    const controller = new AbortController();
    async function load() {
      // Begin after the current render; cancellation also covers rapid date/filter navigation.
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setLoading(true);
      await fetch(`/api/admin/dispatch-planner?from=${from}&to=${to}`, { cache: "no-store", signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not load dispatch."); return data; })
      .then(data => {
        if (controller.signal.aborted) return;
        setAppointments(data.appointments); setLoadError("");
        const next = { ...data.plans } as Record<string, DispatchPlan>;
        for (const date of dirtyRef.current) if (plansRef.current[date]) next[date] = plansRef.current[date];
        plansRef.current = next; setPlans(next); setRangeLoaded(`${from}:${to}`);
      })
      .catch(err => { if (!controller.signal.aborted) { setRangeLoaded(""); setLoadError(err instanceof Error ? err.message : "Could not load dispatch."); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }
    void load();
    return () => controller.abort();
  }, [from, to, validRange, reload, username, scopedLeads, saving]);
  useEffect(() => {
    if (!dirty.length) return;
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty.length]);

  const allStops = useMemo(() => appointments.map(appointment => dispatchStop(appointment, plans[appointment.date] || emptyDispatchPlan(), zoneRules.flexRadiusKm)), [appointments, plans, zoneRules.flexRadiusKm]);
  const filtered = useMemo(() => allStops.filter(stop =>
    (crewFilter === "all" || stop.crewKey === crewFilter) && (typeFilter === "all" || stop.type === typeFilter)
    && (statusFilter === "all" || stop.status === statusFilter)
    && `${stop.name} ${stop.jobNo || ""} ${stop.address || ""} ${stop.suburb || ""} ${stop.crew} ${stop.group || ""}`.toLowerCase().includes(query.trim().toLowerCase())), [allStops, crewFilter, typeFilter, statusFilter, query]);
  const stops = useMemo(() => sortDispatchStops(filtered.filter(stop => zoneIds.includes(stop.zone)), sort, plans), [filtered, zoneIds, sort, plans]);
  const lanes = useMemo(() => routeLanes(stops), [stops]);
  const chosen = stops.filter(stop => selected.includes(stop.id));
  const chosenVisits = [...new Map(chosen.map(stop => [`${stop.leadId}:${stop.type}:${stop.bookingId || stop.bookingStart || `${stop.date}T${stop.time}`}`, stop])).values()];
  const crews = [...new Map(allStops.map(stop => [stop.crewKey, stop.crew])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const statuses = [...new Set(allStops.map(stop => stop.status).filter(Boolean))] as string[];
  const zoneCounts = new Map(DISPATCH_ZONES.map(zone => [zone.id, filtered.filter(stop => stop.zone === zone.id).length]));
  const summary = lanes.reduce((sum, lane) => {
    const points = [dispatchBase, ...lane.map(stop => stop.point), dispatchBase];
    points.slice(1).forEach((point, index) => {
      const leg = travelLeg(points[index], point);
      if (leg) { sum.km += leg.km; sum.minutes += leg.minutes; }
    });
    sum.work += lane.reduce((minutes, stop) => minutes + stopMinutes(stop), 0);
    sum.missing += lane.filter(stop => !stop.point).length;
    return sum;
  }, { km: 0, minutes: 0, work: 0, missing: 0 });

  function changePlan(date: string, update: (plan: DispatchPlan) => DispatchPlan) {
    if (!dirtyRef.current.includes(date)) draftSnapshots.current[date] = appointments.filter(stop => stop.date === date).map(appointmentKey);
    const next = { ...plansRef.current, [date]: update(plansRef.current[date] || emptyDispatchPlan()) };
    plansRef.current = next; setPlans(next);
    const dates = [...new Set([...dirtyRef.current, date])];
    dirtyRef.current = dates; setDirty(dates); setNotice("");
    persistDrafts(username, dates, next, draftSnapshots.current);
  }
  function rememberOrder(ordered: DispatchStop[]) {
    for (const date of new Set(ordered.map(stop => stop.date))) {
      const visibleIds = ordered.filter(stop => stop.date === date).map(stop => stop.id);
      changePlan(date, plan => {
        const currentIds = allStops.filter(stop => stop.date === date).map(stop => stop.id);
        const existing = [...plan.order.filter(id => currentIds.includes(id)), ...currentIds.filter(id => !plan.order.includes(id))];
        return { ...plan, order: mergeDispatchOrder(existing, visibleIds) };
      });
    }
    setSort("manual");
  }
  function moveStop(id: string, targetId: string) {
    const lane = lanes.find(lane => lane.some(stop => stop.id === id));
    if (!lane || !lane.some(stop => stop.id === targetId) || id === targetId) return;
    const changed = [...stops];
    const start = changed.findIndex(stop => stop.id === id), target = changed.findIndex(stop => stop.id === targetId);
    const [moving] = changed.splice(start, 1); changed.splice(target, 0, moving);
    rememberOrder(changed);
  }
  async function savePlans() {
    if (busy || !ready) return;
    setSaving(true); setError(""); let savedCount = 0;
    try {
      for (const date of [...dirtyRef.current]) {
        const plan = plansRef.current[date];
        const ids = draftSnapshots.current[date] || [];
        // Remove metadata for visits that were cancelled or moved since the draft.
        const clean: DispatchPlan = { ...plan, order: plan.order.filter(id => ids.includes(id)),
          zones: Object.fromEntries(Object.entries(plan.zones).filter(([id]) => ids.includes(id))),
          groups: Object.fromEntries(Object.entries(plan.groups).filter(([id]) => ids.includes(id))) };
        const response = await fetch("/api/admin/dispatch-planner", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, snapshot: ids, plan: clean }) });
        const data = await response.json();
        if (!response.ok) throw new Error(`${data.error || "Could not save the dispatch plan."}${response.status === 409 ? " Use Discard changes to reload the shared plan before reapplying your edits." : ""}`);
        const next = { ...plansRef.current, [date]: data.plan }; plansRef.current = next; setPlans(next);
        dirtyRef.current = dirtyRef.current.filter(item => item !== date); setDirty([...dirtyRef.current]); savedCount++;
        persistDrafts(username, dirtyRef.current, next, draftSnapshots.current);
      }
      setNotice(`Dispatch plan saved for ${savedCount} ${savedCount === 1 ? "day" : "days"}.`);
    } catch (err) { setError(`${savedCount ? `${savedCount} day(s) saved. ` : ""}${err instanceof Error ? err.message : "Could not save."}`); }
    finally { setSaving(false); }
  }
  const resolveLead = useCallback(async (stop: DispatchStop) => {
    const response = await fetch(`/api/admin/submissions/${stop.leadId}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.item) throw new Error(data.error || "This customer could not be loaded. Refresh bookings.");
    const lead = data.item as Lead;
    const original = selectedBooking(stop);
    const current = leadBookings(lead).find(booking => booking.type === original.type && `${booking.date}T${booking.time}` === `${original.date}T${original.time}` && (!original.bookingId || booking.bookingId === original.bookingId));
    if (!current || current.status === "Cancelled" || ["Lost", "Cancelled"].includes(lead.status)) throw new Error("This booking has changed. Refresh bookings before editing.");
    return lead;
  }, []);
  async function openEditor(queue: DispatchStop[], purpose: string) {
    if (!queue.length || busy) return;
    setOpening(true); setError("");
    try {
      const lead = await resolveLead(queue[0]);
      setEditingLead(bookingLead(lead, selectedBooking(queue[0])));
      setEditor({ stops: queue, index: 0, purpose });
    } catch (err) { setError(err instanceof Error ? err.message : "Could not open the booking."); }
    finally { setOpening(false); }
  }
  async function nextEditor(message: string) {
    setNotice(message); setReload(value => value + 1);
    if (!editor || editor.index + 1 >= editor.stops.length) { setEditor(null); setEditingLead(null); setSelected([]); return; }
    const index = editor.index + 1, stop = editor.stops[index];
    setEditor(null); setEditingLead(null); setOpening(true);
    try {
      const lead = await resolveLead(stop);
      setEditingLead(bookingLead(lead, selectedBooking(stop))); setEditor({ ...editor, index });
    } catch (err) { setError(`Previous booking saved. ${err instanceof Error ? err.message : "Could not open the next booking."}`); }
    finally { setOpening(false); }
  }
  function applyMetadata() {
    if (!chosen.length || (metadata === "group" && !groupName.trim())) return;
    for (const date of new Set(chosen.map(stop => stop.date))) {
      changePlan(date, plan => {
        const zones = { ...plan.zones }, groups = { ...plan.groups };
        chosen.filter(stop => stop.date === date).forEach(stop => {
          if (metadata === "zone") { if (newZone === "auto") delete zones[stop.id]; else zones[stop.id] = newZone; }
          else groups[stop.id] = groupName.trim();
        });
        return { ...plan, zones, groups };
      });
    }
    if (metadata === "zone" && newZone !== "auto") setZoneIds(ids => [...new Set([...ids, newZone])]);
    setMetadata(null); setNotice("Plan updated. Save the plan to share these changes.");
  }
  function ungroup() {
    for (const date of new Set(chosen.map(stop => stop.date))) changePlan(date, plan => {
      const groups = { ...plan.groups }; chosen.filter(stop => stop.date === date).forEach(stop => delete groups[stop.id]); return { ...plan, groups };
    });
  }
  async function cancelBooking() {
    if (!cancelStop || cancelling) return;
    setCancelling(true); setError("");
    try {
      const booking = selectedBooking(cancelStop);
      const response = await fetch(`/api/admin/submissions/${cancelStop.leadId}/bookings`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: booking.type, bookingId: booking.bookingId, start: `${booking.date}T${booking.time}`, status: "Cancelled" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not cancel this booking.");
      upsertLead(data.item); setCancelStop(null); setReload(value => value + 1); setNotice("Booking cancelled. The customer record and other bookings are retained.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not cancel the booking."); }
    finally { setCancelling(false); }
  }
  function exportCsv() {
    const rows = [["Date", "Route order", "Reference", "Customer", "Address", "Zone", "Staff", "Type", "Time (Melbourne)", "Duration (min)", "Status", "Dispatch group", "Distance from base (estimated km)"],
      ...lanes.flatMap(lane => lane.map((stop, index) => [stop.date, index + 1, reference(stop), stop.name, stop.address, stop.zone, stop.crew, stop.type, stop.time, stopMinutes(stop), stop.status, stop.group, stop.baseKm]))];
    const csv = rows.map(row => row.map(cell => {
      let value = String(cell ?? ""); if (/^[=+@\-\t\r]/.test(value)) value = `'${value}`;
      return `"${value.replaceAll('"', '""')}"`;
    }).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a"); link.href = url; link.download = `dispatch-${from}-${to}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const availableZones = DISPATCH_ZONES.filter(zone => zone.id === "unlocated" ? (zoneCounts.get(zone.id) || 0) > 0 : zoneTab === "all" || (zoneTab === "inner" ? zone.inner : !zone.inner));

  return <div className="mx-auto w-full max-w-[1680px] space-y-4 pb-8 text-slate-800">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">Operations / Dispatch planner</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Plan the day. Keep jobs moving.</h2><p className="mt-1 text-xs text-slate-500">Bookings, service zones and crew routes · Melbourne time</p></div>
      <div className="flex flex-wrap gap-2"><button className={button} onClick={exportCsv} disabled={!ready || !stops.length}><Download className="h-4 w-4" />Export</button><button className={`${button} !border-blue-600 !bg-blue-600 !text-white hover:!bg-blue-700`} disabled={!ready || busy} onClick={() => setCreate(true)}><Plus className="h-4 w-4" />Book a visit</button></div>
    </div>

    <div className={`${panel} flex flex-wrap items-end gap-3 p-3`}>
      <div className="flex items-end gap-1"><button className={button} aria-label="Previous day" disabled={busy || !validRange} onClick={() => { setFrom(addDaysYmd(from, -1)); setTo(addDaysYmd(to, -1)); setSelected([]); }}><ChevronLeft className="h-4 w-4" /></button><label className="flex flex-col gap-1 text-[10px] font-semibold uppercase text-slate-500">From<input type="date" aria-label="Start date" className={field} value={from} disabled={busy} onChange={event => { setFrom(event.target.value); if (event.target.value > to) setTo(event.target.value); setSelected([]); }} /></label><label className="flex flex-col gap-1 text-[10px] font-semibold uppercase text-slate-500">To<input type="date" aria-label="End date" className={field} value={to} min={from} max={validScheduleDate(from) ? addDaysYmd(from, 30) : undefined} disabled={busy} onChange={event => { setTo(event.target.value); setSelected([]); }} /></label><button className={button} aria-label="Next day" disabled={busy || !validRange} onClick={() => { setFrom(addDaysYmd(from, 1)); setTo(addDaysYmd(to, 1)); setSelected([]); }}><ChevronRight className="h-4 w-4" /></button></div>
      <button className={button} disabled={busy} onClick={() => { setFrom(todayAU()); setTo(todayAU()); setSelected([]); }}>Today</button>
      <label className="flex min-w-36 flex-col gap-1 text-[10px] font-semibold uppercase text-slate-500">Staff<select aria-label="Filter by staff" className={field} value={crewFilter} onChange={event => setCrewFilter(event.target.value)}><option value="all">All staff</option>{crews.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase text-slate-500">Visit type<select aria-label="Filter by visit type" className={field} value={typeFilter} onChange={event => setTypeFilter(event.target.value)}><option value="all">All visits</option><option value="job">Jobs</option><option value="inspection">Inspections</option></select></label>
      <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase text-slate-500">Status<select aria-label="Filter by booking status" className={field} value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{statuses.map(status => <option key={status}>{status}</option>)}</select></label>
      <label className="relative min-w-40 flex-1"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" /><input type="search" className={`${field} w-full pl-8`} aria-label="Search bookings" placeholder="Search bookings or groups" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <button className={button} aria-label="Refresh bookings" disabled={loading || busy} onClick={() => setReload(value => value + 1)}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
    </div>
    {!validRange && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Choose a valid date range of up to 31 days.</p>}
    {(error || loadError) && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><p>{error || loadError}</p><button className={button} onClick={() => { setError(""); setReload(value => value + 1); }} disabled={busy || loading}>Reload bookings</button></div>}
    {notice && <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"><span className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0" />{notice}</span><button aria-label="Dismiss notice" onClick={() => setNotice("")}><X className="h-4 w-4" /></button></div>}
    {!!dirty.length && <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-medium text-amber-900">Unsaved dispatch changes · {dirty.length} {dirty.length === 1 ? "day" : "days"}. Route order does not change appointment times.</p><div className="flex gap-2"><button className={button} disabled={busy} onClick={() => setDiscard(true)}>Discard changes</button><button className={`${button} !border-slate-900 !bg-slate-900 !text-white`} disabled={!ready || busy} onClick={() => void savePlans()}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save plan</button></div></div>}

    <div className="grid items-start gap-4 xl:grid-cols-[235px_minmax(0,1fr)]">
      <aside className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <section className={`${panel} overflow-hidden`}>
          <div className="border-b border-slate-100 p-3"><h3 className="flex items-center gap-2 text-sm font-bold"><MapPin className="h-4 w-4 text-blue-600" />Service areas / zones</h3><div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">{(["all", "inner", "outer"] as const).map(tab => <button key={tab} aria-pressed={zoneTab === tab} className={`rounded-md py-1.5 text-[10px] font-bold ${zoneTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`} onClick={() => setZoneTab(tab)}>{tab === "all" ? "All" : tab === "inner" ? `≤ ${zoneRules.flexRadiusKm} km` : `> ${zoneRules.flexRadiusKm} km`}</button>)}</div></div>
          <div className="space-y-1 p-2">{availableZones.map(zone => <label key={zone.id} className="flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 transition hover:brightness-[.98]" style={{ backgroundColor: zoneIds.includes(zone.id) ? `${zone.color}0c` : "white", borderColor: zoneIds.includes(zone.id) ? `${zone.color}35` : "#f1f5f9" }}>
            <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={zoneIds.includes(zone.id)} onChange={() => setZoneIds(ids => ids.includes(zone.id) ? ids.filter(id => id !== zone.id) : [...ids, zone.id])} /><ZoneBadge id={zone.id} /><span className="min-w-0 flex-1"><span className="block text-[11px] font-bold">{zone.name}</span><span className="block text-[10px] text-slate-500">{zoneCounts.get(zone.id) || 0} visits</span></span>
          </label>)}</div>
          <div className="flex justify-between border-t border-slate-100 px-3 py-2"><button className="text-[11px] font-semibold text-blue-600" onClick={() => setZoneIds(DISPATCH_ZONES.map(zone => zone.id))}>Select all zones</button><button className="text-[11px] font-semibold text-slate-500" onClick={() => setZoneIds([])}>Clear zones</button></div>
        </section>
        <div className="space-y-3">
          <section className={`${panel} p-3`}><h3 className="flex items-center gap-2 text-xs font-bold"><Settings2 className="h-4 w-4 text-slate-500" />Sort & route options</h3><div className="mt-3 space-y-2.5">{([
            ["schedule", "Appointment time"], ["nearest", "Nearest to base first"], ["farthest", "Farthest from base first"], ["smart", "Smart route (estimated)"], ["manual", "Manual order"],
          ] as const).map(([value, label]) => <label key={value} className="flex cursor-pointer items-center gap-2 text-[11px]"><input type="radio" name="dispatch-sort" value={value} checked={sort === value} onChange={() => setSort(value)} className="accent-blue-600" />{label}</label>)}</div>
            <label className="mt-4 flex cursor-pointer items-center gap-2 border-t border-slate-100 pt-3 text-[11px]"><input type="checkbox" checked={showTravel} onChange={event => setShowTravel(event.target.checked)} className="accent-blue-600" />Show distance & travel time</label>
            <button className={`${button} mt-3 w-full !border-blue-200 !bg-blue-50 !text-blue-700`} disabled={!ready || stops.length < 2 || busy} onClick={() => { rememberOrder(sortDispatchStops(stops, "smart", plans)); setNotice("Route optimized by staff and day. Review timings, then save the plan."); }}><WandSparkles className="h-4 w-4" />Optimize route order</button>
            <button className={`${button} mt-2 w-full`} disabled={!ready || !stops.length || busy} onClick={() => rememberOrder(stops)}>Keep displayed order</button>
          </section>
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-center gap-2 text-xs font-bold"><Home className="h-4 w-4 text-blue-600" />Dispatch base</div><p className="mt-2 text-[11px] leading-relaxed text-slate-600">{DISPATCH_BASE_ADDRESS}</p><p className="mt-2 text-[10px] leading-relaxed text-slate-500">Zones and distances use suburb centres. Travel times are estimates, exclude live traffic, and include return to base for each crew/day.</p></section>
        </div>
      </aside>

      <main className="min-w-0 space-y-4" aria-busy={loading || busy}>
        <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">{[
          { label: "Visits in selected zones", value: ready ? String(stops.length) : "—", detail: `${lanes.length} crew / day routes`, icon: <Truck className="h-4 w-4" /> },
          { label: "Route distance · estimated", value: ready ? `${summary.km.toFixed(1)} km` : "—", detail: summary.missing ? "Partial · unlocated stops excluded" : "Includes outward & return travel", icon: <MapPin className="h-4 w-4" /> },
          { label: "Travel time · estimated", value: ready ? duration(summary.minutes) : "—", detail: "Across all displayed crew routes", icon: <ArrowRight className="h-4 w-4" /> },
          { label: "Booked work duration", value: ready ? duration(summary.work) : "—", detail: "Saved booking windows", icon: <CalendarClock className="h-4 w-4" /> },
        ].map(stat => <div key={stat.label} className={`${panel} p-3.5`}><div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-500">{stat.label}<span className="text-blue-500">{stat.icon}</span></div><p className="mt-2 text-xl font-bold tracking-tight text-slate-900">{stat.value}</p><p className="mt-1 text-[10px] text-slate-400">{stat.detail}</p></div>)}</div>
        <section className={`${panel} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-3"><div><h3 className="text-sm font-bold">Bookings in selected zones</h3><p className="mt-0.5 text-[10px] text-slate-500">{zoneIds.filter(id => id !== "unlocated").join(" + ") || "No geographic zones selected"}{zoneIds.includes("unlocated") ? " · unlocated included" : ""}</p></div><div className="flex items-center gap-3 text-xs"><span className="font-semibold text-blue-600">{chosen.length} selected</span><button className="text-slate-500 hover:text-slate-900" onClick={() => setSelected([])}>Clear selection</button></div></div>
          {loading && <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />Loading bookings…</div>}
          {!loading && !ready && <div className="p-8 text-center text-sm text-slate-500">Bookings are unavailable. Check the date range or retry loading.</div>}
          {ready && stops.length === 0 && <div className="p-10 text-center"><Layers className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold">No bookings match this view</p><p className="mt-1 text-xs text-slate-500">Choose another date, select zones, or adjust the filters.</p><button className={`${button} mt-4`} onClick={() => { setZoneIds(DISPATCH_ZONES.map(zone => zone.id)); setCrewFilter("all"); setTypeFilter("all"); setStatusFilter("all"); setQuery(""); }}>Reset filters</button></div>}
          {ready && !!stops.length && <div className="overflow-x-auto"><table className="w-full min-w-[1020px] border-collapse text-left text-[11px]"><thead className="bg-slate-50 text-[10px] text-slate-500"><tr><th className="w-9 px-3 py-2.5"><input type="checkbox" aria-label="Select all displayed bookings" checked={stops.length > 0 && chosen.length === stops.length} onChange={event => setSelected(event.target.checked ? stops.map(stop => stop.id) : [])} className="accent-blue-600" /></th><th className="p-2">Order</th><th className="p-2">Booking / Customer</th><th className="p-2">Suburb / Zone</th>{showTravel && <><th className="p-2">From base</th><th className="p-2">From previous</th></>}<th className="p-2">Date & time</th><th className="p-2">Duration</th><th className="p-2">Status</th><th className="p-2 text-right">Actions</th></tr></thead>
            {lanes.map(lane => <tbody key={`${lane[0].date}:${lane[0].crewKey}:${lane[0].id}`}>
              <tr className="border-y border-slate-200 bg-slate-100/80"><th colSpan={showTravel ? 10 : 8} className="px-3 py-2"><div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-[11px]"><Users className="h-3.5 w-3.5 text-blue-600" />{lane[0].crew}<span className="font-normal text-slate-500">· {formatApptDate(`${lane[0].date}T12:00`)} · {lane.length} visits</span></span><span className="text-[10px] font-normal text-slate-500">{sort === "manual" ? "Drag handle or use arrows to reorder" : "Route order preview"}</span></div></th></tr>
              {lane.map((stop, index) => {
                const previous = index ? lane[index - 1].point : dispatchBase;
                const leg = travelLeg(previous, stop.point);
                const next = lane[index + 1];
                const conflict = !!next && (stop.time > next.time || Number(stop.time.slice(0, 2)) * 60 + Number(stop.time.slice(3, 5)) + stopMinutes(stop) + (travelLeg(stop.point, next.point)?.minutes || 0) > Number(next.time.slice(0, 2)) * 60 + Number(next.time.slice(3, 5)));
                return <tr key={stop.id} onDragOver={event => { if (dragged && lane.some(item => item.id === dragged)) event.preventDefault(); }} onDrop={event => { event.preventDefault(); if (dragged) moveStop(dragged, stop.id); setDragged(null); }} className={`border-b border-slate-100 ${selected.includes(stop.id) ? "bg-blue-50/70" : "hover:bg-slate-50/60"}`}>
                  <td className="px-3 py-3 align-top"><input type="checkbox" aria-label={`Select ${reference(stop)} ${stop.type} ${stop.time}`} checked={selected.includes(stop.id)} onChange={() => setSelected(ids => ids.includes(stop.id) ? ids.filter(id => id !== stop.id) : [...ids, stop.id])} className="accent-blue-600" /></td>
                  <td className="p-2 align-top"><div className="flex items-center gap-1"><button draggable={!busy} disabled={busy} aria-label={`Drag ${reference(stop)} to reorder`} title="Drag within the same crew and day" className="cursor-grab rounded p-1 text-slate-400 active:cursor-grabbing" onDragStart={event => { setDragged(stop.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", stop.id); }} onDragEnd={() => setDragged(null)}><GripVertical className="h-4 w-4" /></button><span className="w-3 font-bold">{index + 1}</span><span className="flex flex-col"><button aria-label={`Move ${reference(stop)} up`} disabled={!index || busy} className="rounded p-0.5 text-slate-400 hover:bg-slate-200 disabled:opacity-20" onClick={() => moveStop(stop.id, lane[index - 1].id)}><ArrowUp className="h-3 w-3" /></button><button aria-label={`Move ${reference(stop)} down`} disabled={index === lane.length - 1 || busy} className="rounded p-0.5 text-slate-400 hover:bg-slate-200 disabled:opacity-20" onClick={() => moveStop(stop.id, lane[index + 1].id)}><ArrowDown className="h-3 w-3" /></button></span></div></td>
                  <td className="p-2 align-top"><button className="font-bold text-blue-700 hover:underline" disabled={busy} onClick={() => void openEditor([stop], "Edit booking")}>{reference(stop)}</button><p className="mt-1 font-semibold">{stop.name}</p><p className="mt-1 max-w-48 truncate text-[10px] text-slate-500" title={stop.address}>{stop.address || "Address missing"}</p><span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold ${stop.type === "job" ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"}`}>{stop.type === "job" ? "Job" : "Inspection"}</span>{stop.group && <span className="ml-1 inline-block rounded bg-violet-50 px-1.5 py-0.5 text-[9px] text-violet-700">{stop.group}</span>}</td>
                  <td className="p-2 align-top"><div className="flex items-center gap-2"><ZoneBadge id={stop.zone} /><span className="max-w-28 capitalize">{stop.suburb || stop.point?.label || "Unlocated"}</span></div>{!stop.point && <p className="mt-1 text-[9px] text-amber-700">Address needs review</p>}</td>
                  {showTravel && <><td className="p-2 align-top font-medium">{stop.baseKm === null ? "Unavailable" : `~${stop.baseKm.toFixed(1)} km`}</td><td className="p-2 align-top">{leg ? <><p className="font-semibold text-blue-700">~{leg.km.toFixed(1)} km</p><p className="mt-1 text-[10px] text-slate-500">{leg.minutes} min{index ? "" : " from base"}</p></> : <span className="text-slate-400">Unavailable</span>}</td></>}
                  <td className="whitespace-nowrap p-2 align-top"><p>{formatApptDate(`${stop.date}T${stop.time}`)}</p><p className="mt-1 font-bold">{formatApptTime(`${stop.date}T${stop.time}`)}</p>{stop.bookingStart && !stop.bookingStart.startsWith(stop.date) && <p className="mt-1 text-[9px] text-slate-400">Continued visit</p>}{conflict && <p className="mt-1 max-w-32 whitespace-normal text-[9px] text-amber-700">Timing / travel conflicts with next stop</p>}</td>
                  <td className="p-2 align-top">{duration(stopMinutes(stop))}</td><td className="max-w-40 p-2 align-top"><BookingStatusControl leadId={stop.leadId} booking={selectedBooking(stop)} disabled={busy} /></td>
                  <td className="p-2 align-top"><div className="flex justify-end gap-1"><button className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40" title="Open customer job card" aria-label={`View customer ${stop.name}`} disabled={busy || leadsLoading} onClick={() => { setOpening(true); void resolveLead(stop).then(openJobCard).catch(err => setError(err.message)).finally(() => setOpening(false)); }}><Eye className="h-3.5 w-3.5" /></button><button className="rounded-md border border-slate-200 p-1.5 text-blue-600 hover:bg-blue-50 disabled:opacity-40" title="Reschedule or reassign booking" aria-label={`Edit booking ${reference(stop)}`} disabled={busy} onClick={() => void openEditor([stop], "Edit booking")}><CalendarClock className="h-3.5 w-3.5" /></button><button className="rounded-md border border-rose-100 p-1.5 text-rose-500 hover:bg-rose-50 disabled:opacity-40" title="Cancel this booking" aria-label={`Cancel booking ${reference(stop)}`} disabled={busy} onClick={() => { setError(""); setCancelStop(stop); }}><Trash2 className="h-3.5 w-3.5" /></button></div></td>
                </tr>;
              })}
              {showTravel && <tr className="border-b border-slate-200 bg-slate-50/70"><td colSpan={10} className="px-4 py-2"><div className="flex items-center gap-2 text-[10px] text-slate-500"><Home className="h-3.5 w-3.5 text-blue-600" />Return to base · {DISPATCH_BASE_ADDRESS}<span className="ml-auto font-semibold">{(() => { const leg = travelLeg(lane[lane.length - 1].point, dispatchBase); return leg ? `~${leg.km.toFixed(1)} km · ${leg.minutes} min` : "Distance unavailable"; })()}</span></div></td></tr>}
            </tbody>)}
          </table></div>}
        </section>

        {ready && !!stops.length && <section className={`${panel} p-3`}><h3 className="mb-3 text-xs font-bold">Route preview <span className="font-normal text-slate-400">· visual order per crew / day</span></h3><div className="space-y-4">{lanes.map(lane => <div key={`${lane[0].id}:preview`}><p className="mb-2 text-[10px] font-semibold text-slate-500">{lane[0].crew} · {formatApptDate(`${lane[0].date}T12:00`)}</p><div className="flex items-center gap-2 overflow-x-auto pb-1"><div className="shrink-0 rounded-lg bg-slate-100 p-3 text-center text-[10px]"><Home className="mx-auto mb-1 h-4 w-4 text-blue-600" />Base</div>{lane.map((stop, index) => { const leg = travelLeg(index ? lane[index - 1].point : dispatchBase, stop.point); return <div className="flex shrink-0 items-center gap-2" key={stop.id}><div className="text-center text-[9px] text-slate-400"><ArrowRight className="mx-auto h-4 w-4" />{showTravel && (leg ? `~${leg.km} km` : "Unknown")}</div><button className="min-w-28 rounded-lg border p-2 text-left" disabled={busy} style={{ borderColor: `${zoneInfo(stop.zone).color}30`, backgroundColor: `${zoneInfo(stop.zone).color}08` }} onClick={() => void openEditor([stop], "Edit booking")}><p className="text-[10px] font-bold" style={{ color: zoneInfo(stop.zone).color }}>{index + 1}. {reference(stop)}</p><p className="mt-1 max-w-36 truncate text-[10px] capitalize">{stop.suburb || stop.point?.label || "Unlocated"}</p><p className="mt-1 text-[9px] text-slate-500">{formatApptTime(`${stop.date}T${stop.time}`)}</p></button></div>; })}<div className="shrink-0 text-center text-[9px] text-slate-400"><ArrowRight className="mx-auto h-4 w-4" />{showTravel && (() => { const leg = travelLeg(lane[lane.length - 1].point, dispatchBase); return leg ? `~${leg.km} km` : "Unknown"; })()}</div><div className="shrink-0 rounded-lg bg-blue-50 p-3 text-center text-[10px] text-blue-700"><Home className="mx-auto mb-1 h-4 w-4" />Base</div></div></div>)}</div></section>}

        <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(280px,1fr)]">
          <section className={`${panel} p-3`}><div className="flex items-center justify-between"><h3 className="text-xs font-bold">Actions for selected bookings</h3><span className="text-[10px] text-slate-500">{chosenVisits.length} visits selected</span></div><div className="mt-3 grid grid-cols-2 gap-2">
            <button className={`${button} !border-emerald-600 !bg-emerald-600 !text-white`} disabled={!ready || busy} onClick={() => setCreate(true)}><Plus className="h-3.5 w-3.5" />Book a visit</button>
            <button className={`${button} !border-blue-600 !bg-blue-600 !text-white`} disabled={!ready || busy || !chosen.length} onClick={() => void openEditor(chosenVisits, "Reschedule bookings")}><CalendarClock className="h-3.5 w-3.5" />Reschedule</button>
            <button className={button} disabled={!ready || busy || !chosen.length} onClick={() => void openEditor(chosenVisits, "Reassign bookings")}><Users className="h-3.5 w-3.5" />Reassign</button>
            <button className={button} disabled={!ready || busy || !chosen.length} onClick={() => { setNewZone("auto"); setMetadata("zone"); }}><MapPin className="h-3.5 w-3.5" />Change zone</button>
            <button className={button} disabled={!ready || busy || chosen.length < 2} onClick={() => { setGroupName(""); setMetadata("group"); }}><Layers className="h-3.5 w-3.5" />Group visits</button>
            <button className={button} disabled={!ready || busy || !chosen.some(stop => stop.group)} onClick={ungroup}>Ungroup</button>
          </div><p className="mt-3 text-[10px] leading-relaxed text-slate-500">Reschedule and reassign open each selected visit for review and confirmation. Groups label dispatch visits together; customer records stay separate.</p></section>
          <section className={`${panel} p-3`}><h3 className="text-xs font-bold">Zone summary</h3><div className="mt-3 grid grid-cols-2 gap-2">{DISPATCH_ZONES.filter(zone => stops.some(stop => stop.zone === zone.id)).map(zone => { const members = stops.filter(stop => stop.zone === zone.id); return <button key={zone.id} className="rounded-lg border p-3 text-left" style={{ backgroundColor: `${zone.color}08`, borderColor: `${zone.color}25` }} onClick={() => setSelected(members.map(stop => stop.id))}><div className="flex items-center gap-2"><ZoneBadge id={zone.id} /><span className="text-[10px] font-bold">{zone.name}</span></div><p className="mt-2 text-[11px] font-bold">{members.length} visits · {duration(members.reduce((sum, stop) => sum + stopMinutes(stop), 0))}</p><p className="mt-1 text-[9px] text-slate-500">Select these bookings</p></button>; })}</div>{!stops.length && <p className="py-4 text-xs text-slate-500">Select zones with bookings to see their totals.</p>}</section>
        </div>
        {ready && showTravel && chosen.length >= 2 && <section className={`${panel} overflow-hidden`}><div className="p-3"><h3 className="text-xs font-bold">Distance matrix · selected stops</h3><p className="mt-1 text-[10px] text-slate-500">Straight-line estimates between suburb centres in kilometres.{chosen.length > 20 ? " Showing the first 20 selected stops." : ""}</p></div><div className="max-h-80 overflow-auto"><table className="w-full text-center text-[10px]"><thead className="sticky top-0 bg-slate-100"><tr><th className="p-2 text-left">From / To</th>{chosen.slice(0, 20).map((stop, index) => <th key={stop.id} className="p-2" title={`${stop.name} · ${stop.date} ${stop.time}`}>{index + 1}. {reference(stop)}</th>)}</tr></thead><tbody>{chosen.slice(0, 20).map((stop, index) => <tr key={stop.id} className="border-t border-slate-100 even:bg-slate-50"><th className="whitespace-nowrap p-2 text-left">{index + 1}. {reference(stop)}</th>{chosen.slice(0, 20).map(other => <td className="p-2" key={other.id}>{stop.id === other.id ? "—" : travelLeg(stop.point, other.point)?.km.toFixed(1) ?? "Unknown"}</td>)}</tr>)}</tbody></table></div></section>}
      </main>
    </div>
    {opening && <div role="status" className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl"><Loader2 className="h-4 w-4 animate-spin" />Opening booking…</div>}
    {create && <DispatchBookingModal date={from < todayAU() ? todayAU() : from} time="09:00" initialType={typeFilter === "job" ? "job" : "inspection"} staffName={crews.find(([key]) => key === crewFilter)?.[1]} onClose={() => setCreate(false)} onBooked={(date, message) => { setCreate(false); setNotice(message); if (date < from || date > to) { setFrom(date); setTo(date); } setReload(value => value + 1); }} />}
    {editor && editingLead && <><div role="status" className="fixed left-1/2 top-3 z-[60] -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-xs text-white shadow-lg">{editor.purpose} · {editor.index + 1} of {editor.stops.length}</div><EditBookingModal key={`${editor.stops[editor.index].id}:${editor.index}`} lead={editingLead} type={editor.stops[editor.index].type} onClose={() => { setEditor(null); setEditingLead(null); setReload(value => value + 1); }} onSaved={(_date, message) => void nextEditor(message)} /></>}
    {metadata && <Dialog title={metadata === "zone" ? "Change dispatch zone" : "Group selected visits"} onClose={() => setMetadata(null)}><p className="mb-4 text-xs leading-relaxed text-slate-500">{chosen.length} selected stops. {metadata === "zone" ? "This changes the dispatch plan for these dates. Customer service-area rules are managed separately in Service Zones." : "Give these visits a shared dispatch label so staff can find and select them together."}</p>{metadata === "zone" ? <label className="block text-xs font-semibold">Dispatch zone<select className={`${field} mt-2 w-full`} value={newZone} onChange={event => setNewZone(event.target.value as DispatchZone | "auto")}><option value="auto">Automatic (from property location)</option>{DISPATCH_ZONES.map(zone => <option key={zone.id} value={zone.id}>{zone.id} · {zone.name} · {zone.direction}</option>)}</select></label> : <label className="block text-xs font-semibold">Group name<input autoFocus required maxLength={60} className={`${field} mt-2 w-full`} value={groupName} onChange={event => setGroupName(event.target.value)} placeholder="e.g. Eastern crew morning" onKeyDown={event => { if (event.key === "Enter" && groupName.trim()) applyMetadata(); }} /></label>}<div className="mt-5 flex justify-end gap-2"><button className={button} onClick={() => setMetadata(null)}>Cancel</button><button className={`${button} !bg-blue-600 !text-white`} disabled={!chosen.length || (metadata === "group" && !groupName.trim())} onClick={applyMetadata}>Apply to plan</button></div></Dialog>}
    {cancelStop && <Dialog title="Cancel this booking?" busy={cancelling} onClose={() => setCancelStop(null)}><p className="text-sm">{reference(cancelStop)} · {cancelStop.name}</p><p className="mt-2 text-xs text-slate-500">{cancelStop.type} · {formatApptDate(cancelStop.bookingStart || `${cancelStop.date}T${cancelStop.time}`)} · {formatApptTime(cancelStop.bookingStart || `${cancelStop.date}T${cancelStop.time}`)}</p><p className="mt-3 text-xs leading-relaxed text-slate-500">This cancels the entire selected visit, including its continued days, and releases its calendar slots. The customer record and other bookings are retained.</p>{error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}<div className="mt-5 flex justify-end gap-2"><button className={button} disabled={cancelling} onClick={() => setCancelStop(null)}>Keep booking</button><button className={`${button} !border-rose-600 !bg-rose-600 !text-white`} disabled={cancelling} onClick={() => void cancelBooking()}>{cancelling && <Loader2 className="h-4 w-4 animate-spin" />}Cancel booking</button></div></Dialog>}
    {discard && <Dialog title="Discard unsaved dispatch changes?" onClose={() => setDiscard(false)}><p className="text-sm text-slate-600">Reload the shared plan and discard your unsaved order, zone and group changes. Saved booking changes are retained.</p><div className="mt-5 flex justify-end gap-2"><button className={button} onClick={() => setDiscard(false)}>Keep editing</button><button className={`${button} !bg-slate-900 !text-white`} onClick={() => { dirtyRef.current = []; persistDrafts(username, [], {}, {}); setDirty([]); setSelected([]); setDiscard(false); setReload(value => value + 1); }}>Discard & reload</button></div></Dialog>}
    {!assignableTechnicians.some(person => person.active) && !inspectionStaff.some(person => person.active) && !leadsLoading && <p className="text-xs text-amber-700">No active booking staff are configured. Add technicians or inspectors in Team before assigning visits.</p>}
  </div>;
}
