"use client";

import { useRef } from "react";
import { X, Camera, Upload, Loader2, ZoomIn, Download, ExternalLink, Trash2 } from "lucide-react";
import { Image as ImageIcon } from "lucide-react";
import type { Lead } from "@/components/admin/types";

interface Photo {
  name: string;
  url?: string;
  secureUrl?: string;
  dataUrl?: string;
  publicId?: string;
  uploadedBy?: string;
}

interface Props {
  lead: Lead;
  uploadingPhotos: boolean;
  loadingPhotos: boolean;
  deletingPhotoIndex: number | null;
  onClose: () => void;
  onAddPhotos: (files: FileList | null) => void;
  onDeletePhoto: (index: number) => void;
  onPreviewPhoto: (photos: { name: string; url: string }[], index: number) => void;
}

export function PhotosModal({
  lead,
  uploadingPhotos,
  loadingPhotos,
  deletingPhotoIndex,
  onClose,
  onAddPhotos,
  onDeletePhoto,
  onPreviewPhoto,
}: Props) {
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const galleryRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center p-3 sm:p-4 sm:pt-10 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-4 sm:p-6 space-y-4 my-4 sm:my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">Customer Job Photos</h2>
            <div className="text-xs text-slate-500">Customer: {lead.name}</div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Upload New Photo(s)</label>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => cameraRef.current?.click()}
                disabled={uploadingPhotos}
                className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 cursor-pointer shadow-2xs transition-colors"
              >
                <Camera className="w-4 h-4" /> Take Photo
              </button>
              <button
                onClick={() => galleryRef.current?.click()}
                disabled={uploadingPhotos}
                className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-xl text-xs font-semibold hover:bg-blue-100 disabled:opacity-50 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4" /> Browse Gallery
              </button>
              <input
                ref={cameraRef}
                type="file"
                multiple
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => onAddPhotos(e.target.files)}
              />
              <input
                ref={galleryRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => onAddPhotos(e.target.files)}
              />
            </div>
            {uploadingPhotos && (
              <div className="flex items-center gap-2 text-xs font-medium text-blue-600 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading to Cloudinary...</span>
              </div>
            )}
          </div>
        </div>

        {loadingPhotos ? (
          <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span>Loading customer photos...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[55vh] overflow-y-auto p-1">
            {(lead.photos || []).map((photo, i) => {
              const imgSrc = photo.secureUrl || photo.url || photo.dataUrl || "";
              const isDeleting = deletingPhotoIndex === i;
              const allPhotoList = (lead.photos || [])
                .map((p) => ({ name: p.name, url: p.secureUrl || p.url || p.dataUrl || "" }))
                .filter((p) => p.url);
              return (
                <div
                  key={i}
                  className="group relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 space-y-1.5 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div
                    className="relative w-full h-36 bg-slate-200 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => imgSrc && onPreviewPhoto(allPhotoList, allPhotoList.findIndex((p) => p.url === imgSrc))}
                  >
                    {imgSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imgSrc}
                        alt={photo.name}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-400 p-2 text-center">
                        <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                        {photo.name}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="p-1.5 bg-white/90 rounded-lg text-slate-700 shadow-xs hover:bg-white">
                        <ZoomIn className="w-4 h-4" />
                      </span>
                    </div>
                    {photo.publicId && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-emerald-600/90 backdrop-blur-xs text-[10px] font-bold text-white rounded-md shadow-xs">
                        Cloud
                      </span>
                    )}
                  </div>

                  {photo.uploadedBy && (
                    <div className="text-[10px] text-slate-400 font-medium truncate">
                      by {photo.uploadedBy}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
                    <span className="truncate max-w-[130px] font-medium" title={photo.name}>
                      {photo.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {imgSrc && (
                        <a
                          href={`/api/admin/download-photo?url=${encodeURIComponent(imgSrc)}&name=${encodeURIComponent(photo.name || `photo-${i + 1}`)}`}
                          download
                          className="text-slate-400 hover:text-emerald-600 p-1"
                          title="Download photo"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {imgSrc && (
                        <a
                          href={imgSrc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-slate-700 p-1"
                          title="Open original in new tab"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => onDeletePhoto(i)}
                        className="text-rose-500 hover:text-rose-700 p-1 disabled:opacity-50"
                        title="Delete photo"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {(!lead.photos || lead.photos.length === 0) && (
              <div className="col-span-full py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <ImageIcon className="w-8 h-8 text-slate-300" />
                <span>No photos uploaded for this customer yet.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
