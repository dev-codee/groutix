import type { RoadLeg } from "./dispatchWorklist";

export type TravelMatrix = RoadLeg[][];
export const routeCost = (order: number[], matrix: TravelMatrix) => {
  const path = [0, ...order, 0];
  return path.slice(1).reduce((sum, to, i) => sum + matrix[path[i]][to].km, 0);
};
/** Multi-start nearest neighbour plus full reversal improvement, including the return leg.
 * Evaluate directed edges: reversing a segment can change every road within it. */
export function optimizeDayRoute(matrix: TravelMatrix): number[] {
  const n = matrix.length - 1;
  if (n < 1 || matrix.some(row => row.length !== n + 1 || row.some(leg => !Number.isFinite(leg.km) || leg.km < 0 || !Number.isFinite(leg.minutes) || leg.minutes < 0))) throw new Error("Travel information is incomplete.");
  let best = Array.from({ length: n }, (_, i) => i + 1);
  for (let first = 1; first <= n; first++) {
    const order = [first], remaining = new Set(best.filter(id => id !== first));
    while (remaining.size) {
      const previous = order[order.length - 1];
      const next = [...remaining].sort((a, b) => matrix[previous][a].km - matrix[previous][b].km || a - b)[0];
      order.push(next); remaining.delete(next);
    }
    let candidate = order, improved = true;
    while (improved) {
      improved = false;
      for (let start = 0; start < n - 1; start++) for (let end = start + 1; end < n; end++) {
        const next = [...candidate.slice(0, start), ...candidate.slice(start, end + 1).reverse(), ...candidate.slice(end + 1)];
        if (routeCost(next, matrix) + 0.000001 < routeCost(candidate, matrix)) { candidate = next; improved = true; }
      }
    }
    if (routeCost(candidate, matrix) < routeCost(best, matrix)) best = candidate;
  }
  return best;
}
export const routeClock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
export function dayItinerary(matrix: TravelMatrix, order: number[], durations: number[], departure: string, buffer: number) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(departure) || !Number.isInteger(buffer) || buffer < 0 || buffer > 120
    || durations.some(value => !Number.isInteger(value) || value < 1 || value > 1440)) throw new Error("Choose valid departure, duration and buffer values.");
  let clock = Number(departure.slice(0, 2)) * 60 + Number(departure.slice(3));
  let previous = 0;
  const stops = order.map(index => {
    const leg = matrix[previous][index];
    clock += leg.minutes + buffer;
    const arrival = clock; clock += durations[index - 1]; previous = index;
    return { index, arrival, finish: clock, leg };
  });
  const home = matrix[previous][0];
  return { stops, home, returnAt: clock + home.minutes, km: routeCost(order, matrix) };
}
