"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Search, AlertTriangle, Layers } from "lucide-react";

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
        api.get("/products/restock-requests"),
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

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-adminBorder bg-adminCard px-6 py-4">
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-adminMuted">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU or name..."
            className="w-full rounded-lg border border-adminBorder bg-adminBg py-2 pl-10 pr-4 text-xs text-adminText placeholder-adminMuted/50 focus:outline-none focus:ring-1 focus:ring-adminGold/40"
          />
        </div>
        <span className="font-mono-brand text-[10px] uppercase tracking-widest text-adminMuted font-bold">
          Total: {products.length} items
        </span>
      </div>

      {/* Catalog Table */}
      <div className="rounded-xl border border-adminBorder bg-adminCard overflow-hidden">
        <div className="border-b border-adminBorder bg-adminBg px-6 py-4">
          <h3 className="font-mono-brand text-[10px] font-bold text-adminMuted uppercase tracking-widest">
            Product Catalog
          </h3>
        </div>
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-adminGold border-t-transparent" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <span className="font-mono-brand text-[11px] uppercase tracking-widest text-adminMuted">
              No products found.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-adminText">
              <thead className="border-b border-adminBorder bg-adminBg text-[10px] font-bold text-adminMuted uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Stock</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-adminBorder">
                {filteredProducts.map((p) => {
                  const isLowStock = p.stock_quantity < 10;
                  const isOut = p.stock_quantity === 0;
                  return (
                    <tr
                      key={p.sku}
                      className={`transition-colors hover:bg-adminBorder/20 ${
                        isOut
                          ? "bg-red-950/10"
                          : isLowStock
                          ? "bg-amber-950/10"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-3 font-mono text-xs font-bold text-adminText">
                        {p.sku}
                      </td>
                      <td className="px-6 py-3 text-xs font-medium text-adminText">
                        {p.name}
                      </td>
                      <td className="px-6 py-3 text-xs text-adminMuted">
                        {p.category}
                      </td>
                      <td className="px-6 py-3 text-xs font-bold">
                        <div className="flex items-center gap-1.5">
                          <span className={isOut ? "text-red-400" : isLowStock ? "text-amber-400" : "text-adminText"}>
                            {p.stock_quantity}
                          </span>
                          {isLowStock && (
                            <span
                              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                                isOut
                                  ? "bg-red-500/15 text-red-400"
                                  : "bg-amber-500/15 text-amber-400"
                              }`}
                            >
                              <AlertTriangle className="h-2.5 w-2.5" />
                              {isOut ? "OUT" : "LOW"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-xs font-semibold text-adminText">
                        ${p.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-xs">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                            p.brand_status === "active"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : p.brand_status === "draft"
                              ? "bg-adminBorder text-adminMuted"
                              : "bg-red-500/15 text-red-400"
                          }`}
                        >
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

      {/* Restock Requests */}
      <div className="rounded-xl border border-adminBorder bg-adminCard overflow-hidden">
        <div className="border-b border-adminBorder bg-adminBg px-6 py-4 flex items-center justify-between">
          <h3 className="font-mono-brand text-[10px] font-bold text-adminMuted uppercase tracking-widest flex items-center gap-2">
            <Layers className="h-4 w-4 text-adminGold" />
            Restock Requests
          </h3>
          <span className="font-mono-brand text-[10px] text-adminMuted uppercase tracking-widest">
            Auto-created by AI Agent
          </span>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-adminGold border-t-transparent" />
          </div>
        ) : restocks.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <span className="font-mono-brand text-[11px] uppercase tracking-widest text-adminMuted">
              No restock requests logged.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-adminText">
              <thead className="border-b border-adminBorder bg-adminBg text-[10px] font-bold text-adminMuted uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Qty Requested</th>
                  <th className="px-6 py-3">Supplier Note</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-adminBorder">
                {restocks.map((r) => (
                  <tr
                    key={r._id}
                    className="hover:bg-adminBorder/20 transition-colors"
                  >
                    <td className="px-6 py-3 font-mono text-xs font-bold text-adminText">
                      {r.sku}
                    </td>
                    <td className="px-6 py-3 text-xs text-adminText">
                      {r.product_name}
                    </td>
                    <td className="px-6 py-3 text-xs font-bold text-adminGold">
                      {r.quantity}
                    </td>
                    <td className="px-6 py-3 text-xs italic text-adminMuted max-w-[200px] truncate">
                      {r.supplier_note}
                    </td>
                    <td className="px-6 py-3 text-xs">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                          r.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : r.status === "pending_approval"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-adminBorder text-adminMuted"
                        }`}
                      >
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-adminMuted">
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
