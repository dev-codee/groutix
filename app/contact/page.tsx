import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QuoteForm from "@/components/QuoteForm";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact & Free Quote — GROUTIX",
  description: "Get a free, obligation-free shower regrouting quote from GROUTIX. Call 7023 8094 or fill out our online form.",
};

export default function ContactPage() {
  const contactInfo = [
    { icon: <Phone className="h-5 w-5 text-secondary" />, label: "Call Today", value: "7023 8094", href: "tel:70238094" },
    { icon: <Mail className="h-5 w-5 text-secondary" />, label: "Email", value: "info@groutix.com.au", href: "mailto:info@groutix.com.au" },
    { icon: <Clock className="h-5 w-5 text-secondary" />, label: "Office Hours", value: "Mon – Fri: 8:00am – 5:00pm", href: null },
    { icon: <MapPin className="h-5 w-5 text-secondary" />, label: "Locations", value: "Perth, Melbourne, Sydney, Brisbane, Adelaide, Geelong", href: "/locations" },
  ];

  return (
    <>
      <Navbar />
      <main className="pt-[73px]">
        {/* Header */}
        <section className="bg-primary py-20 text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Get a Free Quote</h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Fill out the form below or call us free. We will contact you within 1 business hour.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-20 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left: Contact Info */}
            <div className="space-y-10">
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-neutral-900">Contact Information</h2>
                <p className="text-neutral-600 leading-relaxed">
                  Our friendly team is ready to help you solve your shower leak or tile issue. Contact us by phone, email, or use the quote form and we will get back to you fast.
                </p>
              </div>
              <ul className="space-y-6">
                {contactInfo.map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">{item.icon}</div>
                    <div>
                      <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="font-bold text-neutral-900 hover:text-primary transition-colors">{item.value}</a>
                      ) : (
                        <p className="font-bold text-neutral-900">{item.value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Map placeholder */}
              <div className="bg-neutral-200 border border-neutral-300 rounded-xl h-56 flex items-center justify-center relative overflow-hidden">
                <div className="text-center">
                  <p className="font-bold text-neutral-500 uppercase tracking-widest text-xs">Map / Location Image</p>
                  <p className="text-[10px] text-neutral-400 mt-1">Add Google Maps embed or image manually</p>
                </div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
              </div>
            </div>

            {/* Right: Quote Form */}
            <div>
              <QuoteForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
