"use client";

// Homepage-only 3-step quote / inspection form.
// It sends exactly the same data to the same endpoints as components/HeroQuoteForm
// (/api/quote, /api/inspection-availability, /api/address-autocomplete, Cloudinary),
// so leads, bookings and the CRM keep working. HeroQuoteForm is untouched and is
// still used by every other page.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { CalendarDays, Camera, Check, ImagePlus, Info, MapPin, X } from "lucide-react";
import { formatBytes, MAX_FILE_SIZE_BYTES, MAX_PHOTO_COUNT, MAX_TOTAL_BYTES } from "@/lib/imageCompression";
import { formatSlotRange } from "@/lib/scheduling";
import { useContact } from "@/components/SiteContentProvider";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// label shown on the chip → value the CRM already understands
const SERVICES: [string, string][] = [
  ["Shower Regrouting", "Shower Cubicle Regrouting"],
  ["Leaking Shower Repair", "Leaking Shower Repair"],
  ["Shower Base Repair", "Shower Base Repair"],
  ["Silicone Replacement", "Silicone Replacement"],
  ["Balcony Regrouting", "Balcony Regrouting"],
  ["Balcony Leak Repair", "Balcony Leak Repair"],
  ["Tile Regrouting", "Tile Regrouting"],
  ["Small Tiling Job", "Small Tiling Job"],
  ["Other", "Other"],
];
const AREAS: [string, string][] = [
  ["Main Bathroom", "Main Bathroom"],
  ["Ensuite", "Ensuite Bathroom"],
  ["Guest Bathroom", "Guest Bathroom"],
  ["Toilet", "Toilet"],
  ["Kitchen", "Kitchen"],
  ["Laundry", "Laundry"],
  ["Balcony", "Balcony"],
  ["Other", "Other"],
];
const LEAKING = ["Yes", "No", "Not sure"];
const DAMAGED = ["No", "Cracked tiles", "Loose / drummy tiles", "Lifting tiles", "Not sure"];

