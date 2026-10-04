"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
  Plus,
  Trash2,
  Bookmark,
  Save,
  AlertCircle,
  RefreshCw,
  BookmarkCheck
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
import type { QuoteTemplateJSON } from "@/lib/quoteTemplates";

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
  modalTitle = "Groutix Template & Item Library"
}: TemplatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [expandedScopeNo, setExpandedScopeNo] = useState<string | null>(null);

  // Dynamic template list (standard + saved custom from DB)
  const [allTemplates, setAllTemplates] = useState<QuoteTemplateJSON[]>(() =>
    SERVICE_TEMPLATES.map((t) => ({ ...t, isCustom: false }))
  );
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // New Template creation form state
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newService, setNewService] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState("Custom");
  const [newScope, setNewScope] = useState("");
  const [savingNew, setSavingNew] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load custom templates from API whenever the picker modal is opened
  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch("/api/admin/quote-templates");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.templates) && data.templates.length > 0) {
          setAllTemplates(data.templates);
        }
      }
    } catch (err) {
      console.error("Failed to load quote templates:", err);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
      setSelectedCategory("All");
      setExpandedScopeNo(null);
      setIsCreatingNew(false);
      setActionFeedback(null);
    }
  }, [isOpen, fetchTemplates]);

  // Find currently selected template
  const currentTemplate = useMemo(() => {
    if (!selectedTemplateNo) return null;
    return allTemplates.find((t) => String(t.no) === String(selectedTemplateNo)) || null;
  }, [selectedTemplateNo, allTemplates]);

  // Handle saving brand-new template
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.trim()) return;

    setSavingNew(true);
    try {
      const res = await fetch("/api/admin/quote-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode.trim() || "CUSTOM",
          service: newService.trim(),
          price: parseFloat(newPrice) || 0,
          category: newCategory,
          scope: newScope.trim(),
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.template) {
          setAllTemplates((prev) => [result.template, ...prev.filter((t) => t.id !== result.template.id)]);
          setActionFeedback(`✓ "${result.template.service}" saved to library!`);
          setIsCreatingNew(false);
          setNewCode("");
          setNewService("");
          setNewPrice("");
          setNewScope("");
          // Auto select the newly created template
          handleSelect(result.template);
          setTimeout(() => setActionFeedback(null), 4000);
        }
      }
    } catch (err) {
      console.error("Failed to create template:", err);
    } finally {
      setSavingNew(false);
    }
  };

  // Handle deleting custom template from library
  const handleDeleteCustomTemplate = async (template: QuoteTemplateJSON, e: React.MouseEvent) => {
    e.stopPropagation();
    const idToDelete = template.id || template.no;
    if (!idToDelete) return;

    if (!confirm(`Are you sure you want to delete "${template.service}" (${template.code}) from your library?`)) {
      return;
    }

    setDeletingId(idToDelete);
    try {
      const res = await fetch(`/api/admin/quote-templates?id=${encodeURIComponent(idToDelete)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setAllTemplates((prev) => prev.filter((t) => (t.id || t.no) !== idToDelete));
        setActionFeedback(`Deleted "${template.service}" from library.`);
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch (err) {
      console.error("Failed to delete template:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // Custom templates count
  const customTemplatesCount = useMemo(() => {
    return allTemplates.filter((t) => t.isCustom).length;
  }, [allTemplates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const queryWords = query.split(/\s+/).filter(Boolean);

    return allTemplates.filter((template) => {
      const code = (template.code || "").toLowerCase();
      const service = (template.service || "").toLowerCase();
      const scope = (template.scope || "").toLowerCase();
      const priceStr = String(template.price || "");
      const category = template.category || getTemplateCategory(template);

      // Category filter
      if (selectedCategory !== "All") {
        if (selectedCategory === "Saved") {
          if (!template.isCustom) return false;
        } else if (selectedCategory === "Epoxy") {
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
  }, [allTemplates, searchQuery, selectedCategory]);

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
            "flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
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
                  <span className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded shrink-0 ${
                    currentTemplate.isCustom ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-blue-100 text-blue-800"
                  }`}>
                    {currentTemplate.code}
                  </span>
                  <span className="font-semibold text-slate-800 text-xs truncate">
                    {currentTemplate.service}
                  </span>
                  {currentTemplate.isCustom && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      Saved
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-slate-500 text-xs italic">
                  Manual / Custom Description (Click to search {allTemplates.length} templates)
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
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">
                    {modalTitle}
                  </h3>
                  <div className="text-xs text-slate-500">
                    Search, use, create, and manage reusable service templates ({allTemplates.length} total)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(!isCreatingNew)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer ${
                    isCreatingNew
                      ? "bg-slate-200 text-slate-800 hover:bg-slate-300"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isCreatingNew ? "Cancel New" : "+ Add to Library"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification Feedback Toast */}
            {actionFeedback && (
              <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-bold px-4 py-2 flex items-center justify-between">
                <span>{actionFeedback}</span>
                <button type="button" onClick={() => setActionFeedback(null)} className="text-emerald-600 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Inline "Add New Template" Form */}
            {isCreatingNew && (
              <form onSubmit={handleCreateTemplate} className="p-4 border-b border-slate-200 bg-emerald-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-emerald-600" />
                    <span>Create &amp; Save New Item to Library</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Will be available for all future quotes</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Item Code</label>
                    <input
                      type="text"
                      placeholder="e.g. CUST-REP"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Service Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shower Base Waterproof Sealing & Tile Repair"
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Standard Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 450.00"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full sm:w-60 p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                  >
                    <option value="Custom">Custom Service</option>
                    <option value="Shower">Shower</option>
                    <option value="Bathroom">Bathroom</option>
                    <option value="Balcony">Balcony</option>
                    <option value="Splashback">Splashback</option>
                    <option value="Epoxy">Epoxy Regrouting</option>
                    <option value="Clean & Seal">Clean &amp; Seal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Scope of Works Description</label>
                  <textarea
                    rows={3}
                    placeholder="• Detailed scope of works..."
                    value={newScope}
                    onChange={(e) => setNewScope(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingNew || !newService.trim()}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingNew ? "Saving..." : "Save to Library"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Search Controls */}
            <div className="p-4 space-y-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by code (e.g. BALCONY, MB-SS, CUST), title (e.g. shower, epoxy, leaking), scope, or price..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
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
                <button
                  type="button"
                  onClick={() => setSelectedCategory("All")}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all text-[11px] ${
                    selectedCategory === "All"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All ({allTemplates.length})
                </button>

                {/* Custom Saved Filter Pill */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory("Saved")}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all text-[11px] flex items-center gap-1 ${
                    selectedCategory === "Saved"
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                  }`}
                >
                  <Bookmark className="w-3 h-3" />
                  <span>Saved Templates ({customTemplatesCount})</span>
                </button>

                <span className="text-slate-300">|</span>

                {TEMPLATE_CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all text-[11px] ${
                        active
                          ? "bg-blue-600 text-white shadow-2xs"
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
                  Epoxy Only
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
                  Polymer Only
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span>
                  Showing <b>{filteredTemplates.length}</b> of {allTemplates.length} templates
                  {customTemplatesCount > 0 && ` (${customTemplatesCount} custom saved)`}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className="text-slate-600 hover:text-slate-900 font-semibold underline cursor-pointer"
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
                    <span>Manual / Custom Description</span>
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
                  className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
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
                    Try searching with simpler terms or click "+ Add to Library" to create one.
                  </div>
                </div>
              ) : (
                filteredTemplates.map((t) => {
                  const isSelected = String(selectedTemplateNo) === String(t.no);
                  const isExpanded = expandedScopeNo === t.no;
                  const category = t.category || getTemplateCategory(t);
                  const hasPrice = Number(t.price) > 0;
                  const isCustom = Boolean(t.isCustom);

                  return (
                    <div
                      key={t.no || t.id}
                      onClick={() => handleSelect(t)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/60 shadow-2xs ring-1 ring-blue-600/30"
                          : isCustom
                          ? "border-amber-200 bg-amber-50/30 hover:border-amber-400 hover:shadow-2xs"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-2xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded-md ${
                              isCustom ? "bg-amber-600 text-white" : "bg-blue-600 text-white"
                            }`}>
                              {t.code}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              {category}
                            </span>
                            {isCustom && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                <BookmarkCheck className="w-3 h-3 text-amber-700" />
                                Custom Saved
                              </span>
                            )}
                            {t.service.toLowerCase().includes("epoxy") && !isCustom && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60">
                                Epoxy
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">#{t.no}</span>
                          </div>

                          <h4 className="font-semibold text-slate-900 text-xs leading-snug">
                            {t.service}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {hasPrice ? (
                            <div className="font-bold text-emerald-800 text-sm bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/80">
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
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-blue-600 text-white shadow-2xs"
                                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                            }`}
                          >
                            {isSelected ? "Selected" : "Apply"}
                          </button>

                          {/* Delete custom template from library */}
                          {isCustom && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomTemplate(t, e)}
                              disabled={deletingId === (t.id || t.no)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete from Library"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Scope Preview */}
                      {t.scope && (
                        <div
                          className="text-[11px] text-slate-600 bg-slate-50/70 p-2 rounded-lg border border-slate-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedScopeNo(isExpanded ? null : t.no);
                          }}
                        >
                          <div className={`whitespace-pre-wrap leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                            {t.scope}
                          </div>
                          {t.scope.length > 120 && (
                            <span className="text-[10px] font-semibold text-blue-600 hover:underline mt-1 inline-block">
                              {isExpanded ? "Show less" : "Show full scope details"}
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
              <div className="flex items-center gap-2">
                <i>Clicking a template automatically fills the service title, scope, and rate. You can edit them anytime.</i>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-700 bg-white hover:bg-slate-100 cursor-pointer"
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
