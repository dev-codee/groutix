"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { CheckCircle2, Loader2, MapPin } from "lucide-react";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const fieldClass = "mt-1.5 w-full rounded-sm border border-neutral-200 bg-white px-3 py-2.5 text-base font-normal text-neutral-900 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20";

export default function ServiceSuburbChecker() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ available: boolean; message: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [coverageError, setCoverageError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [token, setToken] = useState("");
  const captcha = useRef<TurnstileInstance>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setResult(null);
      setCoverageError("");
      if (query.trim().length < 2) { setChecking(false); return; }
      setChecking(true);
      try {
        const response = await fetch(`/api/suburb-check?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Coverage could not be checked. You can still send an enquiry.");
        const data = await response.json();
        if (!controller.signal.aborted) setResult({ available: Boolean(data.available), message: data.message });
      } catch (err) {
        if (!controller.signal.aborted) setCoverageError(err instanceof Error ? err.message : "Coverage could not be checked.");
      } finally {
        if (!controller.signal.aborted) setChecking(false);
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = new FormData(event.currentTarget);
    const names = String(form.get("name") || "").trim().split(/\s+/);
    if (names.length < 2) { setError("Please enter your first and last name."); return; }
    if (siteKey && !token) { setError("Please complete the verification below."); return; }
    setSaving(true);
    setError("");
    form.set("firstName", names[0]);
    form.set("lastName", names.slice(1).join(" "));
    form.set("city", query.trim());
    form.set("service", "Leaking Shower Repair");
    form.set("sourcePage", "/leaking-shower-repair");
    form.set("message", `Please confirm leaking shower repair coverage and contact me about ${query.trim()}.`);
    if (token) form.set("cf-turnstile-response", token);
    try {
      const response = await fetch("/api/quote", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send your enquiry. Please try again.");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your enquiry.");
      captcha.current?.reset();
      setToken("");
    } finally { setSaving(false); }
  }

  return (
    <div id="suburb-checker" className="mx-auto w-full max-w-2xl rounded-xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
      <div className="text-center space-y-3">
        <MapPin className="mx-auto h-8 w-8 text-primary" />
        <h3 className="text-xl font-bold text-neutral-900">Check If We Service Your Suburb</h3>
        <p className="text-base leading-relaxed text-neutral-600">Not sure? Enter your suburb or postcode to check coverage. Leave your details if you would like us to contact you.</p>
      </div>
      {saved ? <div role="status" className="mt-6 rounded-lg bg-emerald-50 p-6 text-center text-emerald-900"><CheckCircle2 className="mx-auto mb-3 h-8 w-8" /><p className="font-bold">Your enquiry has been sent.</p><p className="mt-2 text-sm">We will contact you to confirm coverage and discuss your shower.</p></div> : <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold text-neutral-700">Suburb or Postcode<input name="suburb" required minLength={2} autoComplete="address-level2" value={query} onChange={(event) => { setQuery(event.target.value); setResult(null); setCoverageError(""); }} placeholder="e.g. South Yarra or 3141" className={fieldClass} /></label>
        <div aria-live="polite">
          {checking && <p className="flex items-center gap-2 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" />Checking coverage…</p>}
          {result && <p className={`rounded-lg p-3 text-sm ${result.available ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>{result.message}</p>}
          {coverageError && <p className="text-sm text-neutral-600">{coverageError}</p>}
        </div>
        <label className="block text-sm font-semibold text-neutral-700">Full Name<input name="name" required autoComplete="name" placeholder="Your first and last name" className={fieldClass} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-neutral-700">Phone Number<input name="phone" required type="tel" autoComplete="tel" placeholder="04XX XXX XXX" className={fieldClass} /></label>
          <label className="block text-sm font-semibold text-neutral-700">Email<input name="email" required type="email" autoComplete="email" placeholder="you@example.com" className={fieldClass} /></label>
        </div>
        {siteKey && <Turnstile ref={captcha} siteKey={siteKey} onSuccess={setToken} onExpire={() => setToken("")} onError={() => { setToken(""); setError("Verification could not load. Please try again."); }} options={{ size: "flexible" }} />}
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? "Sending…" : "Confirm Coverage & Request Callback"}</button>
      </form>}
    </div>
  );
}
