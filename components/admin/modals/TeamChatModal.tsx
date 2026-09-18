"use client";

import { useRef, useEffect } from "react";
import { X, Loader2, Send } from "lucide-react";
import { ROLE_LABELS } from "@/lib/roles";
import type { Role } from "@/lib/roles";

interface ChatMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  createdAt: string;
}

interface ChatTarget {
  username: string;
  name: string;
  role: string;
}

interface Props {
  chatWith: ChatTarget;
  chatMessages: ChatMessage[];
  chatText: string;
  chatLoading: boolean;
  chatSending: boolean;
  username: string;
  onClose: () => void;
  setChatText: (v: string) => void;
  onSend: () => void;
}

export function TeamChatModal({
  chatWith,
  chatMessages,
  chatText,
  chatLoading,
  chatSending,
  username,
  onClose,
  setChatText,
  onSend,
}: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
              {chatWith.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-slate-900 leading-tight">{chatWith.name}</div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                {ROLE_LABELS[chatWith.role as Role] || chatWith.role}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60 min-h-[240px]"
        >
          {chatLoading ? (
            <div className="text-center text-slate-400 text-sm py-8 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading conversation…
            </div>
          ) : chatMessages.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-8">
              No messages yet. Say hello to {chatWith.name.split(" ")[0]}.
            </div>
          ) : (
            chatMessages.map((m) => {
              const mine = m.from.toLowerCase() === (username || "").toLowerCase();
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm shadow-xs ${
                      mine
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{m.text}</div>
                    <div className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-slate-400"}`}>
                      {new Date(m.createdAt).toLocaleString("en-AU", {
                        timeZone: "Australia/Sydney",
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-slate-100 flex items-end gap-2">
          <textarea
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            rows={1}
            placeholder={`Message ${chatWith.name.split(" ")[0]}…`}
            className="flex-1 resize-none p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 max-h-32"
          />
          <button
            onClick={onSend}
            disabled={chatSending || !chatText.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
          >
            {chatSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
