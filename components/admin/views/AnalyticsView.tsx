"use client";

import { RefreshCcw } from "lucide-react";
import { StatCard, TimelineChart, BarList, Panel } from "@/components/admin/Charts";

export interface Stats {
  total: number;
  newCount: number;
  today: number;
  last7Days: number;
  last30Days: number;
  timeline: { date: string; quote: number; support_ticket: number }[];
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
  topEnquiries: { label: string; count: number }[];
  topCities: { label: string; count: number }[];
  topSources: { label: string; count: number }[];
}

interface Props {
  analyticsDays: number;
  setAnalyticsDays: (days: number) => void;
  loadAnalytics: (days: number) => void;
  loadingStats: boolean;
  stats: Stats | null;
}

export function AnalyticsView({ analyticsDays, setAnalyticsDays, loadAnalytics, loadingStats, stats }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#e4e9f1]">
        <h2 className="text-base font-black text-slate-900">Submission Analytics & Trends</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-300 bg-white p-0.5">
            {[7, 14, 30, 90].map((r) => (
              <button
                key={r}
                onClick={() => setAnalyticsDays(r)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  analyticsDays === r ? "bg-[#001f97] text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
          <button
            onClick={() => loadAnalytics(analyticsDays)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${loadingStats ? "animate-spin" : ""}`} />
            Refresh Stats
          </button>
        </div>
      </div>

      {stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Total leads" value={stats.total} accent />
            <StatCard label="New / unread" value={stats.newCount} />
            <StatCard label="Today" value={stats.today} />
            <StatCard label="Last 7 days" value={stats.last7Days} />
            <StatCard label="Last 30 days" value={stats.last30Days} />
          </div>

          <Panel title={`Submissions over the last ${analyticsDays} days`}>
            <TimelineChart data={stats.timeline} />
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="By enquiry type">
              <BarList
                items={[
                  { label: "Quote requests", count: stats.byType.find((t) => t.type === "quote")?.count ?? 0 },
                  { label: "Support tickets", count: stats.byType.find((t) => t.type === "support_ticket")?.count ?? 0 },
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
            <Panel title="Top enquiry categories">
              <BarList items={stats.topEnquiries} />
            </Panel>
            <Panel title="Top cities / suburbs">
              <BarList items={stats.topCities} />
            </Panel>
            <Panel title="Top source pages">
              <BarList items={stats.topSources} />
            </Panel>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-slate-400">Loading analytics data...</div>
      )}
    </div>
  );
}
