"use client";

import { useEffect, useCallback } from "react";
import { X, Download, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

interface Photo {
  name: string;
  url: string;
}

interface Props {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function PhotoLightbox({ photos, index, onClose, onNavigate }: Props) {
  const photo = photos[index];
  const total = photos.length;
  const hasPrev = index > 0;
  const hasNext = index < total - 1;

  const goPrev = useCallback(() => { if (hasPrev) onNavigate(index - 1); }, [hasPrev, index, onNavigate]);
  const goNext = useCallback(() => { if (hasNext) onNavigate(index + 1); }, [hasNext, index, onNavigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goPrev, goNext, onClose]);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 text-white">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold truncate max-w-xs">{photo.name}</span>
            {total > 1 && (
              <span className="text-[10px] font-bold text-slate-400 shrink-0">
                {index + 1} / {total}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/admin/download-photo?url=${encodeURIComponent(photo.url)}&name=${encodeURIComponent(photo.name)}`}
              download
              className="flex items-center gap-1 text-xs px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
            <a
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Original
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image + side arrows */}
        <div className="relative p-2 flex items-center justify-center bg-black/40 max-h-[80vh] overflow-auto">
          {total > 1 && (
            <button
              type="button"
              onClick={goPrev}
              disabled={!hasPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              title="Previous photo (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={photo.url}
            src={photo.url}
            alt={photo.name}
            className="max-h-[75vh] max-w-full object-contain rounded-lg"
          />

          {total > 1 && (
            <button
              type="button"
              onClick={goNext}
              disabled={!hasNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              title="Next photo (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Dot indicators */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-2 bg-slate-900/80">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onNavigate(i)}
                className={`rounded-full transition-all ${
                  i === index
                    ? "w-2.5 h-2.5 bg-white"
                    : "w-1.5 h-1.5 bg-slate-600 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
