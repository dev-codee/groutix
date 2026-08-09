"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Save, RefreshCcw } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Panel } from "@/components/admin/Charts";
import type { SiteContent, FaqCategory } from "@/lib/siteContent";

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#001f97] focus:ring-1 focus:ring-[#001f97]";

export default function ContentPage() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/content", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as {
        content?: SiteContent;
        mongo?: boolean;
        error?: string;
      };
      if (!res.ok) setError(data.error || "Could not load content.");
      else {
        setContent(data.content ?? null);
        if (data.mongo === false)
          setError("Database is not configured — you can preview fields but saving is disabled.");
      }
    } catch {
      setError("Network error while loading content.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!content) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const data = (await res.json().catch(() => ({}))) as {
        content?: SiteContent;
        error?: string;
      };
      if (!res.ok) setError(data.error || "Could not save content.");
      else {
        setContent(data.content ?? content);
        setNotice("Saved. Live pages will update within a few seconds.");
      }
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  // Small typed updater helpers.
  function setBusiness<K extends keyof SiteContent["business"]>(
    key: K,
    value: SiteContent["business"][K]
  ) {
    setContent((c) => (c ? { ...c, business: { ...c.business, [key]: value } } : c));
  }

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-black text-slate-900">Site content</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Reload
          </button>
          <button
            onClick={save}
            disabled={saving || !content}
            className="flex items-center gap-1.5 rounded-lg bg-[#001f97] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </div>
      ) : null}

      {content ? (
        <div className="space-y-6">
          {/* Business info */}
          <Panel title="Business & contact">
            <div className="grid gap-4 sm:grid-cols-2">
              <Labeled label="Phone (display)">
                <input
                  className={inputCls}
                  value={content.business.phone}
                  onChange={(e) => setBusiness("phone", e.target.value)}
                />
              </Labeled>
              <Labeled label="Email">
                <input
                  className={inputCls}
                  value={content.business.email}
                  onChange={(e) => setBusiness("email", e.target.value)}
                />
              </Labeled>
              <Labeled label="Street">
                <input
                  className={inputCls}
                  value={content.business.address.street}
                  onChange={(e) =>
                    setBusiness("address", { ...content.business.address, street: e.target.value })
                  }
                />
              </Labeled>
              <Labeled label="Locality / suburb">
                <input
                  className={inputCls}
                  value={content.business.address.locality}
                  onChange={(e) =>
                    setBusiness("address", { ...content.business.address, locality: e.target.value })
                  }
                />
              </Labeled>
              <Labeled label="Region / state">
                <input
                  className={inputCls}
                  value={content.business.address.region}
                  onChange={(e) =>
                    setBusiness("address", { ...content.business.address, region: e.target.value })
                  }
                />
              </Labeled>
              <Labeled label="Postal code">
                <input
                  className={inputCls}
                  value={content.business.address.postalCode}
                  onChange={(e) =>
                    setBusiness("address", {
                      ...content.business.address,
                      postalCode: e.target.value,
                    })
                  }
                />
              </Labeled>
              <Labeled label="Areas served (comma-separated)">
                <input
                  className={inputCls}
                  value={content.business.areasServed.join(", ")}
                  onChange={(e) =>
                    setBusiness(
                      "areasServed",
                      e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                    )
                  }
                />
              </Labeled>
              <div className="grid grid-cols-2 gap-4">
                <Labeled label="Rating value">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    className={inputCls}
                    value={content.business.rating.value}
                    onChange={(e) =>
                      setBusiness("rating", {
                        ...content.business.rating,
                        value: Number(e.target.value),
                      })
                    }
                  />
                </Labeled>
                <Labeled label="Rating count">
                  <input
                    type="number"
                    min="0"
                    className={inputCls}
                    value={content.business.rating.count}
                    onChange={(e) =>
                      setBusiness("rating", {
                        ...content.business.rating,
                        count: Number(e.target.value),
                      })
                    }
                  />
                </Labeled>
              </div>
              <Labeled label="Google profile URL">
                <input
                  className={inputCls}
                  value={content.business.social.google}
                  onChange={(e) =>
                    setBusiness("social", { ...content.business.social, google: e.target.value })
                  }
                />
              </Labeled>
              <Labeled label="Facebook URL">
                <input
                  className={inputCls}
                  value={content.business.social.facebook}
                  onChange={(e) =>
                    setBusiness("social", { ...content.business.social, facebook: e.target.value })
                  }
                />
              </Labeled>
              <Labeled label="Instagram URL">
                <input
                  className={inputCls}
                  value={content.business.social.instagram}
                  onChange={(e) =>
                    setBusiness("social", { ...content.business.social, instagram: e.target.value })
                  }
                />
              </Labeled>
            </div>
          </Panel>

          {/* Hero */}
          <Panel title="Homepage hero">
            <div className="space-y-4">
              <Labeled label="Headline">
                <textarea
                  className={`${inputCls} min-h-[70px]`}
                  value={content.hero.headline}
                  onChange={(e) =>
                    setContent((c) => (c ? { ...c, hero: { ...c.hero, headline: e.target.value } } : c))
                  }
                />
              </Labeled>
              <Labeled label="Sub-headline">
                <textarea
                  className={`${inputCls} min-h-[80px]`}
                  value={content.hero.subheadline}
                  onChange={(e) =>
                    setContent((c) =>
                      c ? { ...c, hero: { ...c.hero, subheadline: e.target.value } } : c
                    )
                  }
                />
              </Labeled>
            </div>
          </Panel>

          {/* CTA banner */}
          <Panel title="Call-to-action banner">
            <div className="grid gap-4 sm:grid-cols-2">
              <Labeled label="Heading">
                <input
                  className={inputCls}
                  value={content.cta.heading}
                  onChange={(e) =>
                    setContent((c) => (c ? { ...c, cta: { ...c.cta, heading: e.target.value } } : c))
                  }
                />
              </Labeled>
              <Labeled label="Button label">
                <input
                  className={inputCls}
                  value={content.cta.buttonLabel}
                  onChange={(e) =>
                    setContent((c) =>
                      c ? { ...c, cta: { ...c.cta, buttonLabel: e.target.value } } : c
                    )
                  }
                />
              </Labeled>
              <div className="sm:col-span-2">
                <Labeled label="Sub-text">
                  <input
                    className={inputCls}
                    value={content.cta.subtext}
                    onChange={(e) =>
                      setContent((c) => (c ? { ...c, cta: { ...c.cta, subtext: e.target.value } } : c))
                    }
                  />
                </Labeled>
              </div>
            </div>
          </Panel>

          {/* FAQs */}
          <FaqEditor
            categories={content.faqCategories}
            onChange={(faqCategories) => setContent((c) => (c ? { ...c, faqCategories } : c))}
          />
        </div>
      ) : !loading ? null : (
        <div className="py-20 text-center text-sm text-slate-400">Loading content…</div>
      )}
    </AdminShell>
  );
}

