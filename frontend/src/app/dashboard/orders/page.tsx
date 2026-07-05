"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  Eye, 
  X, 
  MapPin, 
  DollarSign, 
  Truck, 
  Calendar 
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
        tracking_number: trackingNumber || null
      });
      // Update local state
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

  return (
    <div className="space-y-6 relative min-h-[500px]">
      {/* Filters */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#111827] px-6 py-4">
        <div className="flex items-center gap-4">
          <label className="text-xs font-semibold text-slate-400 uppercase">Filter Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-800 bg-[#1f2937] px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Orders</option>
            {statusOptions.map(opt => (
              <option key={opt} value={opt}>{opt.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <div className="text-xs text-slate-400">Total: {orders.length}</div>
      </div>

      {/* Orders Grid/Table */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-400">
            <span>No orders found matching the filter criteria.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#1f2937]/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Customer ID</th>
                  <th className="px-6 py-4">Items Count</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-800/20">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-white truncate max-w-[120px]">
                      {order._id}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs max-w-[120px] truncate">
                      {order.user_id}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-400">
                      {order.items.reduce((acc: number, it: any) => acc + it.qty, 0)}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-white">
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                        order.status === "delivered" ? "bg-emerald-500/10 text-emerald-400" :
                        order.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                        order.status === "cancelled" ? "bg-red-500/10 text-red-400" :
                        "bg-indigo-500/10 text-indigo-400"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs">
                      <button
                        onClick={() => handleOpenDetail(order)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:text-white px-3 py-1.5 font-semibold text-slate-300 transition-all"
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
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#111827] border-l border-slate-800 flex flex-col h-full shadow-2xl animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5 bg-[#0f172a]">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Order Audit Details</h3>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">ID: {selectedOrder._id}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable details view */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status Update Form */}
              <form onSubmit={handleUpdateStatus} className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5 space-y-4">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Manage Order Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Status</label>
                    <select
                      value={statusVal}
                      onChange={(e) => setStatusVal(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-[#1f2937] px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {statusOptions.map(opt => (
                        <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tracking Number</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. TRK123456"
                      className="w-full rounded-lg border border-slate-800 bg-[#1f2937] px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-600"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={updating}
                  className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-all"
                >
                  {updating ? "Saving adjustments..." : "Submit Updates"}
                </button>
              </form>

              {/* Order Items */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Purchased Items</h4>
                <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center pt-3 first:pt-0">
                      <div>
                        <p className="text-xs font-bold text-white">{item.sku}</p>
                        <span className="text-[10px] text-slate-500 font-mono">Product ID: {item.product_id}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-300 font-semibold">{item.qty} x ${item.price_at_purchase.toFixed(2)}</p>
                        <span className="text-[10px] font-bold text-indigo-400">${(item.qty * item.price_at_purchase).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shipping Address</h4>
                <div className="flex gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-300">
                  <MapPin className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">{selectedOrder.shipping_address.street}</p>
                    <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}</p>
                    <p>{selectedOrder.shipping_address.zip_code}, {selectedOrder.shipping_address.country}</p>
                  </div>
                </div>
              </div>

              {/* Meta info */}
              <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 bg-slate-900/20 rounded-xl border border-slate-800 p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-500" />
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Payment Status</span>
                    <span className="font-semibold text-white uppercase">{selectedOrder.payment_status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Created At</span>
                    <span className="font-semibold text-white">{new Date(selectedOrder.created_at).toLocaleString()}</span>
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
