"use client";

import { useEffect, useRef, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { DEFAULT_CHECKLIST_FORM, type ChecklistForm, type SmartQuestion } from "@/lib/checklistForm";
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
  category?: string;
  contentType?: string;
  url: string;
  secureUrl: string;
  publicId: string;
};

type PageState = {
  id: string;
  service: string;
  photoCategory: string;
  customAnswers: Record<string, { label: string; value: string | string[] }>;
  areaName: string;
  areaDescription: string;
  issues: string[];
  dimensionsLength: string;
  dimensionsWidth: string;
  measurementsUnknown: boolean;
  floorTileSize: string;
  damagedTiles: string;
  spareTiles: string;
  groutPreference: string;
  preferInspection: boolean;
  balconyLevel: string;
  balconyBelow: string;
  balconySkirting: string;
  balconyWork: string[];
  previousRepairs: string;
  previousRepairNotes: string;
  areaWork: string[];
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
    service: "",
    photoCategory: "",
    customAnswers: {},
    areaName: "",
    areaDescription: "",
    issues: [],
    dimensionsLength: "",
    dimensionsWidth: "",
    measurementsUnknown: false,
    floorTileSize: "",
    damagedTiles: "",
    spareTiles: "",
    groutPreference: "",
    preferInspection: false,
    balconyLevel: "",
    balconyBelow: "",
    balconySkirting: "",
    balconyWork: [],
    previousRepairs: "",
    previousRepairNotes: "",
    areaWork: [],
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
  "service", "photoCategory", "areaName", "areaDescription", "issues", "dimensionsLength", "dimensionsWidth", "floorTileSize",
  "damagedTiles", "spareTiles", "groutPreference", "balconyLevel", "balconyBelow",
  "balconySkirting", "balconyWork", "previousRepairs", "previousRepairNotes", "areaWork",
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
  base.customAnswers = raw?.customAnswers && typeof raw.customAnswers === "object" ? raw.customAnswers : {};
  base.measurementsUnknown = Boolean(raw?.measurementsUnknown);
  base.preferInspection = Boolean(raw?.preferInspection);
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
  category,
  onChange,
}: {
  photos: Photo[];
  category: string;
  onChange: (next: Photo[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    if (!category) { setError("Select a photo category first."); return; }
    if (photos.length + files.length > 20) { setError("Please upload no more than 20 photos per area."); return; }
    if (Array.from(files).some(file => !file.type.startsWith("image/") || file.size > 12 * 1024 * 1024)) { setError("Please choose image files smaller than 12 MB each."); return; }
    setBusy(true);
    setError("");
    try {
      const uploaded: Photo[] = [];
      for (const file of Array.from(files)) {
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
          category,
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
          disabled={busy || !category}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {busy ? "Uploading…" : category ? `Add photos · ${category}` : "Select a category above"}
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
              {photo.category ? `${photo.category}: ` : ""}{photo.name}
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

const showerIssues = ["Water leaking outside the shower", "Water stains on walls or ceiling below", "Cracked or missing grout", "Mouldy or deteriorated silicone", "Discoloured or dirty grout", "Loose or cracked tiles", "General shower restoration", "Not sure"] as const;
const balconyIssues = ["Water leaking into the property below", "Water entering through the balcony door", "Cracked or missing grout", "Deteriorated perimeter sealant", "Loose or cracked tiles", "Water pooling on the balcony", "General maintenance", "Not sure"] as const;
const otherWork = ["Floor tiles", "Wall tiles", "Perimeter sealant", "Cracked or loose tiles", "Other"] as const;
const yesNoUnknown = [["Yes", "Yes"], ["No", "No"], ["Not sure", "Not sure"]] as const;
const tileSizes = [["Mosaic", "Mosaic · up to 50 mm"], ["Small", "Small · about 100 mm"], ["Medium", "Medium · about 200–300 mm"], ["Large", "Large · about 300–600 mm"], ["Extra Large", "Extra large · 600 mm+"], ["Not sure", "Not sure"]] as const;

function VisualGuide({ kind }: { kind: "shower" | "walls" | "tiles" }) {
  if (kind === "shower") return <div className="grid grid-cols-2 gap-3 text-center text-xs text-slate-600" aria-label="Standard showers are about 900 by 900 millimetres; large showers are wider"><div className="rounded-xl bg-slate-50 p-3"><div className="mx-auto mb-2 h-14 w-14 rounded-md border-4 border-[#001f97] bg-blue-50"/>Standard · about 900 × 900 mm</div><div className="rounded-xl bg-slate-50 p-3"><div className="mx-auto mb-2 h-14 w-24 rounded-md border-4 border-[#001f97] bg-blue-50"/>Large · wider or double</div></div>;
  if (kind === "walls") return <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-600" aria-label="Diagrams show one, two, and three tiled shower walls viewed from above">{[1, 2, 3].map(count => <div key={count} className="rounded-xl bg-slate-50 p-2"><div className={`mx-auto mb-2 h-14 w-14 border-t-[6px] border-[#001f97] ${count > 1 ? "border-l-[6px]" : ""} ${count > 2 ? "border-r-[6px]" : ""}`}/>{count} wall{count > 1 ? "s" : ""}</div>)}</div>;
  return <div className="grid grid-cols-4 gap-2 text-center text-[11px] text-slate-600" aria-label="Tile size visual guide from mosaic to large">{[["Mosaic", 5], ["Small", 4], ["Medium", 2], ["Large", 1]].map(([name, count]) => <div key={name} className="rounded-xl bg-slate-50 p-2"><div className="mx-auto mb-2 grid h-14 w-14 gap-px border border-slate-300 bg-white" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>{Array.from({ length: Number(count) ** 2 }, (_, i) => <span key={i} className="bg-blue-200"/>)}</div>{name}</div>)}</div>;
}

export default function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || searchParams.get("t") || "";
  const [loading, setLoading] = useState(Boolean(id && token));
  const [error, setError] = useState<string | null>(id && token ? null : "This quote request link is missing or invalid.");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<ChecklistForm>(DEFAULT_CHECKLIST_FORM);
  const [pages, setPages] = useState<PageState[]>([blankPage()]);
  const [timeframe, setTimeframe] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [accessNotes, setAccessNotes] = useState("");
  const [additionalInformation, setAdditionalInformation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!id || !token) return;
    fetch(`/api/checklist/${id}?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async res => { const data = await res.json(); if (!res.ok || !data.ok) throw new Error(data.error || "Quote request could not be loaded."); return data; })
      .then(data => {
        setCustomer(data.customer || null);
        if (data.form) setForm(data.form);
        const saved = data.answers;
        if (Array.isArray(saved?.pages) && saved.pages.length) setPages(saved.pages.map((p: Partial<PageState>, i: number) => hydratePage(p, i)));
        setTimeframe(saved?.timeframe || ""); setPropertyType(saved?.propertyType || "");
        setAccessNotes(saved?.accessNotes || ""); setAdditionalInformation(saved?.additionalInformation || "");
        if (data.submitted) setDone(true);
      })
      .catch(err => setError(err instanceof Error ? err.message : "Network error while loading the request."))
      .finally(() => setLoading(false));
  }, [id, token]);

  function pingStarted() {
    if (started) return;
    setStarted(true);
    fetch(`/api/checklist/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, event: "started" }) }).catch(() => {});
  }
  function updatePage(index: number, patch: Partial<PageState>) {
    pingStarted();
    setPages(prev => prev.map((page, i) => i === index ? { ...page, ...patch } : page));
  }
  function textField(index: number, key: keyof PageState, placeholder: string, type = "text") {
    return <input type={type} min={type === "number" ? "0" : undefined} inputMode={type === "number" ? "decimal" : undefined} className={inputCls} placeholder={placeholder} value={String(pages[index][key] ?? "")} onChange={e => updatePage(index, { [key]: e.target.value })} />;
  }
  function question(title: string, children: React.ReactNode, hint?: string) {
    if (title !== "What area requires attention?" && form.hiddenQuestions?.includes(title)) return null;
    return <div className="space-y-2.5 border-t border-slate-100 pt-5"><h3 className={label}>{form.questionLabels?.[title] || title}</h3>{hint && <p className="text-xs text-slate-500">{hint}</p>}{children}</div>;
  }
  function multi(options: readonly string[], values: string[], change: (value: string[]) => void) {
    return <CheckboxGroup options={options.map(item => [item, item] as const)} value={values} onChange={change} />;
  }
  function customQuestion(page: PageState, index: number, q: SmartQuestion) {
    const value = page.customAnswers[q.id]?.value ?? (q.type === "multiple" ? [] : "");
    const update = (next: string | string[]) => updatePage(index, { customAnswers: { ...page.customAnswers, [q.id]: { label: q.label, value: next } } });
    let control: React.ReactNode;
    if (q.type === "multiple") control = multi(q.options, Array.isArray(value) ? value : [], update);
    else if (q.type === "single") control = <Chips options={q.options.map(option => [option, option] as const)} value={String(value)} onChange={update}/>;
    else if (q.type === "textarea") control = <textarea className={inputCls} rows={3} value={String(value)} onChange={event => update(event.target.value)}/>;
    else control = <input className={inputCls} type={q.type === "number" ? "number" : "text"} min={q.type === "number" ? 0 : undefined} value={String(value)} onChange={event => update(event.target.value)}/>;
    return <div key={q.id} className="space-y-2.5 border-t border-slate-100 pt-5"><h3 className={label}>{q.label}{q.required ? " *" : ""}</h3>{control}</div>;
  }
  async function handleSubmit() {
    setSubmitError("");
    if (pages.some(page => !page.service)) { setSubmitError("Select a service for each area."); return; }
    if (pages.some(page => form.customQuestions?.some(q => q.required && (q.service === "All" || q.service === page.service) && !(Array.isArray(page.customAnswers[q.id]?.value) ? (page.customAnswers[q.id].value as string[]).length : String(page.customAnswers[q.id]?.value || "").trim())))) { setSubmitError("Please answer all questions marked with *."); return; }
    if (!form.hiddenQuestions.includes("Photos for your quote") && pages.some(page => !page.preferInspection && page.photos.length < (page.service === "Shower" ? 4 : 3))) {
      setSubmitError("Add the requested photos for each area, or choose an on-site assessment."); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/checklist/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, answers: { pages, timeframe, propertyType, accessNotes, additionalInformation } }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not submit your quote request.");
      setDone(true); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) { setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again."); }
    finally { setSubmitting(false); }
  }
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-600">Loading your quote request…</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center p-4"><div className={`${card} max-w-md text-center`}><AlertCircle className="w-9 h-9 text-rose-600 mx-auto"/><h1 className="text-xl font-bold">Quote request notice</h1><p>{error}</p><a className="text-[#001f97] font-semibold" href="tel:+61370238094">Call (03) 7023 8094</a></div></div>;
  if (done) return <div className="min-h-screen flex items-center justify-center p-4"><div className={`${card} max-w-lg text-center`}><CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto"/><h1 className="text-2xl font-black">Thank you!</h1><p className="text-sm text-slate-600">Your quote request has been received. Our team will review the details and photos, then contact you about a preliminary quote or next steps.</p><p className="font-bold text-[#001f97]">Stay Sealed. Stay Smiling.</p></div></div>;
  return <div className="min-h-screen py-8 px-4 sm:px-6"><div className="max-w-3xl mx-auto space-y-6">
    <header className="flex items-center justify-between bg-white rounded-2xl p-5 border border-slate-200"><Image src="/new_logo.jpeg" alt="Groutix" width={150} height={44} className="h-11 w-auto object-contain"/><a href="tel:+61370238094" className="text-sm font-bold text-[#001f97] inline-flex gap-1.5 items-center"><Phone className="w-4 h-4"/>(03) 7023 8094</a></header>
    <div className={card}><p className="text-xs font-bold uppercase tracking-wide text-[#001f97]">{form.title}</p><h1 className="text-2xl font-black text-slate-900">Let’s restore your space.</h1><p className="text-sm text-slate-600">{customer?.name ? `Hi ${customer.name.split(" ")[0]}, ` : ""}{form.intro} Allow about 3–5 minutes per area. Choose “Not sure” whenever you need our advice.</p></div>
    {pages.map((page, index) => <section key={page.id} className={card}>
      <div className="flex items-center justify-between"><h2 className="text-lg font-black text-[#001f97]">{form.pageTitle} {index + 1}{page.service ? ` · ${page.service}` : ""}</h2>{pages.length > 1 && <button type="button" className="text-xs font-semibold text-rose-600 inline-flex gap-1 items-center" onClick={() => setPages(prev => prev.filter((_, i) => i !== index))}><Trash2 className="w-4 h-4"/>Remove</button>}</div>
      {question("What area requires attention?", <div className="grid grid-cols-2 gap-2">{form.serviceChoices.map(service => <button key={service} type="button" aria-pressed={page.service === service} onClick={() => { if (page.service !== service) updatePage(index, { ...blankPage(), id: page.id, service }); }} className={`rounded-xl border-2 min-h-16 p-3 text-left font-bold text-sm ${page.service === service ? "border-[#001f97] bg-blue-50 text-[#001f97]" : "border-slate-200 text-slate-700"}`}>{form.serviceLabels?.[service] || service}</button>)}</div>)}
      {page.service && <>
        {question("Select Photo Category", <Chips options={(form.photoCategories || []).map((name, i) => [String(i + 1), `${i + 1}. ${name}`] as const)} value={page.photoCategory} onChange={v => updatePage(index, { photoCategory: v })}/>, "Choose the category that matches the photos you will add. Change it before adding another set.")}
        {question(page.service === "Shower" ? "Which shower requires attention?" : "What should we call this area?", <><Chips options={(page.service === "Shower" ? ["Main bathroom", "Ensuite", "Guest bathroom", "Other"] : page.service === "Balcony" ? ["Front balcony", "Rear balcony", "Other"] : ["Main bathroom", "Ensuite", "Laundry", "Kitchen", "Other"]).map(v => [v, v] as const)} value={page.areaName} onChange={v => updatePage(index, { areaName: v })}/>{page.areaName === "Other" && textField(index, "areaDescription", "Describe this area")}</>)}
        {question("What problems are you experiencing?", multi(page.service === "Shower" ? showerIssues : page.service === "Balcony" ? balconyIssues : otherWork, page.issues, v => updatePage(index, { issues: v })), "Select all that apply.")}
        {page.issues.some(issue => /water|leak/i.test(issue)) && question("Where do you notice water or moisture?", textField(index, "leakageNotes", "For example, outside the shower or ceiling downstairs"))}
        {page.service === "Shower" && <>
          {question("How large is your shower?", <><VisualGuide kind="shower"/><Chips options={[["SS", "Standard / single · about 900 × 900 mm"], ["DS", "Large / double"], ["Not sure", "Not sure"]]} value={page.showerType} onChange={v => updatePage(index, { showerType: v })}/><div className="grid grid-cols-2 gap-2">{textField(index, "dimensionsLength", "Length in mm", "number")}{textField(index, "dimensionsWidth", "Width in mm", "number")}</div></>)}
          {question("How many tiled walls are inside the shower?", <><VisualGuide kind="walls"/><Chips options={[["1", "1 wall"], ["2", "2 walls"], ["3", "3 walls"], ["Not sure", "Not sure"]]} value={page.numberOfWalls} onChange={v => updatePage(index, { numberOfWalls: v })}/></>)}
          {question("What would you like restored?", <><Chips options={[["WF", "Entire shower · walls and floor"], ["FO", "Floor only"], ["WO", "Walls only"], ["Partial", "Selected areas only"], ["Silicone", "Silicone only"], ["Not sure", "Please recommend"]]} value={page.workRequired} onChange={v => updatePage(index, { workRequired: v })}/>{page.workRequired === "Partial" && textField(index, "selectiveAreas", "Describe the selected areas")}</>)}
          {["WF", "WO", "Partial", "Not sure"].includes(page.workRequired) && question("How high are the wall tiles to be regrouted?", <Chips options={[["SH", "Up to shower screen height"], ["TC", "To ceiling"], ["Lower", "Lower section only"], ["Other", "Other height"], ["Not sure", "Not sure"]]} value={page.wallHeight} onChange={v => updatePage(index, { wallHeight: v })}/>)}
          {question("What size are the tiles?", <><VisualGuide kind="tiles"/><p className="text-xs font-semibold">Wall tiles</p><Chips options={tileSizes} value={page.tileSize} onChange={v => updatePage(index, { tileSize: v })}/><p className="text-xs font-semibold">Floor tiles</p><Chips options={[...tileSizes, ["Acrylic", "Acrylic base · no floor tiles"]]} value={page.floorTileSize} onChange={v => updatePage(index, { floorTileSize: v })}/></>)}
          {question("What type of shower screen do you have?", <Chips options={[["Frameless", "Frameless · glass without a border"], ["Semi-frameless", "Semi-frameless · slim border"], ["Fully framed", "Fully framed"], ["None", "No shower screen"], ["Not sure", "Not sure"]]} value={page.showerScreen} onChange={v => updatePage(index, { showerScreen: v })}/>)}
          {question("Are any tiles cracked, loose or lifting?", <><Chips options={yesNoUnknown} value={page.damagedTiles} onChange={v => updatePage(index, { damagedTiles: v })}/>{page.damagedTiles === "Yes" && <><div className="grid grid-cols-2 gap-2">{textField(index, "crackedWallTiles", "Number of wall tiles", "number")}{textField(index, "crackedFloorTiles", "Number of floor tiles", "number")}</div><p className="text-xs font-semibold">Do you have matching spare tiles?</p><Chips options={yesNoUnknown} value={page.spareTiles} onChange={v => updatePage(index, { spareTiles: v })}/></>}</>)}
          {question("Do you have a preferred grout?", <Chips options={[["EG", "Premium epoxy"], ["PG", "Traditional grout"], ["Not sure", "Please recommend"]]} value={page.groutPreference} onChange={v => updatePage(index, { groutPreference: v })}/>)}
          {question("Anything else you would like us to quote?", <>{multi(["Shower screen silicone replacement", "Bathroom floor regrouting", "Bathroom perimeter silicone", "Vanity silicone replacement", "Bathtub silicone replacement", "Shower screen replacement", "Tile repairs"], page.additionalAreas, v => updatePage(index, { additionalAreas: v }))}{textField(index, "additionalNotes", "Other requirements")}</>)}
        </>}
        {page.service === "Balcony" && <>
          {question("Where is the balcony located?", <Chips options={["Ground floor / courtyard", "First floor", "Second floor or above", "Rooftop terrace"].map(v => [v, v] as const)} value={page.balconyLevel} onChange={v => updatePage(index, { balconyLevel: v })}/>)}
          {question("Approximate balcony size", <><div className="grid grid-cols-2 gap-2">{textField(index, "dimensionsLength", "Length in metres", "number")}{textField(index, "dimensionsWidth", "Width in metres", "number")}</div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={page.measurementsUnknown} onChange={e => updatePage(index, { measurementsUnknown: e.target.checked })}/>I’m not sure of the measurements</label></>)}
          {question("What is directly below the balcony?", <Chips options={["Bedroom or living area", "Another apartment", "Garage", "Outdoor / open area", "Not sure"].map(v => [v, v] as const)} value={page.balconyBelow} onChange={v => updatePage(index, { balconyBelow: v })}/>)}
          {question("What size are the balcony tiles?", <Chips options={tileSizes} value={page.balconyTileSize} onChange={v => updatePage(index, { balconyTileSize: v })}/>)}
          {question("Are there skirting tiles along the walls?", <Chips options={yesNoUnknown} value={page.balconySkirting} onChange={v => updatePage(index, { balconySkirting: v })}/>, "Skirting tiles are the short row of tiles that runs up the wall from the floor.")}
          {question("Are any tiles loose, cracked or lifting?", <><Chips options={yesNoUnknown} value={page.damagedTiles} onChange={v => updatePage(index, { damagedTiles: v })}/>{page.damagedTiles === "Yes" && textField(index, "crackedFloorTiles", "Approximate number of affected tiles", "number")}</>)}
          {question("What work would you like completed?", multi(["Entire balcony regrouting and resealing", "Floor regrouting only", "Perimeter resealing only", "Skirting tile repairs", "Cracked or loose tile repairs", "Not sure — please recommend"], page.balconyWork, v => updatePage(index, { balconyWork: v })))}
          {question("Has the balcony been repaired or investigated before?", <><Chips options={yesNoUnknown} value={page.previousRepairs} onChange={v => updatePage(index, { previousRepairs: v })}/>{page.previousRepairs === "Yes" && textField(index, "previousRepairNotes", "Tell us about repairs or reports")}</>)}
        </>}
        {page.service !== "Shower" && page.service !== "Balcony" && <>{question("Which parts need attention?", multi(otherWork, page.areaWork, v => updatePage(index, { areaWork: v })))}{question("Approximate dimensions, if known", <div className="grid grid-cols-2 gap-2">{textField(index, "dimensionsLength", "Length in metres", "number")}{textField(index, "dimensionsWidth", "Width in metres", "number")}</div>)}{question("Tell us more about the work", textField(index, "additionalNotes", "Describe the area and what you would like help with"))}</>}
        {form.customQuestions?.filter(q => q.service === "All" || q.service === page.service).map(q => customQuestion(page, index, q))}
        {question("Photos for your quote", <><div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-600">{(page.service === "Shower" ? ["Entire shower, including screen", "Floor, drain and edges", "Tiled walls and corners", "Close-ups of problem areas"] : page.service === "Balcony" ? ["Entire balcony", "Floor tiles", "Edges, skirting and drainage", "Close-ups of damage"] : ["Entire area", "Floor and walls", "Edges and joints", "Close-ups of problem areas"]).map((hint, i) => <div key={hint} className="rounded-lg bg-slate-50 p-2"><strong>Photo {i + 1}:</strong> {hint}</div>)}</div><Photos photos={page.photos} category={page.photoCategory ? form.photoCategories?.[Number(page.photoCategory) - 1] || "General photos" : "General photos"} onChange={v => updatePage(index, { photos: v })}/><p className="text-xs text-slate-500">{page.service === "Shower" ? "Please add at least four clear photos" : "Please add at least three clear photos"} for a remote quote.</p><label className="flex gap-2 items-start text-sm text-slate-700"><input className="mt-1" type="checkbox" checked={page.preferInspection} onChange={e => updatePage(index, { preferInspection: e.target.checked })}/>I can’t provide photos and would prefer an on-site assessment.</label></>)}
      </>}
    </section>)}
    <button type="button" onClick={() => { pingStarted(); setPages(prev => [...prev, blankPage()]); }} className="w-full rounded-2xl border-2 border-dashed border-[#001f97]/40 bg-white p-4 font-bold text-[#001f97] inline-flex items-center justify-center gap-2"><Plus className="w-4 h-4"/>Add another area</button>
    <section className={card}><h2 className="text-lg font-black text-[#001f97]">You’re almost done</h2><p className="text-sm text-slate-600">A few final details will help us prepare your quote.</p>{question("Preferred timeframe", <Chips options={[["Urgent", "As soon as possible"], ["Two weeks", "Within two weeks"], ["Month", "Within a month"], ["Flexible", "Flexible"], ["Pricing", "Just gathering quotes"]]} value={timeframe} onChange={v => { pingStarted(); setTimeframe(v); }}/>) }{question("Property type", <Chips options={[["House", "House / townhouse"], ["Apartment", "Apartment / unit"], ["Commercial", "Commercial property"]]} value={propertyType} onChange={v => { pingStarted(); setPropertyType(v); }}/>) }{question("Access or parking restrictions", <textarea className={inputCls} rows={2} placeholder="Apartment access, stairs, paid parking…" value={accessNotes} onChange={e => setAccessNotes(e.target.value)}/>)}{question("Additional information", <textarea className={inputCls} rows={3} placeholder="Anything else we should know?" value={additionalInformation} onChange={e => setAdditionalInformation(e.target.value)}/>)}<p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">Remote quotes are based on the information and photos provided. Final pricing and suitability may require further assessment or verification before work begins.</p></section>
    {submitError && <p role="alert" className="text-sm text-rose-600 inline-flex gap-2 items-center"><AlertCircle className="w-4 h-4"/>{submitError}</p>}
    <button type="button" disabled={submitting} onClick={handleSubmit} className="w-full rounded-2xl bg-[#001f97] p-4 text-white font-black disabled:opacity-60 inline-flex items-center justify-center gap-2">{submitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <CheckCircle2 className="w-5 h-5"/>}{submitting ? "Submitting…" : "Submit my quote request"}</button>
    <footer className="text-center text-xs text-slate-400 pb-10">Groutix Australia Pty Ltd · (03) 7023 8094 · info@groutix.com</footer>
  </div></div>;
}
