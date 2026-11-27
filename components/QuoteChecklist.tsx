"use client";

import type { ReactNode } from "react";

const LEAKING = ["Yes", "No", "Not sure"];
const req = <span className="text-red-600" aria-hidden="true">*</span>;

export type Checklist = {
  location: string; showerType: string; wallHeight: string; work: string; showerScope: string;
  wallCount: string; tileSize: string; mosaic: string; screen: string; siliconeJoints: string;
  wallTiles: string; floorTiles: string; tileAction: string; balconyArea: string;
  balconyTileSize: string; additional: string[]; notes: string;
  leakAreas: string[]; tileSizes: string[]; balconyTileSizes: string[];
  verticalJoints: string[]; horizontalJoints: string[]; tileActions: string[];
  leakNotes: string; balconyLeakage: string;
};
export const emptyChecklist: Checklist = { location: "", showerType: "", wallHeight: "", work: "", showerScope: "", wallCount: "", tileSize: "", mosaic: "", screen: "", siliconeJoints: "", wallTiles: "", floorTiles: "", tileAction: "", balconyArea: "", balconyTileSize: "", additional: [], notes: "", leakAreas: [], tileSizes: [], balconyTileSizes: [], verticalJoints: [], horizontalJoints: [], tileActions: [], leakNotes: "", balconyLeakage: "" };

const checklistGrid = "grid grid-cols-1 gap-x-4 gap-y-2 @min-[440px]:grid-cols-2";

function ChecklistChoices({ id, title, options, selected, onToggle, multiple = false, required = false, error, readOnly }: {
  id: string;
  title: string;
  options: readonly string[];
  selected: readonly string[];
  onToggle: (option: string) => void;
  multiple?: boolean;
  required?: boolean;
  error?: string;
  readOnly: boolean;
}) {
  return (
    <fieldset className="min-w-0" aria-describedby={error ? `${id}-error` : undefined} aria-invalid={error ? true : undefined}>
      <legend className="text-[13px] font-semibold text-neutral-800">
        {title} {required && req}
        {!multiple && <span className="sr-only"> (choose one{required ? ", required" : ""})</span>}
      </legend>
      <div className="flex flex-wrap gap-x-3">
        {options.map((option) => (
          <label key={option} className="inline-flex min-h-7 max-w-full has-[:enabled]:cursor-pointer items-center gap-1.5 py-0.5 text-[13px] leading-snug text-neutral-700 hover:text-[#001F97]">
            <input
              type="checkbox"
              disabled={readOnly}
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
              className="h-4 w-4 shrink-0 accent-[#001F97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F63CC]"
            />
            {option}
          </label>
        ))}
      </div>
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-red-700">{error}</p>}
    </fieldset>
  );
}

