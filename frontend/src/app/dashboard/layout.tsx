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
  User
} from "lucide-react";

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
      <div className="flex h-screen w-screen items-center justify-center bg-[#0b0f19]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
    { name: "Inventory", href: "/dashboard/inventory", icon: Package },
    { name: "Approvals", href: "/dashboard/approvals", icon: CheckSquare },
    { name: "Agent Logs", href: "/dashboard/agents", icon: Terminal },
  ];

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#0f172a] flex flex-col">
        <div className="flex h-16 items-center px-6 border-b border-slate-800">
          <Link href="/dashboard" className="text-xl font-bold tracking-wide text-white">
            Varek.in <span className="text-xs text-indigo-400">Admin</span>
          </Link>
        </div>
        
        <nav className="flex-1 space-y-1 px-4 py-6">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile / Logout bottom panel */}
        <div className="border-t border-slate-800 p-4 flex flex-col gap-2 bg-[#090d16]">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-indigo-400">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-300">{userEmail}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full rounded-lg px-2 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col">
        {/* Topbar header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-[#0f172a]/40 px-8 backdrop-blur-md">
          <h1 className="text-lg font-bold text-white uppercase tracking-wider">
            {menuItems.find(m => m.href === pathname)?.name || "Varek Console"}
          </h1>
          <div className="text-xs text-slate-400">
            System time: <span className="font-mono text-slate-300">{new Date().toLocaleDateString()}</span>
          </div>
        </header>

        {/* View Port */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
