"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  X,
  Check,
  ChevronDown,
  Sparkles,
  Layers,
  FileText,
  DollarSign,
  Tag,
  Plus
} from "lucide-react";
import {
  SERVICE_TEMPLATES,
  type ServiceTemplate
} from "@/lib/serviceTemplates";
import {
  TEMPLATE_CATEGORIES,
  getTemplateCategory,
  type TemplateCategory
} from "@/lib/serviceMatching";

interface TemplatePickerProps {
  selectedTemplateNo?: string | number;
  onSelectTemplate: (template: ServiceTemplate | null) => void;
  buttonLabel?: string;
  triggerClassName?: string;
  modalTitle?: string;
}

export function TemplatePicker({
  selectedTemplateNo,
  onSelectTemplate,
  buttonLabel,
  triggerClassName,
  modalTitle = "Pick a Standard Groutix Template"
}: TemplatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "Epoxy" | "Polymer">("All");
  const [expandedScopeNo, setExpandedScopeNo] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find currently selected template
  const currentTemplate = useMemo(() => {
    if (!selectedTemplateNo) return null;
    return SERVICE_TEMPLATES.find((t) => String(t.no) === String(selectedTemplateNo)) || null;
  }, [selectedTemplateNo]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
      setSelectedCategory("All");
      setExpandedScopeNo(null);
    }
  }, [isOpen]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const queryWords = query.split(/\s+/).filter(Boolean);

    return SERVICE_TEMPLATES.filter((template) => {
      const code = (template.code || "").toLowerCase();
      const service = (template.service || "").toLowerCase();
      const scope = (template.scope || "").toLowerCase();
      const priceStr = String(template.price || "");
      const category = getTemplateCategory(template);

      // Category filter
      if (selectedCategory !== "All") {
        if (selectedCategory === "Epoxy") {
          const isEpoxy = code.includes("eg") || service.includes("epoxy") || scope.includes("epoxy");
          if (!isEpoxy) return false;
        } else if (selectedCategory === "Polymer") {
          const isPolymer = code.includes("pg") || service.includes("polymer") || scope.includes("polymer");
          if (!isPolymer) return false;
        } else {
          if (category !== selectedCategory) return false;
        }
      }

      // Keyword query filter
      if (queryWords.length > 0) {
        const textToSearch = `${code} ${service} ${scope} ${priceStr} ${category.toLowerCase()}`;
        return queryWords.every((word) => textToSearch.includes(word));
      }

      return true;
    });
  }, [searchQuery, selectedCategory]);

  function handleSelect(template: ServiceTemplate | null) {
    onSelectTemplate(template);
    setIsOpen(false);
  }

  return (
    <>
      {/* Trigger Button / Display */}
      {buttonLabel ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={
            triggerClassName ||
            "flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#001f97] font-bold text-xs rounded-lg transition-colors"
          }
        >
          <Search className="w-3.5 h-3.5" />
          <span>{buttonLabel}</span>
        </button>
      ) : (
        <div
          onClick={() => setIsOpen(true)}
          className={`group flex items-center justify-between gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
            currentTemplate
              ? "bg-blue-50/50 border-blue-200 hover:border-blue-400"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
            <div className="truncate">
              {currentTemplate ? (
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0">
                    {currentTemplate.code}
                  </span>
                  <span className="font-semibold text-slate-800 text-xs truncate">
                    {currentTemplate.service}
                  </span>
                </div>
              ) : (
                <span className="text-slate-500 text-xs italic">
                  Manual / Custom Description (Click to search 84 templates)
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-600">
            <span className="text-[11px] font-medium hidden sm:inline">Change</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Full-Featured Search & Selection Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#001f97] text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-tight">
                    {modalTitle}
                  </h3>
                  <div className="text-xs text-slate-500">
                    Search & select from 84 official Groutix service templates with pre-set scopes
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Controls */}
            <div className="p-4 space-y-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by code (e.g. BALCONY, MB-SS, CT), title (e.g. shower, epoxy, leaking), scope, or price..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#001f97] focus:ring-2 focus:ring-[#001f97]/10 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                {TEMPLATE_CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all text-[11px] ${
                        active
                          ? "bg-[#001f97] text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("Epoxy")}
                  className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all text-[11px] ${
                    selectedCategory === "Epoxy"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                  }`}
                >
                  ⚡ Epoxy Only
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("Polymer")}
                  className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all text-[11px] ${
                    selectedCategory === "Polymer"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-blue-50 text-blue-800 hover:bg-blue-100"
                  }`}
                >
                  🛡️ Polymer Only
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span>
                  Showing <b>{filteredTemplates.length}</b> of 84 templates
                </span>
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className="text-slate-600 hover:text-slate-900 font-semibold underline"
                >
                  Clear / Use Manual Custom Description
                </button>
              </div>
            </div>

            {/* Template List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 bg-slate-50/50 max-h-[55vh]">
              {/* Option to clear / use manual */}
              <div
                onClick={() => handleSelect(null)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  !selectedTemplateNo
                    ? "border-blue-500 bg-blue-50/70"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span>✏️ Manual / Custom Description</span>
                    {!selectedTemplateNo && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Write a custom service title, custom detailed scope, and price manually.
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Select Custom
                </button>
              </div>

              {filteredTemplates.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-slate-700 text-sm">No templates matched your search</div>
                  <div className="text-xs text-slate-400 max-w-sm mx-auto">
                    Try searching with simpler terms like "shower", "balcony", "MB-", or clear the filter tabs.
                  </div>
                </div>
              ) : (
                filteredTemplates.map((t) => {
                  const isSelected = String(selectedTemplateNo) === String(t.no);
                  const isExpanded = expandedScopeNo === t.no;
                  const category = getTemplateCategory(t);
                  const hasPrice = Number(t.price) > 0;

                  return (
                    <div
                      key={t.no}
                      onClick={() => handleSelect(t)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? "border-[#001f97] bg-blue-50/80 shadow-xs ring-1 ring-[#001f97]"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded-md bg-[#001f97] text-white">
                              {t.code}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              {category}
                            </span>
                            {t.service.toLowerCase().includes("epoxy") && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                Epoxy
                              </span>
                            )}
                            {t.service.toLowerCase().includes("polymer") && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                                Polymer
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">#{t.no}</span>
                          </div>

                          <h4 className="font-bold text-slate-900 text-xs leading-snug">
                            {t.service}
                          </h4>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {hasPrice ? (
                            <div className="font-black text-slate-900 text-sm bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-200">
                              ${Number(t.price).toFixed(2)}
                            </div>
                          ) : (
                            <div className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              Custom Rate
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(t);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              isSelected
                                ? "bg-[#001f97] text-white shadow-xs"
                                : "bg-blue-50 text-[#001f97] hover:bg-blue-100"
                            }`}
                          >
                            {isSelected ? "Selected ✓" : "Apply"}
                          </button>
                        </div>
                      </div>

                      {/* Scope Preview */}
                      {t.scope && (
                        <div
                          className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedScopeNo(isExpanded ? null : t.no);
                          }}
                        >
                          <div className={`whitespace-pre-wrap leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                            {t.scope}
                          </div>
                          {t.scope.length > 120 && (
                            <span className="text-[10px] font-bold text-[#001f97] hover:underline mt-1 inline-block">
                              {isExpanded ? "Show less ▲" : "Show full scope details ▼"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                💡 <i>Clicking a template fills the service title, scope & rate automatically. You can edit them anytime.</i>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-700 bg-white hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