function Section({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-lg border border-[#DBE3F0] px-2.5 py-2">
      <h3 className="mb-1 text-[13px] font-bold text-[#001F97]">{number}. {title}</h3>
      {children || <p className="text-xs text-neutral-500">Not applicable</p>}
    </section>
  );
}

function Count({ title, value, onChange }: { title: string; value: string; onChange?: (value: string) => void }) {
  const count = Number(value) || 0;
  return (
    <div>
      <p className="mb-1 text-xs font-semibold">{title}</p>
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
  const showBalcony = balconyOnly || !!checklist.balconyLeakage;
  const tileSizes = ["Small", "Medium", "Large", "Extra large"];
  const joints = ["Inside", "Outside"];
  const toggle = (options: string[], option: string) => options.includes(option)
    ? options.filter((value) => value !== option)
    : [...options, option];

  function single(key: { [K in keyof Checklist]: Checklist[K] extends string ? K : never }[keyof Checklist], title: string, options: string[], required = false) {
    return <ChecklistChoices id={`${id}-${key}`} title={title} options={options} selected={[checklist[key]]}
      onToggle={(option) => onChange?.({ [key]: checklist[key] === option ? "" : option })}
      readOnly={readOnly} required={required} error={errors[key]} />;
  }

  function multiple(key: { [K in keyof Checklist]: Checklist[K] extends string[] ? K : never }[keyof Checklist], title: string, options: string[], legacy: string[] = []) {
    const selected = checklist[key].length ? checklist[key] : legacy;
    return <ChecklistChoices id={`${id}-${key}`} title={title} options={[...new Set([...options, ...legacy])]} selected={selected}
      onToggle={(option) => onChange?.({ [key]: toggle(selected, option) })} readOnly={readOnly} multiple />;
  }

  function note(key: "notes" | "leakNotes", title: string) {
    return (
      <label className="block text-xs font-semibold text-neutral-800">
        {title}
        <textarea rows={2} maxLength={1000} value={checklist[key]} readOnly={readOnly}
          onChange={(event) => onChange?.({ [key]: event.target.value })}
          className="mt-1 block w-full resize-y rounded-lg border border-[#DBE3F0] bg-[#FBFCFE] px-2 py-1.5 text-[13px] font-normal" />
      </label>
    );
  }

  return (
    <div className="@container min-w-0">
      <div className={checklistGrid}>
        <div className="space-y-2">
          <Section number={1} title="Shower leakage">
            {single("location", "Area to quote", ["Ensuite shower", "Main bathroom shower", "Other shower", "Balcony"], true)}
            {showShower && <>
              <ChecklistChoices id={`${id}-leaking`} title="Is the shower leaking?" options={LEAKING}
                selected={[leaking]} onToggle={(option) => onLeakChange?.(leaking === option ? "" : option)}
                readOnly={readOnly} required error={errors.leaking} />
              {multiple("leakAreas", "Where is the leak? (tick all that apply)", ["Inside shower", "Outside shower"])}
              {note("leakNotes", "Leak details (optional)")}
            </>}
          </Section>
          <Section number={2} title="Shower type">
            {showShower && single("showerType", "Shower size", ["Single", "Double", "Extended", "Not sure"])}
          </Section>
          <Section number={3} title="Wall height">
            {showShower && single("wallHeight", "Tiled wall height", ["To screen (~2.1 m)", "Above screen", "To ceiling", "Not sure"])}
          </Section>
          <Section number={4} title="Work required">
            {single("work", "Work needed", ["Grout only", "Silicone only", "Grout and silicone", "Not sure"], true)}
            {showShower && single("showerScope", "Shower work area", ["Walls and floor", "Floor only", "Walls only", "Selected areas"], true)}
          </Section>
          <Section number={5} title="Number of tiled walls">
            {showShower && <Count title="Tiled walls" value={checklist.wallCount} onChange={onChange && ((wallCount) => onChange({ wallCount }))} />}
          </Section>
          <Section number={6} title="Tile size">
            {showShower && multiple("tileSizes", "Shower tile sizes (tick all that apply)", [...tileSizes, "Not sure"], checklist.tileSize ? [checklist.tileSize] : [])}
          </Section>
          <Section number={7} title="Mosaic tiles">
            {showShower && single("mosaic", "Are there mosaic tiles?", LEAKING)}
          </Section>
        </div>
        <div className="space-y-2">
          <Section number={8} title="Shower screen type">
            {showShower && single("screen", "Screen", ["Frameless", "Semi-frameless", "Framed", "Not sure"])}
          </Section>
          <Section number={9} title="Silicone joints (frameless shower screen)">
            {showShower && checklist.screen === "Frameless" ? <>
              {multiple("verticalJoints", "Vertical joints", joints)}
              {multiple("horizontalJoints", "Horizontal joints", joints)}
            </> : <p className="text-xs text-neutral-500">Applies to frameless screens.</p>}
            {readOnly && checklist.siliconeJoints && <p className="text-xs">{checklist.siliconeJoints}</p>}
          </Section>
          <Section number={10} title="Cracked, loose, drummy or lifted tiles">
            <div className="flex flex-wrap gap-3">
              <Count title="Wall tiles" value={checklist.wallTiles} onChange={onChange && ((wallTiles) => onChange({ wallTiles }))} />
              <Count title="Floor tiles" value={checklist.floorTiles} onChange={onChange && ((floorTiles) => onChange({ floorTiles }))} />
            </div>
            {multiple("tileActions", "Tile work", ["Repair", "Replace", "Not sure"], checklist.tileAction ? [checklist.tileAction] : [])}
          </Section>
          <Section number={11} title="Additional areas">
            {multiple("additional", "Also quote (tick all that apply)", ["Kitchen", "Vanity", "Bathtub", "Niche", "Bathroom floor", "Other"])}
            {note("notes", "Additional details (optional)")}
          </Section>
          <Section number={12} title="Balcony leakage">
            {!balconyOnly && !readOnly && (
              <label className="flex min-h-7 items-center gap-1.5 text-[13px]">
                <input type="checkbox" className="h-4 w-4 accent-[#001F97]" checked={showBalcony}
                  onChange={(event) => onChange?.({ balconyLeakage: event.target.checked ? "Not sure" : "", balconyArea: "", balconyTileSizes: [] })} />
                Include a balcony
              </label>
            )}
            {showBalcony && <>
              <ChecklistChoices id={`${id}-balcony-leakage`} title="Is the balcony leaking?" options={LEAKING}
                selected={[checklist.balconyLeakage || (balconyOnly && readOnly ? leaking : "")]}
                onToggle={(option) => onChange?.({ balconyLeakage: option })}
                readOnly={readOnly} required error={errors.balconyLeakage} />
              <label className="block text-xs font-semibold">
                Balcony area (m²) {req}
                <input type="number" min="0.1" step="any" aria-invalid={!!errors.balconyArea} value={checklist.balconyArea}
                  onChange={(event) => onChange?.({ balconyArea: event.target.value })} readOnly={readOnly}
                  className="mt-1 block h-8 w-full rounded-lg border border-[#DBE3F0] px-2 text-[13px]" />
              </label>
              {errors.balconyArea && <p role="alert" className="text-xs text-red-700">{errors.balconyArea}</p>}
              {multiple("balconyTileSizes", "Balcony tile sizes (tick all that apply)", [...tileSizes, "Not sure"], checklist.balconyTileSize ? [checklist.balconyTileSize] : [])}
            </>}
          </Section>
        </div>
      </div>
      <div className="mt-2">
        <Section number={13} title="Select photo category">
          {photos}
        </Section>
      </div>
    </div>
  );
}
