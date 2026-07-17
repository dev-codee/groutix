"use client";

import { FormEvent, KeyboardEvent, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LifeBuoy,
  LoaderCircle,
  Mail,
  MessageCircle,
  Phone,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import type { SupportMessage } from "@/lib/supportKnowledge";

const PHONE_NUMBER = "7023 8094";
const EMAIL_ADDRESS = "info@groutix.com";
const QUICK_PROMPTS = [
  "My shower is leaking. Can this be fixed without removing tiles?",
  "How long does shower regrouting take?",
  "Do you service my area in Victoria?",
];

type TicketForm = {
  name: string;
  email: string;
  phone: string;
  issue: string;
};

const WELCOME_MESSAGE: SupportMessage = {
  role: "assistant",
  content:
    "Hi, I'm the Groutix support assistant. I can help with leaking showers, regrouting, silicone, epoxy grout, small tile repairs, and getting a human follow-up.",
};

function Bubble({ message }: { message: SupportMessage }) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm whitespace-pre-wrap ${
          isAssistant
            ? "bg-neutral-100 text-neutral-800 border border-neutral-200"
            : "bg-primary text-white"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

export default function SupportChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([WELCOME_MESSAGE]);
  const [draft, setDraft] = useState("");
  const [loadingReply, setLoadingReply] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketPending, setTicketPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [ticketForm, setTicketForm] = useState<TicketForm>({
    name: "",
    email: "",
    phone: "",
    issue: "",
  });

  const transcriptForTicket = useMemo(
    () => messages.filter((message) => message.content.trim().length > 0),
    [messages]
  );

  async function sendMessage(messageText: string) {
    const content = messageText.trim();
    if (!content || loadingReply) return;

    const userMessage: SupportMessage = { role: "user", content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    setLoadingReply(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          page: pathname,
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        error?: string;
        fallbackReply?: string;
      };

      const replyText = data.reply || data.fallbackReply || data.error;
      if (!replyText) {
        throw new Error(data.error || "The support assistant is unavailable.");
      }

      setMessages((current) => [...current, { role: "assistant", content: replyText }]);
      if (!response.ok) {
        setStatusMessage("The live assistant had trouble, so a fallback support reply was shown.");
      }
    } catch (error) {
      console.error("Support widget chat error:", error);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "I couldn't complete that reply just now. You can try again, call 7023 8094, or send a support request and the team will follow up by email.",
        },
      ]);
    } finally {
      setLoadingReply(false);
    }
  }

  async function submitTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ticketPending) return;

    setTicketPending(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ticketForm,
          transcript: transcriptForTicket,
        }),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "We couldn't send your support request.");
      }

      setStatusMessage("Support request sent. The Groutix team will follow up by email.");
      setShowTicketForm(false);
      setTicketForm({ name: "", email: "", phone: "", issue: "" });
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Your support request has been sent to the Groutix team. They'll follow up by email as soon as possible.",
        },
      ]);
    } catch (error) {
      console.error("Support widget ticket error:", error);
      setStatusMessage(error instanceof Error ? error.message : "We couldn't send your support request.");
    } finally {
      setTicketPending(false);
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(draft);
    }
  }

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <motion.section
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 top-4 z-50 flex w-[calc(100vw-2rem)] max-w-[25rem] flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]"
          >
            <div className="shrink-0 bg-primary px-5 py-4 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-white/80">
                    <Sparkles className="h-4 w-4" />
                    Support Chat
                  </div>
                  <h2 className="mt-2 text-xl font-black">Ask Groutix</h2>
                  <p className="mt-1 text-sm text-white/80">
                    Fast answers for common questions, plus email follow-up when you need a person.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                  aria-label="Close support chat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-white px-4 py-4">
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-left text-xs font-medium text-neutral-700 transition hover:border-primary hover:text-primary"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {messages.map((message, index) => (
                  <Bubble key={`${message.role}-${index}-${message.content.slice(0, 16)}`} message={message} />
                ))}
                {loadingReply ? (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-100 px-4 py-3 text-sm text-neutral-600">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Thinking through your support question...
                    </div>
                  </div>
                ) : null}
              </div>

              {showTicketForm ? (
                <form onSubmit={submitTicket} className="space-y-3 rounded-2xl border border-neutral-200 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                    <LifeBuoy className="h-4 w-4 text-primary" />
                    Human support request
                  </div>
                  <input
                    type="text"
                    value={ticketForm.name}
                    onChange={(event) => setTicketForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-primary"
                    required
                  />
                  <input
                    type="email"
                    value={ticketForm.email}
                    onChange={(event) => setTicketForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="Email address"
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-primary"
                    required
                  />
                  <input
                    type="tel"
                    value={ticketForm.phone}
                    onChange={(event) => setTicketForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="Phone number (optional)"
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-primary"
                  />
                  <textarea
                    value={ticketForm.issue}
                    onChange={(event) => setTicketForm((current) => ({ ...current, issue: event.target.value }))}
                    placeholder="Tell us what you need help with"
                    className="min-h-28 w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-primary"
                    required
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={ticketPending}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {ticketPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                      Send request
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTicketForm(false)}
                      className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setShowTicketForm(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-bold text-primary transition hover:bg-primary/10"
                  >
                    <LifeBuoy className="h-4 w-4" />
                    Request human help
                  </button>
                  <a
                    href={`tel:${PHONE_NUMBER.replace(/\s/g, "")}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:border-primary hover:text-primary"
                  >
                    <Phone className="h-4 w-4" />
                    Call {PHONE_NUMBER}
                  </a>
                </div>
              )}

              {statusMessage ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                  {statusMessage}
                </div>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-neutral-200 bg-white p-4">
              <div className="mb-2 text-xs text-neutral-500">
                Need photos or a longer description? Email {EMAIL_ADDRESS}.
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Ask about a leak, grout issue, service area, or next steps"
                  className="min-h-12 flex-1 resize-none rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-primary"
                  maxLength={1200}
                />
                <button
                  type="button"
                  onClick={() => void sendMessage(draft)}
                  disabled={loadingReply || !draft.trim()}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Send message"
                >
                  {loadingReply ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-4 z-50 inline-flex items-center gap-3 rounded-full bg-primary px-5 py-4 text-sm font-bold text-white shadow-[0_16px_36px_rgba(0,31,151,0.35)] transition hover:bg-primary-hover"
      >
        <MessageCircle className="h-5 w-5" />
        Support Chat
      </button>
    </>
  );
}
