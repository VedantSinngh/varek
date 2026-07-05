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
  ArrowRight,
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
          api.get("/tasks?status=awaiting_approval"),
        ]);

        const orders = ordersRes.data;
        const products = productsRes.data;
        const approvals = approvalsRes.data;

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
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-adminGold border-t-transparent" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      desc: "Actions requiring human-in-the-loop validation",
      icon: ClipboardList,
      iconColor: "text-adminGold",
      iconBg: "bg-adminGold/10 border border-adminGold/20",
      link: "/dashboard/approvals",
      prominent: true,
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      desc: "Historical customer checkout logs",
      icon: ShoppingBag,
      iconColor: "text-adminMuted",
      iconBg: "bg-adminBorder/60 border border-adminBorder",
      link: "/dashboard/orders",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockCount,
      desc: "Items with inventory levels below 10 units",
      icon: AlertTriangle,
      iconColor: "text-red-400",
      iconBg: "bg-red-500/10 border border-red-500/20",
      link: "/dashboard/inventory",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Prominent Action Callout */}
      {stats.pendingApprovals > 0 && (
        <div className="rounded-xl border border-adminGold/25 bg-adminGold/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-adminGold flex items-center gap-2">
              <Clock className="h-4 w-4 animate-pulse" />
              Action Required: {stats.pendingApprovals} Pending Agent Request
              {stats.pendingApprovals > 1 ? "s" : ""}
            </h3>
            <p className="text-xs text-adminMuted mt-1 max-w-md">
              AI agents have proposed restocks or customer compensation claims that
              require administrator approval before execution.
            </p>
          </div>
          <Link
            href="/dashboard/approvals"
            className="btn-admin whitespace-nowrap shrink-0"
          >
            Review Approvals
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`rounded-xl border p-6 flex flex-col justify-between transition-colors hover:border-adminGold/20 ${
                card.prominent
                  ? "border-adminGold/20 bg-adminCard"
                  : "border-adminBorder bg-adminCard"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono-brand text-[10px] uppercase tracking-widest text-adminMuted font-bold">
                  {card.title}
                </span>
                <div className={`rounded-lg p-2 ${card.iconBg}`}>
                  <Icon className={`h-4 w-4 ${card.iconColor}`} />
                </div>
              </div>
              <div className="mt-5">
                <span className="text-4xl font-bold text-adminText">{card.value}</span>
                <p className="text-[11px] text-adminMuted mt-1.5 leading-relaxed">
                  {card.desc}
                </p>
              </div>
              <div className="mt-5 border-t border-adminBorder pt-4">
                <Link
                  href={card.link}
                  className="font-mono-brand text-[11px] uppercase tracking-widest text-adminGold hover:text-adminText font-bold flex items-center gap-1.5 transition-colors"
                >
                  View details <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Status Breakdown */}
      <div className="rounded-xl border border-adminBorder bg-adminCard p-6">
        <h3 className="font-mono-brand text-[10px] uppercase tracking-widest text-adminMuted font-bold mb-6">
          Order Status Breakdown
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-4 rounded-lg bg-adminBg border border-adminBorder p-4">
            <div className="rounded-full bg-adminBorder p-3 text-adminGold">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <span className="font-mono-brand text-[10px] uppercase tracking-widest text-adminMuted block font-bold">
                Pending
              </span>
              <span className="text-2xl font-bold text-adminText">
                {stats.pendingOrders}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg bg-adminBg border border-adminBorder p-4">
            <div className="rounded-full bg-adminBorder p-3 text-adminMuted">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <span className="font-mono-brand text-[10px] uppercase tracking-widest text-adminMuted block font-bold">
                Shipped
              </span>
              <span className="text-2xl font-bold text-adminText">
                {stats.shippedOrders}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg bg-adminBg border border-adminBorder p-4">
            <div className="rounded-full bg-adminBorder p-3 text-emerald-500">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div>
              <span className="font-mono-brand text-[10px] uppercase tracking-widest text-adminMuted block font-bold">
                Delivered
              </span>
              <span className="text-2xl font-bold text-adminText">
                {stats.deliveredOrders}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