type Mode = "insp" | "quote";
type StepId = "job" | "details" | "tenants" | "finish";
type Tenant = { name: string; phone: string; email: string };
type Slot = { time: string; booked: boolean };
type Day = { date: string; label: string; slots: Slot[] };
type Availability =
  | { status: "idle" | "loading" | "error" }
  | { status: "ok"; days: Day[]; durationMinutes: number; zoneDay: string | null; suburb?: string }
  | { status: "outside"; reason: "coastal" | "outside" };

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const parseYmd = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const dayLabel = (s: string) => {
  const d = parseYmd(s);
  return `${FULL_WD[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s()]{8,}$/;

const field =
  "h-11 w-full rounded-[10px] border-[1.5px] border-[#DBE3F0] bg-[#FBFCFE] px-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-[#2F63CC] focus:outline-none focus:ring-[3px] focus:ring-[#2F63CC]/15";
const fieldBad = "border-red-500 bg-red-50/40";
const label = "mb-1 block text-[12.5px] font-semibold text-neutral-800";
const h3 = "mb-1.5 mt-3 text-sm font-bold text-neutral-900";

function Chip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`min-h-8 rounded-full border-[1.5px] px-3 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#2F63CC]/40 ${
        on ? "border-[#1A2A8C] bg-[#1A2A8C] text-white" : "border-[#DBE3F0] bg-white text-neutral-900 hover:border-[#2F63CC]"
      }`}
    >
      {on && <Check className="-ml-0.5 mr-1 inline h-3.5 w-3.5" aria-hidden="true" />}
      {children}
    </button>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p role="alert" className="mt-1 text-[11.5px] leading-tight text-red-700">
      {msg}
    </p>
  );
}

export default function QuoteFormV2() {
  const { phone: phoneDisplay, tel } = useContact();
  const rootRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<Mode>("insp");
  const [isPM, setIsPM] = useState(false);
  const [step, setStep] = useState<StepId>("job");

  const [services, setServices] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [leaking, setLeaking] = useState("");
  const [damaged, setDamaged] = useState<string[]>([]);
  const [jobErrors, setJobErrors] = useState<Record<string, string>>({});

  const [data, setData] = useState({ firstName: "", lastName: "", agency: "", phone: "", email: "", address: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [tenants, setTenants] = useState<Tenant[]>([{ name: "", phone: "", email: "" }]);
  const [tenantIdx, setTenantIdx] = useState(0);
  const [tenantErrors, setTenantErrors] = useState<{ name?: string; phone?: string; email?: string }>({});

  const [avail, setAvail] = useState<Availability>({ status: "idle" });
  const [availFor, setAvailFor] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calMonth, setCalMonth] = useState<Date | null>(null);
  const [inspError, setInspError] = useState("");
  const [showHow, setShowHow] = useState(false);

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState<null | { booked: string | null }>(null);

  // Address autocomplete
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeSuggest, setActiveSuggest] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flow: StepId[] = isPM ? ["job", "details", "tenants", "finish"] : ["job", "details", "finish"];
  const stepLabels: Record<StepId, string> = {
    job: "The job",
    details: isPM ? "Manager details" : "Your details",
    tenants: "Tenant access",
    finish: "Book & finish",
  };
  const stepIndex = flow.indexOf(step);

  const scrollTop = () => {
    const el = rootRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 80) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const goTo = (s: StepId) => {
    setStep(s);
    requestAnimationFrame(scrollTop);
  };

  /* ---------- availability ---------- */
  const loadAvailability = useCallback(async (address: string) => {
    if (!address || address.trim().length < 5) return;
    setAvail({ status: "loading" });
    setAvailFor(address);
    try {
      const res = await fetch(`/api/inspection-availability?address=${encodeURIComponent(address)}&_=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.inServiceArea === false) {
        setAvail({ status: "outside", reason: json.zone === "coastal" ? "coastal" : "outside" });
      } else {
        const days: Day[] = (json.days || []).slice().sort((a: Day, b: Day) => a.date.localeCompare(b.date));
        setAvail({ status: "ok", days, durationMinutes: json.durationMinutes ?? 60, zoneDay: json.zoneDay || null, suburb: json.suburb });
        if (days[0]) {
          setDate((d) => (days.some((x) => x.date === d) ? d : days[0].date));
          setCalMonth(parseYmd(days[0].date));
        }
      }
    } catch {
      setAvail({ status: "error" });
    }
  }, []);

  useEffect(() => {
    if (step === "finish" && mode === "insp" && data.address.trim() && availFor !== data.address) {
      setDate("");
      setTime("");
      loadAvailability(data.address);
    }
  }, [step, mode, data.address, availFor, loadAvailability]);

  /* ---------- address autocomplete ---------- */
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setSuggestions([]);
      setSuggestOpen(false);
      return;
    }
    try {
      const res = await fetch(`/api/address-autocomplete?input=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const json = await res.json();
      const preds: string[] = json.predictions || [];
      setSuggestions(preds.slice(0, 5));
      setSuggestOpen(preds.length > 0);
      setActiveSuggest(-1);
    } catch {
      /* ignore */
    }
  }, []);

  const onAddress = (v: string) => {
    setData((p) => ({ ...p, address: v }));
    if (errors.address) setErrors((e) => ({ ...e, address: "" }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 250);
  };
  const pickSuggestion = (s: string) => {
    setData((p) => ({ ...p, address: s }));
    setSuggestOpen(false);
  };

  /* ---------- validation ---------- */
  const validateJob = () => {
    const e: Record<string, string> = {};
    if (!services.length) e.services = "Select at least one";
    if (!areas.length) e.areas = "Select at least one";
    if (!leaking) e.leaking = "Choose one";
    setJobErrors(e);
    return Object.keys(e).length === 0;
  };
  const validateDetails = () => {
    const e: Record<string, string> = {};
    if (!data.firstName.trim()) e.firstName = "Please enter a first name";
    if (!data.lastName.trim()) e.lastName = "Please enter a last name";
    if (!PHONE_RE.test(data.phone.trim())) e.phone = "Enter a valid phone number, e.g. 0412 345 678";
    if (!EMAIL_RE.test(data.email.trim())) e.email = "Enter a valid email address";
    if (data.address.trim().length < 3) e.address = isPM ? "Please enter the rental property address" : "Please enter the property address";
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) document.getElementById(`qf2-${first}`)?.focus();
    return !first;
  };
  const validateTenants = () => {
    for (let i = 0; i < tenants.length; i++) {
      const t = tenants[i];
      const used = i === 0 || t.name.trim() || t.phone.trim() || t.email.trim();
      if (!used) continue;
      const e: { name?: string; phone?: string; email?: string } = {};
      if (!t.name.trim()) e.name = "Please enter the tenant's name";
      if (!PHONE_RE.test(t.phone.trim())) e.phone = "Enter a valid phone number";
      if (t.email.trim() && !EMAIL_RE.test(t.email.trim())) e.email = "Enter a valid email";
      if (Object.keys(e).length) {
        setTenantIdx(i);
        setTenantErrors(e);
        return false;
      }
    }
    setTenantErrors({});
    return true;
  };

  const next = () => {
    if (step === "job" && !validateJob()) return;
    if (step === "details" && !validateDetails()) return;
    if (step === "tenants" && !validateTenants()) return;
    goTo(flow[stepIndex + 1]);
  };
  const back = () => goTo(flow[Math.max(0, stepIndex - 1)]);

  /* ---------- photos ---------- */
  const addFiles = (list: FileList | File[]) => {
    const files = Array.from(list);
    if (!files.length) return;
    const bad = files.find((f) => !f.type.startsWith("image/"));
    if (bad) return setPhotoError(`"${bad.name}" isn't an image. Please add photos only.`);
    if (photos.length + files.length > MAX_PHOTO_COUNT) return setPhotoError(`You can add up to ${MAX_PHOTO_COUNT} photos.`);
    const big = files.find((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (big) return setPhotoError(`"${big.name}" is over the ${formatBytes(MAX_FILE_SIZE_BYTES)} per-photo limit.`);
    const all = [...photos, ...files];
    const total = all.reduce((a, f) => a + f.size, 0);
    if (total > MAX_TOTAL_BYTES) return setPhotoError(`Photos add up to ${formatBytes(total)}. The limit is ${formatBytes(MAX_TOTAL_BYTES)}.`);
    setPhotoError("");
    setPhotos(all);
  };
  const thumbs = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => () => thumbs.forEach((u) => URL.revokeObjectURL(u)), [thumbs]);

  /* ---------- submit ---------- */
  const canBook = mode === "insp" && avail.status === "ok" && avail.days.length > 0;
  const submitLabel = mode === "quote" ? "Get My Free Quote" : canBook ? "Book My Free Inspection" : "Submit Details";

  const submit = async () => {
    setSubmitError("");
    setInspError("");
    if (canBook && (!date || !time)) {
      setInspError(!date ? "Please pick a day for your free inspection." : "Please choose an arrival time.");
      return;
    }
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setSubmitError("Please complete the verification below.");
      return;
    }
    setLoading(true);
    try {
      type Uploaded = { name: string; contentType: string; url: string; secureUrl: string; publicId: string; width?: number; height?: number; size: number; added: string };
      let uploaded: Uploaded[] = [];
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "hsg6orfs";
      const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "groutix";
      if (photos.length && cloudName && preset) {
        try {
          uploaded = await Promise.all(
            photos.map(async (file) => {
              const fd = new FormData();
              fd.append("file", file);
              fd.append("upload_preset", preset);
              fd.append("folder", "groutix/quotes");
              const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
              if (!r.ok) throw new Error(`Upload failed for ${file.name}`);
              const j = await r.json();
              return {
                name: file.name,
                contentType: file.type || "image/jpeg",
                url: j.secure_url || j.url,
                secureUrl: j.secure_url || j.url,
                publicId: j.public_id,
                width: j.width,
                height: j.height,
                size: j.bytes || file.size,
                added: new Date().toISOString(),
              };
            })
          );
        } catch {
          uploaded = [];
        }
      }

      const payload = new FormData();
      if (isPM) {
        payload.append("customerType", "Property Manager");
        if (data.agency.trim()) payload.append("agency", data.agency.trim());
        const valid = tenants.filter((t) => t.name.trim() || t.phone.trim());
        if (valid.length) payload.append("tenants", JSON.stringify(valid));
      }
      payload.append("firstName", data.firstName.trim());
      payload.append("lastName", data.lastName.trim());
      payload.append("email", data.email.trim());
      payload.append("phone", data.phone.trim());
      payload.append("address", data.address.trim());
      payload.append("message", data.message.trim());
      payload.append("areas", areas.join(", "));
      payload.append("service", services.join(", "));
      payload.append("enquiry", services.join(", "));
      payload.append("damagedTiles", damaged.join(", "));
      payload.append("leaking", leaking);
      payload.append("sourcePage", typeof window !== "undefined" ? window.location.pathname : "/");
      if (captchaToken) payload.append("cf-turnstile-response", captchaToken);
      if (canBook && date && time) {
        payload.append("inspectionDate", date);
        payload.append("inspectionTime", time);
      }
      if (uploaded.length) payload.append("uploadedPhotos", JSON.stringify(uploaded));
      else photos.forEach((f) => payload.append("photos", f));

      const res = await fetch("/api/quote", { method: "POST", body: payload });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.slotConflict) {
          setTime("");
          setInspError(body.error || "That time is no longer available. Please pick another.");
          setAvailFor("");
          loadAvailability(data.address);
        }
        throw new Error(body.error || "Something went wrong. Please try again.");
      }
      setDone({ booked: canBook && date && time && avail.status === "ok" ? `${dayLabel(date)}, ${formatSlotRange(time, avail.durationMinutes)}` : null });
      requestAnimationFrame(scrollTop);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      turnstileRef.current?.reset();
      setCaptchaToken("");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setDone(null);
    setStep("job");
    setServices([]);
    setAreas([]);
    setLeaking("");
    setDamaged([]);
    setData({ firstName: "", lastName: "", agency: "", phone: "", email: "", address: "", message: "" });
    setTenants([{ name: "", phone: "", email: "" }]);
    setPhotos([]);
    setDate("");
    setTime("");
    setAvail({ status: "idle" });
    setAvailFor("");
  };

  /* ---------- pieces ---------- */
  const toggle = (list: string[], set: (v: string[]) => void, v: string, key: string) => {
    const nextList = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
    set(nextList);
    if (nextList.length && jobErrors[key]) setJobErrors((e) => ({ ...e, [key]: "" }));
  };
  const toggleDamaged = (v: string) => {
    setDamaged((list) => {
      if (v === "No" || v === "Not sure") return list.includes(v) ? [] : [v];
      const f = list.filter((x) => x !== "No" && x !== "Not sure");
      return f.includes(v) ? f.filter((x) => x !== v) : [...f, v];
    });
  };

  const input = (name: keyof typeof data, lbl: React.ReactNode, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="mb-2">
      <label htmlFor={`qf2-${name}`} className={label}>
        {lbl}
      </label>
      <input
        id={`qf2-${name}`}
        value={data[name]}
        onChange={(e) => {
          setData((p) => ({ ...p, [name]: e.target.value }));
          if (errors[name]) setErrors((x) => ({ ...x, [name]: "" }));
        }}
        aria-invalid={!!errors[name]}
        className={`${field} ${errors[name] ? fieldBad : ""}`}
        {...props}
      />
      <FieldError msg={errors[name]} />
    </div>
  );

  const days = avail.status === "ok" ? avail.days : [];
  const selectedDay = days.find((d) => d.date === date);
  const stripDays = (() => {
    if (!days.length) return [];
    const i = Math.max(0, days.findIndex((d) => d.date === date));
    const start = i >= 5 ? i - 4 : 0;
    return days.slice(start, start + 5);
  })();

  const calendar = () => {
    const m = calMonth ?? (days[0] ? parseYmd(days[0].date) : new Date());
    const first = new Date(m.getFullYear(), m.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7;
    const count = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    const ymd = (d: number) => `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const months = Array.from(new Set(days.map((d) => d.date.slice(0, 7))));
    const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
    const mi = months.indexOf(key);
    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between font-bold text-[#1A2A8C]">
          <button type="button" aria-label="Previous month" disabled={mi <= 0}
            onClick={() => mi > 0 && setCalMonth(parseYmd(`${months[mi - 1]}-01`))}
            className="h-9 w-9 rounded-lg border-[1.5px] border-[#DBE3F0] text-lg text-neutral-500 disabled:opacity-30">‹</button>
          <span>{MONTH[m.getMonth()]} {m.getFullYear()}</span>
          <button type="button" aria-label="Next month" disabled={mi < 0 || mi >= months.length - 1}
            onClick={() => mi < months.length - 1 && setCalMonth(parseYmd(`${months[mi + 1]}-01`))}
            className="h-9 w-9 rounded-lg border-[1.5px] border-[#DBE3F0] text-lg text-neutral-500 disabled:opacity-30">›</button>
        </div>
        <div className="grid grid-cols-7 gap-[3px] text-center text-[11px] font-semibold text-neutral-500">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-[3px]">
          {Array.from({ length: lead }, (_, i) => <span key={`e${i}`} />)}
          {Array.from({ length: count }, (_, i) => {
            const v = ymd(i + 1);
            const ok = days.some((d) => d.date === v && d.slots.some((s) => !s.booked));
            const sel = v === date;
            return (
              <button key={v} type="button" disabled={!ok}
                aria-label={dayLabel(v)} aria-pressed={sel}
                onClick={() => { setDate(v); setTime(""); setInspError(""); }}
                className={`h-9 rounded-[9px] border-[1.5px] text-[13.5px] font-semibold ${
                  sel ? "border-[#1A2A8C] bg-[#1A2A8C] text-white" : ok ? "border-[#DBE3F0] bg-white text-neutral-900 hover:border-[#2F63CC]" : "border-transparent font-medium text-neutral-300"
                }`}>
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const timeSelect = () =>
    selectedDay && avail.status === "ok" ? (
      <select
        aria-label="Arrival time"
        value={time}
        onChange={(e) => { setTime(e.target.value); setInspError(""); }}
        className="mt-2 h-11 w-full appearance-none rounded-xl border border-[#CDD8EA] bg-[#FBFCFE] bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%228%22%20fill=%22none%22%20stroke=%22%231a2a8c%22%20stroke-width=%222%22%3E%3Cpath%20d=%22M1%201l5%205%205-5%22/%3E%3C/svg%3E')] bg-[length:12px_8px] bg-[right_14px_center] bg-no-repeat pl-3 pr-9 text-sm text-neutral-900 focus:border-[#1A2A8C] focus:outline-none"
      >
        <option value="">Choose arrival time for {dayLabel(selectedDay.date)}…</option>
        {selectedDay.slots.map((s) => (
          <option key={s.time} value={s.time} disabled={s.booked}>
            {formatSlotRange(s.time, avail.durationMinutes)}{s.booked ? " (Booked)" : ""}
          </option>
        ))}
      </select>
    ) : null;

  /* ---------- render ---------- */
  return (
    <div
      ref={rootRef}
      className="relative flex min-h-[600px] w-full scroll-mt-32 flex-col rounded-2xl bg-white px-4 pb-3.5 pt-5 text-[15px] leading-[1.45] text-neutral-900 shadow-[0_12px_40px_rgba(0,0,0,0.28)] sm:px-5"
      aria-label="Request a quote"
      role="form"
    >
      {done ? (
        <div className="m-auto py-6 text-center" aria-live="polite">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <Check className="h-7 w-7" aria-hidden="true" />
          </div>
          <h3 className="mb-1.5 text-[19px] font-bold text-[#001F97]">Thank you for choosing Groutix</h3>
          <p className="text-sm text-slate-700">
            {done.booked ? <>Your inspection request for <strong>{done.booked}</strong> has been received.</> : mode === "quote" ? "Your quote request has been received." : "Your details have been received."}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {done.booked ? "We'll keep that time wherever possible and only contact you if we need to arrange an alternative." : "Our team will be in touch shortly."}
          </p>
          <p className="mt-4 text-xs text-neutral-500">Need it sooner?</p>
          <a href={tel} className="mt-1.5 inline-block rounded-[10px] border-[1.5px] border-[#1A2A8C] px-4 py-2 font-bold text-[#1A2A8C]">
            Call {phoneDisplay}
          </a>
          <button type="button" onClick={reset} className="mx-auto mt-3 block text-[13px] text-neutral-500 underline">
            Send another request
          </button>
        </div>
      ) : (
        <>
          <h2 className="mb-1 text-[19px] font-bold text-[#001F97]">Request a Quote</h2>

          <div className="my-3 grid grid-cols-2 gap-2.5">
            {([
              ["insp", "Book free inspection", "Pick a day, we come to you"],
              ["quote", "Just get a quote", "Send details or photos"],
            ] as const).map(([m, t, s]) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={`relative rounded-xl border-[1.5px] px-2.5 py-2 text-left transition-colors ${
                  mode === m ? "border-[#001F97] bg-[#EEF3FF] shadow-[0_0_0_3px_rgba(47,99,204,0.15)]" : "border-[#DBE3F0] bg-white hover:border-[#2F63CC]"
                }`}
              >
                {m === "insp" && (
                  <span className="absolute -top-2.5 right-2.5 rounded-[10px] bg-[#001F97] px-2 py-0.5 text-[10.5px] font-bold text-white">Recommended</span>
                )}
                <strong className="block text-sm">{t}</strong>
                <span className="block text-xs text-neutral-500">{s}</span>
              </button>
            ))}
          </div>

          <div className="mb-1.5 flex gap-1.5" aria-hidden="true">
            {flow.map((s, i) => (
              <i key={s} className={`h-[5px] flex-1 rounded-sm ${i <= stepIndex ? "bg-[#2F63CC]" : "bg-slate-200"}`} />
            ))}
          </div>
          <div className="mb-1.5 flex justify-between text-xs text-neutral-500">
            <span>Step {stepIndex + 1} of {flow.length} · {stepLabels[step]}</span>
            <span>About 1 minute</span>
          </div>

          {/* STEP: JOB */}
          {step === "job" && (
            <div className="flex flex-1 flex-col">
              <label className="my-1 flex cursor-pointer select-none items-center gap-2.5 text-sm font-semibold text-[#1F2D4D]">
                <input type="checkbox" checked={isPM} onChange={(e) => setIsPM(e.target.checked)} className="h-5 w-5 accent-[#001F97]" />
                I am a Property Manager / agent
              </label>
              <h3 className={h3}>What do you need done?{jobErrors.services && <span role="alert" className="ml-1.5 text-[11.5px] font-medium text-red-700">{jobErrors.services}</span>}</h3>
              <div className="flex flex-wrap gap-1.5">
                {SERVICES.map(([l, v]) => <Chip key={v} on={services.includes(v)} onClick={() => toggle(services, setServices, v, "services")}>{l}</Chip>)}
              </div>
              <h3 className={h3}>Which area?{jobErrors.areas && <span role="alert" className="ml-1.5 text-[11.5px] font-medium text-red-700">{jobErrors.areas}</span>}</h3>
              <div className="flex flex-wrap gap-1.5">
                {AREAS.map(([l, v]) => <Chip key={v} on={areas.includes(v)} onClick={() => toggle(areas, setAreas, v, "areas")}>{l}</Chip>)}
              </div>
              <h3 className={h3}>Is it currently leaking?{jobErrors.leaking && <span role="alert" className="ml-1.5 text-[11.5px] font-medium text-red-700">{jobErrors.leaking}</span>}</h3>
              <div className="flex flex-wrap gap-1.5">
                {LEAKING.map((v) => <Chip key={v} on={leaking === v} onClick={() => { setLeaking(leaking === v ? "" : v); setJobErrors((e) => ({ ...e, leaking: "" })); }}>{v}</Chip>)}
              </div>
              <h3 className={h3}>Any damaged tiles? <small className="font-normal text-neutral-500">(optional)</small></h3>
              <div className="flex flex-wrap gap-1.5">
                {DAMAGED.map((v) => <Chip key={v} on={damaged.includes(v)} onClick={() => toggleDamaged(v)}>{v}</Chip>)}
              </div>
              <div className="mt-auto pt-4">
                <button type="button" onClick={next} className="h-[52px] w-full rounded-xl bg-gradient-to-b from-[#2F63CC] to-[#001F97] text-base font-extrabold text-white shadow-[0_8px_18px_rgba(0,31,151,0.28)]">
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP: DETAILS */}
          {step === "details" && (
            <div className="flex flex-1 flex-col">
              <div className="grid grid-cols-1 gap-x-2.5 min-[420px]:grid-cols-2">
                {input("firstName", isPM ? "Manager first name" : "First name", { autoComplete: "given-name" })}
                {input("lastName", "Last name", { autoComplete: "family-name" })}
              </div>
              {isPM && input("agency", <>Agency / company <small className="font-normal text-neutral-500">(optional)</small></>, { autoComplete: "organization" })}
              <div className="grid grid-cols-1 gap-x-2.5 min-[420px]:grid-cols-2">
                {input("phone", "Mobile", { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "04xx xxx xxx" })}
                {input("email", "Email", { type: "email", autoComplete: "email", placeholder: isPM ? "you@agency.com.au" : "you@email.com" })}
              </div>
              <div className="relative mb-2">
                <label htmlFor="qf2-address" className={label}>{isPM ? "Rental property address" : "Property address"}</label>
                <input
                  id="qf2-address"
                  value={data.address}
                  onChange={(e) => onAddress(e.target.value)}
                  onFocus={() => suggestions.length && setSuggestOpen(true)}
                  onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
                  onKeyDown={(e) => {
                    if (!suggestOpen || !suggestions.length) return;
                    if (e.key === "ArrowDown") { e.preventDefault(); setActiveSuggest((i) => (i + 1) % suggestions.length); }
                    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveSuggest((i) => (i - 1 + suggestions.length) % suggestions.length); }
                    else if (e.key === "Enter" && activeSuggest >= 0) { e.preventDefault(); pickSuggestion(suggestions[activeSuggest]); }
                    else if (e.key === "Escape") setSuggestOpen(false);
                  }}
                  role="combobox"
                  aria-expanded={suggestOpen}
                  aria-controls="qf2-address-list"
                  aria-autocomplete="list"
                  autoComplete="off"
                  placeholder="Start typing the address…"
                  className={`${field} ${errors.address ? fieldBad : ""}`}
                />
                {suggestOpen && (
                  <ul id="qf2-address-list" role="listbox" className="absolute left-0 right-0 top-full z-20 mt-0.5 overflow-hidden rounded-[10px] border-[1.5px] border-[#DBE3F0] bg-white py-1 shadow-[0_10px_24px_rgba(15,23,42,0.16)]">
                    {suggestions.map((s, i) => (
                      <li key={s} role="option" aria-selected={i === activeSuggest}>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pickSuggestion(s)}
                          className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13.5px] hover:bg-[#EEF3FF] ${i === activeSuggest ? "bg-[#EEF3FF]" : ""}`}>
                          <MapPin className="h-4 w-4 shrink-0 text-[#1A2A8C]" aria-hidden="true" />
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <FieldError msg={errors.address} />
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                We only use your details to arrange your quote. <Link href="/privacy-policy" className="text-[#2F63CC] underline">Privacy</Link>
              </p>
              <div className="mt-auto pt-3">
                <button type="button" onClick={next} className="h-[52px] w-full rounded-xl bg-gradient-to-b from-[#2F63CC] to-[#001F97] text-base font-extrabold text-white shadow-[0_8px_18px_rgba(0,31,151,0.28)]">
                  Continue
                </button>
              </div>
              <button type="button" onClick={back} className="mx-auto mt-0.5 block min-h-8 text-[13px] text-neutral-500">← Back</button>
            </div>
          )}

          {/* STEP: TENANTS (property managers) */}
          {step === "tenants" && (
            <div className="flex flex-1 flex-col">
              <h3 className="mb-0.5 mt-0.5 text-sm font-bold">Tenant access details</h3>
              <p className="mb-2 text-xs text-neutral-500">So our technician can arrange access with the tenant directly.</p>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {tenants.map((_, i) => (
                  <button key={i} type="button" onClick={() => { setTenantIdx(i); setTenantErrors({}); }}
                    className={`min-h-8 rounded-full border-[1.5px] px-3 text-[13px] font-semibold ${i === tenantIdx ? "border-[#1A2A8C] bg-[#EEF3FF] text-[#1A2A8C]" : "border-[#DBE3F0] bg-white"}`}>
                    Tenant {i + 1}
                  </button>
                ))}
                {tenants.length < 6 && (
                  <button type="button" onClick={() => { setTenants((t) => [...t, { name: "", phone: "", email: "" }]); setTenantIdx(tenants.length); setTenantErrors({}); }}
                    className="min-h-8 rounded-full border-[1.5px] border-dashed border-[#DBE3F0] px-3 text-[13px] font-semibold text-[#2F63CC]">
                    + Add tenant
                  </button>
                )}
                {tenants.length > 1 && (
                  <button type="button" onClick={() => { setTenants((t) => t.filter((_, i) => i !== tenantIdx)); setTenantIdx(0); setTenantErrors({}); }}
                    className="ml-auto min-h-8 px-1 text-[12.5px] text-neutral-500 underline">Remove</button>
                )}
              </div>
              {(() => {
                const t = tenants[tenantIdx];
                const upd = (k: keyof Tenant, v: string) => {
                  setTenants((all) => all.map((x, i) => (i === tenantIdx ? { ...x, [k]: v } : x)));
                  if (tenantErrors[k]) setTenantErrors((e) => ({ ...e, [k]: undefined }));
                };
                return (
                  <>
                    <div className="mb-2">
                      <label htmlFor="qf2-tn" className={label}>Tenant {tenantIdx + 1} name</label>
                      <input id="qf2-tn" value={t.name} onChange={(e) => upd("name", e.target.value)} className={`${field} ${tenantErrors.name ? fieldBad : ""}`} />
                      <FieldError msg={tenantErrors.name} />
                    </div>
                    <div className="grid grid-cols-1 gap-x-2.5 min-[420px]:grid-cols-2">
                      <div className="mb-2">
                        <label htmlFor="qf2-tp" className={label}>Phone</label>
                        <input id="qf2-tp" type="tel" inputMode="tel" value={t.phone} onChange={(e) => upd("phone", e.target.value)} placeholder="04xx xxx xxx" className={`${field} ${tenantErrors.phone ? fieldBad : ""}`} />
                        <FieldError msg={tenantErrors.phone} />
                      </div>
                      <div className="mb-2">
                        <label htmlFor="qf2-te" className={label}>Email <small className="font-normal text-neutral-500">(optional)</small></label>
                        <input id="qf2-te" type="email" value={t.email} onChange={(e) => upd("email", e.target.value)} className={`${field} ${tenantErrors.email ? fieldBad : ""}`} />
                        <FieldError msg={tenantErrors.email} />
                      </div>
                    </div>
                  </>
                );
              })()}
              <div className="mt-auto pt-3">
                <button type="button" onClick={next} className="h-[52px] w-full rounded-xl bg-gradient-to-b from-[#2F63CC] to-[#001F97] text-base font-extrabold text-white shadow-[0_8px_18px_rgba(0,31,151,0.28)]">
                  Continue
                </button>
              </div>
              <button type="button" onClick={back} className="mx-auto mt-0.5 block min-h-8 text-[13px] text-neutral-500">← Back</button>
            </div>
          )}

          {/* STEP: FINISH */}
          {step === "finish" && (
            <div className="relative flex flex-1 flex-col">
              {mode === "insp" && (
                <div>
                  <h3 className="mb-1.5 mt-1 text-sm font-bold">
                    Choose your inspection day <small className="font-normal text-neutral-500">(free, no obligation)</small>
                  </h3>
                  {avail.status === "loading" && (
                    <div className="grid grid-cols-6 gap-1.5" aria-label="Loading available days">
                      {Array.from({ length: 6 }, (_, i) => <span key={i} className="h-[50px] animate-pulse rounded-[10px] bg-slate-100" />)}
                    </div>
                  )}
                  {avail.status === "error" && (
                    <div className="rounded-[10px] border border-amber-300 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900">
                      We couldn&apos;t load inspection times just now. Submit your details and we&apos;ll call you to book a time.
                      <button type="button" onClick={() => { setAvailFor(""); loadAvailability(data.address); }} className="ml-1 font-bold underline">Try again</button>
                    </div>
                  )}
                  {avail.status === "outside" && (
                    <div className="rounded-[10px] border border-amber-300 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900">
                      <h4 className="mb-0.5 text-sm font-bold">{avail.reason === "coastal" ? "Coastal area" : "More than 50 km from our base"}</h4>
                      Online times aren&apos;t offered for this address. Submit your details and our team will arrange your inspection directly.
                    </div>
                  )}
                  {avail.status === "ok" && days.length === 0 && (
                    <div className="rounded-[10px] border border-amber-300 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900">
                      No online times are open in the next few weeks. Submit your details and we&apos;ll call you to book a time.
                    </div>
                  )}
                  {avail.status === "ok" && days.length > 0 && !calendarOpen && (
                    <>
                      {avail.zoneDay && !time && (
                        <div className="mb-1.5 rounded-lg bg-[#EEF3FF] px-2.5 py-1 text-xs text-[#1A2A8C]">
                          Our inspector visits {avail.suburb ? `the ${avail.suburb} area` : "your area"} on {avail.zoneDay}.
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-1.5 min-[420px]:grid-cols-6">
                        {stripDays.map((d) => {
                          const dt = parseYmd(d.date);
                          const sel = d.date === date;
                          const full = !d.slots.some((s) => !s.booked);
                          return (
                            <button key={d.date} type="button" disabled={full} aria-pressed={sel} aria-label={dayLabel(d.date)}
                              onClick={() => { setDate(d.date); setTime(""); setInspError(""); }}
                              className={`rounded-[10px] border-[1.5px] px-0.5 py-1.5 text-center ${sel ? "border-[#1A2A8C] bg-[#1A2A8C] text-white" : "border-[#DBE3F0] bg-white disabled:opacity-40"}`}>
                              <small className={`block text-[10.5px] ${sel ? "text-[#CFE0FF]" : "text-neutral-500"}`}>{WD[dt.getDay()]}</small>
                              <b className="text-base">{dt.getDate()}</b>
                            </button>
                          );
                        })}
                        <button type="button" onClick={() => { setCalendarOpen(true); setCalMonth(date ? parseYmd(date) : parseYmd(days[0].date)); }}
                          className="rounded-[10px] border-[1.5px] border-[#2F63CC] bg-[#EEF3FF] px-0.5 py-1.5 text-center">
                          <small className="block text-[10.5px] text-neutral-500">More</small>
                          <CalendarDays className="mx-auto mt-0.5 h-5 w-5 text-[#1A2A8C]" aria-hidden="true" />
                        </button>
                      </div>
                      {time && selectedDay ? (
                        <div className="mt-1.5 rounded-xl border border-[#BFE6D0] bg-[#EFFAF4] px-2.5 py-1.5">
                          <div className="flex items-start justify-between gap-2 text-[12.5px] leading-tight text-[#0F6B43]">
                            <span>✓ Preferred inspection time selected, <b>{dayLabel(selectedDay.date)}, {formatSlotRange(time, avail.durationMinutes)}</b></span>
                            <button type="button" onClick={() => setTime("")} className="shrink-0 text-xs font-bold text-[#1A2A8C] underline">Change time</button>
                          </div>
                          <p className="mt-0.5 text-[10.5px] leading-tight text-[#4B6B5C]">If this time becomes unavailable, our team will contact you to arrange an alternative.</p>
                        </div>
                      ) : (
                        timeSelect()
                      )}
                    </>
                  )}
                  {avail.status === "ok" && days.length > 0 && calendarOpen && (
                    <div className="rounded-xl border border-[#DBE3F0] p-2.5">
                      {calendar()}
                      {timeSelect()}
                      <button type="button" onClick={() => setCalendarOpen(false)} className="mt-2 h-10 w-full rounded-[10px] bg-[#1A2A8C] text-sm font-bold text-white">
                        {date && time ? "Confirm this time" : "Done"}
                      </button>
                    </div>
                  )}
                  {inspError && <p role="alert" className="mt-1.5 text-[12px] font-medium text-red-700">{inspError}</p>}
                  <button type="button" onClick={() => setShowHow((v) => !v)} aria-expanded={showHow} className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#2F63CC]">
                    <Info className="h-3.5 w-3.5" aria-hidden="true" /> How inspection days work
                  </button>
                  {showHow && (
                    <p className="mt-1 rounded-xl border-[1.5px] border-[#2F63CC] bg-white px-3 py-2 text-[12.5px] text-slate-700">
                      Free on-site inspections are available across our service area. Addresses close to our base can be booked on most days; further out we visit one part of Melbourne per day, so you&apos;ll see the days our inspector is already in your area. For properties more than 50 km away, or in coastal areas, our team arranges the time with you directly.
                    </p>
                  )}
                </div>
              )}

              <h3 className={h3}>Add photos <small className="font-normal text-neutral-500">(optional, helps us quote faster)</small></h3>
              <div
                role="button"
                tabIndex={0}
                aria-label="Add photos"
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileRef.current?.click(); } }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
                onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
                className={`flex min-h-[46px] cursor-pointer items-center gap-2 rounded-xl border-[1.5px] border-dashed px-2 py-1.5 ${dragging ? "border-[#1A2A8C] bg-[#EEF3FF]" : photoError ? "border-red-500 bg-[#FBFCFE]" : "border-[#B8C5DC] bg-[#FBFCFE]"}`}
              >
                <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-[#EEF2F8]"><ImagePlus className="h-4 w-4 text-[#1A2A8C]" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1 text-[12.5px] font-semibold leading-tight">
                  {photoError ? "Could not add photos" : photos.length ? `${photos.length} photo${photos.length > 1 ? "s" : ""} added` : "Click or drag photos here"}
                  <small className={`block text-[11.5px] font-normal ${photoError ? "text-red-700" : "text-neutral-500"}`}>
                    {photoError || (photos.length ? `${formatBytes(photos.reduce((a, f) => a + f.size, 0))} of ${formatBytes(MAX_TOTAL_BYTES)} used` : `Up to ${MAX_PHOTO_COUNT} photos`)}
                  </small>
                </span>
                <span className="flex gap-1">
                  {thumbs.slice(0, 3).map((u, i) => (
                    <span key={u} className="relative block h-8 w-8 rounded-md bg-cover bg-center" style={{ backgroundImage: `url(${u})` }}>
                      <button type="button" aria-label="Remove photo" onClick={(e) => { e.stopPropagation(); setPhotos((p) => p.filter((_, x) => x !== i)); setPhotoError(""); }}
                        className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#0A123F] text-white">
                        <X className="h-2.5 w-2.5" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </span>
                <button type="button" onClick={(e) => { e.stopPropagation(); camRef.current?.click(); }}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-[#CDD8EA] bg-white px-2 py-1.5 text-xs font-semibold text-[#1A2A8C]">
                  <Camera className="h-3.5 w-3.5" aria-hidden="true" />Camera
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
                <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
              </div>

              <div className="mt-2">
                <label htmlFor="qf2-message" className={label}>Anything else we should know? <small className="font-normal text-neutral-500">(optional)</small></label>
                <textarea id="qf2-message" rows={2} value={data.message} onChange={(e) => setData((p) => ({ ...p, message: e.target.value }))}
                  placeholder="e.g. cracked tiles, mould, ceiling stains"
                  className="w-full resize-none rounded-[10px] border-[1.5px] border-[#DBE3F0] bg-[#FBFCFE] px-3 py-2 text-[15px] focus:border-[#2F63CC] focus:outline-none focus:ring-[3px] focus:ring-[#2F63CC]/15" />
              </div>

              {TURNSTILE_SITE_KEY && (
                <div className="mt-2">
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={TURNSTILE_SITE_KEY}
                    onSuccess={setCaptchaToken}
                    onExpire={() => setCaptchaToken("")}
                    onError={() => { setCaptchaToken(""); setSubmitError("Verification could not load. Please refresh and try again."); }}
                    options={{ size: "flexible" }}
                  />
                </div>
              )}
              {submitError && <p role="alert" className="mt-2 rounded-lg bg-red-50 p-2.5 text-[13px] text-red-700">{submitError}</p>}

              <div className="mt-auto pt-3">
                <button type="button" onClick={submit} disabled={loading}
                  className="h-[52px] w-full rounded-xl bg-gradient-to-b from-[#2F63CC] to-[#001F97] text-base font-extrabold text-white shadow-[0_8px_18px_rgba(0,31,151,0.28)] disabled:cursor-progress disabled:opacity-70">
                  {loading ? "Sending…" : submitLabel}
                </button>
              </div>
              <button type="button" onClick={back} className="mx-auto mt-0.5 block min-h-8 text-[13px] text-neutral-500">← Back</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
