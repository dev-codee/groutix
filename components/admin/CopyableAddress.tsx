"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyableAddress({ address }: { address?: string | null }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => setStatus("idle"), 2500);
    return () => clearTimeout(timer);
  }, [status]);
  if (!address?.trim()) return null;

  return <span className="inline-flex max-w-full min-w-0 items-center gap-1.5 text-slate-500">
    <span className="truncate select-text" title={address}>{address}</span>
    <button type="button" draggable={false} aria-label={`Copy address: ${address}`} title="Copy address"
      onDragStart={event => { event.preventDefault(); event.stopPropagation(); }}
      onClick={async event => {
        event.stopPropagation();
        try {
          await navigator.clipboard.writeText(address);
          setStatus("copied");
        } catch {
          setStatus("error");
        }
      }}
      className="inline-flex shrink-0 items-center gap-1 rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-blue-700 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600">
      {status === "copied" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
      <span role="status" className={status === "idle" ? "sr-only" : "text-[10px]"}>{status === "copied" ? "Copied" : status === "error" ? "Could not copy" : "Copy address"}</span>
    </button>
  </span>;
}
