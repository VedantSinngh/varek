"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { ClipboardList, ArrowRight } from "lucide-react";

export default function CustomerOrdersHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await api.get("/orders");
        setOrders(res.data);
      } catch (err) {
        console.error("Failed to load customer orders:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Purchase History</h3>
        <p className="text-[10px] text-slate-500 mt-1">Review tracking statuses of past purchases.</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-slate-550 space-y-3">
          <ClipboardList className="h-8 w-8 text-slate-700 mx-auto" />
          <p className="text-xs font-semibold text-slate-400">No transactions recorded yet</p>
          <Link href="/shop" className="inline-block text-xs text-indigo-400 hover:text-indigo-300 font-bold">
            Shop catalog
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/10">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#1f2937]/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Items Count</th>
                <th className="px-4 py-3">Total Cost</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-slate-800/20">
                  <td className="px-4 py-3 font-mono text-[11px] text-white truncate max-w-[120px]">{o._id}</td>
                  <td className="px-4 py-3 text-[11px] text-slate-450">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {o.items.reduce((sum: number, it: any) => sum + it.qty, 0)}
                  </td>
                  <td className="px-4 py-3 font-bold text-white">${o.total_amount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                      o.status === "delivered" ? "bg-emerald-500/15 text-emerald-400" :
                      o.status === "pending" ? "bg-amber-500/15 text-amber-400" :
                      o.status === "cancelled" ? "bg-red-500/15 text-red-400" :
                      "bg-indigo-500/15 text-indigo-400"
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/account/orders/${o._id}`}
                      className="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[10px] font-bold text-white transition-colors"
                    >
                      Track <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
