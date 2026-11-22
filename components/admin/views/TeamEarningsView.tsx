"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, Download, History, Loader2, Plus, RefreshCcw, Search, Users, Wallet, X } from "lucide-react";
import { applyDailyEarningsCaps, calculateEarnings, formatEarningsMoney as money, type EarningsShare, type EarningsBasis, type EarningsData, type EarningsEvent, type EarningsJob, type EarningsLedger, type EarningsMember, type EarningsPayment } from "@/lib/teamEarnings";
import { defaultTeamEarningsSettings, type TeamEarningsSettings } from "@/lib/teamEarningsSettings";

import { compareRegisterJobs, matchesRegisterFilter, registerFilters, registerTotals, type RegisterFilter } from "@/lib/teamEarningsRegister";
import { earningsJobsCsv, earningsMembersCsv, earningsStatus as label, estimatedEarningsShares as estimatedShares } from "@/lib/teamEarningsCsv";
import { Settings, Trash2 } from "lucide-react";

const input = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:opacity-60";
const button = "inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";
const primary = "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed";
type ShareRow = { memberId: string; mode: "percent" | "amount"; value: string };
const shareRow = (share: EarningsShare): ShareRow => ({ memberId: share.memberId, mode: share.fixedAmountCents !== undefined ? "amount" : "percent", value: share.fixedAmountCents === undefined && share.rateBps === 0 ? "" : String(share.fixedAmountCents !== undefined ? share.fixedAmountCents / 100 : share.rateBps / 100) });
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
function EarningsDetail({ job, members, settings, onClose, onChanged, onRefresh, initialMember }: { job: EarningsJob; members: EarningsMember[]; settings?: TeamEarningsSettings; onClose: () => void; onChanged: (ledger: EarningsLedger) => void; onRefresh: () => void; initialMember?: string }) {
  const [basis, setBasis] = useState<EarningsBasis>(job.ledger?.basis || settings?.basis || "ex_gst");
  const [rows, setRows] = useState<ShareRow[]>(() => job.ledger?.shares.map(shareRow) || (job.defaultShares.length ? job.defaultShares.slice(0, 20).map(shareRow) : job.assignedIds.length ? job.assignedIds.slice(0, 20).map(emptyRow) : [emptyRow()]));
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
  const rawPreview = calculateEarnings(rows.map(row => ({ ...sharePayload(row), name: "", earnedCents: 0, paidCents: 0 })), previewBase);
  const preview = applyDailyEarningsCaps(rawPreview, job.dailyCapUsage);
  const exceedsBase = !!invoice && rawPreview.reduce((sum, share) => sum + share.earnedCents, 0) > previewBase;
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
  return <section aria-label={`${job.jobLabel} · Manage team earnings`} className="space-y-5 rounded-xl border border-blue-200 bg-white p-4"><div className="flex items-center justify-between"><h3 className="font-bold">Team shares & payments</h3><button className={button} aria-label="Close earnings editor" onClick={onClose} disabled={busy}><X className="h-4 w-4" />Close</button></div>
    <ErrorBox error={error} />
    {job.changed && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">The invoice, completion status or source lead changed after approval. Approved amounts are preserved. Review the history, reverse any recorded payments if correcting the approval, then reopen and approve the updated earnings.</p>}
    {!approved ? <form onSubmit={save} className="space-y-4">
      <fieldset disabled={busy} className="space-y-4">
        <Field name="Commission basis"><select className={input} value={basis} onChange={e => setBasis(e.target.value as EarningsBasis)}><option value="ex_gst">Invoice amount excluding GST</option><option value="inclusive">Full invoice amount including GST</option></select></Field>
        <p className="text-xs text-slate-500">{invoice ? `Invoice GST: ${invoice.gstBps < 0 ? "mixed rates" : `${invoice.gstBps / 100}%`}. Calculation base: ${money(previewBase)}.` : "Save an invoice to calculate estimates. Shares can be planned now."} Defaults come from Earnings Settings. Daily maximums apply across all approved jobs for each worker on this completion date. Fixed amounts apply once per job; work days do not multiply the share.</p>
        <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-blue-50 text-xs text-slate-600"><tr>{["Team member", "Role", "Share type", "Share / Amount", "Estimated earnings", "Action"].map(title => <th key={title} className="p-3">{title}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-b border-slate-100">
          <td className="min-w-48 p-3"><select required aria-label={`Team member ${index + 1}`} className={input} value={row.memberId} onChange={e => setRows(old => old.map((r, i) => i === index ? { ...r, memberId: e.target.value } : r))}><option value="">Choose member</option>{members.filter(m => m.active || ledger?.shares.some(s => s.memberId === m.id)).map(m => <option key={m.id} value={m.id}>{m.name}{!m.active ? " (inactive)" : ""}</option>)}</select></td>
          <td className="p-3 text-xs">{members.find(m => m.id === row.memberId)?.role || "—"}</td>
          <td className="min-w-40 p-3"><select aria-label={`Share type ${index + 1}`} className={input} value={row.mode} onChange={e => setRows(old => old.map((r, i) => i === index ? { ...r, mode: e.target.value as ShareRow["mode"], value: "" } : r))}><option value="percent">Percentage %</option><option value="amount">Fixed AUD</option></select></td>
          <td className="min-w-32 p-3"><input required aria-label={`${row.mode === "amount" ? "Amount AUD" : "Share percent"} ${index + 1}`} className={input} type="number" min="0.01" max={row.mode === "percent" ? 100 : undefined} step="0.01" value={row.value} onChange={e => setRows(old => old.map((r, i) => i === index ? { ...r, value: e.target.value } : r))} /></td>
          <td className="p-3 font-semibold">{invoice ? money(preview[index]?.earnedCents || 0) : "Awaiting invoice"}</td>
          <td className="p-3"><button className={button} type="button" aria-label={`Remove share ${index + 1}`} disabled={rows.length === 1} onClick={() => setRows(old => old.filter((_, i) => i !== index))}><X className="h-4 w-4" /></button></td>
        </tr>)}</tbody></table></div>
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
function Badge({ children, warning = false }: { children: ReactNode; warning?: boolean }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${warning ? "bg-amber-100 text-amber-800" : "bg-blue-50 text-blue-800"}`}>{children}</span>;
}

type EmployeeSettingForm = { memberId: string; mode: "percent" | "amount"; value: string; dailyMaximum: string };
function EarningsSettingsDialog({ members, current, onClose, onSaved, onManageTeam }: {
  members: EarningsMember[]; current?: TeamEarningsSettings; onClose: () => void; onSaved: (settings: TeamEarningsSettings) => void; onManageTeam: () => void;
}) {
  const savedSettings = current || defaultTeamEarningsSettings;
  const [basis, setBasis] = useState<EarningsBasis>(savedSettings.basis);
  const [gstRate, setGstRate] = useState(String(savedSettings.gstRateBps / 100));
  const [employeeRows, setEmployeeRows] = useState<EmployeeSettingForm[]>(() => members.map(member => {
    const saved = savedSettings.employeeSettings.find(setting => setting.memberId === member.id);
    return { memberId: member.id, mode: saved?.mode || "percent", value: saved ? String(saved.mode === "amount" ? (saved.fixedAmountCents || 0) / 100 : saved.rateBps / 100) : "", dailyMaximum: saved?.dailyCapCents == null ? "" : String(saved.dailyCapCents / 100) };
  }));
  const [rules, setRules] = useState(savedSettings.automaticExpenses.map(rule => ({ ...rule, amount: (rule.amountCents / 100).toFixed(2) })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const saved = await api<TeamEarningsSettings>("/api/admin/team-earnings/settings", {
        method: "POST",
        body: JSON.stringify({
          basis, gstRateBps: Math.round(Number(gstRate) * 100),
          employeeSettings: employeeRows.map(row => ({
            memberId: row.memberId, mode: row.mode,
            rateBps: row.mode === "percent" ? Math.round(Number(row.value || 0) * 100) : 0,
            fixedAmountCents: row.mode === "amount" ? Math.round(Number(row.value || 0) * 100) : undefined,
            dailyCapCents: row.dailyMaximum.trim() ? Math.round(Number(row.dailyMaximum) * 100) : null,
          })),
          automaticExpenses: rules.map(({ amount, ...rule }) => ({ ...rule, amountCents: Math.round(Number(amount) * 100) })),
        }),
      });
      onSaved(saved);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  function addRule() {
    setRules(old => [...old, { id: crypto.randomUUID(), name: "", amountCents: 0, amount: "", active: true, activeFrom: today() }]);
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-6" role="presentation">
    <section role="dialog" aria-modal="true" aria-labelledby="earnings-settings-title" className="my-auto max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4"><div><h2 id="earnings-settings-title" className="text-lg font-bold">Team Earnings Settings</h2><p className="text-xs text-slate-500">Settings apply to new drafts and automatic expenses only. Approved earnings remain unchanged.</p></div><button className={button} type="button" onClick={onClose}>Close</button></div>
      <form onSubmit={save} className="space-y-6 p-5">
        <ErrorBox error={error} />
        <section className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><h3 className="font-bold">Invoice GST Setting</h3><p className="mt-1 text-xs text-slate-500">The GST saved on each CRM invoice is used when available. These values set the default basis and fallback GST rate for legacy invoices.</p></div>
          <Field name="Invoice entry mode"><select className={input} value={basis} onChange={e => setBasis(e.target.value as EarningsBasis)}><option value="ex_gst">Excluding GST</option><option value="inclusive">Including GST</option></select></Field>
          <Field name="GST rate (%)"><input className={input} type="number" min="0" max="100" step="0.01" required value={gstRate} onChange={e => setGstRate(e.target.value)} /></Field>
        </section>
        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <div><h3 className="font-bold">Default Share, Daily Maximum & Role</h3><p className="mt-1 text-xs text-slate-500">Defaults prefill new job shares. Daily maximum caps one worker's combined approved earnings across all jobs on the same completion date. Roles are managed in the CRM team roster.</p></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Employee", "Share type", "Default share / amount", "Daily max (AUD)", "Role"].map(title => <th key={title} className="p-2">{title}</th>)}</tr></thead><tbody>{employeeRows.map((row, index) => {
            const member = members.find(item => item.id === row.memberId);
            return <tr key={row.memberId} className="border-b border-slate-100">
              <td className="p-2 font-semibold">{member?.name || "Former member"}{member && !member.active && <span className="ml-1 text-xs text-slate-400">Inactive</span>}</td>
              <td className="min-w-36 p-2"><select className={input} value={row.mode} onChange={e => setEmployeeRows(old => old.map((item, i) => i === index ? { ...item, mode: e.target.value as EmployeeSettingForm["mode"] } : item))}><option value="percent">Percentage %</option><option value="amount">Fixed $</option></select></td>
              <td className="min-w-40 p-2"><input className={input} type="number" min="0" step="0.01" aria-label={`${member?.name || "Employee"} default ${row.mode}`} placeholder="No default" value={row.value} onChange={e => setEmployeeRows(old => old.map((item, i) => i === index ? { ...item, value: e.target.value } : item))} /></td>
              <td className="min-w-36 p-2"><input className={input} type="number" min="0.01" step="0.01" aria-label={`${member?.name || "Employee"} daily maximum`} placeholder="No maximum" value={row.dailyMaximum} onChange={e => setEmployeeRows(old => old.map((item, i) => i === index ? { ...item, dailyMaximum: e.target.value } : item))} /></td>
              <td className="p-2 text-xs capitalize">{member?.role || "former member"}</td>
            </tr>;
          })}{!employeeRows.length && <tr><td colSpan={5} className="p-5 text-center text-sm text-slate-500">No CRM team members found. Add employees in the CRM team page first.</td></tr>}</tbody></table></div>
          <button type="button" className={button} onClick={onManageTeam}><Plus className="h-4 w-4" />Manage CRM employees</button>
        </section>
        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <div><h3 className="font-bold">Automatic Job Expenses</h3><p className="mt-1 text-xs text-slate-500">Active fixed expenses are added once to each eligible job from the rule's start date. Changing a rule will not rewrite expenses already recorded.</p></div>
          {rules.map((rule, index) => <div key={rule.id} className="grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-[minmax(180px,1fr)_160px_150px_auto_auto] sm:items-end">
            <Field name="Expense name"><input className={input} required maxLength={100} placeholder="e.g. Fuel" value={rule.name} onChange={e => setRules(old => old.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} /></Field>
            <Field name="Amount (AUD)"><input className={input} type="number" min="0.01" step="0.01" required value={rule.amount} onChange={e => setRules(old => old.map((item, i) => i === index ? { ...item, amount: e.target.value } : item))} /></Field>
            <Field name="Start date"><input className={input} type="date" required value={rule.activeFrom} onChange={e => setRules(old => old.map((item, i) => i === index ? { ...item, activeFrom: e.target.value } : item))} /></Field>
            <label className="flex items-center gap-2 pb-2 text-xs font-semibold"><input type="checkbox" checked={rule.active} onChange={e => setRules(old => old.map((item, i) => i === index ? { ...item, active: e.target.checked } : item))} />Active</label>
            <button type="button" className={button} aria-label={`Remove ${rule.name || "expense"} rule`} onClick={() => setRules(old => old.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></button>
          </div>)}
          <button type="button" className={button} onClick={addRule}><Plus className="h-4 w-4" />Add automatic expense rule</button>
        </section>
        <div className="flex justify-end gap-2"><button type="button" className={button} onClick={onClose} disabled={busy}>Cancel</button><button type="submit" className={primary} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save settings</button></div>
      </form>
    </section>
  </div>;
}

function JobExpenses({ job, onChanged }: { job: EarningsJob; onChanged: () => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const activeExpenses = job.expenses.filter(expense => !expense.voidedAt);
  async function mutate(payload: Record<string, unknown>) {
    setBusy(true); setError("");
    try {
      await api(`/api/admin/team-earnings/${job.id}/expenses`, { method: "POST", body: JSON.stringify({ ...payload, version: job.expenseVersion || 0, requestId: crypto.randomUUID() }) });
      setName(""); setAmount(""); onChanged();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
    <div className="flex items-center justify-between gap-3"><h3 className="font-bold">Job Expenses</h3><span className="text-sm font-semibold">{money(activeExpenses.reduce((sum, expense) => sum + expense.amountCents, 0))}</span></div>
    <div className="divide-y divide-slate-100">{activeExpenses.map(expense => <div key={expense.id} className="flex items-center justify-between gap-3 py-2 text-sm"><span>{expense.name}<span className="ml-2 text-xs text-slate-400">{expense.source === "automatic" ? "Automatic" : "Manual"} · {expense.date}</span></span><span className="flex items-center gap-3 font-semibold">{money(expense.amountCents)}<button className={button} type="button" disabled={busy} aria-label={`Remove expense ${expense.name}`} onClick={() => void mutate({ action: "remove", expenseId: expense.id })}><Trash2 className="h-3.5 w-3.5" /></button></span></div>)}
      {!activeExpenses.length && <p className="py-2 text-xs text-slate-500">No job expenses recorded.</p>}
    </div>
    <ErrorBox error={error} />
    <form className="grid gap-2 sm:grid-cols-[minmax(140px,1fr)_130px_150px_auto]" onSubmit={event => { event.preventDefault(); void mutate({ action: "add", name, amountCents: Math.round(Number(amount) * 100), date }); }}>
      <input className={input} aria-label="Expense name" required maxLength={100} placeholder="Expense name, e.g. Materials" value={name} onChange={e => setName(e.target.value)} />
      <input className={input} aria-label="Expense amount" required type="number" min="0.01" step="0.01" placeholder="AUD" value={amount} onChange={e => setAmount(e.target.value)} />
      <input className={input} aria-label="Expense date" required type="date" max={today()} value={date} onChange={e => setDate(e.target.value)} />
      <button className={button} type="submit" disabled={busy}><Plus className="h-4 w-4" />Add expense</button>
    </form>
  </section>;
}

export function TeamEarningsView({ query, onQueryChange, onOpenJob, onAddJob, onManageTeam, refreshKey }: {
  query: string; onQueryChange: (value: string) => void; onOpenJob: (id: string) => void;
  onAddJob: () => void; onManageTeam: () => void; refreshKey?: boolean;
}) {
  const [data, setData] = useState<EarningsData>({ members: [], jobs: [], settings: defaultTeamEarningsSettings, payments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [memberId, setMemberId] = useState("");
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState<RegisterFilter>("All Jobs");
  const [, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<{ id: string; memberId?: string } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState<"jobs" | "employees" | "payments">("jobs");
  const [period, setPeriod] = useState<"month" | "last" | "custom" | "all">("month");
  const initialMonth = monthRange(0);
  const [fromDate, setFromDate] = useState(initialMonth.from);
  const [toDate, setToDate] = useState(initialMonth.to);
  const [activeJobId, setActiveJobId] = useState("");
  const [editorOpen, setEditorOpen] = useState(true);
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
  const inPeriod = (job: EarningsJob) => {
    if (period === "all") return true;
    const date = job.completionDate || job.scheduledAt?.slice(0, 10) || "";
    const start = period === "month" ? initialMonth.from : period === "last" ? monthRange(-1).from : fromDate;
    const end = period === "month" ? initialMonth.to : period === "last" ? monthRange(-1).to : toDate;
    return !!date && date >= start && date <= end;
  };
  const relevant = data.jobs.filter(job => inPeriod(job) && (!memberId || related(job, memberId)));
  const searched = relevant.filter(job => (!status || label(job) === status) && [job.jobLabel, job.customer, job.service, job.invoice?.number || "", ...job.assignedNames, ...(job.ledger?.shares.map(s => s.name) || [])].some(value => value.toLowerCase().includes(query.trim().toLowerCase())));
  const filtered = searched.filter(job => matchesRegisterFilter(job, filter)).sort(compareRegisterJobs);
  const totals = registerTotals(filtered);
  const activeJob = filtered.find(job => job.id === activeJobId) || filtered[0];
  const expenseTotal = filtered.reduce((sum, job) => sum + job.expenses.filter(expense => !expense.voidedAt).reduce((value, expense) => value + expense.amountCents, 0), 0);
  const managerGross = totals.value - totals.earned;
  const managerFinal = managerGross - expenseTotal;
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
  function toggleJob(id: string) {
    setExpanded(old => { const next = new Set(old); if (next.has(id)) next.delete(id); else next.add(id); return next; });
    setActiveJobId(id); setEditorOpen(true); setSelected(null);
  }
  function edit(job: EarningsJob, member?: string) {
    setExpanded(old => new Set(old).add(job.id)); setActiveJobId(job.id); setEditorOpen(true); setSelected({ id: job.id, memberId: member });
  }
  const dateFilteredPayments = (data.payments || []).filter(payment => period === "all" || (period === "month" ? payment.date >= initialMonth.from && payment.date <= initialMonth.to : period === "last" ? payment.date >= monthRange(-1).from && payment.date <= monthRange(-1).to : payment.date >= fromDate && payment.date <= toDate));
  const cards = [
    ["Total Jobs", String(filtered.length)], ["Job Value", money(totals.value)], ["Received", money(totals.received)],
    ["Team Earnings", money(totals.earned)], ["Paid to Team", money(totals.paid)], ["Team Outstanding", money(totals.earned - totals.paid)], ["Manager Balance", money(managerFinal)],
  ];
  return <div className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Users className="h-5 w-5 text-blue-600" />Job & Team Payment Management</h2><p className="mt-1 text-sm text-slate-500">Monthly jobs, employee earnings, customer receipts, expenses and worker payments.</p></div><div className="flex flex-wrap items-center gap-2">
      <select className={`${input} w-auto`} aria-label="Earnings date preset" value={period} onChange={e => setPeriod(e.target.value as typeof period)}><option value="month">This Month</option><option value="last">Last Month</option><option value="custom">Custom range</option><option value="all">All Time</option></select>
      {period === "custom" && <><input className={`${input} w-auto`} aria-label="Earnings start date" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} /><input className={`${input} w-auto`} aria-label="Earnings end date" type="date" value={toDate} onChange={e => setToDate(e.target.value)} /></>}
      <button className={button} onClick={() => setSettingsOpen(true)}><Settings className="h-4 w-4" />Settings</button><button className={button} disabled={loading || !!error || !filtered.length} onClick={() => exportCsv()}><Download className="h-4 w-4" />Export</button><button className={primary} onClick={onAddJob}><Plus className="h-4 w-4" />Add Job</button>
    </div></div>
    <ErrorBox error={error} />{notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4 2xl:grid-cols-7">{cards.map(([title, value]) => <div key={title} className={`${panel} p-3`}><p className="text-xs font-semibold text-slate-500">{title}</p><p className="mt-1 break-words text-lg font-bold text-slate-900">{loading || error ? "—" : value}</p></div>)}</div>
    <div className="flex flex-wrap gap-2" aria-label="Job status filters">{registerFilters.map(value => <button key={value} aria-pressed={filter === value} className={filter === value ? primary : button} onClick={() => { setFilter(value); setPage(1); }}>{value} ({loading || error ? "—" : searched.filter(job => matchesRegisterFilter(job, value)).length})</button>)}</div>
    <div className="flex flex-wrap items-center gap-2"><div className="relative min-w-48 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input className={`${input} pl-9`} aria-label="Search team earnings" placeholder="Search job, customer or employee..." value={query} onChange={e => { onQueryChange(e.target.value); setPage(1); }} /></div><select className={`${input} sm:w-auto`} aria-label="Filter team member" value={memberId} onChange={e => { setMemberId(e.target.value); setPage(1); }}><option value="">All team members</option>{data.members.map(member => <option key={member.id} value={member.id}>{member.name}{member.active ? "" : " (inactive)"}</option>)}</select><select className={`${input} sm:w-auto`} aria-label="Filter earnings status" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All earnings statuses</option>{["Not configured", "Draft", "Approved", "Settled", "Needs review"].map(value => <option key={value}>{value}</option>)}</select></div>
    <div role="tablist" aria-label="Team earnings sections" className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">{([["jobs", "Jobs Register"], ["employees", "Employee Summary"], ["payments", "Payments History"]] as const).map(([id, title]) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={tab === id ? primary : button}>{title}</button>)}</div>
    <p className="text-xs text-slate-500">Totals follow the selected date range and filters. Approved earnings are fixed; draft estimates of {loading || error ? "—" : money(totals.estimated)} are not payable yet. Manager balance is invoice value less approved team earnings and recorded job expenses.</p>
    {loading ? <div role="status" className={`${panel} flex items-center justify-center gap-2 p-12 text-sm text-slate-500`}><Loader2 className="h-5 w-5 animate-spin" />Loading team earnings...</div> : error ? <div className={`${panel} p-8 text-center`}><button className={button} onClick={() => void load()}>Retry</button></div> : <div className="grid items-start gap-4 xl:grid-cols-[minmax(230px,0.85fr)_minmax(440px,2fr)_minmax(270px,1fr)]">
      <section className={`${panel} ${tab !== "jobs" ? "xl:col-span-2" : ""}`}>
        {tab === "jobs" && <><div className="flex items-center justify-between border-b border-slate-200 p-4"><h3 className="font-bold">Jobs ({filtered.length})</h3><span className="text-xs text-slate-500">This period</span></div><div className="max-h-[560px] divide-y divide-slate-100 overflow-y-auto">{filtered.map(job => {
          const jobTotal = registerTotals([job]); const active = (activeJob?.id || "") === job.id; const earnings = job.ledger?.status === "approved" ? jobTotal.earned : jobTotal.estimated;
          return <button type="button" key={job.id} aria-expanded={activeJobId === job.id} className={`flex w-full items-start justify-between gap-3 p-3 text-left ${active ? "bg-blue-50" : "hover:bg-slate-50"}`} onClick={() => toggleJob(job.id)}>
            <span className="min-w-0"><span className="block truncate font-bold text-slate-800">{job.jobLabel}</span><span className="block truncate text-xs text-slate-500">{job.customer}</span><span className="mt-1 inline-block"><Badge warning={["Pending", "Needs review"].includes(label(job))}>{job.status}</Badge></span></span><span className="shrink-0 text-right"><span className="block font-semibold">{money(earnings || job.invoice?.totalCents || 0)}</span><span className="text-[11px] text-slate-500">{job.completionDate || job.scheduledAt?.slice(0, 10) || "No date"}</span></span>
          </button>;
        })}{!filtered.length && <p className="p-6 text-center text-sm text-slate-500">No jobs match this period and filter.</p>}</div></>}
        {tab === "employees" && <><div className="flex items-center justify-between border-b border-slate-200 p-4"><h3 className="font-bold">Employee Summary</h3><button className={button} onClick={() => exportCsv(true)}>Export CSV</button></div><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Employee", "Role", "Draft", "Earned", "Paid", "Remaining", "Action"].map(title => <th key={title} className="p-3">{title}</th>)}</tr></thead><tbody>{memberRows.map(member => <tr key={member.id} className="border-t border-slate-100"><td className="p-3 font-semibold">{member.name}</td><td className="p-3 capitalize">{member.role}</td><td className="p-3">{money(member.estimated)}</td><td className="p-3">{money(member.earned)}</td><td className="p-3 text-emerald-700">{money(member.paid)}</td><td className="p-3 font-semibold text-rose-700">{money(member.earned - member.paid)}</td><td className="p-3"><button className={button} onClick={() => { setMemberId(member.id); setTab("jobs"); }}>View jobs</button></td></tr>)}</tbody><tfoot className="border-t bg-blue-50 font-bold"><tr><td colSpan={2} className="p-3">Total</td><td className="p-3">{money(memberRows.reduce((sum, row) => sum + row.estimated, 0))}</td><td className="p-3">{money(memberRows.reduce((sum, row) => sum + row.earned, 0))}</td><td className="p-3">{money(memberRows.reduce((sum, row) => sum + row.paid, 0))}</td><td className="p-3">{money(memberRows.reduce((sum, row) => sum + row.earned - row.paid, 0))}</td><td /></tr></tfoot></table></div></>}
        {tab === "payments" && <><div className="border-b border-slate-200 p-4"><h3 className="font-bold">Payments History</h3></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Date", "Employee", "Job", "Amount", "Method", "Reference", "Status"].map(title => <th key={title} className="p-3">{title}</th>)}</tr></thead><tbody>{dateFilteredPayments.map(payment => <tr key={payment.id} className="border-t border-slate-100"><td className="p-3">{payment.date}</td><td className="p-3 font-semibold">{payment.memberName}</td><td className="p-3">{payment.jobLabel}</td><td className="p-3">{money(payment.amountCents)}</td><td className="p-3">{payment.method}</td><td className="p-3">{payment.reference}</td><td className="p-3">{payment.voidedAt ? "Reversed" : "Recorded"}</td></tr>)}</tbody></table>{!dateFilteredPayments.length && <p className="p-8 text-center text-sm text-slate-500">No team payments in this period.</p>}</div></>}
      </section>
      {tab === "jobs" && activeJob ? <section className={`${panel} space-y-4 p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-lg font-bold">Job # {activeJob.jobLabel}</h3><p className="text-xs text-slate-500">{activeJob.customer} · {activeJob.completionDate || activeJob.scheduledAt?.slice(0, 10) || "No date"} · {activeJob.service}</p></div><div className="flex gap-2"><Badge warning={activeJob.changed}>{label(activeJob)}</Badge>{activeJob.status !== "Source unavailable" && <button className={button} onClick={() => onOpenJob(activeJob.id)}>Edit Job</button>}</div></div>
        <div className="grid gap-3 md:grid-cols-2"><section className="rounded-xl border border-slate-200 p-3 text-sm"><h4 className="mb-2 font-bold">Job Details</h4><p className="flex justify-between gap-2"><span className="text-slate-500">Customer</span><b>{activeJob.customer}</b></p><p className="mt-1 flex justify-between gap-2"><span className="text-slate-500">Job date</span><b>{activeJob.completionDate || activeJob.scheduledAt?.slice(0, 10) || "—"}</b></p><p className="mt-1 flex justify-between gap-2"><span className="text-slate-500">Job value</span><b>{money(activeJob.invoice?.totalCents || 0)}</b></p><p className="mt-1 flex justify-between gap-2"><span className="text-slate-500">Invoice</span><b>{activeJob.invoice?.number || "Not saved"}</b></p></section><section className="rounded-xl border border-slate-200 p-3 text-sm"><h4 className="mb-2 font-bold">Customer Payment</h4><p className="flex justify-between gap-2"><span className="text-slate-500">Received</span><b className="text-emerald-700">{money(registerTotals([activeJob]).received)}</b></p><p className="mt-1 flex justify-between gap-2"><span className="text-slate-500">Payment status</span><Badge warning={!!activeJob.invoice && !activeJob.invoicePaid}>{!activeJob.invoice ? "No invoice" : activeJob.invoicePaid ? "Paid" : "Pending"}</Badge></p><p className="mt-1 flex justify-between gap-2"><span className="text-slate-500">Customer outstanding</span><b>{money((activeJob.invoice?.totalCents || 0) - registerTotals([activeJob]).received)}</b></p><button className={`${button} mt-2`} onClick={() => onOpenJob(activeJob.id)}>Manage customer invoices</button></section></div>
        {editorOpen ? <EarningsDetail key={`${activeJob.id}:${activeJob.ledger?.version || 0}:${selected?.id === activeJob.id ? selected.memberId || "details" : "details"}`} job={activeJob} initialMember={selected?.id === activeJob.id ? selected.memberId : undefined} members={data.members} settings={data.settings} onClose={() => { setEditorOpen(false); setSelected(null); }} onChanged={saved} onRefresh={() => void load()} />
          : <button className={primary} onClick={() => setEditorOpen(true)}>Manage team shares and payments</button>}
        <JobExpenses key={`${activeJob.id}:${activeJob.expenseVersion || 0}`} job={activeJob} onChanged={() => { setNotice("Expense saved to the job record."); void load(); }} />
        <div className="grid gap-2 rounded-xl bg-emerald-50 p-3 text-sm sm:grid-cols-3"><span>Amount received: <b>{money(registerTotals([activeJob]).received)}</b></span><span>Team earnings: <b>{money(activeJob.ledger?.status === "approved" ? registerTotals([activeJob]).earned : 0)}</b></span><span>Manager balance: <b>{money(registerTotals([activeJob]).received - (activeJob.ledger?.status === "approved" ? registerTotals([activeJob]).earned : 0) - activeJob.expenses.filter(expense => !expense.voidedAt).reduce((sum, expense) => sum + expense.amountCents, 0))}</b></span></div>
        <details className="rounded-xl border border-slate-200 bg-white p-3"><summary className="cursor-pointer text-sm font-semibold">Assigned work & visit progress</summary><div className="mt-3"><WorkBreakdown job={activeJob} /></div></details>
      </section> : tab === "jobs" ? <section className={`${panel} p-8 text-center text-sm text-slate-500`}>Select a job to see earnings and payment details.</section> : null}
      <aside className="space-y-4">
        <section className={`${panel} p-4`}><ManagerSummary totals={totals} expenseTotal={expenseTotal} managerGross={managerGross} managerFinal={managerFinal} /></section>
        <section className={panel}><div className="p-4"><h3 className="font-bold">Team Summary · This Period</h3></div><div className="overflow-x-auto"><table className="w-full min-w-[340px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-2">Employee</th><th className="p-2">Earned</th><th className="p-2">Paid</th><th className="p-2">Remaining</th></tr></thead><tbody>{memberRows.map(row => <tr key={row.id} className="border-t border-slate-100"><td className="p-2 font-semibold">{row.name}</td><td className="p-2">{money(row.earned)}</td><td className="p-2">{money(row.paid)}</td><td className="p-2 font-semibold text-rose-700">{money(row.earned - row.paid)}</td></tr>)}<tr className="border-t bg-blue-50 font-bold"><td className="p-2">Total</td><td className="p-2">{money(totals.earned)}</td><td className="p-2">{money(totals.paid)}</td><td className="p-2">{money(totals.earned - totals.paid)}</td></tr></tbody></table></div></section>
      </aside>
    </div>}
    <p className="text-xs text-slate-500">Payments record money already paid to workers; they do not transfer funds. Customer receipts remain separate. Currency displays cents, and ledger calculations use integer cents.</p>
    {settingsOpen && <EarningsSettingsDialog members={data.members} current={data.settings} onClose={() => setSettingsOpen(false)} onManageTeam={onManageTeam} onSaved={settings => { setData(current => ({ ...current, settings })); setSettingsOpen(false); setNotice("Team earnings settings saved."); void load(); }} />}
  </div>;
}

