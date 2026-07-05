"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { User, ClipboardList, ArrowLeft } from "lucide-react";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login?redirect=" + pathname);
    } else {
      setAuthenticated(true);
    }
  }, [router, pathname]);

  if (!authenticated) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  const tabs = [
    { name: "My Profile", href: "/account", icon: User },
    { name: "Order History", href: "/account/orders", icon: ClipboardList },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="grid gap-8 md:grid-cols-4">
        {/* Navigation Sidebar */}
        <aside className="space-y-2">
          <Link href="/shop" className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to Store
          </Link>
          
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-800/30 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 text-indigo-400" />
                  {tab.name}
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Content Pane */}
        <div className="md:col-span-3 rounded-xl border border-slate-800 bg-[#111827] p-6 sm:p-8 min-h-[400px]">
          {children}
        </div>
      </div>
    </div>
  );
}
