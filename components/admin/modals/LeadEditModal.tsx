"use client";

import { BookingTimingEditor } from "@/components/admin/BookingTimingEditor";
import { staffBookingRules } from "@/lib/staffBookingRules";

import { appointmentDurationMinutes } from "@/lib/bookingDuration";

import { useRef, useState } from "react";
import { X, Phone, MapPin, CalendarDays, Link2, Ban, Check } from "lucide-react";
import type { Lead } from "@/components/admin/types";
import { fmtDate, getRoleStatusOptions } from "@/lib/adminHelpers";
import type { Role } from "@/lib/roles";
import { explainOutsideRules } from "@/lib/bookingRules";
import { useBookingRules } from "@/lib/useBookingRules";
import { SlotBoard, useSlotConflict } from "@/components/admin/SlotBoard";
import { BookingPlanner } from "@/components/admin/BookingPlanner";
import { normalizeApptString } from "@/lib/scheduling";

interface Props {
  editingLead: Partial<Lead> | null;
  setEditingLead: React.Dispatch<React.SetStateAction<Partial<Lead> | null>>;
  setLeadModalOpen: (v: boolean) => void;
  handleSaveLead: (e: React.FormEvent, original: Partial<Lead>) => Promise<string | void>;
  addressInputRef: React.RefObject<HTMLInputElement | null>;
  addressDebounceRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  fetchAddressSuggestions: (q: string) => void;
  addressSuggestions: string[];
  setAddressSuggestionsOpen: (v: boolean) => void;
  setAddressDropdownStyle: React.Dispatch<React.SetStateAction<{ top: number; left: number; width: number }>>;
  role: Role;
  isTechnician: boolean;
  isTechnicianName: (name: string) => boolean;
  assigneeOptions: string[];
  logCall: (leadId: string, outcome: string) => void;
}

