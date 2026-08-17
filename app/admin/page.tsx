"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCcw } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatCard, TimelineChart, BarList, Panel } from "@/components/admin/Charts";

type Stats = {
  total: number;
  today: number;
  last7Days: number;
  last30Days: number;
  newCount: number;
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
  timeline: { date: string; quote: number; support_ticket: number }[];
  topEnquiries: { label: string; count: number }[];
  topCities: { label: string; count: number }[];
  topSources: { label: string; count: number }[];
};

const RANGES = [7, 14, 30, 90] as const;

export default function DashboardPage() {
  const [days, setDays] = useState<number>(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (range: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/stats?days=${range}`, { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { stats?: Stats; error?: string };
      if (!res.ok) {
        setError(data.error || "Could not load analytics.");
        setStats(null);
      } else {
        setStats(data.stats ?? null);
      }
    } catch {
      setError("Network error while loading analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(days);
  }, [days, load]);

  const quotes = stats?.byType.find((t) => t.type === "quote")?.count ?? 0;
  const tickets = stats?.byType.find((t) => t.type === "support_ticket")?.count ?? 0;

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-black text-slate-900">Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-300 bg-white p-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setDays(r)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${days === r ? "bg-[#001f97] text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
              >
                {r}d
              </button>
            ))}
          </div>
          <button
            onClick={() => load(days)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          <p className="font-semibold">Analytics unavailable</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-amber-700">
            Make sure <code className="rounded bg-amber-100 px-1">MONGODB_URI</code> is set on the
            server and try again.
          </p>
        </div>
      ) : null}

      {stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Total leads" value={stats.total} accent />
            <StatCard label="New / unread" value={stats.newCount} />
            <StatCard label="Today" value={stats.today} />
            <StatCard label="Last 7 days" value={stats.last7Days} />
            <StatCard label="Last 30 days" value={stats.last30Days} />
          </div>

          <Panel title={`Submissions over the last ${days} days`}>
            <TimelineChart data={stats.timeline} />
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="By type">
              <BarList
                items={[
                  { label: "Quote requests", count: quotes },
                  { label: "Support tickets", count: tickets },
                ]}
              />
            </Panel>
            <Panel title="By status">
              <BarList
                items={stats.byStatus.map((s) => ({
                  label: s.status[0].toUpperCase() + s.status.slice(1),
                  count: s.count,
                }))}
              />
            </Panel>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Panel title="Top enquiry types">
              <BarList items={stats.topEnquiries} />
            </Panel>
            <Panel title="Top cities">
              <BarList items={stats.topCities} />
            </Panel>
            <Panel title="Top source pages">
              <BarList items={stats.topSources} />
            </Panel>
          </div>
        </div>
      ) : !error && loading ? (
        <div className="py-20 text-center text-sm text-slate-400">Loading analytics…</div>
      ) : null}
    </AdminShell>
  );
}
