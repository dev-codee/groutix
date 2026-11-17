import { isQuoteScopeHeading } from "@/lib/quoteScope";

/** Render saved text safely while preserving headings, bullets and line breaks. */
export function QuoteText({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  function flushBullets() {
    if (!bullets.length) return;
    blocks.push(<ul key={`list-${blocks.length}`} className="list-disc pl-5 space-y-1.5">{bullets.map((line, index) => <li key={index}>{line}</li>)}</ul>);
    bullets = [];
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) { flushBullets(); continue; }
    const bullet = line.match(/^(?:[•●▪*-]|\d+[)])\s+(.+)$/);
    if (bullet) { bullets.push(bullet[1]); continue; }
    flushBullets();
    const heading = isQuoteScopeHeading(line) || /^\d+\s+[A-Z]/.test(line) || /^Groutix terms and conditions$/i.test(line);
    blocks.push(heading
      ? <h4 key={blocks.length} className="font-bold text-slate-900 pt-3 first:pt-0">{line}</h4>
      : <p key={blocks.length}>{line}</p>);
  }
  flushBullets();
  return <div className="space-y-2 text-sm text-slate-700 leading-relaxed break-words [overflow-wrap:anywhere]">{blocks}</div>;
}

interface ScopeItem { service?: string; scope?: string; description?: string }

export function QuoteScopeDetails({ jobDescription, items }: { jobDescription?: string; items: ScopeItem[] }) {
  const summary = jobDescription?.trim();
  const repeatsItem = items.some(item => [item.service, item.scope, item.description].some(text => text?.trim() === summary));
  return <section className="space-y-3" aria-labelledby="quote-scope-heading">
    <h2 id="quote-scope-heading" className="text-sm font-bold text-slate-600 uppercase tracking-wider">Scope of Works</h2>
    {summary && !repeatsItem && <div className="p-4 rounded-xl border border-slate-200"><QuoteText text={summary} /></div>}
    {items.map((item, index) => {
      // Both fields can contain customer-specific information; retain distinct text.
      const title = item.service?.trim();
      const candidates = [item.scope, item.description].map(text => {
        const lines = (text || "").trim().split(/\r?\n/);
        if (lines[0]?.trim() === title) lines.shift();
        return lines.join("\n").trim();
      });
      const unique = [...new Set(candidates.filter(Boolean))];
      const details = unique.filter(text => !unique.some(other => other !== text && other.includes(text)));
      return <article key={index} className="p-4 rounded-xl border border-slate-200 space-y-3">
        <h3 className="text-base font-bold text-slate-900">{item.service || `Restoration Work ${index + 1}`}</h3>
        {details.map((text, detailIndex) => <QuoteText key={detailIndex} text={text} />)}
      </article>;
    })}
  </section>;
}

export function QuoteConditions({ specialNotes, terms }: { specialNotes?: string; terms?: string }) {
  return <>
    {specialNotes && <section className="space-y-3" aria-labelledby="quote-notes-heading">
      <h2 id="quote-notes-heading" className="text-sm font-bold text-slate-600 uppercase tracking-wider">Quote Notes &amp; Conditions</h2>
      <div className="p-4 rounded-xl border border-slate-200"><QuoteText text={specialNotes} /></div>
    </section>}
    {terms && <section id="quote-terms" className="space-y-3 scroll-mt-6" aria-labelledby="quote-terms-heading">
      <h2 id="quote-terms-heading" className="text-sm font-bold text-slate-600 uppercase tracking-wider">Terms &amp; Conditions</h2>
      <div className="p-4 sm:p-5 rounded-xl border border-slate-200"><QuoteText text={terms} /></div>
    </section>}
  </>;
}
