"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { addDaysYmd } from "@/lib/scheduling";

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-AU", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function DispatchDatePicker({ value, today, onChange }: {
  value: string;
  today: string;
  onChange: (date: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(`${value.slice(0, 7)}-01`);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const endDate = addDaysYmd(value, 6);
  const firstDay = new Date(`${month}T00:00:00`);
  const gridStart = addDaysYmd(month, -((firstDay.getDay() + 6) % 7));
  const dates = Array.from({ length: 42 }, (_, index) => addDaysYmd(gridStart, index));

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };
  const chooseDate = (date: string) => {
    onChange(date);
    close();
  };
  const moveMonth = (offset: number) => {
    const date = new Date(`${month}T00:00:00`);
    date.setMonth(date.getMonth() + offset);
    setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`);
  };

  useEffect(() => {
    if (!open) return;
    selectedRef.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative min-w-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Choose dispatch date, ${formatDate(value)} to ${formatDate(endDate)}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (open) close();
          else {
            setMonth(`${value.slice(0, 7)}-01`);
            setOpen(true);
          }
        }}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold text-slate-800 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
      >
        <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="tabular-nums">{formatDate(value)} – {formatDate(endDate)}</span>
      </button>

      {open && (
        <div role="dialog" aria-label="Choose dispatch date" className="absolute -left-8 sm:left-0 top-full mt-2 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between gap-2 mb-3">
            <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
            <input type="month" aria-label="Dispatch calendar month" value={month.slice(0, 7)} onChange={(event) => {
              if (/^\d{4}-\d{2}$/.test(event.target.value)) setMonth(`${event.target.value}-01`);
            }} className="min-w-0 text-sm font-bold text-slate-900" />
            <button type="button" aria-label="Next month" onClick={() => moveMonth(1)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <p className="mb-2 text-[11px] text-slate-500">Choose the first day of your 7-day schedule.</p>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => <span key={day} className="py-1 text-[10px] font-bold text-slate-400">{day}</span>)}
            {dates.map((date) => {
              const selected = date === value;
              const inRange = date > value && date <= endDate;
              return (
                <button key={date} ref={selected ? selectedRef : undefined} type="button" aria-label={new Date(`${date}T00:00:00`).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} aria-pressed={selected} aria-current={date === today ? "date" : undefined} onClick={() => chooseDate(date)} className={`rounded-lg py-2 text-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${selected ? "bg-blue-600 text-white font-bold" : inRange ? "bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100" : date.slice(0, 7) !== month.slice(0, 7) ? "text-slate-400 hover:bg-slate-50" : date === today ? "text-blue-600 font-bold hover:bg-blue-50" : "text-slate-700 hover:bg-slate-100"}`}>
                  {Number(date.slice(-2))}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-3 mt-3">
            <button type="button" onClick={() => chooseDate(today)} className="text-xs font-semibold text-blue-600 cursor-pointer">Today</button>
            <button type="button" onClick={close} className="text-xs text-slate-500 cursor-pointer">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
