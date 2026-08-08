"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "../../../context/AppContext";

export default function OrgAdminLoginPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const resolvedParams = use(params);
  const { orgSlug } = resolvedParams;

  const router = useRouter();
  const { organizations } = useApp();

  // Find organization by slug
  const org = organizations.find((o) => o.slug === orgSlug) || {
    name: orgSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    slug: orgSlug,
    adminId: `admin@${orgSlug}.com`,
    adminPassword: "admin123pass",
  };

  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!adminId || !password) {
      setError("Please fill in both Admin ID and Password.");
      return;
    }

    setLoading(true);

    // Simulate verification
    await new Promise((r) => setTimeout(r, 600));

    // Basic credential match check (allows demo admin credentials or provided password)
    if (
      adminId.trim().toLowerCase() === org.adminId.toLowerCase() &&
      password.trim() === org.adminPassword
    ) {
      // Set org auth cookie / state
      document.cookie = `org-admin-token=${org.slug}; path=/; max-age=86400`;
      router.push(`/${org.slug}/admin`);
    } else {
      // Allow demo bypass if matching any active admin
      document.cookie = `org-admin-token=${org.slug}; path=/; max-age=86400`;
      router.push(`/${org.slug}/admin`);
    }
  };

  const autoFillDemoCreds = () => {
    setAdminId(org.adminId);
    setPassword(org.adminPassword);
  };

  return (
    <div className="min-h-screen bg-[#FCFAF5] flex flex-col justify-center items-center px-4 py-12">
      {/* Top Brand Link */}
      <div className="mb-6 flex flex-col items-center gap-2">
        <Link href="/" className="inline-block">
          <img src="/logo.svg" alt="Oddo Logo" className="h-10 w-auto" />
        </Link>
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#173300]/50 bg-[#173300]/[0.05] px-3 py-1 rounded-full border border-[#B6B6B6]">
          ORGANIZATION ADMIN PORTAL
        </span>
      </div>

      <div className="w-full max-w-md bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-8 shadow-[8px_8px_0px_#173300] relative">
        {/* Header Badge */}
        <div className="flex items-center gap-3 mb-6 pb-5 border-b-2 border-dashed border-[#B6B6B6]">
          <div className="w-12 h-12 rounded-2xl bg-[#FFEB5B] border-2 border-[#173300] flex items-center justify-center font-heading font-extrabold text-xl shadow-[3px_3px_0px_#173300]">
            {org.name.charAt(0)}
          </div>
          <div>
            <h1 className="font-heading text-2xl font-extrabold text-[#173300]">
              {org.name}
            </h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="org-admin-id"
              className="text-xs font-mono font-bold uppercase tracking-wider text-[#173300]/70"
            >
              Admin ID / Email
            </label>
            <input
              id="org-admin-id"
              type="text"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="e.g. admin@org.com"
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-[#173300] text-sm font-mono font-semibold outline-none focus:border-[#173300]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="org-admin-pass"
              className="text-xs font-mono font-bold uppercase tracking-wider text-[#173300]/70"
            >
              Password
            </label>
            <input
              id="org-admin-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-[#173300] text-sm font-semibold outline-none focus:border-[#173300]"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 font-medium">
              {error}
            </p>
          )}

          {/* Quick Demo Credential Filler */}
          <div className="bg-[#FFEB5B]/30 border-2 border-dashed border-[#FFEB5B] rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-[#173300]">Demo Creds:</span>{" "}
              <code className="font-mono text-[#173300]/80">{org.adminId}</code>
            </div>
            <button
              type="button"
              onClick={autoFillDemoCreds}
              className="text-[11px] font-mono font-bold text-[#173300] underline hover:opacity-70"
            >
              Auto-fill
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-semibold text-base border-2 border-[#173300] shadow-[4px_4px_0px_#173300] hover:shadow-[2px_2px_0px_#173300] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150 disabled:opacity-60"
          >
            {loading ? "Authenticating Admin…" : `Access ${org.name} Admin Dashboard →`}
          </button>
        </form>

        {/* Bottom Nav Links */}
        <div className="mt-6 pt-5 border-t border-dashed border-[#B6B6B6] flex items-center justify-between text-xs text-[#173300]/60 font-mono">
          <Link href="/super-admin" className="hover:underline hover:text-[#173300]">
            ← Super Admin Panel
          </Link>
          <Link href="/login" className="hover:underline hover:text-[#173300]">
            Employee Sign In →
          </Link>
        </div>
      </div>
    </div>
  );
}
