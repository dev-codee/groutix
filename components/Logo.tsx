import React from "react";

export default function Logo({ light = false }: { light?: boolean }) {
  const textColor = light ? "text-white" : "text-primary";
  const subColor = light ? "text-white/70" : "text-neutral-500";

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Stylized Emblem G */}
      <svg
        width="38"
        height="38"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Outer Ring of G (white/primary segments) */}
        <path
          d="M 50 10 
             A 40 40 0 1 0 50 90 
             A 40 40 0 0 0 90 50 
             L 70 50 
             A 20 20 0 0 1 50 70 
             A 20 20 0 1 1 50 30 
             A 20 20 0 0 1 70 50 
             L 90 50 
             A 40 40 0 0 0 50 10 Z"
          fill={light ? "#FFFFFF" : "#001F97"}
        />

        {/* Segment separator lines (making it look like segmented tiles) */}
        <line x1="50" y1="10" x2="50" y2="30" stroke={light ? "#001F97" : "#FFFFFF"} strokeWidth="3" />
        <line x1="21.7" y1="21.7" x2="35.9" y2="35.9" stroke={light ? "#001F97" : "#FFFFFF"} strokeWidth="3" />
        <line x1="10" y1="50" x2="30" y2="50" stroke={light ? "#001F97" : "#FFFFFF"} strokeWidth="3" />
        <line x1="21.7" y1="78.3" x2="35.9" y2="64.1" stroke={light ? "#001F97" : "#FFFFFF"} strokeWidth="3" />
        <line x1="50" y1="70" x2="50" y2="90" stroke={light ? "#001F97" : "#FFFFFF"} strokeWidth="3" />

        {/* Bottom wave representing sealant/water (Blue wave) */}
        <path
          d="M 12 60 
             C 25 75, 45 80, 65 75 
             C 75 70, 85 58, 88 50 
             L 70 50 
             C 65 60, 55 68, 50 70 
             C 40 70, 30 65, 23 58 
             Z"
          fill="#2F63CC"
        />

        {/* Inner highlights to make it modern & premium */}
        <path
          d="M 18 68
             C 30 78, 48 82, 62 76"
          stroke="#97B1E5"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      {/* Brand Name & Tagline */}
      <div className="flex flex-col justify-center leading-none">
        <div className={`flex items-baseline font-black tracking-wider text-xl ${textColor}`}>
          <span>GROUTI</span>
          <span className="text-[#2F63CC] font-black">X</span>
        </div>
        <span className={`text-[7px] font-bold tracking-widest uppercase mt-0.5 whitespace-nowrap ${subColor}`}>
          Stay Sealed, Stay Smiling.
        </span>
      </div>
    </div>
  );
}
