"use client";

import type { ReactNode } from "react";
import { CalendarClock, MapPin, Image, Link2 } from "lucide-react";
import { BookingRulesModal } from "../modals/BookingRulesModal";
import { ZoneRulesModal } from "../modals/ZoneRulesModal";
import { ZonesView } from "./ZonesView";

export const SETTINGS_SECTIONS = ["booking-hours", "service-zones", "logo", "quickbooks"] as const;
export type SettingsSection = typeof SETTINGS_SECTIONS[number];
export function settingsSection(value: string | null): SettingsSection {
  return SETTINGS_SECTIONS.find(section => section === value) || "booking-hours";
}

const sections = [
  { id: "booking-hours", label: "Booking Hours", icon: CalendarClock },
  { id: "service-zones", label: "Service Zones", icon: MapPin },
  { id: "logo", label: "Logo", icon: Image },
  { id: "quickbooks", label: "QuickBooks", icon: Link2 },
] as const;

export function SettingsView({ section, onSectionChange, logo, quickbooks }: {
  section: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  logo: ReactNode;
  quickbooks: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">Manage booking hours, service areas, branding and accounting connections.</p>
      <div role="tablist" aria-label="Settings" className="flex flex-wrap gap-2">
        {sections.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" id={`settings-tab-${id}`} aria-controls={`settings-panel-${id}`}
            aria-selected={section === id} onClick={() => onSectionChange(id)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors ${section === id ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>
      {sections.map(({ id }) => (
        <div key={id} role="tabpanel" id={`settings-panel-${id}`} aria-labelledby={`settings-tab-${id}`} hidden={section !== id}>
          {id === "booking-hours" && <BookingRulesModal embedded />}
          {id === "service-zones" && <div className="space-y-5"><ZoneRulesModal embedded /><ZonesView /></div>}
          {id === "logo" && <div className="max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">{logo}</div>}
          {id === "quickbooks" && <div className="max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">{quickbooks}</div>}
        </div>
      ))}
    </div>
  );
}
