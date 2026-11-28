"use client";

import { ITEM_CODE_GROUPS, skipsItemHeight, selectItemCodeOption, type ItemCodeSelection } from "@/lib/itemCodeChecklist";

export function ItemCodeChecklist({ selection, onChange, otherCodes }: {
  selection: ItemCodeSelection;
  onChange: (selection: ItemCodeSelection) => void;
  otherCodes: [string, string][];
}) {
  const skipHeight = skipsItemHeight(selection);
  return (
    <section aria-label="Item code selection checklist" className="rounded-xl border border-blue-200 bg-blue-50/40 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-slate-900">Item code selection checklist</h4>
        <button type="button" onClick={() => onChange({})} className="text-xs font-semibold text-blue-700 hover:underline">Reset checklist</button>
      </div>
      <p className="text-xs text-slate-500">Choose one option per group to narrow the items below. Click a selected option to clear it.</p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {ITEM_CODE_GROUPS.map(({ key, label, options }) => (
          <fieldset key={key} disabled={key === "height" && skipHeight} className="min-w-0 rounded-lg border border-slate-200 bg-white p-2 disabled:opacity-45">
            <legend className="px-1 text-xs font-bold text-slate-600">{label}</legend>
            <div className="space-y-1">
              {options.map(([code, name]) => (
                <label key={code} className="flex items-start gap-1.5 rounded p-1 text-xs text-slate-700 cursor-pointer hover:bg-blue-50">
                  <input type="checkbox" checked={selection[key] === code} onChange={() => onChange(selectItemCodeOption(selection, key, code))} className="mt-0.5 accent-blue-600" />
                  <span><b className="font-mono">{code}</b><span className="block text-[10px] leading-tight text-slate-500">{name}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      {skipHeight && <p className="text-xs text-amber-800">FO / WO: height selection is not required. For walls only, check the saved item’s scope for its height before selecting.</p>}
      {otherCodes.length > 0 && (
        <label className="block text-xs font-semibold text-slate-700">
          Other item codes
          <select value={selection.standalone ?? ""}
            onChange={event => onChange(event.target.value ? { standalone: event.target.value } : {})}
            className="mt-1 block w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-normal text-slate-800">
            <option value="">Choose an item code</option>
            {otherCodes.map(([code, name]) => <option key={code} value={code}>{code} — {name}</option>)}
          </select>
        </label>
      )}
    </section>
  );
}
