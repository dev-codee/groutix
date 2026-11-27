"use client";

import type { ReactNode } from "react";

const YES_NO = ["Yes", "No"];
const optionLabels: Record<string, string> = {
  "Ensuite shower": "En Suite",
  "Main bathroom shower": "Main Bathroom",
  "Inside shower": "Shower Area Inside",
  "Outside shower": "Outside Shower",
  Single: "(SS) Single",
  Double: "(DS) Double Shower",
  Extended: "Extended Shower",
  "To screen (~2.1 m)": "(SH) Up to shower screen height (approx. 2.1 m)",
  "To ceiling": "(TC) To ceiling",
  "Above screen": "Above shower height but not to ceiling",
  "Grout and silicone": "Both",
  "Walls and floor": "Entire shower (WF) – walls and floor",
  "Floor only": "(FO) Floor only",
  "Walls only": "(WO) Walls only",
  "Selected areas": "Selective Areas",
  "Extra large": "Extra Large",
  "Bathroom floor": "Bathroom floor outside shower",
};
const ALL_JOINTS = "Both vertical & horizontal – inside & outside";
const req = <span className="text-red-600" aria-hidden="true">*</span>;

export type Checklist = {
  location: string; showerType: string; wallHeight: string; work: string; showerScope: string;
  wallCount: string; tileSize: string; mosaic: string; screen: string; siliconeJoints: string;
  wallTiles: string; floorTiles: string; tileAction: string; balconyArea: string;
  balconyTileSize: string; additional: string[]; notes: string;
  leakAreas: string[]; tileSizes: string[]; balconyTileSizes: string[];
  verticalJoints: string[]; horizontalJoints: string[]; tileActions: string[];
  leakNotes: string; balconyLeakage: string;
  workDetails: string; summaryNotes: string; wallTileActions: string[]; floorTileActions: string[];
};
export const emptyChecklist: Checklist = { location: "", showerType: "", wallHeight: "", work: "", showerScope: "", wallCount: "", tileSize: "", mosaic: "", screen: "", siliconeJoints: "", wallTiles: "", floorTiles: "", tileAction: "", balconyArea: "", balconyTileSize: "", additional: [], notes: "", leakAreas: [], tileSizes: [], balconyTileSizes: [], verticalJoints: [], horizontalJoints: [], tileActions: [], leakNotes: "", balconyLeakage: "", workDetails: "", summaryNotes: "", wallTileActions: [], floorTileActions: [] };

const checklistGrid = "grid grid-cols-1 gap-x-4 gap-y-2 @min-[440px]:grid-cols-2";
const sectionStyle = "min-w-0 rounded-lg border border-[#DBE3F0] px-2.5 py-1.5";

function ChecklistChoices({ id, title, options, selected, onToggle, multiple = false, required = false, error, readOnly, sectionNumber }: {
  id: string;
  title: string;
  options: readonly string[];
  selected: readonly string[];
  onToggle: (option: string) => void;
  multiple?: boolean;
  required?: boolean;
  error?: string;
  readOnly: boolean;
  sectionNumber?: number;
}) {
  const Title = sectionNumber ? "h3" : "span";
  const titleId = `${id}-title`;
  return (
    <div
      role="group"
      aria-labelledby={titleId}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`flex min-w-0 flex-wrap items-center gap-x-2.5 ${sectionNumber ? sectionStyle : ""}`}
    >
      <Title id={titleId} className={`min-w-0 max-w-full py-0.5 text-[13px] ${sectionNumber ? "font-bold text-[#001F97]" : "font-semibold text-neutral-800"}`}>
        {sectionNumber && `${sectionNumber}. `}{title} {required && req}
        {!multiple && <span className="sr-only"> (choose one{required ? ", required" : ""})</span>}
      </Title>
      {options.map((option) => (
        <label key={option} className="inline-flex min-h-7 max-w-full has-[:enabled]:cursor-pointer items-center gap-1.5 py-0.5 text-[13px] leading-snug text-neutral-700 hover:text-[#001F97]">
          <input
            type="checkbox"
            aria-invalid={error ? true : undefined}
            disabled={readOnly}
            checked={selected.includes(option)}
            onChange={() => onToggle(option)}
            className="h-4 w-4 shrink-0 accent-[#001F97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F63CC]"
          />
          {optionLabels[option] ?? option}
        </label>
      ))}
      {error && <p id={`${id}-error`} role="alert" className="basis-full text-xs text-red-700">{error}</p>}
    </div>
  );
}

