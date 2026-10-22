"use client";
import { useMemo, useRef, useEffect, useState } from "react";
import { Loader2, X, Home, WandSparkles } from "lucide-react";
import { dayItinerary, optimizeDayRoute, routeClock, type TravelMatrix } from "@/lib/dispatchDayRoute";
import { workMinutes, workBookingKey, type WorkRow } from "@/lib/dispatchWorklist";
import { todayAU } from "@/lib/scheduling";
import { validScheduleDate } from "@/lib/scheduleRoutes";
import { bookingLead, leadBookings } from "@/lib/leadBookings";
import type { Lead } from "./types";
import { EditBookingModal } from "./modals/EditBookingModal";
import { DispatchBookingModal } from "./modals/DispatchBookingModal";

const input = "w-full rounded-lg border border-slate-200 p-2 text-xs";
const button = "rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-40";
export function DispatchDayPlanner({ rows, onClose, onOrder }: { rows: WorkRow[]; onClose: () => void; onOrder: (ids: string[]) => void }) {
  const [date, setDate] = useState(todayAU());
  const [departure, setDeparture] = useState("08:00"), [buffer, setBuffer] = useState(10), [dayEnd, setDayEnd] = useState("17:00");
  const [durations, setDurations] = useState(rows.map(row => workMinutes(row.booking) || 60));
  const [travel, setTravel] = useState<{ matrix: TravelMatrix; estimated: boolean } | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [reviewIndex, setReviewIndex] = useState<number | null>(null), [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [finished, setFinished] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; dialog.current?.focus(); return () => previous?.focus(); }, []);
  const order = useMemo(() => travel ? optimizeDayRoute(travel.matrix) : [], [travel]);
  let itinerary: ReturnType<typeof dayItinerary> | null = null, issue = "";
  try {
    if (!validScheduleDate(date) || date < todayAU()) throw new Error("Choose today or a future date.");
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(dayEnd)) throw new Error("Choose a valid finish time.");
    if (travel) itinerary = dayItinerary(travel.matrix, order, durations, departure, buffer);
  } catch (err) { issue = err instanceof Error ? err.message : "Check the planning values."; }
  const crew = (row: WorkRow) => row.booking?.type === "job" ? row.booking.technician : row.booking?.assigned;
  const crews = new Set(rows.map(crew).filter(Boolean).map(name => name!.trim().toLowerCase()));
  const unsupported = rows.some(row => row.booking && (row.booking.endAt && row.booking.endAt.slice(0, 10) !== row.booking.date
    || (row.booking.workSegments?.length || 0) > 1 || ["Completed", "Inspection Completed", "Cancelled"].includes(row.booking.status || "")));
  const invalidSelection = crews.size > 1 ? "Select visits for one crew at a time. Each crew needs its own day route." : unsupported ? "Select active, single-day visits. Continued or completed visits need individual planning." : "";
  const endMinutes = Number(dayEnd.slice(0, 2)) * 60 + Number(dayEnd.slice(3));
  const overrun = !!itinerary && itinerary.returnAt > endMinutes;
  async function calculate() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/dispatch-day-route", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: rows.map(row => row.id) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not plan this route.");
      setTravel(data);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not plan this route."); }
    finally { setBusy(false); }
  }
  async function review(index: number) {
    if (!itinerary || index >= itinerary.stops.length) { setReviewIndex(null); setFinished(true); return; }
    const row = rows[itinerary.stops[index].index - 1];
    setError(""); setReviewIndex(null); setEditingLead(null);
    if (!row.booking) { setEditingLead(null); setReviewIndex(index); return; }
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/submissions/${row.id}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.item) throw new Error(data.error || "Could not load this visit.");
      const current = leadBookings(data.item).find(booking => workBookingKey(booking) === workBookingKey(row.booking!) && booking.date === row.booking!.date && booking.time === row.booking!.time);
      if (!current || !["Job Booked", "Inspection Booked"].includes(current.status || "") || ["Lost", "Cancelled"].includes(data.item.status)) throw new Error("This visit changed. Close the planner and refresh before scheduling.");
      setEditingLead(bookingLead(data.item, current)); setReviewIndex(index);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load this visit."); }
    finally { setBusy(false); }
  }
  const active = reviewIndex !== null && itinerary ? itinerary.stops[reviewIndex] : null;
  const activeRow = active ? rows[active.index - 1] : null;
  const scheduled = () => { if (reviewIndex !== null) void review(reviewIndex + 1); };
  return <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onKeyDown={event => {
      if (event.key === "Escape" && !busy && reviewIndex === null) onClose();
      if (event.key === "Tab") {
        const elements = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled)');
        if (!elements?.length) return;
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first.focus(); }
      }
    }}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-label="Plan selected day" tabIndex={-1} className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl outline-none">
        <div className="flex justify-between gap-3"><h2 className="font-bold">Plan selected day · {rows.length} stops</h2><button className={button} disabled={busy} aria-label="Close day planner" onClick={onClose}><X className="h-4 w-4" /></button></div>
        <p className="mt-2 text-xs text-slate-500">One crew, starting and returning to Gowanbrae base. Minimizes travel distance with a route improvement algorithm; the absolute shortest route is not guaranteed. Times are Melbourne time.</p>
        <div className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="text-xs">Day<input type="date" min={todayAU()} className={input} value={date} onChange={e => setDate(e.target.value)} /></label>
          <label className="text-xs">Leave base<input type="time" className={input} value={departure} onChange={e => setDeparture(e.target.value)} /></label>
          <label className="text-xs">Return by<input type="time" className={input} value={dayEnd} onChange={e => setDayEnd(e.target.value)} /></label>
          <label className="text-xs">Buffer per stop (min)<input type="number" min={0} max={120} className={input} value={buffer} onChange={e => setBuffer(Number(e.target.value))} /></label>
        </div>
        <p className="mb-2 text-xs font-semibold">Visit durations (minutes)</p>
        <div className="space-y-2">{rows.map((row, index) => <label key={row.id} className="flex items-center justify-between gap-3 text-xs"><span>{row.lead.name} · {row.booking?.type || "New inspection"}</span><input type="number" aria-label={`Duration for ${row.lead.name}`} min={1} max={1440} className={`${input} !w-24`} value={durations[index]} onChange={e => setDurations(values => values.map((value, i) => i === index ? Number(e.target.value) : value))} /></label>)}</div>
        {(invalidSelection || issue || error) && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">{invalidSelection || issue || error}</p>}
        {itinerary && <div className="mt-4 space-y-2 rounded-xl border border-blue-100 bg-blue-50/40 p-3 text-xs">
          <p className="font-semibold">{travel?.estimated ? "~" : ""}{itinerary.km.toFixed(1)} km round trip · Return {routeClock(itinerary.returnAt)}</p>
          <p className="text-slate-500">{travel?.estimated ? "Suburb estimates: road routing was unavailable for some addresses. Verify travel times before booking." : "Address-based road distances. Travel times exclude live traffic."}</p>
          <p className="flex items-center gap-2"><Home className="h-3 w-3" />{departure} · Leave base</p>
          {itinerary.stops.map((stop, index) => <p key={stop.index}><strong>{index + 1}. {routeClock(stop.arrival)}–{routeClock(stop.finish)}</strong> · {rows[stop.index - 1].lead.name}<span className="block text-slate-500">{stop.leg.minutes} min travel + {buffer} min buffer · {rows[stop.index - 1].lead.address || rows[stop.index - 1].lead.city}</span></p>)}
          <p>{itinerary.home.minutes} min drive back to base</p>
          {overrun && <p role="alert" className="font-semibold text-amber-800">This route exceeds your return time. Remove stops, shorten visits or adjust the day before scheduling.</p>}
        </div>}
        {finished && <p role="status" className="mt-3 text-xs text-green-700">All selected visits have been reviewed and saved.</p>}
        <div className="mt-4 flex flex-wrap justify-end gap-2"><button className={button} disabled={busy || !!invalidSelection || !!issue} onClick={() => void calculate()}>{busy ? <Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> : <WandSparkles className="mr-1 inline h-3 w-3" />}Calculate route</button>{itinerary && <><button className={button} disabled={busy} onClick={() => { onOrder(order.map(index => rows[index - 1].id)); onClose(); }}>Use route order only</button><button className={`${button} bg-blue-600 text-white`} disabled={busy || overrun || !!invalidSelection || !!issue || finished} onClick={() => void review(0)}>Review & schedule visits</button></>}</div>
        <p className="mt-3 text-[10px] text-slate-500">Each booking opens for review with its proposed time. Saving a booking may send customer updates. Check staff, existing appointments, breaks and any customer time commitments. Cancelling a review keeps visits already saved.</p>
      </div>
    </div>
    {active && activeRow && (editingLead && activeRow.booking ? <EditBookingModal key={`${activeRow.id}:${reviewIndex}`} lead={editingLead} type={activeRow.booking.type} proposedStart={`${date}T${routeClock(active.arrival)}`} proposedEnd={`${date}T${routeClock(active.finish)}`} onClose={() => setReviewIndex(null)} onSaved={scheduled} /> : <DispatchBookingModal key={`${activeRow.id}:${reviewIndex}`} initialLeadId={activeRow.id} initialType="inspection" date={date} time={routeClock(active.arrival)} initialEnd={`${date}T${routeClock(active.finish)}`} staffName={rows.map(crew).find(Boolean)} onClose={() => setReviewIndex(null)} onBooked={scheduled} />)}
  </>;
}
