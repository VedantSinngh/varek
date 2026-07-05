"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { CheckCircle, ShoppingBag, MapPin, ArrowRight } from "lucide-react";

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Order Not Found</h2>
        <p className="text-xs text-slate-500">The referenced order details could not be retrieved.</p>
        <Link href="/" className="inline-block text-xs font-bold text-indigo-400 hover:text-indigo-300">
          Back to Store
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center space-y-8">
      <div className="space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white">Order Confirmed!</h2>
        <p className="text-sm text-slate-400">Thank you for shopping with Varek.in. Your payment was verified successfully.</p>
        <div className="font-mono text-xs font-semibold text-indigo-400 select-all pt-2">Order ID: {order._id}</div>
      </div>

      {/* Details Box */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] text-left p-6 space-y-6">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
          Summary Details
        </h3>
        
        {/* Items */}
        <div className="divide-y divide-slate-800 space-y-2">
          {order.items.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center text-xs pt-2 first:pt-0">
              <div>
                <p className="font-semibold text-slate-200">{item.sku}</p>
                <span className="text-[10px] text-slate-500">Quantity: {item.qty}</span>
              </div>
              <span className="font-bold text-white">${(item.price_at_purchase * item.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Shipping Address */}
        <div className="border-t border-slate-800 pt-4 flex gap-3 text-xs text-slate-400">
          <MapPin className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Delivery Address</span>
            <p className="text-slate-200 mt-1">{order.shipping_address.street}</p>
            <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip_code}</p>
            <p className="uppercase">{order.shipping_address.country}</p>
          </div>
        </div>

        {/* Total Price */}
        <div className="border-t border-slate-800 pt-4 flex justify-between text-sm font-bold">
          <span className="text-white">Total Charge</span>
          <span className="text-indigo-400">${order.total_amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <Link
          href="/account/orders"
          className="rounded-lg border border-slate-800 bg-slate-850/50 hover:bg-slate-800 hover:text-white px-5 py-2.5 text-xs font-bold text-slate-300 transition-colors"
        >
          Track Order
        </Link>
        <Link
          href="/shop"
          className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white flex items-center gap-1.5 transition-all"
        >
          Continue Shopping
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
