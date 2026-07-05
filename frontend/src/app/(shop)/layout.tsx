"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CartProvider, useCart } from "./CartContext";
import { ShoppingCart, User, LogOut, Menu } from "lucide-react";

function ShopHeader() {
  const { cartCount } = useCart();
  const [token, setToken] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0b0f19]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
        {/* Brand */}
        <Link href="/" className="text-xl font-bold tracking-wide text-white hover:text-indigo-400 transition-colors">
          Varek.in
        </Link>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/shop" className="hover:text-white transition-colors">Shop</Link>
        </nav>

        {/* Action icons */}
        <div className="flex items-center gap-6">
          {/* Cart */}
          <Link href="/cart" className="relative p-2 text-slate-300 hover:text-white transition-colors">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-extrabold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Account info */}
          {token ? (
            <div className="flex items-center gap-4">
              <Link href="/account" className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm font-semibold transition-colors">
                <User className="h-4 w-4" />
                Account
              </Link>
              <button 
                onClick={handleLogout} 
                className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/10"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function ShopFooter() {
  return (
    <footer className="border-t border-slate-800 bg-[#0b0f19] py-8 text-center text-xs text-slate-500">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 space-y-2">
        <p>&copy; {new Date().getFullYear()} Varek.in. AI-First Clothing Brand Storefront.</p>
        <p className="text-[10px] text-slate-600 uppercase tracking-widest">Demo checkout mode only</p>
      </div>
    </footer>
  );
}

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-[#0b0f19] text-slate-100">
        <ShopHeader />
        <main className="flex-1">
          {children}
        </main>
        <ShopFooter />
      </div>
    </CartProvider>
  );
}
