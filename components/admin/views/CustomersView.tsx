"use client";

import { Search } from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { Pagination } from "@/components/admin/Pagination";
import { fmtDate } from "@/lib/adminHelpers";

const PAGE_SIZE = 20;

export function CustomersView() {
  const { filteredLeads, page, setPage, globalSearch, setGlobalSearch } = useAdminPageCtx();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Customer Directory ({filteredLeads.length} Records)
          </h2>
          <div className="text-xs text-slate-400 font-medium">Live client contact and property records</div>
        </div>
        <div className="relative w-64 md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search job #, customer, phone, address..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/80 border border-slate-200/90 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider bg-slate-50/70">
              <th className="py-2.5 px-3">Customer Name</th>
              <th className="py-2.5 px-3">Phone</th>
              <th className="py-2.5 px-3">Email</th>
              <th className="py-2.5 px-3">Property Address</th>
              <th className="py-2.5 px-3">Total Work Value</th>
              <th className="py-2.5 px-3">Last Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((l) => (
              <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-3">
                  <div className="font-semibold text-blue-600 text-xs tabular-nums mb-0.5">
                    {l.jobNo || "—"}
                  </div>
                  <div className="font-semibold text-slate-900 text-xs">{l.name || "Customer"}</div>
                </td>
                <td className="py-3 px-3 text-slate-600 text-xs">{l.phone || "—"}</td>
                <td className="py-3 px-3 text-slate-600 text-xs">{l.email || "—"}</td>
                <td className="py-3 px-3 text-slate-600 text-xs">{l.address || "Melbourne, VIC"}</td>
                <td className="py-3 px-3 font-semibold text-emerald-700 text-xs tabular-nums">
                  {l.quoteAmount ? `AUD $${l.quoteAmount.toFixed(2)}` : "—"}
                </td>
                <td className="py-3 px-3 text-slate-500 text-xs tabular-nums">{fmtDate(l.received || l.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={filteredLeads.length} onPage={setPage} />
    </div>
  );
}
