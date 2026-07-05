"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { ArrowRight, Sparkles, ShoppingBag, Eye } from "lucide-react";

export default function ShopHome() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getFeaturedProducts() {
      try {
        const res = await api.get("/products?limit=4");
        setProducts(res.data);
      } catch (e) {
        console.error("Failed to load featured products:", e);
      } finally {
        setLoading(false);
      }
    }
    getFeaturedProducts();
  }, []);

  const categories = [
    { name: "Shirts", slug: "shirts", count: "12 Items" },
    { name: "Pants", slug: "pants", count: "8 Items" },
    { name: "Outerwear", slug: "outerwear", count: "6 Items" }
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-950/20 via-[#0b0f19] to-[#0b0f19] py-20 px-6 sm:px-8 border-b border-slate-800/40">
        <div className="mx-auto max-w-7xl text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-bold text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            Autumn/Winter Collection Now Active
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl max-w-4xl mx-auto leading-tight">
            Minimalist Aesthetics. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI-First Precision.
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-sm sm:text-base text-slate-400">
            Discover a curated collection of clothing featuring premium fabrics, architectural silhouettes, and automated supply chains.
          </p>
          <div className="pt-4">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3.5 text-sm font-bold text-white transition-all shadow-lg shadow-indigo-600/20"
            >
              Browse Catalog
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="mx-auto max-w-7xl px-6 sm:px-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <h2 className="text-lg font-bold uppercase tracking-wider text-white">Categories</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              className="group relative rounded-xl border border-slate-800 bg-[#111827] p-6 hover:border-indigo-500/40 hover:bg-[#1f2937]/20 transition-all flex flex-col justify-between h-36"
            >
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{cat.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{cat.count}</p>
              </div>
              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Shop category <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Items */}
      <section className="mx-auto max-w-7xl px-6 sm:px-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <h2 className="text-lg font-bold uppercase tracking-wider text-white">Featured Arrivals</h2>
          <Link href="/shop" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
            See all catalog <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-slate-850 bg-[#111827] h-80"></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-850 p-8 text-center text-slate-500 text-xs">
            No featured items currently in active stock.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-4">
            {products.map((prod) => (
              <div
                key={prod._id}
                className="group relative rounded-xl border border-slate-800 bg-[#111827] overflow-hidden hover:border-slate-700 flex flex-col"
              >
                {/* Product Cover */}
                <div className="aspect-square bg-slate-900 flex items-center justify-center text-slate-600 border-b border-slate-800 relative">
                  {prod.images && prod.images[0] ? (
                    <img 
                      src={prod.images[0]} 
                      alt={prod.name} 
                      className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-300"
                    />
                  ) : (
                    <ShoppingBag className="h-10 w-10 text-slate-700" />
                  )}
                  {prod.stock_quantity === 0 && (
                    <span className="absolute top-3 right-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded px-2 py-0.5 text-[9px] font-bold uppercase">
                      Sold Out
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">{prod.category}</span>
                    <h3 className="text-xs font-bold text-white tracking-wide truncate mt-0.5">{prod.name}</h3>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                    <span className="text-xs font-bold text-indigo-400">${prod.price.toFixed(2)}</span>
                    <Link
                      href={`/products/${prod._id}`}
                      className="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] font-bold text-white transition-all"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
