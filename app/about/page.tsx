import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldCheck, Award, Users, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — GROUTIX",
  description: "Learn about GROUTIX — Australia's trusted shower regrouting and tile sealing specialists since 2006.",
};

export default function AboutPage() {
  const values = [
    { icon: <ShieldCheck className="h-7 w-7 text-[#001F97]" />, title: "Honest advice", desc: "We only recommend what your bathroom actually needs — no upselling, no scare tactics." },
    { icon: <Award className="h-7 w-7 text-[#001F97]" />, title: "Done properly", desc: "We fix the root cause with quality materials so the problem stays fixed for the long run." },
    { icon: <Users className="h-7 w-7 text-[#001F97]" />, title: "Clean & respectful", desc: "We treat your home with care and leave every job site tidy when we're finished." },
    { icon: <Clock className="h-7 w-7 text-[#001F97]" />, title: "Local & reliable", desc: "A Melbourne-based team that turns up on time and does what we say we'll do." },
  ];

  const stats = [
    { value: "10-Year", label: "Waterproof Warranty" },
    { value: "Licensed", label: "& Fully Insured" },
    { value: "500+", label: "Showers Repaired" },
    { value: "100%", label: "Leak-Free Guarantee" },
  ];

  return (
    <>
      <Navbar />
      <main className="pt-[73px]">
        <section className="bg-[#001F97] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_35%)] text-white py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center">
            <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-white/90">
              About GROUTIX
            </p>
            <h1 className="mt-8 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Melbourne's leaking shower specialists
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-sm sm:text-base text-white/80 leading-relaxed">
              Melbourne's trusted leaking shower specialists. Permanent repairs backed by a 10-year waterproof warranty.
            </p>
          </div>
        </section>

        <section className="bg-[#071E5D] py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 grid gap-16 lg:grid-cols-2 items-center">
            <div className="space-y-8 text-white">
              <p className="text-sm uppercase tracking-[0.35em] text-[#97B1E5]">Who we are</p>
              <h2 className="text-4xl font-black leading-tight">
                A team that takes leaks seriously
              </h2>
              <p className="text-white/80 leading-relaxed text-base sm:text-lg">
                We built GROUTIX around a simple idea: most leaking showers can be fixed properly without tearing the whole bathroom apart. Too many homeowners are told they need a full renovation when a targeted, expert repair would do the job for a fraction of the cost.
              </p>
              <p className="text-white/80 leading-relaxed text-base sm:text-lg">
                Today we help households right across Melbourne stop leaks, beat mould and protect their homes — with workmanship we're proud to stand behind for a decade.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  "Specialists in leaking showers and waterproofing",
                  "Repairs that usually keep your tiles in place",
                  "Backed by a written 10-year warranty",
                  "Fully licensed and insured",
                ].map((item) => (
                  <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 h-[500px] flex items-center justify-center">
              <div className="text-center px-8">
                <p className="text-sm uppercase tracking-[0.35em] text-white/70">Team / workshop image</p>
                <p className="mt-2 text-[10px] text-white/40">Add image manually</p>
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>
          </div>
        </section>

        <section className="bg-[#071E5D] py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-center shadow-xl">
                  <p className="text-4xl font-black text-[#5C8AFE]">{stat.value}</p>
                  <p className="mt-3 text-sm uppercase tracking-[0.25em] text-white/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#0A1F5D] py-24 text-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center mb-14">
            <p className="text-sm uppercase tracking-[0.35em] text-[#97B1E5]">What we stand for</p>
            <h2 className="mt-4 text-5xl font-black leading-tight">
              The values behind every job
            </h2>
          </div>
          <div className="max-w-7xl mx-auto px-6 lg:px-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((item) => (
              <div key={item.title} className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl hover:bg-[#0F2C6E] transition">
                <div className="mb-6 h-14 w-14 rounded-3xl bg-[#0F3C8F] flex items-center justify-center text-xl font-black text-white">✓</div>
                <h3 className="text-xl font-black text-white">{item.title}</h3>
                <p className="mt-3 text-sm text-white/70 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 grid gap-12 xl:grid-cols-[1.03fr_0.97fr] items-start">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.35em] text-[#001F97]">Request A Quote</p>
              <h2 className="text-4xl font-black text-neutral-900">Ready to fix your shower for good?</h2>
              <p className="max-w-2xl text-neutral-600 leading-relaxed text-lg">
                Tell us about your bathroom issue and we’ll provide a same-day quote with clear pricing, realistic timing and a waterproof guarantee that stands behind the work.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-neutral-200 bg-[#F8FAFF] p-6">
                  <p className="text-xs uppercase tracking-[0.35em] text-[#5C8AFE]">Fast response</p>
                  <p className="mt-3 text-sm text-neutral-600 leading-relaxed">Our team reaches out quickly so your repair is booked fast.</p>
                </div>
                <div className="rounded-3xl border border-neutral-200 bg-[#F8FAFF] p-6">
                  <p className="text-xs uppercase tracking-[0.35em] text-[#5C8AFE]">Fixed pricing</p>
                  <p className="mt-3 text-sm text-neutral-600 leading-relaxed">No hidden charges — just transparent service from start to finish.</p>
                </div>
              </div>
            </div>
            <div className="rounded-[32px] border border-neutral-200 bg-[#F8FAFF] p-8 shadow-xl">
              <div className="mb-6">
                <p className="text-sm uppercase tracking-[0.35em] text-[#001F97]">Get a free quote</p>
                <h3 className="mt-3 text-3xl font-black text-neutral-900">Start your repair today</h3>
              </div>
              <form className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input type="text" placeholder="First Name" className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#001F97] focus:ring-2 focus:ring-[#001F97]/20" />
                  <input type="text" placeholder="Last Name" className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#001F97] focus:ring-2 focus:ring-[#001F97]/20" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input type="email" placeholder="Email" className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#001F97] focus:ring-2 focus:ring-[#001F97]/20" />
                  <input type="tel" placeholder="Phone" className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#001F97] focus:ring-2 focus:ring-[#001F97]/20" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input type="text" placeholder="Suburb / Postcode" className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#001F97] focus:ring-2 focus:ring-[#001F97]/20" />
                  <select className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#001F97] focus:ring-2 focus:ring-[#001F97]/20">
                    <option>Select State</option>
                    <option>VIC</option>
                    <option>NSW</option>
                    <option>QLD</option>
                    <option>WA</option>
                    <option>SA</option>
                  </select>
                </div>
                <textarea rows={4} placeholder="Tell us how we can help" className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#001F97] focus:ring-2 focus:ring-[#001F97]/20" />
                <button type="submit" className="w-full rounded-2xl bg-[#001F97] px-6 py-3 text-sm font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-[#001F97]/25 transition hover:bg-[#0025C0]">
                  Submit Request
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
