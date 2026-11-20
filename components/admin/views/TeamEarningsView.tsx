"use client";

import { Fragment, useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, Download, History, Loader2, Plus, RefreshCcw, Search, Wallet, X } from "lucide-react";
import { calculateEarnings, formatEarningsMoney as money, type EarningsShare, type EarningsBasis, type EarningsData, type EarningsEvent, type EarningsJob, type EarningsLedger, type EarningsMember, type EarningsPayment } from "@/lib/teamEarnings";

import { formatAppt } from "@/lib/scheduling";
import { matchesRegisterFilter, registerFilters, registerTotals, type RegisterFilter } from "@/lib/teamEarningsRegister";
import { earningsJobsCsv, earningsMembersCsv, earningsStatus as label, estimatedEarningsShares as estimatedShares } from "@/lib/teamEarningsCsv";

const input = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:opacity-60";
const button = "inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";
const primary = "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed";
type ShareRow = { memberId: string; mode: "percent" | "amount"; value: string };
const shareRow = (share: EarningsShare): ShareRow => ({ memberId: share.memberId, mode: share.fixedAmountCents !== undefined ? "amount" : "percent", value: String(share.fixedAmountCents !== undefined ? share.fixedAmountCents / 100 : share.rateBps / 100) });
const emptyRow = (memberId = ""): ShareRow => ({ memberId, mode: "percent", value: "" });
const sharePayload = (row: ShareRow) => row.mode === "amount" ? { memberId: row.memberId, rateBps: 0, fixedAmountCents: Math.round(Number(row.value) * 100) } : { memberId: row.memberId, rateBps: Math.round(Number(row.value) * 100) };
const shareLabel = (share: EarningsShare): string => share.fixedAmountCents !== undefined ? "Fixed amount" : `${share.rateBps / 100}%`;
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, cache: "no-store", headers: { "Content-Type": "application/json", ...options?.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed. Please try again.");
  return data;
}
function Field({ name, children }: { name: string; children: ReactNode }) {
  return <label className="block space-y-1 text-xs font-semibold text-slate-600"><span>{name}</span>{children}</label>;
}
function ErrorBox({ error }: { error: string }) { return error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null; }
function WorkBreakdown({ job }: { job: EarningsJob }) {
  return <div className="space-y-2">{(["inspection", "job"] as const).map(type => <div key={type}>
    <p className="text-xs font-semibold text-slate-700">{type === "inspection" ? "Inspection by" : "Job worked by"}</p>
    {job.workVisits.filter(visit => visit.type === type).map((visit, index) => <p key={index} className="text-xs text-slate-500">{visit.name} · {visit.date} · {visit.status}{type === "job" && ` · ${visit.daysDone} / ${visit.daysPlanned || "not set"} days`}</p>)}
    {!job.workVisits.some(visit => visit.type === type) && <p className="text-xs text-slate-500">No visit recorded</p>}
  </div>)}</div>;
}
interface HistoryData { events: EarningsEvent[]; payments: EarningsPayment[]; hasMore: boolean }
function EarningsDetail({ job, members, onClose, onChanged, initialMember }: { job: EarningsJob; members: EarningsMember[]; onClose: () => void; onChanged: (ledger: EarningsLedger) => void; initialMember?: string }) {
  const [basis, setBasis] = useState<EarningsBasis>(job.ledger?.basis || "ex_gst");
  const [rows, setRows] = useState<ShareRow[]>(() => job.ledger?.shares.map(shareRow) || (job.assignedIds.length ? job.assignedIds.slice(0, 20).map(emptyRow) : [emptyRow()]));
  const [notes, setNotes] = useState(job.ledger?.notes || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [historyError, setHistoryError] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyRetry, setHistoryRetry] = useState(0);
  const [mode, setMode] = useState<"approve" | "reopen" | "pay" | null>(initialMember ? "pay" : null);
  const [voidId, setVoidId] = useState<string | null>(null);
  const [paymentMember, setPaymentMember] = useState(initialMember || job.ledger?.shares.find(s => s.earnedCents > s.paidCents)?.memberId || "");
  const request = useRef<{ signature: string; id: string } | null>(null);
  const ledger = job.ledger;
  const approved = ledger?.status === "approved";
  const totalRate = rows.reduce((sum, row) => sum + (row.mode === "percent" ? Number(row.value || 0) : 0), 0);
  const invoice = job.invoice;
  const previewBase = invoice ? basis === "inclusive" ? invoice.totalCents : (invoice.items || [invoice]).reduce((sum, item) => sum + Math.round(item.totalCents * 10000 / (10000 + item.gstBps)), 0) : 0;
  const preview = calculateEarnings(rows.map(row => ({ ...sharePayload(row), name: "", earnedCents: 0, paidCents: 0 })), previewBase);
  const exceedsBase = !!invoice && preview.reduce((sum, share) => sum + share.earnedCents, 0) > previewBase;
  const dirty = basis !== (ledger?.basis || "ex_gst") || notes !== (ledger?.notes || "") || JSON.stringify(rows) !== JSON.stringify(ledger?.shares.map(shareRow) || []);
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => { if (!controller.signal.aborted) { setHistory(null); setHistoryError(""); } });
    api<HistoryData>(`/api/admin/team-earnings/${job.id}?page=${historyPage}`, { signal: controller.signal }).then(setHistory).catch(e => { if (!controller.signal.aborted) setHistoryError(e.message); });
    return () => controller.abort();
  }, [job.id, ledger?.version, historyPage, historyRetry]);
  async function mutate(payload: Record<string, unknown>) {
    if (busy) return;
    const body = { ...payload, version: ledger?.version || 0 };
    const signature = JSON.stringify(body);
    if (request.current?.signature !== signature) request.current = { signature, id: crypto.randomUUID() };
    setBusy(true); setError("");
    try {
      const data = await api<{ ledger: EarningsLedger }>(`/api/admin/team-earnings/${job.id}`, { method: "POST", body: JSON.stringify({ ...body, requestId: request.current!.id }) });
      onChanged(data.ledger);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await mutate({ action: "save", basis, notes, shares: rows.map(sharePayload) });
  }
  async function recordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await mutate({ action: "pay", memberId: paymentMember, amountCents: Math.round(Number(form.get("amount")) * 100), date: form.get("date"), method: form.get("method"), reference: form.get("reference"), note: form.get("note") });
  }
  const paymentShare = ledger?.shares.find(s => s.memberId === paymentMember);
  return <section aria-label={`${job.jobLabel} · Manage team earnings`} className="space-y-5 rounded-xl border border-blue-200 bg-white p-4"><div className="flex items-center justify-between"><h3 className="font-bold">Manage shares & payments</h3><button className={button} aria-label="Close earnings editor" onClick={onClose} disabled={busy}><X className="h-4 w-4" />Close</button></div>
    <div className="flex flex-wrap justify-between gap-3 rounded-xl bg-slate-50 p-4"><div><p className="font-bold">{job.customer}</p><p className="text-sm text-slate-500">{job.service} · {job.status}</p><p className="mt-1 text-xs text-slate-500">Assigned: {job.assignedNames.join(", ") || "Unassigned"}</p></div><div className="text-sm"><p>{job.completedVisits}/{job.totalVisits} visits completed</p><p className="text-xs text-slate-500">Recorded days: {job.daysDone} / {job.daysPlanned || "not set"}</p><p className="mt-1 font-semibold">{invoice ? `${invoice.number} · ${money(invoice.totalCents)}` : "No saved invoice"}</p><p className="text-xs text-slate-500">Customer invoice: {job.invoicePaid ? "Paid" : "Not marked paid"}</p></div></div>
    <WorkBreakdown job={job} />
    {invoice?.items && <div className="rounded-xl border border-slate-200 p-3"><h3 className="text-sm font-bold">Customer invoices</h3>{invoice.items.map((item, index) => <p key={index} className="text-sm text-slate-600">{item.number} · {money(item.totalCents)} · GST {item.gstBps / 100}%</p>)}</div>}
    <ErrorBox error={error} />
    {job.changed && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">The invoice, completion status or source lead changed after approval. Approved amounts are preserved. Review the history, reverse any recorded payments if correcting the approval, then reopen and approve the updated earnings.</p>}
    {!approved ? <form onSubmit={save} className="space-y-4">
      <fieldset disabled={busy} className="space-y-4">
        <Field name="Commission basis"><select className={input} value={basis} onChange={e => setBasis(e.target.value as EarningsBasis)}><option value="ex_gst">Invoice amount excluding GST</option><option value="inclusive">Full invoice amount including GST</option></select></Field>
        <p className="text-xs text-slate-500">{invoice ? `Invoice GST: ${invoice.gstBps < 0 ? "mixed rates" : `${invoice.gstBps / 100}%`}. Calculation base: ${money(previewBase)}.` : "Save an invoice to calculate estimates. Shares can be planned now."} Choose a percentage share or a fixed AUD amount for each worker. Shares apply to the whole job invoice, once per lead. Work days provide context and do not multiply the percentage.</p>
        <div className="space-y-3">{rows.map((row, index) => <div key={index} className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_8rem_auto]">
          <Field name="Team member"><select required className={input} value={row.memberId} onChange={e => setRows(old => old.map((r, i) => i === index ? { ...r, memberId: e.target.value } : r))}><option value="">Choose member</option>{members.filter(m => m.active || ledger?.shares.some(s => s.memberId === m.id)).map(m => <option key={m.id} value={m.id}>{m.name} · {m.role}{!m.active ? " (inactive)" : ""}</option>)}</select></Field>
          <Field name="Enter as"><select className={input} value={row.mode} onChange={e => setRows(old => old.map((r, i) => i === index ? { ...r, mode: e.target.value as ShareRow["mode"], value: "" } : r))}><option value="percent">Share (%)</option><option value="amount">Amount (AUD)</option></select></Field>
          <Field name={row.mode === "amount" ? "Amount (AUD)" : "Share (%)"}><input required className={input} type="number" min="0.01" max={row.mode === "percent" ? 100 : undefined} step="0.01" value={row.value} onChange={e => setRows(old => old.map((r, i) => i === index ? { ...r, value: e.target.value } : r))} /><span className="block text-xs font-normal text-slate-500">{money(preview[index]?.earnedCents || 0)} estimated</span></Field>
          <button className={button} type="button" aria-label={`Remove share ${index + 1}`} disabled={rows.length === 1} onClick={() => setRows(old => old.filter((_, i) => i !== index))}><X className="h-4 w-4" /></button>
        </div>)}</div>
        <div className="flex flex-wrap justify-between gap-2"><button className={button} type="button" disabled={rows.length >= 20} onClick={() => setRows(old => [...old, emptyRow()])}><Plus className="h-3.5 w-3.5" />Add worker payment share</button><p className={`text-sm font-semibold ${totalRate > 100 || exceedsBase ? "text-rose-600" : "text-slate-700"}`}>{totalRate.toFixed(2)}% total · Estimated {money(preview.reduce((sum, s) => sum + s.earnedCents, 0))}</p></div>
        {exceedsBase && <ErrorBox error="Combined team amounts and shares cannot exceed the invoice basis." />}
        <Field name="Manager notes"><textarea className={input} maxLength={2000} rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Agreed rate, shared work or other context" /></Field>
      </fieldset>
      <div className="flex flex-wrap justify-end gap-2"><button className={button} disabled={busy || totalRate > 100 || exceedsBase} type="submit">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save draft shares</button><button type="button" className={primary} disabled={busy || !ledger || dirty || !job.eligible} title={dirty ? "Save shares before approval" : job.unavailableReason} onClick={() => setMode("approve")}><CheckCircle2 className="h-4 w-4" />Review approval</button></div>
      {!job.eligible && <p className="text-xs text-amber-700">{job.unavailableReason}</p>}
      {ledger && dirty && <p className="text-xs text-slate-500">Save your changes before approving earnings.</p>}
    </form> : <section className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-bold">Approved earnings · {ledger.invoice?.number}</h3><p className="text-xs text-slate-500">Base {money(ledger.invoice?.baseCents || 0)} · {ledger.basis === "ex_gst" ? "excluding GST" : "including GST"} · Approved by {ledger.approvedBy}</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{label(job)}</span></div>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Member", "Share", "Earned", "Paid", "Outstanding", "Payment"].map(s => <th key={s} className="p-2">{s}</th>)}</tr></thead><tbody>{ledger.shares.map(s => <tr key={s.memberId} className="border-b border-slate-100"><td className="p-2">{s.name}</td><td className="p-2">{shareLabel(s)}</td><td className="p-2">{money(s.earnedCents)}</td><td className="p-2">{money(s.paidCents)}</td><td className="p-2 font-semibold">{money(s.earnedCents - s.paidCents)}</td><td className="p-2"><button type="button" className={button} disabled={busy || job.changed || s.paidCents >= s.earnedCents} onClick={() => { setPaymentMember(s.memberId); setMode("pay"); }}>{s.paidCents >= s.earnedCents ? "Paid in full" : "Record paid to worker"}</button></td></tr>)}</tbody></table></div>
      {ledger.notes && <p className="whitespace-pre-wrap text-sm text-slate-500">{ledger.notes}</p>}
      <div className="flex justify-end gap-2"><button className={button} disabled={busy || ledger.shares.some(s => s.paidCents > 0)} onClick={() => setMode("reopen")}>Reopen approval</button><button className={primary} disabled={busy || job.changed || !ledger.shares.some(s => s.earnedCents > s.paidCents)} onClick={() => setMode("pay")}><Wallet className="h-4 w-4" />Record payment</button></div>
    </section>}
    {mode === "approve" && <section className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4"><h3 className="font-bold">Approve these earnings?</h3><p className="text-sm">Approve {money(estimatedShares(job).reduce((sum, s) => sum + s.earnedCents, 0))} against {job.invoice?.number}. The invoice amount, GST basis and member shares will be preserved.</p><p className="text-xs text-slate-600">{job.invoicePaid ? "The customer invoice is marked paid." : "The customer invoice is not marked paid. Approval records earnings independently of customer payment."}</p><div className="flex gap-2"><button className={primary} disabled={busy} onClick={() => void mutate({ action: "approve", invoice: job.invoice })}>Approve earnings</button><button className={button} disabled={busy} onClick={() => setMode(null)}>Cancel</button></div></section>}
    {mode === "reopen" && <form onSubmit={e => { e.preventDefault(); void mutate({ action: "reopen", reason: new FormData(e.currentTarget).get("reason") }); }} className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="font-bold">Reopen for correction</h3><p className="text-sm text-slate-600">The previous approval remains in audit history. Save and approve the revised shares afterwards.</p><Field name="Reason *"><textarea className={input} name="reason" required maxLength={500} disabled={busy} /></Field><div className="flex gap-2"><button className={primary} disabled={busy}>Reopen</button><button type="button" className={button} disabled={busy} onClick={() => setMode(null)}>Cancel</button></div></form>}
    {mode === "pay" && approved && <form onSubmit={recordPayment} className="space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-4"><h3 className="font-bold">Record paid to technician / worker</h3><p className="text-xs text-slate-600">Log a payment already made. This records the payment without transferring money.{!job.invoicePaid && " The customer invoice is not marked paid."}</p><fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2"><Field name="Member *"><select className={input} required value={paymentMember} onChange={e => setPaymentMember(e.target.value)}><option value="">Choose member</option>{ledger.shares.filter(s => s.paidCents < s.earnedCents).map(s => <option key={s.memberId} value={s.memberId}>{s.name} · {money(s.earnedCents - s.paidCents)} due</option>)}</select></Field><Field name="Amount (AUD) *"><input className={input} name="amount" type="number" required min="0.01" max={paymentShare ? (paymentShare.earnedCents - paymentShare.paidCents) / 100 : 0} step="0.01" /></Field><Field name="Date paid *"><input className={input} type="date" name="date" required defaultValue={today()} max={today()} /></Field><Field name="Method *"><select className={input} name="method"><option>Bank transfer</option><option>Cash</option><option>Other</option></select></Field><Field name="Payment reference *"><input className={input} name="reference" required maxLength={160} placeholder="Transfer or receipt reference" /></Field><Field name="Note"><input className={input} name="note" maxLength={500} /></Field></fieldset><div className="flex gap-2"><button className={primary} disabled={busy}>Save payment record</button><button type="button" className={button} disabled={busy} onClick={() => setMode(null)}>Cancel</button></div></form>}
    <section className="space-y-3 border-t border-slate-100 pt-4"><h3 className="flex items-center gap-2 text-sm font-bold"><History className="h-4 w-4" />Payments & audit log</h3><ErrorBox error={historyError} />{historyError && <button className={button} onClick={() => setHistoryRetry(v => v + 1)}>Retry history</button>}{!history && !historyError && <p role="status" className="text-sm text-slate-500">Loading history…</p>}
      {history && <><div className="space-y-2">{history.payments.map(p => <div key={p.id} className="rounded-xl border border-slate-200 p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-semibold">{p.memberName} · {money(p.amountCents)}{p.voidedAt && <span className="ml-2 text-xs text-rose-600">Reversed</span>}</p><p className="text-xs text-slate-500">{p.date} · {p.method} · {p.reference} · Recorded by {p.actor}</p>{p.note && <p className="mt-1 break-words text-xs text-slate-500">{p.note}</p>}{p.voidedAt && <p className="mt-1 break-words text-xs text-rose-600">{p.voidedBy}: {p.voidReason}</p>}</div>{!p.voidedAt && <button className={button} disabled={busy} onClick={() => setVoidId(p.id)}>Reverse record</button>}</div>{voidId === p.id && <form className="mt-3 space-y-2" onSubmit={e => { e.preventDefault(); void mutate({ action: "void_payment", paymentId: p.id, reason: new FormData(e.currentTarget).get("reason") }); }}><p className="text-xs text-amber-700">Correct the ledger only after confirming this payment was entered incorrectly or returned. This does not recover transferred money.</p><Field name="Reversal reason *"><input className={input} name="reason" required maxLength={500} disabled={busy} /></Field><div className="flex gap-2"><button className={button} disabled={busy}>Confirm reversal</button><button className={button} type="button" disabled={busy} onClick={() => setVoidId(null)}>Cancel</button></div></form>}</div>)}{!history.payments.length && <p className="text-xs text-slate-500">No team payments recorded.</p>}</div>
      <ol className="divide-y divide-slate-100">{history.events.map(event => <li key={event.id} className="py-3"><p className="text-xs font-semibold text-slate-500">{new Date(event.createdAt).toLocaleString("en-AU")} · {event.actor} · {event.action.replaceAll("_", " ")}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">{event.detail}</p></li>)}</ol>{!history.events.length && <p className="text-xs text-slate-500">No earnings changes yet.</p>}<div className="flex items-center justify-between"><button className={button} disabled={historyPage === 1} onClick={() => setHistoryPage(p => p - 1)}>Previous</button><span className="text-xs text-slate-500">Audit page {historyPage}</span><button className={button} disabled={!history.hasMore} onClick={() => setHistoryPage(p => p + 1)}>Next</button></div></>}
    </section>
  </section>;
}


const panel = "min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs";
const dateTime = (value?: string) => formatAppt(value, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) || "—";
function Badge({ children, warning = false }: { children: ReactNode; warning?: boolean }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${warning ? "bg-amber-100 text-amber-800" : "bg-blue-50 text-blue-800"}`}>{children}</span>;
}

export function TeamEarningsView({ query, onQueryChange, onOpenJob, onAddJob, onManageTeam, refreshKey }: {
  query: string; onQueryChange: (value: string) => void; onOpenJob: (id: string) => void;
  onAddJob: () => void; onManageTeam: () => void; refreshKey?: boolean;
}) {
  const [data, setData] = useState<EarningsData>({ members: [], jobs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [memberId, setMemberId] = useState("");
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState<RegisterFilter>("All Jobs");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<{ id: string; memberId?: string } | null>(null);
  const sequence = useRef(0);
  const load = useCallback(async () => {
    const current = ++sequence.current; setLoading(true); setError("");
    try { const result = await api<EarningsData>("/api/admin/team-earnings"); if (current === sequence.current) setData(result); }
    catch (e) { if (current === sequence.current) setError((e as Error).message); }
    finally { if (current === sequence.current) setLoading(false); }
  }, []);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled && !refreshKey) void load(); });
    return () => { cancelled = true; };
  }, [load, refreshKey]);
  function saved() { setSelected(null); setNotice("Saved to the team earnings ledger."); void load(); }
  const related = (job: EarningsJob, id: string) => job.assignedIds.includes(id) || job.ledger?.shares.some(s => s.memberId === id);
  const relevant = data.jobs.filter(job => !memberId || related(job, memberId));
  const searched = relevant.filter(job => (!status || label(job) === status) && [job.jobLabel, job.customer, job.service, job.invoice?.number || "", ...job.assignedNames, ...(job.ledger?.shares.map(s => s.name) || [])].some(value => value.toLowerCase().includes(query.trim().toLowerCase())));
  const filtered = searched.filter(job => matchesRegisterFilter(job, filter)).sort((a, b) => Number(b.changed) - Number(a.changed) || (b.scheduledAt || b.id).localeCompare(a.scheduledAt || a.id));
  const totals = registerTotals(filtered);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 20)), currentPage = Math.min(page, totalPages);
  const memberRows = data.members.filter(m => !memberId || m.id === memberId).map(member => {
    const jobs = filtered.filter(job => related(job, member.id));
    let earned = 0, paid = 0, estimated = 0;
    for (const job of jobs) for (const share of estimatedShares(job).filter(s => s.memberId === member.id)) {
      if (job.ledger?.status === "approved") { earned += share.earnedCents; paid += share.paidCents; } else estimated += share.earnedCents;
    }
    return { ...member, assigned: jobs.filter(job => job.assignedIds.includes(member.id)).length, visits: jobs.reduce((sum, job) => sum + (job.memberWork.find(w => w.memberId === member.id)?.completedVisits || 0), 0), days: jobs.reduce((sum, job) => sum + (job.memberWork.find(w => w.memberId === member.id)?.daysDone || 0), 0), earned, paid, estimated };
  });
  function exportCsv(members = false) {
    const contents = members ? earningsMembersCsv(memberRows) : earningsJobsCsv(filtered);
    const url = URL.createObjectURL(new Blob(["\uFEFF", contents], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a"); link.href = url; link.download = `groutix-team-earnings-${members ? "members" : "jobs"}-${today()}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function edit(job: EarningsJob, member?: string) {
    setExpanded(old => new Set(old).add(job.id)); setSelected({ id: job.id, memberId: member });
  }
  const cards = [
    ["Total Jobs", String(filtered.length)], ["Total Invoices", String(totals.invoices)], ["Invoice Value", money(totals.value)],
    ["Customer Received", money(totals.received)], ["Team Earnings", money(totals.earned)], ["Paid to Team", money(totals.paid)], ["Team Outstanding", money(totals.earned - totals.paid)],
  ];
  return <div className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-900">Team Earnings · Working Register</h2><p className="mt-1 text-sm text-slate-500">Jobs, customer invoices and team payments in one register.</p></div><div className="flex flex-wrap gap-2"><button className={primary} onClick={onAddJob}><Plus className="h-4 w-4" />Add job</button><button className={button} onClick={onManageTeam}><Plus className="h-4 w-4" />Manage team</button><button className={button} disabled={loading || !!error || !filtered.length} onClick={() => exportCsv()}><Download className="h-4 w-4" />Export CSV</button><button className={button} disabled={loading} onClick={() => { setNotice(""); setSelected(null); void load(); }}><RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</button></div></div>
    <ErrorBox error={error} />{notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4 2xl:grid-cols-7">{cards.map(([title, value]) => <div key={title} className={`${panel} p-3`}><p className="text-xs font-semibold text-slate-500">{title}</p><p className="mt-1 break-words text-xl font-bold text-slate-900">{loading || error ? "—" : value}</p></div>)}</div>
    <div className="flex flex-wrap gap-2"><div className="relative min-w-48 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input className={`${input} pl-9`} aria-label="Search team earnings" placeholder="Search job, customer, invoice or member…" value={query} onChange={e => { onQueryChange(e.target.value); setPage(1); }} /></div><select className={`${input} sm:w-auto`} aria-label="Filter team member" value={memberId} onChange={e => { setMemberId(e.target.value); setPage(1); }}><option value="">All team members</option>{data.members.map(m => <option key={m.id} value={m.id}>{m.name}{m.active ? "" : " (inactive)"}</option>)}</select><select className={`${input} sm:w-auto`} aria-label="Filter earnings status" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All earnings statuses</option>{["Not configured", "Draft", "Approved", "Settled", "Needs review"].map(value => <option key={value}>{value}</option>)}</select></div>
    <div className="flex flex-wrap gap-2" aria-label="Job status filters">{registerFilters.map(value => <button key={value} aria-pressed={filter === value} className={filter === value ? primary : button} onClick={() => { setFilter(value); setPage(1); }}>{value} ({loading || error ? "—" : searched.filter(job => matchesRegisterFilter(job, value)).length})</button>)}</div>
    <p className="text-xs text-slate-500">All totals and summaries follow the displayed filters, across every page. Job filters can overlap. Team earnings are approved amounts; draft estimates of {loading || error ? "—" : money(totals.estimated)} are separate. A member filter shows whole related jobs, including their other workers.</p>
    <section className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-2 p-4"><h3 className="font-bold">All Jobs & Invoices</h3><span className="text-xs text-slate-500">Select a job to expand invoices and team shares</span></div>
      {loading ? <div role="status" className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />Loading team earnings…</div> : error ? <div className="p-8 text-center"><button className={button} onClick={() => void load()}>Retry</button></div> : <>
        <div className="overflow-x-auto"><table className="w-full min-w-[1250px] text-left text-sm"><thead className="bg-slate-900 text-xs text-white"><tr>{["Job / Customer", "Invoices", "Job Date & Time", "Job Status", "Invoice Value", "Received", "Payment Status", "Team Share", "Team Paid", "Outstanding", "Manager Balance", "Actions"].map(title => <th key={title} className="whitespace-nowrap px-3 py-3">{title}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.slice((currentPage - 1) * 20, currentPage * 20).map(job => {
          const shares = estimatedShares(job), approved = job.ledger?.status === "approved", open = expanded.has(job.id);
          const total = registerTotals([job]);
          const invoices = job.invoice?.items || (job.invoice ? [job.invoice] : []);
          return <Fragment key={job.id}><tr className={`align-top ${open ? "bg-blue-50" : "hover:bg-slate-50"}`}>
            <td className="min-w-44 px-3 py-4"><button className="text-left font-bold text-blue-700 hover:underline" aria-expanded={open} aria-controls={`earnings-job-${job.id}`} onClick={() => { setExpanded(old => { const next = new Set(old); if (next.has(job.id)) next.delete(job.id); else next.add(job.id); return next; }); if (open && selected?.id === job.id) setSelected(null); }}>{open ? "▾" : "▸"} {job.jobLabel}</button><p className="mt-1 font-medium">{job.customer}</p><p className="text-xs text-slate-500">{job.service}</p></td>
            <td className="px-3 py-4">{total.invoices}</td><td className="min-w-36 px-3 py-4 text-xs">{dateTime(job.scheduledAt)}</td><td className="px-3 py-4"><Badge>{job.status}</Badge><p className="mt-2 text-xs text-slate-500">{job.completedVisits}/{job.totalVisits} visits done</p></td>
            <td className="px-3 py-4 font-semibold">{job.invoice ? money(total.value) : "—"}</td><td className="px-3 py-4 text-emerald-700">{money(total.received)}</td><td className="px-3 py-4"><Badge warning={!!job.invoice && !job.invoicePaid}>{!job.invoice ? "No invoice" : job.invoicePaid ? "Paid" : total.received > 0 ? "Partial" : "Pending"}</Badge></td>
            <td className="px-3 py-4 font-semibold">{money(approved ? total.earned : total.estimated)}{!approved && <p className="text-xs font-normal text-slate-500">Draft estimate</p>}</td><td className="px-3 py-4">{approved ? money(total.paid) : "—"}</td><td className="px-3 py-4 font-semibold text-rose-700">{approved ? money(total.earned - total.paid) : "—"}</td><td className="px-3 py-4">{approved ? money(total.received - total.earned) : "—"}<p className="text-xs text-slate-500">Before expenses</p></td>
            <td className="space-y-2 px-3 py-4"><button className={button} onClick={() => edit(job)}>{approved ? "Payments / details" : "Set team shares"}</button>{job.status !== "Source unavailable" && <button className={button} onClick={() => onOpenJob(job.id)}>Open job</button>}</td>
          </tr>{open && <tr id={`earnings-job-${job.id}`}><td colSpan={12} className="bg-blue-50/40 p-4"><div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-bold">Invoices & Team Shares · {job.jobLabel}</h4><Badge warning={job.changed}>{label(job)}</Badge></div>
            {invoices.length ? <div className="grid gap-3 lg:grid-cols-2">{invoices.map((invoice, index) => {
              const receipt = job.receipts?.[index];
              return <section key={`${invoice.number}-${index}`} className="overflow-hidden rounded-xl border border-blue-100 bg-white"><div className="flex flex-wrap justify-between gap-2 bg-blue-100/60 px-4 py-3"><h5 className="font-bold">{invoice.number}</h5><span className="text-xs">GST {invoice.gstBps / 100}%</span></div><dl className="grid grid-cols-3 gap-2 p-4 text-xs"><div><dt className="text-slate-500">Invoice value</dt><dd className="mt-1 font-bold">{money(invoice.totalCents)}</dd></div><div><dt className="text-slate-500">Received</dt><dd className="mt-1 font-bold text-emerald-700">{receipt ? money(receipt.paidCents) : "—"}</dd></div><div><dt className="text-slate-500">Customer due</dt><dd className="mt-1 font-bold text-rose-700">{receipt ? money(receipt.remainingCents) : "—"}</dd></div></dl><div className="px-4 pb-3"><button className={button} onClick={() => onOpenJob(job.id)}>Manage customer invoices</button></div></section>;
            })}</div> : <p className="rounded-xl bg-white p-4 text-sm text-slate-500">No saved invoice. Open the job to create a customer invoice.</p>}
            <section className="overflow-hidden rounded-xl border border-blue-100 bg-white"><div className="flex flex-wrap justify-between gap-2 bg-blue-100/60 px-4 py-3"><h4 className="font-bold">Team shares · All job invoices</h4><button className={button} onClick={() => edit(job)}>{approved ? "Payments & audit history" : "Configure & approve shares"}</button></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-xs"><thead className="bg-blue-50"><tr>{["Team Member", "Role", "Share Type", "Share / Amount", "Earnings", "Paid", "Remaining", "Payment"].map(title => <th key={title} className="p-3">{title}</th>)}</tr></thead><tbody>{shares.map(share => <tr key={share.memberId} className="border-t border-slate-100"><td className="p-3 font-semibold">{share.name}</td><td className="p-3">{data.members.find(m => m.id === share.memberId)?.role || "Former member"}</td><td className="p-3">{share.fixedAmountCents === undefined ? "Percentage" : "Fixed AUD"}</td><td className="p-3">{share.fixedAmountCents === undefined ? `${share.rateBps / 100}%` : money(share.fixedAmountCents)}</td><td className="p-3 font-semibold">{money(share.earnedCents)}{!approved && " (draft)"}</td><td className="p-3">{approved ? money(share.paidCents) : "—"}</td><td className="p-3 font-semibold text-rose-700">{approved ? money(share.earnedCents - share.paidCents) : "—"}</td><td className="p-3"><button className={button} disabled={!approved || job.changed || share.paidCents >= share.earnedCents} onClick={() => edit(job, share.memberId)}>{approved && share.paidCents >= share.earnedCents ? "Paid" : "Record payment"}</button></td></tr>)}{!shares.length && <tr><td colSpan={8} className="p-4 text-slate-500">No team shares configured. Add percentage or fixed worker amounts using Configure & approve shares.</td></tr>}</tbody></table></div><p className="px-4 py-3 text-xs text-slate-500">Shares apply once across this job’s saved invoices, {job.ledger?.basis === "inclusive" ? "including" : "excluding"} GST. Fixed amounts are charged once per job. Only approved shares are payable.</p></section>
            {job.changed && <p className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900">This job changed after approval. Earnings are preserved; review the record before recording further payments.</p>}
            <div className="flex flex-wrap justify-between gap-3 rounded-xl bg-amber-50 p-4 text-sm"><span>Customer received: <b>{money(total.received)}</b></span><span>Approved team earnings: <b>{money(total.earned)}</b></span><span>Manager balance before expenses: <b>{money(total.received - total.earned)}</b></span></div>
            <details className="rounded-xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold">Assigned work & visit progress</summary><div className="mt-3"><WorkBreakdown job={job} /></div></details>
            {selected?.id === job.id && <EarningsDetail key={`${job.id}:${job.ledger?.version || 0}:${selected.memberId || "details"}`} job={job} initialMember={selected.memberId} members={data.members} onClose={() => setSelected(null)} onChanged={saved} />}
          </div></td></tr>}</Fragment>;
        })}{!filtered.length && <tr><td colSpan={12} className="p-12 text-center text-slate-500">No jobs match these filters. CRM jobs and invoices appear automatically.</td></tr>}</tbody></table></div>
        <div className="flex items-center justify-between border-t border-slate-100 p-4 text-xs text-slate-500"><span>{filtered.length} jobs · Page {currentPage} of {totalPages}</span><div className="flex gap-2"><button className={button} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><button className={button} disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</button></div></div>
      </>}
    </section>
    {!loading && !error && <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]"><section className={panel}><div className="flex flex-wrap justify-between gap-2 p-4"><h3 className="font-bold">Payment Summary · Team Members</h3><button className={button} onClick={() => exportCsv(true)} disabled={!memberRows.length}>Export team CSV</button></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-900 text-xs text-white"><tr>{["Employee", "Role", "Draft Estimate", "Total Earnings", "Total Paid", "Outstanding", "Action"].map(title => <th key={title} className="px-3 py-3">{title}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{memberRows.map(member => <tr key={member.id}><td className="px-3 py-3 font-semibold">{member.name}{!member.active && <p className="text-xs font-normal text-slate-500">Inactive</p>}</td><td className="px-3 py-3 text-xs">{member.role}</td><td className="px-3 py-3">{money(member.estimated)}</td><td className="px-3 py-3 font-semibold">{money(member.earned)}</td><td className="px-3 py-3 text-emerald-700">{money(member.paid)}</td><td className="px-3 py-3 font-semibold text-rose-700">{money(member.earned - member.paid)}</td><td className="px-3 py-3"><button className={button} onClick={() => { setMemberId(member.id); setPage(1); }}>View jobs / pay</button></td></tr>)}{!memberRows.length && <tr><td colSpan={7} className="p-6 text-center text-slate-500">No team members found.</td></tr>}</tbody><tfoot className="bg-blue-50 font-bold"><tr><td colSpan={2} className="p-3">Total</td>{["estimated", "earned", "paid", "outstanding"].map(key => <td key={key} className="p-3">{money(memberRows.reduce((sum, member) => sum + (key === "outstanding" ? member.earned - member.paid : member[key as "estimated" | "earned" | "paid"]), 0))}</td>)}<td /></tr></tfoot></table></div></section><section className={`${panel} p-5`}><h3 className="font-bold">Manager Summary · Groutix</h3><dl className="mt-4 space-y-4 text-sm">{[["Customer receipts", totals.received], ["Less: approved team earnings", -totals.earned], ["Balance before expenses", totals.received - totals.earned], ["Draft team estimates (not approved)", totals.estimated], ["Paid to team", totals.paid], ["Team still outstanding", totals.earned - totals.paid]].map(([title, value]) => <div key={title} className="flex justify-between gap-3"><dt>{title}</dt><dd className="font-bold">{money(value as number)}</dd></div>)}</dl><p className="mt-4 text-xs text-slate-500">Customer receipts come from saved CRM invoice payments. The balance reserves all approved team earnings, including amounts still owed. Expenses are not recorded in this ledger, so this balance is before expenses and is not net profit. Draft estimates still need approval.</p></section></div>}
    <p className="text-xs text-slate-500">Saved in the CRM database. Payments record money already paid to workers; they do not transfer money. Amounts display whole AUD dollars; calculations, payment inputs and exports retain cents.</p>
  </div>;
}
