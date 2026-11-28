/** Presentation-only cleanup shared by email previews and delivered HTML. */
export function formatEmailPresentation(html: string): string {
  return html.replace(/(<[^>]*>)|([^<]+)/g, (match, tag: string | undefined, text: string | undefined) => {
    if (tag) {
      if (!/^<a\b/i.test(tag) || !/href=["']tel:\+61370238094["']/i.test(tag) || /white-space\s*:\s*nowrap/i.test(tag)) return tag;
      if (/\bstyle=["']/i.test(tag)) return tag.replace(/\bstyle=(["'])(.*?)\1/i, (_style, quote, value) => `style=${quote}${value};white-space:nowrap;${quote}`);
      return tag.replace(/>$/, ' style="white-space:nowrap;">');
    }
    return (text || match)
      .replace(/[ \t\u00a0]*\(Melbourne time\)/gi, "")
      .replace(/\(03\)(?:\s|&nbsp;)+7023(?:\s|&nbsp;)+8094/g, "(03)\u00a07023\u00a08094");
  });
}

export function emailActionButton(url: string, label: string): string {
  const href = url.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<table role="presentation" width="250" border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:250px;margin:0 0 8px;">
    <tr><td align="center" bgcolor="#001f97" style="border-radius:8px;">
      <a href="${href}" style="display:block;padding:11px 14px;color:#ffffff;text-decoration:none;font-size:15px;line-height:20px;font-weight:700;">${label}</a>
    </td></tr>
  </table>`;
}
