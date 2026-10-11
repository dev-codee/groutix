"use client";

import { useEffect, useRef, useState } from "react";

const SAVE_TIMEOUT_MESSAGE = "Saving took too long. Your edits are still in this form. Check the quote after refreshing before retrying, as the server may have saved it.";

export function QuoteSaveButton({ onSave, onError, isTechnician = false }: {
  onSave: () => Promise<void>;
  onError: (message: string) => void;
  isTechnician?: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function save() {
    if (pending.current) return;
    pending.current = true;
    setSaving(true);
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        Promise.resolve().then(onSave),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => reject(new Error(SAVE_TIMEOUT_MESSAGE)), 20000);
        }),
      ]);
    } catch (error) {
      if (mounted.current) onError(error instanceof Error ? error.message : "Could not save the quote. Please try again.");
    } finally {
      clearTimeout(timeout);
      pending.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  return <button type="button" onClick={save} disabled={saving} aria-busy={saving}
    className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 disabled:opacity-50 disabled:cursor-wait">
    {saving ? "Saving…" : isTechnician ? "Save Scope" : "Save Quote"}
  </button>;
}
