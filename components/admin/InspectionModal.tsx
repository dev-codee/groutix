"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Printer,
  Save,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  Loader2,
  User,
  Plus,
  Car,
  Trash2,
} from "lucide-react";
import {
  type InspectionReportDoc,
  type RoomInspection,
  type ParkingInfo,
  type IssueType,
  type RecommendedWorkType,
  type ParkingType,
  type ParkingRestrictionType,
  makeRoom,
  ROOM_TYPE_LABELS,
  WORK_AREA_LABELS,
  SHOWER_SIZE_LABELS,
  WORK_CONFIG_LABELS,
  WALL_HEIGHT_LABELS,
  ISSUE_LABELS,
  RECOMMENDED_WORK_LABELS,
  GROUT_TYPE_LABELS,
  PARKING_TYPE_LABELS,
  PARKING_RESTRICTION_LABELS,
  COST_ARRANGEMENT_LABELS,
} from "@/lib/inspection";

// ── small UI helpers ──────────────────────────────────────────────────────────

function Chip({
  active,
  onClick,
  children,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-2 text-xs font-medium transition-all py-0.5 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0 transition-all ${
        active ? "bg-[#1a6060] border-[#1a6060]" : "border-slate-400 bg-white"
      }`}>
        {active && (
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
      <span className={active ? "text-slate-900 font-semibold" : "text-slate-600"}>{children}</span>
    </button>
  );
}

function SectionHeader({ num, title }: { num: number; title: string }) {
  return (
    <div className="flex items-center gap-0 mb-4 -mx-4">
      <div className="bg-[#1a6060] text-white px-4 py-2 flex items-center gap-3 w-full">
        <span className="w-5 h-5 rounded-full border border-white/60 text-white flex items-center justify-center text-[10px] font-black shrink-0">
          {num}
        </span>
        <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">{title}</h3>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-bold text-[#1a6060] uppercase tracking-wider mb-1">
      {children}
    </label>
  );
}

// ── Room form ─────────────────────────────────────────────────────────────────

function RoomForm({
  room,
  onChange,
  readOnly,
}: {
  room: RoomInspection;
  onChange: (updated: RoomInspection) => void;
  readOnly: boolean;
}) {
  function toggleArr<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  function setField<K extends keyof RoomInspection>(key: K, val: RoomInspection[K]) {
    onChange({ ...room, [key]: val });
  }

  const hasShower = room.workAreas.includes("shower");
  const hasPaidParking = false; // parking handled separately

  // Issue details map
  const issueDetailsMap: Record<string, string> = {};
  for (const d of room.issueDetails || []) {
    issueDetailsMap[d.type] = d.where || "";
  }

  function setIssueWhere(type: IssueType, where: string) {
    const existing = room.issueDetails || [];
    const idx = existing.findIndex((d) => d.type === type);
    const next =
      idx >= 0
        ? existing.map((d, i) => (i === idx ? { ...d, where } : d))
        : [...existing, { type, where }];
    setField("issueDetails", next);
  }

  function getIssueNote(type: IssueType): string {
    return room.issueDetails?.find((d) => d.type === type)?.extraNote || "";
  }

  function setIssueNote(type: IssueType, note: string) {
    const existing = room.issueDetails || [];
    const idx = existing.findIndex((d) => d.type === type);
    const next =
      idx >= 0
        ? existing.map((d, i) => (i === idx ? { ...d, extraNote: note } : d))
        : [...existing, { type, extraNote: note }];
    setField("issueDetails", next);
  }

  const inputCls = `w-full px-1 py-1 bg-transparent border-0 border-b-2 border-slate-300 rounded-none text-xs font-medium text-slate-900 focus:ring-0 focus:border-[#1a6060] focus:outline-none transition-colors ${readOnly ? "cursor-not-allowed text-slate-600 border-slate-200" : ""}`;

  return (
    <div className="space-y-5">

      {/* ── Section 1: Room and inspection area ─── */}
      <div className="p-4 pt-0">
        <SectionHeader num={1} title="Room and Inspection Area" />

        <div className="space-y-3">
          <div>
            <FieldLabel>Room Type</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {(["main_bathroom", "ensuite", "guest_bathroom", "other"] as const).map((rt) => (
                <Chip
                  key={rt}
                  active={room.roomType === rt}
                  disabled={readOnly}
                  onClick={() => setField("roomType", rt)}
                >
                  {ROOM_TYPE_LABELS[rt]}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Room Name / Number</FieldLabel>
            <input
              type="text"
              readOnly={readOnly}
              value={room.roomName || ""}
              onChange={(e) => setField("roomName", e.target.value)}
              placeholder="e.g. Ensuite 1, Ground Floor"
              className={inputCls}
            />
          </div>

          <div>
            <FieldLabel>Work Area</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {(["shower", "bathroom_floor", "bath", "vanity", "other"] as const).map((wa) => (
                <Chip
                  key={wa}
                  active={room.workAreas.includes(wa)}
                  disabled={readOnly}
                  onClick={() => setField("workAreas", toggleArr(room.workAreas, wa))}
                >
                  {WORK_AREA_LABELS[wa]}
                </Chip>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-3 py-2 text-[11px] text-slate-500 font-medium">
            + Overview photo — stand back so the whole inspection area is visible (add via Photos tab)
          </div>
        </div>
      </div>

      {/* ── Section 2: Shower details (conditional) ─── */}
      {hasShower && (
        <div className="p-4 pt-0">
          <SectionHeader num={2} title="Shower Details" />

          <div className="space-y-3">
            <div>
              <FieldLabel>Shower Size</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {(["single", "double", "custom_extended"] as const).map((s) => (
                  <Chip
                    key={s}
                    active={room.showerSize === s}
                    disabled={readOnly}
                    onClick={() => setField("showerSize", s)}
                  >
                    {SHOWER_SIZE_LABELS[s]}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <FieldLabel>Width (mm)</FieldLabel>
                <input
                  type="number"
                  readOnly={readOnly}
                  value={room.showerWidthMm || ""}
                  onChange={(e) => setField("showerWidthMm", Number(e.target.value) || undefined)}
                  placeholder="e.g. 900"
                  className={inputCls}
                />
              </div>
              <div>
                <FieldLabel>Depth (mm)</FieldLabel>
                <input
                  type="number"
                  readOnly={readOnly}
                  value={room.showerDepthMm || ""}
                  onChange={(e) => setField("showerDepthMm", Number(e.target.value) || undefined)}
                  placeholder="e.g. 1200"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Work Configuration</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {(["walls_and_tiled_floor", "walls_to_pan", "walls_to_bath", "walls_only", "shower_floor_only"] as const).map((wc) => (
                  <Chip
                    key={wc}
                    active={room.workConfig === wc}
                    disabled={readOnly}
                    onClick={() => setField("workConfig", wc)}
                  >
                    {WORK_CONFIG_LABELS[wc]}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Wall Work Height</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {(["shower_screen_height", "to_ceiling", "custom_section"] as const).map((wh) => (
                  <Chip
                    key={wh}
                    active={room.wallHeight === wh}
                    disabled={readOnly}
                    onClick={() => setField("wallHeight", wh)}
                  >
                    {WALL_HEIGHT_LABELS[wh]}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <FieldLabel>Height (mm)</FieldLabel>
                <input
                  type="number"
                  readOnly={readOnly}
                  value={room.wallHeightMm || ""}
                  onChange={(e) => setField("wallHeightMm", Number(e.target.value) || undefined)}
                  placeholder="e.g. 2100"
                  className={inputCls}
                />
              </div>
              {room.wallHeight === "custom_section" && (
                <div>
                  <FieldLabel>Custom Section Details</FieldLabel>
                  <input
                    type="text"
                    readOnly={readOnly}
                    value={room.wallHeightCustomSection || ""}
                    onChange={(e) => setField("wallHeightCustomSection", e.target.value)}
                    placeholder="Describe custom section"
                    className={inputCls}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Section 3: What did you find ─── */}
      <div className="p-4 pt-0">
        <SectionHeader num={3} title="What Did You Find?" />

        <p className="text-[11px] text-slate-500 mb-3">Select observed issues. Leave uninspected areas as Not Inspected.</p>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(Object.keys(ISSUE_LABELS) as IssueType[]).map((issue) => (
              <Chip
                key={issue}
                active={room.issues.includes(issue)}
                disabled={readOnly}
                onClick={() => {
                  const next = toggleArr(room.issues, issue);
                  setField("issues", next);
                  if (!next.includes(issue)) {
                    setField("issueDetails", (room.issueDetails || []).filter((d) => d.type !== issue));
                  }
                }}
              >
                {ISSUE_LABELS[issue]}
              </Chip>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Chip
              active={!!room.noVisibleDefects}
              disabled={readOnly}
              onClick={() => setField("noVisibleDefects", !room.noVisibleDefects)}
            >
              No Visible Defects in Inspected Area
            </Chip>
            <Chip
              active={!!room.notInspected}
              disabled={readOnly}
              onClick={() => setField("notInspected", !room.notInspected)}
            >
              Not Inspected / Access Limited
            </Chip>
          </div>
        </div>

        {/* Per-issue details */}
        {room.issues.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Findings & Evidence</div>
            {room.issues.map((issue) => (
              <div key={issue} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2">
                <div className="text-xs font-bold text-[#1a6060]">{ISSUE_LABELS[issue]}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <FieldLabel>Where?</FieldLabel>
                    <input
                      type="text"
                      readOnly={readOnly}
                      value={issueDetailsMap[issue] || ""}
                      onChange={(e) => setIssueWhere(issue, e.target.value)}
                      placeholder="e.g. bottom-left corner, perimeter"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel>Extra Note</FieldLabel>
                    <input
                      type="text"
                      readOnly={readOnly}
                      value={getIssueNote(issue)}
                      onChange={(e) => setIssueNote(issue, e.target.value)}
                      placeholder="Optional note"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="rounded border border-dashed border-slate-300 bg-white px-2.5 py-1.5 text-[11px] text-slate-400">
                  + Defect close-up photo (add via Photos tab — show the affected joint, tile or surface clearly)
                </div>
              </div>
            ))}

            {/* Leak questions */}
            <div className="border border-amber-200/80 rounded-lg p-3 bg-amber-50/30 space-y-3">
              <div>
                <FieldLabel>Leak Reported by Customer?</FieldLabel>
                <div className="flex gap-1.5">
                  {(["yes", "no", "unknown"] as const).map((v) => (
                    <Chip key={v} active={room.leakReportedByCustomer === v} disabled={readOnly}
                      onClick={() => setField("leakReportedByCustomer", v)}>
                      {v === "yes" ? "Yes" : v === "no" ? "No" : "Unknown"}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel>Leak Observed During Inspection?</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {(["yes", "no", "inconclusive", "not_assessed"] as const).map((v) => (
                    <Chip key={v} active={room.leakObserved === v} disabled={readOnly}
                      onClick={() => setField("leakObserved", v)}>
                      {v === "yes" ? "Yes" : v === "no" ? "No" : v === "inconclusive" ? "Inconclusive" : "Not Assessed"}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 4: Recommended work ─── */}
      <div className="p-4 pt-0">
        <SectionHeader num={4} title="Recommended Work" />

        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(RECOMMENDED_WORK_LABELS) as RecommendedWorkType[]).map((w) => (
              <Chip
                key={w}
                active={room.recommendedWork.includes(w)}
                disabled={readOnly}
                onClick={() => setField("recommendedWork", toggleArr(room.recommendedWork, w))}
              >
                {RECOMMENDED_WORK_LABELS[w]}
              </Chip>
            ))}
            <Chip active={!!room.noWorkRecommended} disabled={readOnly}
              onClick={() => setField("noWorkRecommended", !room.noWorkRecommended)}>
              No Work Recommended
            </Chip>
          </div>

          {room.recommendedWork.includes("regrout") && (
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2">
              <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">If Regrouting — Grout Type</div>
              <div className="flex flex-wrap gap-1.5">
                {(["polymer", "epoxy", "quote_both", "to_confirm"] as const).map((g) => (
                  <Chip key={g} active={room.groutType === g} disabled={readOnly}
                    onClick={() => setField("groutType", g)}>
                    {GROUT_TYPE_LABELS[g]}
                  </Chip>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Grout Colour</FieldLabel>
                  <input type="text" readOnly={readOnly}
                    value={room.groutColour || ""}
                    onChange={(e) => setField("groutColour", e.target.value)}
                    placeholder="e.g. White, Charcoal"
                    className={inputCls} />
                </div>
                <div>
                  <FieldLabel>Silicone Colour</FieldLabel>
                  <input type="text" readOnly={readOnly}
                    value={room.siliconeColour || ""}
                    onChange={(e) => setField("siliconeColour", e.target.value)}
                    placeholder="e.g. White, Grey"
                    className={inputCls} />
                </div>
              </div>
            </div>
          )}

          <div>
            <FieldLabel>Access Limitations / Exclusions</FieldLabel>
            <input type="text" readOnly={readOnly}
              value={room.accessLimitations || ""}
              onChange={(e) => setField("accessLimitations", e.target.value)}
              placeholder="e.g. No access to ceiling void"
              className={inputCls} />
          </div>
          <div>
            <FieldLabel>Additional Notes (Optional)</FieldLabel>
            <textarea rows={2} readOnly={readOnly}
              value={room.additionalNotes || ""}
              onChange={(e) => setField("additionalNotes", e.target.value)}
              placeholder="Any additional observations or context"
              className={inputCls + " resize-none"} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Parking form ──────────────────────────────────────────────────────────────

function ParkingForm({
  parking,
  onChange,
  readOnly,
}: {
  parking: ParkingInfo;
  onChange: (p: ParkingInfo) => void;
  readOnly: boolean;
}) {
  function toggleArr<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  const isPaid = parking.types.some((t) => ["paid_street", "paid_car_park", "building_basement"].includes(t));

  const inputCls = `w-full px-1 py-1 bg-transparent border-0 border-b-2 border-slate-300 rounded-none text-xs font-medium text-slate-900 focus:ring-0 focus:border-[#1a6060] focus:outline-none transition-colors ${readOnly ? "cursor-not-allowed text-slate-600 border-slate-200" : ""}`;

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Car className="w-4 h-4 text-[#1a6060]" />
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">6 — Parking & Vehicle Access</h3>
        <span className="text-[10px] text-slate-400">(recorded once for the property)</span>
      </div>

      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Where Can the Technician Park?</div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(PARKING_TYPE_LABELS) as ParkingType[]).map((pt) => (
            <Chip key={pt} active={parking.types.includes(pt)} disabled={readOnly}
              onClick={() => onChange({ ...parking, types: toggleArr(parking.types, pt) })}>
              {PARKING_TYPE_LABELS[pt]}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Space Number / Location</div>
        <input type="text" readOnly={readOnly} value={parking.spaceLocation || ""}
          onChange={(e) => onChange({ ...parking, spaceLocation: e.target.value })}
          placeholder="e.g. Bay 12, Level 2" className={inputCls} />
      </div>

      {isPaid && (
        <div className="border border-amber-200/60 rounded-lg p-3 bg-amber-50/30 space-y-3">
          <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Paid Parking Details</div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cost ($/hr)</div>
              <input type="number" readOnly={readOnly} value={parking.paidCostPerHour || ""}
                onChange={(e) => onChange({ ...parking, paidCostPerHour: Number(e.target.value) || undefined })}
                placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Flat Fee ($)</div>
              <input type="number" readOnly={readOnly} value={parking.paidFlatFee || ""}
                onChange={(e) => onChange({ ...parking, paidFlatFee: Number(e.target.value) || undefined })}
                placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Est. Total ($)</div>
              <input type="number" readOnly={readOnly} value={parking.paidEstimatedTotal || ""}
                onChange={(e) => onChange({ ...parking, paidEstimatedTotal: Number(e.target.value) || undefined })}
                placeholder="0.00" className={inputCls} />
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Parking Cost Arrangement</div>
            <div className="flex flex-wrap gap-1.5">
              {(["included_in_quote", "charged_separately", "client_pays_directly", "to_be_confirmed"] as const).map((ca) => (
                <Chip key={ca} active={parking.costArrangement === ca} disabled={readOnly}
                  onClick={() => onChange({ ...parking, costArrangement: ca })}>
                  {COST_ARRANGEMENT_LABELS[ca]}
                </Chip>
              ))}
            </div>
          </div>
          {parking.costArrangement === "charged_separately" && (
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Agreed Allowance / Cap ($)</div>
              <input type="number" readOnly={readOnly} value={parking.chargedSeparatelyAllowance || ""}
                onChange={(e) => onChange({ ...parking, chargedSeparatelyAllowance: Number(e.target.value) || undefined })}
                placeholder="Or leave blank to confirm later" className={inputCls} />
            </div>
          )}
        </div>
      )}

      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Restrictions or Access Arrangements</div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(PARKING_RESTRICTION_LABELS) as ParkingRestrictionType[]).map((r) => (
            <Chip key={r} active={parking.restrictions.includes(r)} disabled={readOnly}
              onClick={() => onChange({ ...parking, restrictions: toggleArr(parking.restrictions, r) })}>
              {PARKING_RESTRICTION_LABELS[r]}
            </Chip>
          ))}
        </div>
      </div>

      {parking.restrictions.some((r) => r !== "none_known") && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {parking.restrictions.includes("time_limit") && (
            <>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Time Limit</div>
                <input type="text" readOnly={readOnly} value={parking.timeLimit || ""}
                  onChange={(e) => onChange({ ...parking, timeLimit: e.target.value })}
                  placeholder="e.g. 2 hrs" className={inputCls} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Allowed Hours</div>
                <input type="text" readOnly={readOnly} value={parking.allowedHours || ""}
                  onChange={(e) => onChange({ ...parking, allowedHours: e.target.value })}
                  placeholder="e.g. 8am–6pm" className={inputCls} />
              </div>
            </>
          )}
          {parking.restrictions.includes("height_restriction") && (
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Height Clearance (m)</div>
              <input type="number" readOnly={readOnly} value={parking.heightClearanceM || ""}
                onChange={(e) => onChange({ ...parking, heightClearanceM: Number(e.target.value) || undefined })}
                placeholder="e.g. 2.1" className={inputCls} />
            </div>
          )}
          {parking.restrictions.includes("permit_required") && (
            <>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Permit Arranged By</div>
                <input type="text" readOnly={readOnly} value={parking.permitArrangedBy || ""}
                  onChange={(e) => onChange({ ...parking, permitArrangedBy: e.target.value })}
                  placeholder="Name / role" className={inputCls} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</div>
                <div className="flex gap-1.5">
                  <Chip active={parking.permitStatus === "confirmed"} disabled={readOnly}
                    onClick={() => onChange({ ...parking, permitStatus: "confirmed" })}>Confirmed</Chip>
                  <Chip active={parking.permitStatus === "pending"} disabled={readOnly}
                    onClick={() => onChange({ ...parking, permitStatus: "pending" })}>Pending</Chip>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Entry / Unloading Instructions</div>
        <textarea rows={2} readOnly={readOnly}
          value={parking.entryInstructions || ""}
          onChange={(e) => onChange({ ...parking, entryInstructions: e.target.value })}
          placeholder="e.g. Use south entrance, buzz unit 42"
          className={inputCls + " resize-none"} />
      </div>

      <div className="rounded border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
        + Optional photo of parking sign, entrance or allocated bay (add via Photos tab)
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

interface LeadLike {
  id: string;
  jobNo?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  inspectionAt?: string;
  status?: string;
  assigned?: string;
  inspectionReport?: InspectionReportDoc;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lead: LeadLike;
  currentUsername?: string;
  technicians?: { id: string; name: string }[];
  readOnly?: boolean;
  onSave: (report: InspectionReportDoc, markCompleted?: boolean) => Promise<boolean>;
}

export function InspectionModal({ isOpen, onClose, lead, currentUsername, technicians = [], readOnly = false, onSave }: Props) {
  const [report, setReport] = useState<InspectionReportDoc>(() => buildInitial(lead, currentUsername));
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setReport(buildInitial(lead, currentUsername));
    setSaveSuccess(false);
    setErrorMsg("");
  }, [isOpen, lead, currentUsername]);

  if (!isOpen) return null;

  function buildInitial(l: LeadLike, username?: string): InspectionReportDoc {
    const ex: Partial<InspectionReportDoc> = l.inspectionReport || {};
    const defaultDate = l.inspectionAt ? l.inspectionAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
    return {
      customerName: ex.customerName || l.name || "",
      inspectionDate: ex.inspectionDate || defaultDate,
      inspectorName: ex.inspectorName || l.assigned || username || "",
      propertyAddress: ex.propertyAddress || [l.address, l.city, l.state].filter(Boolean).join(", "),
      leadJobNo: ex.leadJobNo || l.jobNo || `GX-${l.id.slice(-6).toUpperCase()}`,
      rooms: ex.rooms && ex.rooms.length > 0 ? ex.rooms : [makeRoom()],
      parking: ex.parking || { types: [], restrictions: [] },
      estimatedTime: ex.estimatedTime || "",
      suggestedTechnician: ex.suggestedTechnician || (l as any).technician || "",
      quoteBuildFromReport: ex.quoteBuildFromReport || "YES",
      warrantyEligible: ex.warrantyEligible ?? "YES",
      inspectorNotes: ex.inspectorNotes || "",
      inspectorSignature: ex.inspectorSignature || ex.inspectorName || username || "",
      customerAcknowledgement: ex.customerAcknowledgement || "",
      findings: ex.findings || {},
      otherDetails: ex.otherDetails || "",
      status: ex.status || "draft",
      completedAt: ex.completedAt,
      updatedAt: ex.updatedAt,
    };
  }

  const rooms = report.rooms || [makeRoom()];
  const parking = report.parking || { types: [], restrictions: [] };

  function updateRoom(idx: number, updated: RoomInspection) {
    const next = rooms.map((r, i) => (i === idx ? updated : r));
    setReport((prev) => ({ ...prev, rooms: next }));
  }

  function addRoom() {
    const next = [...rooms, makeRoom()];
    setReport((prev) => ({ ...prev, rooms: next }));
    setTimeout(() => {
      document.getElementById(`room-section-${next[next.length - 1].id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function removeRoom(idx: number) {
    if (rooms.length <= 1) return;
    const next = rooms.filter((_, i) => i !== idx);
    setReport((prev) => ({ ...prev, rooms: next }));
  }

  function scrollToRoom(id: string) {
    document.getElementById(`room-section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSave(markCompleted = false) {
    if (readOnly) return;
    setSaving(true);
    setErrorMsg("");
    setSaveSuccess(false);
    const now = new Date().toISOString();
    const updated: InspectionReportDoc = {
      ...report,
      rooms,
      parking,
      status: markCompleted ? "completed" : report.status || "draft",
      completedAt: markCompleted ? now : report.completedAt,
      updatedAt: now,
    };
    try {
      const ok = await onSave(updated, markCompleted);
      if (ok) {
        setReport(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        if (markCompleted) setTimeout(() => onClose(), 1200);
      } else {
        setErrorMsg("Failed to save. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = `w-full px-1 py-1 bg-transparent border-0 border-b-2 border-slate-300 rounded-none text-xs font-medium text-slate-900 focus:ring-0 focus:border-[#1a6060] focus:outline-none transition-colors ${readOnly ? "cursor-not-allowed text-slate-600 border-slate-200" : ""}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #printable-inspection-report, #printable-inspection-report * { visibility: visible; }
          #printable-inspection-report { position: absolute; left: 0; top: 0; width: 100%; padding: 12px; background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div id="printable-inspection-report"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[96vh] flex flex-col overflow-hidden border border-slate-200">

        {/* Header */}
        <div className="no-print bg-white px-4 pt-3 pb-2.5 flex items-center justify-between border-b-2 border-[#1a6060] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded bg-[#1a6060] text-white flex items-center justify-center font-black text-sm tracking-tight">GX</div>
            <div className="min-w-0">
              <div className="text-base font-black text-slate-900 leading-tight tracking-tight">GROUTIX</div>
              <div className="text-[9px] font-bold text-[#1a6060] tracking-widest uppercase leading-tight">Simplified Site Inspection</div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap ml-2">
              {readOnly && (
                <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono text-[10px] font-black">READ-ONLY</span>
              )}
              {(report.leadJobNo || lead.jobNo) && (
                <span className="px-2.5 py-0.5 rounded bg-[#1a6060] text-white font-mono text-[11px] font-black">
                  {report.leadJobNo || lead.jobNo}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button type="button" onClick={() => window.print()}
              className="px-2.5 py-1 rounded border border-[#1a6060] text-[#1a6060] text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-teal-50 transition-colors">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button type="button" onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Prefilled header metadata */}
        <div className="px-4 py-3 border-b border-slate-200 bg-white shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2.5 text-xs">
            <div>
              <label className="block text-[9px] font-bold text-[#1a6060] uppercase tracking-widest mb-0.5">Customer</label>
              <input type="text" readOnly={readOnly}
                value={report.customerName || ""}
                onChange={(e) => setReport({ ...report, customerName: e.target.value })}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#1a6060] uppercase tracking-widest mb-0.5">Job Number</label>
              <input type="text" readOnly
                value={report.leadJobNo || lead.jobNo || ""}
                className={inputCls + " cursor-not-allowed"} />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#1a6060] uppercase tracking-widest mb-0.5">Technician / Date</label>
              <div className="flex gap-2">
                <input type="text" readOnly={readOnly}
                  value={report.inspectorName || ""}
                  onChange={(e) => setReport({ ...report, inspectorName: e.target.value })}
                  placeholder="Technician"
                  className={inputCls} />
                <input type="date" readOnly={readOnly}
                  value={report.inspectionDate || ""}
                  onChange={(e) => setReport({ ...report, inspectionDate: e.target.value })}
                  className={inputCls + " w-36 shrink-0"} />
              </div>
            </div>
            <div className="sm:col-span-3">
              <label className="block text-[9px] font-bold text-[#1a6060] uppercase tracking-widest mb-0.5">Property / Address</label>
              <input type="text" readOnly={readOnly}
                value={report.propertyAddress || ""}
                onChange={(e) => setReport({ ...report, propertyAddress: e.target.value })}
                className={inputCls} />
            </div>
          </div>
        </div>

        {/* Quick nav: jump to a room, parking or final review without leaving the single-page flow */}
        <div className="no-print flex items-center gap-1 px-4 pt-2 pb-0 border-b border-slate-200 bg-white shrink-0 overflow-x-auto">
          {rooms.map((r, idx) => (
            <button key={r.id} type="button"
              onClick={() => scrollToRoom(r.id)}
              className="px-3 py-1.5 rounded-t-lg text-[11px] font-semibold border-b-2 border-transparent text-slate-500 hover:text-[#1a6060] hover:border-[#1a6060] whitespace-nowrap cursor-pointer transition-all">
              {ROOM_TYPE_LABELS[r.roomType]}{rooms.length > 1 ? ` ${idx + 1}` : ""}
            </button>
          ))}
          {!readOnly && (
            <button type="button" onClick={addRoom}
              className="px-2 py-1.5 rounded-t-lg text-[11px] font-semibold text-[#1a6060] hover:bg-teal-50 border-b-2 border-transparent flex items-center gap-0.5 cursor-pointer whitespace-nowrap">
              <Plus className="w-3 h-3" /> Room
            </button>
          )}
          <button type="button"
            onClick={() => document.getElementById("parking-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="ml-auto px-3 py-1.5 rounded-t-lg text-[11px] font-semibold border-b-2 border-transparent text-slate-500 hover:text-[#1a6060] hover:border-[#1a6060] whitespace-nowrap cursor-pointer">
            <Car className="w-3 h-3 inline mr-1" />Parking
          </button>
          <button type="button"
            onClick={() => document.getElementById("final-review-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="px-3 py-1.5 rounded-t-lg text-[11px] font-semibold border-b-2 border-transparent text-slate-500 hover:text-[#1a6060] hover:border-[#1a6060] whitespace-nowrap cursor-pointer">
            Final Review
          </button>
        </div>

        {/* Scrollable body: rooms, then parking, then final review — one continuous flow */}
        <div className="flex-1 overflow-y-auto p-4 space-y-8">

          {/* Rooms */}
          {rooms.map((room, idx) => (
            <div key={room.id} id={`room-section-${room.id}`} className="space-y-4 scroll-mt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <div className="text-xs font-black text-[#1a6060] uppercase tracking-widest">
                  Room {idx + 1} of {rooms.length} — {ROOM_TYPE_LABELS[room.roomType]}
                </div>
                {!readOnly && rooms.length > 1 && (
                  <button type="button" onClick={() => removeRoom(idx)}
                    className="flex items-center gap-1 px-2 py-1 border border-rose-200 text-rose-600 text-[10px] font-semibold hover:bg-rose-50 cursor-pointer rounded">
                    <Trash2 className="w-3 h-3" /> Remove Room
                  </button>
                )}
              </div>

              <RoomForm
                room={room}
                onChange={(updated) => updateRoom(idx, updated)}
                readOnly={readOnly}
              />
            </div>
          ))}

          {!readOnly && (
            <div className="border-t border-slate-200 pt-4">
              <button type="button" onClick={addRoom} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 border-2 border-[#1a6060] text-[#1a6060] text-xs font-bold hover:bg-teal-50 transition-colors cursor-pointer disabled:opacity-50 rounded uppercase tracking-wide">
                <Plus className="w-3.5 h-3.5" /> Add Another Room
              </button>
              <p className="text-[10px] text-slate-400 mt-2">Add every room that needs work, then continue to parking and final review below.</p>
            </div>
          )}

          {/* Parking — recorded once for the whole property, not per room */}
          <div id="parking-section" className="space-y-4 scroll-mt-2 border-t-4 border-slate-100 pt-6">
            <ParkingForm
              parking={parking}
              onChange={(p) => setReport((prev) => ({ ...prev, parking: p }))}
              readOnly={readOnly}
            />
          </div>

          {/* Final review */}
          <div id="final-review-section" className="space-y-4 scroll-mt-2 border-t-4 border-slate-100 pt-6">
            <div className="text-xs font-black text-[#1a6060] uppercase tracking-widest border-b border-slate-200 pb-1">
              Final Review
            </div>
            <div className="space-y-4">
              {/* Rooms summary */}
              <div className="p-4 pt-0">
                <div className="text-xs font-bold text-slate-900 mb-2">Rooms Summary ({rooms.length} room{rooms.length !== 1 ? "s" : ""})</div>
                <div className="space-y-1">
                  {rooms.map((r, i) => (
                    <div key={r.id} className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-700">
                        {ROOM_TYPE_LABELS[r.roomType]}{r.roomName ? ` — ${r.roomName}` : ""}
                      </span>
                      <span className="text-slate-400">
                        {r.workAreas.map((w) => WORK_AREA_LABELS[w]).join(", ")}
                      </span>
                      {r.issues.length > 0 && (
                        <span className="text-amber-700 font-semibold">{r.issues.length} issue{r.issues.length !== 1 ? "s" : ""}</span>
                      )}
                      {r.noVisibleDefects && <span className="text-emerald-600 font-semibold">No defects</span>}
                      <button type="button" onClick={() => scrollToRoom(r.id)}
                        className="ml-auto text-[#1a6060] hover:underline text-[10px] cursor-pointer">
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estimated time + technician suggestion */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-[#1a6060] uppercase tracking-widest mb-1">Estimated Time</label>
                  <p className="text-[10px] text-slate-400 mb-1.5">e.g. "4–6 hrs", "1.5 days"</p>
                  <input type="text" readOnly={readOnly}
                    value={report.estimatedTime || ""}
                    onChange={(e) => setReport({ ...report, estimatedTime: e.target.value })}
                    placeholder="e.g. 4–6 hours"
                    className={inputCls} />
                </div>

                {technicians.length > 0 && (
                  <div>
                    <label className="block text-[9px] font-bold text-[#1a6060] uppercase tracking-widest mb-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Suggest Technician for Job
                    </label>
                    <p className="text-[10px] text-slate-400 mb-1.5">Recommend based on your on-site assessment.</p>
                    <select disabled={readOnly}
                      value={report.suggestedTechnician || ""}
                      onChange={(e) => setReport({ ...report, suggestedTechnician: e.target.value })}
                      className={inputCls + " cursor-pointer"}>
                      <option value="">— No suggestion —</option>
                      {technicians.map((t) => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Inspector notes + quote/warranty */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-[9px] font-bold text-[#1a6060] uppercase tracking-widest mb-0.5">
                    Inspector Notes / Recommendation
                  </label>
                  <input type="text" readOnly={readOnly}
                    value={report.inspectorNotes || ""}
                    onChange={(e) => setReport({ ...report, inspectorNotes: e.target.value })}
                    placeholder="Recommended solution, e.g. Epoxy Grout Upgrade + Perimeter Sealing"
                    className={inputCls} />
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Quote from report:</span>
                    {(["YES", "NO"] as const).map((v) => (
                      <button key={v} type="button" disabled={readOnly}
                        onClick={() => !readOnly && setReport({ ...report, quoteBuildFromReport: v })}
                        className={`px-2 py-0.5 rounded text-xs font-semibold border cursor-pointer transition-colors ${report.quoteBuildFromReport === v ? "bg-[#1a6060] text-white border-[#1a6060]" : "bg-white text-slate-700 border-slate-300 hover:border-[#1a6060]"}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Warranty:</span>
                    {(["YES", "NO"] as const).map((v) => (
                      <button key={v} type="button" disabled={readOnly}
                        onClick={() => !readOnly && setReport({ ...report, warrantyEligible: v })}
                        className={`px-2 py-0.5 rounded text-xs font-bold border cursor-pointer transition-colors ${report.warrantyEligible === v ? (v === "YES" ? "bg-[#1a6060] text-white border-[#1a6060]" : "bg-slate-800 text-white border-slate-800") : "bg-white text-slate-700 border-slate-300"}`}>
                        {v === "YES" ? "ON" : "OFF"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <div>
                    <label className="block text-[9px] font-bold text-[#1a6060] uppercase tracking-widest mb-0.5">Inspector Signature / Confirmed By</label>
                    <input type="text" readOnly={readOnly}
                      value={report.inspectorSignature || ""}
                      onChange={(e) => setReport({ ...report, inspectorSignature: e.target.value })}
                      placeholder="Technician Name / Signature"
                      className={inputCls + " italic"} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-[#1a6060] uppercase tracking-widest mb-0.5">Customer Acknowledgement</label>
                    <input type="text" readOnly={readOnly}
                      value={report.customerAcknowledgement || ""}
                      onChange={(e) => setReport({ ...report, customerAcknowledgement: e.target.value })}
                      placeholder="Customer Name / Acknowledgement"
                      className={inputCls} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="no-print px-4 py-2.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Technician form preview · Single-page flow: rooms → parking → final review
            </span>
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Saved!
              </span>
            )}
            {errorMsg && (
              <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {errorMsg}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {readOnly ? (
              <button type="button" onClick={onClose}
                className="px-5 py-1.5 text-xs font-semibold bg-[#1a6060] hover:bg-[#154f4f] text-white rounded cursor-pointer">
                Close
              </button>
            ) : (
              <>
                <button type="button" onClick={onClose} disabled={saving}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer">
                  Cancel
                </button>
                <button type="button" onClick={() => handleSave(false)} disabled={saving}
                  className="px-4 py-1.5 text-xs font-semibold bg-white border border-[#1a6060] text-[#1a6060] hover:bg-teal-50 rounded flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Draft
                </button>
                <button type="button" onClick={() => handleSave(true)} disabled={saving}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#1a6060] hover:bg-[#154f4f] text-white rounded flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
                  Complete &amp; Submit
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
