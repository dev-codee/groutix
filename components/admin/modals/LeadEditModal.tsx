"use client";

import { useRef } from "react";
import { X, Phone } from "lucide-react";
import type { Lead } from "@/components/admin/types";
import { fmtDate, getRoleStatusOptions } from "@/lib/adminHelpers";
import type { Role } from "@/lib/roles";

interface Props {
  editingLead: Partial<Lead> | null;
  setEditingLead: React.Dispatch<React.SetStateAction<Partial<Lead> | null>>;
  setLeadModalOpen: (v: boolean) => void;
  handleSaveLead: (e: React.FormEvent) => void;
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
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center p-3 sm:p-4 sm:pt-10 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-4 sm:p-6 space-y-4 my-4 sm:my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-black text-slate-900">
            {editingLead?.id ? "Edit Customer Lead" : "Add New Customer Lead"}
          </h2>
          <button
            onClick={() => setLeadModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveLead} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={editingLead?.name || ""}
                onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
              <input
                type="text"
                value={editingLead?.phone || ""}
                onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                value={editingLead?.email || ""}
                onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
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
                className="w-full p-2.5 border border-slate-200 rounded-xl"
                placeholder="Start typing an address..."
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Service / Task Required</label>
              <input
                type="text"
                value={editingLead?.service || ""}
                onChange={(e) => setEditingLead({ ...editingLead, service: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
                placeholder="e.g. Shower Regrouting, Epoxy, Balcony"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Lead Status</label>
              <select
                value={editingLead?.status || "New"}
                onChange={(e) => setEditingLead({ ...editingLead, status: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
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
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
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
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Next Follow-Up</label>
              <input
                type="datetime-local"
                value={editingLead?.follow ? editingLead.follow.slice(0, 16) : ""}
                onChange={(e) => setEditingLead({ ...editingLead, follow: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-2">
                Inspection Date &amp; Time
                {editingLead?.inspectionRescheduled && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Rescheduled</span>
                )}
              </label>
              <input
                type="datetime-local"
                min="2026-09-28T09:00"
                value={editingLead?.inspectionAt ? editingLead.inspectionAt.slice(0, 16) : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && new Date(val).getDay() === 0) {
                    alert("Sunday bookings are not available. Please select Monday to Saturday.");
                    return;
                  }
                  setEditingLead({
                    ...editingLead,
                    inspectionAt: val,
                    inspectionReminderSent: false,
                  });
                }}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
              <div className="flex items-center gap-2 mt-1.5">
                <p className="text-[10px] text-slate-400">Triggers a 24-hour reminder to the customer.</p>
                {editingLead?.id && (
                  <button
                    type="button"
                    className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap cursor-pointer"
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/admin/booking-link/${editingLead.id}`);
                        const data = await res.json();
                        if (data.inspectionUrl) {
                          await navigator.clipboard.writeText(data.inspectionUrl);
                          const btn = document.activeElement as HTMLButtonElement;
                          const orig = btn.textContent;
                          btn.textContent = "✓ Copied!";
                          setTimeout(() => { btn.textContent = orig; }, 1500);
                        }
                      } catch { /* silently fail */ }
                    }}
                  >
                    📋 Copy Inspection Booking Link
                  </button>
                )}
                {(role === "manager" || role === "super_admin") && editingLead?.inspectionAt && (
                  <button
                    type="button"
                    className="text-[10px] font-semibold text-red-600 hover:text-red-700 whitespace-nowrap cursor-pointer"
                    onClick={() => {
                      if (!window.confirm("Cancel this inspection booking? The date/time will be cleared; nothing else on the lead changes.")) return;
                      setEditingLead({
                        ...editingLead,
                        inspectionAt: "",
                        inspectionReminderSent: false,
                      });
                    }}
                  >
                    ✕ Cancel Inspection Booking
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Job Date &amp; Time</label>
              <input
                type="datetime-local"
                min="2026-09-28T09:00"
                value={editingLead?.jobAt ? editingLead.jobAt.slice(0, 16) : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && new Date(val).getDay() === 0) {
                    alert("Sunday bookings are not available. Please select Monday to Saturday.");
                    return;
                  }
                  setEditingLead({
                    ...editingLead,
                    jobAt: val,
                    jobReminderSent: false,
                  });
                }}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
              <div className="flex items-center gap-2 mt-1.5">
                <p className="text-[10px] text-slate-400">Triggers a 24-hour reminder to the customer.</p>
                {editingLead?.id && (
                  <button
                    type="button"
                    className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap cursor-pointer"
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/admin/booking-link/${editingLead.id}`);
                        const data = await res.json();
                        if (data.jobUrl) {
                          await navigator.clipboard.writeText(data.jobUrl);
                          const btn = document.activeElement as HTMLButtonElement;
                          const orig = btn.textContent;
                          btn.textContent = "✓ Copied!";
                          setTimeout(() => { btn.textContent = orig; }, 1500);
                        }
                      } catch { /* silently fail */ }
                    }}
                  >
                    📋 Copy Job Booking Link
                  </button>
                )}
                {(role === "manager" || role === "super_admin") && editingLead?.jobAt && (
                  <button
                    type="button"
                    className="text-[10px] font-semibold text-red-600 hover:text-red-700 whitespace-nowrap cursor-pointer"
                    onClick={() => {
                      if (!window.confirm("Cancel this job booking? The date/time will be cleared; nothing else on the lead changes.")) return;
                      setEditingLead({
                        ...editingLead,
                        jobAt: "",
                        jobReminderSent: false,
                      });
                    }}
                  >
                    ✕ Cancel Job Booking
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Lead Notes & Customer Request Details</label>
            <textarea
              rows={3}
              value={editingLead?.notes || ""}
              onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl"
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
              Save Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
