import { formatEmailContentToHtml } from "./emailTemplates";

/** Replies support formatting without treating pasted text as executable HTML. */
export function formatEmailReplyToHtml(text: string): string {
  text = text.replace(/__([^_\n]+)__/g, "**$1**")
    .replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,!?:;]|$)/g, "$1*$2*");
  const escaped = text.split(/(<\/?(?:strong|b|em|i|u)\s*>)/gi).map(part => {
    if (/^<\/?(?:strong|b|em|i|u)\s*>$/i.test(part)) return part;
    return part.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }).join("");
  return formatEmailContentToHtml(escaped);
}

/** Keep the formatting that browsers place on the clipboard, without source styles/scripts. */
export function emailHtmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const read = (node: Node, depth = 0): string => {
    if (node.nodeType === 3) return (node.textContent || "").replace(/\u00a0/g, " ");
    if (node.nodeType !== 1) return "";
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (["script", "style", "iframe", "object", "svg", "img", "input", "button"].includes(tag)) return "";
    if (tag === "br") return "\n";
    if (tag === "hr") return "\n\n---\n\n";
    if (tag === "ul" || tag === "ol") {
      return "\n" + Array.from(el.children).filter(li => li.tagName === "LI").map((li, index) => {
        const value = Array.from(li.childNodes).map(child => read(child, depth + 1)).join("").trim();
        return `${"  ".repeat(depth)}${tag === "ol" ? `${index + 1}.` : "-"} ${value}`;
      }).join("\n") + "\n\n";
    }
    let value = Array.from(el.childNodes).map(child => read(child, depth)).join("");
    const weight = el.style.fontWeight;
    if (["b", "strong"].includes(tag) || weight === "bold" || Number(weight) >= 600) value = `<strong>${value}</strong>`;
    if (["i", "em"].includes(tag) || el.style.fontStyle === "italic") value = `<em>${value}</em>`;
    if (tag === "u" || /underline/.test(el.style.textDecoration)) value = `<u>${value}</u>`;
    if (tag === "a") {
      const href = el.getAttribute("href") || "";
      if (/^https?:\/\/[^\s"'<>]+$/i.test(href)) value = `[${value}](${href})`;
    }
    if (/^h[1-6]$/.test(tag)) return `\n\n${tag === "h1" || tag === "h2" ? "##" : "###"} ${value.trim()}\n\n`;
    if (["p", "div", "section", "article", "blockquote", "pre"].includes(tag)) return value + "\n\n";
    return value;
  };
  return Array.from(doc.body.childNodes).map(node => read(node)).join("").replace(/\n{3,}/g, "\n\n").trim();
}
