"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { CAREER_OPTIONS, CAREER_ROLES, ROLE_SKILLS } from "@/lib/careers";

const inputClass = "mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
function Field({ label, name, required = true, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}{required ? " *" : " (optional)"}<input name={name} required={required} className={inputClass} {...props} /></label>;
}
function Select({ name, label }: { name: Exclude<keyof typeof CAREER_OPTIONS, "days">; label: string }) {
  return <label className="block text-sm font-semibold text-slate-700">{label} *<select name={name} required className={inputClass} defaultValue=""><option value="" disabled>Select an option</option>{CAREER_OPTIONS[name].map(option => <option key={option}>{option}</option>)}</select></label>;
}
export default function CareerApplicationForm() {
  const [role, setRole] = useState<keyof typeof CAREER_ROLES>("inspector");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [token, setToken] = useState("");
  const captcha = useRef<TurnstileInstance>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    const form = new FormData(event.currentTarget);
    const file = form.get("resume");
    if (file instanceof File && file.size > 3 * 1024 * 1024) { setError("Please keep your PDF résumé under 3 MB."); return; }
    const fields = Object.fromEntries(form.entries());
    form.set("application", JSON.stringify({ ...fields, role, skills: form.getAll("skills"), days: form.getAll("days"), consent: form.get("consent") === "on" }));
    form.set("cf-turnstile-response", token);
    setBusy(true);
    try {
      const response = await fetch("/api/careers", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We couldn't submit your application. Please try again.");
      setReference(data.id);
    } catch (err) { setError(err instanceof Error ? err.message : "Please try again."); captcha.current?.reset(); setToken(""); }
    finally { setBusy(false); }
  }
  if (reference) return <div role="status" className="rounded-2xl border border-green-200 bg-green-50 p-8"><h3 className="text-2xl font-bold text-green-900">Application received</h3><p className="mt-3 text-green-900">Thank you for applying to Groutix. Our team will review your application and contact you if we would like to discuss the next step.</p><p className="mt-4 break-all text-sm text-green-800">Your reference: {reference}</p></div>;
  return <form onSubmit={submit} className="space-y-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8" aria-label="Career application">
    <p className="text-sm text-slate-600">Fields marked * are required. A résumé is optional if you describe your experience below. New to the industry? Tell us about your transferable skills.</p>
    <fieldset><legend className="mb-4 text-xl font-bold">1. Your details</legend><div className="grid gap-5 sm:grid-cols-2">
      <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">Role *<select name="role" value={role} onChange={e => setRole(e.target.value as typeof role)} className={inputClass}>{Object.entries(CAREER_ROLES).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
      <Field name="fullName" label="Full name" autoComplete="name" maxLength={120} />
      <Field name="email" label="Email" type="email" autoComplete="email" maxLength={254} />
      <Field name="phone" label="Phone" type="tel" autoComplete="tel" maxLength={30} />
      <Field name="suburb" label="Home suburb / town" autoComplete="address-level2" maxLength={120} />
      <Field name="postcode" label="Postcode" autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} />
      <Select name="workRights" label="Right to work in Australia" />
      <Field name="workRightsDetails" label="Work conditions or hours restrictions" required={false} maxLength={500} />
    </div></fieldset>
    <fieldset><legend className="mb-4 text-xl font-bold">2. Skills &amp; experience</legend><div className="space-y-5">
      <Select name="experience" label="Relevant industry experience" />
      <fieldset key={role}><legend className="text-sm font-semibold text-slate-700">Your relevant skills (select any that apply)</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{ROLE_SKILLS[role].map(skill => <label key={skill} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm"><input name="skills" type="checkbox" value={skill} className="mt-0.5 size-4" />{skill}</label>)}</div></fieldset>
      <label className="block text-sm font-semibold text-slate-700">{role === "inspector" ? "Tell us about your inspection, quoting and customer experience" : "Tell us about your repair experience and the work you are confident completing"} *<textarea name="summary" required minLength={30} maxLength={4000} rows={5} className={inputClass} placeholder="Describe relevant work, recent projects, or the skills you would bring to this role." /></label>
      <label className="block text-sm font-semibold text-slate-700">Trade qualifications, licences &amp; training (optional)<textarea name="qualifications" maxLength={2000} rows={3} className={inputClass} placeholder="For example: tiling, waterproofing, moisture assessment or safety training. Please do not include licence or ID numbers." /></label>
      <div className="grid gap-5 sm:grid-cols-2"><Select name="whiteCard" label="Construction induction (White Card)" /><Field name="tools" label={role === "inspector" ? "Inspection tools or reporting software used" : "Tools and equipment you can bring"} required={false} maxLength={1000} /></div>
      <Field name="portfolio" label="Portfolio, LinkedIn or work examples link" type="url" placeholder="https://" required={false} maxLength={500} />
      <Field name="resume" label="PDF résumé — maximum 3 MB" type="file" accept="application/pdf,.pdf" required={false} />
    </div></fieldset>
    <fieldset><legend className="mb-4 text-xl font-bold">3. Availability &amp; travel</legend><div className="grid gap-5 sm:grid-cols-2"><Select name="engagement" label="Preferred working arrangement" /><Select name="startAvailability" label="When could you start?" /><Select name="licence" label="Current driver's licence" /><Select name="vehicle" label="Transport" /><div className="sm:col-span-2"><Field name="coverage" label="Areas you can travel to across Victoria" maxLength={500} placeholder="For example: Melbourne north and west, up to 50 km" /></div></div>
      <fieldset className="mt-5"><legend className="text-sm font-semibold text-slate-700">Days you are generally available * (choose at least one)</legend><div className="mt-3 flex flex-wrap gap-3">{CAREER_OPTIONS.days.map(day => <label key={day} className="flex items-center gap-2 text-sm"><input name="days" value={day} type="checkbox" className="size-4" />{day}</label>)}</div></fieldset>
      <div className="mt-5"><Field name="expectations" label="Pay / rate expectations (include hourly, daily or annual basis)" required={false} maxLength={500} /></div>
      <label className="mt-5 block text-sm font-semibold text-slate-700">Anything else, including support needed during recruitment (optional)<textarea name="adjustments" maxLength={1000} rows={3} className={inputClass} /></label>
    </fieldset>
    <div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <div className="space-y-4 border-t border-slate-200 pt-6"><p className="text-sm text-slate-500">Groutix uses your details and résumé to assess your application and contact you about recruitment. Access is limited to authorised hiring managers. Please do not upload identity documents, bank details or tax information. See our <Link className="text-blue-700 underline" href="/privacy-policy">privacy policy</Link> for contact details and information requests.</p><label className="flex items-start gap-3 text-sm text-slate-700"><input name="consent" type="checkbox" required className="mt-1 size-4 shrink-0" /><span>I confirm the information is accurate and consent to Groutix using my application for recruitment. *</span></label>
      {siteKey && <Turnstile ref={captcha} siteKey={siteKey} onSuccess={setToken} onExpire={() => setToken("")} onError={() => setToken("")} />}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      <button disabled={busy || Boolean(siteKey && !token)} className="rounded-xl bg-[#001F97] px-8 py-4 font-bold text-white hover:bg-blue-800 disabled:opacity-50">{busy ? "Submitting application…" : "Submit application"}</button>
    </div>
  </form>;
}