function Section({ number, title, children }: { number: number; title: string; children?: ReactNode }) {
  return (
    <section className={sectionStyle}>
      <h3 className="mb-1 text-[13px] font-bold text-[#001F97]">{number}. {title}</h3>
      {children || <p className="text-xs text-neutral-500">Not applicable</p>}
    </section>
  );
}

function Count({ title, value, onChange }: { title: string; value: string; onChange?: (value: string) => void }) {
  const count = Number(value) || 0;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <p className="text-xs font-semibold">{title}</p>
      {onChange ? (
        <div className="inline-flex overflow-hidden rounded-lg border border-[#DBE3F0]">
          <button type="button" aria-label={`Decrease ${title.toLowerCase()}`} disabled={count <= 0}
            onClick={() => onChange(String(count - 1))} className="h-8 w-8 bg-[#EEF3FF] font-bold disabled:opacity-40">−</button>
          <output aria-live="polite" aria-label={title} className="min-w-9 px-1 text-center text-sm leading-8">{count}</output>
          <button type="button" aria-label={`Increase ${title.toLowerCase()}`}
            onClick={() => onChange(String(count + 1))} className="h-8 w-8 bg-[#EEF3FF] font-bold">+</button>
        </div>
      ) : <p className="text-sm">{value || "0"}</p>}
    </div>
  );
}

