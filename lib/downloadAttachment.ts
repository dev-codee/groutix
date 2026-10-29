/** Check the response before saving, so an API error never becomes a .pdf file. */
export async function downloadAttachment(url: string, name: string): Promise<void> {
  try {
    const response = await fetch(`/api/admin/download-photo?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Could not download the attachment. Please try again.");
    }
    const blobUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (error) {
    alert(error instanceof Error ? error.message : "Could not download the attachment.");
  }
}
