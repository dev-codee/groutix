"use client";

// Step-by-step quote / inspection form used in the V2 hero (homepage + V2 service pages).
// It sends exactly the same data to the same endpoints as components/HeroQuoteForm
// (/api/quote, /api/inspection-availability, /api/address-autocomplete, Cloudinary),
// so leads, bookings, the admin and the CRM keep working unchanged.
// HeroQuoteForm is untouched and is still used by the older pages.

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { CalendarDays, Camera, Check, ChevronDown, ImagePlus, Info, MapPin, X } from "lucide-react";
import { formatBytes, MAX_FILE_SIZE_BYTES, MAX_TOTAL_BYTES } from "@/lib/imageCompression";
import { formatSlotRange } from "@/lib/scheduling";
import { useContact } from "@/components/SiteContentProvider";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// label shown on the chip → value the CRM already understands (same values as HeroQuoteForm)
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
const shortDay = (s: string) => {
  const d = parseYmd(s);
  return `${WD[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s()]{8,}$/;

const fieldBad = "border-red-500 bg-red-50/40";
const label = "mb-1 block text-[13px] font-semibold text-neutral-800";
const opt = "font-normal text-neutral-500";
const req = <span className="text-red-600" aria-hidden="true">*</span>;
const primaryBtn =
  "h-12 w-full rounded-xl bg-gradient-to-b from-[#2F63CC] to-[#001F97] text-base font-extrabold text-white shadow-[0_8px_18px_rgba(0,31,151,0.28)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#2F63CC]/50 disabled:cursor-progress disabled:opacity-70";
const backBtn =
  "h-12 shrink-0 rounded-xl border-[1.5px] border-[#DBE3F0] bg-white px-4 text-sm font-semibold text-neutral-600 transition-colors hover:border-[#2F63CC] hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#2F63CC]/40";
// Compact input with the label inside the box: it sits in the middle while empty
// and moves to the top once the field is focused or filled, so the value always shows.
const floatField =
  "peer h-12 w-full rounded-[10px] border-[1.5px] border-[#DBE3F0] bg-[#FBFCFE] px-3 pb-1 pt-[18px] text-[15px] text-neutral-900 placeholder:text-transparent focus:border-[#2F63CC] focus:outline-none focus:ring-[3px] focus:ring-[#2F63CC]/15";
const floatLabel =
  "pointer-events-none absolute left-3 right-3 top-1.5 truncate text-[11px] font-semibold text-neutral-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[14.5px] peer-placeholder-shown:font-normal peer-placeholder-shown:text-neutral-500 peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-[#2F63CC]";

const HIDDEN: React.CSSProperties = { position: "fixed", top: 0, left: 0, visibility: "hidden" };

// Click-to-open select list (multi or single choice). Keeps step 1 short.
function Dropdown({
  id,
  label: lbl,
  options,
  value,
  onToggle,
  multiple = true,
  placeholder,
  error,
}: {
  id: string;
  label: React.ReactNode;
  options: [string, string][];
  value: string[];
  onToggle: (v: string) => void;
  multiple?: boolean;
  placeholder: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState<React.CSSProperties>(HIDDEN);

  // The list is rendered in a portal with fixed position, so the hero section
  // can never clip it. It opens upwards when there isn't room below.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      const want = Math.min(popRef.current?.offsetHeight || 300, 300);
      const below = window.innerHeight - r.bottom - 8;
      const up = below < want && r.top - 8 > below;
      setPos(up ? { position: "fixed", left: r.left, width: r.width, bottom: window.innerHeight - r.top + 4, maxHeight: r.top - 12 } : { position: "fixed", left: r.left, width: r.width, top: r.bottom + 4, maxHeight: Math.max(160, below) });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      setPos(HIDDEN);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (!wrapRef.current?.contains(t) && !popRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [open]);

  // Keep the keyboard-highlighted option visible (scrolls the list only, never the page).
  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-i="${active}"]`);
    if (!open || !list || !el) return;
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop;
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;
  }, [open, active]);

  const pick = (v: string) => {
    onToggle(v);
    if (!multiple) setOpen(false);
  };
  const shown = options.filter(([, v]) => value.includes(v)).map(([l]) => l);

  return (
    <div ref={wrapRef} className="relative min-w-0">
      <span id={`${id}-label`} className={label}>{lbl}</span>
      <button
        ref={btnRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}`}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        aria-invalid={!!error}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); if (!open) setOpen(true); else setActive((i) => (i + 1) % options.length); }
          else if (e.key === "ArrowUp") { e.preventDefault(); if (!open) setOpen(true); else setActive((i) => (i - 1 + options.length) % options.length); }
          else if ((e.key === "Enter" || e.key === " ") && open) { e.preventDefault(); pick(options[active][1]); }
          else if (e.key === "Escape" && open) { e.preventDefault(); setOpen(false); }
          else if (e.key === "Tab") setOpen(false);
        }}
        className={`flex h-11 w-full items-center gap-2 rounded-[10px] border-[1.5px] bg-[#FBFCFE] pl-3 pr-2.5 text-left text-[15px] focus:outline-none focus:ring-[3px] focus:ring-[#2F63CC]/15 ${
          error ? fieldBad : open ? "border-[#2F63CC]" : "border-[#DBE3F0] hover:border-[#2F63CC]"
        }`}
      >
        <span className={`min-w-0 flex-1 truncate ${shown.length ? "text-neutral-900" : "text-neutral-400"}`}>
          {shown.length ? shown.join(", ") : placeholder}
        </span>
        {multiple && shown.length > 1 && (
          <span className="shrink-0 rounded-full bg-[#1A2A8C] px-1.5 text-[11px] font-bold leading-[18px] text-white">{shown.length}</span>
        )}
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#1A2A8C] transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div ref={popRef} style={pos} className="z-[95] flex flex-col overflow-hidden rounded-xl border-[1.5px] border-[#DBE3F0] bg-white font-sans text-neutral-900 shadow-[0_14px_30px_rgba(15,23,42,0.22)]">
          <ul ref={listRef} id={`${id}-list`} role="listbox" aria-multiselectable={multiple || undefined} aria-labelledby={`${id}-label`} className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
            {options.map(([l, v], i) => {
              const on = value.includes(v);
              return (
                <li
                  key={v}
                  id={`${id}-opt-${i}`}
                  data-i={i}
                  role="option"
                  aria-selected={on}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(v)}
                  className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 text-[14px] ${i === active ? "bg-[#EEF3FF]" : ""} ${on ? "font-semibold text-[#1A2A8C]" : "text-neutral-800"}`}
                >
                  <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center border-[1.5px] ${multiple ? "rounded-[5px]" : "rounded-full"} ${on ? "border-[#1A2A8C] bg-[#1A2A8C] text-white" : "border-[#B8C5DC] bg-white"}`}>
                    {on && <Check className="h-3 w-3" aria-hidden="true" />}
                  </span>
                  {l}
                </li>
              );
            })}
          </ul>
          {multiple && (
            <div className="border-t border-[#EEF2F8] px-2 py-1.5">
              <button type="button" onClick={() => { setOpen(false); btnRef.current?.focus(); }} className="h-8 w-full rounded-lg bg-[#1A2A8C] text-[13px] font-bold text-white">
                Done
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
      <FieldError msg={error} />
    </div>
  );
}

function FloatInput({ id, label: lbl, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: React.ReactNode; error?: string }) {
  return (
    <div className="min-w-0">
      <div className="relative">
        <input id={id} aria-invalid={!!error} {...props} placeholder=" " className={`${floatField} ${error ? fieldBad : ""}`} />
        <label htmlFor={id} className={floatLabel}>{lbl}</label>
      </div>
      <FieldError msg={error} />
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p role="alert" className="mt-1 text-[12px] leading-tight text-red-700">
      {msg}
    </p>
  );
}

export default function QuoteFormV2({
  defaultService = "",
  idPrefix = "qf2",
  variant = "hero",
}: { defaultService?: string; idPrefix?: string; variant?: "hero" | "modal" } = {}) {
  // Unique element ids, so the hero form and the pop-up form can sit on the same page.
  const P = idPrefix;
  const { phone: phoneDisplay, tel } = useContact();
  const rootRef = useRef<HTMLDivElement>(null);

  // A page can preselect its service (e.g. "Epoxy Grout"). If it isn't one of the
  // standard chips it gets its own chip, exactly like the old form sent it.
  const serviceChips = useMemo<[string, string][]>(
    () => (defaultService && !SERVICES.some(([, v]) => v === defaultService) ? [[defaultService, defaultService], ...SERVICES] : SERVICES),
    [defaultService]
  );
  const initialServices = defaultService ? [defaultService] : [];

  const [mode, setMode] = useState<Mode>("insp");
  const [isPM, setIsPM] = useState(false);
  const [step, setStep] = useState<StepId>("job");

  const [services, setServices] = useState<string[]>(initialServices);
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

  const [started, setStarted] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [photoAsk, setPhotoAsk] = useState(false);
  const photoAskBtnRef = useRef<HTMLButtonElement>(null);
  const [photoMenu, setPhotoMenu] = useState(false);
  const photoMenuBtnRef = useRef<HTMLButtonElement>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState<null | { booked: string | null; mode: Mode }>(null);

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
    finish: mode === "insp" ? "Book & finish" : "Photos & finish",
  };
  const stepIndex = Math.max(0, flow.indexOf(step));

  const scrollTop = () => {
    const el = rootRef.current;
    if (!el) return;
    if (el.getBoundingClientRect().top < 80) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const goTo = (s: StepId) => {
    setStep(s);
    requestAnimationFrame(scrollTop);
  };

  /* ---------- availability (same endpoint + rules as HeroQuoteForm) ---------- */
  const loadAvailability = useCallback(async (address: string, fresh = false) => {
    if (!address || address.trim().length < 5) return;
    if (fresh) {
      setDate("");
      setTime("");
    }
    setAvail({ status: "loading" });
    setAvailFor(address);
    try {
      const res = await fetch(`/api/inspection-availability?address=${encodeURIComponent(address)}&_=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.inServiceArea === false) {
        setDate("");
        setTime("");
        setAvail({ status: "outside", reason: json.zone === "coastal" ? "coastal" : "outside" });
      } else {
        const days: Day[] = (json.days || []).slice().sort((a: Day, b: Day) => a.date.localeCompare(b.date));
        setAvail({ status: "ok", days, durationMinutes: json.durationMinutes ?? 60, zoneDay: json.zoneDay || null, suburb: json.suburb });
        const firstOpen = days.find((d) => d.slots.some((s) => !s.booked));
        setDate((d) => (days.some((x) => x.date === d && x.slots.some((s) => !s.booked)) ? d : firstOpen?.date || ""));
        if (firstOpen) setCalMonth(parseYmd(firstOpen.date));
      }
    } catch {
      setAvail({ status: "error" });
    }
  }, []);

  // Load live inspection times when the visitor reaches the last step (or switches back to "inspection" there).
  const ensureAvailability = (s: StepId, m: Mode) => {
    if (s === "finish" && m === "insp" && data.address.trim() && availFor !== data.address) loadAvailability(data.address, true);
  };

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
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 300);
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
    if (!data.firstName.trim()) e.firstName = isPM ? "Please enter the manager's first name" : "Please enter your first name";
    if (!data.lastName.trim()) e.lastName = "Please enter a last name";
    if (!PHONE_RE.test(data.phone.trim())) e.phone = "Enter a valid mobile, e.g. 0412 345 678";
    if (!EMAIL_RE.test(data.email.trim())) e.email = "Enter a valid email address";
    if (data.address.trim().length < 3) e.address = isPM ? "Please enter the rental property address" : "Please enter the property address";
    setErrors(e);
    const first0 = Object.keys(e)[0];
    if (first0) document.getElementById(`${P}-${first0}`)?.focus();
    return !first0;
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
    setStarted(true);
    ensureAvailability(flow[stepIndex + 1], mode);
    goTo(flow[stepIndex + 1]);
  };
  const back = () => {
    setCalendarOpen(false);
    goTo(flow[Math.max(0, stepIndex - 1)]);
  };

  /* ---------- photos (same limits as HeroQuoteForm) ---------- */
  // Some Android galleries / cloud pickers hand back image files with an empty
  // MIME type, so fall back to the file extension before calling a file "not an image".
  const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|heic|heif|avif|bmp|tiff?)$/i;
  const isImageFile = (f: File) => f.type.startsWith("image/") || (f.type === "" && IMAGE_EXT_RE.test(f.name));

  // Forgiving picker: keep every usable photo and report only what was skipped,
  // instead of rejecting the whole selection because of one bad file.
  const addFiles = (list: FileList | File[]) => {
    const files = Array.from(list);
    if (!files.length) return;
    const notes: string[] = [];
    const images = files.filter((f) => {
      if (isImageFile(f)) return true;
      notes.push(`"${f.name}" isn't an image — skipped.`);
      return false;
    });
    const sized = images.filter((f) => {
      if (f.size <= MAX_FILE_SIZE_BYTES) return true;
      notes.push(`"${f.name}" is over the ${formatBytes(MAX_FILE_SIZE_BYTES)} per-photo limit — skipped.`);
      return false;
    });
    // No photo-count limit: customers can add as many photos as they like.
    // The per-photo size check above and the total size check below still apply.
    const picked = sized;
    let all = [...photos, ...picked];
    let total = all.reduce((a, f) => a + f.size, 0);
    if (total > MAX_TOTAL_BYTES) {
      while (picked.length && total > MAX_TOTAL_BYTES) {
        const dropped = picked.pop() as File;
        total -= dropped.size;
        notes.push(`"${dropped.name}" would take the total over ${formatBytes(MAX_TOTAL_BYTES)} — skipped.`);
      }
      all = [...photos, ...picked];
    }
    if (picked.length) setPhotos(all);
    setPhotoError(notes.join(" "));
  };
  const removePhoto = (i: number) => {
    setPhotos((p) => p.filter((_, x) => x !== i));
    setPhotoError("");
  };
  const thumbs = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => () => thumbs.forEach((u) => URL.revokeObjectURL(u)), [thumbs]);
  const photoBytes = photos.reduce((a, f) => a + f.size, 0);

  // Tapping the upload box: on touch devices (phones/tablets) open the source
  // chooser popup first — jumping straight into the gallery picker leaves no way
  // to reach the camera. On desktop/laptop keep the one-click file dialog and
  // never show a camera option.
  const openPhotoPicker = () => {
    const touch = typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 1024);
    if (touch) setPhotoMenu(true);
    else fileRef.current?.click();
  };

  useEffect(() => {
    if (!photoAsk) return;
    photoAskBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPhotoAsk(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [photoAsk]);

  useEffect(() => {
    if (!photoMenu) return;
    photoMenuBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPhotoMenu(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [photoMenu]);

  /* ---------- submit ---------- */
  const canBook = mode === "insp" && avail.status === "ok" && avail.days.length > 0;
  const submitLabel = mode === "quote" ? "Get My Free Quote" : canBook ? "Book My Free Inspection" : "Submit Details";

  const submit = async () => {
    setSubmitError("");
    setInspError("");
    if (mode === "insp" && avail.status === "loading") {
      setInspError("Loading inspection times, one moment…");
      return;
    }
    if (canBook && (!date || !time)) {
      setInspError(!date ? "Please pick a day for your free inspection." : "Please choose an arrival time.");
      return;
    }
    // Photos are required: without photos the form does not proceed.
    if (!photos.length) {
      setPhotoError("Please add at least one photo — photos are required.");
      setPhotoAsk(true);
      return;
    }
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setSubmitError("Just a moment, we're checking you're not a robot. Please try again in a few seconds.");
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
        } catch (cldErr) {
          console.warn("Direct Cloudinary upload failed, falling back to standard submit:", cldErr);
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
      payload.append("sourcePage", typeof window !== "undefined" ? window.location.pathname : "");
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
        // Slot taken between loading and submitting: reload live times and let them re-pick.
        if (body.slotConflict) {
          setTime("");
          setInspError(body.error || "That time is no longer available. Please pick another.");
          setAvailFor("");
          loadAvailability(data.address);
          turnstileRef.current?.reset();
          setCaptchaToken("");
          return;
        }
        throw new Error(body.error || "Something went wrong. Please try again.");
      }
      setDone({
        mode,
        booked: canBook && date && time && avail.status === "ok" ? `${dayLabel(date)}, ${formatSlotRange(time, avail.durationMinutes)}` : null,
      });
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
    setIsPM(false);
    setServices(initialServices);
    setAreas([]);
    setLeaking("");
    setDamaged([]);
    setJobErrors({});
    setData({ firstName: "", lastName: "", agency: "", phone: "", email: "", address: "", message: "" });
    setErrors({});
    setTenants([{ name: "", phone: "", email: "" }]);
    setTenantIdx(0);
    setTenantErrors({});
    setPhotos([]);
    setPhotoError("");
    setDate("");
    setTime("");
    setCalendarOpen(false);
    setInspError("");
    setSubmitError("");
    setNoteOpen(false);
    setPhotoAsk(false);
    setAvail({ status: "idle" });
    setAvailFor("");
  };

  /* ---------- pieces ---------- */
  const toggle = (list: string[], set: (v: string[]) => void, v: string, key: string) => {
    const nextList = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
    set(nextList);
    if (nextList.length && jobErrors[key]) setJobErrors((e) => ({ ...e, [key]: "" }));
  };
  // "No" and "Not sure" are exclusive, the other answers can be combined (same as HeroQuoteForm)
  const toggleDamaged = (v: string) => {
    setDamaged((list) => {
      if (v === "No" || v === "Not sure") return list.includes(v) ? [] : [v];
      const f = list.filter((x) => x !== "No" && x !== "Not sure");
      return f.includes(v) ? f.filter((x) => x !== v) : [...f, v];
    });
  };

  const input = (name: keyof typeof data, lbl: React.ReactNode, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <FloatInput
      id={`${P}-${name}`}
      label={lbl}
      value={data[name]}
      onChange={(e) => {
        setData((p) => ({ ...p, [name]: e.target.value }));
        if (errors[name]) setErrors((x) => ({ ...x, [name]: "" }));
      }}
      error={errors[name]}
      {...props}
    />
  );

  const days = avail.status === "ok" ? avail.days : [];
  const selectedDay = days.find((d) => d.date === date);
  const stripDays = (() => {
    if (!days.length) return [];
    const i = Math.max(0, days.findIndex((d) => d.date === date));
    const start = i >= 5 ? i - 4 : 0;
    return days.slice(start, start + 5);
  })();

  const pickDay = (d: string) => {
    setDate(d);
    setTime("");
    setInspError("");
  };

  const timeSelect = (id: string) =>
    selectedDay && avail.status === "ok" ? (
      <div className="mt-1.5">
        <label htmlFor={id} className="sr-only">Arrival time</label>
        <select
          id={id}
          value={time}
          onChange={(e) => { setTime(e.target.value); setInspError(""); }}
          className="h-10 w-full appearance-none rounded-[10px] border-[1.5px] border-[#CDD8EA] bg-[#FBFCFE] bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%228%22%20fill=%22none%22%20stroke=%22%231a2a8c%22%20stroke-width=%222%22%3E%3Cpath%20d=%22M1%201l5%205%205-5%22/%3E%3C/svg%3E')] bg-[length:12px_8px] bg-[right_14px_center] bg-no-repeat pl-3 pr-9 text-[15px] text-neutral-900 focus:border-[#1A2A8C] focus:outline-none focus:ring-[3px] focus:ring-[#2F63CC]/15"
        >
          <option value="">Choose arrival time for {dayLabel(selectedDay.date)}…</option>
          {selectedDay.slots.map((s) => (
            <option key={s.time} value={s.time} disabled={s.booked}>
              {formatSlotRange(s.time, avail.durationMinutes)}{s.booked ? " (Booked)" : ""}
            </option>
          ))}
        </select>
      </div>
    ) : null;

  const calendar = () => {
    const m = calMonth ?? (days[0] ? parseYmd(days[0].date) : new Date());
    const first = new Date(m.getFullYear(), m.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7;
    const count = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    const ymd = (d: number) => `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const months = Array.from(new Set(days.map((d) => d.date.slice(0, 7))));
    const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
    const mi = months.indexOf(key);
    const navBtn = "flex h-8 w-8 items-center justify-center rounded-lg border-[1.5px] border-[#DBE3F0] text-lg leading-none text-neutral-600 disabled:opacity-30";
    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between font-bold text-[#1A2A8C]">
          <button type="button" aria-label="Previous month" disabled={mi <= 0} onClick={() => mi > 0 && setCalMonth(parseYmd(`${months[mi - 1]}-01`))} className={navBtn}>‹</button>
          <span>{MONTH[m.getMonth()]} {m.getFullYear()}</span>
          <button type="button" aria-label="Next month" disabled={mi < 0 || mi >= months.length - 1} onClick={() => mi < months.length - 1 && setCalMonth(parseYmd(`${months[mi + 1]}-01`))} className={navBtn}>›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-neutral-500">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: lead }, (_, i) => <span key={`e${i}`} />)}
          {Array.from({ length: count }, (_, i) => {
            const v = ymd(i + 1);
            const ok = days.some((d) => d.date === v && d.slots.some((s) => !s.booked));
            const sel = v === date;
            return (
              <button key={v} type="button" disabled={!ok} aria-label={dayLabel(v)} aria-pressed={sel} onClick={() => pickDay(v)}
                className={`h-8 rounded-lg border-[1.5px] text-[13px] font-semibold ${
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

  const nav = (cta: React.ReactNode) => (
    <div className="mt-auto flex gap-2 pt-3">
      {stepIndex > 0 && (
        <button type="button" onClick={back} className={backBtn}>← Back</button>
      )}
      <div className="min-w-0 flex-1">{cta}</div>
    </div>
  );

  /* ---------- render ---------- */
  return (
    <div
      ref={rootRef}
      data-default-service={defaultService || undefined}
      className={`relative flex w-full scroll-mt-28 flex-col bg-white px-4 pb-3 pt-4 text-[15px] leading-[1.45] text-neutral-900 sm:px-6 ${
        variant === "modal"
          ? "min-h-[100dvh] pb-6 sm:min-h-0 sm:rounded-2xl sm:pb-3 sm:shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
          : "rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.28)]"
      }`}
      aria-label="Request a quote"
      role="form"
    >
      {done ? (
        <div className="m-auto px-1 py-10 text-center" aria-live="polite">
          <div className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <Check className="h-9 w-9" aria-hidden="true" />
          </div>
          <p className="mb-1.5 text-[15px] font-bold uppercase tracking-[1.5px] text-emerald-700">
            {done.booked ? "Inspection requested" : "Details received"}
          </p>
          <h3 className="mb-3 text-[26px] font-bold leading-tight text-[#001F97] sm:text-[28px]">Thank you for choosing Groutix</h3>
          <p className="mx-auto max-w-[420px] text-[17px] leading-relaxed text-slate-700">
            {done.booked ? (
              <>Your preferred inspection time, <strong>{done.booked}</strong>, has been received.</>
            ) : done.mode === "quote" ? (
              "Your quote request has been received. Our team will review it shortly."
            ) : (
              "Your details have been received. Our team will contact you to arrange your inspection."
            )}
          </p>
          <p className="mx-auto mt-2 max-w-[420px] text-[15px] leading-relaxed text-neutral-500">
            {done.booked ? "We'll keep that time wherever possible and only contact you if we need to arrange an alternative." : "We look forward to helping you."}
          </p>
          <p className="mt-4 text-lg font-bold text-neutral-900">Stay Sealed. Stay Smiling.</p>
          <p className="mt-5 text-[15px] text-neutral-500">Need it sooner?</p>
          <a href={tel} className="mt-2 inline-block rounded-xl border-[1.5px] border-[#1A2A8C] px-5 py-2.5 text-[17px] font-bold text-[#1A2A8C] hover:bg-[#EEF3FF]">
            Call {phoneDisplay}
          </a>
          <button type="button" onClick={reset} className="mx-auto mt-4 block text-[15px] text-neutral-500 underline">
            Submit another request
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-[20px] font-bold leading-tight text-[#001F97]">Request a Quote</h2>

          <div className="mb-2.5 mt-3.5 grid grid-cols-2 gap-2.5">
            {([
              ["insp", "Book free inspection", "Pick a day, we come to you"],
              ["quote", "Just get a quote", "Send details or photos"],
            ] as const).map(([m, t, s]) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => { setMode(m); setInspError(""); setCalendarOpen(false); ensureAvailability(step, m); }}
                className={`relative rounded-xl border-[1.5px] px-3 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#2F63CC]/40 ${
                  mode === m ? "border-[#001F97] bg-[#EEF3FF] shadow-[0_0_0_3px_rgba(47,99,204,0.15)]" : "border-[#DBE3F0] bg-white hover:border-[#2F63CC]"
                }`}
              >
                {m === "insp" && (
                  <span className="absolute -top-2.5 right-2.5 rounded-[10px] bg-[#001F97] px-2 py-0.5 text-[10.5px] font-bold leading-tight text-white">Recommended</span>
                )}
                <strong className="block text-sm leading-snug">{t}</strong>
                <span className="block text-xs leading-snug text-neutral-500">{s}</span>
              </button>
            ))}
          </div>

          <div className="mb-1.5 flex gap-1.5" aria-hidden="true">
            {flow.map((s, i) => (
              <i key={s} className={`h-[5px] flex-1 rounded-sm transition-colors ${i <= stepIndex ? "bg-[#2F63CC]" : "bg-slate-200"}`} />
            ))}
          </div>
          <div className="mb-1 flex justify-between text-xs text-neutral-500" aria-live="polite">
            <span>Step {stepIndex + 1} of {flow.length} · {stepLabels[step]}</span>
            <span>About 1 minute</span>
          </div>

          {/* STEP 1: THE JOB */}
          {step === "job" && (
            <div className="flex flex-1 flex-col">
              <label className="mt-1 flex cursor-pointer select-none items-center gap-2.5 text-sm font-semibold text-[#1F2D4D]">
                <input type="checkbox" checked={isPM} onChange={(e) => setIsPM(e.target.checked)} className="h-[18px] w-[18px] accent-[#001F97]" />
                I am a Property Manager / agent
              </label>
              <div className="mt-3 grid grid-cols-1 gap-x-3 gap-y-3 min-[420px]:grid-cols-2">
                <Dropdown
                  id={`${P}-areas`}
                  label={<>Which area? {req}</>}
                  placeholder="Select area(s)"
                  options={AREAS}
                  value={areas}
                  onToggle={(v) => toggle(areas, setAreas, v, "areas")}
                  error={jobErrors.areas}
                />
                <Dropdown
                  id={`${P}-services`}
                  label={<>What do you need done? {req}</>}
                  placeholder="Select service(s)"
                  options={serviceChips}
                  value={services}
                  onToggle={(v) => toggle(services, setServices, v, "services")}
                  error={jobErrors.services}
                />
                <Dropdown
                  id={`${P}-leaking`}
                  label={<>Is it currently leaking? {req}</>}
                  placeholder="Select one"
                  options={LEAKING.map((v) => [v, v] as [string, string])}
                  value={leaking ? [leaking] : []}
                  multiple={false}
                  onToggle={(v) => { setLeaking(v); setJobErrors((e) => ({ ...e, leaking: "" })); }}
                  error={jobErrors.leaking}
                />
                <Dropdown
                  id={`${P}-damaged`}
                  label={<>Any damaged tiles? <small className={opt}>(optional)</small></>}
                  placeholder="Select if any"
                  options={DAMAGED.map((v) => [v, v] as [string, string])}
                  value={damaged}
                  onToggle={toggleDamaged}
                />
              </div>
              {nav(<button type="button" onClick={next} className={primaryBtn}>Continue</button>)}
            </div>
          )}

          {/* STEP 2: DETAILS */}
          {step === "details" && (
            <div className="flex flex-1 flex-col gap-2.5 pt-2">
              <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
                {input("firstName", <>{isPM ? "Manager first name" : "First name"} {req}</>, { autoComplete: "given-name" })}
                {input("lastName", <>{isPM ? "Manager last name" : "Last name"} {req}</>, { autoComplete: "family-name" })}
              </div>
              {isPM && input("agency", <>Real estate agency / company <span className="font-normal">(optional)</span></>, { autoComplete: "organization" })}
              <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
                {input("phone", <>{isPM ? "Manager mobile" : "Mobile"} {req}</>, { type: "tel", inputMode: "tel", autoComplete: "tel" })}
                {input("email", <>{isPM ? "Manager email" : "Email"} {req}</>, { type: "email", autoComplete: "email" })}
              </div>
              <div className="relative">
                <div className="relative">
                  <input
                    id={`${P}-address`}
                    value={data.address}
                    onChange={(e) => onAddress(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setSuggestOpen(true)}
                    onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !(suggestOpen && activeSuggest >= 0)) { e.preventDefault(); setSuggestOpen(false); next(); return; }
                      if (!suggestOpen || !suggestions.length) return;
                      if (e.key === "ArrowDown") { e.preventDefault(); setActiveSuggest((i) => (i + 1) % suggestions.length); }
                      else if (e.key === "ArrowUp") { e.preventDefault(); setActiveSuggest((i) => (i - 1 + suggestions.length) % suggestions.length); }
                      else if (e.key === "Enter") { e.preventDefault(); pickSuggestion(suggestions[activeSuggest]); }
                      else if (e.key === "Escape") { e.preventDefault(); setSuggestOpen(false); }
                    }}
                    role="combobox"
                    aria-expanded={suggestOpen}
                    aria-controls={`${P}-address-list`}
                    aria-autocomplete="list"
                    aria-invalid={!!errors.address}
                    autoComplete="off"
                    placeholder=" "
                    className={`${floatField} ${errors.address ? fieldBad : ""}`}
                  />
                  <label htmlFor={`${P}-address`} className={floatLabel}>{isPM ? "Rental property address" : "Property address or suburb"} {req}</label>
                </div>
                {suggestOpen && (
                  <ul id={`${P}-address-list`} role="listbox" className="absolute left-0 right-0 top-full z-30 mt-0.5 max-sm:bottom-full max-sm:top-auto max-sm:mb-1 max-sm:mt-0 overflow-hidden rounded-[10px] border-[1.5px] border-[#DBE3F0] bg-white py-1 shadow-[0_10px_24px_rgba(15,23,42,0.16)]">

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
              {nav(<button type="button" onClick={next} className={primaryBtn}>Continue</button>)}
            </div>
          )}

          {/* STEP 3 (property managers): TENANT ACCESS */}
          {step === "tenants" && (
            <div className="flex flex-1 flex-col pt-2">
              <h3 className="mb-2 text-sm font-bold">Tenant access details <small className={opt}>(so we can arrange access)</small></h3>
              <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                {tenants.map((_, i) => (
                  <button key={i} type="button" aria-pressed={i === tenantIdx} onClick={() => { setTenantIdx(i); setTenantErrors({}); }}
                    className={`min-h-8 rounded-full border-[1.5px] px-3 text-[13px] font-semibold ${i === tenantIdx ? "border-[#1A2A8C] bg-[#EEF3FF] text-[#1A2A8C]" : "border-[#DBE3F0] bg-white"}`}>
                    Tenant {i + 1}
                  </button>
                ))}
                {tenants.length < 6 && (
                  <button type="button" onClick={() => { setTenants((t) => [...t, { name: "", phone: "", email: "" }]); setTenantIdx(tenants.length); setTenantErrors({}); }}
                    className="min-h-8 rounded-full border-[1.5px] border-dashed border-[#B8C5DC] px-3 text-[13px] font-semibold text-[#2F63CC]">
                    + Add tenant
                  </button>
                )}
                {tenants.length > 1 && (
                  <button type="button" onClick={() => { setTenants((t) => t.filter((_, i) => i !== tenantIdx)); setTenantIdx(0); setTenantErrors({}); }}
                    className="ml-auto min-h-8 px-1 text-[12.5px] text-neutral-500 underline">Remove tenant {tenantIdx + 1}</button>
                )}
              </div>
              {(() => {
                const t = tenants[tenantIdx] ?? tenants[0];
                const upd = (k: keyof Tenant, v: string) => {
                  setTenants((all) => all.map((x, i) => (i === tenantIdx ? { ...x, [k]: v } : x)));
                  if (tenantErrors[k]) setTenantErrors((e) => ({ ...e, [k]: undefined }));
                };
                return (
                  <div className="flex flex-col gap-2.5">
                    <FloatInput id={`${P}-tn`} label={<>Tenant {tenantIdx + 1} name {req}</>} value={t.name} onChange={(e) => upd("name", e.target.value)} error={tenantErrors.name} />
                    <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
                      <FloatInput id={`${P}-tp`} type="tel" inputMode="tel" label={<>Tenant phone {req}</>} value={t.phone} onChange={(e) => upd("phone", e.target.value)} error={tenantErrors.phone} />
                      <FloatInput id={`${P}-te`} type="email" label={<>Tenant email <span className="font-normal">(optional)</span></>} value={t.email} onChange={(e) => upd("email", e.target.value)} error={tenantErrors.email} />
                    </div>
                  </div>
                );
              })()}
              {nav(<button type="button" onClick={next} className={primaryBtn}>Continue</button>)}
            </div>
          )}

          {/* LAST STEP: BOOK & FINISH */}
          {step === "finish" && (
            <div className="flex flex-1 flex-col">
              {mode === "insp" && (
                <div>
                  {!calendarOpen && (
                    <>
                      <div className="mb-1.5 mt-2 flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold">Choose your inspection day <small className={opt}>(free)</small></h3>
                        <button type="button" onClick={() => setShowHow((v) => !v)} aria-expanded={showHow} className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-[#2F63CC] hover:underline">
                          <Info className="h-3.5 w-3.5" aria-hidden="true" /> How it works
                        </button>
                      </div>
                      {showHow && (
                        <p className="mb-1.5 rounded-xl border-[1.5px] border-[#2F63CC] bg-white px-3 py-2 text-[12.5px] text-slate-700">
                          Free on-site inspections are available across our service area. Addresses close to our base can be booked on most days; further out we visit one part of Melbourne per day, so you&apos;ll see the days our inspector is already in your area. For properties more than 50 km away, or in coastal areas, our team arranges the time with you directly.
                        </p>
                      )}
                    </>
                  )}
                  {avail.status === "loading" && (
                    <div className="grid grid-cols-6 gap-1.5" role="status" aria-label="Loading available days">
                      {Array.from({ length: 6 }, (_, i) => <span key={i} className="h-[44px] animate-pulse rounded-[10px] bg-slate-100" />)}
                    </div>
                  )}
                  {avail.status === "error" && (
                    <div className="rounded-[10px] border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
                      We couldn&apos;t load inspection times just now. Submit your details and we&apos;ll call you to book a time.{" "}
                      <button type="button" onClick={() => { setAvailFor(""); loadAvailability(data.address); }} className="font-bold underline">Try again</button>
                    </div>
                  )}
                  {avail.status === "outside" && (
                    <div className="rounded-[10px] border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
                      <b className="block text-sm">{avail.reason === "coastal" ? "Coastal area" : "More than 50 km from our base"}</b>
                      Online times aren&apos;t offered for this address. Submit your details and our team will arrange your inspection directly.
                    </div>
                  )}
                  {avail.status === "ok" && days.length === 0 && (
                    <div className="rounded-[10px] border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
                      No online times are open in the next few weeks. Submit your details and we&apos;ll call you to book a time.
                    </div>
                  )}
                  {avail.status === "ok" && days.length > 0 && !calendarOpen && (
                    <>
                      {avail.zoneDay && !time && (
                        <p className="mb-1.5 rounded-lg bg-[#EEF3FF] px-2.5 py-1 text-xs text-[#1A2A8C]">
                          Our inspector visits {avail.suburb ? `the ${avail.suburb} area` : "your area"} on {avail.zoneDay}.
                        </p>
                      )}
                      <div className="grid grid-cols-6 gap-1.5">
                        {stripDays.map((d) => {
                          const dt = parseYmd(d.date);
                          const sel = d.date === date;
                          const full = !d.slots.some((s) => !s.booked);
                          return (
                            <button key={d.date} type="button" disabled={full} aria-pressed={sel} aria-label={dayLabel(d.date)} onClick={() => pickDay(d.date)}
                              className={`rounded-[10px] border-[1.5px] px-0.5 py-[3px] text-center transition-colors ${sel ? "border-[#1A2A8C] bg-[#1A2A8C] text-white" : "border-[#DBE3F0] bg-white hover:border-[#2F63CC] disabled:opacity-40"}`}>
                              <small className={`block text-[10.5px] ${sel ? "text-[#CFE0FF]" : "text-neutral-500"}`}>{WD[dt.getDay()]}</small>
                              <b className="block text-[15px] leading-tight">{dt.getDate()}</b>
                            </button>
                          );
                        })}
                        <button type="button" onClick={() => { setCalendarOpen(true); setCalMonth(date ? parseYmd(date) : parseYmd(days[0].date)); }}
                          className="rounded-[10px] border-[1.5px] border-[#2F63CC] bg-[#EEF3FF] px-0.5 py-[3px] text-center">
                          <small className="block text-[10.5px] text-neutral-500">More</small>
                          <CalendarDays className="mx-auto h-[19px] w-[19px] text-[#1A2A8C]" aria-hidden="true" />
                        </button>
                      </div>
                      {time && selectedDay ? (
                        <div className="mt-1.5 rounded-[10px] border border-[#BFE6D0] bg-[#EFFAF4] px-3 py-1">
                          <div className="flex items-center justify-between gap-2 text-[13px] leading-snug text-[#0F6B43]">
                            <span>✓ Preferred time: <b>{dayLabel(selectedDay.date)}, {formatSlotRange(time, avail.durationMinutes)}</b></span>
                            <button type="button" onClick={() => setTime("")} className="shrink-0 text-xs font-bold text-[#1A2A8C] underline">Change time</button>
                          </div>
                          <p className="text-[11px] leading-tight text-[#4B6B5C]">If this time becomes unavailable, our team will contact you to arrange an alternative.</p>
                        </div>
                      ) : (
                        timeSelect(`${P}-time`)
                      )}
                    </>
                  )}
                  {avail.status === "ok" && days.length > 0 && calendarOpen && (
                    <div className="mt-1.5">
                      <h3 className="mb-1 text-sm font-bold">Pick a date <small className={opt}>(free inspection)</small></h3>
                      {calendar()}
                      <h3 className="mb-0 mt-2 text-sm font-bold">Choose a time</h3>
                      {timeSelect(`${P}-cal-time`)}
                      <button type="button" onClick={() => setCalendarOpen(false)} className="mt-2 h-10 w-full rounded-[10px] bg-[#1A2A8C] text-sm font-bold text-white">
                        {date && time ? `Confirm ${shortDay(date)}, ${formatSlotRange(time, avail.durationMinutes)}` : "Back to days"}
                      </button>
                    </div>
                  )}
                  {inspError && <p role="alert" className="mt-1.5 text-[12.5px] font-medium text-red-700">{inspError}</p>}
                </div>
              )}

              {!calendarOpen && (
                <>
                  <div className={`${mode === "insp" ? "mt-2.5" : "mt-1.5"} flex items-stretch gap-2`}>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={photos.length ? "Add more photos" : "Add photos"}
                    onClick={() => openPhotoPicker()}
                    onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openPhotoPicker(); } }}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
                    className={`flex min-h-[46px] min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-xl border-[1.5px] border-dashed px-2 py-1 transition-colors ${dragging ? "border-[#1A2A8C] bg-[#EEF3FF]" : photoError ? "border-red-500 bg-[#FBFCFE]" : "border-[#B8C5DC] bg-[#FBFCFE] hover:border-[#2F63CC]"}`}
                  >
                    {photos.length ? (
                      <ul className="flex min-w-0 flex-1 flex-wrap items-center gap-2" aria-label="Added photos">
                        {thumbs.map((u, i) => (
                          <li key={u} className="relative h-9 w-9 rounded-md bg-slate-100 bg-cover bg-center ring-1 ring-black/5" style={{ backgroundImage: `url(${u})` }} title={photos[i]?.name}>
                            <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                              className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#0A123F] text-white hover:bg-red-600">
                              <X className="h-2.5 w-2.5" aria-hidden="true" />
                            </button>
                          </li>
                        ))}
                          <li className="flex h-9 w-9 items-center justify-center rounded-md border-[1.5px] border-dashed border-[#B8C5DC] text-lg leading-none text-[#1A2A8C]" aria-hidden="true">+</li>
                        <li className="text-[11px] leading-tight text-neutral-500">
                          {photos.length} photos
                          <br />
                          {formatBytes(photoBytes)} of {formatBytes(MAX_TOTAL_BYTES)}
                        </li>
                      </ul>
                    ) : (
                      <>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF2F8]"><ImagePlus className="h-4 w-4 text-[#1A2A8C]" aria-hidden="true" /></span>
                        <span className="min-w-0 flex-1 text-[13px] font-semibold leading-tight">
                          Upload photos<span className="hidden sm:inline"> of the problem</span>
                          <small className="block truncate text-[11px] font-normal text-neutral-500"><span className="sm:hidden">Tap to add</span><span className="hidden sm:inline">Click or drag · {formatBytes(MAX_TOTAL_BYTES)} max in total</span></small>
                        </span>
                      </>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
                    <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
                  </div>
                  {!(noteOpen || data.message) && (
                    <button type="button" onClick={() => setNoteOpen(true)} aria-label="Add a note (optional)"
                      className="flex w-[64px] shrink-0 flex-col items-center justify-center rounded-xl border-[1.5px] border-[#DBE3F0] bg-white text-[11.5px] font-semibold leading-tight text-[#2F63CC] hover:border-[#2F63CC]">
                      <span className="text-base leading-none">+</span>Add note
                    </button>
                  )}
                  </div>
                  <FieldError msg={photoError} />

                  {(noteOpen || data.message) && (
                    <div className="mt-2">
                      <label htmlFor={`${P}-message`} className={label}>Anything else we should know? <small className={opt}>(optional)</small></label>
                      <textarea id={`${P}-message`} rows={2} autoFocus value={data.message} onChange={(e) => setData((p) => ({ ...p, message: e.target.value }))}
                        placeholder="e.g. cracked tiles, mould, ceiling stains"
                        className="block min-h-10 w-full resize-y rounded-[10px] border-[1.5px] border-[#DBE3F0] bg-[#FBFCFE] px-3 py-2 text-[15px] leading-snug placeholder:text-neutral-400 focus:border-[#2F63CC] focus:outline-none focus:ring-[3px] focus:ring-[#2F63CC]/15" />
                    </div>
                  )}

                  {submitError && <p role="alert" className="mt-2 rounded-lg bg-red-50 px-2.5 py-2 text-[13px] text-red-700">{submitError}</p>}

                  {nav(
                    <button type="button" onClick={() => submit()} disabled={loading} className={primaryBtn}>
                      {loading ? "Sending…" : submitLabel}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Photo source chooser (mobile/tablet only): the box tap — and the reminder
              popup's Upload button — open this instead of jumping straight into the
              gallery picker, which has no camera option. Never shown on desktop. */}
          {photoMenu && (
            <div className="absolute inset-0 z-40 flex items-end justify-center rounded-2xl bg-[#0A123F]/45 p-4 backdrop-blur-[2px] sm:items-center" onClick={() => setPhotoMenu(false)}>
              <div role="dialog" aria-modal="true" data-qf-popup aria-labelledby={`${P}-photo-menu`} onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[380px] rounded-2xl bg-white p-5 text-center shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                <h3 id={`${P}-photo-menu`} className="text-lg font-bold text-[#001F97]">Add photos</h3>
                <p className="mt-1.5 text-sm text-slate-600">Take a new photo or pick from your gallery.</p>
                <button ref={photoMenuBtnRef} type="button" onClick={() => { setPhotoMenu(false); camRef.current?.click(); }}
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#2F63CC] to-[#001F97] text-[15px] font-bold text-white">
                  <Camera className="h-4 w-4" aria-hidden="true" /> Take a photo
                </button>
                <button type="button" onClick={() => { setPhotoMenu(false); fileRef.current?.click(); }}
                  className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-[#DBE3F0] text-[15px] font-semibold text-neutral-700 hover:border-[#2F63CC] hover:text-neutral-900">
                  <ImagePlus className="h-4 w-4" aria-hidden="true" /> Pick from gallery
                </button>
                <button type="button" onClick={() => setPhotoMenu(false)}
                  className="mt-2 h-10 w-full rounded-xl text-sm font-semibold text-neutral-500 hover:text-neutral-800">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Photos are required: shown when they submit without photos. */}
          {photoAsk && (
            <div className="absolute inset-0 z-40 flex items-center justify-center rounded-2xl bg-[#0A123F]/45 p-4 backdrop-blur-[2px]" onClick={() => setPhotoAsk(false)}>
              <div role="dialog" aria-modal="true" data-qf-popup aria-labelledby={`${P}-photo-ask`} onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[380px] rounded-2xl bg-white p-5 text-center shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF3FF]">
                  <ImagePlus className="h-6 w-6 text-[#1A2A8C]" aria-hidden="true" />
                </span>
                <h3 id={`${P}-photo-ask`} className="text-lg font-bold text-[#001F97]">Please upload photos</h3>
                <p className="mt-1.5 text-sm text-slate-600">
                  Photos of the shower, grout or leak are required — they help us understand the problem and give you an accurate quote faster.
                </p>
                <button ref={photoAskBtnRef} type="button" onClick={() => { setPhotoAsk(false); openPhotoPicker(); }}
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#2F63CC] to-[#001F97] text-[15px] font-bold text-white">
                  <ImagePlus className="h-4 w-4" aria-hidden="true" /> Upload photos
                </button>
              </div>
            </div>
          )}

          {/* Bot check: loads once the visitor moves past step 1 and only shows itself if Cloudflare needs a click. */}
          {TURNSTILE_SITE_KEY && started && (
            <div className="mt-1 empty:hidden">
              <Turnstile
                ref={turnstileRef}
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={(t) => { setCaptchaToken(t); setSubmitError(""); }}
                onExpire={() => setCaptchaToken("")}
                onError={() => setCaptchaToken("")}
                options={{ theme: "light", size: "flexible", appearance: "interaction-only" }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