export default function QuoteChecklist({ id, checklist, leaking, errors = {}, onChange, onLeakChange, photos }: {
  id: string;
  checklist: Checklist;
  leaking: string;
  errors?: Record<string, string>;
  onChange?: (patch: Partial<Checklist>) => void;
  onLeakChange?: (value: string) => void;
  photos?: ReactNode;
}) {
  const readOnly = !onChange;
  const balconyOnly = checklist.location === "Balcony";
  const showShower = !balconyOnly;
  const tileSizes = ["Small", "Medium", "Large", "Extra large"];
  const joints = ["Inside", "Outside"];
  const bothVertical = joints.every((joint) => checklist.verticalJoints.includes(joint));
  const bothHorizontal = joints.every((joint) => checklist.horizontalJoints.includes(joint));
  const toggle = (options: string[], option: string) => options.includes(option)
    ? options.filter((value) => value !== option)
    : [...options, option];

  function single(key: { [K in keyof Checklist]: Checklist[K] extends string ? K : never }[keyof Checklist], title: string, options: string[], { required = false, sectionNumber }: { required?: boolean; sectionNumber?: number } = {}) {
    return <ChecklistChoices id={`${id}-${key}`} title={title} options={readOnly && checklist[key] ? [...new Set([...options, checklist[key]])] : options} selected={[checklist[key]]}
      onToggle={(option) => onChange?.({ [key]: checklist[key] === option ? "" : option })}
      readOnly={readOnly} required={required} error={errors[key]} sectionNumber={sectionNumber} />;
  }

  function multiple(key: { [K in keyof Checklist]: Checklist[K] extends string[] ? K : never }[keyof Checklist], title: string, options: string[], { legacy = [], sectionNumber }: { legacy?: string[]; sectionNumber?: number } = {}) {
    const selected = checklist[key].length ? checklist[key] : legacy;
    return <ChecklistChoices id={`${id}-${key}`} title={title} options={readOnly ? [...new Set([...options, ...selected])] : options} selected={selected}
      onToggle={(option) => onChange?.({ [key]: toggle(selected, option) })} readOnly={readOnly} multiple sectionNumber={sectionNumber} />;
  }

  function note(key: "notes" | "leakNotes" | "workDetails" | "summaryNotes", title: string) {
    return (
      <label className="flex flex-wrap items-center gap-x-2 gap-y-1 py-0.5 text-xs font-semibold text-neutral-800">
        <span>{title}</span>
        <textarea rows={1} maxLength={1000} value={checklist[key]} readOnly={readOnly}
          onChange={(event) => onChange?.({ [key]: event.target.value })}
          className="block min-h-8 min-w-0 grow basis-32 resize-y rounded-lg border border-[#DBE3F0] bg-[#FBFCFE] px-2 py-1.5 text-[13px] font-normal [field-sizing:content]" />
      </label>
    );
  }

  return (
    <div className="@container min-w-0">
      <div className={checklistGrid}>
        <div className="space-y-2">
          <Section number={1} title="Shower Leakage">
            {showShower && <>
              <ChecklistChoices id={`${id}-leaking`} title="Shower Leakage" options={readOnly && leaking === "Not sure" ? [...YES_NO, leaking] : YES_NO}
                selected={[leaking]} onToggle={(option) => onLeakChange?.(leaking === option ? "" : option)}
                readOnly={readOnly} error={errors.leaking} />
              <ChecklistChoices
                id={`${id}-location`}
                title="Area"
                options={["Ensuite shower", "Main bathroom shower", "Inside shower", "Outside shower", ...(readOnly && checklist.location === "Other shower" ? ["Other shower"] : [])]}
                selected={[checklist.location, ...checklist.leakAreas]}
                onToggle={(option) => {
                  if (option === "Inside shower" || option === "Outside shower") {
                    onChange?.({ leakAreas: toggle(checklist.leakAreas, option) });
                  } else {
                    onChange?.({ location: checklist.location === option ? "" : option });
                  }
                }}
                readOnly={readOnly}
                error={errors.location}
                multiple
              />
              {note("leakNotes", "Write Any Additional Information")}
            </>}
          </Section>
          {showShower ? single("showerType", "Shower Type (Select Shower Type)", ["Single", "Double", "Extended"], { sectionNumber: 2 }) : (
            <Section number={2} title="Shower Type (Select Shower Type)" />
          )}
          {showShower ? single("wallHeight", "Wall Height", ["To screen (~2.1 m)", "To ceiling", "Above screen"], { sectionNumber: 3 }) : (
            <Section number={3} title="Wall Height" />
          )}
          <Section number={4} title="Work Required">
            {single("work", "Work", ["Silicone only", "Grout only", "Grout and silicone"], { required: true })}
            {showShower && single("showerScope", "Shower areas", ["Walls and floor", "Floor only", "Walls only", "Selected areas"])}
            {showShower && note("workDetails", "Specify selective areas / additional details")}
          </Section>
          <Section number={5} title="Number of Tiled Walls">
            {showShower && <Count title="Tiled walls" value={checklist.wallCount} onChange={onChange && ((wallCount) => onChange({ wallCount }))} />}
          </Section>
        </div>
        <div className="space-y-2">
          {showShower ? multiple("tileSizes", "Select Tile Size", tileSizes, { legacy: checklist.tileSize ? [checklist.tileSize] : [], sectionNumber: 6 }) : (
            <Section number={6} title="Select Tile Size" />
          )}
          {showShower ? single("mosaic", "Mosaic Tiles", YES_NO, { sectionNumber: 7 }) : (
            <Section number={7} title="Mosaic Tiles" />
          )}
          {showShower ? single("screen", "Shower Screen Type", ["Frameless", "Semi-frameless"], { sectionNumber: 8 }) : (
            <Section number={8} title="Shower Screen Type" />
          )}
          <Section number={9} title="Silicone Joints (Frameless Shower Screen)">
            {showShower && <>
              <ChecklistChoices id={`${id}-vertical-joints`} title="Vertical Joints" options={[...joints, "Both"]}
                selected={bothVertical ? ["Both"] : checklist.verticalJoints}
                onToggle={(option) => onChange?.({
                  verticalJoints: option === "Both" ? (bothVertical ? [] : joints) : (bothVertical ? [option] : toggle(checklist.verticalJoints, option)),
                })}
                readOnly={readOnly} />
              <ChecklistChoices id={`${id}-horizontal-joints`} title="Horizontal Joints" options={[...joints, "Both"]}
                selected={bothHorizontal ? ["Both"] : checklist.horizontalJoints}
                onToggle={(option) => onChange?.({
                  horizontalJoints: option === "Both" ? (bothHorizontal ? [] : joints) : (bothHorizontal ? [option] : toggle(checklist.horizontalJoints, option)),
                })}
                readOnly={readOnly} />
              <label className="flex min-h-7 items-center gap-1.5 text-[13px]">
                <input type="checkbox" className="h-4 w-4 shrink-0 accent-[#001F97]" disabled={readOnly}
                  checked={bothVertical && bothHorizontal} onChange={(event) => {
                    const selection = event.target.checked ? joints : [];
                    onChange?.({ verticalJoints: selection, horizontalJoints: selection });
                  }} />
                {ALL_JOINTS}
              </label>
            </>}
            {readOnly && checklist.siliconeJoints && <p className="text-xs">{checklist.siliconeJoints}</p>}
          </Section>
          <Section number={10} title="Number of Cracked / Loose / Drummy / Lifted Tiles">
            <div className="flex flex-wrap items-center gap-x-3">
              <Count title="Wall Tiles" value={checklist.wallTiles} onChange={onChange && ((wallTiles) => onChange({ wallTiles }))} />
              {multiple("wallTileActions", "Wall tile work", ["Repair", "Replace"])}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3">
              <Count title="Floor Tiles" value={checklist.floorTiles} onChange={onChange && ((floorTiles) => onChange({ floorTiles }))} />
              {multiple("floorTileActions", "Floor tile work", ["Repair", "Replace"])}
            </div>
            {readOnly && (checklist.tileActions.length > 0 || checklist.tileAction) && (
              <p className="text-xs">Tile work: {[...new Set([...checklist.tileActions, checklist.tileAction].filter(Boolean))].join(", ")}</p>
            )}
          </Section>
          <Section number={11} title="Additional Areas">
            {multiple("additional", "Also quote", ["Kitchen", "Vanity", "Bathtub", "Niche", "Bathroom floor"])}
            {note("notes", "Write Any Additional Information")}
          </Section>
          <Section number={12} title="Balcony Leakage">
            <ChecklistChoices id={`${id}-balcony-leakage`} title="Balcony Leakage"
              options={readOnly && (checklist.balconyLeakage || leaking) === "Not sure" ? [...YES_NO, "Not sure"] : YES_NO}
              selected={[checklist.balconyLeakage || (balconyOnly && readOnly ? leaking : "")]}
              onToggle={(option) => onChange?.({ balconyLeakage: checklist.balconyLeakage === option ? "" : option })}
              readOnly={readOnly} error={errors.balconyLeakage} />
            <label className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold">
              <span>Balcony Area (sq. m)</span>
              <input type="number" min="0.1" step="any" aria-invalid={!!errors.balconyArea} value={checklist.balconyArea}
                onChange={(event) => onChange?.({ balconyArea: event.target.value })} readOnly={readOnly}
                className="h-8 w-28 rounded-lg border border-[#DBE3F0] px-2 text-[13px]" />
            </label>
            {errors.balconyArea && <p role="alert" className="text-xs text-red-700">{errors.balconyArea}</p>}
            {multiple("balconyTileSizes", "Balcony Tile Size", tileSizes, { legacy: checklist.balconyTileSize ? [checklist.balconyTileSize] : [] })}
          </Section>
        </div>
      </div>
      <div className="mt-2">
        <Section number={13} title="Select Photo Category">
          {photos}
        </Section>
        <div className={`mt-2 ${sectionStyle}`}>
          {note("summaryNotes", "Additional Notes / Inspection Summary")}
        </div>
      </div>
    </div>
  );
}
