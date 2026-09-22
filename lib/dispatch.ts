// Smart Dispatch Engine for Groutix Operations
// Implements intelligent technician assignment, travel time/distance calculation,
// corridor-day matching, working hours constraints, and protected break enforcement.

import {
  SUBURBS,
  TULLAMARINE,
  distanceKm,
  resolveArea,
  INNER_15KM_SUBURBS,
  MIN_BOOKING_DATE,
  type AreaInfo,
} from "@/lib/scheduling";
import type { BookingDoc } from "@/lib/bookings";
import type { Lead } from "@/components/admin/types";

export interface TravelEstimate {
  distanceKm: number;
  durationMinutes: number;
  label: string;
}

export interface DispatchSlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  dayOfWeek: string;
  technician: string;
  technicianId?: string;
  score: number;
  reasons: string[];
  travelEstimate?: TravelEstimate;
  corridor: string;
}

export interface DayScheduleSummary {
  date: string;
  dayName: string;
  isOpen: boolean;
  totalBookings: number;
  totalHours: number;
  totalKm: number;
  techniciansActive: string[];
}

// ── Working Hours Definition ────────────────────────────────────────────────
// Mon–Thu & Sat: 9:00 AM – 5:00 PM
// Fri: 10:00 AM – 3:00 PM
// Sun: OFF (Closed)
export const DISPATCH_WORKING_HOURS: Record<
  number,
  { startHour: number; startMin: number; endHour: number; endMin: number; isOpen: boolean; label: string }
> = {
  0: { startHour: 0, startMin: 0, endHour: 0, endMin: 0, isOpen: false, label: "Closed (OFF)" }, // Sunday
  1: { startHour: 9, startMin: 0, endHour: 17, endMin: 0, isOpen: true, label: "9:00 AM – 5:00 PM" }, // Monday
  2: { startHour: 9, startMin: 0, endHour: 17, endMin: 0, isOpen: true, label: "9:00 AM – 5:00 PM" }, // Tuesday
  3: { startHour: 9, startMin: 0, endHour: 17, endMin: 0, isOpen: true, label: "9:00 AM – 5:00 PM" }, // Wednesday
  4: { startHour: 9, startMin: 0, endHour: 17, endMin: 0, isOpen: true, label: "9:00 AM – 5:00 PM" }, // Thursday
  5: { startHour: 10, startMin: 0, endHour: 15, endMin: 0, isOpen: true, label: "10:00 AM – 3:00 PM" }, // Friday
  6: { startHour: 9, startMin: 0, endHour: 17, endMin: 0, isOpen: true, label: "9:00 AM – 5:00 PM" }, // Saturday
};

// Protected lunch break: 12:00 PM – 12:30 PM
export const LUNCH_BREAK = {
  startHour: 12,
  startMin: 0,
  endHour: 12,
  endMin: 30,
  label: "12:00 – 12:30 PM (Lunch Break)",
};

// Standard Roster
export const STANDARD_DISPATCH_STAFF = [
  { id: "tech-rizwan", name: "Rizwan", role: "Inspector & Field Tech", canInspect: true, canJob: true, color: "blue" },
  { id: "tech-1", name: "Tech 1", role: "Field Technician", canInspect: false, canJob: true, color: "emerald" },
  { id: "tech-2", name: "Tech 2", role: "Field Technician", canInspect: false, canJob: true, color: "violet" },
];

/** Suburb coordinates lookup */
export function getSuburbCoords(suburbName?: string | null): { lat: number; lng: number } | null {
  if (!suburbName) return null;
  const lower = suburbName.toLowerCase().trim();
  const found = SUBURBS.find((s: (typeof SUBURBS)[number]) => s.name.toLowerCase() === lower);
  return found ? { lat: found.lat, lng: found.lng } : null;
}

/** Distance calculation between any two suburbs */
export function calculateDistanceBetweenSuburbs(
  suburbA?: string | null,
  suburbB?: string | null
): number {
  if (!suburbA && !suburbB) return 12.0;
  const aCoords = getSuburbCoords(suburbA) || TULLAMARINE;
  const bCoords = getSuburbCoords(suburbB) || TULLAMARINE;
  return Math.round(distanceKm(aCoords, bCoords) * 10) / 10;
}

/** Travel time and distance estimation */
export function calculateTravel(
  fromSuburb?: string | null,
  toSuburb?: string | null
): TravelEstimate {
  const distKm = calculateDistanceBetweenSuburbs(fromSuburb, toSuburb);
  // Tullamarine sits on the Tullamarine Freeway — effective average ~50 km/h + 3 min approach
  const drivingMinutes = Math.max(10, Math.round((distKm / 50) * 60) + 3);
  return {
    distanceKm: distKm,
    durationMinutes: drivingMinutes,
    label: `${drivingMinutes} min · ~${distKm} km`,
  };
}

