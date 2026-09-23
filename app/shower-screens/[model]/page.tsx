import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SHOWER_SCREEN_MODELS, getModelById } from "@/lib/showerScreensData";
import ModelDetailClient from "./ModelDetailClient";

interface Props {
  params: Promise<{ model: string }>;
}

export async function generateStaticParams() {
  return SHOWER_SCREEN_MODELS.map((m) => ({
    model: m.id,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { model } = await params;
  const item = getModelById(model);
  if (!item) return {};

  return {
    title: item.metaTitle,
    description: item.metaDesc,
    alternates: { canonical: `/shower-screens/${item.id}` },
    openGraph: {
      title: item.metaTitle,
      description: item.metaDesc,
      url: `/shower-screens/${item.id}`,
      type: "website",
    },
  };
}

export default async function ModelDetailPage({ params }: Props) {
  const { model } = await params;
  const item = getModelById(model);

  if (!item) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <ModelDetailClient model={item} allModels={SHOWER_SCREEN_MODELS} />
      <Footer />
    </>
  );
}