function FaqEditor({
  categories,
  onChange,
}: {
  categories: FaqCategory[];
  onChange: (categories: FaqCategory[]) => void;
}) {
  function update(next: FaqCategory[]) {
    onChange(next);
  }
  return (
    <Panel
      title="FAQs"
      action={
        <button
          onClick={() => update([...categories, { title: "New category", faqs: [] }])}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          <Plus className="h-3.5 w-3.5" /> Add category
        </button>
      }
    >
      <div className="space-y-6">
        {categories.map((cat, ci) => (
          <div key={ci} className="rounded-lg border border-slate-200 p-4">
            <div className="mb-3 flex items-center gap-2">
              <input
                className={`${inputCls} font-semibold`}
                value={cat.title}
                onChange={(e) => {
                  const next = [...categories];
                  next[ci] = { ...cat, title: e.target.value };
                  update(next);
                }}
              />
              <button
                onClick={() => update(categories.filter((_, i) => i !== ci))}
                className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50"
                title="Delete category"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {cat.faqs.map((faq, fi) => (
                <div key={fi} className="rounded-md bg-slate-50 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      className={inputCls}
                      placeholder="Question"
                      value={faq.question}
                      onChange={(e) => {
                        const faqs = [...cat.faqs];
                        faqs[fi] = { ...faq, question: e.target.value };
                        const next = [...categories];
                        next[ci] = { ...cat, faqs };
                        update(next);
                      }}
                    />
                    <button
                      onClick={() => {
                        const next = [...categories];
                        next[ci] = { ...cat, faqs: cat.faqs.filter((_, i) => i !== fi) };
                        update(next);
                      }}
                      className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50"
                      title="Delete question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    className={`${inputCls} min-h-[64px]`}
                    placeholder="Answer"
                    value={faq.answer}
                    onChange={(e) => {
                      const faqs = [...cat.faqs];
                      faqs[fi] = { ...faq, answer: e.target.value };
                      const next = [...categories];
                      next[ci] = { ...cat, faqs };
                      update(next);
                    }}
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  const next = [...categories];
                  next[ci] = { ...cat, faqs: [...cat.faqs, { question: "", answer: "" }] };
                  update(next);
                }}
                className="flex items-center gap-1.5 text-xs font-medium text-[#001f97] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add question
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No FAQ categories yet.</p>
        ) : null}
      </div>
    </Panel>
  );
}
