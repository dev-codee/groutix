"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, X, CheckCircle2, AlertTriangle } from "lucide-react";
import type { Lead } from "./types";
import type { VisitNotificationReport } from "@/lib/visitNotification";

type Props = {
  lead: Lead; eventType: "en_route" | "arrived"; requestId: string;
  currentGps?: { lat: number; lng: number; time: string } | null;
  onResult: (report: VisitNotificationReport) => void;
  onBusy: (busy: boolean) => void; onClose: () => void;
};
export function VisitNotificationDialog({ lead, eventType, requestId, currentGps, onResult, onBusy, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<VisitNotificationReport | null>(null);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const saving = useRef(false);
  const started = useRef(false);
  const send = useCallback(async (etaOnly = false) => {
    if (saving.current) return;
    saving.current = true; setBusy(true); onBusy(true); setError("");
    try {
      let lat: number | null = null, lng: number | null = null;
      let locationIssue = "";
      if (eventType === "en_route") {
        if (currentGps && Date.now() - new Date(currentGps.time).getTime() < 30000) { lat = currentGps.lat; lng = currentGps.lng; }
        else if (!navigator.geolocation) locationIssue = "unsupported";
        else {
          await new Promise<void>(resolve => navigator.geolocation.getCurrentPosition(position => {
            lat = position.coords.latitude; lng = position.coords.longitude; resolve();
          }, failure => { locationIssue = failure.code === 1 ? "denied" : failure.code === 3 ? "timeout" : "unavailable"; resolve(); }, { timeout: 10000, maximumAge: 30000 }));
        }
      }
      const response = await fetch("/api/admin/on-the-way", { signal: AbortSignal.timeout(65000), method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, booking: lead.activeBooking, eventType, requestId, lat, lng, locationIssue, etaOnly }) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) throw new Error(response.status === 401 || response.status === 403 ? "Your session has expired. Sign in again, then check this attempt’s result before sending another notification." : data?.error || "The server did not return a confirmation. Check this attempt again; do not send a duplicate notification.");
      setProcessing(Boolean(data.processing));
      if (data.report) { setReport(data.report); onResult(data.report); }
      if (data.error) setError(data.error);
    } catch (err) {
      const network = err instanceof TypeError || err instanceof Error && ["AbortError", "TimeoutError"].includes(err.name);
      setError(network || !(err instanceof Error)
        ? "The server response was interrupted or timed out. Check your internet connection, then check this same attempt again. Accepted messages will not be resent."
        : err.message);
    }
    finally { saving.current = false; setBusy(false); onBusy(false); }
  }, [lead.id, lead.activeBooking, eventType, requestId, currentGps, onResult, onBusy]);
  useEffect(() => {
    void Promise.resolve().then(() => { if (!started.current) { started.current = true; void send(); } });
  }, [send]);
  const failed = report && Object.values(report.channels).some(channel => channel.status === "failed" && channel.retryable);
  const uncertain = report && Object.values(report.channels).some(channel => ["unknown", "sending"].includes(channel.status));
  return <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="visit-notification-title" className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
      <div className="flex items-start justify-between gap-3"><div><h2 id="visit-notification-title" className="text-lg font-bold text-slate-900">{eventType === "en_route" ? "On-the-way notification" : "Arrival notification"}</h2><p className="mt-1 text-sm text-slate-500">{lead.name || "Customer"}</p></div><button type="button" aria-label="Close notification result" disabled={busy} onClick={onClose} className="rounded-lg p-2 text-slate-500 disabled:opacity-40"><X className="h-4 w-4" /></button></div>
      {busy && <p role="status" className="my-5 flex items-center gap-2 text-sm text-blue-700"><Loader2 className="h-4 w-4 animate-spin" />Checking location and notification results…</p>}
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {report && <div className="mt-4 space-y-3" aria-live="polite">
        {(["sms", "email"] as const).map(channel => {
          const outcome = report.channels[channel];
          const accepted = outcome.status === "accepted";
          return <div key={channel} className={`rounded-xl border p-3 ${accepted ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}><p className="flex items-center gap-2 text-sm font-bold text-slate-900">{accepted ? <CheckCircle2 className="h-4 w-4 text-green-700" /> : <AlertTriangle className="h-4 w-4 text-amber-700" />}{channel === "sms" ? "SMS" : "Email"}: {accepted ? "accepted for delivery" : outcome.status === "failed" ? "not sent" : "confirmation pending"}</p><p className="mt-1 text-sm text-slate-700">{outcome.reason}</p>{outcome.nextStep && <p className="mt-1 text-xs leading-5 text-slate-600">{outcome.nextStep}</p>}</div>;
        })}
        {eventType === "en_route" && <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-sm font-bold text-slate-900">{report.eta.text ? `Approximate ETA: ${report.eta.text}` : "ETA unavailable"}</p><p className="mt-1 text-sm text-slate-600">{report.eta.reason}</p>{report.eta.nextStep && <p className="mt-2 text-xs leading-5 text-slate-600">{report.eta.nextStep}</p>}<p className="mt-2 text-xs text-slate-500">ETA checks do not resend accepted notifications.</p></div>}
        {report.warnings.map(warning => <p key={warning} role="alert" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">{warning}</p>)}
        {uncertain && <p className="text-xs text-amber-900">Unconfirmed channels will not be resent automatically. Check their status in the messaging provider before starting another notification.</p>}
      </div>}
      <div className="mt-5 flex flex-wrap gap-2">
        {(failed || error || processing || !report) && <button type="button" disabled={busy} onClick={() => void send()} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{processing || error && !failed ? "Check result / retry safely" : "Retry failed channels"}</button>}
        {report && eventType === "en_route" && <button type="button" disabled={busy} onClick={() => void send(true)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">Check ETA again</button>}
        <button type="button" disabled={busy} onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-50">Close</button>
      </div>
      <p className="mt-4 break-all text-[10px] text-slate-400">Attempt: {requestId}</p>
    </section>
  </div>;
}
