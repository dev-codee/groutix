/**
 * File size validation constants and utilities for customer job photo uploads.
 * Direct cloud upload allows high-resolution photos (up to 25MB each, up to 10 photos).
 */

export const MAX_PHOTO_COUNT = 10;
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB per photo
export const MAX_TOTAL_BYTES = 100 * 1024 * 1024; // 100 MB total

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

