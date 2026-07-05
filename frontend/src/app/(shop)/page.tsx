"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { ArrowRight } from "lucide-react";

/* ─── Collections ─── */
const collections = [
  {
    name: "Denim Archive",
    desc: "Raw selvedge, acid-washed, stonewashed — every decade of denim.",
    img: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80",
    href: "/shop?category=denim",
  },
  {
    name: "Varsity & Jackets",
    desc: "Wool-body varsities, nylon coaches. Authentic college & sports heritage.",
    img: "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&q=80",
    href: "/shop?category=outerwear",
  },
  {
    name: "Band Tee Vault",
    desc: "Original merch from tours you wish you'd been at. No reprints.",
    img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80",
    href: "/shop?category=tees",
  },
];

export default function ShopHome() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/products?limit=4")
      .then((r) => setProducts(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#FAF9F6] text-[#1A1A1A] min-h-screen pb-24 font-sans">
      {/* ══════════════════════════════════════
          1. HERO HERO (Minimalist Editorial Banner)
          ══════════════════════════════════════ */}
      <section className="relative w-full h-[85vh] bg-[#EAE8E4] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 ease-out scale-100 hover:scale-105"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80')",
          }}
        />
        {/* Soft elegant overlay to ensure text readability */}
        <div className="absolute inset-0 bg-black/10" />

        <div className="relative z-10 text-center px-4 max-w-3xl">
          <span className="text-[10px] tracking-[0.3em] uppercase text-white font-semibold mb-3 block">
            VINTAGE ORIGINALS
          </span>
          <h1 className="text-white text-4xl sm:text-5xl md:text-7xl font-light tracking-tight mb-8 uppercase">
            One of a kind.<br />
            <span className="font-serif italic font-normal">Zero fast fashion.</span>
          </h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/shop"
              className="w-full sm:w-auto bg-white text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors duration-300 px-8 py-3.5 text-xs uppercase tracking-widest font-semibold"
            >
              Shop New Arrivals
            </Link>
            <Link
              href="/shop"
              className="w-full sm:w-auto border border-white text-white hover:bg-white hover:text-[#1A1A1A] transition-colors duration-300 px-8 py-3.5 text-xs uppercase tracking-widest font-semibold"
            >
              Explore Collections
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          2. EDITORIAL STATEMENT
          ══════════════════════════════════════ */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-[11px] tracking-[0.25em] uppercase text-[#767676] mb-6 font-semibold">
          THE VAREK PHILOSOPHY
        </h2>
        <p className="font-serif text-xl sm:text-2xl md:text-3xl leading-relaxed font-light text-[#222222] italic">
          "Every garment has a history. We source, restore, and preserve authentic vintage pieces to offer sustainable, premium clothing designed to stand the test of time."
        </p>
      </section>

      {/* ══════════════════════════════════════
          3. CATEGORIES / COLLECTIONS (Borderless Grid)
          ══════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 mb-24">
        <div className="flex items-center justify-between border-b border-[#EAEAE8] pb-4 mb-8">
          <h3 className="text-xs tracking-[0.2em] uppercase font-bold text-[#1A1A1A]">
            SHOP BY COLLECTION
          </h3>
          <Link
            href="/shop"
            className="text-[11px] tracking-wider uppercase text-[#767676] hover:text-[#1A1A1A] transition-colors font-semibold flex items-center gap-1"
          >
            Browse All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {collections.map((col, idx) => (
            <Link key={col.name} href={col.href} className="group block">
              <div className="aspect-[3/4] w-full overflow-hidden bg-[#EAE8E4] mb-4">
                <img
                  src={col.img}
                  alt={col.name}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold tracking-wider text-[#1A1A1A] uppercase group-hover:underline">
                  {col.name}
                </h4>
                <span className="text-xs text-[#767676] font-mono">0{idx + 1}</span>
              </div>
              <p className="text-xs text-[#767676] mt-1 leading-relaxed max-w-sm">
                {col.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          4. NEW ARRIVALS / FEATURED PRODUCTS (Sleek Product Grid)
          ══════════════════════════════════════ */}
      {!loading && products.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex items-center justify-between border-b border-[#EAEAE8] pb-4 mb-8">
            <h3 className="text-xs tracking-[0.2em] uppercase font-bold text-[#1A1A1A]">
              THE LATEST DROP
            </h3>
            <Link
              href="/shop"
              className="text-[11px] tracking-wider uppercase text-[#767676] hover:text-[#1A1A1A] transition-colors font-semibold flex items-center gap-1"
            >
              Shop All Drop <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid gap-x-6 gap-y-10 grid-cols-2 lg:grid-cols-4">
            {products.map((prod) => (
              <Link
                key={prod._id}
                href={`/products/${prod._id}`}
                className="group block"
              >
                <div className="aspect-[3/4] w-full overflow-hidden bg-[#EAE8E4] mb-4">
                  {prod.images?.[0] ? (
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[#767676]">
                      <span className="text-[10px] tracking-widest uppercase">No Image</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] tracking-widest uppercase text-[#767676]">
                    {prod.category}
                  </p>
                  <h4 className="text-xs font-semibold text-[#1A1A1A] group-hover:underline truncate">
                    {prod.name}
                  </h4>
                  <p className="text-xs font-medium text-[#222222]">
                    ₹{prod.price.toFixed(0)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
