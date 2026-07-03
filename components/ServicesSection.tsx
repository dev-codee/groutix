import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/* ─── Shared image placeholder ─── */
function ImgBox({ label }: { label: string }) {
  return (
    <div className="relative aspect-[4/3] w-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center rounded-sm">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px]" />
      <div className="relative text-center px-4 space-y-1">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{label}</p>
        <p className="text-[10px] text-neutral-300">Picture space - add manually</p>
      </div>
    </div>
  );
}

export default function ServicesSection() {
  const services = [
    {
      id: "shower-regrouting",
      title: "Shower Regrouting",
      description: "Shower regrouting is our core specialty. We remove failing grout and regrout the shower using durable, moisture-resistant grout designed for high-use wet areas.",
      imageLabel: "Shower Regrouting Service Image",
    },
    {
      id: "shower-base-repair",
      title: "Shower Base Repair",
      description: "We repair cracked, leaking and damaged shower bases to restore the waterproof floor without full demolition.",
      imageLabel: "Shower Base Repair Service Image",
    },
    {
      id: "tile-regrouting",
      title: "Tile Regrouting",
      description: "Our tile regrouting service refreshes tired or stained grout lines throughout bathrooms, laundries, kitchens, balconies and other tiled areas.",
      imageLabel: "Tile Regrouting Service Image",
    },
    {
      id: "leaking-shower-repair",
      title: "Leaking Shower Repair",
      description: "Leaking showers require more than sealant. We identify where water is escaping, repair compromised grout and seals and fully regrout the shower to restore complete waterproof integrity.",
      imageLabel: "Leaking Shower Repair Image",
    },
    {
      id: "small-tiling-jobs",
      title: "Small Tiling Jobs",
      description: "For loose, cracked or damaged tiles, we provide small tiling repairs that integrate seamlessly with existing finishes, ideal when isolated tiles need replacement.",
      imageLabel: "Small Tiling Jobs Image",
    },
    {
      id: "real-estate-property-services",
      title: "Real Estate & Property Services",
      description: "We partner with residential property managers, investors, strata companies and commercial owners to protect the most used wet areas of their properties.",
      imageLabel: "Real Estate & Property Image",
    },
  ];

  return (
    <section className="py-16 lg:py-24 bg-white border-t border-neutral-100" id="services">
      <div className="max-w-[1460px] mx-auto px-6 lg:px-10">

        {/* Header */}
        <div className="space-y-3 mb-12">
          <h2 className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight">
            Our <span className="text-[#001F97]">Services</span>
          </h2>
          <p className="text-neutral-500 text-sm sm:text-[16px]">
            GROUTIX provides specialist tile and grout services for residential and commercial properties across Australia.
          </p>
        </div>

        {/* Services Grid — image top, content below (matching reference site cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <div
              key={i}
              className="bg-white border border-neutral-200 overflow-hidden flex flex-col group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 rounded-sm"
            >
              {/* Image Placeholder */}
              <ImgBox label={service.imageLabel} />

              {/* Content */}
              <div className="p-6 space-y-3 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-neutral-900 group-hover:text-[#001F97] transition-colors duration-200">
                  {service.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed flex-1">
                  {service.description}
                </p>
                <Link
                  href={`/${service.id}`}
                  className="inline-flex items-center gap-1.5 text-[#001F97] group-hover:text-[#2F63CC] font-semibold text-sm tracking-wide transition-colors mt-2"
                >
                  <span>Learn more</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </div>
            </div>
          ))}

          {/* 6th Card: Request A Quote */}
          <div className="relative border border-[#001F97] rounded-sm overflow-hidden flex flex-col justify-end p-8 bg-[#001F97] text-white min-h-[350px] hover:bg-[#0027C0] transition-all duration-300">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:24px_24px] z-0" />
            <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
              <span className="text-white/10 font-bold text-xs uppercase tracking-widest">Bathroom Photo Place</span>
            </div>
            <div className="relative z-10 space-y-4">
              <h3 className="text-3xl font-black tracking-tight text-white">Request A Quote</h3>
              <Link
                href="/contact"
                className="inline-block bg-[#2F63CC] hover:bg-[#264FA3] text-white font-bold px-6 py-3 rounded-sm text-sm tracking-wide transition-colors shadow"
              >
                Get In Touch
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
