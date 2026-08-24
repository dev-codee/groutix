/**
 * File size validation constants and utilities.
 * Platform limit: Serverless functions are capped at 4.5MB request payload.
 * Safe upload limit: 4.0 MB total.
 */

export const MAX_TOTAL_BYTES = 4.0 * 1024 * 1024; // 4.0 MB

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
