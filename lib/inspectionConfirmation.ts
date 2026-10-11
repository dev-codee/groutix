import { formatAppt } from "./scheduling";
import { formatHHmm, fromMinutes, toMinutes } from "./bookingRules";

export function inspectionConfirmationHtml(date: string, time: string, booked: boolean): string {
  if (!date || !time) return `<p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#1e293b;">Our team will contact you to arrange your free inspection.</p>`;
  const appointment = `${date}T${time.slice(0, 5).padStart(5, "0")}`;
  const dateLabel = formatAppt(appointment, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const startTime = time.slice(0, 5).padStart(5, "0");
  const endTime = fromMinutes((toMinutes(startTime) + 30) % (24 * 60));
  const timeLabel = `${formatHHmm(startTime)} – ${formatHHmm(endTime)}`;
  const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return `<div style="margin:0 0 20px;padding:16px;border:1px solid #bfdbfe;border-radius:10px;background:#eff6ff;color:#1e293b;">
    <h3 style="margin:0 0 10px;color:#001f97;font-size:17px;">${booked ? "Your inspection booking" : "Your requested inspection time"}</h3>
    <p style="margin:0 0 6px;font-size:15px;"><strong>Date:</strong> ${escape(dateLabel)}</p>
    <p style="margin:0 0 12px;font-size:15px;"><strong>${booked ? "Arrival time" : "Requested arrival time"}:</strong> ${escape(timeLabel)} (Melbourne time)</p>
    <p style="margin:0;font-size:14px;line-height:1.5;">${booked
      ? "We have booked your inspection for the date above, with arrival expected within the 30-minute window shown. If any adjustment to the inspection time is needed, our team will contact you to arrange it."
      : "This requested time has not been confirmed. Our team will contact you to confirm availability or arrange an alternative inspection time."}</p>
  </div>`;
}