/** Check if a time string (HH:mm) overlaps with lunch break */
export function isOverlappingBreak(timeStr: string, durationMins: number = 60): boolean {
  const [h, m] = timeStr.split(":").map(Number);
  const apptStart = h * 60 + (m || 0);
  const apptEnd = apptStart + durationMins;

  const breakStart = LUNCH_BREAK.startHour * 60 + LUNCH_BREAK.startMin;
  const breakEnd = LUNCH_BREAK.endHour * 60 + LUNCH_BREAK.endMin;

  // Overlap occurs if appt starts before break ends AND appt ends after break starts
  return apptStart < breakEnd && apptEnd > breakStart;
}

/** Check if an appointment is within daily working hours */
export function isWithinWorkingHours(
  dateStr: string,
  timeStr: string,
  durationMins: number = 60
): boolean {
  const d = new Date(dateStr + "T00:00:00");
  const dayOfWeek = d.getDay();
  const rule = DISPATCH_WORKING_HOURS[dayOfWeek];
  if (!rule || !rule.isOpen) return false;

  const [h, m] = timeStr.split(":").map(Number);
  const apptStart = h * 60 + (m || 0);
  const apptEnd = apptStart + durationMins;

  const workStart = rule.startHour * 60 + rule.startMin;
  const workEnd = rule.endHour * 60 + rule.endMin;

  return apptStart >= workStart && apptEnd <= workEnd;
}

/** Time slot list generated in 30-min intervals */
export function getTimelineSlots(): string[] {
  const slots: string[] = [];
  // 9:00 to 17:00 in 30m steps
  for (let h = 9; h <= 17; h++) {
    const hh = String(h).padStart(2, "0");
    slots.push(`${hh}:00`);
    if (h < 17) {
      slots.push(`${hh}:30`);
    }
  }
  return slots;
}

