/** Format saved Melbourne business numbers for display without changing other numbers. */
export function formatBusinessPhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("61")) digits = `0${digits.slice(2)}`;
  if (digits === "70238094") digits = `03${digits}`;
  return /^03\d{8}$/.test(digits)
    ? `(03) ${digits.slice(2, 6)} ${digits.slice(6)}`
    : phone;
}

/** Normalize company contact text while preserving HTML attributes and call links. */
export function normalizeBusinessPhoneText(text: string): string {
  return text.replace(
    /(<[^>]*>)|(?<!\d)(?:(?:\+61[\s-]*3|\(03\)|03)[\s-]*)?7023[\s-]*8094(?!\d)|(?<!\d)1300[\s-]*476[\s-]*884(?!\d)/g,
    (match, tag: string | undefined) => tag ?? "(03) 7023 8094"
  );
}
