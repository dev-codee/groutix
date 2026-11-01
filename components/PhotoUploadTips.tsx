import { Info } from "lucide-react";

export default function PhotoUploadTips() {
  return (
    <details className="group mt-2 rounded-lg border border-blue-100 bg-blue-50/60 text-left text-xs text-slate-700">
      <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 font-semibold text-[#1A2A8C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 [&::-webkit-details-marker]:hidden">
        <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
        How to take helpful photos
        <span className="ml-auto text-base group-open:hidden" aria-hidden="true">+</span>
        <span className="ml-auto hidden text-base group-open:inline" aria-hidden="true">−</span>
      </summary>
      <ol className="list-decimal space-y-1.5 px-3 pb-3 pl-8 leading-relaxed">
        <li><strong>Show the whole area.</strong> Step back and take a wide photo of the shower, bathroom, balcony or tiled area.</li>
        <li><strong>Show the problem up close.</strong> Photograph cracked grout, gaps in silicone, mould, damaged tiles or water stains. Include a second angle if helpful.</li>
        <li><strong>Keep it clear.</strong> Turn on the lights, wipe your camera lens and hold your phone steady. Check that the photo is in focus before uploading.</li>
      </ol>
      <p className="px-3 pb-3 leading-relaxed">Only photograph areas you can safely reach. Leave tiles and fittings in place.</p>
    </details>
  );
}
