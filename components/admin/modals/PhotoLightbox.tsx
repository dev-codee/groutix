"use client";

import { X, Download, ExternalLink } from "lucide-react";

interface Photo {
  name: string;
  url: string;
}

interface Props {
  photo: Photo;
  onClose: () => void;
}

export function PhotoLightbox({ photo, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 text-white">
          <span className="text-xs font-semibold truncate max-w-md">{photo.name}</span>
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
        <div className="p-2 flex items-center justify-center bg-black/40 max-h-[80vh] overflow-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt={photo.name}
            className="max-h-[75vh] max-w-full object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
