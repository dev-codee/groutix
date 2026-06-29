import Image from "next/image";

export function ImagePlaceholder({
  label = "Image",
  className = "",
  src,
  alt,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
}: {
  label?: string;
  className?: string;
  src?: string;
  alt?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (src) {
    return (
      <div className={`relative overflow-hidden bg-ink-100 ${className}`}>
        <Image
          src={src}
          alt={alt ?? label}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-ink-100 to-ink-200 ${className}`}
      role="img"
      aria-label={`${label} placeholder`}
    >
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(0deg, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative flex flex-col items-center gap-2 text-ink-400">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="M4 18l5-5 4 4 3-3 4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-xs font-semibold">{label}</span>
      </div>
    </div>
  );
}
