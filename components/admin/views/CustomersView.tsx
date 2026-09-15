"use client";

import { Search } from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { Pagination } from "@/components/admin/Pagination";
import { fmtDate } from "@/lib/adminHelpers";

const PAGE_SIZE = 20;

export function CustomersView() {
  const { filteredLeads, page, setPage, globalSearch, setGlobalSearch } = useAdminPageCtx();

  return (
    <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-black text-slate-900">
            Customer Directory ({filteredLeads.length} Records)
          </h2>
          <div className="text-xs text-slate-500">Live client contact and property records</div>
        </div>
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search job #, customer, phone, address..."
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
              <tr key={l.id} className="hover:bg-slate-50/80">
                <td className="py-3 px-3">
                  <div className="font-black text-[#001f97] text-[11px] tracking-tight mb-0.5">
                    {l.jobNo || "—"}
                  </div>
                  <div className="font-bold text-slate-900">{l.name || "Customer"}</div>
                </td>
                <td className="py-3 px-3 text-slate-600">{l.phone || "—"}</td>
                <td className="py-3 px-3 text-slate-600">{l.email || "—"}</td>
                <td className="py-3 px-3 text-slate-600">{l.address || "Melbourne, VIC"}</td>
                <td className="py-3 px-3 font-bold text-emerald-700">
                  {l.quoteAmount ? `AUD $${l.quoteAmount.toFixed(2)}` : "—"}
                </td>
                <td className="py-3 px-3 text-slate-400">{fmtDate(l.received || l.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={filteredLeads.length} onPage={setPage} />
    </div>
  );
}
