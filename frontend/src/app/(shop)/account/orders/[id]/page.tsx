"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-rust border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="font-mono-brand text-[11px] uppercase tracking-widest text-ink/40 font-bold">
          Order details not found.
        </p>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1 font-mono-brand text-[11px] uppercase tracking-widest text-rust font-bold hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Orders
        </Link>
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
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <h2 className="font-display text-2xl text-ink font-semibold">Order Tracking</h2>
          <span className="font-mono text-[10px] text-ink/40 mt-1 block">{order._id}</span>
        </div>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1 font-mono-brand text-[11px] uppercase tracking-widest text-rust font-bold hover:underline transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Status card */}
        <div className="rounded-xl border border-line bg-cream p-5 space-y-4">
          <h4 className="font-mono-brand text-[10px] font-bold text-ink/40 uppercase tracking-widest">
            Status Information
          </h4>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono-brand text-[10px] uppercase tracking-widest text-ink/50 font-bold">
                Order Status
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono-brand text-[10px] font-bold uppercase tracking-widest ${statusColor(order.status)}`}
              >
                {order.status}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-3">
              <span className="font-mono-brand text-[10px] uppercase tracking-widest text-ink/50 font-bold">
                Tracking Code
              </span>
              <span className="font-mono text-ink text-[11px] font-semibold">
                {order.tracking_number || "Awaiting dispatch..."}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping details */}
        <div className="rounded-xl border border-line bg-cream p-5 space-y-3">
          <h4 className="font-mono-brand text-[10px] font-bold text-ink/40 uppercase tracking-widest flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-rust" /> Shipping Address
          </h4>
          <div className="text-sm text-ink/70 leading-relaxed">
            <p className="font-semibold text-ink">{order.shipping_address.street}</p>
            <p>
              {order.shipping_address.city}, {order.shipping_address.state}{" "}
              {order.shipping_address.zip_code}
            </p>
            <p className="uppercase">{order.shipping_address.country}</p>
          </div>
        </div>
      </div>

      {/* Items list */}
      <div className="rounded-xl border border-line bg-cream p-5 space-y-4">
        <h4 className="font-mono-brand text-[10px] font-bold text-ink/40 uppercase tracking-widest">
          Items in Order
        </h4>
        <div className="divide-y divide-line space-y-2">
          {order.items.map((item: any, idx: number) => (
            <div
              key={idx}
              className="flex justify-between items-center text-xs pt-3 first:pt-0"
            >
              <div>
                <p className="font-mono-brand font-bold text-ink">{item.sku}</p>
                <span className="font-mono-brand text-[9px] uppercase tracking-widest text-ink/40">
                  Qty: {item.qty}
                </span>
              </div>
              <span className="font-mono-brand font-bold text-ink">
                ₹{(item.price_at_purchase * item.qty).toFixed(0)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-line pt-4 flex justify-between text-sm font-bold">
          <span className="text-ink">Total</span>
          <span className="font-mono-brand text-rust">₹{order.total_amount.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}
