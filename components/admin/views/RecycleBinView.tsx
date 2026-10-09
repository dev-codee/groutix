"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Clock,
  XCircle,
} from "lucide-react";

interface RecycleBinItem {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  service?: string;
  jobNo?: string;
  status: string;
  originalStatus?: string;
  createdAt: string;
  deletedAt: string;
  deletedBy?: string;
}

const PAGE_SIZE = 20;

export function RecycleBinView({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [emptyingBin, setEmptyingBin] = useState(false);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const sp = new URLSearchParams();
      sp.set("page", String(page));
      sp.set("pageSize", String(PAGE_SIZE));
      if (search.trim()) sp.set("search", search.trim());
      const res = await fetch(`/api/admin/recycle-bin?${sp.toString()}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      onCountChange?.(Number(data.total || 0));
    } catch (err: any) {
      setError(err?.message || "Could not load recycle bin.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  async function handleRestore(id: string) {
    setRestoringId(id);
    try {
      const res = await fetch(`/api/admin/recycle-bin/${id}`, { method: "POST" });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        setTotal((prev) => prev - 1);
        onCountChange?.(Math.max(0, total - 1));
        setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      } else {
        alert("Failed to restore lead.");
      }
    } catch {
      alert("Error restoring lead.");
    } finally {
      setRestoringId(null);
    }
  }

  async function handlePermanentDelete(id: string) {
    if (!confirm("Permanently delete this lead? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/recycle-bin/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        setTotal((prev) => prev - 1);
        onCountChange?.(Math.max(0, total - 1));
        setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      } else {
        alert("Failed to delete lead.");
      }
    } catch {
      alert("Error deleting lead.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleEmptyBin() {
    setEmptyingBin(true);
    try {
      const res = await fetch("/api/admin/recycle-bin", { method: "DELETE" });
      if (res.ok) {
        setItems([]);
        setTotal(0);
        onCountChange?.(0);
        setSelectedIds(new Set());
        setConfirmEmpty(false);
      } else {
        alert("Failed to empty recycle bin.");
      }
    } catch {
      alert("Error emptying recycle bin.");
    } finally {
      setEmptyingBin(false);
    }
  }

  async function handleBulkRestore() {
    if (selectedIds.size === 0) return;
    setBulkAction(true);
    const promises = Array.from(selectedIds).map((id) =>
      fetch(`/api/admin/recycle-bin/${id}`, { method: "POST" })
    );
    await Promise.allSettled(promises);
    setSelectedIds(new Set());
    setBulkAction(false);
    loadItems();
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Permanently delete ${selectedIds.size} lead(s)? This cannot be undone.`)) return;
    setBulkAction(true);
    const promises = Array.from(selectedIds).map((id) =>
      fetch(`/api/admin/recycle-bin/${id}`, { method: "DELETE" })
    );
    await Promise.allSettled(promises);
    setSelectedIds(new Set());
    setBulkAction(false);
    loadItems();
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }

  function fmtDate(iso?: string) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  }

  function fmtDateTime(iso?: string) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  }

  function timeAgo(iso?: string) {
    if (!iso) return "";
    try {
      const ms = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(ms / 60000);
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days}d ago`;
      return fmtDate(iso);
    } catch {
      return "";
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Gradient header strip */}
        <div className="bg-gradient-to-r from-rose-500/10 via-orange-500/5 to-amber-500/10 border-b border-slate-200/60 px-5 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 text-white flex items-center justify-center shadow-sm">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recycle Bin</h2>
                <p className="text-xs text-slate-500">
                  {total === 0
                    ? "No deleted leads"
                    : `${total} deleted lead${total !== 1 ? "s" : ""} — restore or permanently delete`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {total > 0 && (
                <>
                  {!confirmEmpty ? (
                    <button
                      onClick={() => setConfirmEmpty(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Empty Recycle Bin
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-rose-600">Are you sure?</span>
                      <button
                        onClick={handleEmptyBin}
                        disabled={emptyingBin}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {emptyingBin ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        Yes, Delete All
                      </button>
                      <button
                        onClick={() => setConfirmEmpty(false)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search deleted leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/80 border border-slate-200/90 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
              />
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                <span className="text-xs font-medium text-slate-500">
                  {selectedIds.size} selected
                </span>
                <button
                  onClick={handleBulkRestore}
                  disabled={bulkAction}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restore
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkAction}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <XCircle className="w-3 h-3" />
                  Delete
                </button>
              </div>
            )}
          </div>

          <div className="text-xs font-medium text-slate-400">
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading…
              </span>
            ) : (
              <>
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)}
                </span>{" "}
                of {total}
              </>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="divide-y divide-slate-100">
          {/* Select all header */}
          {items.length > 0 && (
            <div className="px-5 py-2 bg-slate-50/60 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedIds.size === items.length && items.length > 0}
                onChange={toggleSelectAll}
                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select All
              </span>
              <div className="hidden lg:grid grid-cols-5 gap-4 flex-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2">
                <span>Client</span>
                <span>Service</span>
                <span>Original Status</span>
                <span>Deleted</span>
                <span className="text-right">Actions</span>
              </div>
            </div>
          )}

          {error && (
            <div className="px-5 py-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                {error}
              </div>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="px-5 py-16 text-center">
              <div className="inline-flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Trash2 className="w-7 h-7 text-slate-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Recycle bin is empty</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Deleted leads will appear here so you can restore them.
                  </p>
                </div>
              </div>
            </div>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              className={`group px-5 py-3.5 flex items-center gap-3 transition-colors hover:bg-slate-50/80 ${selectedIds.has(item.id) ? "bg-blue-50/40" : ""
                }`}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(item.id)}
                onChange={() => toggleSelect(item.id)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
              />

              {/* Client info */}
              <div className="flex-1 min-w-0 grid grid-cols-1 lg:grid-cols-5 gap-2 lg:gap-4 items-center">
                {/* Client */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {item.jobNo && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md shrink-0">
                        {item.jobNo}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {item.name || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    {item.email && (
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span className="truncate">{item.email}</span>
                      </span>
                    )}
                    {item.phone && (
                      <span className="flex items-center gap-1 shrink-0">
                        <Phone className="w-3 h-3" />
                        {item.phone}
                      </span>
                    )}
                  </div>
                  {item.address && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{item.address}</span>
                    </div>
                  )}
                </div>

                {/* Service */}
                <div className="min-w-0">
                  {item.service ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                      <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{item.service}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-300">—</span>
                  )}
                </div>

                {/* Original Status */}
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
                    {item.originalStatus || item.status || "—"}
                  </span>
                </div>

                {/* Deleted info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock className="w-3 h-3 text-rose-400 shrink-0" />
                    <span className="font-medium">{timeAgo(item.deletedAt)}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {fmtDateTime(item.deletedAt)}
                  </div>
                  {item.deletedBy && item.deletedBy !== "system" && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                      <User className="w-2.5 h-2.5" />
                      by {item.deletedBy}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 justify-end">
                  <button
                    onClick={() => handleRestore(item.id)}
                    disabled={restoringId === item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                    title="Restore this lead"
                  >
                    {restoringId === item.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3 h-3" />
                    )}
                    <span className="hidden sm:inline">Restore</span>
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                    title="Permanently delete this lead"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <span className="text-xs font-medium text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="bg-white/60 rounded-2xl border border-slate-200/60 p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4 text-blue-500" />
        </div>
        <div className="text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-700">How it works:</span> When a lead is
          deleted from the CRM, it moves here instead of being permanently removed. You can{" "}
          <span className="font-semibold text-emerald-600">restore</span> a lead back to its
          original status, or{" "}
          <span className="font-semibold text-rose-600">permanently delete</span> it when you're
          sure it's no longer needed. Emptying the recycle bin removes all items permanently.
        </div>
      </div>
    </div>
  );
}
