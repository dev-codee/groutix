"use client";

import type { ReactNode } from "react";
import { QUOTE_TILE_SIZES, type QuoteBalcony } from "@/lib/quoteBalconies";

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
const checklistColumn = "flex min-w-0 flex-col gap-2 @min-[440px]:[&>section]:flex @min-[440px]:[&>section]:grow @min-[440px]:[&>section]:flex-col @min-[440px]:[&>section]:justify-center";
const sectionStyle = "min-w-0 rounded-lg border border-[#DBE3F0] px-2.5 py-1.5";

function ChecklistChoices({ id, title, options, selected, onToggle, multiple = false, required = false, error, readOnly, sectionNumber, children, hideTitle = false, compact = false }: {
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
  children?: ReactNode;
  hideTitle?: boolean;
  compact?: boolean;
}) {
  const Title = sectionNumber ? "h3" : "span";
  const titleId = `${id}-title`;
  const choices = (
    <div
      role="group"
      aria-labelledby={titleId}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`flex min-w-0 flex-wrap items-center ${compact ? "gap-x-1.5" : "gap-x-2.5"}`}
    >
      <Title id={titleId} className={hideTitle ? "sr-only" : `min-w-0 max-w-full py-0.5 text-[13px] ${sectionNumber ? "font-bold text-[#001F97]" : "font-semibold text-neutral-800"}`}>
        {sectionNumber && `${sectionNumber}. `}{title} {required && req}
        {!multiple && <span className="sr-only"> (choose one{required ? ", required" : ""})</span>}
      </Title>
      {options.map((option) => (
        <label key={option} className={`inline-flex min-h-7 max-w-full has-[:enabled]:cursor-pointer items-center ${compact ? "gap-1" : "gap-1.5"} py-0.5 text-[13px] leading-snug text-neutral-700 hover:text-[#001F97]`}>
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
  return sectionNumber ? <section className={sectionStyle}>{choices}{children}</section> : choices;
}

function Section({ number, title, children, required = false }: { number: number; title: string; children?: ReactNode; required?: boolean }) {
  return (
    <section className={sectionStyle}>
      <h3 className="mb-1 text-[13px] font-bold text-[#001F97]">{number}. {title}{required && <> {req}</>}</h3>
      {children || <p className="text-xs text-neutral-500">Not applicable</p>}
    </section>
  );
}

function BalconyFields({ id, number, title, balcony, errors, onChange, onRemove }: {
  id: string;
  number: number;
  title: string;
  balcony: QuoteBalcony;
  errors?: { leakage?: string; area?: string };
  onChange?: (patch: Partial<QuoteBalcony>) => void;
  onRemove?: () => void;
}) {
  const readOnly = !onChange;
  return (
    <ChecklistChoices id={`${id}-leakage`} title={title} sectionNumber={number}
      options={readOnly && balcony.leakage === "Not sure" ? [...YES_NO, "Not sure"] : YES_NO}
      selected={[balcony.leakage]} readOnly={readOnly} error={errors?.leakage}
      onToggle={(option) => onChange?.({ leakage: balcony.leakage === option ? "" : option })}>
      <label className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold">
        <span>Balcony Area (sq. m)</span>
        <input id={`${id}-area`} type="number" min="0.1" step="any" aria-invalid={!!errors?.area} value={balcony.area}
          aria-describedby={errors?.area ? `${id}-area-error` : undefined}
          placeholder={readOnly ? undefined : "e.g. 6.5"}
          onChange={(event) => onChange?.({ area: event.target.value })} readOnly={readOnly}
          className="h-8 w-28 rounded-lg border border-[#DBE3F0] px-2 text-[13px] placeholder:text-neutral-500" />
      </label>
      {errors?.area && <p id={`${id}-area-error`} role="alert" className="text-xs text-red-700">{errors.area}</p>}
      <ChecklistChoices id={`${id}-tile-sizes`} title="Balcony Tile Size"
        options={readOnly ? [...new Set([...QUOTE_TILE_SIZES, ...balcony.tileSizes])] : QUOTE_TILE_SIZES}
        selected={balcony.tileSizes} readOnly={readOnly} multiple
        onToggle={(option) => onChange?.({ tileSizes: toggleOption(balcony.tileSizes, option) })} />
      {onRemove && (
        <button type="button" onClick={onRemove} className="mt-1 self-start text-xs font-semibold text-red-700 underline">Remove balcony {number - 12}</button>
      )}
    </ChecklistChoices>
  );
}

function toggleOption(options: string[], option: string) {
  return options.includes(option) ? options.filter((value) => value !== option) : [...options, option];
}

function Count({ title, value, onChange, compact = false }: { title: string; value: string; onChange?: (value: string) => void; compact?: boolean }) {
  const count = Number(value) || 0;
  const buttonWidth = compact ? "w-6" : "w-8";
  return (
    <div className={`flex flex-wrap items-center gap-y-1 ${compact ? "gap-x-1" : "gap-x-2"}`}>
      <p className="text-xs font-semibold">{title}</p>
      {onChange ? (
        <div className="inline-flex overflow-hidden rounded-lg border border-[#DBE3F0]">
          <button type="button" aria-label={`Decrease ${title.toLowerCase()}`} disabled={count <= 0}
            onClick={() => onChange(String(count - 1))} className={`h-8 ${buttonWidth} bg-[#EEF3FF] font-bold disabled:opacity-40`}>−</button>
          <output aria-live="polite" aria-label={title} className={`${compact ? "min-w-5" : "min-w-9"} px-1 text-center text-sm leading-8`}>{count}</output>
          <button type="button" aria-label={`Increase ${title.toLowerCase()}`}
            onClick={() => onChange(String(count + 1))} className={`h-8 ${buttonWidth} bg-[#EEF3FF] font-bold`}>+</button>
        </div>
      ) : <p className="text-sm">{value || "0"}</p>}
    </div>
  );
}

export default function QuoteChecklist({ id, checklist, leaking, errors = {}, onChange, onLeakChange, photos, additionalBalconies = [], onBalconiesChange }: {
  id: string;
  checklist: Checklist;
  leaking: string;
  errors?: Record<string, string>;
  onChange?: (patch: Partial<Checklist>) => void;
  onLeakChange?: (value: string) => void;
  photos?: ReactNode;
  additionalBalconies?: QuoteBalcony[];
  onBalconiesChange?: (balconies: QuoteBalcony[]) => void;
}) {
  const readOnly = !onChange;
  const balconyOnly = checklist.location === "Balcony";
  const showShower = !balconyOnly;
  const joints = ["Inside", "Outside"];
  const bothVertical = joints.every((joint) => checklist.verticalJoints.includes(joint));
  const bothHorizontal = joints.every((joint) => checklist.horizontalJoints.includes(joint));

  function single(key: { [K in keyof Checklist]: Checklist[K] extends string ? K : never }[keyof Checklist], title: string, options: string[], { required = false, sectionNumber, hideTitle }: { required?: boolean; sectionNumber?: number; hideTitle?: boolean } = {}) {
    return <ChecklistChoices id={`${id}-${key}`} title={title} options={readOnly && checklist[key] ? [...new Set([...options, checklist[key]])] : options} selected={[checklist[key]]}
      onToggle={(option) => onChange?.({ [key]: checklist[key] === option ? "" : option })}
      readOnly={readOnly} required={required} error={errors[key]} sectionNumber={sectionNumber} hideTitle={hideTitle} />;
  }

  function multiple(key: { [K in keyof Checklist]: Checklist[K] extends string[] ? K : never }[keyof Checklist], title: string, options: string[], { legacy = [], sectionNumber, hideTitle, compact }: { legacy?: string[]; sectionNumber?: number; hideTitle?: boolean; compact?: boolean } = {}) {
    const selected = checklist[key].length ? checklist[key] : legacy;
    return <ChecklistChoices id={`${id}-${key}`} title={title} options={readOnly ? [...new Set([...options, ...selected])] : options} selected={selected}
      onToggle={(option) => onChange?.({ [key]: toggleOption(selected, option) })}
      readOnly={readOnly} multiple sectionNumber={sectionNumber} hideTitle={hideTitle} compact={compact} />;
  }

  function note(key: "notes" | "leakNotes" | "workDetails" | "summaryNotes", title: string, placeholder: string) {
    return (
      <label className="grid gap-y-1 py-0.5 text-xs font-semibold text-neutral-800">
        <span>{title}</span>
        <textarea rows={1} maxLength={1000} value={checklist[key]} readOnly={readOnly}
          placeholder={readOnly ? undefined : placeholder}
          onChange={(event) => onChange?.({ [key]: event.target.value })}
          className="block min-h-8 min-w-0 w-full resize-y rounded-lg border border-[#DBE3F0] bg-[#FBFCFE] px-2 py-1.5 text-[13px] font-normal placeholder:text-neutral-500 [field-sizing:content]" />
      </label>
    );
  }

  return (
    <div className="@container min-w-0">
      <div className={checklistGrid}>
        <div className={checklistColumn}>
          {showShower ? (
            <ChecklistChoices id={`${id}-leaking`} title="Shower Leakage" sectionNumber={1}
              options={readOnly && leaking === "Not sure" ? [...YES_NO, leaking] : YES_NO}
              selected={[leaking]} onToggle={(option) => onLeakChange?.(leaking === option ? "" : option)}
              readOnly={readOnly} error={errors.leaking}>
              <ChecklistChoices
                id={`${id}-location`}
                title="Area"
                options={["Ensuite shower", "Main bathroom shower", "Inside shower", "Outside shower", ...(readOnly && checklist.location === "Other shower" ? ["Other shower"] : [])]}
                selected={[checklist.location, ...checklist.leakAreas]}
                onToggle={(option) => {
                  if (option === "Inside shower" || option === "Outside shower") {
                    onChange?.({ leakAreas: toggleOption(checklist.leakAreas, option) });
                  } else {
                    onChange?.({ location: checklist.location === option ? "" : option });
                  }
                }}
                readOnly={readOnly}
                error={errors.location}
                multiple
              />
              {note("leakNotes", "Write Any Additional Information", "e.g. Water pools outside the shower after use")}
            </ChecklistChoices>
          ) : <Section number={1} title="Shower Leakage" />}
          {showShower ? single("showerType", "Shower Type (Select Shower Type)", ["Single", "Double", "Extended"], { sectionNumber: 2 }) : (
            <Section number={2} title="Shower Type (Select Shower Type)" />
          )}
          {showShower ? single("wallHeight", "Wall Height", ["To screen (~2.1 m)", "To ceiling", "Above screen"], { sectionNumber: 3 }) : (
            <Section number={3} title="Wall Height" />
          )}
          <Section number={4} title="Work Required" required>
            {single("work", "Work", ["Silicone only", "Grout only", "Grout and silicone"], { required: true, hideTitle: true })}
            {showShower && single("showerScope", "Shower areas", ["Walls and floor", "Floor only", "Walls only"])}
            {showShower && note("workDetails", "Additional work details", "e.g. Replace silicone along the shower base")}
          </Section>
          <Section number={5} title="Number of Tiled Walls">
            {showShower && <Count title="Tiled walls" value={checklist.wallCount} onChange={onChange && ((wallCount) => onChange({ wallCount }))} />}
          </Section>
        </div>
        <div className={checklistColumn}>
          {showShower ? multiple("tileSizes", "Select Tile Size", QUOTE_TILE_SIZES, { legacy: checklist.tileSize ? [checklist.tileSize] : [], sectionNumber: 6 }) : (
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
                  verticalJoints: option === "Both" ? (bothVertical ? [] : joints) : (bothVertical ? [option] : toggleOption(checklist.verticalJoints, option)),
                })}
                readOnly={readOnly} />
              <ChecklistChoices id={`${id}-horizontal-joints`} title="Horizontal Joints" options={[...joints, "Both"]}
                selected={bothHorizontal ? ["Both"] : checklist.horizontalJoints}
                onToggle={(option) => onChange?.({
                  horizontalJoints: option === "Both" ? (bothHorizontal ? [] : joints) : (bothHorizontal ? [option] : toggleOption(checklist.horizontalJoints, option)),
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
            <div className="flex flex-wrap items-center gap-x-1">
              <Count title="Wall Tiles" value={checklist.wallTiles} onChange={onChange && ((wallTiles) => onChange({ wallTiles }))} compact />
              {multiple("wallTileActions", "Wall tile work", ["Repair", "Replace"], { hideTitle: true, compact: true })}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-1">
              <Count title="Floor Tiles" value={checklist.floorTiles} onChange={onChange && ((floorTiles) => onChange({ floorTiles }))} compact />
              {multiple("floorTileActions", "Floor tile work", ["Repair", "Replace"], { hideTitle: true, compact: true })}
            </div>
            {readOnly && (checklist.tileActions.length > 0 || checklist.tileAction) && (
              <p className="text-xs">Tile work: {[...new Set([...checklist.tileActions, checklist.tileAction].filter(Boolean))].join(", ")}</p>
            )}
          </Section>
          <Section number={11} title="Additional Areas">
            {multiple("additional", "Also quote", ["Kitchen", "Vanity", "Bathtub", "Niche", "Bathroom floor"])}
            {note("notes", "Write Any Additional Information", "e.g. Reseal around the kitchen sink")}
          </Section>
          <BalconyFields id={`${id}-balcony`} number={12} title="Balcony Leakage"
            balcony={{
              leakage: checklist.balconyLeakage || (balconyOnly && readOnly ? leaking : ""),
              area: checklist.balconyArea,
              tileSizes: checklist.balconyTileSizes.length ? checklist.balconyTileSizes : checklist.balconyTileSize ? [checklist.balconyTileSize] : [],
            }}
            errors={{ leakage: errors.balconyLeakage, area: errors.balconyArea }}
            onChange={onChange && (({ leakage, area, tileSizes }) => {
              if (leakage !== undefined) onChange({ balconyLeakage: leakage });
              if (area !== undefined) onChange({ balconyArea: area });
              if (tileSizes !== undefined) onChange({ balconyTileSizes: tileSizes });
            })}
          />
        </div>
      </div>
      <div className="mt-2 space-y-2">
        <Section number={13} title="Select Photo Category">
          {photos}
        </Section>
        {additionalBalconies.map((balcony, index) => (
          <BalconyFields key={index} id={`${id}-balcony-${index + 2}`} number={index + 14} title={`Balcony ${index + 2} Leakage`}
            balcony={balcony} errors={{ leakage: errors[`balcony-${index}-leakage`], area: errors[`balcony-${index}-area`] }}
            onChange={onBalconiesChange && ((patch) => onBalconiesChange(additionalBalconies.map((item, i) => i === index ? { ...item, ...patch } : item)))}
            onRemove={onBalconiesChange && (() => onBalconiesChange(additionalBalconies.filter((_, i) => i !== index)))} />
        ))}
        <div className={sectionStyle}>
          {note("summaryNotes", "Any Additional Notes", "e.g. Access instructions or preferred timing")}
        </div>
        {onBalconiesChange && (
          <button type="button" onClick={() => onBalconiesChange([...additionalBalconies, { leakage: "", area: "", tileSizes: [] }])}
            className="min-h-10 w-full cursor-pointer rounded-lg border border-[#2F63CC] bg-[#EEF3FF] px-3 text-[13px] font-semibold text-[#001F97] hover:bg-[#DCE8FF]">
            + Add another balcony
          </button>
        )}
      </div>
    </div>
  );
}
