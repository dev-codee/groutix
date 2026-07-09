import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

export const metadata: Metadata = {
  title: "Privacy & AI Policy",
  description: "Learn how GROUTIX handles your personal information and our responsible approach to using Artificial Intelligence.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[73px]">
        {/* Header Section */}
        <section className="bg-[#001F97] text-white py-16 lg:py-24">
          <div className="max-w-[1000px] mx-auto px-6 lg:px-10">
            <h1 className="text-4xl lg:text-5xl font-black mb-6">Privacy & AI Policy</h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-2xl">
              Thank you for considering GROUTIX for your grout, tile and repair needs. We value your trust in us, and we want you to feel secure and confident when you share your personal information with us.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="bg-white py-16 lg:py-24 text-neutral-800">
          <div className="max-w-[1000px] mx-auto px-6 lg:px-10 space-y-16">
            
            {/* Privacy Policy Block */}
            <div className="space-y-8">
              <div className="border-l-4 border-[#001F97] pl-4">
                <h2 className="text-2xl font-bold text-neutral-900">Privacy Policy</h2>
              </div>
              <p className="leading-relaxed text-neutral-700">
                This Privacy Policy explains how GROUTIX collects, uses and safeguards your personal information, and it applies to all of our customers, whether you engage with us in person, over the phone, by email or through our website.
              </p>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#001F97] uppercase tracking-wide">Privacy Statement</h3>
                <p className="leading-relaxed text-neutral-700">
                  GROUTIX is committed to respecting your privacy and, where applicable, handling Personal Information in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles. These principles provide standards and guidelines for the collection, use, disclosure, access, storage and protection of Personal Information that GROUTIX may obtain during the course of conducting business with you.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#001F97] uppercase tracking-wide">The Information We Collect From You</h3>
                <p className="leading-relaxed text-neutral-700">
                  In order to provide you with products or services, GROUTIX may ask for personal details such as your name, address, telephone number, email address or other information relevant to your enquiry or requested service. We may also collect photographs, videos or information relating to showers, bathrooms, balconies, tiled areas or property damage where this information is provided for quoting, inspection or service purposes.
                </p>
                <p className="leading-relaxed text-neutral-700">
                  Where Personal Information is collected about you from another source, such as a landlord, tenant, property manager, real estate agent or authorised representative, GROUTIX may take reasonable steps, where appropriate, to ensure that you are made aware of GROUTIX collecting Personal Information about you and how you can contact GROUTIX regarding the collection of such information; how you can request access to the Personal Information collected; why GROUTIX collected the Personal Information; and who GROUTIX may usually disclose such Personal Information to.
                </p>
                <p className="leading-relaxed text-neutral-700">
                  You have no obligation to provide information requested by GROUTIX. However, GROUTIX may not be able to provide you with certain quotations, inspections, bookings, products or services where those products or services depend on the collection of relevant information.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#001F97] uppercase tracking-wide">Cookie Information</h3>
                <p className="leading-relaxed text-neutral-700">
                  As you browse the GROUTIX website and other websites, cookies and similar technologies may be placed on your device by us or third-party service providers we work with. These technologies may be used to understand website activity, improve website performance, measure advertising effectiveness, understand user interests and provide more relevant advertising.
                </p>
                <p className="leading-relaxed text-neutral-700">
                  You may be able to manage or disable cookies through your browser settings, although doing so may affect certain website functions.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#001F97] uppercase tracking-wide">How Your Information Is Used</h3>
                <p className="leading-relaxed text-neutral-700">
                  The Personal Information collected is generally used to provide you with the relevant products or services you have requested. GROUTIX uses your Personal Information for the purpose for which it was disclosed. We may, however, use your Personal Information to provide you with information about our products and services that we believe may be of interest to you, and we may use your Personal Information for marketing and promotional purposes. Where applicable, we will provide you with the option to opt out of receiving such communications.
                </p>
                <p className="leading-relaxed text-neutral-700">
                  GROUTIX does not provide, rent or sell Personal Information to other organisations; however, GROUTIX may disclose Personal Information to service providers in connection with providing products or services to you.
                </p>
                <p className="leading-relaxed text-neutral-700">
                  By providing your Personal Information to GROUTIX, you acknowledge and consent that GROUTIX may collect and use your Personal Information for the purposes disclosed to you; that you are authorised to provide such information to GROUTIX; and that relevant information may be disclosed on a confidential basis to third-party contractors, agents or suppliers involved in providing products or services to you.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[#001F97] uppercase tracking-wide">Keeping Information Accurate</h3>
                  <p className="leading-relaxed text-neutral-700">
                    You may contact GROUTIX at any time if you believe the Personal Information held about you is inaccurate, incomplete or out of date. GROUTIX may take reasonable steps to correct or update the information where appropriate.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[#001F97] uppercase tracking-wide">Keeping Information Secure</h3>
                  <p className="leading-relaxed text-neutral-700">
                    GROUTIX takes reasonable measures to ensure your Personal Information is protected from unauthorised access, loss, misuse, disclosure or alteration. Personal Information may be stored in different ways, including electronically and physically. GROUTIX may use security procedures and access controls to protect Personal Information held in connection with our business.
                  </p>
                  <p className="leading-relaxed text-neutral-700">
                    Access to and use of Personal Information within GROUTIX is limited where reasonably appropriate to team members, contractors or service providers who require the information for legitimate business or service-related purposes.
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-neutral-200 w-full" />

            {/* AI Policy Block */}
            <div className="space-y-8">
              <div className="border-l-4 border-accent pl-4">
                <h2 className="text-2xl font-bold text-neutral-900">AI Usage Policy</h2>
              </div>
              <p className="leading-relaxed text-neutral-700">
                At GROUTIX, we are committed to delivering excellent service while protecting your privacy and being transparent about how we use technology. This policy explains how we may use Artificial Intelligence (“AI”) in our business, how information may be handled, and our commitment to responsible AI practices.
              </p>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#001F97] uppercase tracking-wide">Purpose of AI at GROUTIX</h3>
                <p className="leading-relaxed text-neutral-700">
                  We may use AI tools to improve customer service and streamline business operations. AI may help us respond more efficiently to customer enquiries, assist with administrative tasks, support scheduling and quoting processes, improve written communications, organise information, and help our team work more efficiently.
                </p>
                <p className="leading-relaxed text-neutral-700 font-medium">
                  AI is used as a support tool for our team and is not a replacement for professional judgment, practical experience or on-site assessment. Final service recommendations, quotations and repair decisions remain subject to human review and the information available to GROUTIX.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#001F97] uppercase tracking-wide">Compliance with Australian Law</h3>
                <div className="space-y-2">
                  <h4 className="font-bold text-neutral-900">Privacy Act 1988 (Cth)</h4>
                  <p className="leading-relaxed text-neutral-700">
                    Where applicable, GROUTIX handles Personal Information in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles. Where AI tools are used in connection with business operations, we aim to handle Personal Information consistently with our Privacy Policy and applicable privacy obligations. GROUTIX does not sell or trade customer Personal Information through the use of AI tools.
                  </p>
                </div>
                <div className="space-y-2 mt-4">
                  <h4 className="font-bold text-neutral-900">Australian Consumer Law</h4>
                  <p className="leading-relaxed text-neutral-700">
                    GROUTIX is committed to honest and transparent communication with customers. AI may assist with communications, administration and internal processes, but it does not replace human judgment, trade experience or physical inspection where an on-site assessment is required. Final quotations, recommendations and service decisions may be reviewed by our team based on the information available at the time.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#001F97] uppercase tracking-wide">Data Security & Information Handling</h3>
                <p className="leading-relaxed text-neutral-700">
                  Protecting customer information is important to GROUTIX. We may use reputable technology and AI service providers to support our business operations.
                </p>
                <p className="leading-relaxed text-neutral-700">
                  We take reasonable steps to manage access to customer information and limit its use to legitimate business purposes. Where customer information is processed using third-party technology or AI services, that information may also be subject to the relevant provider’s security, privacy and data-handling practices.
                </p>
                <p className="leading-relaxed text-neutral-700">
                  We aim to avoid sharing unnecessary Personal Information with AI tools and use information only where reasonably relevant to the intended business purpose.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[#001F97] uppercase tracking-wide">What AI is NOT Used For</h3>
                  <p className="leading-relaxed text-neutral-700">
                    AI is not used as a substitute for physical inspection where an on-site assessment is required. AI does not perform repair work, replace trade judgment or independently guarantee the cause of a leak, waterproofing failure, grout issue, tile defect or other property problem.
                  </p>
                  <p className="leading-relaxed text-neutral-700">
                    AI-generated information may be reviewed, corrected or supplemented by the GROUTIX team before being relied upon for customer service or business purposes.
                  </p>
                </div>
                <div className="space-y-4 bg-neutral-50 p-6 rounded-sm border border-neutral-100">
                  <h3 className="text-lg font-bold text-[#001F97] uppercase tracking-wide">Our Commitment</h3>
                  <p className="leading-relaxed text-neutral-700">
                    At GROUTIX, people and quality workmanship come first. AI is simply a tool that may help make our service faster, clearer and more efficient. Every physical repair is completed by our team or engaged service professionals, with workmanship and repair decisions based on the actual scope of work and site conditions.
                  </p>
                </div>
              </div>
              
              <div className="pt-4 text-sm text-neutral-500">
                <p>This policy may be reviewed and updated from time to time to reflect changes in technology, business practices, legal requirements and customer needs.</p>
                <p className="mt-1">Last updated: July 2026</p>
              </div>
            </div>

            {/* Contact Section */}
            <div className="bg-[#001F97]/5 p-8 rounded-sm border border-[#001F97]/10 mt-12 text-center">
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Contact Us</h3>
              <p className="text-neutral-700 mb-4">
                If you have any questions or concerns about this Privacy Policy or our use of AI, please contact us at:
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
