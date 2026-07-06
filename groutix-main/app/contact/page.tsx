import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact & Free Quote — GROUTIX",
  description: "Get a free, obligation-free shower regrouting quote from GROUTIX. Call 7023 8094 or fill out our online form.",
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <ContactClient />
      <Footer />
    </>
  );
}
