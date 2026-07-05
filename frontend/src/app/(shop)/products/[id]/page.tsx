"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { useCart } from "../../CartContext";
import { ArrowLeft, Check, AlertCircle, ShoppingBag, Tag } from "lucide-react";
import Link from "next/link";

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/products/${id}`)
      .then((r) => setProduct(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    if (product.sizes?.length && !selectedSize) { alert("Please select a size."); return; }
    if (product.colors?.length && !selectedColor) { alert("Please select a color."); return; }
    addToCart({ product_id: product._id, sku: product.sku, name: product.name, price: product.price, qty, size: selectedSize || undefined, color: selectedColor || undefined, image: product.images?.[0] });
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rust border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-cream min-h-screen mx-auto max-w-7xl px-6 py-24 text-center">
        <AlertCircle className="h-10 w-10 text-rust mx-auto mb-4" />
        <h2 className="font-display text-3xl text-ink font-semibold">Piece Not Found</h2>
        <p className="font-mono-brand text-[11px] uppercase tracking-widest text-ink/50 mt-3">This item may have already sold.</p>
        <Link href="/shop" className="inline-flex items-center gap-1.5 mt-6 font-mono-brand text-[11px] uppercase tracking-widest text-rust font-bold hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Shop
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock_quantity === 0;

  return (
    <div className="bg-cream min-h-screen">
      <div className="mx-auto max-w-6xl px-6 sm:px-8 py-12">
        <Link href="/shop" className="inline-flex items-center gap-1.5 font-mono-brand text-[11px] uppercase tracking-widest text-ink/50 hover:text-rust font-bold mb-10 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Shop
        </Link>

        <div className="grid gap-12 md:grid-cols-2">
          {/* Image */}
          <div className="rounded-xl border border-line overflow-hidden aspect-square stitched">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-paper">
                <ShoppingBag className="h-16 w-16 text-ink/20" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center space-y-8">
            {/* Header */}
            <div>
              <span className="eyebrow">{product.category}</span>
              <h1 className="font-display text-4xl sm:text-5xl text-ink font-semibold mt-2 leading-tight">{product.name}</h1>
              <div className="flex items-center gap-4 mt-4">
                <span className="font-display text-3xl text-ink font-semibold">₹{product.price.toFixed(0)}</span>
                <span className={`chip ${isOutOfStock ? "bg-rust/10 border-rust/30 text-rust" : "bg-olive/10 border-olive/30 text-olive"}`}>
                  {isOutOfStock ? "Sold Out" : `${product.stock_quantity} left`}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-ink/70 leading-relaxed border-t border-line pt-6">{product.description}</p>

            {/* Tags / SKU */}
            <div className="flex flex-wrap gap-2 items-center">
              <Tag className="h-3.5 w-3.5 text-ink/30" />
              <span className="font-mono-brand text-[10px] text-ink/40 uppercase tracking-widest">{product.sku}</span>
              {product.tags?.map((t: string) => (
                <span key={t} className="chip">{t}</span>
              ))}
            </div>

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div className="space-y-3 border-t border-line pt-6">
                <span className="font-mono-brand text-[10px] uppercase tracking-widest text-ink/50 font-bold block">Select Size</span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s: string) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`rounded-lg border px-4 py-2 font-mono-brand text-[11px] uppercase tracking-widest font-bold transition-all ${
                        selectedSize === s
                          ? "border-rust bg-rust text-cream"
                          : "border-line bg-paper text-ink/70 hover:border-rust/50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {product.colors?.length > 0 && (
              <div className="space-y-3">
                <span className="font-mono-brand text-[10px] uppercase tracking-widest text-ink/50 font-bold block">Select Color</span>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c: string) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`rounded-lg border px-4 py-2 font-mono-brand text-[11px] uppercase tracking-widest font-bold transition-all ${
                        selectedColor === c
                          ? "border-rust bg-rust text-cream"
                          : "border-line bg-paper text-ink/70 hover:border-rust/50"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty + CTA */}
            {!isOutOfStock && (
              <div className="space-y-4 border-t border-line pt-6">
                <div className="flex items-center gap-4">
                  <span className="font-mono-brand text-[10px] uppercase tracking-widest text-ink/50 font-bold">Qty</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-paper text-ink font-bold hover:border-rust/50 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-mono-brand text-sm font-bold text-ink">{qty}</span>
                    <button
                      onClick={() => setQty((q) => Math.min(product.stock_quantity, q + 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-paper text-ink font-bold hover:border-rust/50 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={added}
                  className={`btn-primary w-full justify-center text-sm py-4 ${
                    added ? "bg-olive" : "bg-rust"
                  }`}
                >
                  {added ? (
                    <><Check className="h-4 w-4" /> Added to Bag!</>
                  ) : (
                    <><ShoppingBag className="h-4 w-4" /> Add to Bag</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
