"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  Star, ArrowRight, CheckCircle, Truck, Leaf, Shield,
  Search, Scissors, Sparkles, Package
} from "lucide-react";

/* ─── Scroll-reveal hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add("animate-fade-up"); },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ─── Press logos (text-based placeholders) ─── */
const pressLogos = [
  "Vogue India", "Grazia", "Elle", "Harper's Bazaar", "GQ India",
  "Hypebeast", "Highsnobiety", "Condé Nast", "Time Out", "Mint Lounge",
  "Vogue India", "Grazia", "Elle", "Harper's Bazaar", "GQ India",
  "Hypebeast", "Highsnobiety", "Condé Nast", "Time Out", "Mint Lounge",
];

/* ─── Collections ─── */
const collections = [
  {
    name: "Denim Archive",
    desc: "Raw selvedge, acid-washed, stonewashed — every decade of denim.",
    chips: ["120+ pieces", "70s–90s"],
    img: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80",
  },
  {
    name: "Varsity & Coach Jackets",
    desc: "Wool-body varsities, nylon coaches. Authentic college & sports heritage.",
    chips: ["60+ pieces", "80s–90s"],
    img: "https://images.unsplash.com/photo-1544441893-675973e31985?w=600&q=80",
  },
  {
    name: "Band Tee Vault",
    desc: "Original merch from tours you wish you'd been at. No reprints.",
    chips: ["200+ pieces", "Genuine tour merch"],
    img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80",
  },
];

/* ─── Steps ─── */
const steps = [
  { n: "01", icon: Search, title: "Scout", body: "We source from estate sales, mills, and private collections across India and abroad." },
  { n: "02", icon: Shield, title: "Inspect", body: "Every piece checked for authenticity, era, fabric integrity, and true vintage condition." },
  { n: "03", icon: Scissors, title: "Restore", body: "Hand-washed, mended, and re-finished — vintage quality, ready to wear today." },
  { n: "04", icon: Package, title: "Ship", body: "Packed with care in recycled kraft paper and out the door within 48 hours." },
];

/* ─── Reviews ─── */
const reviews = [
  {
    name: "Riya M.", item: "80s Levi's 501",
    quote: "Arrived perfectly pressed. The indigo fade is absolutely authentic — I've been hunting this exact wash for two years.",
  },
  {
    name: "Karan S.", item: "Vintage Varsity Jacket",
    quote: "Condition was exactly as described, maybe even better. The wool smells fresh and the snap buttons are all original.",
  },
  {
    name: "Ananya P.", item: "Nirvana Nevermind Tour Tee",
    quote: "Bought this nervously — first real vintage piece. The process was seamless and the tee is genuinely 1992. Blown away.",
  },
];

/* ─── Benefits ─── */
const benefits = [
  { icon: Shield, title: "Authenticity Guaranteed", body: "Every item verified for era and origin. If it's not genuinely vintage, it doesn't ship." },
  { icon: Sparkles, title: "Hand-Picked, Not Mass-Sourced", body: "No bulk bins. Every piece is individually selected by our team in the field." },
  { icon: Leaf, title: "Sustainable by Default", body: "Buying secondhand is the most sustainable fashion choice. We just make it easier." },
  { icon: Truck, title: "Fast, Careful Shipping", body: "Packed in recycled kraft, dispatched in 48 hours. Tracked from us to you." },
];

