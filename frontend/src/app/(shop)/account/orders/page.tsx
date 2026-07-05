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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-rust border-t-transparent" />
      </div>
    );
  }

  const statusColor = (s: string) => {
    if (s === "delivered") return "bg-olive/10 border-olive/20 text-olive";
    if (s === "pending") return "bg-mustard/10 border-mustard/20 text-mustard";
    if (s === "cancelled") return "bg-rust/10 border-rust/20 text-rust";
    return "bg-denim/10 border-denim/20 text-denim";
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-line pb-4">
        <h2 className="font-display text-2xl text-ink font-semibold">Order History</h2>
        <p className="font-mono-brand text-[10px] uppercase tracking-widest text-ink/40 mt-1 font-bold">
          Track statuses of past purchases.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <ClipboardList className="h-8 w-8 text-ink/20 mx-auto" />
          <p className="font-mono-brand text-[11px] uppercase tracking-widest text-ink/40 font-bold">
            No orders yet
          </p>
          <Link
            href="/shop"
            className="font-mono-brand text-[11px] uppercase tracking-widest text-rust font-bold hover:underline inline-flex items-center gap-1"
          >
            Browse the Shop <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-xs text-ink">
            <thead className="border-b border-line bg-paper text-[10px] font-bold text-ink/40 uppercase tracking-widest">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr
                  key={o._id}
                  className="hover:bg-cream/60 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-[11px] text-ink font-bold truncate max-w-[120px]">
                    {o._id}
                  </td>
                  <td className="px-4 py-3 text-ink/60">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-ink/60">
                    {o.items.reduce((sum: number, it: any) => sum + it.qty, 0)}
                  </td>
                  <td className="px-4 py-3 font-mono-brand font-bold text-ink">
                    ₹{o.total_amount.toFixed(0)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono-brand text-[9px] font-bold uppercase tracking-widest ${statusColor(o.status)}`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/account/orders/${o._id}`}
                      className="inline-flex items-center gap-1 rounded border border-line bg-paper hover:border-rust/40 hover:text-rust px-2.5 py-1 font-mono-brand text-[10px] font-bold uppercase tracking-widest text-ink/60 transition-all"
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
