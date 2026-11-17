"use client";

import { useState } from "react";
import type { CustomerMessage } from "@/components/admin/types";

export function MailMessageActions({ leadId, message, onUpdated }: {
  leadId: string;
  message: CustomerMessage;
  onUpdated: (patch: Partial<CustomerMessage>) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (message.initial || message.deletedAt || (message.channel && message.channel !== "email")) return null;

  async function update(action: "unread" | "delete") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/lead/${leadId}/messages`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [action === "delete" ? "deleteIds" : "unreadIds"]: [message.id] }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Could not update this email.");
      }
      onUpdated(action === "delete" ? { deletedAt: new Date().toISOString(), read: true } : { read: false });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not update this email.");
    } finally { setBusy(false); }
  }

  return <div className="flex flex-wrap items-center gap-2 text-[11px]" onClick={event => event.stopPropagation()}>
    {message.from === "customer" && <button type="button" disabled={busy || message.read === false} onClick={() => void update("unread")} className="rounded border border-current/20 px-2 py-1 font-semibold hover:opacity-75 disabled:opacity-40">{message.read === false ? "Unread" : "Mark as unread"}</button>}
    <button type="button" disabled={busy} onClick={() => void update("delete")} className="rounded border border-current/20 px-2 py-1 font-semibold hover:opacity-75 disabled:opacity-40">Delete email</button>
    {busy && <span role="status">Saving…</span>}
    {error && <span role="alert">{error}</span>}
  </div>;
}
