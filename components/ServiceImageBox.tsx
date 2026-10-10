import Image from "next/image";

export default function ServiceImageBox({
  label,
  aspect = "aspect-[4/3]",
  className = "",
  src,
  objectFit = "cover",
  showBeforeAfterBadges = false,
}: {
  label: string;
  aspect?: string;
  className?: string;
  src?: string;
  objectFit?: "cover" | "contain";
  showBeforeAfterBadges?: boolean;
}) {
  return (
    <div
      className={`relative ${aspect} w-full overflow-hidden ${className} rounded-xl border-2 border-transparent hover:border-[#F5A623] transition-all duration-300`}
      style={{
        boxShadow: "inset 0 2px 8px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)"
      }}
    >
      {/* Decorative corner elements */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#F5A623] z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#F5A623] z-10 pointer-events-none" />

      {/* Before & After Badges in top corners */}
      {showBeforeAfterBadges && (
        <>
          <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
            <span className="bg-black/75 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm border border-white/10">
              Before
            </span>
          </div>
          <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none">
            <span className="bg-[#001F97]/90 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm border border-white/20">
              After
            </span>
          </div>
        </>
      )}

      {src ? (
        <Image
          src={src}
          alt={label}
          fill
          className={`${objectFit === "contain" ? "object-contain p-2" : "object-cover"} transition-transform duration-500 hover:scale-105`}
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-neutral-100 border border-neutral-200" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px]" />
          <div className="relative z-10 flex h-full items-center justify-center text-center px-4">
            <div className="space-y-1">
              <p className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest">{label}</p>
              <p className="text-[12px] text-neutral-300">Add photo manually</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

