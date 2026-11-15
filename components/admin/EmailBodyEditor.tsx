"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { emailHtmlToMarkdown, formatEmailReplyToHtml } from "@/lib/emailReplyFormatting";

export type EmailFormat = "bold" | "italic" | "underline" | "h2" | "h3" | "bullet" | "number" | "link" | "hr";
export interface EmailBodyEditorHandle { format: (type: EmailFormat) => void }

export const EmailBodyEditor = forwardRef<EmailBodyEditorHandle, { value: string; onChange: (value: string) => void }>(function EmailBodyEditor({ value, onChange }, ref) {
  const editor = useRef<HTMLDivElement>(null);
  const emitted = useRef<string | null>(null);
  const selection = useRef<Range | null>(null);
  useEffect(() => {
    if (editor.current && value !== emitted.current) {
      editor.current.innerHTML = formatEmailReplyToHtml(value);
      emitted.current = value;
    }
  }, [value]);

  function rememberSelection() {
    const current = window.getSelection();
    if (current?.rangeCount && editor.current?.contains(current.anchorNode) && editor.current.contains(current.focusNode)) selection.current = current.getRangeAt(0).cloneRange();
  }
  function changed() {
    if (!editor.current) return;
    const next = emailHtmlToMarkdown(editor.current.innerHTML);
    emitted.current = next;
    onChange(next);
    rememberSelection();
  }
  function restoreSelection() {
    editor.current?.focus();
    const current = window.getSelection();
    if (selection.current && editor.current?.contains(selection.current.startContainer)) {
      current?.removeAllRanges();
      current?.addRange(selection.current);
    }
  }
  useImperativeHandle(ref, () => ({ format(type) {
    restoreSelection();
    const commands = { bold: "bold", italic: "italic", underline: "underline", bullet: "insertUnorderedList", number: "insertOrderedList", hr: "insertHorizontalRule" };
    if (type === "link") {
      const url = window.prompt("Link URL", "https://");
      if (!url || !/^https?:\/\/[^\s"'<>]+$/i.test(url)) return;
      restoreSelection();
      if (window.getSelection()?.isCollapsed) document.execCommand("insertText", false, url);
      else document.execCommand("createLink", false, url);
    } else if (type === "h2" || type === "h3") document.execCommand("formatBlock", false, type);
    else document.execCommand(commands[type], false);
    changed();
  } }));

  return <div ref={editor} role="textbox" aria-label="Email message" aria-multiline="true" contentEditable suppressContentEditableWarning
    data-placeholder="Type your email message, paste formatted text, or choose a template…"
    onInput={changed} onKeyUp={rememberSelection} onMouseUp={rememberSelection} onBlur={rememberSelection}
    onPaste={event => {
      event.preventDefault();
      const html = event.clipboardData.getData("text/html");
      const source = html ? emailHtmlToMarkdown(html) : event.clipboardData.getData("text/plain");
      document.execCommand("insertHTML", false, formatEmailReplyToHtml(source));
      changed();
    }}
    className="w-full p-3 text-xs border border-slate-200 rounded-b-xl border-t-0 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed font-sans min-h-[160px] max-h-[400px] overflow-y-auto break-words empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 [&_ul]:list-disc [&_ol]:list-decimal [&_a]:underline [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-bold [&_strong]:font-bold [&_em]:italic" />;
});
