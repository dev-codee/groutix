"use client";

import { useMemo, useState } from "react";
import { Inbox, Mail, MailOpen, Search, Send, Paperclip } from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { Pagination } from "@/components/admin/Pagination";
import { getInboxThreads, type InboxFolder, type InboxChannel } from "@/lib/customerInbox";
import { formatApptDate, formatApptTime } from "@/lib/scheduling";

const PAGE_SIZE = 20;
const folders = [
  { id: "inbox", label: "Inbox", Icon: Inbox },
  { id: "unread", label: "Unread", Icon: Mail },
  { id: "sent", label: "Sent", Icon: Send },
  { id: "all", label: "All Mail", Icon: MailOpen },
] as const;

export function InboxView() {
  const { scopedLeads, openMessagesModal, globalSearch, setGlobalSearch } = useAdminPageCtx();
  const [folder, setFolder] = useState<InboxFolder>("inbox");
  const [channel, setChannel] = useState<InboxChannel>("email");
  const [page, setPage] = useState(1);
  const threads = useMemo(() => getInboxThreads(scopedLeads, folder, channel, globalSearch), [scopedLeads, folder, channel, globalSearch]);
  const counts = useMemo(() => Object.fromEntries(folders.map(item => [item.id, getInboxThreads(scopedLeads, item.id, channel).length])), [scopedLeads, channel]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(threads.length / PAGE_SIZE)));

  return <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
    <div className="border-b border-slate-200 p-4 sm:p-5"><h2 className="text-lg font-bold text-slate-900">Conversation Inbox</h2><p className="mt-1 text-xs text-slate-500">Received and sent conversations stay here after you read them. Newest conversations appear first; messages within each conversation appear oldest to newest.</p></div>
    <div className="flex flex-col md:flex-row">
      <nav aria-label="Mailbox folders" className="flex gap-1 border-b border-slate-200 bg-slate-50 p-3 md:w-44 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
        {folders.map(({ id, label, Icon }) => <button key={id} type="button" aria-current={folder === id ? "page" : undefined} onClick={() => { setFolder(id); setPage(1); }} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${folder === id ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:bg-slate-100"}`}><Icon className="h-4 w-4" /><span>{label}</span><span className="ml-auto text-[10px]">{counts[id]}</span></button>)}
      </nav>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4"><div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="Search conversations" value={globalSearch} onChange={event => { setGlobalSearch(event.target.value); setPage(1); }} placeholder="Search sender, job #, subject or message..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs focus:border-blue-500 focus:outline-none" /></div><select aria-label="Message channel" value={channel} onChange={event => { setChannel(event.target.value as InboxChannel); setPage(1); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"><option value="email">Email</option><option value="sms">SMS / Dispatch</option><option value="all">All Messages</option></select></div>
        <div className="divide-y divide-slate-100">
          {threads.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map(({ lead, latest, unreadCount, messageCount }) => <button key={lead.id} type="button" onClick={() => { void openMessagesModal(lead, latest.channel === "sms" ? "sms" : "email"); }} className={`flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-blue-50/50 ${unreadCount ? "bg-blue-50/30" : "bg-white"}`}>
            <span className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${unreadCount ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>{unreadCount ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}</span>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><span className={`truncate text-sm text-slate-900 ${unreadCount ? "font-bold" : "font-medium"}`}>{lead.name || lead.email || lead.phone || "Customer"}<span className="ml-2 text-[10px] font-normal text-slate-400">{messageCount} messages</span></span><time dateTime={latest.time} className="shrink-0 text-[10px] text-slate-500">{formatApptDate(latest.time)} {formatApptTime(latest.time)}</time></div><div className="mt-1 flex items-center gap-2"><span className={`truncate text-xs text-slate-700 ${unreadCount ? "font-semibold" : ""}`}>{latest.subject || (latest.channel === "sms" ? "SMS conversation" : "Customer enquiry")}</span>{latest.attachments?.length ? <Paperclip className="h-3 w-3 shrink-0 text-slate-400" /> : null}{unreadCount > 0 && <span className="shrink-0 rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white">{unreadCount} unread</span>}</div><p className="mt-1 truncate text-xs text-slate-500">{latest.from === "groutix" ? "You: " : ""}{latest.text.replace(/\s+/g, " ")}</p><p className="mt-1 truncate text-[10px] text-slate-400">{[lead.jobNo, lead.email, lead.phone].filter(Boolean).join(" · ")}</p></div>
          </button>)}
          {threads.length === 0 && <div className="px-4 py-16 text-center text-sm text-slate-400">{globalSearch.trim() ? "No conversations match your search." : folder === "unread" ? "No unread conversations. Your read mail is still in Inbox and All Mail." : "No conversations in this folder."}</div>}
        </div>
        <div className="px-4 pb-4"><Pagination page={currentPage} pageSize={PAGE_SIZE} total={threads.length} onPage={setPage} /></div>
      </div>
    </div>
  </div>;
}
