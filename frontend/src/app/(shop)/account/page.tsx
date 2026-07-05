"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { User, Mail, ShieldAlert, Check } from "lucide-react";

export default function AccountProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [updating, setUpdating] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await api.get("/auth/me");
        setProfile(res.data);
        setName(res.data.name || "");
      } catch (err) {
        console.error("Failed to load user profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadMe();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setUpdating(true);
    try {
      const res = await api.put(`/users/${profile.id || profile._id}`, {
        name: name,
      });
      setProfile(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
      alert("Failed to update profile details.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-rust border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center space-y-4 py-12">
        <ShieldAlert className="h-8 w-8 text-rust mx-auto" />
        <p className="font-mono-brand text-[11px] uppercase tracking-widest text-ink/50 font-bold">
          Failed to load profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-line pb-4">
        <h2 className="font-display text-2xl text-ink font-semibold">My Profile</h2>
        <p className="font-mono-brand text-[10px] uppercase tracking-widest text-ink/40 mt-1 font-bold">
          Manage your account details
        </p>
      </div>

      <form onSubmit={handleUpdate} className="space-y-5 max-w-md">
        {/* Email Address */}
        <div>
          <label className="font-mono-brand text-[10px] uppercase tracking-widest text-ink/50 font-bold block mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink/30">
              <Mail className="h-4 w-4" />
            </span>
            <input
              type="email"
              disabled
              value={profile.email}
              className="w-full rounded-lg border border-line bg-cream/60 py-3 pl-10 pr-4 text-sm text-ink/50 cursor-not-allowed focus:outline-none"
            />
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="font-mono-brand text-[10px] uppercase tracking-widest text-ink/50 font-bold block mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink/30">
              <User className="h-4 w-4" />
            </span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-lg border border-line bg-cream py-3 pl-10 pr-4 text-sm text-ink placeholder-ink/30 focus:outline-none focus:ring-2 focus:ring-rust/20 focus:border-rust/50 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={updating}
          className={`btn-primary ${saved ? "bg-olive" : "bg-rust"} disabled:opacity-60`}
        >
          {updating ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cream border-t-transparent" />
          ) : saved ? (
            <><Check className="h-4 w-4" /> Saved!</>
          ) : (
            "Save Changes"
          )}
        </button>
      </form>
    </div>
  );
}
