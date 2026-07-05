"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);

      const res = await api.post("/auth/login", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const { access_token } = res.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("userEmail", email);

      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.push(redirect);

    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Authentication failed. Please verify credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4 overflow-hidden">
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Thin top gold rule */}
      <div className="absolute top-0 left-0 right-0 h-px bg-[#C9A84C]/30" />

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="mb-10 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#888] mb-4">
            Brand Operations Console
          </p>
          <h1
            className="text-6xl font-bold tracking-widest text-[#F5F5F5]"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            VAREK
          </h1>
          <div className="mx-auto mt-4 h-px w-16 bg-[#C9A84C]/50" />
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[#1A1A1A] bg-[#111111] p-8 shadow-2xl">
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/8 px-4 py-3 text-xs text-red-400 font-mono uppercase tracking-widest">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="email-address"
                className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.15em] text-[#888]"
              >
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F5F5] placeholder-[#444] transition-colors focus:border-[#C9A84C]/60 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/30"
                placeholder="admin@varek.in"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.15em] text-[#888]"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F5F5] placeholder-[#444] transition-colors focus:border-[#C9A84C]/60 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/30"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#C9A84C] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#0A0A0A] transition-all hover:bg-[#D4B86A] disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0A] border-t-transparent" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-widest text-[#333]">
          © {new Date().getFullYear()} Varek — Admin Access Only
        </p>
      </div>
    </div>
  );
}
