"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useCart } from "../../CartContext";
import { ShoppingBag, ArrowLeft, Check, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error("Failed to load product", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    if (product.sizes?.length && !selectedSize) {
      alert("Please select a size first.");
      return;
    }
    if (product.colors?.length && !selectedColor) {
      alert("Please select a color first.");
      return;
    }

    addToCart({
      product_id: product._id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      qty: qty,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      image: product.images?.[0]
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-16 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white">Product Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The requested catalog item could not be retrieved.</p>
        <Link href="/shop" className="mt-6 inline-flex items-center gap-1 text-xs text-indigo-400 font-semibold hover:text-indigo-300">
          <ArrowLeft className="h-4 w-4" /> Back to Shop
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock_quantity === 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/shop" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-semibold mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Shop
      </Link>

      <div className="grid gap-12 md:grid-cols-2">
        {/* Images */}
        <div className="rounded-2xl border border-slate-800 bg-[#111827] aspect-square flex items-center justify-center overflow-hidden">
          {product.images && product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <ShoppingBag className="h-20 w-20 text-slate-700" />
          )}
        </div>

        {/* Product Details info */}
        <div className="space-y-6 flex flex-col justify-center">
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{product.category}</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 leading-tight">{product.name}</h2>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-xl font-extrabold text-white">${product.price.toFixed(2)}</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                isOutOfStock ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400"
              }`}>
                {isOutOfStock ? "Out of Stock" : `In Stock: ${product.stock_quantity} left`}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{product.description}</p>
          </div>

          {/* Configuration Options */}
          <div className="space-y-4 border-t border-slate-800 pt-6">
            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Select Size</span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s: string) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`rounded-lg border px-3.5 py-1.5 text-xs font-bold transition-all ${
                        selectedSize === s
                          ? "border-indigo-500 bg-indigo-500/10 text-white"
                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Select Color</span>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c: string) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`rounded-lg border px-3.5 py-1.5 text-xs font-bold transition-all ${
                        selectedColor === c
                          ? "border-indigo-500 bg-indigo-500/10 text-white"
                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {c.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            {!isOutOfStock && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Quantity</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 font-bold hover:bg-slate-800 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-white">{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(product.stock_quantity, q + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 font-bold hover:bg-slate-800 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add to Cart Actions */}
          <div className="border-t border-slate-800 pt-6">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || added}
              className={`w-full rounded-xl py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 ${
                isOutOfStock ? "bg-slate-800/40 text-slate-500 cursor-not-allowed" :
                added ? "bg-emerald-600 hover:bg-emerald-500" :
                "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/15"
              }`}
            >
              {isOutOfStock ? (
                "Out of Stock"
              ) : added ? (
                <>
                  <Check className="h-4 w-4 animate-scale-in" />
                  Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
