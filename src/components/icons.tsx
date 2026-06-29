import type { SVGProps } from "react";

const base = (props: SVGProps<SVGSVGElement>) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export const Icon = {
  Droplet: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M12 3s6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 6-11 6-11z" />
    </svg>
  ),
  Grid: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  ),
  Brush: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M14 3l7 7-7 4-4-4 4-7z" />
      <path d="M10 10l-5 5a3 3 0 1 0 4 4l5-5" />
    </svg>
  ),
  Tools: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2l-6 6 2.2 2.2 6-6a4 4 0 0 0 5.2-5.4l-2.5 2.5-2.2-2.2 2.7-2.1z" />
    </svg>
  ),
  Radar: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  ),
  Building: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3" />
    </svg>
  ),
  Shield: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  Clock: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  Coins: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </svg>
  ),
  Layers: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </svg>
  ),
  Alert: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M12 4l9 16H3l9-16z" />
      <path d="M12 10v4M12 17.5v.5" />
    </svg>
  ),
  Quote: (p: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M7 7H4v6h4v-2H6.5C6 11 6 9 8 9V7zm9 0h-3v6h4v-2h-1.5c-.5 0-.5-2 1.5-2V7z" />
    </svg>
  ),
};

export const serviceIcons: Record<string, (p: SVGProps<SVGSVGElement>) => React.ReactElement> = {
  "leaking-showers": Icon.Droplet,
  regrouting: Icon.Grid,
  retiling: Icon.Layers,
  "bathroom-renovations": Icon.Tools,
  "leak-detection": Icon.Radar,
  balconies: Icon.Building,
};
