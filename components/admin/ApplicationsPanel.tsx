"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { APPLICATION_STATUSES, CAREER_ROLES, type CareerApplication, type ApplicationStatus } from "@/lib/careers";

const control = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
const date = (value: string) => new Date(value).toLocaleString("en-AU", { timeZone: "Australia/Melbourne", dateStyle: "medium", timeStyle: "short" });
export default function ApplicationsPanel() {
  const details = useRef<HTMLElement>(null);
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [selected, setSelected] = useState<CareerApplication | null>(null);
  const [status, setStatus] = useState<ApplicationStatus>("new");
  const [notes, setNotes] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = useCallback(async (signal?: AbortSignal) => {
    await Promise.resolve();
    if (signal?.aborted) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/admin/applications?${new URLSearchParams({ role: roleFilter, status: statusFilter, search: query, page: String(page) })}`, { signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load applications.");
      if (signal?.aborted) return;
      setApplications(data.applications); setTotal(data.total);
      setCounts(Object.fromEntries(data.counts.map((row: { _id: string; count: number }) => [row._id, row.count])));
    } catch (err) { if (!signal?.aborted) setError(err instanceof Error ? err.message : "Could not load applications."); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [roleFilter, statusFilter, query, page]);
  useEffect(() => { const controller = new AbortController(); void Promise.resolve().then(() => load(controller.signal)); return () => controller.abort(); }, [load]);
  const selectedId = selected?.id;
  useEffect(() => { if (selectedId) details.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [selectedId]);
  const dirty = selected && (status !== selected.status || notes !== selected.notes);
  function open(application: CareerApplication | null) {
    if (dirty && !window.confirm("Discard your unsaved status or notes changes?")) return;
    setSelected(application); setStatus(application?.status || "new"); setNotes(application?.notes || ""); setMessage("");
  }
  async function save() {
    if (!selected) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/admin/applications/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, notes }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save changes.");
      const updated = { ...selected, status, notes: notes.trim(), ...data };
      setSelected(updated); setNotes(updated.notes); setMessage("Changes saved."); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save changes."); }
    finally { setSaving(false); }
  }
  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">Career applications</h1><p className="mt-1 text-sm text-slate-500">Review inspector and technician applicants. Times shown in Melbourne time.</p></div><Link href="/careers" target="_blank" className={control}>View careers page ↗</Link></div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{["new", "reviewing", "shortlisted", "interview"].map(item => <button key={item} onClick={() => { setStatusFilter(item); setPage(1); }} className="rounded-xl border border-slate-200 bg-white p-4 text-left"><span className="text-2xl font-bold">{counts[item] || 0}</span><span className="mt-1 block text-xs capitalize text-slate-500">{item}</span></button>)}</div>
    <form onSubmit={event => { event.preventDefault(); setQuery(search); setPage(1); }} className="flex flex-wrap gap-2">
      <input aria-label="Search applicants" className={`${control} min-w-0 flex-1`} placeholder="Search name, email, phone or suburb" maxLength={120} value={search} onChange={e => setSearch(e.target.value)} />
      <select aria-label="Filter by role" className={control} value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}><option value="">All roles</option>{Object.entries(CAREER_ROLES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <select aria-label="Filter by status" className={control} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}><option value="">All statuses</option>{APPLICATION_STATUSES.map(value => <option key={value}>{value}</option>)}</select>
      <button className={control}>Search</button><button type="button" disabled={loading} onClick={() => void load()} className={control}>Refresh</button>
    </form>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Applicant", "Role", "Location", "Experience", "Status", "Received"].map(label => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>
      {loading ? <tr><td colSpan={6} className="p-8 text-center">Loading applications…</td></tr> : applications.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-slate-500">{query || statusFilter || roleFilter ? "No applications match these filters." : "No applications yet. New submissions will appear here."}</td></tr> : applications.map(application => <tr key={application.id} className="border-t border-slate-100"><td className="px-4 py-3"><button disabled={saving} onClick={() => open(application)} className="text-left font-semibold text-blue-700 underline">{application.fullName}</button><p className="mt-1 text-xs text-slate-500">{application.email}</p></td><td className="px-4 py-3">{CAREER_ROLES[application.role]}</td><td className="px-4 py-3">{application.suburb} {application.postcode}</td><td className="px-4 py-3">{application.experience}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs capitalize ${application.status === "new" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"}`}>{application.status}</span></td><td className="px-4 py-3 text-xs">{date(application.createdAt)}</td></tr>)}
    </tbody></table></div>
    <div className="flex items-center justify-between text-sm"><p>{total} application{total === 1 ? "" : "s"} · Page {page} of {Math.max(1, Math.ceil(total / 25))}</p><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)} className={`${control} disabled:opacity-40`}>Previous</button><button disabled={page * 25 >= total || loading} onClick={() => setPage(p => p + 1)} className={`${control} disabled:opacity-40`}>Next</button></div></div>
    {selected && <section ref={details} aria-label="Application details" className="rounded-2xl border border-blue-200 bg-white p-5 sm:p-7">
      <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{selected.fullName}</h2><p className="mt-1 text-sm text-slate-500">{CAREER_ROLES[selected.role]} · Applied {date(selected.createdAt)}</p></div><button disabled={saving} onClick={() => open(null)} className={control}>Close</button></div>
      <div className="my-5 flex flex-wrap gap-3 text-sm"><a className="text-blue-700 underline" href={`mailto:${selected.email}`}>{selected.email}</a><a className="text-blue-700 underline" href={`tel:${selected.phone.replace(/[^+\d]/g, "")}`}>{selected.phone}</a>{selected.resumeName && <a className="text-blue-700 underline" href={`/api/admin/applications/${selected.id}/resume`}>Download résumé ({selected.resumeName})</a>}{selected.portfolio && <a href={selected.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Work examples / profile ↗</a>}</div>
      <dl className="grid gap-5 sm:grid-cols-2">{[
        ["Home suburb", `${selected.suburb} ${selected.postcode}`], ["Travel coverage", selected.coverage], ["Experience", selected.experience], ["Skills", selected.skills.join(", ")], ["Work rights", selected.workRights], ["Work restrictions", selected.workRightsDetails], ["Arrangement", selected.engagement], ["Start availability", selected.startAvailability], ["Available days", selected.days.join(", ")], ["Driver’s licence", selected.licence], ["Transport", selected.vehicle], ["White Card", selected.whiteCard], ["Qualifications / training", selected.qualifications], ["Tools / software", selected.tools], ["Pay expectations", selected.expectations], ["Additional information / recruitment support", selected.adjustments],
      ].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{value || "Not provided"}</dd></div>)}<div className="sm:col-span-2"><dt className="text-xs font-semibold text-slate-500">Relevant experience</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{selected.summary}</dd></div></dl>
      <p className="mt-5 text-xs text-slate-400">Reference: {selected.id} · Recruitment consent recorded</p>
      <div className="mt-6 space-y-4 border-t border-slate-200 pt-5"><h3 className="font-semibold">Hiring review</h3><label className="block text-sm">Application status<select className={`${control} ml-3`} value={status} onChange={e => setStatus(e.target.value as ApplicationStatus)}>{APPLICATION_STATUSES.map(value => <option key={value}>{value}</option>)}</select></label><label className="block text-sm">Private hiring notes<textarea className={`${control} mt-2 block w-full`} rows={5} maxLength={10000} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Interview notes, follow-up dates and next steps" /></label><p className="text-xs text-slate-500">Status updates and notes are internal. Applicants are not automatically notified.</p><button disabled={saving || !dirty} onClick={save} className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">{saving ? "Saving…" : "Save review"}</button>{message && <p role="status" className="text-sm text-green-700">{message}</p>}{selected.updatedAt && <p className="text-xs text-slate-400">Last updated by {selected.updatedBy} · {date(selected.updatedAt)}</p>}</div>
    </section>}
  </div>;
}
