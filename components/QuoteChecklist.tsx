"use client";

const LEAKING = ["Yes", "No", "Not sure"];
const req = <span className="text-red-600" aria-hidden="true">*</span>;

export type Checklist = {
  location: string; showerType: string; wallHeight: string; work: string; showerScope: string;
  wallCount: string; tileSize: string; mosaic: string; screen: string; siliconeJoints: string;
  wallTiles: string; floorTiles: string; tileAction: string; balconyArea: string;
  balconyTileSize: string; additional: string[]; notes: string;
};
export const emptyChecklist: Checklist = { location: "", showerType: "", wallHeight: "", work: "", showerScope: "", wallCount: "", tileSize: "", mosaic: "", screen: "", siliconeJoints: "", wallTiles: "", floorTiles: "", tileAction: "", balconyArea: "", balconyTileSize: "", additional: [], notes: "" };

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

export default function QuoteChecklist({ id: P, checklist, leaking, errors: jobErrors = {}, onChange, onLeakChange }: {
  id: string;
  checklist: Checklist;
  leaking: string;
  errors?: Record<string, string>;
  onChange?: (patch: Partial<Checklist>) => void;
  onLeakChange?: (value: string) => void;
}) {
  const readOnly = !onChange;
  const checkOptions = (key: Exclude<keyof Checklist, "additional">, title: string, options: string[], required = false) => (
    <ChecklistChoices
      id={`${P}-${key}`}
      title={title}
      options={options}
      selected={[checklist[key]]}
      onToggle={(option) => onChange?.({ [key]: checklist[key] === option ? "" : option })}
      readOnly={readOnly}
      required={required}
      error={jobErrors[key]}
    />
  );

  return (
    <div className="@container flex min-w-0 flex-col gap-2.5">
      {!readOnly && <p className="text-[13px] text-neutral-600">Tick one box per question. You can tick multiple extra areas.</p>}
      <div className={checklistGrid}>
        {checkOptions("location", "Area", ["Ensuite shower", "Main bathroom shower", "Other shower", "Balcony"], true)}
        {checkOptions("work", "Work needed", ["Grout only", "Silicone only", "Grout and silicone", "Not sure"], true)}
        <ChecklistChoices
          id={`${P}-leaking`}
          title="Leaking?"
          options={LEAKING}
          selected={[leaking]}
          onToggle={(option) => onLeakChange?.(leaking === option ? "" : option)}
          readOnly={readOnly}
          required
          error={jobErrors.leaking}
        />
        {checklist.location === "Balcony" && (
          <label className="block text-[13px] font-semibold text-neutral-800">
            <span className="mb-1 block">Balcony area (m²) {req}</span>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={checklist.balconyArea}
              onChange={(event) => onChange?.({ balconyArea: event.target.value })}
              readOnly={readOnly}
              placeholder={readOnly ? undefined : "Approx. size"}
              className={`h-9 w-full rounded-lg border bg-[#FBFCFE] px-2.5 text-[13px] ${jobErrors.balconyArea ? "border-red-500" : "border-[#DBE3F0]"}`}
            />
            {jobErrors.balconyArea && <p role="alert" className="text-xs text-red-700">{jobErrors.balconyArea}</p>}
          </label>
        )}
      </div>
      {checklist.location === "Balcony" ? (
        checkOptions("balconyTileSize", "Tile size", ["Small", "Medium", "Large", "Extra large", "Not sure"])
      ) : checklist.location ? (
        <section className="rounded-lg border border-[#DBE3F0] bg-[#F8FAFF] px-2.5 py-2">
          <h3 className="mb-1.5 text-[13px] font-bold text-[#001F97]">Shower details</h3>
          <div className={checklistGrid}>
            {checkOptions("showerScope", "Area to work on", ["Walls and floor", "Floor only", "Walls only", "Selected areas"], true)}
            {checkOptions("showerType", "Shower size", ["Single", "Double", "Extended", "Not sure"])}
            {checklist.showerScope !== "Floor only" && checkOptions("wallHeight", "Wall height", ["To screen (~2.1 m)", "Above screen", "To ceiling", "Not sure"])}
            {checklist.showerScope !== "Floor only" && checkOptions("wallCount", "Tiled walls", ["1", "2", "3", "More", "Not sure"])}
            {checkOptions("tileSize", "Tile size", ["Small", "Medium", "Large", "Extra large", "Not sure"])}
            {checkOptions("mosaic", "Mosaic tiles?", ["Yes", "No", "Not sure"])}
            {checklist.work !== "Grout only" && checkOptions("screen", "Shower screen", ["Frameless", "Semi-frameless", "Framed", "Not sure"])}
            {checklist.work !== "Grout only" && checklist.screen === "Frameless" && checkOptions("siliconeJoints", "Screen silicone", ["Inside", "Outside", "Both", "Vertical and horizontal", "Not sure"])}
          </div>
        </section>
      ) : null}
      {checklist.location && (
        <section className="rounded-lg border border-[#DBE3F0] px-2.5 py-2">
          <h3 className="mb-1.5 text-[13px] font-bold text-[#001F97]">Tile damage &amp; extra areas <span className="font-normal text-neutral-500">(optional)</span></h3>
          <div className={checklistGrid}>
            {checkOptions("wallTiles", "Damaged wall tiles", ["None", "1", "2", "3", "4+", "Not sure"])}
            {checkOptions("floorTiles", "Damaged floor tiles", ["None", "1", "2", "3", "4+", "Not sure"])}
            {checkOptions("tileAction", "Tile work", ["Repair", "Replace", "Not sure"])}
            <ChecklistChoices
              id={`${P}-additional`}
              title="Also quote"
              options={["Kitchen", "Vanity", "Bathtub", "Niche", "Bathroom floor", "Other"]}
              selected={checklist.additional}
              onToggle={(option) => onChange?.({
                additional: checklist.additional.includes(option)
                  ? checklist.additional.filter((area) => area !== option)
                  : [...checklist.additional, option],
              })}
              readOnly={readOnly}
              multiple
            />
          </div>
        </section>
      )}
      <label className="text-[13px] font-semibold text-neutral-800">
        Anything else we should know? <span className="font-normal text-neutral-500">(optional)</span>
        <textarea
          rows={2}
          value={checklist.notes}
          onChange={(event) => onChange?.({ notes: event.target.value })}
          readOnly={readOnly}
          placeholder={readOnly ? undefined : "Where is the leak or damage?"}
          className="mt-1 block w-full resize-y rounded-lg border border-[#DBE3F0] bg-[#FBFCFE] px-2.5 py-1.5 text-[13px] font-normal"
        />
      </label>
    </div>
  );
}
