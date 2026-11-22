"use client";

import { useEffect, useRef, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import { CHECKLIST_OPTIONS } from "@/lib/checklistOptions";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Phone,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

type Photo = {
  name: string;
  contentType?: string;
  url: string;
  secureUrl: string;
  publicId: string;
};

type PageState = {
  id: string;
  showerLeakage: string;
  leakageNotes: string;
  showerType: string;
  wallHeight: string;
  workRequired: string;
  selectiveAreas: string;
  numberOfWalls: string;
  tileSize: string;
  mosaic: string;
  showerScreen: string;
  siliconeJoints: string[];
  crackedWallTiles: string;
  crackedFloorTiles: string;
  tileAction: string;
  additionalAreas: string[];
  additionalNotes: string;
  balconyLeakage: string;
  balconyArea: string;
  balconyTileSize: string;
  photos: Photo[];
};

type Customer = { name: string; email: string; address: string; service: string; areas: string };

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "hsg6orfs";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "groutix";

let pageCounter = 0;
function blankPage(): PageState {
  pageCounter += 1;
  return {
    id: `page-${Date.now()}-${pageCounter}`,
    showerLeakage: "",
    leakageNotes: "",
    showerType: "",
    wallHeight: "",
    workRequired: "",
    selectiveAreas: "",
    numberOfWalls: "",
    tileSize: "",
    mosaic: "",
    showerScreen: "",
    siliconeJoints: [],
    crackedWallTiles: "",
    crackedFloorTiles: "",
    tileAction: "",
    additionalAreas: [],
    additionalNotes: "",
    balconyLeakage: "",
    balconyArea: "",
    balconyTileSize: "",
    photos: [],
  };
}

const PAGE_KEYS: (keyof PageState)[] = [
  "showerLeakage", "leakageNotes", "showerType", "wallHeight", "workRequired", "selectiveAreas",
  "numberOfWalls", "tileSize", "mosaic", "showerScreen", "siliconeJoints", "crackedWallTiles",
  "crackedFloorTiles", "tileAction", "additionalAreas", "additionalNotes", "balconyLeakage",
  "balconyArea", "balconyTileSize",
];

/** Revive saved answers (older docs may be missing keys). */
function hydratePage(raw: Partial<PageState> | undefined, index: number): PageState {
  const base = blankPage();
  base.id = raw?.id || `page-${index + 1}`;
  for (const key of PAGE_KEYS) {
    const value = raw?.[key];
    if (Array.isArray(value)) {
      (base[key] as string[]) = value.map(String);
    } else if (typeof value === "string") {
      (base[key] as string) = value;
    }
  }
  base.photos = Array.isArray(raw?.photos) ? (raw!.photos as Photo[]) : [];
  return base;
}

const card = "bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5";
const label = "text-sm font-bold text-slate-800";
const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#001f97] focus:outline-none focus:ring-2 focus:ring-[#001f97]/20";

function Chips({
  options,
  value,
  onChange,
}: {
  options: readonly (readonly [string, string])[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([val, text]) => (
        <button
          key={val}
          type="button"
          onClick={() => onChange(value === val ? "" : val)}
          className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors cursor-pointer ${
            value === val
              ? "border-[#001f97] bg-[#001f97] text-white"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function CheckboxGroup({
  options,
  value,
  onChange,
}: {
  options: readonly (readonly [string, string])[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (val: string) =>
    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([val, text]) => (
        <button
          key={val}
          type="button"
          onClick={() => toggle(val)}
          className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors cursor-pointer ${
            value.includes(val)
              ? "border-[#001f97] bg-[#001f97]/10 text-[#001f97]"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function Photos({
  photos,
  onChange,
}: {
  photos: Photo[];
  onChange: (next: Photo[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setBusy(true);
    setError("");
    try {
      const uploaded: Photo[] = [];
      for (const file of Array.from(files).slice(0, 10)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("upload_preset", UPLOAD_PRESET);
        fd.append("folder", "groutix/checklists");
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: "POST",
          body: fd,
        });
        if (!res.ok) throw new Error(`Upload failed for ${file.name}`);
        const result = await res.json();
        uploaded.push({
          name: file.name,
          contentType: file.type || "image/jpeg",
          url: result.secure_url || result.url,
          secureUrl: result.secure_url || result.url,
          publicId: result.public_id,
        });
      }
      onChange([...photos, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {busy ? "Uploading…" : "Add photos"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {photos.length > 0 && (
          <span className="text-[12px] text-slate-500">{photos.length} photo(s) attached</span>
        )}
      </div>
      {error && <p className="text-[12px] text-rose-600">{error}</p>}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((photo) => (
            <span
              key={photo.publicId || photo.url}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[12px] text-slate-600"
            >
              {photo.name}
              <button
                type="button"
                onClick={() => onChange(photos.filter((p) => p !== photo))}
                className="text-slate-400 hover:text-rose-600 cursor-pointer"
                aria-label={`Remove ${photo.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || searchParams.get("t") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pages, setPages] = useState<PageState[]>([blankPage()]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!id || !token) {
      setError("This checklist link is missing or invalid.");
      setLoading(false);
      return;
    }
    fetch(`/api/checklist/${id}?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) {
          setError(data.error || "Checklist could not be loaded.");
          return;
        }
        setCustomer(data.customer || null);
        const saved = data.answers?.pages;
        if (Array.isArray(saved) && saved.length) {
          setPages(saved.map((p: Partial<PageState>, i: number) => hydratePage(p, i)));
        }
        if (data.submitted) setDone(true);
      })
      .catch(() => setError("Network error while loading the checklist."))
      .finally(() => setLoading(false));
  }, [id, token]);

  function pingStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    fetch(`/api/checklist/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, event: "started" }),
    }).catch(() => {});
  }

  function updatePage(index: number, patch: Partial<PageState>) {
    pingStarted();
    setPages((prev) => prev.map((page, i) => (i === index ? { ...page, ...patch } : page)));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/checklist/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, answers: { pages } }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not submit the checklist.");
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#001f97] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading your checklist…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-slate-900">Checklist Notice</h1>
          <p className="text-sm text-slate-600">{error}</p>
          <a
            href="tel:+61370238094"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#001f97] text-white text-xs font-bold hover:bg-[#001777] transition-colors"
          >
            <Phone className="w-3.5 h-3.5" /> Call (03) 7023 8094
          </a>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-sm border border-emerald-100 p-8 sm:p-10 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Thank you!</h1>
          <p className="text-sm text-slate-600">
            Your regrouting &amp; resealing checklist has been received. Our team is preparing your
            accurate quote and will be in touch shortly.
          </p>
          <p className="text-base font-bold text-[#001f97]">Stay Sealed. Stay Smiling.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between bg-white rounded-2xl p-5 px-6 shadow-xs border border-slate-200">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/new_logo.jpeg" alt="Groutix" className="h-11 w-auto object-contain" />
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-500">Need help?</div>
            <a
              href="tel:+61370238094"
              className="text-sm font-black text-[#001f97] hover:underline flex items-center gap-1.5 justify-end"
            >
              <Phone className="w-3.5 h-3.5" /> (03) 7023 8094
            </a>
          </div>
        </header>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Shower / Balcony Grouting &amp; Resealing Checklist
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {customer?.name ? `Hi ${customer.name.split(" ")[0]}, ` : ""}answer the questions below so
            we can prepare your accurate quote. Add one page per shower or balcony.
          </p>
        </div>

        {pages.map((page, index) => (
          <section key={page.id} className={card}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-[#001f97]">Shower / Balcony {index + 1}</h2>
              {pages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setPages((prev) => prev.filter((_, i) => i !== index))}
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>

            {/* 1. Leakage */}
            <div className="space-y-2">
              <label className={label}>1. Is the shower leaking?</label>
              <Chips
                options={CHECKLIST_OPTIONS.yesNo}
                value={page.showerLeakage}
                onChange={(v) => updatePage(index, { showerLeakage: v })}
              />
              <input
                className={inputCls}
                placeholder="Any additional information (optional)"
                value={page.leakageNotes}
                onChange={(e) => updatePage(index, { leakageNotes: e.target.value })}
              />
            </div>

            {/* 2. Shower type */}
            <div className="space-y-2">
              <label className={label}>2. Shower type</label>
              <Chips
                options={CHECKLIST_OPTIONS.showerType}
                value={page.showerType}
                onChange={(v) => updatePage(index, { showerType: v })}
              />
            </div>

            {/* 3. Wall height */}
            <div className="space-y-2">
              <label className={label}>3. Wall height</label>
              <Chips
                options={CHECKLIST_OPTIONS.wallHeight}
                value={page.wallHeight}
                onChange={(v) => updatePage(index, { wallHeight: v })}
              />
            </div>

            {/* 4. Work required */}
            <div className="space-y-2">
              <label className={label}>4. Work required</label>
              <Chips
                options={CHECKLIST_OPTIONS.workRequired}
                value={page.workRequired}
                onChange={(v) => updatePage(index, { workRequired: v })}
              />
              <input
                className={inputCls}
                placeholder="Selective areas? Please specify (e.g. 2–3 tiles high / floor)"
                value={page.selectiveAreas}
                onChange={(e) => updatePage(index, { selectiveAreas: e.target.value })}
              />
            </div>

            {/* 5. Number of walls */}
            <div className="space-y-2">
              <label className={label}>5. Number of tiled walls</label>
              <Chips
                options={CHECKLIST_OPTIONS.numberOfWalls}
                value={page.numberOfWalls}
                onChange={(v) => updatePage(index, { numberOfWalls: v })}
              />
            </div>

            {/* 6. Tile size */}
            <div className="space-y-2">
              <label className={label}>6. Tile size</label>
              <Chips
                options={CHECKLIST_OPTIONS.tileSize}
                value={page.tileSize}
                onChange={(v) => updatePage(index, { tileSize: v })}
              />
            </div>

            {/* 7. Mosaic */}
            <div className="space-y-2">
              <label className={label}>7. Mosaic tiles?</label>
              <Chips
                options={CHECKLIST_OPTIONS.yesNo}
                value={page.mosaic}
                onChange={(v) => updatePage(index, { mosaic: v })}
              />
            </div>

            {/* 8. Shower screen */}
            <div className="space-y-2">
              <label className={label}>8. Shower screen</label>
              <Chips
                options={CHECKLIST_OPTIONS.showerScreen}
                value={page.showerScreen}
                onChange={(v) => updatePage(index, { showerScreen: v })}
              />
            </div>

            {/* 9. Silicone joints */}
            <div className="space-y-2">
              <label className={label}>9. Silicone joints needing replacement</label>
              <CheckboxGroup
                options={CHECKLIST_OPTIONS.siliconeJoints}
                value={page.siliconeJoints}
                onChange={(v) => updatePage(index, { siliconeJoints: v })}
              />
            </div>

            {/* 10. Cracked tiles */}
            <div className="space-y-3">
              <label className={label}>
                10. Cracked / loose / drummy / lifted tiles (for repair or replacement)
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-[12px] font-semibold text-slate-500">Wall tiles</span>
                  <Chips
                    options={CHECKLIST_OPTIONS.tileCount}
                    value={page.crackedWallTiles}
                    onChange={(v) => updatePage(index, { crackedWallTiles: v })}
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[12px] font-semibold text-slate-500">Floor tiles</span>
                  <Chips
                    options={CHECKLIST_OPTIONS.tileCount}
                    value={page.crackedFloorTiles}
                    onChange={(v) => updatePage(index, { crackedFloorTiles: v })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="text-[12px] font-semibold text-slate-500">Repair or replace?</span>
                <Chips
                  options={CHECKLIST_OPTIONS.tileAction}
                  value={page.tileAction}
                  onChange={(v) => updatePage(index, { tileAction: v })}
                />
              </div>
            </div>

            {/* 11. Additional areas */}
            <div className="space-y-2">
              <label className={label}>11. Additional areas requiring work</label>
              <CheckboxGroup
                options={CHECKLIST_OPTIONS.additionalAreas.map((a) => [a, a] as const)}
                value={page.additionalAreas}
                onChange={(v) => updatePage(index, { additionalAreas: v })}
              />
              <input
                className={inputCls}
                placeholder="Please specify any other areas"
                value={page.additionalNotes}
                onChange={(e) => updatePage(index, { additionalNotes: e.target.value })}
              />
            </div>

            {/* Balcony */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <h3 className="text-sm font-black text-slate-800">Balcony</h3>
              <div className="space-y-2">
                <label className={label}>Balcony leakage?</label>
                <Chips
                  options={CHECKLIST_OPTIONS.yesNo}
                  value={page.balconyLeakage}
                  onChange={(v) => updatePage(index, { balconyLeakage: v })}
                />
              </div>
              <div className="space-y-2">
                <label className={label}>Balcony area (sq m)</label>
                <input
                  className={inputCls}
                  placeholder="e.g. 8"
                  value={page.balconyArea}
                  onChange={(e) => updatePage(index, { balconyArea: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className={label}>Balcony tile size</label>
                <Chips
                  options={CHECKLIST_OPTIONS.tileSize}
                  value={page.balconyTileSize}
                  onChange={(v) => updatePage(index, { balconyTileSize: v })}
                />
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-2">
              <label className={label}>Photos (optional, recommended)</label>
              <Photos
                photos={page.photos}
                onChange={(next) => updatePage(index, { photos: next })}
              />
            </div>
          </section>
        ))}

        <button
          type="button"
          onClick={() => setPages((prev) => [...prev, blankPage()])}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#001f97]/40 bg-white px-4 py-3.5 text-sm font-bold text-[#001f97] hover:bg-[#001f97]/5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Another Shower/Balcony Page
        </button>

        {submitError && (
          <p className="text-sm text-rose-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {submitError}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-2xl bg-[#16a34a] hover:bg-[#15803d] px-6 py-4 text-base font-black text-white shadow-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Submitting…
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" /> Submit Checklist(s)
            </>
          )}
        </button>

        <footer className="text-center text-xs text-slate-400 pt-2 pb-10 space-y-1">
          <div>Groutix Australia Pty Ltd • Melbourne, Victoria</div>
          <div>(03) 7023 8094 • info@groutix.com • www.groutix.com</div>
        </footer>
      </div>
    </div>
  );
}
