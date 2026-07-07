"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";

export default function GallerySection() {
  const [activeTab, setActiveTab] = useState("all");

  const categories = [
    { id: "all", label: "All Work" },
    { id: "showers", label: "Showers" },
    { id: "floors", label: "Tiled Floors" },
    { id: "silicone", label: "Silicone Sealing" },
  ];

  const galleryItems = [
    {
      category: "showers",
      title: "Master Ensuite Shower",
      beforeDesc: "Water damaged shower wall grout lines with black mold and cracked corners.",
      afterDesc: "Fully regrouted and resealed base and corners, look like brand new tiles.",
    },
    {
      category: "floors",
      title: "Kitchen Floor Grout",
      beforeDesc: "Stained, black kitchen grout line stains from heavy traffic and grease.",
      afterDesc: "Fully scrubbed, regrouted with dark charcoal grout, beautifully matched.",
    },
    {
      category: "silicone",
      title: "Bathtub Silicone Seal",
      beforeDesc: "Worn, peeling silicone around bathtub edge with moisture leaks.",
      afterDesc: "Stripped and replaced with mold-resistant sanitary white silicone.",
    },
    {
      category: "showers",
      title: "Leaking Corner Sealing",
      beforeDesc: "Failing grout in vertical corner joints causing active sub-floor leaks.",
      afterDesc: "Vertical corner replaced with flexible polyurethane waterproof seal.",
    },
  ];

  const filteredItems =
    activeTab === "all"
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeTab);

  return (
    <section className="py-20 bg-neutral-50 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Before &amp; After Gallery
          </h2>
          <p className="text-neutral-600 text-lg">
            See the transformative results of our professional regrouting and silicone resealing services.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-5 py-2 rounded-full font-bold text-sm tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                activeTab === cat.id
                  ? "bg-primary text-white shadow-md"
                  : "bg-white text-neutral-600 hover:text-primary hover:bg-neutral-100 border border-neutral-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {filteredItems.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 shadow-md border border-neutral-100 flex flex-col space-y-4 hover:shadow-lg transition-shadow"
            >
              <h3 className="font-bold text-lg text-neutral-900">{item.title}</h3>
              
              {/* Before/After Split Placeholder */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Before Placeholder */}
                <div className="flex flex-col space-y-2">
                  <div className="bg-neutral-100 border border-neutral-200 rounded h-48 flex items-center justify-center relative overflow-hidden group">
                    <div className="text-center p-4">
                      <span className="absolute top-2 left-2 bg-red-600 text-white font-bold text-[11px] uppercase px-1.5 py-0.5 rounded tracking-wider shadow">
                        Before
                      </span>
                      <p className="font-bold text-neutral-500 uppercase tracking-widest text-[11px]">
                        Before Image Space
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-1">Add picture manually</p>
                    </div>
                    {/* Before grid pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800d_1px,transparent_1px),linear-gradient(to_bottom,#8080800d_1px,transparent_1px)] bg-[size:12px_12px]" />
                  </div>
                  <p className="text-sm text-neutral-500 leading-relaxed italic">
                    {item.beforeDesc}
                  </p>
                </div>

                {/* After Placeholder */}
                <div className="flex flex-col space-y-2">
                  <div className="bg-neutral-100 border border-neutral-200 rounded h-48 flex items-center justify-center relative overflow-hidden group">
                    <div className="text-center p-4">
                      <span className="absolute top-2 left-2 bg-emerald-600 text-white font-bold text-[11px] uppercase px-1.5 py-0.5 rounded tracking-wider shadow">
                        After
                      </span>
                      <p className="font-bold text-neutral-500 uppercase tracking-widest text-[11px]">
                        After Image Space
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-1">Add picture manually</p>
                    </div>
                    {/* After clean layout pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#001f9705_1px,transparent_1px),linear-gradient(to_bottom,#001f9705_1px,transparent_1px)] bg-[size:12px_12px]" />
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed font-semibold flex items-start space-x-1">
                    <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{item.afterDesc}</span>
                  </p>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
