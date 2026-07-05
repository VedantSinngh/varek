"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { Search, Filter, ArrowRight, ShoppingBag } from "lucide-react";

const categories = ["shirts", "pants", "outerwear", "accessories", "jackets", "t-shirts"];

function ShopListingContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [sort, setSort] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (minPrice) params.append("min_price", minPrice);
      if (maxPrice) params.append("max_price", maxPrice);
      if (sort) params.append("sort_by", sort);
      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [category, sort]);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-cream min-h-screen">
      {/* Page header */}
      <div className="bg-paper border-b border-line py-12 px-6 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow mb-2">The full catalogue</p>
          <h1 className="font-display text-5xl text-ink font-semibold">Shop</h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 sm:px-8 py-12">
        <div className="grid gap-8 lg:grid-cols-4">

          {/* Sidebar */}
          <aside className="h-fit rounded-xl border border-line bg-paper p-6 space-y-6 stitched">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Filter className="h-4 w-4 text-rust" />
              <span className="font-mono-brand text-[11px] uppercase tracking-widest text-ink font-bold">Filters</span>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="font-mono-brand text-[10px] uppercase tracking-widest text-ink/50 font-bold block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Name or SKU..."
                  className="w-full rounded-lg border border-line bg-cream pl-9 pr-3 py-2 text-xs text-ink placeholder-ink/30 focus:outline-none focus:ring-1 focus:ring-rust/30"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="font-mono-brand text-[10px] uppercase tracking-widest text-ink/50 font-bold block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-line bg-cream px-3 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-rust/30"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <label className="font-mono-brand text-[10px] uppercase tracking-widest text-ink/50 font-bold block">Sort By</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full rounded-lg border border-line bg-cream px-3 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-rust/30"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            {/* Price */}
            <form onSubmit={(e) => { e.preventDefault(); fetchProducts(); }} className="space-y-3">
              <label className="font-mono-brand text-[10px] uppercase tracking-widest text-ink/50 font-bold block">Price Range (₹)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full rounded-lg border border-line bg-cream px-2 py-1.5 text-xs text-ink placeholder-ink/30 focus:outline-none focus:ring-1 focus:ring-rust/30"
                />
                <span className="text-ink/30 text-xs">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full rounded-lg border border-line bg-cream px-2 py-1.5 text-xs text-ink placeholder-ink/30 focus:outline-none focus:ring-1 focus:ring-rust/30"
                />
              </div>
              <button type="submit" className="btn-primary w-full justify-center text-xs py-2">
                Apply
              </button>
            </form>
          </aside>

          {/* Grid */}
          <div className="lg:col-span-3 space-y-6">
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-line bg-paper h-80" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line p-16 text-center">
                <ShoppingBag className="h-10 w-10 text-ink/20 mx-auto mb-4" />
                <p className="font-mono-brand text-[11px] uppercase tracking-widest text-ink/40 font-bold">No pieces found</p>
              </div>
            ) : (
              <>
                <p className="font-mono-brand text-[10px] uppercase tracking-widest text-ink/40 font-bold">
                  {filtered.length} piece{filtered.length !== 1 ? "s" : ""} found
                </p>
                <div className="grid gap-6 sm:grid-cols-3">
                  {filtered.map((prod) => (
                    <Link
                      key={prod._id}
                      href={`/products/${prod._id}`}
                      className="group rounded-xl border border-line bg-paper overflow-hidden hover:border-rust/40 transition-all stitched flex flex-col"
                    >
                      <div className="aspect-square overflow-hidden bg-cream relative">
                        {prod.images?.[0] ? (
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ShoppingBag className="h-10 w-10 text-ink/20" />
                          </div>
                        )}
                        {prod.stock_quantity === 0 && (
                          <span className="absolute top-3 right-3 chip bg-rust/10 border-rust/30 text-rust">
                            Sold Out
                          </span>
                        )}
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <span className="font-mono-brand text-[10px] uppercase tracking-widest text-rust font-bold">{prod.category}</span>
                          <h3 className="font-display text-lg text-ink font-semibold mt-1 truncate">{prod.name}</h3>
                        </div>
                        <div className="flex items-center justify-between border-t border-line pt-3">
                          <span className="font-mono-brand text-sm font-bold text-ink">₹{prod.price.toFixed(0)}</span>
                          <span className="inline-flex items-center gap-1 font-mono-brand text-[10px] uppercase tracking-widest text-rust font-bold">
                            Inspect <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopListing() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rust border-t-transparent" />
      </div>
    }>
      <ShopListingContent />
    </Suspense>
  );
}
