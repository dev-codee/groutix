import type { DispatchMapItem } from "@/components/admin/DispatchMap";

export const MAX_PLANNING_DAYS = 31;
const DAY_COLORS = ["#2563EB", "#059669", "#DC2626", "#9333EA", "#DB2777", "#0891B2", "#C2410C", "#4F46E5", "#4D7C0F", "#BE123C", "#0F766E", "#A16207", "#6D28D9", "#475569"];

export function offsetPlanningDate(date: string, offset: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

export function consecutivePlanningDates(start: string, count: number): string[] {
  return Array.from({ length: Math.max(1, Math.min(MAX_PLANNING_DAYS, count)) }, (_, index) => offsetPlanningDate(start, index));
}

export function shiftPlanningDates(dates: string[], start: string): string[] {
  const offset = (Date.parse(start) - Date.parse(dates[0])) / 86400000;
  return dates.map((date) => offsetPlanningDate(date, offset));
}

export function addPlanningDate(dates: string[], date: string): string[] {
  return dates.includes(date) || dates.length >= MAX_PLANNING_DAYS ? dates : [...dates, date].sort();
}

export function planningDayColor(index: number): string {
  return DAY_COLORS[index] || `hsl(${(index * 137.508) % 360}, 72%, 38%)`;
}

// The slots API accepts ranges of up to 45 days. Split distant selected dates
// into separate requests rather than loading a large empty stretch of calendar.
export function planningDateRanges(dates: string[]): { from: string; to: string }[] {
  const ranges: { from: string; to: string }[] = [];
  for (const date of [...dates].sort()) {
    const last = ranges[ranges.length - 1];
    if (last && (Date.parse(date) - Date.parse(last.from)) / 86400000 <= 45) last.to = date;
    else ranges.push({ from: date, to: date });
  }
  return ranges;
}

export function colorPlanningMapItems(items: DispatchMapItem[], dates: string[]): DispatchMapItem[] {
  const counters = new Map<string, number>();
  return items.map((item) => {
    if (!item.date || item.unassigned) return item;
    const dayIndex = dates.indexOf(item.date);
    const stopNumber = (counters.get(item.date) || 0) + 1;
    counters.set(item.date, stopNumber);
    return { ...item, color: planningDayColor(dayIndex), stopNumber };
  });
}

export function mapRouteGroups(items: DispatchMapItem[], positions: ({ lat: number; lng: number } | null)[]) {
  const groups = new Map<string, { date: string; color: string; positions: { lat: number; lng: number }[] }>();
  positions.forEach((position, index) => {
    const item = items[index];
    if (!position || !item || item.unassigned) return;
    const date = item.date || "default";
    if (!groups.has(date)) groups.set(date, { date, color: item.color || "#10B981", positions: [] });
    groups.get(date)!.positions.push(position);
  });
  return [...groups.values()];
}
