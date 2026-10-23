import { distanceKm, TULLAMARINE } from "./scheduling";
import { locate, driveMinutes } from "./routePlanning";

export interface RouteStop {
  id: string;
  date: string;
  time: string;
  suburb?: string | null;
  customer?: { address: string } | null;
}

export function appointmentKey(entry: { bookingId?: string; leadId: string; type: string; date: string; time: string }): string {
  return `${entry.leadId}:${entry.type}:${entry.date}:${entry.time}${entry.bookingId ? `:${entry.bookingId}` : ""}`;
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

/** Improve a closed tour: try several starting stops, then remove crossing detours.
 * Unknown locations retain their slots. Dates and appointment times stay intact.
 */
export function optimizeRouteStops<T extends RouteStop>(entries: T[]): T[] {
  return [...new Set(entries.map((entry) => entry.date))].flatMap((date) => {
    const day = entries.filter((entry) => entry.date === date);
    const located = day.filter((entry) => position(entry));
    if (located.length < 2) return day;
    const points = [base(), ...located.map((entry) => position(entry)!)];
    const distances = points.map((from) => points.map((to) => distanceKm(from, to)));
    const cost = (order: number[]) => {
      const path = [0, ...order, 0];
      return path.slice(1).reduce((sum, to, index) => sum + distances[path[index]][to], 0);
    };
    let best = located.map((_, index) => index + 1);
    let bestCost = cost(best);
    // Bound work on very large days while sampling starts throughout the list.
    const seedCount = Math.min(located.length, 24);
    for (let seed = 0; seed < seedCount; seed++) {
      const first = 1 + Math.floor(seed * located.length / seedCount);
      const remaining = new Set(best.filter((index) => index !== first));
      const order = [first];
      while (remaining.size) {
        const previous = order[order.length - 1];
        let next = remaining.values().next().value!;
        for (const candidate of remaining) {
          if (distances[previous][candidate] < distances[previous][next]) next = candidate;
        }
        order.push(next);
        remaining.delete(next);
      }
      // Symmetric distances let us evaluate a reversal using its two boundary
      // edges, including the edges leaving and returning to base.
      for (let pass = 0; pass < 50; pass++) {
        let improved = false;
        for (let start = 0; start < order.length - 1; start++) {
          for (let end = start + 1; end < order.length; end++) {
            const before = start ? order[start - 1] : 0;
            const after = end + 1 < order.length ? order[end + 1] : 0;
            const saving = distances[before][order[start]] + distances[order[end]][after]
              - distances[before][order[end]] - distances[order[start]][after];
            if (saving > 0.000001) {
              order.splice(start, end - start + 1, ...order.slice(start, end + 1).reverse());
              improved = true;
            }
          }
        }
        if (!improved) break;
      }
      const candidateCost = cost(order);
      if (candidateCost + 0.000001 < bestCost) { best = order; bestCost = candidateCost; }
    }
    let index = 0;
    return day.map((entry) => position(entry) ? located[best[index++] - 1] : entry);
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