function ManagerSummary({ totals, expenseTotal, managerGross, managerFinal }: {
  totals: ReturnType<typeof registerTotals>; expenseTotal: number; managerGross: number; managerFinal: number;
}) {
  return <><h3 className="font-bold">Manager Summary · Groutix</h3><dl className="mt-3 space-y-3 text-sm">
    {[["Job value", totals.value], ["Team earnings", -totals.earned], ["Manager gross balance", managerGross], ["Total expenses", -expenseTotal], ["Manager final balance", managerFinal], ["Customer received", totals.received], ["Team still outstanding", totals.earned - totals.paid]].map(([title, value]) => <div key={title} className="flex justify-between gap-3"><dt>{title}</dt><dd className={`font-bold ${title === "Manager final balance" ? "text-emerald-700" : ""}`}>{money(value as number)}</dd></div>)}
  </dl><p className="mt-3 text-xs text-slate-500">Manager balance is invoice value less approved team earnings and recorded job expenses. It is not net profit; other business expenses are not included.</p></>;
}

function monthRange(offset: number) {
  const current = new Date(`${today()}T00:00:00Z`);
  current.setUTCDate(1);
  current.setUTCMonth(current.getUTCMonth() + offset);
  const year = current.getUTCFullYear(), month = current.getUTCMonth();
  const pad = (value: number) => String(value).padStart(2, "0");
  return { from: `${year}-${pad(month + 1)}-01`, to: `${year}-${pad(month + 1)}-${pad(new Date(Date.UTC(year, month + 1, 0)).getUTCDate())}` };
}
