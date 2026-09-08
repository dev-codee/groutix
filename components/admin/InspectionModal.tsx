"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Printer,
  Save,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  Home,
  Hash,
  Sparkles,
  ClipboardList
} from "lucide-react";
import {
  INSPECTION_SECTIONS,
  type CheckValue,
  type InspectionReportDoc,
  calculateInspectionSummary,
} from "@/lib/inspection";

interface LeadLike {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  inspectionAt?: string;
  status?: string;
  assigned?: string;
  inspectionReport?: InspectionReportDoc;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lead: LeadLike;
  currentUsername?: string;
  onSave: (report: InspectionReportDoc, markCompleted?: boolean) => Promise<boolean>;
}

export function InspectionModal({ isOpen, onClose, lead, currentUsername, onSave }: Props) {
  const [report, setReport] = useState<InspectionReportDoc>(() => {
    return {
      findings: {},
      quoteBuildFromReport: "YES",
      ...lead.inspectionReport,
    };
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Initialize or update fields when modal opens or lead changes
  useEffect(() => {
    if (!isOpen) return;

    const existing = lead.inspectionReport || {};
    const defaultDate = lead.inspectionAt
      ? lead.inspectionAt.slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    setReport({
      customerName: existing.customerName || lead.name || "",
      inspectionDate: existing.inspectionDate || defaultDate,
      inspectorName: existing.inspectorName || lead.assigned || currentUsername || "Field Inspector",
      propertyAddress: existing.propertyAddress || [lead.address, lead.city, lead.state].filter(Boolean).join(", "),
      leadJobNo: existing.leadJobNo || `GX-${lead.id.slice(-6).toUpperCase()}`,
      room: existing.room || "Main Bathroom",
      findings: existing.findings || {},
      otherDetails: existing.otherDetails || "",
      quoteBuildFromReport: existing.quoteBuildFromReport || "YES",
      inspectorNotes: existing.inspectorNotes || "",
      inspectorSignature: existing.inspectorSignature || (existing.inspectorName || currentUsername || ""),
      customerAcknowledgement: existing.customerAcknowledgement || "",
      status: existing.status || "draft",
    });
    setSaveSuccess(false);
    setErrorMsg("");
  }, [isOpen, lead, currentUsername]);

  // Live calculation of summary counts
  const summary = useMemo(() => {
    return calculateInspectionSummary(report.findings);
  }, [report.findings]);

  if (!isOpen) return null;

  const handleFindingChange = (itemId: string, val: CheckValue) => {
    setReport((prev) => {
      const current = prev.findings?.[itemId];
      // Toggle off if clicking the same value
      const nextVal = current === val ? "" : val;
      return {
        ...prev,
        findings: {
          ...prev.findings,
          [itemId]: nextVal,
        },
      };
    });
  };

  const handleBatchSet = (val: CheckValue) => {
    setReport((prev) => {
      const newFindings = { ...prev.findings };
      for (const section of INSPECTION_SECTIONS) {
        for (const item of section.items) {
          if (!newFindings[item.id]) {
            newFindings[item.id] = val;
          }
        }
      }
      return { ...prev, findings: newFindings };
    });
  };

  const handleSave = async (markCompleted: boolean = false) => {
    setSaving(true);
    setErrorMsg("");
    setSaveSuccess(false);

    const now = new Date().toISOString();
    const updated: InspectionReportDoc = {
      ...report,
      status: markCompleted ? "completed" : report.status || "draft",
      completedAt: markCompleted ? now : report.completedAt,
      updatedAt: now,
    };

    try {
      const ok = await onSave(updated, markCompleted);
      if (ok) {
        setReport(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        if (markCompleted) {
          setTimeout(() => onClose(), 1200);
        }
      } else {
        setErrorMsg("Failed to save inspection report. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-inspection-report,
          #printable-inspection-report * {
            visibility: visible;
          }
          #printable-inspection-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 12px;
            background: white !important;
            color: black !important;
            font-size: 11px;
            line-height: 1.2;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        id="printable-inspection-report"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden border border-slate-200"
      >
        {/* Header Bar (Hidden on print) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#001f97] text-white flex items-center justify-center font-black text-sm shadow-inner">
              GX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">GROUTIX — INSPECTION REPORT</h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    report.status === "completed"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {report.status === "completed" ? "Completed" : "Draft"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Compact Field Inspection Form • Record findings to drive quotation item selection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print Inspection Report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Report Printable Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50">
          <div className="text-center pb-3 mb-3 border-b border-slate-200">
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              GROUTIX — INSPECTION REPORT
            </h1>
            <p className="text-[11px] text-slate-500 tracking-wide font-medium">
              Compact Field Inspection Form • Record YES / NO findings and use confirmed findings to support quotation item selection.
            </p>
          </div>

          {/* Form Top Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Customer:
              </label>
              <input
                type="text"
                value={report.customerName || ""}
                onChange={(e) => setReport({ ...report, customerName: e.target.value })}
                placeholder="Customer Name"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-900 focus:ring-1 focus:ring-[#001f97] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Inspection Date:
              </label>
              <input
                type="date"
                value={report.inspectionDate || ""}
                onChange={(e) => setReport({ ...report, inspectionDate: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-medium text-slate-900 focus:ring-1 focus:ring-[#001f97] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Inspector:
              </label>
              <input
                type="text"
                value={report.inspectorName || ""}
                onChange={(e) => setReport({ ...report, inspectorName: e.target.value })}
                placeholder="Technician / Inspector Name"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-medium text-slate-900 focus:ring-1 focus:ring-[#001f97] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Property / Address:
              </label>
              <input
                type="text"
                value={report.propertyAddress || ""}
                onChange={(e) => setReport({ ...report, propertyAddress: e.target.value })}
                placeholder="Property Address"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-medium text-slate-900 focus:ring-1 focus:ring-[#001f97] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                  Lead / Job No:
                </label>
                <input
                  type="text"
                  value={report.leadJobNo || ""}
                  onChange={(e) => setReport({ ...report, leadJobNo: e.target.value })}
                  placeholder="Job No"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-mono text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-[#001f97] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                  Room:
                </label>
                <input
                  type="text"
                  value={report.room || ""}
                  onChange={(e) => setReport({ ...report, room: e.target.value })}
                  placeholder="e.g. Ensuite, Main"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-medium text-slate-900 focus:ring-1 focus:ring-[#001f97] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quick Helper toolbar (Hidden on print) */}
          <div className="no-print mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <span className="text-[11px] text-slate-500">Quick fill:</span>
              <button
                type="button"
                onClick={() => handleBatchSet("NO")}
                className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Set Unanswered to NO
              </button>
              <button
                type="button"
                onClick={() => setReport((prev) => ({ ...prev, findings: {} }))}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                YES: {summary.yesCount}
              </span>
              <span className="flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                NO: {summary.noCount}
              </span>
              <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Unanswered: {summary.unansweredCount}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Checklist Sections Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INSPECTION_SECTIONS.map((section) => (
              <div
                key={section.key}
                className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs"
              >
                {/* Section Header */}
                <div className="bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between text-xs font-black tracking-wider uppercase">
                  <span>{section.title}</span>
                  <span className="text-[10px] text-slate-400 font-medium lowercase">
                    {section.items.length} items
                  </span>
                </div>

                {/* Section Items */}
                <div className="divide-y divide-slate-100">
                  {section.items.map((item) => {
                    const value = report.findings[item.id] || "";
                    return (
                      <div
                        key={item.id}
                        className={`px-3 py-1.5 flex items-center justify-between gap-2 text-xs transition-colors ${
                          value === "YES"
                            ? "bg-emerald-50/50"
                            : value === "NO"
                            ? "bg-slate-50/30"
                            : "hover:bg-slate-50/70"
                        }`}
                      >
                        <span className="font-medium text-slate-800 leading-tight">
                          {item.label}
                        </span>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* YES Button */}
                          <button
                            type="button"
                            onClick={() => handleFindingChange(item.id, "YES")}
                            className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase transition-all cursor-pointer flex items-center gap-1 border ${
                              value === "YES"
                                ? "bg-emerald-600 border-emerald-700 text-white shadow-xs"
                                : "bg-white border-slate-300 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                            }`}
                          >
                            <span className="w-2.5 h-2.5 flex items-center justify-center text-[10px]">
                              {value === "YES" ? "■" : "□"}
                            </span>
                            <span>YES</span>
                          </button>

                          {/* NO Button */}
                          <button
                            type="button"
                            onClick={() => handleFindingChange(item.id, "NO")}
                            className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase transition-all cursor-pointer flex items-center gap-1 border ${
                              value === "NO"
                                ? "bg-slate-800 border-slate-900 text-white shadow-xs"
                                : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-400"
                            }`}
                          >
                            <span className="w-2.5 h-2.5 flex items-center justify-center text-[10px]">
                              {value === "NO" ? "■" : "□"}
                            </span>
                            <span>NO</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Observations / Other Details */}
          <div className="border border-slate-300 rounded-xl p-3.5 bg-white shadow-xs">
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
              OTHER DETAILS / OBSERVATIONS:
            </label>
            <textarea
              rows={3}
              value={report.otherDetails || ""}
              onChange={(e) => setReport({ ...report, otherDetails: e.target.value })}
              placeholder="Record any specific site observations, water leak source, crack locations, substrate notes..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-[#001f97] focus:outline-none"
            />
          </div>

          {/* Inspection Summary Bar */}
          <div className="border-2 border-slate-900 rounded-xl p-3.5 bg-slate-50/70 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-3">
              <div className="flex items-center gap-3 font-bold">
                <span className="uppercase tracking-wider text-slate-900 font-black">
                  INSPECTION SUMMARY:
                </span>
                <span className="text-emerald-700 bg-white px-2 py-1 rounded border border-emerald-200">
                  YES findings: <span className="font-black text-sm">{summary.yesCount}</span>
                </span>
                <span className="text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                  NO: <span className="font-black text-sm">{summary.noCount}</span>
                </span>
                <span className="text-amber-700 bg-white px-2 py-1 rounded border border-amber-200">
                  Unanswered: <span className="font-black text-sm">{summary.unansweredCount}</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Quote build from report:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setReport({ ...report, quoteBuildFromReport: "YES" })}
                    className={`px-2 py-1 rounded text-xs font-bold cursor-pointer border ${
                      report.quoteBuildFromReport === "YES"
                        ? "bg-[#001f97] text-white border-[#001f97]"
                        : "bg-white text-slate-700 border-slate-300"
                    }`}
                  >
                    ■ YES
                  </button>
                  <button
                    type="button"
                    onClick={() => setReport({ ...report, quoteBuildFromReport: "NO" })}
                    className={`px-2 py-1 rounded text-xs font-bold cursor-pointer border ${
                      report.quoteBuildFromReport === "NO"
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-white text-slate-700 border-slate-300"
                    }`}
                  >
                    ■ NO
                  </button>
                </div>
              </div>
            </div>

            {/* Inspector Notes / Recommendation */}
            <div className="mb-3">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Inspector Notes / Recommendation:
              </label>
              <input
                type="text"
                value={report.inspectorNotes || ""}
                onChange={(e) => setReport({ ...report, inspectorNotes: e.target.value })}
                placeholder="Recommended solution, e.g., Epoxy Grout Upgrade + Perimeter Sealing"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-medium text-slate-900 focus:ring-1 focus:ring-[#001f97] focus:outline-none"
              />
            </div>

            {/* Signatures & Acknowledgement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-300">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Inspector Signature / Confirmed By:
                </label>
                <input
                  type="text"
                  value={report.inspectorSignature || ""}
                  onChange={(e) => setReport({ ...report, inspectorSignature: e.target.value })}
                  placeholder="Technician Signature / Name"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-semibold text-slate-900 italic focus:ring-1 focus:ring-[#001f97] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Customer Acknowledgement:
                </label>
                <input
                  type="text"
                  value={report.customerAcknowledgement || ""}
                  onChange={(e) => setReport({ ...report, customerAcknowledgement: e.target.value })}
                  placeholder="Customer Name / Acknowledgement"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-medium text-slate-900 focus:ring-1 focus:ring-[#001f97] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Reference Disclaimer Footer Note */}
          <p className="text-[10px] text-slate-500 leading-tight italic px-1">
            Reference: checklist expanded around Groutix item/service scopes covering grout removal and preparation, movement joints, epoxy/polymer grout, tile-to-tile/tile-to-floor sealing, plumbing penetrations, shower-screen caulking and penetrating sealer. This form records site observations; it does not itself constitute a waterproofing diagnosis.
          </p>
        </div>

        {/* Modal Bottom Action Footer (Hidden on print) */}
        <div className="no-print p-3 sm:px-5 sm:py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" /> Report Saved Successfully!
              </span>
            )}
            {errorMsg && (
              <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {errorMsg}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {/* Save Draft */}
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-4 py-1.5 text-xs font-bold bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Record</span>
            </button>

            {/* Save & Complete Inspection */}
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-1.5 text-xs font-bold bg-[#001f97] hover:bg-[#001777] text-white rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileCheck className="w-3.5 h-3.5" />
              )}
              <span>Complete &amp; Hand Off to Intake</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
