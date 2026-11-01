"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CustomerLiveMap from "@/components/CustomerLiveMap";
import { Navigation, Phone, Mail, RefreshCw, CheckCircle2 } from "lucide-react";
import { useContact } from "@/components/SiteContentProvider";
import type { CustomerTrackingView } from "@/lib/customerTracking";

export default function CustomerTracking({ token }: { token: string }) {
  const contact = useContact();
  const [data, setData] = useState<CustomerTrackingView | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function poll() {
      let keepPolling = true;
      try {
        const res = await fetch(`/api/track/location/${encodeURIComponent(token)}`, { cache: "no-store", signal: controller.signal, referrerPolicy: "no-referrer" });
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(body.error || "Location updates are unavailable.");
          setData(null);
          keepPolling = res.status !== 404;
        } else {
          setData(body);
          setError("");
          keepPolling = body.status === "en_route";
        }
      } catch {
        if (!cancelled) { setError("Connection lost. Reconnecting to your specialist's location..."); setData(null); }
      } finally {
        if (!cancelled) {
          setLoading(false);
          if (keepPolling) timer = setTimeout(poll, 15000);
        }
      }
    }
    poll();
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [token, refresh]);

  const arrived = data?.status === "arrived";
  const finished = data && data.status !== "en_route";
  const title = arrived ? "Your specialist has arrived" : finished ? "Location sharing has ended" : "Your specialist is on the way";
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-8 inline-block text-2xl font-black text-primary">Groutix</Link>
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="mb-5 flex items-start gap-3">
            <div className={`rounded-xl p-3 ${arrived ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-primary"}`}>
              {arrived ? <CheckCircle2 className="h-6 w-6" /> : <Navigation className="h-6 w-6" />}
            </div>
            <div><h1 className="text-xl font-black text-slate-900 sm:text-2xl">{title}</h1><p className="mt-1 text-sm text-slate-500">{finished ? "Thank you for choosing Groutix." : "Follow your Groutix specialist's latest location here."}</p></div>
          </div>
          <div aria-live="polite">
            {loading ? <p className="py-12 text-center text-slate-500">Connecting to your specialist...</p> : error ? (
              <div className="rounded-xl bg-amber-50 p-5 text-sm text-amber-900">{error}<button onClick={() => setRefresh((value) => value + 1)} className="mt-3 flex items-center gap-2 font-bold"><RefreshCw className="h-4 w-4" />Try again</button></div>
            ) : finished ? (
              <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">{arrived ? "Your specialist is at your property. Live location sharing has stopped." : "This journey is no longer being shared. Please contact us if you need an update."}</p>
            ) : data?.location ? (
              <><CustomerLiveMap location={data.location} /><p className="mt-3 text-xs text-slate-500">Last location update: {new Date(data.location.updatedAt).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", second: "2-digit" })}. This page refreshes automatically.</p></>
            ) : <p className="rounded-xl bg-blue-50 p-5 text-sm text-slate-600">Waiting for a fresh location update from your specialist. This page will update automatically when GPS is available.</p>}
          </div>
          <div className="mt-7 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
            <a href={contact.tel} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white"><Phone className="h-4 w-4" />Call {contact.phone}</a>
            <a href={contact.mailto} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700"><Mail className="h-4 w-4" />Email us</a>
          </div>
        </section>
      </div>
    </main>
  );
}
