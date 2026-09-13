"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type TimeSlot = { time: string; booked: boolean };

type DayOption = {
  date: string;
  label: string;
  weekday: string;
  times: string[];
  slots: TimeSlot[];
  recommended: boolean;
};

type Availability = {
  customer: { name: string; address: string };
  type: "inspection" | "job";
  area: {
    label: string;
    inner: boolean;
    suburb: string | null;
    zone?: string;
    distanceKm?: number | null;
    located?: boolean;
  };
  days: DayOption[];
  current: string | null;
};

function timeLabel(t: string): string {
  const [h, m = 0] = t.split(":").map(Number);
  const endH = h + 1;
  const startAmpm = h >= 12 ? "PM" : "AM";
  const endAmpm = endH >= 12 ? "PM" : "AM";
  const startHr = h % 12 === 0 ? 12 : h % 12;
  const endHr = endH % 12 === 0 ? 12 : endH % 12;
  const minStr = m !== 0 ? `:${String(m).padStart(2, "0")}` : ":00";
  return `${startHr}${minStr} ${startAmpm} – ${endHr}:00 ${endAmpm}`;
}

export default function BookingPage() {
  const params = useParams<{ type: string; id: string }>();
  const search = useSearchParams();
  const type = params.type === "job" ? "job" : "inspection";
  const id = params.id;
  const token = search.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Availability | null>(null);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ reference: string; whenLabel: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/book/${id}?type=${type}&token=${encodeURIComponent(token)}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "This booking link could not be opened.");
      } else {
        setData(json);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id, type, token]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedDay = data?.days.find((d) => d.date === selectedDate) || null;

  async function confirm() {
    if (!selectedDate || !selectedTime || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/book/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          type,
          date: selectedDate,
          time: selectedTime,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Could not confirm your booking.");
        // A taken slot (409) — refresh availability so they can re-pick.
        if (res.status === 409) {
          setSelectedTime("");
          load();
        }
      } else {
        setConfirmed({ reference: json.reference, whenLabel: json.whenLabel });
      }
    } catch {
      setError("Network error while confirming. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const heading = type === "inspection" ? "Book your FREE inspection" : "Book your job";

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-[#001f97] text-white flex items-center justify-center font-black text-xl">
          G
        </div>
        <div>
          <div className="font-black text-lg text-[#001f97] leading-tight">Groutix</div>
          <div className="text-xs text-slate-400">Professional Re-Grouting Services</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading available times…</div>
        ) : confirmed ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-4">
              ✓
            </div>
            <h1 className="text-xl font-black text-slate-900 mb-2">
              Your {type} is booked!
            </h1>
            <p className="text-slate-600 text-sm mb-4">{confirmed.whenLabel}</p>
            <div className="inline-block px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700">
              Booking reference: {confirmed.reference}
            </div>
            <p className="text-xs text-slate-400 mt-5">
              We&apos;ve emailed your confirmation and will remind you the day before. See you then!
            </p>
          </div>
        ) : error && !data ? (
          <div className="py-10 text-center">
            <div className="text-3xl mb-3">⚠️</div>
            <p className="text-slate-600 text-sm">{error}</p>
          </div>
        ) : data ? (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-black text-slate-900">{heading}</h1>
              <p className="text-sm text-slate-500 mt-1">
                Hi {data.customer.name || "there"}, choose a day and time that suits you.
              </p>
            </div>

            {data.current && (
              <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">
                You currently have a time booked. Choosing a new one will replace it.
              </div>
            )}

            {data.days.length === 0 ? (
              <p className="text-sm text-slate-500">
                No online times are available right now — please reply to your email or call us and we&apos;ll arrange a time.
              </p>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                    Select day
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime("");
                    }}
                    className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#001f97] bg-white"
                  >
                    <option value="">Choose a day…</option>
                    {data.days.map((d) => (
                      <option key={d.date} value={d.date}>
                        {d.label}
                        {d.recommended ? "  ★ soonest for your area" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDay && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Select time
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {selectedDay.slots.map((s) => {
                        const isSelected = selectedTime === s.time;
                        return (
                          <button
                            key={s.time}
                            type="button"
                            disabled={s.booked}
                            onClick={() => !s.booked && setSelectedTime(s.time)}
                            className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold border transition-colors relative ${
                              s.booked
                                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through decoration-slate-400"
                                : isSelected
                                ? "bg-[#001f97] text-white border-[#001f97]"
                                : "bg-white text-slate-700 border-slate-300 hover:border-[#001f97]"
                            }`}
                            title={s.booked ? "Already booked by another customer" : undefined}
                          >
                            <span>{timeLabel(s.time)}</span>
                            {s.booked && (
                              <span className="block text-[9px] font-semibold not-italic no-underline text-rose-400 leading-none mt-1">
                                Booked
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Greyed-out times are already booked by other customers.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={confirm}
                  disabled={!selectedDate || !selectedTime || submitting}
                  className="w-full py-3.5 rounded-xl bg-[#001f97] text-white font-black text-sm hover:bg-[#001777] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? "Confirming…"
                    : selectedTime
                    ? `Confirm ${type === "inspection" ? "Inspection" : "Job"} Booking`
                    : "Select a day & time"}
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      <p className="text-center text-xs text-slate-400 mt-6">
        Stay Sealed. Stay Smiling. · groutix.com
      </p>
    </div>
  );
}
