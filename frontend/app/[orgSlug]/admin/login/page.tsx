"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OrgAdminLoginPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const resolvedParams = use(params);
  const { orgSlug } = resolvedParams;
  const orgName = orgSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const router = useRouter();

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

    try {
      const { apiLogin } = await import("../../../lib/api");
      const res = await apiLogin(adminId.trim(), password.trim());

      if (res.user.role !== "ORG_ADMIN" && res.user.role !== "SUPER_ADMIN") {
        setError("This account does not have Org Admin privileges.");
        setLoading(false);
        return;
      }

      // Store org admin token
      document.cookie = `access-token=${res.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}`;
      document.cookie = `auth-token=${res.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}`;
      document.cookie = `org-admin-token=${orgSlug}; path=/; max-age=86400`;

      // Redirect to admin dashboard — use orgSlug from URL or from login response
      const slug = res.user.orgSlug || orgSlug;
      router.push(`/${slug}/admin`);
    } catch (err: any) {
      setError(err?.message || "Invalid Admin credentials. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF5] flex flex-col justify-center items-center px-4 py-12">
      {/* Top Brand Link */}
      <div className="mb-6 flex flex-col items-center gap-2">
        <Link href="/" className="inline-block">
          <img src="/logo.png" alt="Carpool logo" className="h-10 w-auto" />
        </Link>
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#173300]/50 bg-[#173300]/[0.05] px-3 py-1 rounded-full border border-[#B6B6B6]">
          ORGANIZATION ADMIN PORTAL
        </span>
      </div>

      <div className="w-full max-w-md bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-8 shadow-[8px_8px_0px_#173300] relative">
        {/* Header Badge */}
        <div className="flex items-center gap-3 mb-6 pb-5 border-b-2 border-dashed border-[#B6B6B6]">
          <div className="w-12 h-12 rounded-2xl bg-[#FFEB5B] border-2 border-[#173300] flex items-center justify-center font-heading font-extrabold text-xl shadow-[3px_3px_0px_#173300]">
            {orgName.charAt(0)}
          </div>
          <div>
            <h1 className="font-heading text-2xl font-extrabold text-[#173300]">
              {orgName}
            </h1>
            <p className="text-xs text-[#173300]/50 font-mono mt-0.5">Admin Dashboard Access</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="org-admin-id"
              className="text-xs font-mono font-bold uppercase tracking-wider text-[#173300]/70"
            >
              Admin Email
            </label>
            <input
              id="org-admin-id"
              type="email"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="admin@company.com"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-semibold text-base border-2 border-[#173300] shadow-[4px_4px_0px_#173300] hover:shadow-[2px_2px_0px_#173300] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150 disabled:opacity-60"
          >
            {loading ? "Authenticating…" : `Access ${orgName} Admin Dashboard →`}
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
