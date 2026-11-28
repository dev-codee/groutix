import { formatAppt, formatSlotRange } from "./scheduling";

export function inspectionConfirmationHtml(date: string, time: string, booked: boolean, durationMinutes: number): string {
  if (!date || !time) return `<p style="margin:0 0 8px;">We’ll contact you to arrange your inspection.</p>`;
  const appointment = `${date}T${time.slice(0, 5).padStart(5, "0")}`;
  const dateLabel = formatAppt(appointment, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const startTime = time.slice(0, 5).padStart(5, "0");
  const timeLabel = formatSlotRange(startTime, durationMinutes);
  const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return `<p style="margin:0 0 8px;"><strong>${booked ? "Inspection booked" : "Inspection requested"}</strong><br>
    ${escape(dateLabel)}, ${escape(timeLabel)} (Melbourne time)</p>
    ${booked ? "" : `<p style="margin:0 0 8px;">We’ll contact you to confirm your time.</p>`}`;
}

export function inspectionConfirmationSms(date: string, time: string, booked: boolean, durationMinutes: number): string {
  if (!date || !time) return "Our team will contact you to arrange your free inspection.";
  const startTime = time.slice(0, 5).padStart(5, "0");
  const dateLabel = formatAppt(`${date}T${startTime}`, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const when = `${dateLabel}, ${formatSlotRange(startTime, durationMinutes)} (Melbourne time)`;
  return booked
    ? `Your inspection is booked for ${when}. If any adjustment is needed, our team will contact you.`
    : `Your requested inspection time is ${when}. This time has not been confirmed. Our team will contact you to confirm availability or arrange an alternative.`;
}
