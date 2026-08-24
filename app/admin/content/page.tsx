"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Save, RefreshCcw, Building, LayoutTemplate, Info, MessageSquareQuote, Shield, HelpCircle } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Panel } from "@/components/admin/Charts";
import type { SiteContent, FaqCategory, TestimonialItem, ShowerScreenModel } from "@/lib/siteContent";

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

type TabKey = "business" | "heroWhyUs" | "about" | "testimonials" | "showerScreens" | "ctaFaq";

export default function ContentPage() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("business");

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
          setError("Database is not configured - you can preview fields but saving is disabled.");
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

  function setBusiness<K extends keyof SiteContent["business"]>(
    key: K,
    value: SiteContent["business"][K]
  ) {
    setContent((c) => (c ? { ...c, business: { ...c.business, [key]: value } } : c));
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "business", label: "Business & Contact", icon: <Building className="h-4 w-4" /> },
    { key: "heroWhyUs", label: "Hero & Why Us", icon: <LayoutTemplate className="h-4 w-4" /> },
    { key: "about", label: "About Page", icon: <Info className="h-4 w-4" /> },
    { key: "testimonials", label: "Testimonials", icon: <MessageSquareQuote className="h-4 w-4" /> },
    { key: "showerScreens", label: "Shower Screens", icon: <Shield className="h-4 w-4" /> },
    { key: "ctaFaq", label: "CTA & FAQs", icon: <HelpCircle className="h-4 w-4" /> },
  ];

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900">Site Content Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Edit text, contact info, testimonials, and shower screen products across the site.</p>
        </div>
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

      {/* Tabs */}
      <div className="mb-6 flex overflow-x-auto gap-2 border-b border-slate-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${activeTab === t.key
                ? "bg-[#001f97] text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {content ? (
        <div className="space-y-6">
          {/* Business & Contact Tab */}
          {activeTab === "business" && (
            <Panel title="Business & contact information">
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
                <Labeled label="Business Hours">
                  <input
                    className={inputCls}
                    value={content.business.hours ?? "Mon – Fri: 8:00am – 5:00pm"}
                    onChange={(e) => setBusiness("hours", e.target.value)}
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
                <Labeled label="Locality / Suburb">
                  <input
                    className={inputCls}
                    value={content.business.address.locality}
                    onChange={(e) =>
                      setBusiness("address", { ...content.business.address, locality: e.target.value })
                    }
                  />
                </Labeled>
                <Labeled label="Region / State">
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
          )}

          {/* Hero & Why Us Tab */}
          {activeTab === "heroWhyUs" && (
            <div className="space-y-6">
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

              <Panel title="Why Pick Groutix section">
                <div className="space-y-4">
                  <Labeled label="Section Headline">
                    <input
                      className={inputCls}
                      value={content.whyUs?.headline ?? "Why Pick Groutix?"}
                      onChange={(e) =>
                        setContent((c) =>
                          c
                            ? {
                              ...c,
                              whyUs: {
                                ...c.whyUs,
                                headline: e.target.value,
                              },
                            }
                            : c
                        )
                      }
                    />
                  </Labeled>
                  <Labeled label="Section Sub-headline">
                    <textarea
                      className={`${inputCls} min-h-[60px]`}
                      value={content.whyUs?.subheadline ?? ""}
                      onChange={(e) =>
                        setContent((c) =>
                          c
                            ? {
                              ...c,
                              whyUs: {
                                ...c.whyUs,
                                subheadline: e.target.value,
                              },
                            }
                            : c
                        )
                      }
                    />
                  </Labeled>
                  <div>
                    <span className="mb-2 block text-xs font-medium text-slate-500">
                      Why Pick Groutix Bullet Points
                    </span>
                    <div className="space-y-2">
                      {(content.whyUs?.points ?? []).map((point, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            className={inputCls}
                            value={point}
                            onChange={(e) => {
                              const newPoints = [...(content.whyUs?.points ?? [])];
                              newPoints[idx] = e.target.value;
                              setContent((c) => (c ? { ...c, whyUs: { ...c.whyUs, points: newPoints } } : c));
                            }}
                          />
                          <button
                            onClick={() => {
                              const newPoints = (content.whyUs?.points ?? []).filter((_, i) => i !== idx);
                              setContent((c) => (c ? { ...c, whyUs: { ...c.whyUs, points: newPoints } } : c));
                            }}
                            className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50"
                            title="Delete point"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newPoints = [...(content.whyUs?.points ?? []), ""];
                          setContent((c) => (c ? { ...c, whyUs: { ...c.whyUs, points: newPoints } } : c));
                        }}
                        className="flex items-center gap-1.5 text-xs font-medium text-[#001f97] hover:underline pt-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add bullet point
                      </button>
                    </div>
                  </div>
                </div>
              </Panel>
            </div>
          )}

          {/* About Page Tab */}
          {activeTab === "about" && (
            <div className="space-y-6">
              <Panel title="About Us page content">
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Labeled label="Main Headline">
                      <input
                        className={inputCls}
                        value={content.about?.headline ?? ""}
                        onChange={(e) =>
                          setContent((c) =>
                            c ? { ...c, about: { ...c.about, headline: e.target.value } } : c
                          )
                        }
                      />
                    </Labeled>
                    <Labeled label="Story Title">
                      <input
                        className={inputCls}
                        value={content.about?.storyTitle ?? ""}
                        onChange={(e) =>
                          setContent((c) =>
                            c ? { ...c, about: { ...c.about, storyTitle: e.target.value } } : c
                          )
                        }
                      />
                    </Labeled>
                  </div>
                  <Labeled label="Main Sub-headline">
                    <textarea
                      className={`${inputCls} min-h-[60px]`}
                      value={content.about?.subheadline ?? ""}
                      onChange={(e) =>
                        setContent((c) =>
                          c ? { ...c, about: { ...c.about, subheadline: e.target.value } } : c
                        )
                      }
                    />
                  </Labeled>

                  <div>
                    <span className="mb-2 block text-xs font-medium text-slate-500">Our Story Paragraphs</span>
                    <div className="space-y-3">
                      {(content.about?.storyParagraphs ?? []).map((p, idx) => (
                        <div key={idx} className="flex gap-2">
                          <textarea
                            className={`${inputCls} min-h-[70px]`}
                            value={p}
                            onChange={(e) => {
                              const newP = [...(content.about?.storyParagraphs ?? [])];
                              newP[idx] = e.target.value;
                              setContent((c) =>
                                c ? { ...c, about: { ...c.about, storyParagraphs: newP } } : c
                              );
                            }}
                          />
                          <button
                            onClick={() => {
                              const newP = (content.about?.storyParagraphs ?? []).filter((_, i) => i !== idx);
                              setContent((c) =>
                                c ? { ...c, about: { ...c.about, storyParagraphs: newP } } : c
                              );
                            }}
                            className="h-9 rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50 self-start"
                            title="Delete paragraph"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newP = [...(content.about?.storyParagraphs ?? []), ""];
                          setContent((c) =>
                            c ? { ...c, about: { ...c.about, storyParagraphs: newP } } : c
                          );
                        }}
                        className="flex items-center gap-1.5 text-xs font-medium text-[#001f97] hover:underline"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add paragraph
                      </button>
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Stats & Features */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Panel title="About Page Stats Cards">
                  <div className="space-y-3">
                    {(content.about?.stats ?? []).map((stat, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-md bg-slate-50 p-2.5">
                        <input
                          className={`${inputCls} w-1/3`}
                          placeholder="Value (e.g. 10-Year)"
                          value={stat.value}
                          onChange={(e) => {
                            const newStats = [...(content.about?.stats ?? [])];
                            newStats[idx] = { ...stat, value: e.target.value };
                            setContent((c) => (c ? { ...c, about: { ...c.about, stats: newStats } } : c));
                          }}
                        />
                        <input
                          className={`${inputCls} flex-1`}
                          placeholder="Label (e.g. Waterproof Warranty)"
                          value={stat.label}
                          onChange={(e) => {
                            const newStats = [...(content.about?.stats ?? [])];
                            newStats[idx] = { ...stat, label: e.target.value };
                            setContent((c) => (c ? { ...c, about: { ...c.about, stats: newStats } } : c));
                          }}
                        />
                        <button
                          onClick={() => {
                            const newStats = (content.about?.stats ?? []).filter((_, i) => i !== idx);
                            setContent((c) => (c ? { ...c, about: { ...c.about, stats: newStats } } : c));
                          }}
                          className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newStats = [...(content.about?.stats ?? []), { value: "", label: "" }];
                        setContent((c) => (c ? { ...c, about: { ...c.about, stats: newStats } } : c));
                      }}
                      className="flex items-center gap-1.5 text-xs font-medium text-[#001f97] hover:underline pt-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add stat card
                    </button>
                  </div>
                </Panel>

                <Panel title="About Page Features Checkmarks">
                  <div className="space-y-3">
                    {(content.about?.features ?? []).map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          className={inputCls}
                          value={feat}
                          onChange={(e) => {
                            const newF = [...(content.about?.features ?? [])];
                            newF[idx] = e.target.value;
                            setContent((c) => (c ? { ...c, about: { ...c.about, features: newF } } : c));
                          }}
                        />
                        <button
                          onClick={() => {
                            const newF = (content.about?.features ?? []).filter((_, i) => i !== idx);
                            setContent((c) => (c ? { ...c, about: { ...c.about, features: newF } } : c));
                          }}
                          className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newF = [...(content.about?.features ?? []), ""];
                        setContent((c) => (c ? { ...c, about: { ...c.about, features: newF } } : c));
                      }}
                      className="flex items-center gap-1.5 text-xs font-medium text-[#001f97] hover:underline pt-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add feature bullet
                    </button>
                  </div>
                </Panel>
              </div>

              {/* Values */}
              <Panel title="Company Values Cards">
                <div className="space-y-4">
                  {(content.about?.values ?? []).map((val, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-200 p-3 bg-slate-50 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          className={`${inputCls} font-semibold`}
                          placeholder="Value Title (e.g. Honest Advice)"
                          value={val.title}
                          onChange={(e) => {
                            const newV = [...(content.about?.values ?? [])];
                            newV[idx] = { ...val, title: e.target.value };
                            setContent((c) => (c ? { ...c, about: { ...c.about, values: newV } } : c));
                          }}
                        />
                        <button
                          onClick={() => {
                            const newV = (content.about?.values ?? []).filter((_, i) => i !== idx);
                            setContent((c) => (c ? { ...c, about: { ...c.about, values: newV } } : c));
                          }}
                          className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <textarea
                        className={`${inputCls} min-h-[50px]`}
                        placeholder="Description"
                        value={val.desc}
                        onChange={(e) => {
                          const newV = [...(content.about?.values ?? [])];
                          newV[idx] = { ...val, desc: e.target.value };
                          setContent((c) => (c ? { ...c, about: { ...c.about, values: newV } } : c));
                        }}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newV = [...(content.about?.values ?? []), { title: "", desc: "" }];
                      setContent((c) => (c ? { ...c, about: { ...c.about, values: newV } } : c));
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#001f97] hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add company value card
                  </button>
                </div>
              </Panel>
            </div>
          )}

          {/* Testimonials Tab */}
          {activeTab === "testimonials" && (
            <TestimonialEditor
              testimonials={content.testimonials ?? []}
              onChange={(testimonials) => setContent((c) => (c ? { ...c, testimonials } : c))}
            />
          )}

          {/* Shower Screens Tab */}
          {activeTab === "showerScreens" && (
            <ShowerScreensEditor
              showerScreens={content.showerScreens ?? []}
              onChange={(showerScreens) => setContent((c) => (c ? { ...c, showerScreens } : c))}
            />
          )}

          {/* CTA & FAQs Tab */}
          {activeTab === "ctaFaq" && (
            <div className="space-y-6">
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

              <FaqEditor
                categories={content.faqCategories}
                onChange={(faqCategories) => setContent((c) => (c ? { ...c, faqCategories } : c))}
              />
            </div>
          )}
        </div>
      ) : !loading ? null : (
        <div className="py-20 text-center text-sm text-slate-400">Loading content…</div>
      )}
    </AdminShell>
  );
}

function TestimonialEditor({
  testimonials,
  onChange,
}: {
  testimonials: TestimonialItem[];
  onChange: (testimonials: TestimonialItem[]) => void;
}) {
  return (
    <Panel
      title="Customer Testimonials & Reviews"
      action={
        <button
          onClick={() =>
            onChange([
              ...testimonials,
              {
                name: "New Customer",
                location: "Melbourne, VIC",
                rating: 5,
                title: "Great Service",
                content: "Very happy with the regrouting work.",
                date: "Recently",
              },
            ])
          }
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          <Plus className="h-3.5 w-3.5" /> Add testimonial
        </button>
      }
    >
      <div className="space-y-4">
        {testimonials.map((t, idx) => (
          <div key={idx} className="rounded-lg border border-slate-200 p-4 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-700">Review #{idx + 1}</span>
              <button
                onClick={() => onChange(testimonials.filter((_, i) => i !== idx))}
                className="rounded-lg border border-red-200 p-1.5 text-red-500 hover:bg-red-50"
                title="Delete testimonial"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Labeled label="Customer Name">
                <input
                  className={inputCls}
                  value={t.name}
                  onChange={(e) => {
                    const next = [...testimonials];
                    next[idx] = { ...t, name: e.target.value };
                    onChange(next);
                  }}
                />
              </Labeled>
              <Labeled label="Location / Suburb">
                <input
                  className={inputCls}
                  value={t.location}
                  onChange={(e) => {
                    const next = [...testimonials];
                    next[idx] = { ...t, location: e.target.value };
                    onChange(next);
                  }}
                />
              </Labeled>
              <div className="grid grid-cols-2 gap-2">
                <Labeled label="Rating (1-5)">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className={inputCls}
                    value={t.rating}
                    onChange={(e) => {
                      const next = [...testimonials];
                      next[idx] = { ...t, rating: Math.min(5, Math.max(1, Number(e.target.value))) };
                      onChange(next);
                    }}
                  />
                </Labeled>
                <Labeled label="Date / Time Tag">
                  <input
                    className={inputCls}
                    value={t.date}
                    onChange={(e) => {
                      const next = [...testimonials];
                      next[idx] = { ...t, date: e.target.value };
                      onChange(next);
                    }}
                  />
                </Labeled>
              </div>
            </div>
            <Labeled label="Review Title / Headline">
              <input
                className={inputCls}
                value={t.title}
                onChange={(e) => {
                  const next = [...testimonials];
                  next[idx] = { ...t, title: e.target.value };
                  onChange(next);
                }}
              />
            </Labeled>
            <Labeled label="Review Body Text">
              <textarea
                className={`${inputCls} min-h-[60px]`}
                value={t.content}
                onChange={(e) => {
                  const next = [...testimonials];
                  next[idx] = { ...t, content: e.target.value };
                  onChange(next);
                }}
              />
            </Labeled>
          </div>
        ))}
        {testimonials.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No testimonials yet.</p>
        ) : null}
      </div>
    </Panel>
  );
}

