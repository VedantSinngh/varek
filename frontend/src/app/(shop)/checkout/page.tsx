"use client";

import { useEffect, useState } from "react";
import { useCart } from "../CartContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { CreditCard, Truck, ShoppingBag, Lock, Check } from "lucide-react";

export default function CheckoutPage() {
  const { cart, cartSubtotal, clearCart } = useCart();
  const router = useRouter();

  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip_code: "",
    country: "USA",
  });
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");

  const [loading, setLoading] = useState(false);
  const [intentData, setIntentData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login?redirect=/checkout");
    } else if (cart.length === 0) {
      router.push("/cart");
    }
  }, [cart, router]);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create order and payment intent
      const payload = {
        items: cart.map(it => ({
          product_id: it.product_id,
          qty: it.qty
        })),
        shipping_address: shippingAddress
      };

      const res = await api.post("/orders/create-payment-intent", payload);
      const { order_id, payment_intent_id } = res.data;

      // 2. Trigger Stripe webhook simulation locally
      const webhookPayload = {
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: payment_intent_id
          }
        }
      };

      // Call the webhook endpoint directly (simulating Stripe server callback)
      await api.post("/orders/webhook", webhookPayload);

      // 3. Clear cart and route to confirmation
      clearCart();
      router.push(`/orders/${order_id}/confirmation`);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "Checkout failed. Please verify stock quantities.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold uppercase tracking-wider text-white">Secure Checkout</h2>
      </div>

      <form onSubmit={handleSubmitPayment} className="grid gap-8 md:grid-cols-3">
        {/* Forms column */}
        <div className="md:col-span-2 space-y-6">
          {/* Shipping Address */}
          <div className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Truck className="h-4 w-4 text-indigo-400" />
              Shipping Information
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.street}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                  placeholder="123 Main St"
                  className="w-full rounded-lg border border-slate-800 bg-[#1f2937] px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    placeholder="New York"
                    className="w-full rounded-lg border border-slate-800 bg-[#1f2937] px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                    placeholder="NY"
                    className="w-full rounded-lg border border-slate-800 bg-[#1f2937] px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.zip_code}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, zip_code: e.target.value })}
                    placeholder="10001"
                    className="w-full rounded-lg border border-slate-800 bg-[#1f2937] px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.country}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                    placeholder="USA"
                    className="w-full rounded-lg border border-slate-800 bg-[#1f2937] px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card Billing info */}
          <div className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <CreditCard className="h-4 w-4 text-indigo-400" />
              Payment Credentials
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Card Number</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4242 4242 4242 4242 (Stripe Test)"
                  className="w-full rounded-lg border border-slate-800 bg-[#1f2937] px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Expiration Date</label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM / YY"
                    className="w-full rounded-lg border border-slate-800 bg-[#1f2937] px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">CVC</label>
                  <input
                    type="text"
                    required
                    value={cardCVC}
                    onChange={(e) => setCardCVC(e.target.value)}
                    placeholder="123"
                    className="w-full rounded-lg border border-slate-800 bg-[#1f2937] px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order review aside */}
        <aside className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-6 h-fit">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-slate-400" />
            Review Order
          </h3>

          <div className="divide-y divide-slate-800 space-y-3 max-h-48 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.product_id} className="flex justify-between items-center text-xs pt-3 first:pt-0">
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-slate-200 truncate">{item.name}</p>
                  <span className="text-[10px] text-slate-500">Qty: {item.qty} {item.size && `| Size: ${item.size}`}</span>
                </div>
                <span className="font-bold text-white shrink-0">${(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-3 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Shipping cost</span>
              <span className="text-emerald-400 font-semibold">FREE</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Tax</span>
              <span className="font-semibold text-white">$0.00</span>
            </div>
            <div className="border-t border-slate-850 pt-3 flex justify-between text-sm font-bold">
              <span className="text-white">Total Amount</span>
              <span className="text-indigo-400">${cartSubtotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/10 transition-all uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5" />
                Submit Payment
              </>
            )}
          </button>
        </aside>
      </form>
    </div>
  );
}