export function LeadEditModal({
  editingLead,
  setEditingLead,
  setLeadModalOpen,
  handleSaveLead,
  addressInputRef,
  addressDebounceRef,
  fetchAddressSuggestions,
  addressSuggestions,
  setAddressSuggestionsOpen,
  setAddressDropdownStyle,
  role,
  isTechnician,
  isTechnicianName,
  assigneeOptions,
  logCall,
}: Props) {
  // Manager-configured booking hours (Settings → Booking Hours). Staff can still
  // book outside them (e.g. a special arrangement) but get a visible warning.
  const bookingRules = staffBookingRules(useBookingRules());
  const minBookingValue = bookingRules.minDate ? `${bookingRules.minDate}T00:00` : undefined;
  const inspectionWarning = editingLead?.inspectionAt ? explainOutsideRules(bookingRules, "inspection", editingLead.inspectionAt) : null;
  const jobWarning = editingLead?.jobAt ? explainOutsideRules(bookingRules, "job", editingLead.jobAt) : null;

  // Live view of who holds which slot (inspections + jobs share one calendar).
  const [showBoard, setShowBoard] = useState<{ inspection: boolean; job: boolean }>({ inspection: false, job: false });
  const [plannerFor, setPlannerFor] = useState<"inspection" | "job" | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [linkFeedback, setLinkFeedback] = useState<{ type: "inspection" | "job"; message: string; error?: boolean } | null>(null);
  const [copyingLink, setCopyingLink] = useState<"inspection" | "job" | null>(null);

  async function copyBookingLink(type: "inspection" | "job") {
    if (!editingLead?.id || copyingLink) return;
    setCopyingLink(type);
    setLinkFeedback(null);
    try {
      const response = await fetch(`/api/admin/booking-link/${editingLead.id}`);
      const data = await response.json();
      const url = type === "inspection" ? data.inspectionUrl : data.jobUrl;
      if (!response.ok || !url) throw new Error("Could not copy booking link. Please try again.");
      await navigator.clipboard.writeText(url);
      setLinkFeedback({ type, message: "Booking link copied." });
    } catch {
      setLinkFeedback({ type, message: "Could not copy booking link. Please try again.", error: true });
    } finally {
      setCopyingLink(null);
    }
  }
  const inspectionConflict = useSlotConflict(editingLead?.inspectionAt, editingLead?.id, "inspection");
  const jobConflict = useSlotConflict(editingLead?.jobAt, editingLead?.id, "job", appointmentDurationMinutes({ type: "job" }, bookingRules), editingLead || {});
  // Compare against the form's opening snapshot, even if the lead list refreshes.
  const original = useRef<Partial<Lead>>({ ...editingLead });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaveError("");
    const clashes = [
      normalizeApptString(editingLead?.inspectionAt) !== normalizeApptString(original.current.inspectionAt) && inspectionConflict
        ? `Inspection: ${inspectionConflict.label}`
        : null,
      normalizeApptString(editingLead?.jobAt) !== normalizeApptString(original.current.jobAt) && jobConflict
        ? `Job: ${jobConflict.label}`
        : null,
    ].filter(Boolean);
    if (clashes.length) {
      setSaveError(clashes.join("\n"));
      return;
    }
    setSaving(true);
    try {
      const error = await handleSaveLead(e, original.current);
      if (error) setSaveError(error);
    } catch {
      setSaveError("Could not save the lead. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center p-3 sm:p-4 sm:pt-10 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full min-w-0 p-4 sm:p-6 space-y-4 my-4 sm:my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-black text-slate-900">
            {editingLead?.id ? "Edit Customer Lead" : "Add New Customer Lead"}
          </h2>
          <button
            disabled={saving}
            onClick={() => setLeadModalOpen(false)}
            type="button"
            aria-label="Close lead editor"
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} onChange={() => setSaveError("")} className="space-y-4 text-xs">
          <fieldset disabled={saving} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 [&>div]:min-w-0">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={editingLead?.name || ""}
                onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                className="mt-1 min-w-0 w-full bg-white p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
              <input
                type="text"
                value={editingLead?.phone || ""}
                onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                className="mt-1 min-w-0 w-full bg-white p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                value={editingLead?.email || ""}
                onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                className="mt-1 min-w-0 w-full bg-white p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Property Address</label>
              <input
                ref={addressInputRef}
                type="text"
                value={editingLead?.address || ""}
                autoComplete="off"
                onChange={(e) => {
                  setEditingLead({ ...editingLead, address: e.target.value });
                  if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
                  addressDebounceRef.current = setTimeout(() => fetchAddressSuggestions(e.target.value), 350);
                }}
                onBlur={() => setTimeout(() => setAddressSuggestionsOpen(false), 200)}
                onFocus={() => {
                  if (addressSuggestions.length > 0 && addressInputRef.current) {
                    const rect = addressInputRef.current.getBoundingClientRect();
                    setAddressDropdownStyle({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
                    setAddressSuggestionsOpen(true);
                  }
                }}
                className="mt-1 min-w-0 w-full bg-white p-2.5 border border-slate-200 rounded-xl"
                placeholder="Start typing an address..."
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Service / Task Required</label>
              <input
                type="text"
                value={editingLead?.service || ""}
                onChange={(e) => setEditingLead({ ...editingLead, service: e.target.value })}
                className="mt-1 min-w-0 w-full bg-white p-2.5 border border-slate-200 rounded-xl"
                placeholder="e.g. Shower Regrouting, Epoxy, Balcony"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Lead Status</label>
              <select
                value={editingLead?.status || "New"}
                onChange={(e) => setEditingLead({ ...editingLead, status: e.target.value })}
                className="mt-1 min-w-0 w-full bg-white p-2.5 border border-slate-200 rounded-xl"
              >
                {getRoleStatusOptions(role, editingLead?.status).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Assigned To</label>
              {isTechnician ? (
                <div className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-semibold text-sm">
                  {editingLead?.technician || editingLead?.assigned || "Unassigned"}
                </div>
              ) : (
                <select
                  value={
                    editingLead?.assigned && !isTechnicianName(editingLead.assigned)
                      ? editingLead.assigned
                      : assigneeOptions[0] || "Unassigned"
                  }
                  onChange={(e) => setEditingLead({ ...editingLead, assigned: e.target.value === "Unassigned" ? "" : e.target.value })}
                  className="mt-1 min-w-0 w-full bg-white p-2.5 border border-slate-200 rounded-xl"
                >
                  {assigneeOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Contacted Date & Time</label>
              <input
                type="datetime-local"
                value={editingLead?.contacted ? editingLead.contacted.slice(0, 16) : ""}
                onChange={(e) => setEditingLead({ ...editingLead, contacted: e.target.value })}
                className="mt-1 min-w-0 w-full bg-white p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Next Follow-Up</label>
              <input
                type="datetime-local"
                value={editingLead?.follow ? editingLead.follow.slice(0, 16) : ""}
                onChange={(e) => setEditingLead({ ...editingLead, follow: e.target.value })}
                className="mt-1 min-w-0 w-full bg-white p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Bookings</h3>
            <section aria-label="Inspection booking" className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-900">Inspection booking</h4>
                {editingLead?.inspectionRescheduled && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Rescheduled</span>
                )}
              </div>
              <label className="block font-semibold text-slate-700">Date and time
              <input
                type="datetime-local"
                min={minBookingValue}
                value={editingLead?.inspectionAt ? editingLead.inspectionAt.slice(0, 16) : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditingLead({
                    ...editingLead,
                    inspectionAt: val,
                    inspectionReminderSent: false,
                  });
                }}
                className="mt-1 min-w-0 w-full bg-white p-2.5 border border-slate-200 rounded-xl"
              />
              </label>
              {inspectionWarning && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">⚠ Outside booking hours: {inspectionWarning}</p>
              )}
              {inspectionConflict && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">⛔ {inspectionConflict.label}</p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setShowBoard(v => ({ ...v, inspection: !v.inspection }))}
                  aria-expanded={showBoard.inspection}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />{showBoard.inspection ? "Hide booked slots" : "Show booked slots"}
                </button>
                <button type="button" onClick={() => setPlannerFor("inspection")}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />Plan on map
                </button>
              </div>
              {showBoard.inspection && (
                <SlotBoard
                  type="inspection"
                  value={editingLead?.inspectionAt}
                  leadId={editingLead?.id}
                  address={editingLead?.address || editingLead?.city}
                  onPick={(val) => setEditingLead({ ...editingLead, inspectionAt: val, inspectionReminderSent: false })}
                />
              )}
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                {editingLead?.id && (
                  <button type="button" disabled={copyingLink !== null} onClick={() => void copyBookingLink("inspection")}
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50">
                    {linkFeedback?.type === "inspection" && !linkFeedback.error ? <Check className="h-3.5 w-3.5 shrink-0" /> : <Link2 className="h-3.5 w-3.5 shrink-0" />}
                    {copyingLink === "inspection" ? "Copying…" : "Copy booking link"}
                  </button>
                )}
                {(role === "manager" || role === "super_admin") && editingLead?.inspectionAt && (
                  <button
                    type="button"
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (!window.confirm("Cancel this inspection booking? The date/time will be cleared; nothing else on the lead changes.")) return;
                      setEditingLead({
                        ...editingLead,
                        inspectionAt: "",
                        inspectionEndAt: "",
                        inspectionWorkSegments: [],
                        inspectionReminderSent: false,
                      });
                    }}
                  >
                    <Ban className="h-3.5 w-3.5 shrink-0" />Cancel inspection
                  </button>
                )}
              </div>
              {linkFeedback?.type === "inspection" && <p role={linkFeedback.error ? "alert" : "status"} className={`text-xs ${linkFeedback.error ? "text-red-700" : "text-emerald-700"}`}>{linkFeedback.message}</p>}
              <p className="text-xs leading-relaxed text-slate-500">Scheduled bookings trigger a reminder 24 hours before the visit.</p>
            </section>
            <section aria-label="Job booking" className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-emerald-600" /><h4 className="text-sm font-bold text-slate-900">Job booking</h4></div>
              <BookingTimingEditor type="job" required={false} start={editingLead?.jobAt?.slice(0, 16) || ""} end={editingLead?.jobEndAt} rules={bookingRules} minDate={minBookingValue?.slice(0, 10)}
                onChange={(start, end) => setEditingLead({ ...editingLead, jobAt: start, jobEndAt: end, jobReminderSent: false })} />
              {jobWarning && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">⚠ Outside booking hours: {jobWarning}</p>
              )}
              {jobConflict && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">⛔ {jobConflict.label}</p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setShowBoard(v => ({ ...v, job: !v.job }))}
                  aria-expanded={showBoard.job}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />{showBoard.job ? "Hide booked slots" : "Show booked slots"}
                </button>
                <button type="button" onClick={() => setPlannerFor("job")}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />Plan on map
                </button>
              </div>
              {showBoard.job && (
                <SlotBoard
                  type="job"
                  durationMinutes={appointmentDurationMinutes({ type: "job" }, bookingRules)}
                  assignment={editingLead || {}}
                  value={editingLead?.jobAt}
                  leadId={editingLead?.id}
                  address={editingLead?.address || editingLead?.city}
                  onPick={(val) => setEditingLead({ ...editingLead, jobAt: val, jobReminderSent: false })}
                />
              )}
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                {editingLead?.id && (
                  <button type="button" disabled={copyingLink !== null} onClick={() => void copyBookingLink("job")}
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50">
                    {linkFeedback?.type === "job" && !linkFeedback.error ? <Check className="h-3.5 w-3.5 shrink-0" /> : <Link2 className="h-3.5 w-3.5 shrink-0" />}
                    {copyingLink === "job" ? "Copying…" : "Copy booking link"}
                  </button>
                )}
                {(role === "manager" || role === "super_admin") && editingLead?.jobAt && (
                  <button
                    type="button"
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (!window.confirm("Cancel this job booking? The date/time will be cleared; nothing else on the lead changes.")) return;
                      setEditingLead({
                        ...editingLead,
                        jobAt: "",
                        jobEndAt: "",
                        jobWorkSegments: [],
                        jobReminderSent: false,
                      });
                    }}
                  >
                    <Ban className="h-3.5 w-3.5 shrink-0" />Cancel job
                  </button>
                )}
              </div>
              {linkFeedback?.type === "job" && <p role={linkFeedback.error ? "alert" : "status"} className={`text-xs ${linkFeedback.error ? "text-red-700" : "text-emerald-700"}`}>{linkFeedback.message}</p>}
              <p className="text-xs leading-relaxed text-slate-500">Scheduled bookings trigger a reminder 24 hours before the visit.</p>
            </section>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Lead Notes & Customer Request Details</label>
            <textarea
              rows={3}
              value={editingLead?.notes || ""}
              onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
              className="mt-1 min-w-0 w-full bg-white p-2.5 border border-slate-200 rounded-xl"
              placeholder="Enter details, observations or quote instructions..."
            />
          </div>

          {editingLead?.id && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">Log a Call</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Call Attempted",
                  "Connected",
                  "No Answer",
                  "Callback Requested",
                  "Customer Interested",
                  "Not Interested",
                ].map((outcome) => (
                  <button
                    key={outcome}
                    type="button"
                    onClick={() => logCall(editingLead.id!, outcome)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:border-blue-400 transition-colors cursor-pointer"
                  >
                    <Phone className="w-3 h-3" />
                    {outcome}
                  </button>
                ))}
              </div>
            </div>
          )}

          {editingLead?.activity && editingLead.activity.length > 0 && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">Activity History</label>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/70 divide-y divide-slate-100">
                {[...editingLead.activity].reverse().map((a, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 px-3 py-2 text-[11px]">
                    <div>
                      <span className="font-semibold text-slate-800">{a.action}</span>
                      {a.detail ? <span className="text-slate-500"> — {a.detail}</span> : null}
                      <div className="text-slate-400">by {a.actor}</div>
                    </div>
                    <div className="shrink-0 text-slate-400">{fmtDate(a.time)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {saveError && <p role="alert" className="whitespace-pre-line rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{saveError}</p>}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setLeadModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
            >
              {saving ? "Saving…" : "Save Lead"}
            </button>
          </div>
          </fieldset>
        </form>
      </div>
      {plannerFor && editingLead && (
        <BookingPlanner
          type={plannerFor}
          lead={editingLead}
          value={plannerFor === "inspection" ? editingLead.inspectionAt : editingLead.jobAt}
          onPick={(val) =>
            setEditingLead(
              plannerFor === "inspection"
                ? { ...editingLead, inspectionAt: val, inspectionReminderSent: false }
                : { ...editingLead, jobAt: val, jobReminderSent: false }
            )
          }
          onClose={() => setPlannerFor(null)}
        />
      )}
    </div>
  );
}
