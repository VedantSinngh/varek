"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  CheckSquare,
  Terminal,
  LogOut,
  User,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard",   href: "/dashboard",            icon: LayoutDashboard },
  { name: "Orders",      href: "/dashboard/orders",     icon: ShoppingBag },
  { name: "Inventory",   href: "/dashboard/inventory",  icon: Package },
  { name: "Approvals",   href: "/dashboard/approvals",  icon: CheckSquare },
  { name: "Agent Logs",  href: "/dashboard/agents",     icon: Terminal },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("userEmail");
    if (!token) {
      router.replace("/login");
    } else {
      setAuthenticated(true);
      setUserEmail(email || "admin@varek.in");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.replace("/login");
  };

  if (!authenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-adminBg">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-adminGold border-t-transparent" />
      </div>
    );
  }

  const currentPage = menuItems.find((m) => m.href === pathname)?.name || "Console";

  return (
    <div className="flex min-h-screen bg-adminBg text-adminText font-sans">
      {/* ── Sidebar ── */}
      <aside className="w-60 border-r border-adminBorder bg-[#0D0D0D] flex flex-col shrink-0">
        {/* Brand */}
        <div className="flex h-16 items-center px-6 border-b border-adminBorder gap-3">
          <Link href="/dashboard" className="flex items-baseline gap-2">
            <span className="font-mono-brand text-base font-bold tracking-widest text-adminText">
              VAREK
            </span>
            <span className="font-mono-brand text-[10px] font-bold tracking-widest text-adminGold uppercase">
              Admin
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-0.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium transition-all relative ${
                  isActive
                    ? "bg-adminCard text-adminText"
                    : "text-adminMuted hover:bg-adminCard/60 hover:text-adminText"
                }`}
              >
                {/* Gold left-border indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-adminGold rounded-full" />
                )}
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-adminGold" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User panel */}
        <div className="border-t border-adminBorder p-4 space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="h-8 w-8 rounded-full bg-adminCard border border-adminBorder flex items-center justify-center shrink-0">
              <User className="h-3.5 w-3.5 text-adminGold" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-adminText truncate">{userEmail}</p>
              <p className="font-mono-brand text-[9px] uppercase tracking-widest text-adminMuted">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-xs font-medium text-adminMuted hover:text-adminText hover:bg-adminCard/60 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-adminBorder bg-adminBg px-8 shrink-0">
          <h1 className="font-mono-brand text-sm font-bold uppercase tracking-widest text-adminText">
            {currentPage}
          </h1>
          <div className="flex items-center gap-3">
            <span className="font-mono-brand text-[10px] uppercase tracking-widest text-adminMuted">
              {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-adminGold" />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