export default function ShopHome() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const storyRef = useReveal();
  const collectionsRef = useReveal();
  const benefitsRef = useReveal();

  useEffect(() => {
    api.get("/products?limit=4")
      .then((r) => setProducts(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-cream">

      {/* ══════════════════════════════════════
          §2  HERO
          ══════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden grain-overlay">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80')",
          }}
        />
        {/* Warm overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-brownDark/85 via-brownDark/60 to-brownDark/30" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 py-24">
          {/* Badge pills */}
          <div className="flex flex-wrap gap-3 mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cream/10 border border-cream/25 px-4 py-1.5 font-mono-brand text-[11px] uppercase tracking-widest text-cream font-bold">
              <Star className="h-3 w-3 fill-mustard text-mustard" />
              ★ 4.8 — 2,300+ reviews
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cream/10 border border-cream/25 px-4 py-1.5 font-mono-brand text-[11px] uppercase tracking-widest text-cream font-bold">
              15,000+ pieces resold
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-8xl font-semibold text-cream leading-tight max-w-3xl mb-6">
            One-of-one finds.<br />
            <span className="text-mustard italic">Zero fast fashion.</span>
          </h1>

          <p className="text-cream/70 text-lg max-w-xl mb-10 leading-relaxed">
            Hand-picked vintage clothing, restored and ready to wear. Sourced from estate sales,
            private collections, and forgotten warehouses — shipped to your door in 48 hours.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/shop" className="btn-primary text-sm px-8 py-4">
              Shop New Arrivals <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/#story" className="btn-ghost border-cream/50 text-cream hover:bg-cream hover:text-ink text-sm px-8 py-4">
              Read Our Story
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          §3  PRESS MARQUEE
          ══════════════════════════════════════ */}
      <section className="bg-paper border-y border-line py-5 overflow-hidden">
        <p className="font-mono-brand text-[10px] uppercase tracking-widest text-ink/40 text-center mb-4 font-bold">As worn &amp; featured in:</p>
        <div className="relative flex overflow-hidden">
          <div className="flex gap-12 animate-marquee whitespace-nowrap">
            {pressLogos.map((logo, i) => (
              <span
                key={i}
                className="font-display text-xl font-semibold text-ink/20 hover:text-rust transition-colors shrink-0 cursor-default"
              >
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          §4  STORY
          ══════════════════════════════════════ */}
      <section id="story" className="bg-cream py-24 px-6 sm:px-8">
        <div
          ref={storyRef}
          className="mx-auto max-w-5xl opacity-0"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <div>
              <p className="font-handwritten text-7xl text-rust mb-6 leading-none">
                Hey there.
              </p>
              <p className="text-ink/80 text-lg leading-relaxed mb-5">
                Varek started the way most good things do — out of frustration. We were tired of sifting through
                synthetic fibres and mass-produced nostalgia that looked vintage but felt like polyester. So we
                went looking for the real thing.
              </p>
              <p className="text-ink/80 text-lg leading-relaxed mb-8">
                Every piece we carry has been physically touched, inspected, and approved by someone who cares
                about fabric, fit, and the story behind a garment. That's not a marketing line — it's just how
                we source.
              </p>
              <div className="inline-flex items-center gap-3 rounded-lg bg-paper border border-line px-5 py-3">
                <CheckCircle className="h-4 w-4 text-olive shrink-0" />
                <span className="font-mono-brand text-[11px] uppercase tracking-widest text-ink/70 font-bold">
                  Every piece hand-steamed, inspected & re-tagged before it ships
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-lg overflow-hidden stitched">
                <img
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80"
                  alt="Vintage clothing rack"
                  className="h-full w-full object-cover"
                />
              </div>
              {/* Signature */}
              <p className="font-handwritten text-4xl text-rust absolute -bottom-4 right-4">
                — Varek Team
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          §5  COLLECTIONS  (dark theme)
          ══════════════════════════════════════ */}
      <section className="bg-brownDark py-24 px-6 sm:px-8">
        <div
          ref={collectionsRef}
          className="mx-auto max-w-7xl opacity-0"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="eyebrow text-mustard mb-3">Curated for you</p>
              <h2 className="font-display text-5xl sm:text-6xl text-cream font-semibold leading-tight">
                Our Collections
              </h2>
            </div>
            <Link href="/shop" className="btn-ghost border-cream/30 text-cream hover:bg-cream hover:text-ink shrink-0">
              Browse All Collections <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Cards — horizontal scroll on mobile */}
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
            {collections.map((col) => (
              <div
                key={col.name}
                className="snap-start shrink-0 w-80 sm:w-auto sm:flex-1 rounded-xl overflow-hidden border border-cream/10 bg-[#2E2218] group"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={col.img}
                    alt={col.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-2xl text-cream font-semibold mb-2">{col.name}</h3>
                  <p className="text-cream/50 text-sm leading-relaxed mb-4">{col.desc}</p>
                  <div className="flex gap-2 mb-5">
                    {col.chips.map((c) => (
                      <span key={c} className="inline-flex items-center px-3 py-1 rounded-full bg-mustard/15 border border-mustard/30 font-mono-brand text-[10px] uppercase tracking-widest text-mustard font-bold">
                        {c}
                      </span>
                    ))}
                  </div>
                  <Link href="/shop" className="font-mono-brand text-[11px] uppercase tracking-widest text-mustard hover:text-cream transition-colors font-bold flex items-center gap-1.5">
                    Shop this collection <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          §6  HOW IT WORKS  (rust theme)
          ══════════════════════════════════════ */}
      <section className="bg-rust py-24 px-6 sm:px-8 grain-overlay relative">
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="eyebrow text-cream/60 mb-3">The process</p>
            <h2 className="font-display text-5xl sm:text-6xl text-cream font-semibold">
              How We Curate
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.n}
                  className="relative p-8 rounded-xl bg-cream/10 border border-cream/20 group hover:bg-cream/15 transition-colors"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <p className="font-display text-6xl font-semibold text-cream/20 mb-4 leading-none">
                    {step.n}
                  </p>
                  <Icon className="h-6 w-6 text-cream/70 mb-4" />
                  <h3 className="font-display text-2xl text-cream font-semibold mb-3">{step.title}</h3>
                  <p className="text-cream/70 text-sm leading-relaxed">{step.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          §7  AWARDS RIBBON
          ══════════════════════════════════════ */}
      <section className="bg-paper border-y border-line py-8 px-6 sm:px-8 overflow-hidden">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-center gap-6">
          {[
            "★ 4.8 Google Rating",
            "Best Vintage Reseller 2025",
            "#1 Sustainable Fashion Pick",
            "15,000+ Happy Customers",
            "48hr Dispatch Guarantee",
          ].map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center px-6 py-2 border-2 border-ink/20 rounded font-mono-brand text-[11px] uppercase tracking-widest text-ink/70 font-bold bg-cream hover:border-rust/50 hover:text-rust transition-colors"
              style={{ transform: `rotate(${Math.random() * 2 - 1}deg)` }}
            >
              {badge}
            </span>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          §8  REVIEWS
          ══════════════════════════════════════ */}
      <section className="bg-cream py-24 px-6 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-mustard text-mustard" />
              ))}
            </div>
            <h2 className="font-display text-5xl sm:text-6xl text-ink font-semibold">
              Loved by thrifters everywhere
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {reviews.map((r) => (
              <div
                key={r.name}
                className="rounded-xl bg-paper border border-line p-8 stitched group hover:border-rust/30 transition-colors"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-mustard text-mustard" />
                  ))}
                </div>
                <p className="text-ink/80 text-base leading-relaxed mb-6 italic">"{r.quote}"</p>
                <div>
                  <p className="font-mono-brand text-[11px] uppercase tracking-widest text-ink font-bold">{r.name}</p>
                  <p className="font-mono-brand text-[10px] uppercase tracking-widest text-rust/70">{r.item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          §9  BENEFITS GRID
          ══════════════════════════════════════ */}
      <section className="bg-paper py-24 px-6 sm:px-8 border-t border-line">
        <div
          ref={benefitsRef}
          className="mx-auto max-w-7xl opacity-0"
        >
          <div className="text-center mb-16">
            <p className="eyebrow mb-3">Why us</p>
            <h2 className="font-display text-5xl sm:text-6xl text-ink font-semibold">
              Why Varek
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="rounded-xl bg-cream border border-line p-8 group hover:border-rust/30 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-rust/10 flex items-center justify-center mb-5 group-hover:bg-rust/15 transition-colors">
                    <Icon className="h-5 w-5 text-rust" />
                  </div>
                  <h3 className="font-display text-xl text-ink font-semibold mb-2">{b.title}</h3>
                  <p className="text-ink/60 text-sm leading-relaxed">{b.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          §10  CATEGORY SHOWCASE
          ══════════════════════════════════════ */}
      <section className="bg-cream py-24 px-6 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              {
                label: "Menswear",
                desc: "Denim, tees, jackets, trousers — every decade represented.",
                img: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=800&q=80",
              },
              {
                label: "Womenswear",
                desc: "Blouses, skirts, coats, and knitwear with genuine character.",
                img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
              },
            ].map((cat) => (
              <div key={cat.label} className="relative rounded-xl overflow-hidden group aspect-[3/4] sm:aspect-auto sm:h-[520px]">
                <img
                  src={cat.img}
                  alt={cat.label}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brownDark/80 via-brownDark/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h3 className="font-display text-4xl text-cream font-semibold mb-2">{cat.label}</h3>
                  <p className="text-cream/70 text-sm mb-6">{cat.desc}</p>
                  <div className="flex gap-3">
                    <Link href="/shop" className="btn-primary text-xs px-5 py-2.5">
                      Shop {cat.label} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link href="/#story" className="btn-ghost border-cream/40 text-cream hover:bg-cream hover:text-ink text-xs px-5 py-2.5">
                      Learn More
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          §11  CAREERS CTA
          ══════════════════════════════════════ */}
      <section className="bg-olive py-20 px-6 sm:px-8 grain-overlay relative">
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="eyebrow text-cream/60 mb-4">Join the team</p>
          <h2 className="font-display text-5xl sm:text-6xl text-cream font-semibold mb-6">
            Want the best side hustle in vintage?
          </h2>
          <p className="text-cream/70 text-lg mb-10">
            We're always looking for people who love old things. Sourcing scouts, stylists, packers — if you care about vintage, we want to talk.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="#" className="btn-primary bg-cream text-ink hover:bg-paper">
              See Open Roles <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="font-mono-brand text-[11px] uppercase tracking-widest text-cream/50 font-bold">
              40+ team members across India
            </span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          Featured Products (optional live section)
          ══════════════════════════════════════ */}
      {!loading && products.length > 0 && (
        <section className="bg-cream py-24 px-6 sm:px-8 border-t border-line">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="eyebrow mb-3">Just dropped</p>
                <h2 className="font-display text-5xl text-ink font-semibold">New Arrivals</h2>
              </div>
              <Link href="/shop" className="btn-ghost hidden sm:inline-flex">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((prod) => (
                <Link
                  key={prod._id}
                  href={`/products/${prod._id}`}
                  className="group rounded-xl border border-line bg-paper overflow-hidden hover:border-rust/40 transition-colors stitched"
                >
                  <div className="aspect-square overflow-hidden">
                    {prod.images?.[0] ? (
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-paper">
                        <span className="font-mono-brand text-[10px] text-ink/30 uppercase tracking-widest">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <span className="font-mono-brand text-[10px] uppercase tracking-widest text-rust font-bold">{prod.category}</span>
                    <h3 className="font-display text-lg text-ink font-semibold mt-1 mb-3 truncate">{prod.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="font-mono-brand text-sm font-bold text-ink">₹{prod.price.toFixed(0)}</span>
                      <span className="chip">View</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
