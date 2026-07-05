"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Eye,
  X,
  MapPin,
  DollarSign,
  Calendar,
} from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [statusVal, setStatusVal] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = filterStatus ? `/orders?status=${filterStatus}` : "/orders";
      const res = await api.get(url);
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const handleOpenDetail = (order: any) => {
    setSelectedOrder(order);
    setTrackingNumber(order.tracking_number || "");
    setStatusVal(order.status);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      const res = await api.put(`/orders/${selectedOrder._id}/status`, {
        status: statusVal,
        tracking_number: trackingNumber || null,
      });
      setSelectedOrder(res.data);
      await fetchOrders();
      alert("Order status updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  const statusOptions = ["pending", "confirmed", "shipped", "delivered", "cancelled", "refunded"];

  const statusColor = (s: string) => {
    if (s === "delivered") return "bg-emerald-500/10 text-emerald-400";
    if (s === "pending") return "bg-amber-500/10 text-amber-400";
    if (s === "cancelled") return "bg-red-500/10 text-red-400";
    return "bg-adminGold/10 text-adminGold";
  };

  return (
    <div className="space-y-6 relative min-h-[500px]">
      {/* Filters bar */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-adminBorder bg-adminCard px-6 py-4">
        <div className="flex items-center gap-4">
          <label className="font-mono-brand text-[10px] uppercase tracking-widest text-adminMuted font-bold">
            Filter Status:
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-adminBorder bg-adminBg px-3 py-2 text-xs text-adminText focus:outline-none focus:ring-1 focus:ring-adminGold/40"
          >
            <option value="">All Orders</option>
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <span className="font-mono-brand text-[10px] uppercase tracking-widest text-adminMuted font-bold">
          Total: {orders.length}
        </span>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-adminBorder bg-adminCard overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-adminGold border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-adminMuted">
            <span className="font-mono-brand text-[11px] uppercase tracking-widest">
              No orders found matching the filter criteria.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-adminText">
              <thead className="border-b border-adminBorder bg-adminBg text-[10px] font-bold text-adminMuted uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Customer ID</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-adminBorder">
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-adminBorder/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-adminText truncate max-w-[120px]">
                      {order._id}
                    </td>
                    <td className="px-6 py-4 text-xs text-adminMuted">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-adminMuted max-w-[120px] truncate">
                      {order.user_id}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-adminMuted">
                      {order.items.reduce((acc: number, it: any) => acc + it.qty, 0)}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-adminText">
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${statusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs">
                      <button
                        onClick={() => handleOpenDetail(order)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-adminBorder bg-adminBorder/40 hover:border-adminGold/40 hover:text-adminGold px-3 py-1.5 font-mono-brand text-[10px] uppercase tracking-widest text-adminMuted transition-all"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Slide-Over Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-adminCard border-l border-adminBorder flex flex-col h-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-adminBorder px-6 py-5 bg-adminBg">
              <div>
                <h3 className="font-mono-brand text-xs font-bold text-adminText uppercase tracking-widest">
                  Order Details
                </h3>
                <span className="font-mono text-[10px] text-adminMuted mt-1 block">
                  ID: {selectedOrder._id}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-adminMuted hover:text-adminText transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status update form */}
              <form
                onSubmit={handleUpdateStatus}
                className="rounded-xl border border-adminGold/20 bg-adminGold/5 p-5 space-y-4"
              >
                <h4 className="font-mono-brand text-[10px] font-bold text-adminGold uppercase tracking-widest">
                  Manage Order Status
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono-brand text-[10px] font-bold text-adminMuted uppercase block mb-1.5">
                      Status
                    </label>
                    <select
                      value={statusVal}
                      onChange={(e) => setStatusVal(e.target.value)}
                      className="w-full rounded-lg border border-adminBorder bg-adminBg px-3 py-2 text-xs text-adminText focus:outline-none focus:ring-1 focus:ring-adminGold/40"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-mono-brand text-[10px] font-bold text-adminMuted uppercase block mb-1.5">
                      Tracking No.
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. TRK123456"
                      className="w-full rounded-lg border border-adminBorder bg-adminBg px-3 py-2 text-xs text-adminText placeholder-adminMuted/50 focus:outline-none focus:ring-1 focus:ring-adminGold/40"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-admin w-full justify-center disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Submit Updates"}
                </button>
              </form>

              {/* Order Items */}
              <div className="space-y-3">
                <h4 className="font-mono-brand text-[10px] font-bold text-adminMuted uppercase tracking-widest">
                  Purchased Items
                </h4>
                <div className="divide-y divide-adminBorder rounded-xl border border-adminBorder bg-adminBg p-4 space-y-3">
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center pt-3 first:pt-0"
                    >
                      <div>
                        <p className="text-xs font-bold text-adminText">{item.sku}</p>
                        <span className="font-mono text-[10px] text-adminMuted">
                          {item.product_id}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-adminMuted font-semibold">
                          {item.qty} × ${item.price_at_purchase.toFixed(2)}
                        </p>
                        <span className="font-mono-brand text-[10px] font-bold text-adminGold">
                          ${(item.qty * item.price_at_purchase).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-3">
                <h4 className="font-mono-brand text-[10px] font-bold text-adminMuted uppercase tracking-widest">
                  Shipping Address
                </h4>
                <div className="flex gap-3 rounded-xl border border-adminBorder bg-adminBg p-4 text-xs text-adminMuted">
                  <MapPin className="h-4 w-4 text-adminMuted shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-adminText">
                      {selectedOrder.shipping_address.street}
                    </p>
                    <p>
                      {selectedOrder.shipping_address.city},{" "}
                      {selectedOrder.shipping_address.state}
                    </p>
                    <p>
                      {selectedOrder.shipping_address.zip_code},{" "}
                      {selectedOrder.shipping_address.country}
                    </p>
                  </div>
                </div>
              </div>

              {/* Meta info */}
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-adminBorder bg-adminBg p-4">
                <div className="flex items-center gap-2.5">
                  <DollarSign className="h-4 w-4 text-adminMuted shrink-0" />
                  <div>
                    <span className="font-mono-brand text-[10px] font-bold text-adminMuted uppercase block">
                      Payment
                    </span>
                    <span className="text-xs font-bold text-adminText uppercase">
                      {selectedOrder.payment_status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-adminMuted shrink-0" />
                  <div>
                    <span className="font-mono-brand text-[10px] font-bold text-adminMuted uppercase block">
                      Created
                    </span>
                    <span className="text-xs font-bold text-adminText">
                      {new Date(selectedOrder.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
