"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CartProvider, useCart } from "./CartContext";
import { ShoppingBag, User, LogOut, X, Menu, ArrowRight } from "lucide-react";

function ShopHeader() {
  const { cartCount } = useCart();
  const [token, setToken] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    router.push("/");
    setDrawerOpen(false);
  };

  const navLinks = [
    { label: "Shop", href: "/shop" },
    { label: "Collections", href: "/shop" },
    { label: "Our Story", href: "/#story" },
    { label: "Journal", href: "/#story" },
    { label: "Contact", href: "/#footer" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#EDE2C9]/95 backdrop-blur-md shadow-sm border-b border-[#C9BB9C]/60"
            : "bg-[#F4ECDA]/90 backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="font-display text-2xl font-semibold text-ink tracking-tight hover:text-rust transition-colors"
          >
            Varek
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-mono-brand text-[11px] uppercase tracking-widest text-ink/70 hover:text-ink transition-colors font-bold"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <Link href="/cart" className="relative p-2 text-ink/70 hover:text-ink transition-colors">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rust text-[9px] font-extrabold text-cream">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Account */}
            {token ? (
              <div className="hidden lg:flex items-center gap-4">
                <Link
                  href="/account"
                  className="flex items-center gap-1.5 font-mono-brand text-[11px] uppercase tracking-widest text-ink/70 hover:text-ink font-bold transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  Account
                </Link>
                <button
                  onClick={handleLogout}
                  className="font-mono-brand text-[11px] uppercase tracking-widest text-rust/80 hover:text-rust font-bold transition-colors flex items-center gap-1"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden lg:flex items-center gap-1.5 font-mono-brand text-[11px] uppercase tracking-widest text-ink/70 hover:text-ink font-bold transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                Sign In
              </Link>
            )}

            {/* Shop the Drop CTA */}
            <Link
              href="/shop"
              className="hidden lg:inline-flex btn-primary"
            >
              Shop the Drop
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 text-ink/70 hover:text-ink transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />

        {/* Drawer panel */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-full max-w-sm bg-brownDark flex flex-col transition-transform duration-300 ${
            drawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-cream/10">
            <span className="font-display text-2xl text-cream font-semibold">Varek</span>
            <button
              onClick={() => setDrawerOpen(false)}
              className="text-cream/60 hover:text-cream transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Links */}
          <nav className="flex-1 flex flex-col gap-1 px-6 py-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setDrawerOpen(false)}
                className="font-display text-3xl font-medium text-cream/80 hover:text-cream hover:pl-2 transition-all py-2 border-b border-cream/10"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Drawer bottom */}
          <div className="px-6 py-8 space-y-4">
            <Link
              href="/shop"
              onClick={() => setDrawerOpen(false)}
              className="btn-primary w-full justify-center"
            >
              Shop the Drop <ArrowRight className="h-4 w-4" />
            </Link>
            {token ? (
              <div className="flex gap-4">
                <Link
                  href="/account"
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 text-center font-mono-brand text-[11px] uppercase tracking-widest text-cream/60 hover:text-cream transition-colors py-2"
                >
                  Account
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex-1 text-center font-mono-brand text-[11px] uppercase tracking-widest text-rust/80 hover:text-rust transition-colors py-2"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setDrawerOpen(false)}
                className="block text-center font-mono-brand text-[11px] uppercase tracking-widest text-cream/60 hover:text-cream transition-colors py-2"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Header spacer */}
      <div className="h-16" />
    </>
  );
}

function ShopFooter() {
  return (
    <footer id="footer" className="bg-brownDark text-cream/70">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 border-b border-cream/10 pb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="font-display text-3xl text-cream font-semibold block mb-4">
              Varek
            </Link>
            <p className="text-sm leading-relaxed text-cream/50 max-w-xs">
              Hand-picked vintage & retro clothing. Every piece sourced, inspected, restored, and shipped with care.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-mono-brand text-[10px] uppercase tracking-widest text-cream/40 mb-4 font-bold">Shop</h4>
            <ul className="space-y-2 text-sm">
              {["Menswear", "Womenswear", "New Arrivals", "Denim Archive", "Band Tee Vault"].map((l) => (
                <li key={l}>
                  <Link href="/shop" className="text-cream/60 hover:text-cream transition-colors">{l}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-mono-brand text-[10px] uppercase tracking-widest text-cream/40 mb-4 font-bold">Company</h4>
            <ul className="space-y-2 text-sm">
              {["Our Story", "Careers", "Journal", "Sustainability"].map((l) => (
                <li key={l}>
                  <Link href="/#story" className="text-cream/60 hover:text-cream transition-colors">{l}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-mono-brand text-[10px] uppercase tracking-widest text-cream/40 mb-4 font-bold">Support</h4>
            <ul className="space-y-2 text-sm">
              {["Contact Us", "Shipping Info", "Returns & Exchanges", "Size Guide"].map((l) => (
                <li key={l}>
                  <Link href="#" className="text-cream/60 hover:text-cream transition-colors">{l}</Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-1 text-xs text-cream/40">
              <p>hello@varek.in</p>
              <p>Mumbai, India</p>
            </div>
          </div>
        </div>

        {/* Legal row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono-brand text-[10px] uppercase tracking-widest text-cream/30">
            © {new Date().getFullYear()} Varek. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Terms", "Privacy", "Cookies"].map((l) => (
              <Link key={l} href="#" className="font-mono-brand text-[10px] uppercase tracking-widest text-cream/30 hover:text-cream/60 transition-colors">
                {l}
              </Link>
            ))}
          </div>
        </div>
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
      <div className="flex min-h-screen flex-col bg-cream text-ink">
        <ShopHeader />
        <main className="flex-1">
          {children}
        </main>
        <ShopFooter />
      </div>
    </CartProvider>
  );
}
