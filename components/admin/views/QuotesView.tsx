"use client";

import { Search } from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { Pagination } from "@/components/admin/Pagination";
import { QuoteResponseBadge } from "@/components/admin/QuoteResponseBadge";
import { getBadgeColor, fmtDate } from "@/lib/adminHelpers";

const PAGE_SIZE = 20;

export function QuotesView() {
  const {
    quoteLeads,
    page,
    setPage,
    globalSearch,
    setGlobalSearch,
    openQuoteModal,
  } = useAdminPageCtx();

  return (
    <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-black text-slate-900">Active & Prepared Quotations</h2>
          <div className="text-xs text-slate-500">{quoteLeads.length} Quotes in System</div>
        </div>
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search job #, customer, phone..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#001f97] focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
              <th className="py-3 px-3">Customer</th>
              <th className="py-3 px-3">Phone</th>
              <th className="py-3 px-3">Service Scope</th>
              <th className="py-3 px-3">Quote Total</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Updated</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quoteLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((l) => {
              const items = Array.isArray(l.quoteItems) ? l.quoteItems : [];
              const sub = items.reduce((a, x) => a + Number(x.price || 0) * Number(x.qty || 1), 0);
              const total =
                l.quoteAmount ||
                (l.quoteTaxMode === "exclusive" ? sub * (1 + (l.quoteTaxRate || 10) / 100) : sub);
              return (
                <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-black text-[#001f97] text-[11px] tracking-tight mb-0.5">
                      {l.jobNo || "—"}
                    </div>
                    <div className="font-bold text-slate-900">{l.name || "Customer"}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{l.phone || "—"}</td>
                  <td className="py-3 px-3 text-slate-700 max-w-[240px] truncate">
                    {l.service || items[0]?.service || "Standard Work"}
                  </td>
                  <td className="py-3 px-3 font-black text-slate-900">AUD ${total.toFixed(2)}</td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col items-start gap-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] border ${getBadgeColor(l.status)}`}
                      >
                        {l.status}
                      </span>
                      <QuoteResponseBadge lead={l} />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {l.quoteUpdated ? fmtDate(l.quoteUpdated) : "—"}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => openQuoteModal(l)}
                      className="px-3 py-1.5 bg-[#001f97] text-white hover:bg-[#001777] rounded-lg text-xs font-bold transition-colors"
                    >
                      Open Quote
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={quoteLeads.length} onPage={setPage} />
    </div>
  );
}
