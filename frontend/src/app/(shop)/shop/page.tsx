"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { ShoppingBag, Eye, Search, Filter } from "lucide-react";

function ShopListingContent() {
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get("category") || "";

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCategory);
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

  useEffect(() => {
    fetchProducts();
  }, [category, sort]);

  const handlePriceFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  // Client-side text filter on top
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ["shirts", "pants", "outerwear", "accessories"];

  return (
    <div className="mx-auto max-w-7xl px-6 sm:px-8 py-12">
      <div className="grid gap-8 lg:grid-cols-4">
        {/* Sidebar Filters */}
        <aside className="space-y-6 rounded-xl border border-slate-800 bg-[#111827] p-6 h-fit">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-white font-bold text-sm uppercase">
            <Filter className="h-4 w-4 text-indigo-400" />
            Filters
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-[#1f2937] px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sort By</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-[#1f2937] px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          {/* Price Range Filter */}
          <form onSubmit={handlePriceFilterSubmit} className="space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Price Range</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#1f2937] px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-600"
              />
              <span className="text-slate-600 text-xs">to</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#1f2937] px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-600"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white transition-colors"
            >
              Apply Price
            </button>
          </form>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search bar */}
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product names or SKUs..."
              className="w-full rounded-lg border border-slate-800 bg-[#111827] py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-500"
            />
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-slate-850 bg-[#111827] h-80"></div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-16 text-center text-slate-500 text-sm">
              No products found matching your active criteria.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-3">
              {filteredProducts.map((prod) => (
                <div
                  key={prod._id}
                  className="group relative rounded-xl border border-slate-800 bg-[#111827] overflow-hidden hover:border-slate-700 flex flex-col"
                >
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
                        <Eye className="h-3.5 w-3.5" />
                        Inspect
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopListing() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    }>
      <ShopListingContent />
    </Suspense>
  );
}

