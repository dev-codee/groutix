"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Archive, ArrowDownToLine, ArrowUpFromLine, Boxes, History, Loader2, Pencil, Plus, RefreshCcw, RotateCcw, Search, X } from "lucide-react";
import { MATERIAL_UNITS, materialStatus, type Material, type MaterialMovement, type MovementType } from "@/lib/materials";

const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none disabled:opacity-60";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed";
const primaryClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed";
const number = (value: number) => value.toLocaleString("en-AU", { maximumFractionDigits: 3 });
const money = (value: number) => value.toLocaleString("en-AU", { style: "currency", currency: "AUD" });
const movementLabels: Record<MovementType, string> = { opening: "Opening balance", receive: "Stock received", use: "Stock used", return: "Stock returned", adjust: "Stock count correction" };

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, cache: "no-store", headers: { "Content-Type": "application/json", ...options?.headers } });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "The request failed. Please try again.");
  return result as T;
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5 text-xs font-semibold text-slate-600"><span>{label}</span>{children}</label>;
}
function ErrorMessage({ error }: { error: string }) {
  return error ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null;
}
function Modal({ title, children, onClose, busy = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  return <dialog ref={dialog} aria-label={title} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-2xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/50">
    <div className="flex items-center justify-between border-b border-slate-100 p-5"><h2 className="text-lg font-bold">{title}</h2><button type="button" aria-label="Close dialog" disabled={busy} onClick={onClose} className={buttonClass}><X className="h-4 w-4" /></button></div>
    <div className="p-5">{children}</div>
  </dialog>;
}
function MaterialForm({ item, onClose, onSaved }: { item?: Material; onClose: () => void; onSaved: (item: Material) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(crypto.randomUUID());
  // Preserve the ID for an identical retry, but use a new one if the form changes.
  const previousPayload = useRef("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const payload = { name: data.get("name"), sku: data.get("sku"), category: data.get("category"), unit: item?.unit || data.get("unit"), supplier: data.get("supplier"), location: data.get("location"), notes: data.get("notes"), reorderLevel: Number(data.get("reorderLevel")), unitCost: Number(data.get("unitCost")), ...(item ? { action: "edit", version: item.version } : { openingQuantity: Number(data.get("openingQuantity")) }) };
    const fingerprint = JSON.stringify(payload);
    if (previousPayload.current && previousPayload.current !== fingerprint) requestId.current = crypto.randomUUID();
    previousPayload.current = fingerprint;
    setBusy(true); setError("");
    try {
      const result = await request<{ item: Material }>(item ? `/api/admin/materials/${item.id}` : "/api/admin/materials", { method: item ? "PATCH" : "POST", body: JSON.stringify({ ...payload, requestId: requestId.current }) });
      onSaved(result.item);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <Modal title={item ? "Edit material" : "Add material"} onClose={onClose} busy={busy}>
    <form onSubmit={save} className="space-y-4">
      <ErrorMessage error={error} />
      <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
        <Field label="Material name *"><input autoFocus className={inputClass} name="name" required maxLength={160} defaultValue={item?.name} placeholder="e.g. Epoxy grout — white" /></Field>
        <Field label="Unique SKU *"><input className={`${inputClass} uppercase`} name="sku" required maxLength={64} defaultValue={item?.sku} placeholder="e.g. GR-WHITE-01" /></Field>
        <Field label="Category"><input className={inputClass} name="category" maxLength={80} defaultValue={item?.category} placeholder="e.g. Grout, silicone, tools" /></Field>
        <Field label="Stock unit *"><select className={inputClass} name="unit" disabled={Boolean(item)} defaultValue={item?.unit || "piece"}>{MATERIAL_UNITS.map(unit => <option key={unit}>{unit}</option>)}</select></Field>
        {!item && <Field label="Opening stock *"><input className={inputClass} name="openingQuantity" type="number" required min="0" max="1000000000" step="0.001" defaultValue="0" /></Field>}
        <Field label="Low-stock threshold *"><input className={inputClass} name="reorderLevel" type="number" required min="0" max="1000000000" step="0.001" defaultValue={item?.reorderLevel ?? 0} /></Field>
        <Field label="Cost per stock unit (AUD) *"><input className={inputClass} name="unitCost" type="number" required min="0" max="1000000000" step="0.01" defaultValue={item?.unitCost ?? 0} /></Field>
        <Field label="Storage location"><input className={inputClass} name="location" maxLength={120} defaultValue={item?.location} placeholder="e.g. Warehouse, shelf A" /></Field>
        <Field label="Supplier"><input className={inputClass} name="supplier" maxLength={160} defaultValue={item?.supplier} /></Field>
        <div className="sm:col-span-2"><Field label="Notes"><textarea className={inputClass} name="notes" rows={3} maxLength={2000} defaultValue={item?.notes} placeholder="Colour, size, pack contents or handling notes" /></Field></div>
      </fieldset>
      <p className="text-xs text-slate-500">{item ? "Use stock actions to change quantities. The stock unit is fixed to keep history consistent." : "Count all movements in the selected unit. For example, one box means one complete box, not the pieces inside it."} Low-stock alerts include items at or below their threshold.</p>
      <div className="flex justify-end gap-2"><button type="button" onClick={onClose} disabled={busy} className={buttonClass}>Cancel</button><button disabled={busy} className={primaryClass}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{item ? "Save changes" : "Add material"}</button></div>
    </form>
  </Modal>;
}
function MovementForm({ item, initialType, onClose, onSaved }: { item: Material; initialType: Exclude<MovementType, "opening">; onClose: () => void; onSaved: (item: Material) => void }) {
  const [type, setType] = useState(initialType);
  const [quantity, setQuantity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(crypto.randomUUID());
  const previousPayload = useRef("");
  const projected = type === "adjust" ? Number(quantity) : (Math.round(item.quantity * 1000) + (type === "use" ? -1 : 1) * Math.round(Number(quantity) * 1000)) / 1000;
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget);
    const payload = { type, quantity: Number(quantity), reason: form.get("reason"), reference: form.get("reference"), version: item.version };
    const fingerprint = JSON.stringify(payload);
    if (previousPayload.current && previousPayload.current !== fingerprint) requestId.current = crypto.randomUUID();
    previousPayload.current = fingerprint;
    setBusy(true); setError("");
    try {
      const result = await request<{ item: Material }>(`/api/admin/materials/${item.id}/movements`, { method: "POST", body: JSON.stringify({ ...payload, requestId: requestId.current }) });
      onSaved(result.item);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <Modal title="Update stock" onClose={onClose} busy={busy}><form onSubmit={save} className="space-y-4">
    <div className="rounded-xl bg-slate-50 p-4"><p className="font-semibold">{item.name}</p><p className="text-sm text-slate-500">{item.sku} · Available: <strong className="text-slate-800">{number(item.quantity)} {item.unit}</strong></p></div>
    <ErrorMessage error={error} />
    <fieldset disabled={busy} className="space-y-4">
      <Field label="Stock action"><select className={inputClass} value={type} onChange={e => { setType(e.target.value as typeof type); setQuantity(""); }}>{(["receive", "use", "return", "adjust"] as const).map(value => <option key={value} value={value}>{movementLabels[value]}</option>)}</select></Field>
      <Field label={`${type === "adjust" ? "Actual counted stock" : "Quantity"} (${item.unit}) *`}><input autoFocus className={inputClass} type="number" required min={type === "adjust" ? "0" : "0.001"} max={type === "use" ? item.quantity : 1000000000} step="0.001" value={quantity} onChange={e => setQuantity(e.target.value)} /></Field>
      {type === "adjust" && <p className="text-xs text-amber-700">Enter the total stock physically counted. The difference will be recorded as a correction.</p>}
      <Field label="Reason *"><textarea className={inputClass} name="reason" required maxLength={500} rows={2} placeholder={type === "adjust" ? "Explain the difference, e.g. damaged stock or count correction" : "e.g. Supplier delivery, used on a job, unused stock returned"} /></Field>
      <Field label="Job / purchase reference (optional)"><input className={inputClass} name="reference" maxLength={160} placeholder="e.g. Job-1042 or PO-008" /></Field>
    </fieldset>
    {quantity !== "" && Number.isFinite(projected) && <p className={`rounded-xl p-3 text-sm ${projected < 0 ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-800"}`}>Balance after this movement: <strong>{number(projected)} {item.unit}</strong></p>}
    <div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className={buttonClass}>Cancel</button><button className={primaryClass} disabled={busy || projected < 0 || quantity === "" || (type === "adjust" && projected === item.quantity)}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Record movement</button></div>
  </form></Modal>;
}
function HistoryModal({ item, onClose }: { item: Material; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ movements: MaterialMovement[]; hasMore: boolean; item: Material } | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError("");
    request<{ movements: MaterialMovement[]; hasMore: boolean; item: Material }>(`/api/admin/materials/${item.id}/movements?page=${page}`, { signal: controller.signal }).then(setData).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [item.id, page, retry]);
  return <Modal title="Stock history" onClose={onClose}>
    <p className="font-semibold">{item.name} <span className="text-sm font-normal text-slate-500">· {item.sku}</span></p>
    <p className="mb-4 text-sm text-slate-500">Current stock: {number(data?.item.quantity ?? item.quantity)} {item.unit}. Latest movements first.</p>
    <ErrorMessage error={error} />
    {error && <button className={`${buttonClass} mt-3`} onClick={() => setRetry(value => value + 1)}>Retry</button>}
    {!data && !error && <p role="status" className="py-8 text-center text-sm text-slate-500">Loading history…</p>}
    {data && <><ol className="divide-y divide-slate-100">{data.movements.map(movement => <li key={movement.id} className="space-y-1 py-4">
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{movementLabels[movement.type]}</p><p className="text-xs text-slate-500">{new Date(movement.createdAt).toLocaleString("en-AU")} · {movement.actor}</p></div><div className="shrink-0 text-right"><p className={`text-sm font-bold ${movement.quantity < 0 ? "text-rose-600" : "text-emerald-700"}`}>{movement.quantity > 0 ? "+" : ""}{number(movement.quantity)} {item.unit}</p><p className="text-xs text-slate-500">Balance: {number(movement.balance)}</p></div></div>
      <p className="whitespace-pre-wrap break-words text-sm text-slate-700">{movement.reason}</p>{movement.reference && <p className="break-words text-xs text-slate-500">Reference: {movement.reference}</p>}
    </li>)}</ol>{!data.movements.length && <p className="py-6 text-sm text-slate-500">No stock movements on this page.</p>}
    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-4"><button className={buttonClass} disabled={page === 1} onClick={() => setPage(value => value - 1)}>Previous</button><span className="text-xs text-slate-500">Page {page}</span><button className={buttonClass} disabled={!data.hasMore} onClick={() => setPage(value => value + 1)}>Next</button></div></>}
  </Modal>;
}

type DialogState = { type: "create" } | { type: "edit" | "history" | "archive"; item: Material } | { type: "movement"; item: Material; movement: Exclude<MovementType, "opening"> };
export function MaterialsView({ query, onQueryChange }: { query: string; onQueryChange: (value: string) => void }) {
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [status, setStatus] = useState("active");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const loadSequence = useRef(0);
  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true); setError("");
    try { const data = await request<{ items: Material[] }>("/api/admin/materials"); if (sequence === loadSequence.current) setItems(data.items); }
    catch (e) { if (sequence === loadSequence.current) setError((e as Error).message); }
    finally { if (sequence === loadSequence.current) setLoading(false); }
  }, []);
  useEffect(() => { void load(); return () => { loadSequence.current++; }; }, [load]);
  const saved = (item: Material) => {
    // Discard any list response started before this mutation completed.
    loadSequence.current++; setLoading(false);
    setItems(previous => [...previous.filter(existing => existing.id !== item.id), item].sort((a, b) => a.name.localeCompare(b.name)));
    setDialog(null); setError(""); setNotice("Material saved successfully.");
  };
  async function archive(item: Material) {
    if (busy) return;
    setBusy(true); setDialogError("");
    try { const data = await request<{ item: Material }>(`/api/admin/materials/${item.id}`, { method: "PATCH", body: JSON.stringify({ action: item.archived ? "restore" : "archive", version: item.version }) }); saved(data.item); }
    catch (e) { setDialogError((e as Error).message); } finally { setBusy(false); }
  }
  const active = items.filter(item => !item.archived);
  const low = active.filter(item => item.quantity <= item.reorderLevel);
  const categories = [...new Set(items.map(item => item.category).filter(Boolean))].sort();
  const filtered = items.filter(item => {
    const state = materialStatus(item);
    return (status === "archived" ? item.archived : !item.archived && (status === "active" || (status === "low" ? item.quantity <= item.reorderLevel : state === status))) && (!category || item.category === category) && [item.name, item.sku, item.category, item.supplier, item.location].some(value => value.toLowerCase().includes(query.trim().toLowerCase()));
  }).sort((a, b) => a.name.localeCompare(b.name));
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 20, currentPage * 20);
  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">Materials & stock</h2><p className="mt-1 text-sm text-slate-500">Track supplies, record usage and keep stock ready for the next job.</p></div><div className="flex gap-2"><button className={buttonClass} onClick={() => { setNotice(""); void load(); }} disabled={loading}><RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</button><button className={primaryClass} onClick={() => { setNotice(""); setDialog({ type: "create" }); }}><Plus className="h-4 w-4" />Add material</button></div></div>
    <ErrorMessage error={error} />
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[{ label: "Active materials", value: number(active.length), hint: "Unique stock items" }, { label: "Needs restocking", value: number(low.length), hint: "At or below threshold, including empty" }, { label: "Out of stock", value: number(active.filter(item => item.quantity === 0).length), hint: "No units available" }, { label: "Estimated stock value", value: money(active.reduce((total, item) => total + item.quantity * item.unitCost, 0)), hint: "AUD · quantity × current unit cost" }].map(card => <div key={card.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"><p className="text-xs font-semibold text-slate-500">{card.label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{loading || error ? "—" : card.value}</p><p className="mt-1 text-xs text-slate-400">{card.hint}</p></div>)}
    </div>
    <section aria-label="Material inventory" className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
        <div className="relative min-w-48 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input aria-label="Search materials" placeholder="Search name, SKU, supplier or location…" value={query} onChange={e => { onQueryChange(e.target.value); setPage(1); }} className={`${inputClass} pl-9`} /></div>
        <select aria-label="Filter stock status" className={`${inputClass} sm:w-auto`} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="active">All active materials</option><option value="low">Needs restocking</option><option value="Out of stock">Out of stock</option><option value="In stock">In stock</option><option value="archived">Archived</option></select>
        <select aria-label="Filter category" className={`${inputClass} sm:w-auto`} value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}><option value="">All categories</option>{categories.map(value => <option key={value}>{value}</option>)}</select>
      </div>
      {loading ? <div role="status" className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />Loading materials…</div> : error ? <div className="p-10 text-center"><p className="mb-3 text-sm text-slate-500">Inventory could not be loaded. Refresh to get the latest stock.</p><button className={buttonClass} onClick={() => void load()}>Retry</button></div> : !visible.length ? <div className="p-12 text-center"><Boxes className="mx-auto mb-3 h-9 w-9 text-slate-300" /><h3 className="text-sm font-bold text-slate-800">{items.length ? "No materials match these filters" : "Start your materials inventory"}</h3><p className="mt-1 text-sm text-slate-500">{items.length ? "Try another search or stock status." : "Add your first material with its current stock and reorder threshold."}</p>{!items.length && <button className={`${primaryClass} mt-4`} onClick={() => setDialog({ type: "create" })}>Add first material</button>}</div> : <>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Material", "Stock", "Unit cost / value", "Storage / supplier", "Actions"].map(label => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{visible.map(item => {
          const state = materialStatus(item);
          return <tr key={item.id} className="align-top hover:bg-slate-50/50"><td className="min-w-48 max-w-72 px-4 py-4"><p className="break-words font-semibold text-slate-900">{item.name}</p><p className="mt-1 break-words text-xs text-slate-500">{item.sku}{item.category && ` · ${item.category}`}</p>{item.notes && <p title={item.notes} className="mt-1 line-clamp-2 break-words text-xs text-slate-400">{item.notes}</p>}</td><td className="min-w-40 px-4 py-4"><p className="font-bold text-slate-900">{number(item.quantity)} <span className="text-xs font-normal text-slate-500">{item.unit}</span></p><p className="mb-2 mt-1 text-xs text-slate-400">Reorder at {number(item.reorderLevel)}</p><span className={`whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold ${state === "Out of stock" ? "bg-rose-50 text-rose-700" : state === "Low stock" ? "bg-amber-50 text-amber-700" : state === "Archived" ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>{state}</span></td><td className="whitespace-nowrap px-4 py-4"><p>{money(item.unitCost)}</p><p className="mt-1 text-xs text-slate-400">Value {money(item.unitCost * item.quantity)}</p></td><td className="min-w-36 max-w-56 break-words px-4 py-4"><p>{item.location || "—"}</p><p className="mt-1 text-xs text-slate-500">{item.supplier || "No supplier"}</p></td><td className="min-w-64 px-4 py-4"><div className="flex flex-wrap gap-1.5">
            {!item.archived && <><button className={buttonClass} onClick={() => setDialog({ type: "movement", item, movement: "receive" })}><ArrowDownToLine className="h-3.5 w-3.5" />Receive</button><button className={buttonClass} disabled={item.quantity === 0} onClick={() => setDialog({ type: "movement", item, movement: "use" })}><ArrowUpFromLine className="h-3.5 w-3.5" />Use</button><button className={buttonClass} onClick={() => setDialog({ type: "movement", item, movement: "return" })}>Return</button><button className={buttonClass} onClick={() => setDialog({ type: "movement", item, movement: "adjust" })}>Stock count</button><button className={buttonClass} onClick={() => setDialog({ type: "edit", item })}><Pencil className="h-3.5 w-3.5" />Edit</button></>}
            <button className={buttonClass} onClick={() => setDialog({ type: "history", item })}><History className="h-3.5 w-3.5" />History</button>
            <button className={buttonClass} disabled={!item.archived && item.quantity !== 0} title={!item.archived && item.quantity !== 0 ? "Stock must be zero before archiving" : undefined} onClick={() => { setDialogError(""); setDialog({ type: "archive", item }); }}>{item.archived ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}{item.archived ? "Restore" : "Archive"}</button>
          </div></td></tr>;
        })}</tbody></table></div>
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 p-4 text-xs text-slate-500"><span>{filtered.length} materials · Page {currentPage} of {pages}</span><div className="flex gap-2"><button className={buttonClass} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><button className={buttonClass} disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Next</button></div></div>
      </>}
    </section>
    {dialog?.type === "create" && <MaterialForm onClose={() => setDialog(null)} onSaved={saved} />}
    {dialog?.type === "edit" && <MaterialForm item={dialog.item} onClose={() => setDialog(null)} onSaved={saved} />}
    {dialog?.type === "movement" && <MovementForm item={dialog.item} initialType={dialog.movement} onClose={() => setDialog(null)} onSaved={saved} />}
    {dialog?.type === "history" && <HistoryModal item={dialog.item} onClose={() => setDialog(null)} />}
    {dialog?.type === "archive" && <Modal title={dialog.item.archived ? "Restore material" : "Archive material"} onClose={() => setDialog(null)} busy={busy}><div className="space-y-4"><ErrorMessage error={dialogError} /><p className="text-sm text-slate-600">{dialog.item.archived ? `Restore ${dialog.item.name} to the active inventory?` : `Archive ${dialog.item.name}? Its stock history will be preserved and you can restore it later.`}</p><div className="flex justify-end gap-2"><button className={buttonClass} disabled={busy} onClick={() => setDialog(null)}>Cancel</button><button className={primaryClass} disabled={busy} onClick={() => void archive(dialog.item)}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{dialog.item.archived ? "Restore" : "Archive"}</button></div></div></Modal>}
  </div>;
}
