"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { RefreshCcw, Loader2, CalendarDays, ExternalLink } from "lucide-react";

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

const ZONE_LABELS: Record<string, string> = {
  N: "North", NE: "North-East", E: "East", SE: "South-East",
  S: "South", SW: "South-West", W: "West", NW: "North-West",
  inner: "Inner", flexible: "Greater Melb",
};

function fmtScheduleDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-AU", {
    timeZone: "Australia/Sydney",
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtScheduleTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function ScheduleView({ onOpenLead }: { onOpenLead: (id: string) => void }) {
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

  const grouped = useMemo(() => {
    const map = new Map<string, BookingEntry[]>();
    for (const b of bookings) {
      const arr = map.get(b.date) || [];
      arr.push(b);
      map.set(b.date, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [bookings]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
          Upcoming Bookings{" "}
          {!loading && (
            <span className="text-slate-400 font-medium text-xs ml-1.5">({bookings.length})</span>
          )}
        </h2>
        <button
          onClick={load}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <RefreshCcw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Loading schedule…
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          No upcoming bookings. Bookings from customer self-service and admin scheduling will appear here.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, entries]) => (
            <div key={date}>
              <div className="flex items-center gap-2.5 mb-2.5">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800 tracking-tight">{fmtScheduleDate(date)}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200/60 text-slate-500 font-medium">
                  {entries.length} appointment{entries.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="ml-2 border-l-2 border-blue-500/20 pl-4 space-y-2">
                {entries.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/60 transition-all cursor-pointer group shadow-2xs"
                    onClick={() => onOpenLead(b.leadId)}
                  >
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <div className="text-xs font-bold text-blue-600 sm:w-20 shrink-0 tabular-nums">
                        {fmtScheduleTime(b.time)}
                      </div>
                      <span
                        className={`sm:hidden text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          b.type === "inspection"
                            ? "bg-blue-50 text-blue-700 border-blue-200/60"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                        }`}
                      >
                        {b.type === "inspection" ? "Inspection" : "Job"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {b.customer?.name || "Customer"}
                        </span>
                        <span
                          className={`hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            b.type === "inspection"
                              ? "bg-blue-50 text-blue-700 border-blue-200/60"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                          }`}
                        >
                          {b.type === "inspection" ? "Inspection" : "Job"}
                        </span>
                      </div>
                      <div className="flex items-center gap-x-3 gap-y-0.5 mt-0.5 flex-wrap">
                        {b.customer?.address && (
                          <span className="text-[11px] text-slate-500 truncate">{b.customer.address}</span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {ZONE_LABELS[b.zone] || b.zone} · {b.reference}
                        </span>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
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
