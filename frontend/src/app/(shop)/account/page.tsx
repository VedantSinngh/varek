"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { User, Mail, ShieldAlert } from "lucide-react";

export default function AccountProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [updating, setUpdating] = useState(false);

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
        name: name
      });
      setProfile(res.data);
      alert("Profile updated successfully!");
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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center text-slate-500 space-y-2">
        <ShieldAlert className="h-8 w-8 text-red-500 mx-auto" />
        <p className="text-xs">Failed to load active profile configuration details.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">My Profile Details</h3>
        <p className="text-[10px] text-slate-500 mt-1">Review credentials and adjust name values.</p>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4 max-w-md">
        {/* Email Address */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Email Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-600">
              <Mail className="h-4 w-4" />
            </span>
            <input
              type="email"
              disabled
              value={profile.email}
              className="w-full rounded-lg border border-slate-800 bg-[#1f2937]/30 py-2 pl-10 pr-4 text-xs text-slate-400 cursor-not-allowed focus:outline-none"
            />
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Full Name</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-650">
              <User className="h-4 w-4" />
            </span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full rounded-lg border border-slate-800 bg-[#1f2937] py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-600"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={updating}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-50"
        >
          {updating ? "Saving..." : "Save Adjustments"}
        </button>
      </form>
    </div>
  );
}
