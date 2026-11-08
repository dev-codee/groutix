"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, Download, History, Loader2, Plus, RefreshCcw, Search, Wallet, X } from "lucide-react";
import { calculateEarnings, type EarningsBasis, type EarningsData, type EarningsEvent, type EarningsJob, type EarningsLedger, type EarningsMember, type EarningsPayment } from "@/lib/teamEarnings";

import { earningsJobsCsv, earningsMembersCsv, earningsStatus as label, estimatedEarningsShares as estimatedShares } from "@/lib/teamEarningsCsv";

const input = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:opacity-60";
const button = "inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";
const primary = "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed";
const money = (cents: number) => (cents / 100).toLocaleString("en-AU", { style: "currency", currency: "AUD" });
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
function Dialog({ title, children, onClose, busy }: { title: string; children: ReactNode; onClose: () => void; busy: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const element = ref.current; element?.showModal(); return () => element?.close(); }, []);
  return <dialog ref={ref} aria-label={title} onCancel={e => { e.preventDefault(); if (!busy) onClose(); }} className="fixed inset-0 m-auto max-h-[92dvh] w-[calc(100%_-_2rem)] max-w-4xl overflow-y-auto rounded-2xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/50"><div className="flex items-center justify-between border-b border-slate-100 p-5"><h2 className="text-lg font-bold">{title}</h2><button className={button} aria-label="Close earnings" onClick={onClose} disabled={busy}><X className="h-4 w-4" /></button></div><div className="space-y-5 p-5">{children}</div></dialog>;
}
interface HistoryData { events: EarningsEvent[]; payments: EarningsPayment[]; hasMore: boolean }
function EarningsDetail({ job, members, onClose, onChanged }: { job: EarningsJob; members: EarningsMember[]; onClose: () => void; onChanged: (ledger: EarningsLedger) => void }) {
  const [basis, setBasis] = useState<EarningsBasis>(job.ledger?.basis || "ex_gst");
  const [rows, setRows] = useState(() => job.ledger?.shares.map(s => ({ memberId: s.memberId, percent: String(s.rateBps / 100) })) || [{ memberId: job.assignedIds[0] || "", percent: "" }]);
  const [notes, setNotes] = useState(job.ledger?.notes || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [historyError, setHistoryError] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyRetry, setHistoryRetry] = useState(0);
  const [mode, setMode] = useState<"approve" | "reopen" | "pay" | null>(null);
  const [voidId, setVoidId] = useState<string | null>(null);
  const [paymentMember, setPaymentMember] = useState(job.ledger?.shares.find(s => s.earnedCents > s.paidCents)?.memberId || "");
  const request = useRef<{ signature: string; id: string } | null>(null);
  const ledger = job.ledger;
  const approved = ledger?.status === "approved";
  const totalRate = rows.reduce((sum, row) => sum + Number(row.percent || 0), 0);
  const invoice = job.invoice;
  const previewBase = invoice ? basis === "inclusive" ? invoice.totalCents : Math.round(invoice.totalCents * 10000 / (10000 + invoice.gstBps)) : 0;
  const preview = calculateEarnings(rows.map(row => ({ memberId: row.memberId, name: "", rateBps: Math.round(Number(row.percent || 0) * 100), earnedCents: 0, paidCents: 0 })), previewBase);
  const dirty = basis !== (ledger?.basis || "ex_gst") || notes !== (ledger?.notes || "") || JSON.stringify(rows) !== JSON.stringify(ledger?.shares.map(s => ({ memberId: s.memberId, percent: String(s.rateBps / 100) })) || []);
  useEffect(() => {
    const controller = new AbortController(); setHistory(null); setHistoryError("");
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
    await mutate({ action: "save", basis, notes, shares: rows.map(row => ({ memberId: row.memberId, rateBps: Math.round(Number(row.percent) * 100) })) });
  }
  async function recordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await mutate({ action: "pay", memberId: paymentMember, amountCents: Math.round(Number(form.get("amount")) * 100), date: form.get("date"), method: form.get("method"), reference: form.get("reference"), note: form.get("note") });
  }
  const paymentShare = ledger?.shares.find(s => s.memberId === paymentMember);
  return <Dialog title={`${job.jobLabel} · Team earnings`} onClose={onClose} busy={busy}>
    <div className="flex flex-wrap justify-between gap-3 rounded-xl bg-slate-50 p-4"><div><p className="font-bold">{job.customer}</p><p className="text-sm text-slate-500">{job.service} · {job.status}</p><p className="mt-1 text-xs text-slate-500">Assigned: {job.assignedNames.join(", ") || "Unassigned"}</p></div><div className="text-sm"><p>{job.completedVisits}/{job.totalVisits} visits completed</p><p className="text-xs text-slate-500">Recorded days: {job.daysDone} / {job.daysPlanned || "not set"}</p><p className="mt-1 font-semibold">{invoice ? `${invoice.number} · ${money(invoice.totalCents)}` : "No saved invoice"}</p><p className="text-xs text-slate-500">Customer invoice: {job.invoicePaid ? "Paid" : "Not marked paid"}</p></div></div>
    <ErrorBox error={error} />
    {job.changed && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">The invoice, completion status or source lead changed after approval. Approved amounts are preserved. Review the history, reverse any recorded payments if correcting the approval, then reopen and approve the updated earnings.</p>}
    {!approved ? <form onSubmit={save} className="space-y-4">
      <fieldset disabled={busy} className="space-y-4">
        <Field name="Commission basis"><select className={input} value={basis} onChange={e => setBasis(e.target.value as EarningsBasis)}><option value="ex_gst">Invoice amount excluding GST</option><option value="inclusive">Full invoice amount including GST</option></select></Field>
        <p className="text-xs text-slate-500">{invoice ? `Invoice GST: ${invoice.gstBps / 100}%. Calculation base: ${money(previewBase)}.` : "Save an invoice to calculate estimates. Shares can be planned now."} Shares apply to the whole job invoice, once per lead. Work days provide context and do not multiply the percentage.</p>
        <div className="space-y-3">{rows.map((row, index) => <div key={index} className="grid grid-cols-[1fr_6rem_auto] items-end gap-2 sm:grid-cols-[1fr_7rem_7rem_auto]">
          <Field name="Team member"><select required className={input} value={row.memberId} onChange={e => setRows(old => old.map((r, i) => i === index ? { ...r, memberId: e.target.value } : r))}><option value="">Choose member</option>{members.filter(m => m.active || ledger?.shares.some(s => s.memberId === m.id)).map(m => <option key={m.id} value={m.id}>{m.name} · {m.role}{!m.active ? " (inactive)" : ""}</option>)}</select></Field>
          <Field name="Share (%)"><input required className={input} type="number" min="0.01" max="100" step="0.01" value={row.percent} onChange={e => setRows(old => old.map((r, i) => i === index ? { ...r, percent: e.target.value } : r))} /></Field>
          <p className="hidden pb-2 text-right text-sm font-semibold sm:block">{money(preview[index]?.earnedCents || 0)}</p>
          <button className={button} type="button" aria-label={`Remove share ${index + 1}`} disabled={rows.length === 1} onClick={() => setRows(old => old.filter((_, i) => i !== index))}><X className="h-4 w-4" /></button>
        </div>)}</div>
        <div className="flex flex-wrap justify-between gap-2"><button className={button} type="button" disabled={rows.length >= 20} onClick={() => setRows(old => [...old, { memberId: "", percent: "" }])}><Plus className="h-3.5 w-3.5" />Add member</button><p className={`text-sm font-semibold ${totalRate > 100 ? "text-rose-600" : "text-slate-700"}`}>{totalRate.toFixed(2)}% total · Estimated {money(preview.reduce((sum, s) => sum + s.earnedCents, 0))}</p></div>
        <Field name="Manager notes"><textarea className={input} maxLength={2000} rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Agreed rate, shared work or other context" /></Field>
      </fieldset>
      <div className="flex flex-wrap justify-end gap-2"><button className={button} disabled={busy || totalRate > 100} type="submit">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save draft shares</button><button type="button" className={primary} disabled={busy || !ledger || dirty || !job.eligible} title={dirty ? "Save shares before approval" : job.unavailableReason} onClick={() => setMode("approve")}><CheckCircle2 className="h-4 w-4" />Review approval</button></div>
      {!job.eligible && <p className="text-xs text-amber-700">{job.unavailableReason}</p>}
      {ledger && dirty && <p className="text-xs text-slate-500">Save your changes before approving earnings.</p>}
    </form> : <section className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-bold">Approved earnings · {ledger.invoice?.number}</h3><p className="text-xs text-slate-500">Base {money(ledger.invoice?.baseCents || 0)} · {ledger.basis === "ex_gst" ? "excluding GST" : "including GST"} · Approved by {ledger.approvedBy}</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{label(job)}</span></div>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Member", "Share", "Earned", "Paid", "Outstanding"].map(s => <th key={s} className="p-2">{s}</th>)}</tr></thead><tbody>{ledger.shares.map(s => <tr key={s.memberId} className="border-b border-slate-100"><td className="p-2">{s.name}</td><td className="p-2">{s.rateBps / 100}%</td><td className="p-2">{money(s.earnedCents)}</td><td className="p-2">{money(s.paidCents)}</td><td className="p-2 font-semibold">{money(s.earnedCents - s.paidCents)}</td></tr>)}</tbody></table></div>
      {ledger.notes && <p className="whitespace-pre-wrap text-sm text-slate-500">{ledger.notes}</p>}
      <div className="flex justify-end gap-2"><button className={button} disabled={busy || ledger.shares.some(s => s.paidCents > 0)} onClick={() => setMode("reopen")}>Reopen approval</button><button className={primary} disabled={busy || job.changed || !ledger.shares.some(s => s.earnedCents > s.paidCents)} onClick={() => setMode("pay")}><Wallet className="h-4 w-4" />Record payment</button></div>
    </section>}
    {mode === "approve" && <section className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4"><h3 className="font-bold">Approve these earnings?</h3><p className="text-sm">Approve {money(estimatedShares(job).reduce((sum, s) => sum + s.earnedCents, 0))} against {job.invoice?.number}. The invoice amount, GST basis and member shares will be preserved.</p><p className="text-xs text-slate-600">{job.invoicePaid ? "The customer invoice is marked paid." : "The customer invoice is not marked paid. Approval records earnings independently of customer payment."}</p><div className="flex gap-2"><button className={primary} disabled={busy} onClick={() => void mutate({ action: "approve", invoice: job.invoice })}>Approve earnings</button><button className={button} disabled={busy} onClick={() => setMode(null)}>Cancel</button></div></section>}
    {mode === "reopen" && <form onSubmit={e => { e.preventDefault(); void mutate({ action: "reopen", reason: new FormData(e.currentTarget).get("reason") }); }} className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="font-bold">Reopen for correction</h3><p className="text-sm text-slate-600">The previous approval remains in audit history. Save and approve the revised shares afterwards.</p><Field name="Reason *"><textarea className={input} name="reason" required maxLength={500} disabled={busy} /></Field><div className="flex gap-2"><button className={primary} disabled={busy}>Reopen</button><button type="button" className={button} disabled={busy} onClick={() => setMode(null)}>Cancel</button></div></form>}
    {mode === "pay" && approved && <form onSubmit={recordPayment} className="space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-4"><h3 className="font-bold">Record a team payment</h3><p className="text-xs text-slate-600">Log a payment already made. This records the payment without transferring money.{!job.invoicePaid && " The customer invoice is not marked paid."}</p><fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2"><Field name="Member *"><select className={input} required value={paymentMember} onChange={e => setPaymentMember(e.target.value)}><option value="">Choose member</option>{ledger.shares.filter(s => s.paidCents < s.earnedCents).map(s => <option key={s.memberId} value={s.memberId}>{s.name} · {money(s.earnedCents - s.paidCents)} due</option>)}</select></Field><Field name="Amount (AUD) *"><input className={input} name="amount" type="number" required min="0.01" max={paymentShare ? (paymentShare.earnedCents - paymentShare.paidCents) / 100 : 0} step="0.01" /></Field><Field name="Date paid *"><input className={input} type="date" name="date" required defaultValue={today()} max={today()} /></Field><Field name="Method *"><select className={input} name="method"><option>Bank transfer</option><option>Cash</option><option>Other</option></select></Field><Field name="Payment reference *"><input className={input} name="reference" required maxLength={160} placeholder="Transfer or receipt reference" /></Field><Field name="Note"><input className={input} name="note" maxLength={500} /></Field></fieldset><div className="flex gap-2"><button className={primary} disabled={busy}>Save payment record</button><button type="button" className={button} disabled={busy} onClick={() => setMode(null)}>Cancel</button></div></form>}
    <section className="space-y-3 border-t border-slate-100 pt-4"><h3 className="flex items-center gap-2 text-sm font-bold"><History className="h-4 w-4" />Payments & audit log</h3><ErrorBox error={historyError} />{historyError && <button className={button} onClick={() => setHistoryRetry(v => v + 1)}>Retry history</button>}{!history && !historyError && <p role="status" className="text-sm text-slate-500">Loading history…</p>}
      {history && <><div className="space-y-2">{history.payments.map(p => <div key={p.id} className="rounded-xl border border-slate-200 p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-semibold">{p.memberName} · {money(p.amountCents)}{p.voidedAt && <span className="ml-2 text-xs text-rose-600">Reversed</span>}</p><p className="text-xs text-slate-500">{p.date} · {p.method} · {p.reference} · Recorded by {p.actor}</p>{p.note && <p className="mt-1 break-words text-xs text-slate-500">{p.note}</p>}{p.voidedAt && <p className="mt-1 break-words text-xs text-rose-600">{p.voidedBy}: {p.voidReason}</p>}</div>{!p.voidedAt && <button className={button} disabled={busy} onClick={() => setVoidId(p.id)}>Reverse record</button>}</div>{voidId === p.id && <form className="mt-3 space-y-2" onSubmit={e => { e.preventDefault(); void mutate({ action: "void_payment", paymentId: p.id, reason: new FormData(e.currentTarget).get("reason") }); }}><p className="text-xs text-amber-700">Correct the ledger only after confirming this payment was entered incorrectly or returned. This does not recover transferred money.</p><Field name="Reversal reason *"><input className={input} name="reason" required maxLength={500} disabled={busy} /></Field><div className="flex gap-2"><button className={button} disabled={busy}>Confirm reversal</button><button className={button} type="button" disabled={busy} onClick={() => setVoidId(null)}>Cancel</button></div></form>}</div>)}{!history.payments.length && <p className="text-xs text-slate-500">No team payments recorded.</p>}</div>
      <ol className="divide-y divide-slate-100">{history.events.map(event => <li key={event.id} className="py-3"><p className="text-xs font-semibold text-slate-500">{new Date(event.createdAt).toLocaleString("en-AU")} · {event.actor} · {event.action.replaceAll("_", " ")}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">{event.detail}</p></li>)}</ol>{!history.events.length && <p className="text-xs text-slate-500">No earnings changes yet.</p>}<div className="flex items-center justify-between"><button className={button} disabled={historyPage === 1} onClick={() => setHistoryPage(p => p - 1)}>Previous</button><span className="text-xs text-slate-500">Audit page {historyPage}</span><button className={button} disabled={!history.hasMore} onClick={() => setHistoryPage(p => p + 1)}>Next</button></div></>}
    </section>
  </Dialog>;
}

export function TeamEarningsView({ query, onQueryChange }: { query: string; onQueryChange: (value: string) => void }) {
  const [data, setData] = useState<EarningsData>({ members: [], jobs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [memberId, setMemberId] = useState("");
  const [status, setStatus] = useState("");
  const [tab, setTab] = useState<"jobs" | "members">("jobs");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<EarningsJob | null>(null);
  const sequence = useRef(0);
  const load = useCallback(async () => {
    const current = ++sequence.current; setLoading(true); setError("");
    try { const result = await api<EarningsData>("/api/admin/team-earnings"); if (current === sequence.current) setData(result); }
    catch (e) { if (current === sequence.current) setError((e as Error).message); }
    finally { if (current === sequence.current) setLoading(false); }
  }, []);
  useEffect(() => { void load(); return () => { sequence.current++; }; }, [load]);
  function saved(_ledger: EarningsLedger) {
    sequence.current++; setLoading(false);
    setSelected(null); setNotice("Earnings record saved. Refreshing current assignments and balances…");
    void load();
  }
  const related = (job: EarningsJob, id: string) => job.assignedIds.includes(id) || job.ledger?.shares.some(s => s.memberId === id);
  const relevant = data.jobs.filter(job => !memberId || related(job, memberId));
  const sums = relevant.reduce((totals, job) => {
    for (const share of estimatedShares(job)) {
      if (memberId && share.memberId !== memberId) continue;
      if (job.ledger?.status === "approved") { totals.earned += share.earnedCents; totals.paid += share.paidCents; }
      else totals.estimated += share.earnedCents;
    }
    return totals;
  }, { earned: 0, paid: 0, estimated: 0 });
  const filtered = relevant.filter(job => (!status || label(job) === status) && [job.jobLabel, job.customer, job.service, ...job.assignedNames, ...(job.ledger?.shares.map(s => s.name) || [])].some(value => value.toLowerCase().includes(query.trim().toLowerCase()))).sort((a, b) => Number(b.changed) - Number(a.changed) || (b.ledger?.updatedAt || b.id).localeCompare(a.ledger?.updatedAt || a.id));
  const totalPages = Math.max(1, Math.ceil(filtered.length / 20)), currentPage = Math.min(page, totalPages);
  const memberRows = data.members.filter(m => (!memberId || m.id === memberId) && `${m.name} ${m.role}`.toLowerCase().includes(query.toLowerCase())).map(member => {
    const jobs = data.jobs.filter(job => related(job, member.id));
    const assigned = jobs.filter(job => job.assignedIds.includes(member.id));
    let earned = 0, paid = 0, estimated = 0;
    for (const job of jobs) for (const s of estimatedShares(job).filter(s => s.memberId === member.id)) {
      if (job.ledger?.status === "approved") { earned += s.earnedCents; paid += s.paidCents; } else estimated += s.earnedCents;
    }
    return { ...member, assigned: assigned.length, visits: jobs.reduce((sum, job) => sum + (job.memberWork.find(w => w.memberId === member.id)?.completedVisits || 0), 0), days: jobs.reduce((sum, job) => sum + (job.memberWork.find(w => w.memberId === member.id)?.daysDone || 0), 0), earned, paid, estimated };
  });
  function exportCsv() {
    const contents = tab === "jobs" ? earningsJobsCsv(filtered) : earningsMembersCsv(memberRows);
    const url = URL.createObjectURL(new Blob(["\uFEFF", contents], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `groutix-team-earnings-${tab}-${today()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">Team earnings & payment logs</h2><p className="mt-1 text-sm text-slate-500">Review assigned work, agree invoice shares and track what each team member is owed.</p></div><div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={loading || Boolean(error) || !(tab === "jobs" ? filtered.length : memberRows.length)} title="Export all filtered rows from the current tab" onClick={exportCsv}><Download className="h-4 w-4" />Export CSV</button><button className={button} disabled={loading} onClick={() => { setNotice(""); void load(); }}><RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</button></div></div>
    <ErrorBox error={error} />{notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[{ title: "Draft estimates", value: sums.estimated, hint: "Saved shares against current invoices" }, { title: "Approved earnings", value: sums.earned, hint: "Preserved at manager approval" }, { title: "Payments recorded", value: sums.paid, hint: "Excludes reversed payment records" }, { title: "Outstanding", value: sums.earned - sums.paid, hint: "Approved earnings less recorded payments" }].map(card => <div key={card.title} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"><p className="text-xs font-semibold text-slate-500">{card.title}</p><p className="mt-2 text-2xl font-bold text-slate-900">{loading || error ? "—" : money(card.value)}</p><p className="mt-1 text-xs text-slate-400">{card.hint}</p></div>)}</div>
    <p className="text-xs text-slate-500">Amounts are AUD. No earnings are assumed until shares are saved. Summary amounts follow the member filter. Visit and day counts follow each member’s own assignments; recorded days are not verified hours.</p>
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4"><button className={tab === "jobs" ? primary : button} onClick={() => { setTab("jobs"); setPage(1); }}>Jobs & leads</button><button className={tab === "members" ? primary : button} onClick={() => { setTab("members"); setPage(1); }}>Team balances</button><div className="relative min-w-48 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input className={`${input} pl-9`} aria-label="Search team earnings" placeholder={tab === "jobs" ? "Search job, customer or member…" : "Search team member…"} value={query} onChange={e => { onQueryChange(e.target.value); setPage(1); }} /></div><select className={`${input} sm:w-auto`} aria-label="Filter team member" value={memberId} onChange={e => { setMemberId(e.target.value); setPage(1); }}><option value="">All team members</option>{data.members.map(m => <option key={m.id} value={m.id}>{m.name}{m.active ? "" : " (inactive)"}</option>)}</select>{tab === "jobs" && <select className={`${input} sm:w-auto`} aria-label="Filter earnings status" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All earnings statuses</option>{["Not configured", "Draft", "Approved", "Settled", "Needs review"].map(value => <option key={value}>{value}</option>)}</select>}</div>
      {loading ? <div role="status" className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />Loading team earnings…</div> : error ? <div className="p-8 text-center"><button className={button} onClick={() => void load()}>Retry</button></div> : tab === "jobs" ? <>
        {!filtered.length ? <div className="p-12 text-center"><Wallet className="mx-auto mb-3 h-8 w-8 text-slate-300" /><p className="font-semibold">No matching leads or jobs</p><p className="mt-1 text-sm text-slate-500">Assigned leads and saved invoices appear here automatically.</p></div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Job / lead", "Assigned work", "Invoice", "Team earnings", "Status", ""].map((value, i) => <th key={i} className="px-4 py-3">{value}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.slice((currentPage - 1) * 20, currentPage * 20).map(job => <tr key={job.id} className="align-top"><td className="min-w-40 max-w-64 break-words px-4 py-4"><p className="font-bold text-slate-900">{job.jobLabel}</p><p>{job.customer}</p><p className="mt-1 text-xs text-slate-500">{job.status}</p></td><td className="min-w-44 max-w-64 px-4 py-4"><p className="break-words text-xs">{job.assignedNames.join(", ") || "Unassigned"}</p><p className="mt-1 text-xs text-slate-500">{job.completedVisits}/{job.totalVisits} visits done</p><p className="text-xs text-slate-400">Days recorded {job.daysDone} / {job.daysPlanned || "not set"}</p></td><td className="min-w-32 px-4 py-4"><p className="font-semibold">{job.invoice ? money(job.invoice.totalCents) : "—"}</p><p className="text-xs text-slate-500">{job.invoice?.number || "No saved invoice"}</p>{job.invoice && <p className="text-xs text-slate-400">Customer: {job.invoicePaid ? "paid" : "not marked paid"}</p>}</td><td className="min-w-36 px-4 py-4"><p className="font-semibold">{money(estimatedShares(job).reduce((sum, s) => sum + s.earnedCents, 0))}</p><p className="text-xs text-slate-500">{job.ledger?.status === "approved" ? `Outstanding ${money(job.ledger.shares.reduce((sum, s) => sum + s.earnedCents - s.paidCents, 0))}` : "Estimate"}</p><p className="text-xs text-slate-400">{job.ledger?.shares.length || 0} member shares</p></td><td className="px-4 py-4"><span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${job.changed ? "bg-amber-50 text-amber-700" : job.ledger?.status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{label(job)}</span></td><td className="px-4 py-4"><button className={button} onClick={() => setSelected(job)}>Manage</button></td></tr>)}</tbody></table></div>}
        <div className="flex items-center justify-between border-t border-slate-100 p-4 text-xs text-slate-500"><span>{filtered.length} jobs · Page {currentPage} of {totalPages}</span><div className="flex gap-2"><button className={button} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><button className={button} disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</button></div></div>
      </> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Member", "Assigned leads", "Completed visits", "Recorded job days", "Draft estimate", "Approved", "Paid", "Outstanding", ""].map((s, i) => <th key={i} className="px-4 py-3">{s}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{memberRows.map(member => <tr key={member.id}><td className="min-w-40 px-4 py-3"><p className="font-semibold">{member.name}</p><p className="text-xs text-slate-500">{member.role}{!member.active && " · inactive"}</p></td><td className="px-4 py-3">{member.assigned}</td><td className="px-4 py-3">{member.visits}</td><td className="px-4 py-3">{member.days}</td><td className="px-4 py-3">{money(member.estimated)}</td><td className="px-4 py-3">{money(member.earned)}</td><td className="px-4 py-3">{money(member.paid)}</td><td className="px-4 py-3 font-semibold">{money(member.earned - member.paid)}</td><td className="px-4 py-3"><button className={button} onClick={() => { setMemberId(member.id); setStatus(""); onQueryChange(""); setTab("jobs"); setPage(1); }}>View jobs</button></td></tr>)}</tbody></table>{!memberRows.length && <p className="p-10 text-center text-sm text-slate-500">No matching team members.</p>}</div>}
    </section>
    {selected && <EarningsDetail key={`${selected.id}:${selected.ledger?.version || 0}`} job={selected} members={data.members} onClose={() => setSelected(null)} onChanged={saved} />}
  </div>;
}
