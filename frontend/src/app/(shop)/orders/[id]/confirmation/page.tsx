"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { CheckCircle, MapPin, ArrowRight, ArrowLeft } from "lucide-react";

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
      <div className="flex h-64 items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rust border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-cream min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <h2 className="font-display text-2xl text-ink font-semibold">Order Not Found</h2>
          <p className="font-mono-brand text-[11px] uppercase tracking-widest text-ink/40">
            The referenced order could not be retrieved.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 font-mono-brand text-[11px] uppercase tracking-widest text-rust font-bold hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream min-h-screen py-16 px-6">
      <div className="mx-auto max-w-2xl text-center space-y-8">
        {/* Success state */}
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-olive/10 text-olive border-2 border-olive/20">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h1 className="font-display text-5xl text-ink font-semibold">Order Confirmed!</h1>
          <p className="text-ink/60 text-base max-w-md mx-auto">
            Thank you for shopping with Varek. Your payment was verified and your order is being prepared.
          </p>
          <div className="inline-block rounded-lg border border-line bg-paper px-4 py-2 font-mono text-xs text-ink/50 select-all">
            Order ID: {order._id}
          </div>
        </div>

        {/* Details card */}
        <div className="rounded-xl border border-line bg-paper text-left p-7 space-y-6 stitched">
          <h3 className="font-mono-brand text-[11px] font-bold text-ink/50 uppercase tracking-widest border-b border-line pb-3">
            Order Summary
          </h3>

          {/* Items */}
          <div className="divide-y divide-line space-y-2">
            {order.items.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex justify-between items-center text-sm pt-3 first:pt-0"
              >
                <div>
                  <p className="font-mono-brand font-bold text-ink text-[11px] uppercase tracking-widest">
                    {item.sku}
                  </p>
                  <span className="font-mono-brand text-[10px] text-ink/40">
                    Qty: {item.qty}
                  </span>
                </div>
                <span className="font-mono-brand font-bold text-ink">
                  ₹{(item.price_at_purchase * item.qty).toFixed(0)}
                </span>
              </div>
            ))}
          </div>

          {/* Shipping */}
          <div className="border-t border-line pt-5 flex gap-3 text-sm text-ink/60">
            <MapPin className="h-4 w-4 text-rust shrink-0 mt-0.5" />
            <div>
              <span className="font-mono-brand text-[10px] font-bold text-ink/40 uppercase tracking-widest block mb-1">
                Delivery Address
              </span>
              <p className="font-semibold text-ink">{order.shipping_address.street}</p>
              <p>
                {order.shipping_address.city}, {order.shipping_address.state}{" "}
                {order.shipping_address.zip_code}
              </p>
              <p className="uppercase">{order.shipping_address.country}</p>
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-line pt-4 flex justify-between font-bold text-sm">
            <span className="text-ink">Total Charged</span>
            <span className="font-mono-brand text-rust text-base">
              ₹{order.total_amount.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 pt-2">
          <Link href="/account/orders" className="btn-ghost text-xs px-5 py-2.5">
            Track Order
          </Link>
          <Link href="/shop" className="btn-primary text-xs px-5 py-2.5">
            Continue Shopping <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
