"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  Search, 
  AlertTriangle, 
  ArrowRight, 
  Layers 
} from "lucide-react";

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [restocks, setRestocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, restockRes] = await Promise.all([
        api.get("/products/admin"),
        api.get("/products/restock-requests")
      ]);
      setProducts(prodRes.data);
      setRestocks(restockRes.data);
    } catch (err) {
      console.error("Error fetching inventory data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter products based on SKU or Name search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#111827] px-6 py-4">
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU or name..."
            className="w-full rounded-lg border border-slate-800 bg-[#1f2937] py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-500"
          />
        </div>
        <div className="text-xs text-slate-400">Total Catalog Items: {products.length}</div>
      </div>

      {/* Catalog Table */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] overflow-hidden">
        <div className="border-b border-slate-800 bg-[#1f2937]/20 px-6 py-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Catalog</h3>
        </div>
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-slate-500 text-xs">
            No products found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#1f2937]/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Stock Quantity</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredProducts.map((p) => {
                  const isLowStock = p.stock_quantity < 10;
                  const isOut = p.stock_quantity === 0;
                  return (
                    <tr 
                      key={p.sku} 
                      className={`hover:bg-slate-800/10 ${
                        isOut ? "bg-red-950/10 text-red-300" :
                        isLowStock ? "bg-amber-950/10 text-amber-300" :
                        ""
                      }`}
                    >
                      <td className="px-6 py-3 font-mono text-xs font-semibold text-white">{p.sku}</td>
                      <td className="px-6 py-3 text-xs font-medium text-slate-200">{p.name}</td>
                      <td className="px-6 py-3 text-xs">{p.category}</td>
                      <td className="px-6 py-3 text-xs font-bold">
                        <div className="flex items-center gap-1.5">
                          {p.stock_quantity}
                          {isLowStock && (
                            <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                              isOut ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                            }`}>
                              <AlertTriangle className="h-2.5 w-2.5" />
                              {isOut ? "OUT" : "LOW"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-xs font-semibold">${p.price.toFixed(2)}</td>
                      <td className="px-6 py-3 text-xs">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          p.brand_status === "active" ? "bg-emerald-500/15 text-emerald-400" :
                          p.brand_status === "draft" ? "bg-slate-500/15 text-slate-400" :
                          "bg-red-500/15 text-red-400"
                        }`}>
                          {p.brand_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restock Requests Section */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] overflow-hidden">
        <div className="border-b border-slate-800 bg-[#1f2937]/20 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-400" />
            Restock Requests
          </h3>
          <span className="text-[10px] text-slate-500">Auto-created by AI Agent</span>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : restocks.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-slate-500 text-xs">
            No restock requests have been logged.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#1f2937]/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Quantity Requested</th>
                  <th className="px-6 py-3">Supplier Note</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {restocks.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-800/10">
                    <td className="px-6 py-3 font-mono text-xs text-white">{r.sku}</td>
                    <td className="px-6 py-3 text-xs">{r.product_name}</td>
                    <td className="px-6 py-3 text-xs font-bold text-white">{r.quantity}</td>
                    <td className="px-6 py-3 text-xs italic max-w-[200px] truncate">{r.supplier_note}</td>
                    <td className="px-6 py-3 text-xs">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                        r.status === "approved" ? "bg-emerald-500/10 text-emerald-400" :
                        r.status === "pending_approval" ? "bg-amber-500/10 text-amber-400" :
                        "bg-slate-500/10 text-slate-400"
                      }`}>
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
