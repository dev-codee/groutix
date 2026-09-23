import { Review } from "@/lib/reviews";
/* eslint-disable @next/next/no-img-element */

// Using Lucide-react for the verified badge if we don't have a custom one
import { BadgeCheck } from "lucide-react";

export default function ReviewCard({ review, className }: { review: Review; className?: string }) {
  const avatarFallback = review.name ? review.name.charAt(0).toUpperCase() : "G";

  return (
    <div className={`bg-white border border-neutral-200 rounded-2xl p-6 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-full ${className || ""}`}>
      {/* Top Row: Avatar, Name, Time, Google Logo */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {review.photoUri ? (
            <img
              src={review.photoUri}
              alt={review.name}
              className="w-12 h-12 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#1A73E8] text-white flex items-center justify-center font-bold text-xl">
              {avatarFallback}
            </div>
          )}
          <div>
            <h3 className="font-bold text-neutral-900 text-[15px] leading-tight">
              {review.name}
            </h3>
            <p className="text-[13px] text-neutral-500 mt-0.5">
              {review.suburb}
            </p>
          </div>
        </div>
        <img
          src="/google-logo.svg"
          alt="Google"
          className="w-6 h-6 shrink-0"
          onError={(e) => {
            // Fallback if svg isn't present
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      {/* Middle Row: Stars & Badge */}
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: review.stars }).map((_, j) => (
          <svg
            key={j}
            className="h-5 w-5 text-[#FBBC04] fill-current"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <BadgeCheck className="w-[18px] h-[18px] text-[#1A73E8] ml-1 fill-[#1A73E8] stroke-white" />
      </div>

      {/* Bottom Row: Review Text */}
      <p className="text-[15px] text-neutral-800 leading-relaxed font-normal">
        {review.review}
      </p>
    </div>
  );
}
