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
      router.push("/login?redirect=/checkout");
    } else {
      router.push("/checkout");
    }
  };

  return (
    <div className="bg-cream min-h-screen">
      {/* Page header */}
      <div className="bg-paper border-b border-line py-12 px-6 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow mb-2">Your bag</p>
          <h1 className="font-display text-5xl text-ink font-semibold">Shopping Bag</h1>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 sm:px-8 py-12">
        {cart.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line py-20 text-center space-y-6">
            <ShoppingBag className="h-12 w-12 text-ink/20 mx-auto" />
            <div>
              <p className="font-display text-2xl text-ink font-semibold">Your bag is empty</p>
              <p className="font-mono-brand text-[11px] uppercase tracking-widest text-ink/40 mt-2">Find something worth keeping.</p>
            </div>
            <Link href="/shop" className="btn-primary inline-flex">
              Browse the Shop <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-10 md:grid-cols-3">
            {/* Items */}
            <div className="md:col-span-2 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center gap-5 rounded-xl border border-line bg-paper p-5 stitched"
                >
                  {/* Thumb */}
                  <div className="h-20 w-20 rounded-lg overflow-hidden border border-line shrink-0 bg-cream">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-ink/20" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg text-ink font-semibold truncate">{item.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.size && <span className="chip">{item.size}</span>}
                      {item.color && <span className="chip">{item.color}</span>}
                      <span className="chip">{item.sku}</span>
                    </div>
                    {/* Qty controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => updateQty(item.product_id, item.qty - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded border border-line bg-cream text-ink font-bold text-sm hover:border-rust/50 transition-colors"
                      >
                        -
                      </button>
                      <span className="font-mono-brand text-sm font-bold text-ink w-5 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.product_id, item.qty + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded border border-line bg-cream text-ink font-bold text-sm hover:border-rust/50 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Price / Remove */}
                  <div className="flex flex-col items-end justify-between h-20 shrink-0">
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="text-ink/30 hover:text-rust transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <span className="font-mono-brand text-sm font-bold text-ink">
                      ₹{(item.price * item.qty).toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}

              <Link href="/shop" className="inline-flex items-center gap-1.5 font-mono-brand text-[11px] uppercase tracking-widest text-ink/50 hover:text-rust font-bold transition-colors mt-2">
                <ArrowLeft className="h-3.5 w-3.5" /> Continue Shopping
              </Link>
            </div>

            {/* Summary */}
            <aside className="rounded-xl border border-line bg-paper p-7 space-y-6 h-fit stitched">
              <h3 className="font-mono-brand text-[11px] uppercase tracking-widest text-ink font-bold border-b border-line pb-3">
                Order Summary
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-ink/60">
                  <span>Subtotal</span>
                  <span className="font-semibold text-ink">₹{cartSubtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-ink/60">
                  <span>Shipping</span>
                  <span className="font-bold text-olive">Free</span>
                </div>
                <div className="border-t border-line pt-3 flex justify-between font-bold">
                  <span className="text-ink">Total</span>
                  <span className="font-mono-brand text-ink">₹{cartSubtotal.toFixed(0)}</span>
                </div>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="btn-primary w-full justify-center"
              >
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </button>

              <p className="text-center font-mono-brand text-[10px] uppercase tracking-widest text-ink/30">
                Free shipping · 48hr dispatch
              </p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
