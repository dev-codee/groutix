export function LeadServiceAreas({ areas }: { areas?: string }) {
  return (
    <p className="mt-1 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap break-words">
      <span className="font-bold">Areas to service:</span> {areas?.trim() || "Not provided"}
    </p>
  );
}
