import { getDb } from "./mongodb";
import type { VisitNotificationReport } from "./visitNotification";

export type NotificationAttempt = {
  _id: string; identity: string; processing: boolean; report?: VisitNotificationReport; createdAt: Date;
};
export async function claimNotificationAttempt(id: string, identity: string) {
  const collection = (await getDb()).collection<NotificationAttempt>("visit_notification_attempts");
  try { await collection.insertOne({ _id: id, identity, processing: false, createdAt: new Date() }); }
  catch (err) { if (!(err && typeof err === "object" && "code" in err && err.code === 11000)) throw err; }
  const existing = await collection.findOne({ _id: id });
  if (!existing || existing.identity !== identity) throw new Error("attempt_identity_mismatch");
  const claimed = await collection.findOneAndUpdate({ _id: id, identity, processing: false }, { $set: { processing: true } }, { returnDocument: "after" });
  return { claimed: Boolean(claimed), attempt: claimed || existing };
}
export async function saveNotificationAttempt(id: string, report: VisitNotificationReport, processing: boolean) {
  const result = await (await getDb()).collection<NotificationAttempt>("visit_notification_attempts").updateOne({ _id: id }, { $set: { report, processing } });
  if (!result.matchedCount) throw new Error("notification_attempt_not_found");
}
