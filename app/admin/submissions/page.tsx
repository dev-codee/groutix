"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Download, X, Trash2, RefreshCcw } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";

type Submission = {
  id: string;
  type: "quote" | "support_ticket";
  status: "new" | "read" | "archived";
  createdAt: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  enquiry?: string;
  message?: string;
  areas?: string;
  heard?: string;
  sourcePage?: string;
  issue?: string;
  transcript?: { role: "user" | "assistant"; content: string }[];
  photosCount?: number;
  ip?: string;
  userAgent?: string;
  emailDelivered?: boolean;
};

const PAGE_SIZE = 25;

const STATUS_STYLES: Record<Submission["status"], string> = {
  new: "bg-emerald-100 text-emerald-700",
  read: "bg-slate-100 text-slate-600",
  archived: "bg-amber-100 text-amber-700",
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SubmissionsPage() {
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Submission | null>(null);

  // Debounce the free-text search so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Any filter change resets to the first page.
  useEffect(() => {
    setPage(1);
  }, [type, status, from, to, debouncedSearch]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (type) p.set("type", type);
    if (status) p.set("status", status);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (debouncedSearch) p.set("search", debouncedSearch);
    return p;
  }, [type, status, from, to, debouncedSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const p = new URLSearchParams(query);
    p.set("page", String(page));
    p.set("pageSize", String(PAGE_SIZE));
    try {
      const res = await fetch(`/api/admin/submissions?${p.toString()}`, { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as {
        items?: Submission[];
        total?: number;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Could not load submissions.");
        setItems([]);
        setTotal(0);
      } else {
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      setError("Network error while loading submissions.");
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function setItemStatus(id: string, next: Submission["status"]) {
    const res = await fetch(`/api/admin/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: next } : it)));
      setSelected((prev) => (prev && prev.id === id ? { ...prev, status: next } : prev));
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this submission permanently?")) return;
    const res = await fetch(`/api/admin/submissions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSelected(null);
      load();
    }
  }

  function openDetail(item: Submission) {
    setSelected(item);
    if (item.status === "new") setItemStatus(item.id, "read");
  }

  const exportHref = (format: "csv" | "json") => {
    const p = new URLSearchParams(query);
    p.set("format", format);
    return `/api/admin/export?${p.toString()}`;
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-black text-slate-900">
          Submissions <span className="text-sm font-medium text-slate-400">({total})</span>
        </h1>
        <div className="flex items-center gap-2">
          <a
            href={exportHref("csv")}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </a>
          <a
            href={exportHref("json")}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <Download className="h-3.5 w-3.5" /> JSON
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone, message…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#001f97] focus:ring-1 focus:ring-[#001f97]"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#001f97]"
        >
          <option value="">All types</option>
          <option value="quote">Quote requests</option>
          <option value="support_ticket">Support tickets</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#001f97]"
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="archived">Archived</option>
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-[#001f97]"
            aria-label="From date"
          />
          <span className="text-slate-400">–</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-[#001f97]"
            aria-label="To date"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          {error}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Contact</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Detail</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => openDetail(item)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                    {fmtDate(item.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.type === "quote"
                          ? "bg-[#001f97]/10 text-[#001f97]"
                          : "bg-sky-100 text-sky-700"
                      }`}
                    >
                      {item.type === "quote" ? "Quote" : "Support"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{item.name || "—"}</td>
                  <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                    <div className="truncate">{item.email || "—"}</div>
                    <div className="text-xs text-slate-400">{item.phone || ""}</div>
                  </td>
                  <td className="hidden max-w-xs truncate px-4 py-3 text-slate-500 lg:table-cell">
                    {item.enquiry || item.issue || item.message || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {items.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-slate-400">
                    No submissions match these filters.
                  </td>
                </tr>
              ) : null}
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-slate-400">
                    <RefreshCcw className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-100"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-100"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {selected ? (
        <DetailDrawer
          item={selected}
          onClose={() => setSelected(null)}
          onStatus={(s) => setItemStatus(selected.id, s)}
          onDelete={() => remove(selected.id)}
        />
      ) : null}
    </AdminShell>
  );
}

function DetailDrawer({
  item,
  onClose,
  onStatus,
  onDelete,
}: {
  item: Submission;
  onClose: () => void;
  onStatus: (s: Submission["status"]) => void;
  onDelete: () => void;
}) {
  const fields: [string, string | undefined][] = [
    ["Email", item.email],
    ["Phone", item.phone],
    ["Address", item.address],
    ["City", item.city],
    ["State", item.state],
    ["Areas to service", item.areas],
    ["Enquiry about", item.enquiry],
    ["Heard about us", item.heard],
    ["Source page", item.sourcePage],
    ["Photos attached", item.photosCount ? String(item.photosCount) : undefined],
    ["IP", item.ip],
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              {item.type === "quote" ? "Quote request" : "Support ticket"}
            </div>
            <h2 className="text-lg font-bold text-slate-900">{item.name || "—"}</h2>
            <div className="text-xs text-slate-400">{fmtDate(item.createdAt)}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 px-5 py-5">
          <dl className="space-y-2">
            {fields
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label} className="grid grid-cols-3 gap-2 text-sm">
                  <dt className="font-medium text-slate-500">{label}</dt>
                  <dd className="col-span-2 break-words text-slate-800">
                    {label === "Email" ? (
                      <a href={`mailto:${value}`} className="text-[#001f97] hover:underline">
                        {value}
                      </a>
                    ) : label === "Phone" ? (
                      <a href={`tel:${value}`} className="text-[#001f97] hover:underline">
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              ))}
          </dl>

          {item.message ? (
            <div>
              <div className="mb-1 text-sm font-medium text-slate-500">Message</div>
              <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                {item.message}
              </p>
            </div>
          ) : null}

          {item.issue ? (
            <div>
              <div className="mb-1 text-sm font-medium text-slate-500">Issue</div>
              <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                {item.issue}
              </p>
            </div>
          ) : null}

          {item.transcript && item.transcript.length > 0 ? (
            <div>
              <div className="mb-2 text-sm font-medium text-slate-500">Chat transcript</div>
              <div className="space-y-2">
                {item.transcript.map((m, i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-3 text-sm ${
                      m.role === "user"
                        ? "bg-[#001f97]/5 text-slate-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <div className="mb-0.5 text-xs font-semibold capitalize text-slate-400">
                      {m.role}
                    </div>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-4">
          <div className="mb-3 flex gap-2">
            {(["new", "read", "archived"] as const).map((s) => (
              <button
                key={s}
                onClick={() => onStatus(s)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  item.status === s
                    ? "bg-[#001f97] text-white"
                    : "border border-slate-300 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={onDelete}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" /> Delete permanently
          </button>
        </div>
      </div>
    </div>
  );
}
