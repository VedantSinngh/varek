"use client";

import { useEffect, useState } from "react";
import { useCart } from "../CartContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Truck, CreditCard, ShoppingBag, Lock, Check } from "lucide-react";

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="font-mono-brand text-[10px] uppercase tracking-widest text-ink/50 font-bold block mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full rounded-lg border border-line bg-cream px-4 py-3 text-sm text-ink placeholder-ink/30 focus:outline-none focus:ring-2 focus:ring-rust/20 focus:border-rust/50 transition-colors"
      />
    </div>
  );
}

export default function CheckoutPage() {
  const { cart, cartSubtotal, clearCart } = useCart();
  const router = useRouter();

  const [addr, setAddr] = useState({ street: "", city: "", state: "", zip_code: "", country: "India" });
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login?redirect=/checkout"); return; }
    if (cart.length === 0) { router.push("/cart"); }
  }, [cart, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/orders/create-payment-intent", {
        items: cart.map((it) => ({ product_id: it.product_id, qty: it.qty })),
        shipping_address: addr,
      });
      const { order_id, payment_intent_id } = res.data;
      await api.post("/orders/webhook", {
        type: "payment_intent.succeeded",
        data: { object: { id: payment_intent_id } },
      });
      clearCart();
      router.push(`/orders/${order_id}/confirmation`);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Checkout failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-cream min-h-screen">
      <div className="bg-paper border-b border-line py-12 px-6 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow mb-2">Almost there</p>
          <h1 className="font-display text-5xl text-ink font-semibold">Checkout</h1>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 sm:px-8 py-12">
        <form onSubmit={handleSubmit} className="grid gap-10 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            {/* Shipping */}
            <div className="rounded-xl border border-line bg-paper p-7 space-y-5 stitched">
              <h3 className="font-mono-brand text-[11px] uppercase tracking-widest text-ink font-bold border-b border-line pb-3 flex items-center gap-2">
                <Truck className="h-4 w-4 text-rust" /> Shipping Address
              </h3>
              <Field label="Street Address" type="text" required value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} placeholder="123 Main Street" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="City" type="text" required value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} placeholder="Mumbai" />
                <Field label="State" type="text" required value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} placeholder="Maharashtra" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Postal Code" type="text" required value={addr.zip_code} onChange={(e) => setAddr({ ...addr, zip_code: e.target.value })} placeholder="400001" />
                <Field label="Country" type="text" required value={addr.country} onChange={(e) => setAddr({ ...addr, country: e.target.value })} placeholder="India" />
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-xl border border-line bg-paper p-7 space-y-5 stitched">
              <h3 className="font-mono-brand text-[11px] uppercase tracking-widest text-ink font-bold border-b border-line pb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-rust" /> Payment Details
              </h3>
              <Field label="Card Number" type="text" required value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Expiry" type="text" required value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM / YY" />
                <Field label="CVC" type="text" required value={cardCVC} onChange={(e) => setCardCVC(e.target.value)} placeholder="123" />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <aside className="rounded-xl border border-line bg-paper p-7 space-y-6 h-fit stitched">
            <h3 className="font-mono-brand text-[11px] uppercase tracking-widest text-ink font-bold border-b border-line pb-3 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-ink/50" /> Your Order
            </h3>

            <div className="space-y-3 max-h-48 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.product_id} className="flex justify-between items-center text-sm gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink truncate">{item.name}</p>
                    <p className="font-mono-brand text-[10px] text-ink/40 uppercase tracking-widest">Qty: {item.qty}{item.size ? ` · ${item.size}` : ""}</p>
                  </div>
                  <span className="font-mono-brand text-sm font-bold text-ink shrink-0">₹{(item.price * item.qty).toFixed(0)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-line pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-ink/60"><span>Shipping</span><span className="font-bold text-olive">Free</span></div>
              <div className="flex justify-between font-bold text-ink pt-1 border-t border-line">
                <span>Total</span>
                <span className="font-mono-brand">₹{cartSubtotal.toFixed(0)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-60"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-cream border-t-transparent" />
              ) : (
                <><Lock className="h-3.5 w-3.5" /> Place Order</>
              )}
            </button>

            <p className="font-mono-brand text-[10px] uppercase tracking-widest text-ink/30 text-center">
              Secure · 48hr dispatch · Free returns
            </p>
          </aside>
        </form>
      </div>
    </div>
  );
}
