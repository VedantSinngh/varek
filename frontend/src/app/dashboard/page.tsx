"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { 
  ShoppingBag, 
  AlertTriangle, 
  ClipboardList, 
  CheckCircle,
  Clock,
  ArrowRight
} from "lucide-react";

export default function DashboardHome() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    lowStockCount: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [ordersRes, productsRes, approvalsRes] = await Promise.all([
          api.get("/orders"),
          api.get("/products/admin"),
          api.get("/tasks?status=awaiting_approval")
        ]);

        const orders = ordersRes.data;
        const products = productsRes.data;
        const approvals = approvalsRes.data;

        // Calculate counts
        const pending = orders.filter((o: any) => o.status === "pending").length;
        const shipped = orders.filter((o: any) => o.status === "shipped").length;
        const delivered = orders.filter((o: any) => o.status === "delivered").length;
        const lowStock = products.filter((p: any) => p.stock_quantity < 10).length;

        setStats({
          totalOrders: orders.length,
          pendingOrders: pending,
          shippedOrders: shipped,
          deliveredOrders: delivered,
          lowStockCount: lowStock,
          pendingApprovals: approvals.length,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      desc: "Actions requiring human-in-the-loop validation",
      icon: ClipboardList,
      color: "border-amber-500/20 bg-amber-500/10 text-amber-400",
      link: "/dashboard/approvals",
      prominent: true,
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      desc: "Historical customer checkout logs",
      icon: ShoppingBag,
      color: "border-indigo-500/20 bg-indigo-500/10 text-indigo-400",
      link: "/dashboard/orders",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockCount,
      desc: "Items with inventory levels below 10 units",
      icon: AlertTriangle,
      color: "border-red-500/20 bg-red-500/10 text-red-400",
      link: "/dashboard/inventory",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Prominent Action Callout */}
      {stats.pendingApprovals > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <Clock className="h-5 w-5 animate-pulse" />
              Action Required: {stats.pendingApprovals} Pending Agent Request(s)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              AI agents have proposed restocks or customer compensation claims that require administrator approval before execution.
            </p>
          </div>
          <Link
            href="/dashboard/approvals"
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-[#0b0f19] hover:bg-amber-400 transition-all whitespace-nowrap"
          >
            Review Approvals
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Stats Cards Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.title} 
              className={`rounded-xl border p-6 flex flex-col justify-between ${
                card.prominent ? "ring-2 ring-amber-500/20 bg-[#1e293b]" : "bg-[#111827] border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{card.title}</span>
                <div className={`rounded-lg p-2 ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-4xl font-extrabold text-white">{card.value}</span>
                <p className="text-xs text-slate-500 mt-1">{card.desc}</p>
              </div>
              <div className="mt-6 border-t border-slate-800/80 pt-4">
                <Link 
                  href={card.link} 
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-all"
                >
                  View details <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Status Breakdown */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] p-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Order Status Breakdown</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-4 rounded-lg bg-slate-800/40 p-4">
            <div className="rounded-full bg-slate-800 p-3 text-amber-500">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Pending Checkout</span>
              <span className="text-xl font-bold text-white">{stats.pendingOrders}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg bg-slate-800/40 p-4">
            <div className="rounded-full bg-slate-800 p-3 text-indigo-500">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Shipped / In Transit</span>
              <span className="text-xl font-bold text-white">{stats.shippedOrders}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg bg-slate-800/40 p-4">
            <div className="rounded-full bg-slate-800 p-3 text-emerald-500">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Delivered / Completed</span>
              <span className="text-xl font-bold text-white">{stats.deliveredOrders}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