function ShowerScreensEditor({
  showerScreens,
  onChange,
}: {
  showerScreens: ShowerScreenModel[];
  onChange: (showerScreens: ShowerScreenModel[]) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>(showerScreens[0]?.id ?? "");

  const active = showerScreens.find((s) => s.id === selectedId) ?? showerScreens[0];

  function updateActive(updated: ShowerScreenModel) {
    onChange(showerScreens.map((s) => (s.id === updated.id ? updated : s)));
  }

  function addModel() {
    const newId = `shower-screen-${Date.now()}`;
    const newModel: ShowerScreenModel = {
      id: newId,
      name: "New Shower Screen Model",
      tagline: "Custom Architectural Shower Screen",
      category: "Frameless",
      imageLabel: "Shower Screen Image",
      highlights: ["Toughened Glass", "Custom Fit"],
      summary: "High quality custom shower screen solution.",
      description: ["Custom built shower screen tailored for modern bathroom spaces."],
      features: ["Custom sizes available", "Toughened safety glass"],
      specs: {
        glass: "10mm Toughened Glass",
        frameFinishes: "Chrome & Matte Black",
        doorAction: "Pivot Door",
        dimensions: "Custom On-Site Measurement",
        coating: "Optional Nano4-Glass Shield",
      },
      metaTitle: "New Shower Screen | Groutix",
      metaDesc: "Custom shower screen made to measure across Victoria.",
    };
    onChange([...showerScreens, newModel]);
    setSelectedId(newId);
  }

  function deleteActive() {
    if (!active) return;
    const next = showerScreens.filter((s) => s.id !== active.id);
    onChange(next);
    setSelectedId(next[0]?.id ?? "");
  }

  return (
    <Panel title="Shower Screens & Products Catalog">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {showerScreens.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${active?.id === s.id
                    ? "bg-[#001f97] text-white font-semibold"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
              >
                {s.name || s.id}
              </button>
            ))}
          </div>
          <button
            onClick={addModel}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            <Plus className="h-3.5 w-3.5" /> Add screen model
          </button>
        </div>

        {active ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Editing: {active.name} ({active.id})
              </span>
              <button
                onClick={deleteActive}
                className="flex items-center gap-1 text-xs text-red-500 hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete model
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Labeled label="Model ID (Slug)">
                <input
                  className={inputCls}
                  value={active.id}
                  onChange={(e) => updateActive({ ...active, id: e.target.value })}
                />
              </Labeled>
              <Labeled label="Category">
                <select
                  className={inputCls}
                  value={active.category}
                  onChange={(e) =>
                    updateActive({
                      ...active,
                      category: e.target.value as ShowerScreenModel["category"],
                    })
                  }
                >
                  <option value="Frameless">Frameless</option>
                  <option value="Semi-Frameless">Semi-Frameless</option>
                  <option value="Sliding">Sliding</option>
                  <option value="Wardrobes">Wardrobes</option>
                </select>
              </Labeled>
              <Labeled label="Model Name">
                <input
                  className={inputCls}
                  value={active.name}
                  onChange={(e) => updateActive({ ...active, name: e.target.value })}
                />
              </Labeled>
              <Labeled label="Tagline">
                <input
                  className={inputCls}
                  value={active.tagline}
                  onChange={(e) => updateActive({ ...active, tagline: e.target.value })}
                />
              </Labeled>
            </div>

            <Labeled label="Short Summary">
              <textarea
                className={`${inputCls} min-h-[60px]`}
                value={active.summary}
                onChange={(e) => updateActive({ ...active, summary: e.target.value })}
              />
            </Labeled>

            <Labeled label="Highlights Badges (comma-separated)">
              <input
                className={inputCls}
                value={active.highlights.join(", ")}
                onChange={(e) =>
                  updateActive({
                    ...active,
                    highlights: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </Labeled>

            {/* Features */}
            <div>
              <span className="mb-2 block text-xs font-medium text-slate-500">Key Features List</span>
              <div className="space-y-2">
                {active.features.map((feat, fi) => (
                  <div key={fi} className="flex items-center gap-2">
                    <input
                      className={inputCls}
                      value={feat}
                      onChange={(e) => {
                        const newF = [...active.features];
                        newF[fi] = e.target.value;
                        updateActive({ ...active, features: newF });
                      }}
                    />
                    <button
                      onClick={() => {
                        const newF = active.features.filter((_, i) => i !== fi);
                        updateActive({ ...active, features: newF });
                      }}
                      className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updateActive({ ...active, features: [...active.features, ""] })}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#001f97] hover:underline pt-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add feature item
                </button>
              </div>
            </div>

            {/* Specifications */}
            <div className="rounded-lg border border-slate-200 p-4 bg-slate-50 space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Product Specifications</span>
              <div className="grid gap-3 sm:grid-cols-2">
                <Labeled label="Glass Spec">
                  <input
                    className={inputCls}
                    value={active.specs.glass}
                    onChange={(e) =>
                      updateActive({
                        ...active,
                        specs: { ...active.specs, glass: e.target.value },
                      })
                    }
                  />
                </Labeled>
                <Labeled label="Frame Finishes">
                  <input
                    className={inputCls}
                    value={active.specs.frameFinishes}
                    onChange={(e) =>
                      updateActive({
                        ...active,
                        specs: { ...active.specs, frameFinishes: e.target.value },
                      })
                    }
                  />
                </Labeled>
                <Labeled label="Door Action">
                  <input
                    className={inputCls}
                    value={active.specs.doorAction}
                    onChange={(e) =>
                      updateActive({
                        ...active,
                        specs: { ...active.specs, doorAction: e.target.value },
                      })
                    }
                  />
                </Labeled>
                <Labeled label="Dimensions">
                  <input
                    className={inputCls}
                    value={active.specs.dimensions}
                    onChange={(e) =>
                      updateActive({
                        ...active,
                        specs: { ...active.specs, dimensions: e.target.value },
                      })
                    }
                  />
                </Labeled>
                <Labeled label="Coating / Protection">
                  <input
                    className={inputCls}
                    value={active.specs.coating}
                    onChange={(e) =>
                      updateActive({
                        ...active,
                        specs: { ...active.specs, coating: e.target.value },
                      })
                    }
                  />
                </Labeled>
              </div>
            </div>

            {/* SEO */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Labeled label="SEO Meta Title">
                <input
                  className={inputCls}
                  value={active.metaTitle}
                  onChange={(e) => updateActive({ ...active, metaTitle: e.target.value })}
                />
              </Labeled>
              <Labeled label="SEO Meta Description">
                <input
                  className={inputCls}
                  value={active.metaDesc}
                  onChange={(e) => updateActive({ ...active, metaDesc: e.target.value })}
                />
              </Labeled>
            </div>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-400">No shower screen models found.</p>
        )}
      </div>
    </Panel>
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
