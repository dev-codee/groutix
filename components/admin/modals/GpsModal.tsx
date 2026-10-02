"use client";

import { useEffect, useState, useRef } from "react";
import { X, ExternalLink, MapPin, Navigation, Radio, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import type { Lead, GpsCheckin } from "@/components/admin/types";
import { fmtDate } from "@/lib/adminHelpers";

interface Props {
  lead: Lead;
  statusMessage: string;
  onClose: () => void;
  onCapture: (gps?: GpsCheckin) => void;
}

export function GpsModal({ lead, statusMessage, onClose, onCapture }: Props) {
  const [livePos, setLivePos] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
    time: string;
  } | null>(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const hasAutoSavedRef = useRef(false);
  // onCapture is re-created on every parent render, so hold it in a ref and keep
  // the geolocation watch out of its dependency list — otherwise each parent
  // re-render tears the watch down and restarts GPS acquisition from scratch.
  const onCaptureRef = useRef(onCapture);
  useEffect(() => {
    onCaptureRef.current = onCapture;
  });

  // Watch position in real time as long as this modal is open
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setErrorMsg("Geolocation is not supported in this browser.");
      return;
    }

    setTrackingActive(true);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          time: new Date().toISOString(),
        };
        setLivePos(coords);
        setErrorMsg("");

        // Auto-record check-in as soon as high accuracy GPS is acquired (without having to click!)
        if (!hasAutoSavedRef.current) {
          hasAutoSavedRef.current = true;
          setAutoSaved(true);
          onCaptureRef.current(coords);
        }
      },
      (err) => {
        setErrorMsg(`GPS signal: ${err.message}`);
        setTrackingActive(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const activeGps = livePos || lead.gps;

  const handleManualSync = () => {
    if (livePos) {
      setAutoSaved(true);
      onCapture(livePos);
    } else {
      onCapture();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        {/* Header with Live Beacon */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 relative" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Live GPS Location Tracker</h2>
              <div className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 uppercase tracking-wider">
                <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                <span>Real-Time Satellite Feed Active</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer & Address Details */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-0.5">
          <div className="font-bold text-slate-900">{lead.name || "Customer Property"}</div>
          <div className="text-slate-600">{lead.address || "No property address saved"}</div>
        </div>

        {/* Live GPS Card */}
        {activeGps ? (
          <div className="p-4 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-blue-50/40 border border-emerald-200 text-emerald-950 rounded-xl space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>Current Real-Time Location:</span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                Live
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white/90 p-2.5 rounded-lg border border-emerald-100">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Latitude</span>
                <span className="font-bold text-slate-900">{activeGps.lat.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Longitude</span>
                <span className="font-bold text-slate-900">{activeGps.lng.toFixed(6)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-emerald-900/90 pt-1">
              <div>
                <span className="font-medium">Accuracy: </span>
                <b>±{Math.round(activeGps.accuracy || 5)} meters</b>
              </div>
              <div>
                <span className="font-medium">Time: </span>
                <b>{new Date(activeGps.time || Date.now()).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</b>
              </div>
            </div>

            {/* Auto-save confirmation */}
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-bold bg-emerald-100/70 p-2 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Location recorded &amp; synced in real time (No click needed)</span>
            </div>

            <div className="pt-1">
              <a
                href={`https://www.google.com/maps?q=${activeGps.lat},${activeGps.lng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 underline"
              >
                <span>View My Current Pin on Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center space-y-2">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
            <div className="text-xs font-bold text-slate-700">Connecting to device GPS satellites...</div>
            <div className="text-[11px] text-slate-400">
              {errorMsg || statusMessage || "Streaming live location in real time..."}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          {lead.address && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lead.address)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 text-center flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Turn-by-Turn Driving Navigation</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleManualSync}
            className="w-full py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Force Re-sync Check-in</span>
          </button>
        </div>
      </div>
    </div>
  );
}