/** Format time into 12-hour display */
export function formatTime12(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m || 0).padStart(2, "0")} ${ampm}`;
}

/** Smart Slot Suggestion Engine */
export function suggestBestDispatchSlots(params: {
  lead: Lead;
  type: "inspection" | "job";
  existingBookings: BookingDoc[];
  allLeads: Lead[];
  availableStaff?: { id: string; name: string; role?: string }[];
  maxSuggestions?: number;
}): DispatchSlot[] {
  const { lead, type, existingBookings, allLeads, availableStaff = [], maxSuggestions = 4 } = params;

  // 1. Identify Corridor and Area
  const area = resolveArea(lead.address || lead.city);
  const suburb = area.suburb;

  // 2. Identify eligible technicians
  // Inspections: Rizwan or assigned inspection staff
  // Jobs: Tech 1, Tech 2, Rizwan, or any field technician
  let eligibleTechs: { id: string; name: string }[] = [];
  if (type === "inspection") {
    const rizwan = availableStaff.find((s) => s.name.toLowerCase().includes("rizwan")) || {
      id: "tech-rizwan",
      name: "Rizwan",
    };
    eligibleTechs = [rizwan];
  } else {
    // Jobs: Tech 1, Tech 2, Rizwan, and all technicians
    eligibleTechs = availableStaff.length > 0
      ? availableStaff
      : [
          { id: "tech-1", name: "Tech 1" },
          { id: "tech-2", name: "Tech 2" },
          { id: "tech-rizwan", name: "Rizwan" },
        ];
  }

  // 3. Build occupied slots map: date+time+tech
  const occupiedSet = new Set<string>();
  const occupiedSlotSet = new Set<string>(); // global slot occupancy

  for (const b of existingBookings) {
    occupiedSlotSet.add(`${b.date}T${b.time.slice(0, 5)}`);
  }

  for (const l of allLeads) {
    if (l.status === "Lost" || l.status === "Cancelled" || l.id === lead.id) continue;
    const when = type === "inspection" ? l.inspectionAt : l.jobAt;
    if (when && when.includes("T")) {
      const [d, tRaw] = when.split("T");
      const t = tRaw.slice(0, 5);
      occupiedSlotSet.add(`${d}T${t}`);
      const techName = (l.technician || l.assigned || "").toLowerCase();
      if (techName) {
        occupiedSet.add(`${d}T${t}::${techName}`);
      }
    }
  }

  // 4. Candidate dates starting from MIN_BOOKING_DATE (Mon 28 Sep 2026)
  const suggestions: DispatchSlot[] = [];
  const minDate = new Date(MIN_BOOKING_DATE + "T00:00:00");
  
  // Test across the upcoming 28 days
  for (let offset = 0; offset < 28; offset++) {
    const candidateDate = new Date(minDate);
    candidateDate.setDate(minDate.getDate() + offset);

    const dayOfWeek = candidateDate.getDay();
    // Sunday rule: completely OFF
    if (dayOfWeek === 0) continue;

    const dateStr = candidateDate.toISOString().slice(0, 10);
    const dayRule = DISPATCH_WORKING_HOURS[dayOfWeek];
    if (!dayRule || !dayRule.isOpen) continue;

    const dayName = candidateDate.toLocaleDateString("en-AU", { weekday: "short" });

    // Corridor matching score
    // mon_lower1: 1, tue_lower2: 2, wed_lower3: 3, thu_northeast: 4, fri_north: 5, sat_melton: 6
    let corridorMatch = false;
    let corridorScore = 0;

    if (area.inner || area.zone === "flexible") {
      corridorMatch = true;
      corridorScore = 40; // Flexible inner corridor
    } else {
      if (area.zone === "mon_lower1" && dayOfWeek === 1) corridorMatch = true;
      if (area.zone === "tue_lower2" && dayOfWeek === 2) corridorMatch = true;
      if (area.zone === "wed_lower3" && dayOfWeek === 3) corridorMatch = true;
      if (area.zone === "thu_bundoora" && dayOfWeek === 4) corridorMatch = true;
      if (area.zone === "fri_north" && dayOfWeek === 5) corridorMatch = true;
      if ((area.zone === "sat_melton" || area.zone === "sun_stalbans") && dayOfWeek === 6) corridorMatch = true;

      if (corridorMatch) corridorScore = 60;
    }

    // Check candidate time slots for this day
    const candidateTimes = dayOfWeek === 5
      ? ["10:00", "11:00", "13:00", "14:00"] // Friday 10-3pm
      : ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"]; // Mon-Thu & Sat

    for (const tech of eligibleTechs) {
      const techKey = tech.name.toLowerCase();

      for (const timeStr of candidateTimes) {
        // Must fit working hours
        if (!isWithinWorkingHours(dateStr, timeStr, 60)) continue;

        // Must not clash with protected lunch break (12:00 - 12:30 PM)
        if (isOverlappingBreak(timeStr, 60)) continue;

        // Must not be already locked in bookings
        if (occupiedSlotSet.has(`${dateStr}T${timeStr}`)) continue;
        if (occupiedSet.has(`${dateStr}T${timeStr}::${techKey}`)) continue;

        // Travel analysis from previous stop on this day
        // Find if technician has any other appointments on this date
        const dayAppointments = allLeads.filter((l) => {
          if (l.status === "Lost" || l.status === "Cancelled" || l.id === lead.id) return false;
          const when = l.jobAt || l.inspectionAt;
          const assigned = (l.technician || l.assigned || "").toLowerCase();
          return when?.startsWith(dateStr) && (assigned === techKey || !assigned);
        });

        let travelEst: TravelEstimate | undefined;
        let routeEfficiencyScore = 0;
        const reasons: string[] = [];

        if (corridorMatch) {
          reasons.push(`Corridor match: ${area.label} on ${dayName}`);
        }

        if (dayAppointments.length > 0) {
          // Find closest appointment
          let minDistance = 999;
          let closestSuburb = "";
          for (const appt of dayAppointments) {
            const otherArea = resolveArea(appt.address || appt.city);
            const dist = calculateDistanceBetweenSuburbs(suburb, otherArea.suburb);
            if (dist < minDistance) {
              minDistance = dist;
              closestSuburb = otherArea.suburb || "previous stop";
            }
          }

          travelEst = calculateTravel(closestSuburb, suburb);
          if (minDistance <= 12) {
            routeEfficiencyScore += 35;
            reasons.push(`Cluster route: only ${travelEst.distanceKm} km from ${closestSuburb} (${travelEst.durationMinutes} min)`);
          } else {
            routeEfficiencyScore += 10;
            reasons.push(`Route gap: ${travelEst.distanceKm} km travel`);
          }
        } else {
          // First stop of the day from Tullamarine HQ
          travelEst = calculateTravel("tullamarine", suburb);
          routeEfficiencyScore += 25;
          reasons.push(`Opening stop: ${travelEst.durationMinutes} min drive from Tullamarine HQ`);
        }

        // Tech workload balance: max 4 appointments per day
        if (dayAppointments.length >= 4) {
          routeEfficiencyScore -= 20;
        } else {
          routeEfficiencyScore += 15;
          reasons.push(`${tech.name} has light schedule (${dayAppointments.length} current stops)`);
        }

        const totalScore = corridorScore + routeEfficiencyScore;

        suggestions.push({
          date: dateStr,
          time: timeStr,
          dayOfWeek: dayName,
          technician: tech.name,
          technicianId: tech.id,
          score: totalScore,
          reasons,
          travelEstimate: travelEst,
          corridor: area.label,
        });
      }
    }
  }

  // Sort by score descending, then by date ascending
  suggestions.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const dComp = a.date.localeCompare(b.date);
    return dComp !== 0 ? dComp : a.time.localeCompare(b.time);
  });

  return suggestions.slice(0, maxSuggestions);
}
