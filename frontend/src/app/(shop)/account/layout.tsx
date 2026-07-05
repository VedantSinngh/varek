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
      <div className="flex h-64 items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rust border-t-transparent" />
      </div>
    );
  }

  const tabs = [
    { name: "My Profile", href: "/account", icon: User },
    { name: "Order History", href: "/account/orders", icon: ClipboardList },
  ];

  return (
    <div className="bg-cream min-h-screen">
      {/* Page header */}
      <div className="bg-paper border-b border-line py-12 px-6 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow mb-2">Your account</p>
          <h1 className="font-display text-5xl text-ink font-semibold">Account</h1>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 sm:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Navigation Sidebar */}
          <aside className="space-y-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 font-mono-brand text-[11px] uppercase tracking-widest text-ink/50 hover:text-rust font-bold mb-6 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Store
            </Link>

            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = pathname === tab.href;
                return (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg font-mono-brand text-[11px] uppercase tracking-widest font-bold transition-all ${
                      isActive
                        ? "bg-paper border border-line text-ink"
                        : "text-ink/50 hover:bg-paper hover:text-ink"
                    }`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 ${isActive ? "text-rust" : "text-ink/40"}`}
                    />
                    {tab.name}
                  </Link>
                );
              })}
            </div>
          </aside>

          {/* Content Pane */}
          <div className="md:col-span-3 rounded-xl border border-line bg-paper p-6 sm:p-8 min-h-[400px] stitched">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
