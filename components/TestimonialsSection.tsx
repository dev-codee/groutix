import React from "react";
import { Star, ShieldCheck } from "lucide-react";

export default function TestimonialsSection() {
  const reviews = [
    {
      name: "Sarah Jenkins",
      location: "Perth, WA",
      rating: 5,
      title: "Super professional & quick!",
      content: "Groutix tech showed up right on time. Our ensuite shower was leaking into the hallway wall. He replaced the old grout in less than 3 hours, and the shower looks brand new. Highly recommend!",
      date: "2 weeks ago",
    },
    {
      name: "David Chen",
      location: "Melbourne, VIC",
      rating: 5,
      title: "Saved us thousands on tiling",
      content: "We were told we had to completely retile our bathroom because of a slow leak. Groutix checked it out and said a simple regrout and silicone reseal would fix it. It did, and saved us over $4,000!",
      date: "1 month ago",
    },
    {
      name: "Rebecca Taylor",
      location: "Sydney, NSW",
      rating: 5,
      title: "Mould is totally gone",
      content: "Our shower base grout was black with mould that wouldn't come off. The tech stripped it all and laid fresh white grout. It looks completely spotless. Very neat, clean worker.",
      date: "3 weeks ago",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            What Our Customers Say
          </h2>
          <p className="text-neutral-600 text-lg">
            We're focused on delivering great service. Read real reviews from homeowners who trust us with their showers.
          </p>
          <div className="flex items-center justify-center space-x-2 pt-2">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <span className="text-base font-bold text-neutral-800">
              5.0/5 Average Rating (236+ Reviews)
            </span>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, i) => (
            <div
              key={i}
              className="bg-white border border-neutral-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative"
            >
              <div className="space-y-4">
                {/* Stars */}
                <div className="flex text-amber-400">
                  {[...Array(review.rating)].map((_, index) => (
                    <Star key={index} className="h-4.5 w-4.5 fill-current" />
                  ))}
                </div>

                {/* Review Content */}
                <div className="space-y-2">
                  <h3 className="font-bold text-base text-neutral-900">{review.title}</h3>
                  <p className="text-base text-neutral-600 leading-relaxed">
                    &ldquo;{review.content}&rdquo;
                  </p>
                </div>
              </div>

              {/* Reviewer Details */}
              <div className="pt-6 mt-6 border-t border-neutral-100 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold text-neutral-900 text-base">{review.name}</div>
                  <div className="text-sm text-neutral-500">{review.location}</div>
                </div>
                <div className="flex items-center space-x-1 text-emerald-600 text-[12px] font-bold bg-emerald-50 px-2 py-1 rounded">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Verified Job</span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
