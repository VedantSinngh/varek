"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/register", { name, email, password, role: "customer" });
      router.push("/login");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Email may already be registered.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-16">
      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-30"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E\")" }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="text-center mb-10">
          <Link href="/" className="font-display text-5xl text-ink font-semibold hover:text-rust transition-colors">
            Varek
          </Link>
          <p className="font-mono-brand text-[11px] uppercase tracking-widest text-ink/50 mt-3 font-bold">
            Create your account
          </p>
        </div>

        {/* Card */}
        <div className="bg-paper rounded-2xl border border-line p-8 stitched">
          {error && (
            <div className="mb-6 rounded-lg border border-rust/20 bg-rust/8 p-4 font-mono-brand text-[11px] uppercase tracking-widest text-rust font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="font-mono-brand text-[10px] uppercase tracking-widest text-ink/50 font-bold block mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-lg border border-line bg-cream px-4 py-3 text-sm text-ink placeholder-ink/30 focus:outline-none focus:ring-2 focus:ring-rust/20 focus:border-rust/50 transition-colors"
              />
            </div>
            <div>
              <label className="font-mono-brand text-[10px] uppercase tracking-widest text-ink/50 font-bold block mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-lg border border-line bg-cream px-4 py-3 text-sm text-ink placeholder-ink/30 focus:outline-none focus:ring-2 focus:ring-rust/20 focus:border-rust/50 transition-colors"
              />
            </div>
            <div>
              <label className="font-mono-brand text-[10px] uppercase tracking-widest text-ink/50 font-bold block mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-line bg-cream px-4 py-3 text-sm text-ink placeholder-ink/30 focus:outline-none focus:ring-2 focus:ring-rust/20 focus:border-rust/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-2 py-4 disabled:opacity-60"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-cream border-t-transparent" />
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="font-mono-brand text-[11px] uppercase tracking-widest text-ink/40">Already have an account? </span>
            <Link href="/login" className="font-mono-brand text-[11px] uppercase tracking-widest text-rust font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>

        <p className="text-center font-mono-brand text-[10px] uppercase tracking-widest text-ink/30 mt-8">
          © {new Date().getFullYear()} Varek — Curated Vintage
        </p>
      </div>
    </div>
  );
}
