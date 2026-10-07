import { distanceKm, TULLAMARINE } from "./scheduling";
import { locate, driveMinutes } from "./routePlanning";

export interface RouteStop {
  id: string;
  date: string;
  time: string;
  suburb?: string | null;
  customer?: { address: string } | null;
}

export function appointmentKey(entry: { leadId: string; type: string; date: string; time: string }): string {
  return `${entry.leadId}:${entry.type}:${entry.date}:${entry.time}`;
}

export function applyRouteOrders<T extends RouteStop>(entries: T[], orders: Record<string, string[]>): T[] {
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    const order = orders[a.date] || [];
    const rank = (id: string) => { const i = order.indexOf(id); return i < 0 ? order.length : i; };
    return rank(a.id) - rank(b.id) || a.time.localeCompare(b.time) || a.id.localeCompare(b.id);
  });
}

const base = () => locate("Gowanbrae") || TULLAMARINE;
const position = (entry: RouteStop) => locate(entry.customer?.address) || locate(entry.suburb);

/** Suggest a driving order per day; unknown locations retain their positions. */
export function optimizeRouteStops<T extends RouteStop>(entries: T[]): T[] {
  const days = [...new Set(entries.map((entry) => entry.date))];
  return days.flatMap((date) => {
    const day = entries.filter((entry) => entry.date === date);
    const remaining = day.filter((entry) => position(entry));
    const ordered: T[] = [];
    let previous = base();
    while (remaining.length) {
      let closest = 0;
      remaining.forEach((entry, index) => {
        if (distanceKm(previous, position(entry)!) < distanceKm(previous, position(remaining[closest])!)) closest = index;
      });
      const [next] = remaining.splice(closest, 1);
      ordered.push(next);
      previous = position(next)!;
    }
    let index = 0;
    const proposed = day.map((entry) => position(entry) ? ordered[index++] : entry);
    // Never replace an existing order with a longer estimated route.
    return estimateRoute(proposed).km < estimateRoute(day).km ? proposed : day;
  });
}

/** Suburb-centroid estimates including travel from and back to base each day. */
export function estimateRoute(entries: RouteStop[]): { km: number; minutes: number; missing: number } {
  let km = 0;
  let minutes = 0;
  let missing = 0;
  for (const date of new Set(entries.map((entry) => entry.date))) {
    let previous = base();
    let located = 0;
    for (const entry of entries.filter((stop) => stop.date === date)) {
      const point = position(entry);
      if (!point) { missing++; continue; }
      const distance = distanceKm(previous, point);
      km += distance;
      minutes += driveMinutes(distance);
      previous = point;
      located++;
    }
    if (located) {
      const distance = distanceKm(previous, base());
      km += distance;
      minutes += driveMinutes(distance);
    }
  }
  return { km: Math.round(km * 10) / 10, minutes, missing };
}

export function validScheduleDate(date: unknown): date is string {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const timestamp = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === date;
}
