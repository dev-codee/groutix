"use client";

import { X, ExternalLink } from "lucide-react";
import type { Lead } from "@/components/admin/types";
import { fmtDate } from "@/lib/adminHelpers";

interface Props {
  lead: Lead;
  statusMessage: string;
  onClose: () => void;
  onCapture: () => void;
}

export function GpsModal({ lead, statusMessage, onClose, onCapture }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-black text-slate-900">Inspection GPS Check-in</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-slate-600 space-y-2">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="font-bold text-slate-800">{lead.name}</div>
            <div>{lead.address || "No address saved"}</div>
          </div>

          {lead.gps ? (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl space-y-1">
              <div className="font-black">GPS Check-in Recorded:</div>
              <div>Latitude: {lead.gps.lat.toFixed(6)}</div>
              <div>Longitude: {lead.gps.lng.toFixed(6)}</div>
              <div>Accuracy: ±{Math.round(lead.gps.accuracy || 0)}m</div>
              <div>Time: {fmtDate(lead.gps.time)}</div>
              <a
                href={`https://www.google.com/maps?q=${lead.gps.lat},${lead.gps.lng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 underline mt-1"
              >
                Open Location in Google Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <div className="text-center py-4 text-slate-400">
              {statusMessage || "No GPS check-in recorded yet."}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={onCapture}
            className="w-full py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
          >
            Record Current GPS Location
          </button>
          {lead.address && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lead.address)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 text-center shadow-2xs transition-colors"
            >
              Navigate to Customer Property
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
