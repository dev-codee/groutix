"use client";

// Minimal, dependency-free charts (SVG/flex) for the admin dashboard.

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-xs ${
        accent ? "border-blue-500/30 bg-blue-50/40" : "border-slate-200/80 bg-white"
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}

type TimelinePoint = { date: string; quote: number; support_ticket: number };

export function TimelineChart({ data }: { data: TimelinePoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.quote + d.support_ticket));
  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-slate-500 font-medium">
        <Legend color="#2563eb" label="Quotes" />
        <Legend color="#38bdf8" label="Support tickets" />
      </div>
      <div className="flex h-40 items-end gap-[2px]">
        {data.map((d) => {
          const total = d.quote + d.support_ticket;
          const title = `${d.date}: ${d.quote} quote(s), ${d.support_ticket} ticket(s)`;
          return (
            <div
              key={d.date}
              title={title}
              className="group flex flex-1 flex-col justify-end"
              style={{ minWidth: 2 }}
            >
              <div
                className="w-full rounded-t-sm bg-[#38bdf8]"
                style={{ height: `${(d.support_ticket / max) * 100}%` }}
              />
              <div
                className="w-full bg-blue-600"
                style={{ height: `${(d.quote / max) * 100}%` }}
              />
              {total === 0 ? <div className="h-[2px] w-full bg-slate-200" /> : null}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-slate-400 font-medium tabular-nums">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export function BarList({
  items,
  emptyLabel = "No data yet",
}: {
  items: { label: string; count: number }[];
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">{emptyLabel}</p>;
  }
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.label} className="relative">
          <div className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-1.5 text-xs">
            <div
              className="absolute inset-y-0 left-0 rounded-xl bg-blue-500/10"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
            <span className="relative z-10 truncate text-slate-700" title={item.label}>
              {item.label}
            </span>
            <span className="relative z-10 font-semibold text-slate-900">{item.count}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
