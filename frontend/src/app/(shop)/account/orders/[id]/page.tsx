"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, MapPin, Truck, Calendar, CreditCard } from "lucide-react";

export default function CustomerOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data);
      } catch (err) {
        console.error("Failed to load order details", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-6 text-slate-500">
        <p className="text-xs">Order details not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Order Tracking</h3>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">ID: {order._id}</span>
        </div>
        <Link href="/account/orders" className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Tracker */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status Information</h4>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Order Status:</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                order.status === "delivered" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                order.status === "pending" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
              }`}>
                {order.status}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
              <span className="text-slate-500">Tracking Code:</span>
              <span className="font-mono text-white text-[11px]">
                {order.tracking_number || "Awaiting dispatch..."}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping details */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> Shipping Address
          </h4>
          <div className="text-xs text-slate-300 leading-relaxed">
            <p className="font-bold text-white">{order.shipping_address.street}</p>
            <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip_code}</p>
            <p className="uppercase">{order.shipping_address.country}</p>
          </div>
        </div>
      </div>

      {/* Items list */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-5 space-y-4">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Items in Order</h4>
        <div className="divide-y divide-slate-800 space-y-3">
          {order.items.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center text-xs pt-3 first:pt-0">
              <div>
                <p className="font-bold text-slate-200">{item.sku}</p>
                <span className="text-[9px] text-slate-500">Qty: {item.qty}</span>
              </div>
              <span className="font-bold text-white">${(item.price_at_purchase * item.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-850 pt-4 flex justify-between text-xs font-bold text-white">
          <span>Total cost</span>
          <span className="text-indigo-400 text-sm">${order.total_amount.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
