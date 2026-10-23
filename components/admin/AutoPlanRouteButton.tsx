"use client";

import { useRef, useState } from "react";
import { Loader2, Route, X } from "lucide-react";
import type { DayAppointment } from "@/lib/bookings";
import { todayAU } from "@/lib/scheduling";
import { applyRouteOrders, appointmentKey, estimateRoute, optimizeRouteStops, type RouteStop } from "@/lib/scheduleRoutes";

type PlannedStop = RouteStop & { name: string; type: "inspection" | "job" };
type Plan = { date: string; original: PlannedStop[]; stops: PlannedStop[] };

export function AutoPlanRouteButton({ onSaved, onBeforePlan, disabled = false }: {
  onSaved: (date: string) => void;
  onBeforePlan?: () => boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const requestRef = useRef(0);
  const close = () => {
    if (saving) return;
    requestRef.current++;
    setLoading(false);
    setOpen(false);
  };
  const planToday = async () => {
    if (disabled || loading || saving || (onBeforePlan && !onBeforePlan())) return;
    const request = ++requestRef.current;
    const date = todayAU();
    setOpen(true);
    setLoading(true);
    setPlan(null);
    setError("");
    try {
      // Fetch every booking for today, regardless of search/type filters or the
      // calendar range currently displayed. Never plan only a filtered subset.
      const response = await fetch(`/api/admin/slots?from=${date}&to=${date}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load today's bookings.");
      const entries: PlannedStop[] = (data.appointments as DayAppointment[]).map((entry) => ({
        id: appointmentKey(entry), date: entry.date, time: entry.time,
        name: entry.name || "Customer", type: entry.type, suburb: entry.suburb,
        customer: { address: entry.address || "" },
      }));
      const original = applyRouteOrders(entries, data.routeOrders || {});
      const stops = optimizeRouteStops(original);
      if (request === requestRef.current) setPlan({ date, original, stops });
    } catch (err) {
      if (request === requestRef.current) setError(err instanceof Error ? err.message : "Could not plan today's route.");
    } finally { if (request === requestRef.current) setLoading(false); }
  };
  const save = async () => {
    if (!plan || saving || !plan.stops.length) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/schedule-routes", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routes: [{ date: plan.date, order: plan.stops.map((stop) => stop.id) }] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save the route.");
      setOpen(false);
      onSaved(plan.date);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save the route."); }
    finally { setSaving(false); }
  };
  const estimate = plan ? estimateRoute(plan.stops) : null;
  const original = plan ? estimateRoute(plan.original) : null;
  const savedKm = estimate && original ? Math.max(0, Math.round((original.km - estimate.km) * 10) / 10) : 0;
  return <>
    <button type="button" onClick={() => void planToday()} disabled={disabled || loading || saving}
      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer">
      <Route className="h-3.5 w-3.5" />Auto-plan today
    </button>
    {open && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="auto-plan-title" className="flex max-h-[85dvh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h3 id="auto-plan-title" className="text-sm font-bold text-slate-900">Today’s round trip</h3>
          <button type="button" autoFocus disabled={saving} onClick={close} aria-label="Close route preview" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 cursor-pointer"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 overflow-y-auto p-4 text-xs">
          {loading && <p role="status" className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Planning today’s visits…</p>}
          {plan && <>
            <p className="font-semibold text-slate-700">{new Date(plan.date + "T12:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" })} · {plan.stops.length} visits</p>
            <p className="text-slate-600">Base → customer visits → return to base</p>
            <p className="text-slate-500">Base: 82A Marigold Cres, Gowanbrae VIC 3043</p>
            {estimate && original && <div className="rounded-lg bg-emerald-50 p-3 text-emerald-800">
              Estimated round trip: <strong>{estimate.km} km</strong> · {estimate.minutes} min travel.
              <span className="mt-1 block">{savedKm > 0 ? `About ${savedKm} km less than the current order (${original.km} km).` : "No shorter round trip found for the known locations."}</span>
            </div>}
            <p className="rounded-lg bg-amber-50 p-3 text-amber-800">This plans visit order using suburb locations, without live traffic. Booking times stay unchanged. Review the times before following this order; reschedule any visits that need a different time.</p>
            {!!estimate?.missing && <p role="status" className="text-amber-700">{estimate.missing} visit(s) have unknown locations. They stay in their current positions and are excluded from distance estimates.</p>}
            <ol className="space-y-2">
              <li className="font-semibold text-slate-600">Start at base · Gowanbrae</li>
              {plan.stops.map((stop, index) => <li key={stop.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                <p className="font-semibold text-slate-800">{index + 1}. {stop.name} · {stop.type}</p>
                <p className="mt-1 text-slate-500">{stop.customer?.address || stop.suburb || "Address needed"} · Booked {stop.time}</p>
              </li>)}
              <li className="font-semibold text-slate-600">Finish at base · Gowanbrae</li>
            </ol>
            {!plan.stops.length && <p className="text-slate-500">No visits are booked for today.</p>}
          </>}
          {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-rose-700">{error} Close this preview and try Auto-plan today again to refresh the bookings.</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
          <button type="button" disabled={saving} onClick={close} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer">Close</button>
          <button type="button" disabled={loading || saving || !plan?.stops.length} onClick={() => void save()} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50 cursor-pointer">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{saving ? "Saving…" : "Save today’s route"}
          </button>
        </div>
      </div>
    </div>}
  </>;
}
