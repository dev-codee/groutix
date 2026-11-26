"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { BriefcaseBusiness, CheckCircle2, CircleDollarSign, Clock3, Download, History, Layers3, Loader2, Plus, Search, TrendingUp, Users, Wallet, X } from "lucide-react";
import { applyDailyEarningsCaps, calculateEarnings, distributeTeamPool, formatEarningsMoney as money, type EarningsShare, type EarningsBasis, type EarningsData, type EarningsEvent, type EarningsJob, type EarningsLedger, type EarningsMember, type EarningsPayment } from "@/lib/teamEarnings";
import { defaultTeamEarningsSettings, type TeamEarningsSettings } from "@/lib/teamEarningsSettings";

import { compareRegisterJobs, matchesRegisterFilter, registerFilters, registerTotals, type RegisterFilter } from "@/lib/teamEarningsRegister";
import { earningsJobsCsv, earningsMembersCsv, earningsStatus as label, estimatedEarningsShares as estimatedShares } from "@/lib/teamEarningsCsv";
import { Settings, Trash2 } from "lucide-react";

const input = "w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none disabled:opacity-60";
const button = "inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";
const primary = "inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed";
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
function ErrorBox({ error }: { error: string }) { return error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null; }
function WorkBreakdown({ job }: { job: EarningsJob }) {
  return <div className="space-y-1.5">{(["inspection", "job"] as const).map(type => <div key={type}>
    <p className="text-xs font-semibold text-slate-700">{type === "inspection" ? "Inspection by" : "Job worked by"}</p>
    {job.workVisits.filter(visit => visit.type === type).map((visit, index) => <p key={index} className="text-xs text-slate-500">{visit.name} · {visit.date} · {visit.status}{type === "job" && ` · ${visit.daysDone} / ${visit.daysPlanned || "not set"} days`}</p>)}
    {!job.workVisits.some(visit => visit.type === type) && <p className="text-xs text-slate-500">No visit recorded</p>}
  </div>)}</div>;
}
interface HistoryData { events: EarningsEvent[]; payments: EarningsPayment[]; hasMore: boolean }
function EarningsDetail({ job, members, settings, onClose, onChanged, onExpenseChanged, initialMember, invoiceKey }: { job: EarningsJob; members: EarningsMember[]; settings?: TeamEarningsSettings; onClose: () => void; onChanged: (ledger: EarningsLedger) => void; onExpenseChanged: () => void; initialMember?: string; invoiceKey?: string }) {
  const allocation = job.ledger?.invoiceShares?.find(item => item.invoiceKey === invoiceKey);
  const selectedShares = invoiceKey ? allocation?.shares : job.ledger?.shares;
  const [basis, setBasis] = useState<EarningsBasis>(job.ledger?.basis || settings?.basis || "ex_gst");
  const [rows, setRows] = useState<ShareRow[]>(() => selectedShares?.map(shareRow) || (job.defaultShares?.some(s => s.rateBps > 0 || (s.fixedAmountCents || 0) > 0) ? job.defaultShares.filter(s => s.rateBps > 0 || (s.fixedAmountCents || 0) > 0).slice(0, 20).map(shareRow) : job.assignedIds.length ? job.assignedIds.slice(0, 20).map(emptyRow) : [emptyRow()]));
  const [poolPercent, setPoolPercent] = useState(() => { const saved = invoiceKey ? allocation?.poolBps : job.ledger?.poolBps; return saved ? String(saved / 100) : ""; });
  const [notes, setNotes] = useState(job.ledger?.notes || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [historyError, setHistoryError] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyRetry, setHistoryRetry] = useState(0);
  const [mode, setMode] = useState<"approve" | "reopen" | null>(null);
  const [voidId, setVoidId] = useState<string | null>(null);
  const [paymentMember, setPaymentMember] = useState(initialMember || selectedShares?.find(s => s.earnedCents > s.paidCents)?.memberId || "");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(today());
  const [paymentMethod, setPaymentMethod] = useState("Bank transfer");
  const [paymentNote, setPaymentNote] = useState("");
  const request = useRef<{ signature: string; id: string } | null>(null);
  const ledger = job.ledger;
  const approved = ledger?.status === "approved" && (!invoiceKey || !!allocation);
  const totalRate = rows.reduce((sum, row) => sum + (row.mode === "percent" ? Number(row.value || 0) : 0), 0);
  const maxTeamShareBps = settings?.maxTeamShareBps ?? defaultTeamEarningsSettings.maxTeamShareBps;
  const maxTeamSharePercent = maxTeamShareBps / 100;
  const poolBps = poolPercent.trim() ? Math.round(Number(poolPercent) * 100) : undefined;
  const poolWeights = rows.map(row => settings?.employeeSettings.find(setting => setting.memberId === row.memberId));
  const poolWeightsValid = rows.length > 0 && poolWeights.every(setting => !!setting && setting.mode === "percent" && setting.rateBps > 0);
  const poolDistribution = poolBps && poolBps <= maxTeamShareBps && poolWeightsValid ? distributeTeamPool(poolBps, rows.map((row, index) => ({ memberId: row.memberId, rateBps: poolWeights[index]!.rateBps }))) : [];
  const poolError = !poolPercent.trim() ? "" : !/^\d+(?:\.\d{0,2})?$/.test(poolPercent) || !Number.isFinite(Number(poolPercent)) || !poolBps || poolBps > maxTeamShareBps
    ? `Enter a team pool from 0.01% to ${maxTeamSharePercent}%.`
    : !poolWeightsValid
      ? "Set a positive default percentage in Settings for every selected member. Fixed amounts cannot be scaled by this pool."
      : poolDistribution.some(share => share.rateBps === 0)
        ? "The pool is too small to give every selected member at least 0.01%."
      : "";
  function changePool(value: string) {
    setPoolPercent(value);
    if (!value.trim()) {
      setRows(current => current.map(row => {
        const setting = settings?.employeeSettings.find(item => item.memberId === row.memberId);
        return setting ? { memberId: row.memberId, mode: setting.mode, value: setting.mode === "amount" ? String((setting.fixedAmountCents || 0) / 100) : setting.rateBps ? String(setting.rateBps / 100) : "" } : { ...row, value: "" };
      }));
      return;
    }
    if (!/^\d+(?:\.\d{0,2})?$/.test(value)) return;
    const target = Math.round(Number(value) * 100);
    const weights = rows.map(row => settings?.employeeSettings.find(setting => setting.memberId === row.memberId));
    if (target < rows.length || target > maxTeamShareBps || weights.some(setting => !setting || setting.mode !== "percent" || setting.rateBps <= 0)) return;
    const distributed = distributeTeamPool(target, rows.map((row, index) => ({ memberId: row.memberId, rateBps: weights[index]!.rateBps })));
    if (distributed.some(share => share.rateBps === 0)) return;
    setRows(current => current.map((row, index) => ({ ...row, mode: "percent", value: String(distributed[index].rateBps / 100) })));
  }
  const invoice = invoiceKey ? (job.invoice?.items || (job.invoice ? [{ ...job.invoice, key: "primary" }] : [])).find(item => item.key === invoiceKey) : job.invoice;
  const previewBase = invoice ? basis === "inclusive" ? invoice.totalCents : (invoice.items || [invoice]).reduce((sum, item) => sum + Math.round(item.totalCents * 10000 / (10000 + item.gstBps)), 0) : 0;
  const rawPreview = calculateEarnings(rows.map(row => ({ ...sharePayload(row), name: "", earnedCents: 0, paidCents: 0 })), previewBase);
  const preview = applyDailyEarningsCaps(rawPreview, job.dailyCapUsage);
  const exceedsBase = !!invoice && rawPreview.reduce((sum, share) => sum + share.earnedCents, 0) > Math.round(previewBase * maxTeamShareBps / 10000);
  const dirty = basis !== (ledger?.basis || settings?.basis || "ex_gst") || notes !== (ledger?.notes || "") || poolBps !== (invoiceKey ? allocation?.poolBps : ledger?.poolBps) || JSON.stringify(rows) !== JSON.stringify(selectedShares?.map(shareRow) || []);
  const shares = approved && !dirty ? selectedShares! : preview;
  const totalEarned = shares.reduce((sum, s) => sum + s.earnedCents, 0);
  const totalPaid = approved ? shares.reduce((sum, s) => sum + s.paidCents, 0) : 0;
  const receiptIndex = (job.invoice?.items || (job.invoice ? [{ ...job.invoice, key: "primary" }] : [])).findIndex(item => item.key === invoiceKey);
  const jobReceived = invoiceKey ? job.receipts?.[receiptIndex]?.paidCents || 0 : registerTotals([job]).received;
  const managerBalance = jobReceived - totalEarned;
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
    if (poolError) return;
    await mutate({ action: "save", basis, notes, invoiceKey, poolBps, shares: rows.map(sharePayload) });
  }
  async function createDues() {
    if (busy || !job.eligible || !invoice || poolError || exceedsBase || totalRate > maxTeamSharePercent) return;
    setBusy(true); setError("");
    try {
      if (ledger?.status === "approved" && invoiceKey && ledger.invoiceShares?.length) {
        const updated = await api<{ ledger: EarningsLedger }>(`/api/admin/team-earnings/${job.id}`, {
          method: "POST",
          body: JSON.stringify({ action: "upsert_invoice", basis, notes, invoiceKey, poolBps, shares: rows.map(sharePayload), invoice: job.invoice, version: ledger.version, requestId: crypto.randomUUID() }),
        });
        onChanged(updated.ledger);
        return;
      }
      let draft = ledger;
      if (draft?.status === "approved") {
        const reopened = await api<{ ledger: EarningsLedger }>(`/api/admin/team-earnings/${job.id}`, {
          method: "POST",
          body: JSON.stringify({ action: "reopen", reason: "Updated team shares on the job page", version: draft.version, requestId: crypto.randomUUID() }),
        });
        draft = reopened.ledger;
      }
      if (!draft || dirty || ledger?.status === "approved") {
        const saved = await api<{ ledger: EarningsLedger }>(`/api/admin/team-earnings/${job.id}`, {
          method: "POST",
          body: JSON.stringify({ action: "save", basis, notes, invoiceKey, poolBps, shares: rows.map(sharePayload), version: draft?.version || 0, requestId: crypto.randomUUID() }),
        });
        draft = saved.ledger;
      }
      const approved = await api<{ ledger: EarningsLedger }>(`/api/admin/team-earnings/${job.id}`, {
        method: "POST",
        body: JSON.stringify({ action: "approve", invoice: job.invoice, version: draft!.version, requestId: crypto.randomUUID() }),
      });
      onChanged(approved.ledger);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function recordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentMember || !paymentAmount) return;
    await mutate({ action: "pay", invoiceKey, memberId: paymentMember, amountCents: Math.round(Number(paymentAmount) * 100), date: paymentDate, method: paymentMethod, reference: `Payment ${today()}`, note: paymentNote });
    setPaymentAmount(""); setPaymentNote("");
  }
  const paymentShare = selectedShares?.find(s => s.memberId === paymentMember);
  return <section aria-label={`${job.jobLabel} · Manage team earnings`} className="space-y-2.5">
    <ErrorBox error={error} />
    {job.changed && <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800">The invoice, completion status or source lead changed after approval. Approved amounts are preserved. Review the history, reverse any recorded payments if correcting the approval, then reopen and approve the updated earnings.</p>}
    {/* Team Shares table */}
    {!approved || totalPaid === 0 ? <form onSubmit={save} className="space-y-2">
      <fieldset disabled={busy} className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <h3 className="text-sm font-bold text-slate-900">Team Shares <span className="text-xs font-normal text-slate-500">({invoiceKey ? `Invoice ${invoice?.number || ""}` : "This Job"})</span></h3>
          <Field name="Basis"><select className={`${input} w-auto`} value={basis} onChange={e => setBasis(e.target.value as EarningsBasis)}><option value="ex_gst">Excluding GST</option><option value="inclusive">Including GST</option></select></Field>
        </div>
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-blue-100 bg-blue-50/60 p-2">
          <label className="w-36 space-y-1 text-xs font-semibold text-slate-700"><span className="block">Total team pool (%)</span><input className={input} aria-label="Total team pool percentage" type="number" min="0.01" max={maxTeamSharePercent} step="0.01" placeholder="Use settings" value={poolPercent} onChange={e => changePool(e.target.value)} /></label>
          <p className="min-w-44 flex-1 text-xs text-slate-600">{poolPercent.trim() && !poolError ? `${poolPercent}% of ${invoiceKey ? "this invoice" : "the job"}${invoice ? ` = ${money(Math.round(previewBase * poolBps! / 10000))}` : ""}; split by Settings ratios.` : "Leave blank to use the member percentages below, prefilled from Settings."}</p>
        </div>
        {poolError && <ErrorBox error={poolError} />}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-blue-50 text-xs text-slate-600">
              <tr>{["Employee", "Role", "Share Type", "Share", "Amount", "Paid", "Remaining", ""].map(t => <th key={t} className="p-1.5 font-semibold">{t}</th>)}</tr>
            </thead>
            <tbody>{rows.map((row, index) => {
              const member = members.find(m => m.id === row.memberId);
              const earned = shares[index]?.earnedCents || 0;
              const cap = job.dailyCapUsage?.find(usage => usage.memberId === row.memberId);
              return <tr key={index} className="border-t border-slate-100">
                <td className="min-w-28 p-1"><select required aria-label={`Employee ${index + 1}`} className={input} value={row.memberId} onChange={e => { setPoolPercent(""); setRows(old => old.map((r, i) => i === index ? { ...r, memberId: e.target.value } : r)); }}><option value="">Select</option>{members.filter(m => m.active || ledger?.shares.some(s => s.memberId === m.id)).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></td>
                <td className="p-1.5 text-xs capitalize text-slate-600">{member?.role || "—"}</td>
                <td className="min-w-24 p-1"><select aria-label={`Share type ${index + 1}`} className={input} value={row.mode} onChange={e => { setPoolPercent(""); setRows(old => old.map((r, i) => i === index ? { ...r, mode: e.target.value as ShareRow["mode"], value: "" } : r)); }}><option value="percent">%</option><option value="amount">$</option></select></td>
                <td className="min-w-20 p-1"><input required aria-label={`Share value ${index + 1}`} className={input} type="number" min="0.01" max={row.mode === "percent" ? maxTeamSharePercent : undefined} step="0.01" value={row.value} onChange={e => { setPoolPercent(""); setRows(old => old.map((r, i) => i === index ? { ...r, value: e.target.value } : r)); }} placeholder={row.mode === "percent" ? "30" : "100"} /></td>
                <td className="whitespace-nowrap p-1.5 font-semibold text-slate-800">{invoice ? money(earned) : "—"}{invoice && preview[index]?.earnedCents < rawPreview[index]?.earnedCents && earned === preview[index].earnedCents && <span className="block text-[10px] font-normal text-amber-700" title="The worker's daily maximum limits this amount">Daily max: {money(Math.max(0, (cap?.capCents || 0) - (cap?.usedCents || 0)))}<br />Before cap: {money(rawPreview[index].earnedCents)}</span>}</td>
                <td className="whitespace-nowrap p-1.5 text-slate-500">{money(0)}</td>
                <td className="whitespace-nowrap p-1.5 font-semibold text-rose-600">{invoice ? money(earned) : "—"}</td>
                <td className="p-1"><button type="button" aria-label={`Remove share ${index + 1}`} disabled={rows.length === 1} onClick={() => { setPoolPercent(""); setRows(old => old.filter((_, i) => i !== index)); }} className="rounded-md p-1 text-rose-500 hover:bg-rose-50 disabled:opacity-30"><X className="h-4 w-4" /></button></td>
              </tr>;
            })}</tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50">
              <tr><td colSpan={4} className="p-1.5 text-right text-sm font-bold">Total Team Share:</td><td className="p-1.5 font-bold">{money(totalEarned)}</td><td className="p-1.5 font-bold">{money(totalPaid)}</td><td className="p-1.5 font-bold text-rose-600">{money(totalEarned - totalPaid)}</td><td /></tr>
            </tfoot>
          </table>
        </div>
        {invoice && <p className="text-xs text-slate-500">Based on {money(previewBase)} {basis === "ex_gst" ? "excluding GST" : "including GST"} for {invoiceKey ? `invoice ${invoice.number}` : "the job"}. Customer payment status does not change the team share.</p>}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <button className={button} type="button" disabled={rows.length >= 20} onClick={() => { setPoolPercent(""); setRows(old => [...old, emptyRow()]); }}><Plus className="h-3.5 w-3.5" />Add Employee</button>
          <p className={`text-xs font-semibold ${totalRate > maxTeamSharePercent || exceedsBase ? "text-rose-600" : "text-slate-500"}`}>{totalRate > 0 ? `${totalRate.toLocaleString("en-AU", { maximumFractionDigits: 2 })}% total` : ""} · {maxTeamSharePercent}% maximum for the whole team · company keeps at least {100 - maxTeamSharePercent}% {exceedsBase ? "· exceeds team limit" : ""}</p>
        </div>
        {exceedsBase && <ErrorBox error={`Combined team shares cannot exceed ${maxTeamSharePercent}% of the invoice basis.`} />}
        <Field name="Manager notes"><textarea className={input} maxLength={2000} rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Agreed rate, shared work or other context" /></Field>
      </fieldset>
      <div className="flex flex-wrap items-center justify-end gap-1.5 border-t border-slate-100 pt-3">
        {!approved && ledger?.status !== "approved" && <button className={button} disabled={busy || !!poolError || totalRate > maxTeamSharePercent || exceedsBase} type="submit">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save draft shares</button>}
        <button type="button" className={primary} disabled={busy || !job.eligible || !invoice || !!poolError || (approved && !dirty) || !rows.length || rows.some(row => !row.memberId || !Number.isFinite(Number(row.value)) || Number(row.value) <= 0) || totalRate > maxTeamSharePercent || exceedsBase} title={job.unavailableReason} onClick={() => void createDues()}><CheckCircle2 className="h-4 w-4" />{approved ? "Save share changes" : "Add to pending dues"}</button>
      </div>
      {!job.eligible && <p className="text-xs text-amber-700">{job.unavailableReason}</p>}
      {job.eligible && <p className="text-xs text-slate-500">Calculated from the job invoice and the share settings above. Saving updates Team Summary and pending dues; use Pay after money is sent.</p>}
    </form> : <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <h3 className="text-sm font-bold text-slate-900">Team Shares <span className="text-xs font-normal text-slate-500">({invoiceKey ? `Invoice ${invoice?.number || ""}` : "This Job"}) · {ledger!.basis === "ex_gst" ? "ex GST" : "incl GST"}{(invoiceKey ? allocation?.poolBps : ledger?.poolBps) ? ` · Team pool ${((invoiceKey ? allocation?.poolBps : ledger?.poolBps) || 0) / 100}%` : ""}</span></h3>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>{["Employee", "Role", "Share Type", "Share", "Amount", "Paid", "Remaining", ""].map(t => <th key={t} className="p-1.5 font-semibold">{t}</th>)}</tr>
          </thead>
          <tbody>{selectedShares!.map(s => {
            const member = members.find(m => m.id === s.memberId);
            const remaining = s.earnedCents - s.paidCents;
            return <tr key={s.memberId} className="border-t border-slate-100">
              <td className="p-1.5 font-semibold text-slate-800">{s.name}</td>
              <td className="p-1.5 text-xs capitalize text-slate-600">{member?.role || "—"}</td>
              <td className="p-1.5 text-slate-600">{s.fixedAmountCents !== undefined ? "$ Fixed" : "%"}</td>
              <td className="p-1.5 text-slate-700">{s.fixedAmountCents !== undefined ? money(s.fixedAmountCents) : `${s.rateBps / 100}%`}</td>
              <td className="whitespace-nowrap p-1.5 font-semibold">{money(s.earnedCents)}</td>
              <td className="whitespace-nowrap p-1.5 text-emerald-700">{money(s.paidCents)}</td>
              <td className={`whitespace-nowrap p-1.5 font-semibold ${remaining > 0 ? "text-rose-600" : "text-emerald-600"}`}>{money(remaining)}</td>
              <td className="p-1">
                {remaining > 0 ? <button type="button" className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50" disabled={busy || job.changed} onClick={() => { setPaymentMember(s.memberId); setPaymentAmount(String(remaining / 100)); setPaymentDate(today()); }}>Pay</button>
                  : <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Paid</span>}
              </td>
            </tr>;
          })}</tbody>
          <tfoot className="border-t-2 border-slate-200 bg-slate-50">
            <tr><td colSpan={4} className="p-1.5 text-right text-sm font-bold">Total Team Share:</td><td className="p-1.5 font-bold">{money(totalEarned)}</td><td className="p-1.5 font-bold text-emerald-700">{money(totalPaid)}</td><td className="p-1.5 font-bold text-rose-600">{money(totalEarned - totalPaid)}</td><td /></tr>
          </tfoot>
        </table>
      </div>
      {ledger.notes && <p className="whitespace-pre-wrap text-xs text-slate-500">{ledger.notes}</p>}
    </div>}
    {/* Manager balance + Job Expenses side by side, Record Payment below */}
    <div className="grid gap-2 md:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-amber-50/40 p-2">
        <h4 className="text-sm font-bold text-slate-800">Manager (Groutix)</h4>
        <dl className="mt-1.5 space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-slate-600">Amount Received:</dt><dd className="font-semibold">{money(jobReceived)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-600">Less: Team Share:</dt><dd className="font-semibold text-rose-600">- {money(totalEarned)}</dd></div>
          <div className="flex justify-between border-t border-amber-200 pt-1.5"><dt className="font-bold text-slate-800">Manager Balance:</dt><dd className="font-bold text-slate-900">{money(managerBalance)}</dd></div>
        </dl>
      </div>
      <JobExpensesInline job={job} onChanged={onExpenseChanged} />
    </div>
    {approved ? <form onSubmit={recordPayment} className="rounded-lg border border-blue-200 bg-blue-50/50 p-2">
      <h4 className="flex items-center gap-1.5 text-sm font-bold text-slate-800"><Wallet className="h-4 w-4 text-blue-600" />Record Payment</h4>
      <p className="mb-1 text-xs text-slate-500">Log money already paid to a team member. Select a row&apos;s <b>Pay</b> button to prefill the amount, or enter it manually.</p>
      <fieldset disabled={busy} className="grid gap-1.5 sm:grid-cols-4">
        <label className="text-xs font-semibold text-slate-600">Employee<select className={input} required value={paymentMember} onChange={e => { setPaymentMember(e.target.value); const s = selectedShares?.find(x => x.memberId === e.target.value); if (s) setPaymentAmount(String((s.earnedCents - s.paidCents) / 100)); }}><option value="">Select</option>{selectedShares?.filter(s => s.earnedCents > s.paidCents).map(s => <option key={s.memberId} value={s.memberId}>{s.name} · {money(s.earnedCents - s.paidCents)} due</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">Amount ($)<input className={input} type="number" required min="0.01" max={paymentShare ? (paymentShare.earnedCents - paymentShare.paidCents) / 100 : undefined} step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} /></label>
        <label className="text-xs font-semibold text-slate-600">Date<input className={input} type="date" required max={today()} value={paymentDate} onChange={e => setPaymentDate(e.target.value)} /></label>
        <label className="text-xs font-semibold text-slate-600">Method<select className={input} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option>Bank transfer</option><option>Cash</option><option>Other</option></select></label>
        <label className="sm:col-span-4 text-xs font-semibold text-slate-600">Note (optional)<input className={input} maxLength={500} value={paymentNote} onChange={e => setPaymentNote(e.target.value)} placeholder="e.g. Partial payment" /></label>
      </fieldset>
      <div className="mt-1.5 flex justify-end"><button type="submit" className={primary} disabled={busy || !paymentMember || !paymentAmount}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Mark as Paid</button></div>
    </form> : <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2 text-center text-xs text-slate-500">Approve earnings first to record worker payments.</div>}
    {mode === "reopen" && <form onSubmit={e => { e.preventDefault(); void mutate({ action: "reopen", reason: new FormData(e.currentTarget).get("reason") }); }} className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5"><h3 className="font-bold">Reopen for correction</h3><p className="text-sm text-slate-600">The previous approval remains in audit history. Save and approve the revised shares afterwards.</p><Field name="Reason *"><textarea className={input} name="reason" required maxLength={500} disabled={busy} /></Field><div className="flex gap-1.5"><button className={primary} disabled={busy}>Reopen</button><button type="button" className={button} disabled={busy} onClick={() => setMode(null)}>Cancel</button></div></form>}
    <details className="space-y-2 border-t border-slate-100 pt-2"><summary className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-600"><History className="h-3.5 w-3.5" />Payments & audit log</summary><ErrorBox error={historyError} />{historyError && <button className={button} onClick={() => setHistoryRetry(v => v + 1)}>Retry history</button>}{!history && !historyError && <p role="status" className="text-sm text-slate-500">Loading history…</p>}
      {history && <><div className="space-y-1.5">{history.payments.map(p => <div key={p.id} className="rounded-lg border border-slate-200 p-2"><div className="flex flex-wrap items-start justify-between gap-1.5"><div><p className="text-sm font-semibold">{p.memberName} · {money(p.amountCents)}{p.invoiceNumber && ` · ${p.invoiceNumber}`}{p.voidedAt && <span className="ml-2 text-xs text-rose-600">Reversed</span>}</p><p className="text-xs text-slate-500">{p.date} · {p.method} · Recorded by {p.actor}</p>{p.note && <p className="mt-1 break-words text-xs text-slate-500">{p.note}</p>}{p.voidedAt && <p className="mt-1 break-words text-xs text-rose-600">{p.voidedBy}: {p.voidReason}</p>}</div>{!p.voidedAt && <button className={button} disabled={busy} onClick={() => setVoidId(p.id)}>Reverse</button>}</div>{voidId === p.id && <form className="mt-2 space-y-1.5" onSubmit={e => { e.preventDefault(); void mutate({ action: "void_payment", paymentId: p.id, reason: new FormData(e.currentTarget).get("reason") }); }}><p className="text-xs text-amber-700">Correct the ledger only after confirming this payment was entered incorrectly or returned. This does not recover transferred money.</p><Field name="Reversal reason *"><input className={input} name="reason" required maxLength={500} disabled={busy} /></Field><div className="flex gap-1.5"><button className={button} disabled={busy}>Confirm reversal</button><button className={button} type="button" disabled={busy} onClick={() => setVoidId(null)}>Cancel</button></div></form>}</div>)}{!history.payments.length && <p className="text-xs text-slate-500">No team payments recorded.</p>}</div>
      <ol className="divide-y divide-slate-100">{history.events.map(event => <li key={event.id} className="py-1.5"><p className="text-xs font-semibold text-slate-500">{new Date(event.createdAt).toLocaleString("en-AU")} · {event.actor} · {event.action.replaceAll("_", " ")}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">{event.detail}</p></li>)}</ol>{!history.events.length && <p className="text-xs text-slate-500">No earnings changes yet.</p>}<div className="flex items-center justify-between"><button className={button} disabled={historyPage === 1} onClick={() => setHistoryPage(p => p - 1)}>Previous</button><span className="text-xs text-slate-500">Audit page {historyPage}</span><button className={button} disabled={!history.hasMore} onClick={() => setHistoryPage(p => p + 1)}>Next</button></div></>}
    </details>
  </section>;
}


const panel = "min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs";
function Badge({ children, warning = false }: { children: ReactNode; warning?: boolean }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${warning ? "bg-amber-100 text-amber-800" : "bg-blue-50 text-blue-800"}`}>{children}</span>;
}

type EmployeeSettingForm = { memberId: string; mode: "percent" | "amount"; value: string; dailyMaximum: string };
function EarningsSettingsDialog({ members, current, onClose, onSaved, onManageTeam }: {
  members: EarningsMember[]; current?: TeamEarningsSettings; onClose: () => void; onSaved: (settings: TeamEarningsSettings) => void; onManageTeam: () => void;
}) {
  const savedSettings = current || defaultTeamEarningsSettings;
  const [basis, setBasis] = useState<EarningsBasis>(savedSettings.basis);
  const [gstRate, setGstRate] = useState(String(savedSettings.gstRateBps / 100));
  const [maxTeamShare, setMaxTeamShare] = useState(String(savedSettings.maxTeamShareBps / 100));
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
          basis, gstRateBps: Math.round(Number(gstRate) * 100), maxTeamShareBps: Math.round(Number(maxTeamShare) * 100),
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
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-2 sm:p-3" role="presentation">
    <section role="dialog" aria-modal="true" aria-labelledby="earnings-settings-title" className="my-auto max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2.5"><div><h2 id="earnings-settings-title" className="text-lg font-bold">Team Earnings Settings</h2><p className="text-xs text-slate-500">The payout limit applies when drafts are saved or approved. Approved earnings remain unchanged.</p></div><button className={button} type="button" onClick={onClose}>Close</button></div>
      <form onSubmit={save} className="space-y-3 p-3">
        <ErrorBox error={error} />
        <section className="grid gap-2.5 rounded-xl border border-slate-200 p-2.5 sm:grid-cols-2">
          <div className="sm:col-span-2"><h3 className="font-bold">Invoice GST Setting</h3><p className="mt-1 text-xs text-slate-500">The GST saved on each CRM invoice is used when available. These values set the default basis and fallback GST rate for legacy invoices.</p></div>
          <Field name="Invoice entry mode"><select className={input} value={basis} onChange={e => setBasis(e.target.value as EarningsBasis)}><option value="ex_gst">Excluding GST</option><option value="inclusive">Including GST</option></select></Field>
          <Field name="GST rate (%)"><input className={input} type="number" min="0" max="100" step="0.01" required value={gstRate} onChange={e => setGstRate(e.target.value)} /></Field>
        </section>
        <section className="rounded-xl border border-slate-200 p-2.5"><h3 className="font-bold">Team payout limit</h3><p className="mt-1 text-xs text-slate-500">Maximum combined share for all people on one job. The remainder stays with the company. Existing approved earnings stay unchanged.</p><div className="mt-2 max-w-48"><Field name="Maximum team share (%)"><input className={input} type="number" min="0.01" max="100" step="0.01" required value={maxTeamShare} onChange={e => setMaxTeamShare(e.target.value)} /></Field></div></section>
        <section className="space-y-2 rounded-xl border border-slate-200 p-2.5">
          <div><h3 className="font-bold">Default Share, Daily Maximum & Role</h3><p className="mt-1 text-xs text-slate-500">Defaults prefill new job shares. Daily maximum caps one worker&apos;s combined approved earnings across all jobs on the same completion date. Roles are managed in the CRM team roster.</p></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Employee", "Share type", "Default share / amount", "Daily max (AUD)", "Role"].map(title => <th key={title} className="p-1.5">{title}</th>)}</tr></thead><tbody>{employeeRows.map((row, index) => {
            const member = members.find(item => item.id === row.memberId);
            return <tr key={row.memberId} className="border-b border-slate-100">
              <td className="p-1.5 font-semibold">{member?.name || "Former member"}{member && !member.active && <span className="ml-1 text-xs text-slate-400">Inactive</span>}</td>
              <td className="min-w-36 p-1.5"><select className={input} value={row.mode} onChange={e => setEmployeeRows(old => old.map((item, i) => i === index ? { ...item, mode: e.target.value as EmployeeSettingForm["mode"] } : item))}><option value="percent">Percentage %</option><option value="amount">Fixed $</option></select></td>
              <td className="min-w-40 p-1.5"><input className={input} type="number" min="0" max={row.mode === "percent" ? Number(maxTeamShare) : undefined} step="0.01" aria-label={`${member?.name || "Employee"} default ${row.mode}`} placeholder="No default" value={row.value} onChange={e => setEmployeeRows(old => old.map((item, i) => i === index ? { ...item, value: e.target.value } : item))} /></td>
              <td className="min-w-36 p-1.5"><input className={input} type="number" min="0.01" step="0.01" aria-label={`${member?.name || "Employee"} daily maximum`} placeholder="No maximum" value={row.dailyMaximum} onChange={e => setEmployeeRows(old => old.map((item, i) => i === index ? { ...item, dailyMaximum: e.target.value } : item))} /></td>
              <td className="p-1.5 text-xs capitalize">{member?.role || "former member"}</td>
            </tr>;
          })}{!employeeRows.length && <tr><td colSpan={5} className="p-3 text-center text-sm text-slate-500">No CRM team members found. Add employees in the CRM team page first.</td></tr>}</tbody></table></div>
          <button type="button" className={button} onClick={onManageTeam}><Plus className="h-4 w-4" />Manage CRM employees</button>
        </section>
        <section className="space-y-2 rounded-xl border border-slate-200 p-2.5">
          <div><h3 className="font-bold">Automatic Job Expenses</h3><p className="mt-1 text-xs text-slate-500">Active fixed expenses are added once to each eligible job from the rule&apos;s start date. Changing a rule will not rewrite expenses already recorded.</p></div>
          {rules.map((rule, index) => <div key={rule.id} className="grid gap-1.5 rounded-lg bg-slate-50 p-2 sm:grid-cols-[minmax(180px,1fr)_160px_150px_auto_auto] sm:items-end">
            <Field name="Expense name"><input className={input} required maxLength={100} placeholder="e.g. Fuel" value={rule.name} onChange={e => setRules(old => old.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} /></Field>
            <Field name="Amount (AUD)"><input className={input} type="number" min="0.01" step="0.01" required value={rule.amount} onChange={e => setRules(old => old.map((item, i) => i === index ? { ...item, amount: e.target.value } : item))} /></Field>
            <Field name="Start date"><input className={input} type="date" required value={rule.activeFrom} onChange={e => setRules(old => old.map((item, i) => i === index ? { ...item, activeFrom: e.target.value } : item))} /></Field>
            <label className="flex items-center gap-1.5 pb-2 text-xs font-semibold"><input type="checkbox" checked={rule.active} onChange={e => setRules(old => old.map((item, i) => i === index ? { ...item, active: e.target.checked } : item))} />Active</label>
            <button type="button" className={button} aria-label={`Remove ${rule.name || "expense"} rule`} onClick={() => setRules(old => old.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></button>
          </div>)}
          <button type="button" className={button} onClick={addRule}><Plus className="h-4 w-4" />Add automatic expense rule</button>
        </section>
        <div className="flex justify-end gap-1.5"><button type="button" className={button} onClick={onClose} disabled={busy}>Cancel</button><button type="submit" className={primary} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save settings</button></div>
      </form>
    </section>
  </div>;
}

function JobExpensesInline({ job, onChanged }: { job: EarningsJob; onChanged: () => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const activeExpenses = (job.expenses || []).filter(expense => !expense.voidedAt);
  const totalExpenses = activeExpenses.reduce((sum, expense) => sum + expense.amountCents, 0);
  async function mutate(payload: Record<string, unknown>) {
    setBusy(true); setError("");
    try {
      await api(`/api/admin/team-earnings/${job.id}/expenses`, { method: "POST", body: JSON.stringify({ ...payload, version: job.expenseVersion || 0, requestId: crypto.randomUUID() }) });
      setName(""); setAmount(""); onChanged();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <div className="rounded-lg border border-slate-200 bg-white p-2">
    <div className="flex items-center justify-between gap-2"><h4 className="text-sm font-bold text-slate-800">Job Expenses</h4><span className="text-sm font-semibold">{money(totalExpenses)}</span></div>
    <div className="mt-1.5 divide-y divide-slate-100">{activeExpenses.map(expense => <div key={expense.id} className="flex items-center justify-between gap-1.5 py-1 text-sm"><span>{expense.name}<span className="ml-2 text-xs text-slate-400">{expense.source === "automatic" ? "Auto" : "Manual"} · {expense.date}</span></span><span className="flex items-center gap-1.5 font-semibold">{money(expense.amountCents)}<button className="rounded-md p-1 text-rose-500 hover:bg-rose-50 disabled:opacity-30" type="button" disabled={busy} aria-label={`Remove expense ${expense.name}`} onClick={() => void mutate({ action: "remove", expenseId: expense.id })}><Trash2 className="h-3.5 w-3.5" /></button></span></div>)}
      {!activeExpenses.length && <p className="py-1 text-xs text-slate-500">No job expenses recorded.</p>}
    </div>
    <ErrorBox error={error} />
    <form className="mt-1.5 grid gap-1.5 sm:grid-cols-[1fr_90px_130px_auto]" onSubmit={event => { event.preventDefault(); void mutate({ action: "add", name, amountCents: Math.round(Number(amount) * 100), date }); }}>
      <input className={input} aria-label="Expense name" required maxLength={100} placeholder="e.g. Materials" value={name} onChange={e => setName(e.target.value)} />
      <input className={input} aria-label="Expense amount" required type="number" min="0.01" step="0.01" placeholder="AUD" value={amount} onChange={e => setAmount(e.target.value)} />
      <input className={input} aria-label="Expense date" required type="date" max={today()} value={date} onChange={e => setDate(e.target.value)} />
      <button className={button} type="submit" disabled={busy}><Plus className="h-3.5 w-3.5" />Add</button>
    </form>
  </div>;
}

export function TeamEarningsView({ query, onQueryChange, onOpenJob, onManageInvoices, onAddJob, onManageTeam, refreshKey }: {
  query: string; onQueryChange: (value: string) => void; onOpenJob: (id: string) => void;
  onManageInvoices: (id: string) => void;
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
  const [, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<{ id: string; memberId?: string } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState<"jobs" | "employees" | "payments">("jobs");
  const [period, setPeriod] = useState<"month" | "last" | "custom" | "all">("month");
  const initialMonth = monthRange(0);
  const [fromDate, setFromDate] = useState(initialMonth.from);
  const [toDate, setToDate] = useState(initialMonth.to);
  const [activeJobId, setActiveJobId] = useState("");
  const [activeInvoiceKey, setActiveInvoiceKey] = useState("");
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
  const activeItems = activeJob?.invoice?.items || (activeJob?.invoice ? [{ ...activeJob.invoice, key: "primary" }] : []);
  const legacyApproval = activeJob?.ledger?.status === "approved" && !activeJob.ledger.invoiceShares?.length;
  const selectedInvoiceKey = legacyApproval && !activeInvoiceKey ? undefined : activeItems.some(item => item.key === activeInvoiceKey) ? activeInvoiceKey : activeItems[0]?.key;
  const expenseTotal = filtered.reduce((sum, job) => sum + (job.expenses || []).filter(expense => !expense.voidedAt).reduce((value, expense) => value + expense.amountCents, 0), 0);
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
    setActiveJobId(id); setActiveInvoiceKey(""); setEditorOpen(true); setSelected(null);
  }
  function edit(job: EarningsJob, member?: string) {
    setExpanded(old => new Set(old).add(job.id)); setActiveJobId(job.id); setActiveInvoiceKey(""); setEditorOpen(true); setSelected({ id: job.id, memberId: member });
  }
  const dateFilteredPayments = (data.payments || []).filter(payment => period === "all" || (period === "month" ? payment.date >= initialMonth.from && payment.date <= initialMonth.to : period === "last" ? payment.date >= monthRange(-1).from && payment.date <= monthRange(-1).to : payment.date >= fromDate && payment.date <= toDate));
  const cards = [
    ["Total Jobs", String(filtered.length)], ["Job Value", money(totals.value)], ["Received", money(totals.received)],
    ["Team Earnings", money(totals.earned)], ["Paid to Team", money(totals.paid)], ["Team Outstanding", money(totals.earned - totals.paid)], ["Manager Balance", money(managerFinal)],
  ];
  const cardIcons: Record<string, ReactNode> = {
    "Total Jobs": <BriefcaseBusiness className="h-4 w-4 text-emerald-600" />,
    "Job Value": <Layers3 className="h-4 w-4 text-blue-600" />,
    Received: <CircleDollarSign className="h-4 w-4 text-emerald-600" />,
    "Team Earnings": <Users className="h-4 w-4 text-amber-600" />,
    "Paid to Team": <Wallet className="h-4 w-4 text-violet-600" />,
    "Team Outstanding": <Clock3 className="h-4 w-4 text-rose-600" />,
    "Manager Balance": <TrendingUp className="h-4 w-4 text-blue-600" />,
  };
  return <div className="space-y-1.5">
    <div className="flex flex-wrap items-center justify-between gap-1.5"><h2 className="flex items-center gap-1.5 text-base font-bold text-slate-900"><Users className="h-4 w-4 text-blue-600" />Job & Team Payment Management</h2><div className="flex flex-wrap items-center gap-1.5">
      <select className={`${input} w-auto`} aria-label="Earnings date preset" value={period} onChange={e => setPeriod(e.target.value as typeof period)}><option value="month">This Month</option><option value="last">Last Month</option><option value="custom">Custom range</option><option value="all">All Time</option></select>
      {period === "custom" && <><input className={`${input} w-auto`} aria-label="Earnings start date" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} /><input className={`${input} w-auto`} aria-label="Earnings end date" type="date" value={toDate} onChange={e => setToDate(e.target.value)} /></>}
      <button className={button} onClick={() => setSettingsOpen(true)}><Settings className="h-4 w-4" />Settings</button><button className={button} disabled={loading || !!error || !filtered.length} onClick={() => exportCsv()}><Download className="h-4 w-4" />Export</button><button className={primary} onClick={onAddJob}><Plus className="h-4 w-4" />Add Job</button>
    </div></div>
    <ErrorBox error={error} />{notice && <p role="status" className="rounded-xl bg-emerald-50 p-2 text-sm text-emerald-800">{notice}</p>}
    <div className="grid grid-cols-2 gap-1 sm:grid-cols-4 xl:grid-cols-7">{cards.map(([title, value]) => <div key={title} className={`${panel} flex min-w-0 items-center gap-1 px-2 py-1`}><span className="rounded bg-slate-50 p-1">{cardIcons[title]}</span><div className="min-w-0"><p className="text-[10px] font-semibold leading-tight text-slate-500">{title}</p><p className="break-words text-sm font-bold leading-tight text-slate-900">{loading || error ? "—" : value}</p></div></div>)}</div>
    <div className="flex gap-1 overflow-x-auto whitespace-nowrap pb-0.5" aria-label="Job status filters">{registerFilters.map(value => <button key={value} aria-pressed={filter === value} className={`${filter === value ? primary : button} shrink-0`} onClick={() => { setFilter(value); setPage(1); }}>{value} ({loading || error ? "—" : searched.filter(job => matchesRegisterFilter(job, value)).length})</button>)}</div>
    <div className="flex flex-wrap items-center gap-1.5"><div className="relative min-w-48 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input className={`${input} pl-9`} aria-label="Search team earnings" placeholder="Search job, customer or employee..." value={query} onChange={e => { onQueryChange(e.target.value); setPage(1); }} /></div><select className={`${input} sm:w-auto`} aria-label="Filter team member" value={memberId} onChange={e => { setMemberId(e.target.value); setPage(1); }}><option value="">All team members</option>{data.members.map(member => <option key={member.id} value={member.id}>{member.name}{member.active ? "" : " (inactive)"}</option>)}</select><select className={`${input} sm:w-auto`} aria-label="Filter earnings status" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All earnings statuses</option>{["Not configured", "Draft", "Approved", "Settled", "Needs review"].map(value => <option key={value}>{value}</option>)}</select></div>
    <div role="tablist" aria-label="Team earnings sections" className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2">{([["jobs", "Jobs Register"], ["employees", "Employee Summary"], ["payments", "Payments History"]] as const).map(([id, title]) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={tab === id ? primary : button}>{title}</button>)}</div>
    {loading ? <div role="status" className={`${panel} flex items-center justify-center gap-1.5 p-6 text-sm text-slate-500`}><Loader2 className="h-5 w-5 animate-spin" />Loading team earnings...</div> : error ? <div className={`${panel} p-4 text-center`}><button className={button} onClick={() => void load()}>Retry</button></div> : <div className="grid items-start gap-1.5 lg:grid-cols-[minmax(145px,0.8fr)_minmax(340px,2fr)_minmax(190px,1fr)]">
      <section className={`${panel} ${tab !== "jobs" ? "lg:col-span-2" : ""}`}>
        {tab === "jobs" && <><div className="flex items-center justify-between border-b border-slate-200 px-2 py-1.5"><h3 className="text-sm font-bold">Jobs ({filtered.length})</h3><span className="text-xs text-slate-500">This period</span></div><div className="max-h-[calc(100vh-230px)] min-h-48 divide-y divide-slate-100 overflow-y-auto">{filtered.map(job => {
          const jobTotal = registerTotals([job]); const active = (activeJob?.id || "") === job.id; const earnings = job.ledger?.status === "approved" ? jobTotal.earned : jobTotal.estimated;
          return <button type="button" key={job.id} aria-expanded={activeJobId === job.id} className={`flex w-full items-start justify-between gap-1.5 px-2 py-1.5 text-left text-xs ${active ? "bg-blue-50" : "hover:bg-slate-50"}`} onClick={() => toggleJob(job.id)}>
            <span className="min-w-0"><span className="block truncate font-bold text-slate-800">{job.jobLabel}</span><span className="block truncate text-xs text-slate-500">{job.customer}</span><span className="mt-1 inline-block"><Badge warning={["Pending", "Needs review"].includes(label(job))}>{job.status}</Badge></span></span><span className="shrink-0 text-right"><span className="block font-semibold">{money(earnings || job.invoice?.totalCents || 0)}</span><span className="text-[11px] text-slate-500">{job.completionDate || job.scheduledAt?.slice(0, 10) || "No date"}</span></span>
          </button>;
        })}{!filtered.length && <p className="p-3 text-center text-sm text-slate-500">No jobs match this period and filter.</p>}</div></>}
        {tab === "employees" && <><div className="flex items-center justify-between border-b border-slate-200 p-2.5"><h3 className="font-bold">Employee Summary</h3><button className={button} onClick={() => exportCsv(true)}>Export CSV</button></div><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Employee", "Role", "Draft", "Earned", "Paid", "Remaining", "Action"].map(title => <th key={title} className="p-2">{title}</th>)}</tr></thead><tbody>{memberRows.map(member => <tr key={member.id} className="border-t border-slate-100"><td className="p-2 font-semibold">{member.name}</td><td className="p-2 capitalize">{member.role}</td><td className="p-2">{money(member.estimated)}</td><td className="p-2">{money(member.earned)}</td><td className="p-2 text-emerald-700">{money(member.paid)}</td><td className="p-2 font-semibold text-rose-700">{money(member.earned - member.paid)}</td><td className="p-2"><button className={button} onClick={() => { setMemberId(member.id); setTab("jobs"); const first = filtered.find(job => related(job, member.id)); if (first) edit(first, member.id); }}>View jobs</button></td></tr>)}</tbody><tfoot className="border-t bg-blue-50 font-bold"><tr><td colSpan={2} className="p-2">Total</td><td className="p-2">{money(memberRows.reduce((sum, row) => sum + row.estimated, 0))}</td><td className="p-2">{money(memberRows.reduce((sum, row) => sum + row.earned, 0))}</td><td className="p-2">{money(memberRows.reduce((sum, row) => sum + row.paid, 0))}</td><td className="p-2">{money(memberRows.reduce((sum, row) => sum + row.earned - row.paid, 0))}</td><td /></tr></tfoot></table></div></>}
        {tab === "payments" && <><div className="border-b border-slate-200 p-2.5"><h3 className="font-bold">Payments History</h3></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Date", "Employee", "Job / invoice", "Amount", "Method", "Reference", "Status"].map(title => <th key={title} className="p-2">{title}</th>)}</tr></thead><tbody>{dateFilteredPayments.map(payment => <tr key={payment.id} className="border-t border-slate-100"><td className="p-2">{payment.date}</td><td className="p-2 font-semibold">{payment.memberName}</td><td className="p-2">{payment.jobLabel}{payment.invoiceNumber && ` · ${payment.invoiceNumber}`}</td><td className="p-2">{money(payment.amountCents)}</td><td className="p-2">{payment.method}</td><td className="p-2">{payment.reference}</td><td className="p-2">{payment.voidedAt ? "Reversed" : "Recorded"}</td></tr>)}</tbody></table>{!dateFilteredPayments.length && <p className="p-4 text-center text-sm text-slate-500">No team payments in this period.</p>}</div></>}
      </section>
      {tab === "jobs" && activeJob ? <section className={`${panel} space-y-1.5 p-2`}>
        <div className="flex flex-wrap items-center justify-between gap-1.5"><div><h3 className="text-base font-bold">Job # {activeJob.jobLabel}</h3><p className="text-xs text-slate-500">{activeJob.customer} · {activeJob.completionDate || activeJob.scheduledAt?.slice(0, 10) || "No date"} · {activeJob.service}</p></div><div className="flex gap-1.5"><Badge warning={activeJob.changed}>{label(activeJob)}</Badge>{activeJob.status !== "Source unavailable" && <button className={button} onClick={() => onOpenJob(activeJob.id)}>Edit Job</button>}</div></div>
        <div className="grid gap-2 md:grid-cols-2"><section className="rounded-xl border border-slate-200 p-2 text-sm"><h4 className="mb-1 font-bold">Job Details</h4><p className="flex justify-between gap-1.5"><span className="text-slate-500">Customer</span><b>{activeJob.customer}</b></p><p className="mt-1 flex justify-between gap-1.5"><span className="text-slate-500">Job date</span><b>{activeJob.completionDate || activeJob.scheduledAt?.slice(0, 10) || "—"}</b></p><p className="mt-1 flex justify-between gap-1.5"><span className="text-slate-500">Job value</span><b>{money(activeJob.invoice?.totalCents || 0)}</b></p><p className="mt-1 flex justify-between gap-1.5"><span className="text-slate-500">Invoices</span><b>{activeJob.invoice?.items?.length || (activeJob.invoice ? 1 : 0)}</b></p></section><section className="rounded-xl border border-slate-200 p-2 text-sm"><h4 className="mb-1 font-bold">Customer Payment</h4><p className="flex justify-between gap-1.5"><span className="text-slate-500">Received</span><b className="text-emerald-700">{money(registerTotals([activeJob]).received)}</b></p><p className="mt-1 flex justify-between gap-1.5"><span className="text-slate-500">Overall status</span><Badge warning={["partial", "pending"].includes(activeJob.paymentStatus)}>{paymentStatusLabel(activeJob.paymentStatus)}</Badge></p><p className="mt-1 flex justify-between gap-1.5"><span className="text-slate-500">Customer outstanding</span><b>{money((activeJob.invoice?.totalCents || 0) - registerTotals([activeJob]).received)}</b></p><button className={`${button} mt-1.5`} onClick={() => onManageInvoices(activeJob.id)}>Manage customer invoices</button></section></div>
        {!!activeItems.length && <section aria-label="Select invoice team shares" className="space-y-1.5"><h4 className="text-sm font-bold">Invoices · select one to set team shares</h4><div className="grid gap-1.5 sm:grid-cols-2">{activeItems.map((item, index) => {
          const receipt = activeJob.receipts?.[index];
          const allocation = activeJob.ledger?.invoiceShares?.find(entry => entry.invoiceKey === item.key);
          return <button key={item.key || index} type="button" aria-pressed={selectedInvoiceKey === item.key} onClick={() => { setActiveInvoiceKey(item.key || "primary"); setEditorOpen(true); }} className={`rounded-lg border p-2 text-left text-xs ${selectedInvoiceKey === item.key ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}><span className="flex justify-between gap-1.5"><b>{item.number}</b><span>{receipt ? invoicePaymentStatusLabel(receipt.status) : "Saved"}</span></span><span className="mt-1 block">Invoice total: {money(item.totalCents)} · Team share: {allocation ? money(allocation.shares.reduce((sum, share) => sum + share.earnedCents, 0)) : "Not set"}</span></button>;
        })}</div>{legacyApproval && <p className="text-xs text-amber-700">The existing approval covers the whole job. Selecting an invoice and saving shares replaces that approval. Reverse any recorded team payments first.</p>}</section>}
        {editorOpen ? <EarningsDetail key={`${activeJob.id}:${selectedInvoiceKey || "legacy"}:${activeJob.ledger?.version || 0}:${selected?.id === activeJob.id ? selected.memberId || "details" : "details"}`} job={activeJob} invoiceKey={selectedInvoiceKey} initialMember={selected?.id === activeJob.id ? selected.memberId : undefined} members={data.members} settings={data.settings} onClose={() => { setEditorOpen(false); setSelected(null); }} onChanged={saved} onExpenseChanged={() => { setNotice("Expense saved to the job record."); void load(); }} />
          : <button className={primary} onClick={() => setEditorOpen(true)}>Manage team shares and payments</button>}
        <details className="rounded-xl border border-slate-200 bg-white p-2"><summary className="cursor-pointer text-sm font-semibold">Assigned work & visit progress</summary><div className="mt-2"><WorkBreakdown job={activeJob} /></div></details>
      </section> : tab === "jobs" ? <section className={`${panel} p-4 text-center text-sm text-slate-500`}>Select a job to see earnings and payment details.</section> : null}
      <aside className="space-y-2.5">
        <section className={`${panel} p-2.5`}><ManagerSummary totals={totals} expenseTotal={expenseTotal} managerGross={managerGross} managerFinal={managerFinal} /></section>
        <section className={panel}><div className="p-2.5"><h3 className="font-bold">Team Summary · This Period</h3></div><div className="overflow-x-auto"><table className="w-full min-w-[340px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-1.5">Employee</th><th className="p-1.5">Earned</th><th className="p-1.5">Paid</th><th className="p-1.5">Remaining</th></tr></thead><tbody>{memberRows.map(row => <tr key={row.id} className="border-t border-slate-100"><td className="p-1.5 font-semibold">{row.name}</td><td className="p-1.5">{money(row.earned)}</td><td className="p-1.5">{money(row.paid)}</td><td className="p-1.5 font-semibold text-rose-700">{money(row.earned - row.paid)}</td></tr>)}<tr className="border-t bg-blue-50 font-bold"><td className="p-1.5">Total</td><td className="p-1.5">{money(totals.earned)}</td><td className="p-1.5">{money(totals.paid)}</td><td className="p-1.5">{money(totals.earned - totals.paid)}</td></tr></tbody></table></div></section>
      </aside>
    </div>}
    <p className="text-xs text-slate-500">Payments record money already paid to workers; they do not transfer funds. Customer receipts remain separate. Currency displays cents, and ledger calculations use integer cents.</p>
    {settingsOpen && <EarningsSettingsDialog members={data.members} current={data.settings} onClose={() => setSettingsOpen(false)} onManageTeam={onManageTeam} onSaved={settings => { setData(current => ({ ...current, settings })); setSettingsOpen(false); setNotice("Team earnings settings saved."); void load(); }} />}
  </div>;
}

function ManagerSummary({ totals, expenseTotal, managerGross, managerFinal }: {
  totals: ReturnType<typeof registerTotals>; expenseTotal: number; managerGross: number; managerFinal: number;
}) {
  return <><h3 className="text-sm font-bold">Manager Summary · Groutix</h3><dl className="mt-1.5 space-y-1 text-xs">
    {[["Job value", totals.value], ["Team earnings", -totals.earned], ["Manager gross balance", managerGross], ["Total expenses", -expenseTotal], ["Manager final balance", managerFinal], ["Customer received", totals.received], ["Team still outstanding", totals.earned - totals.paid]].map(([title, value]) => <div key={title} className="flex justify-between gap-2"><dt>{title}</dt><dd className={`font-bold ${title === "Manager final balance" ? "text-emerald-700" : ""}`}>{money(value as number)}</dd></div>)}
  </dl><p className="mt-2 text-xs text-slate-500">Manager balance is invoice value less approved team earnings and recorded job expenses. It is not net profit; other business expenses are not included.</p></>;
}

function monthRange(offset: number) {
  const current = new Date(`${today()}T00:00:00Z`);
  current.setUTCDate(1);
  current.setUTCMonth(current.getUTCMonth() + offset);
  const year = current.getUTCFullYear(), month = current.getUTCMonth();
  const pad = (value: number) => String(value).padStart(2, "0");
  return { from: `${year}-${pad(month + 1)}-01`, to: `${year}-${pad(month + 1)}-${pad(new Date(Date.UTC(year, month + 1, 0)).getUTCDate())}` };
}

function paymentStatusLabel(status?: string) {
  return status === "paid" ? "Paid" : status === "partial" ? "Partially paid" : status === "pending" ? "Payment pending" : status === "unsent" ? "Not sent" : "No invoice";
}

function invoicePaymentStatusLabel(status?: string) {
  return status === "paid" ? "Paid" : status === "partial" ? "Partially paid" : status === "pending" ? "Payment pending" : "Not sent";
}
