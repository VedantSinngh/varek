"use client";

import { useCart } from "../CartContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";

export default function CartPage() {
  const { cart, updateQty, removeFromCart, cartSubtotal } = useCart();
  const router = useRouter();

  const handleProceedToCheckout = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      // Redirect to login, but we can set a redirect target in query parameters
      router.push("/login?redirect=/checkout");
    } else {
      router.push("/checkout");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 space-y-8">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold uppercase tracking-wider text-white">Your Shopping Cart</h2>
      </div>

      {cart.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 py-16 text-center text-slate-500 space-y-4">
          <ShoppingBag className="h-10 w-10 text-slate-700 mx-auto" />
          <p className="text-sm font-semibold">Your cart is currently empty</p>
          <p className="text-xs text-slate-600 mt-1">Browse our shop to add active designs to your bag.</p>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-50"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-3">
          {/* Items List */}
          <div className="md:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center gap-4 rounded-xl border border-slate-800 bg-[#111827] p-4 relative"
              >
                {/* Thumbnail */}
                <div className="h-16 w-16 rounded-lg bg-slate-900 flex items-center justify-center text-slate-600 shrink-0 overflow-hidden border border-slate-800">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <ShoppingBag className="h-6 w-6" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-xs font-bold text-white tracking-wide">{item.name}</h3>
                  <div className="flex gap-2 text-[10px] text-slate-400 font-semibold mt-1">
                    {item.size && <span>Size: {item.size.toUpperCase()}</span>}
                    {item.color && <span>Color: {item.color.toUpperCase()}</span>}
                    <span>SKU: {item.sku}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => updateQty(item.product_id, item.qty - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded border border-slate-800 bg-slate-900 text-xs text-slate-400 hover:bg-slate-800 font-bold"
                    >
                      -
                    </button>
                    <span className="text-xs font-semibold text-white w-4 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.product_id, item.qty + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded border border-slate-800 bg-slate-900 text-xs text-slate-400 hover:bg-slate-800 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Price / Delete */}
                <div className="text-right flex flex-col justify-between items-end h-16 pl-2 shrink-0">
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-bold text-indigo-400">${(item.price * item.qty).toFixed(2)}</span>
                </div>
              </div>
            ))}
            
            <Link href="/shop" className="inline-flex items-center gap-1 text-xs text-slate-400 font-semibold hover:text-white transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Continue Shopping
            </Link>
          </div>

          {/* Cart Summary */}
          <aside className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-6 h-fit">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
              Order Summary
            </h3>
            
            <div className="space-y-4 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-semibold text-white">${cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Shipping</span>
                <span className="text-emerald-400 font-semibold">FREE</span>
              </div>
              <div className="border-t border-slate-800 pt-4 flex justify-between text-sm font-bold">
                <span className="text-white">Total</span>
                <span className="text-indigo-400">${cartSubtotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/10 transition-all uppercase tracking-wider"
            >
              Proceed to Checkout
              <ArrowRight className="h-4 w-4" />
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
