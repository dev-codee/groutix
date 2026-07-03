import React from "react";

export default function LogoCarousel() {
  const logos = [
    { name: "Channel 9 News" },
    { name: "Herald Sun" },
    { name: "The West Australian" },
    { name: "Product Review 5-Star" },
    { name: "Google Business Rated" },
    { name: "HIA Member" },
  ];

  return (
    <section className="py-10 bg-neutral-100 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col space-y-4 items-center justify-center">
          <p className="text-xs uppercase font-extrabold tracking-widest text-neutral-400">
            Trusted by Builders &amp; Featured in Media
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 w-full">
            {logos.map((logo, i) => (
              <div
                key={i}
                className="h-10 w-32 bg-white rounded border border-neutral-200 flex items-center justify-center shadow-sm select-none hover:shadow transition-shadow px-2"
              >
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider text-center">
                  {logo.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
