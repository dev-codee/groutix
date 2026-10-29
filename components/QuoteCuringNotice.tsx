import Image from "next/image";

/** Compact notice shared by the staff preview and customer quotation. */
export function QuoteCuringNotice() {
  return (
    <div className="my-2 w-full max-w-[480px] break-inside-avoid">
      <Image
        src="/groutix-curing-time.jpeg"
        width={1600}
        height={533}
        sizes="(max-width: 520px) 100vw, 480px"
        className="block h-auto w-full"
        alt="Curing time: use the work area after 24 hours for silicone, 48 hours for polymer grout, and 4 days for epoxy grout or injection resin. Avoid water and foot traffic on repaired tiles for 4 days."
      />
    </div>
  );
}
