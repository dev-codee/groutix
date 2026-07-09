import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for GROUTIX services and website usage.",
  alternates: { canonical: "/terms-conditions" },
};

export default function TermsConditionsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[73px]">
        {/* Header Section */}
        <section className="bg-[#001F97] text-white py-16 lg:py-24">
          <div className="max-w-[1000px] mx-auto px-6 lg:px-10">
            <h1 className="text-4xl lg:text-5xl font-black mb-6">Terms & Conditions</h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-2xl">
              Please read these terms and conditions carefully before using our services or website.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="bg-white py-16 lg:py-24 text-neutral-800">
          <div className="max-w-[1000px] mx-auto px-6 lg:px-10 space-y-16">
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#001F97] uppercase tracking-wide">Website Terms of Use</h3>
                <p className="leading-relaxed text-neutral-700">
                  By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using this website's particular services, you shall be subject to any posted guidelines or rules applicable to such services.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#001F97] uppercase tracking-wide">Service Conditions</h3>
                <p className="leading-relaxed text-neutral-700">
                  Detailed terms and conditions regarding quotes, warranty limitations, and service provisions will be provided directly to clients alongside formal quotations and invoices.
                </p>
              </div>
            </div>

            {/* Contact Section */}
            <div className="bg-[#001F97]/5 p-8 rounded-sm border border-[#001F97]/10 mt-12 text-center">
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Questions?</h3>
              <p className="text-neutral-700 mb-4">
                If you have any questions about our terms and conditions, please contact us at:
              </p>
              <a href="mailto:info@groutix.com" className="inline-flex font-bold text-[#001F97] hover:text-accent transition-colors underline">
                info@groutix.com
              </a>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
