import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import CareerApplicationForm from "@/components/CareerApplicationForm";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Careers",
  description: "Apply for inspector / estimator and repair technician roles at Groutix. Help restore showers, tiles and wet areas across Victoria.",
  alternates: { canonical: "/careers" },
  openGraph: {
    title: "Careers | Groutix",
    description: "Join the Groutix team and build a rewarding career in property maintenance and tiling repairs.",
    url: "/careers",
    type: "website",
  },
};

export default function CareersPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[110px] lg:pt-[125px]">
        {/* Hero Section */}
        <section className="bg-[#001F97] text-white relative py-20 lg:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.10)_0,rgba(255,255,255,0.10)_6px,transparent_6px),linear-gradient(90deg,rgba(255,255,255,0.10)_0,rgba(255,255,255,0.10)_6px,transparent_6px)] bg-[size:150px_150px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.10),transparent_45%)] pointer-events-none" />

          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 text-center relative z-10">
            <p className="inline-flex rounded-sm border border-white/20 bg-white/10 px-4 py-2 text-[13px] uppercase tracking-[0.35em] text-white/90 font-bold">
              Join Our Team
            </p>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Careers at Groutix
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-white/80 leading-relaxed">
              We’re accepting applications for inspectors and repair technicians to help customers restore showers, tiles and wet areas across Victoria.
            </p>
            <a href="#apply" className="mt-8 inline-block rounded-xl bg-white px-7 py-3 font-bold text-[#001F97]">View roles &amp; apply</a>
          </div>
        </section>

        {/* Content Section */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 leading-tight">
              Why Work With <span className="text-accent">Groutix?</span>
            </h2>
            <p className="text-neutral-600 leading-relaxed text-lg">
              At Groutix, we take pride in our work. We believe in providing honest advice, expert workmanship, and dependable service. When you join our team, you become part of a growing company that values its employees and invests in their success.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 pt-8 text-left">
              {[
                "Practical repair and restoration work",
                "A focus on quality workmanship",
                "Clear communication with customers",
                "Opportunities across Victoria",
                "Inspector and technician roles",
                "Tell us your experience and availability"
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#F3F4F6] px-5 py-4 rounded-sm">
                  <div className="w-6 h-6 flex items-center justify-center bg-[#001F97] text-white rounded-full flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-[14px] font-bold text-neutral-800 tracking-wide">{benefit}</span>
                </div>
              ))}
            </div>


          </div>
        </AnimatedSection>
        <section id="apply" className="scroll-mt-32 bg-slate-50 py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-3xl font-bold">Find your place at Groutix</h2>
            <p className="mt-3 text-slate-600">Apply for the role that fits your strengths. Working arrangements, rates and equipment will be discussed during recruitment.</p>
            <div className="my-8 grid gap-5 sm:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Assess &amp; advise</p><h3 className="mt-2 text-xl font-bold">Inspector / Estimator</h3><p className="mt-3 text-sm leading-6 text-slate-600">Assess shower and wet-area issues, document findings with photos, measure repair areas, prepare scopes and quotes, and explain options clearly to customers.</p></article>
              <article className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Repair &amp; restore</p><h3 className="mt-2 text-xl font-bold">Repair Technician</h3><p className="mt-3 text-sm leading-6 text-slate-600">Carry out regrouting, silicone replacement, tile and shower repairs within your skills and qualifications. Work safely, protect customers’ homes and record completed work.</p></article>
            </div>
            <h2 className="mb-5 text-2xl font-bold">Apply to join the team</h2>
            <CareerApplicationForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
