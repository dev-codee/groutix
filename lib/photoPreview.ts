/** Deliver HEIC/HEIF cloud photos as JPEG while retaining the original URL for downloads. */
export function photoPreviewUrl(photo: { secureUrl?: string; url?: string; dataUrl?: string; name?: string; contentType?: string }): string {
  const source = photo.secureUrl || photo.url || photo.dataUrl || "";
  if (!/\.hei[cf](?:$|[?#])/i.test(source) && !/\.hei[cf]$/i.test(photo.name || "") && !/^image\/hei[cf]/i.test(photo.contentType || "")) return source;
  try {
    const url = new URL(source);
    if (url.hostname !== "res.cloudinary.com" || !url.pathname.includes("/image/upload/")) return source;
    url.pathname = url.pathname.replace("/image/upload/", "/image/upload/f_jpg/");
    return url.toString();
  } catch { return source; }
}
