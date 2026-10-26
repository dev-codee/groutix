import { emailDisplayText } from "@/lib/emailMedia";
import type { CustomerMessage } from "./types";

export function EmailMessageText({ text, attachments }: { text: string; attachments?: CustomerMessage["attachments"] }) {
  const display = emailDisplayText(text, attachments);
  return <div className="whitespace-pre-wrap leading-relaxed break-words">{
    display.split(/(https?:\/\/[^\s<>\[\]]+)/g).map((part, index) => {
      if (!/^https?:\/\//i.test(part)) return part;
      const shared = /^https?:\/\/(?:1drv\.ms|onedrive\.live\.com)\//i.test(part);
      return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="underline font-medium break-all">
        {shared ? "Open shared OneDrive photo" : part}
      </a>;
    })
  }</div>;
}
