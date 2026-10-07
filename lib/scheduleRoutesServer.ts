import { getDb, isMongoConfigured } from "@/lib/mongodb";

interface ScheduleRouteDoc {
  _id: string; // calendar date, unique without an additional index
  order: string[];
  updatedAt: Date;
  updatedBy: string;
}

export async function getScheduleRouteOrders(from: string, to: string): Promise<Record<string, string[]>> {
  if (!isMongoConfigured()) return {};
  const db = await getDb();
  const routes = await db.collection<ScheduleRouteDoc>("scheduleRoutes").find({ _id: { $gte: from, $lte: to } }).toArray();
  return Object.fromEntries(routes.map((route) => [route._id, route.order]));
}

export async function saveScheduleRouteOrders(routes: { date: string; order: string[] }[], username: string): Promise<void> {
  const db = await getDb();
  await db.collection<ScheduleRouteDoc>("scheduleRoutes").bulkWrite(routes.map(({ date, order }) => ({
    updateOne: {
      filter: { _id: date },
      update: { $set: { order, updatedAt: new Date(), updatedBy: username } },
      upsert: true,
    },
  })));
}
