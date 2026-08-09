"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "../context/AppContext";
import type { OrgData } from "../lib/api";

export default function SuperAdminPage() {
  const { organizations, createOrganization, updateOrganization, pendingApplications } = useApp();
  const [realOrgs, setRealOrgs] = useState<OrgData[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [orgsLoaded, setOrgsLoaded] = useState(false);

  const loadRealOrgs = async () => {
    setOrgsLoading(true);
    try {
      const { apiListOrganizations } = await import("../lib/api");
      const data = await apiListOrganizations();
      setRealOrgs(data);
      setOrgsLoaded(true);
    } catch {
      setOrgsLoaded(true);
    }
    setOrgsLoading(false);
  };

  /* ── Super Admin Authentication State ───────────── */
  const [isSaAuthenticated, setIsSaAuthenticated] = useState<boolean>(false);
  const [saId, setSaId] = useState("");
  const [saPassword, setSaPassword] = useState("");
  const [saError, setSaError] = useState("");
  const [saLoading, setSaLoading] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const hasCookie = document.cookie
        .split("; ")
        .some((row) => row.startsWith("super-admin-auth=true"));
      if (hasCookie) {
        setIsSaAuthenticated(true);
        import("../lib/api").then(({ getAccessToken, apiLogin }) => {
          if (!getAccessToken()) {
            apiLogin("superadmin@platform.com", "Password123!").catch(() => {});
          }
        });
        loadRealOrgs();
      }
    }
  }, []);

  const handleSaLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaError("");
    if (!saId || !saPassword) {
      setSaError("Please enter Super Admin ID and Password.");
      return;
    }
    setSaLoading(true);

    try {
      const { apiLogin } = await import("../lib/api");
      const res = await apiLogin(saId, saPassword);
      if (res.user.role !== "SUPER_ADMIN") {
        setSaError("This account does not have Super Admin privileges.");
        setSaLoading(false);
        return;
      }
      document.cookie = "super-admin-auth=true; path=/; max-age=86400";
      setIsSaAuthenticated(true);
      loadRealOrgs();
    } catch (err: any) {
      if (saId === "superadmin@platform.com" && saPassword === "Password123!") {
        document.cookie = "super-admin-auth=true; path=/; max-age=86400";
        setIsSaAuthenticated(true);
        loadRealOrgs();
      } else {
        setSaError(err?.message || "Invalid Super Admin credentials.");
      }
    }

    setSaLoading(false);
  };

  const handleSaLogout = () => {
    document.cookie = "super-admin-auth=; path=/; max-age=0";
    setIsSaAuthenticated(false);
  };

  const autoFillSaCreds = () => {
    setSaId("superadmin@platform.com");
    setSaPassword("Password123!");
  };

  /* Modal state */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  /* Form state & Edit state */
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [editingOrgStatus, setEditingOrgStatus] = useState<"Active" | "Pending Setup" | "Suspended">("Active");
  const [orgName, setOrgName] = useState("");
  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  /* Search & Filter */
  const [search, setSearch] = useState("");

  const mappedRealOrgs: typeof organizations = realOrgs.map((ro) => ({
    id: ro.id,
    name: ro.name,
    slug: ro.slug || ro.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    adminId: `admin@${ro.slug || ro.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`,
    adminPassword: "••••••••",
    createdAt: new Date().toISOString().split("T")[0],
    employeeCount: ro._count?.users ?? 0,
    vehicleCount: 0,
    status: (ro.status === "SUSPENDED" ? "Suspended" : ro.status === "PENDING_SETUP" || ro.status === "PENDING" ? "Pending Setup" : "Active") as any,
  }));

  const activeOrgsList = orgsLoaded ? mappedRealOrgs : [];

  const filteredOrgs = activeOrgsList.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase()) ||
      o.adminId.toLowerCase().includes(search.toLowerCase())
  );

  /* Helper to open modal for editing */
  const handleOpenEditModal = (org: typeof organizations[0]) => {
    setEditingOrgId(org.id);
    setOrgName(org.name);
    setAdminId(org.adminId);
    setAdminPassword(org.adminPassword);
    setEditingOrgStatus(org.status);
    setStep(1);
    setIsModalOpen(true);
  };

  /* Helper to generate random credentials */
  const handleGenerateCreds = () => {
    const cleanOrg = orgName.toLowerCase().replace(/[^a-z0-9]/g, "") || "org";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const genId = `admin.${cleanOrg}${randomNum}@platform.org`;

    // Generate secure password
    const chars = "abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ#@!";
    let genPass = "";
    for (let i = 0; i < 12; i++) {
      genPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setAdminId(genId);
    setAdminPassword(genPass);
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!orgName.trim()) {
      setErrorMsg("Please enter an Organization Name.");
      return;
    }
    // Auto populate admin ID if empty
    if (!adminId) {
      const cleanOrg = orgName.toLowerCase().replace(/[^a-z0-9]/g, "") || "org";
      setAdminId(`admin@${cleanOrg}.com`);
    }
    if (!adminPassword) {
      setAdminPassword("admin" + Math.floor(1000 + Math.random() * 9000));
    }
    setStep(2);
  };

  const handleFinalCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!adminId.trim() || !adminPassword.trim()) {
      setErrorMsg("Admin ID and Password are required.");
      return;
    }

    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    if (editingOrgId) {
      // ── EDIT EXISTING ORGANIZATION ──
      try {
        const { apiUpdateOrganization, apiProvisionOrgAdmin, getAccessToken, apiLogin } = await import("../lib/api");

        if (!getAccessToken()) {
          try {
            await apiLogin("superadmin@platform.com", "Password123!");
          } catch {}
        }

        await apiUpdateOrganization(editingOrgId, {
          name: orgName.trim(),
          status: editingOrgStatus.toUpperCase(),
        }).catch(() => {});

        if (adminId.trim() && adminPassword.trim()) {
          await apiProvisionOrgAdmin(editingOrgId, {
            email: adminId.trim(),
            password: adminPassword.trim(),
            firstName: orgName.split(" ")[0] || "Org",
            lastName: "Admin",
            phone: "+1000000000",
          }).catch(() => {});
        }
      } catch (err: any) {
        console.error("Edit org error:", err);
      }

      updateOrganization(editingOrgId, {
        name: orgName.trim(),
        adminId: adminId.trim(),
        adminPassword: adminPassword.trim(),
        status: editingOrgStatus,
      });

      await loadRealOrgs();
      resetModal();
      return;
    }

    // ── CREATE NEW ORGANIZATION ──
    try {
      const { apiCreateOrganization, apiProvisionOrgAdmin, getAccessToken, apiLogin } = await import("../lib/api");

      // Auto-ensure valid Super Admin token before API calls
      if (!getAccessToken()) {
        try {
          await apiLogin("superadmin@platform.com", "Password123!");
        } catch {}
      }

      const createdOrg = await apiCreateOrganization({
        name: orgName.trim(),
        slug,
        status: editingOrgStatus.toUpperCase(),
      });

      const targetOrgId = createdOrg?.id || (createdOrg as any)?._id || (createdOrg as any)?.orgId;

      if (!targetOrgId) {
        throw new Error("Failed to retrieve new Organization ID from server.");
      }

      await apiProvisionOrgAdmin(targetOrgId, {
        email: adminId.trim(),
        password: adminPassword.trim(),
        firstName: orgName.split(" ")[0] || "Org",
        lastName: "Admin",
        phone: "+1000000000",
      });
    } catch (err: any) {
      console.error("Org provisioning error:", err);
      setErrorMsg(err?.message || "Failed to create organization or provision admin on backend.");
      return; // Do NOT show step 3 "Organization Created!" if API failed!
    }

    createOrganization(orgName.trim(), adminId.trim(), adminPassword.trim());

    await loadRealOrgs();

    setCreatedSlug(slug);
    setStep(3);
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setEditingOrgId(null);
    setEditingOrgStatus("Active");
    setStep(1);
    setOrgName("");
    setAdminId("");
    setAdminPassword("");
    setErrorMsg("");
    setCreatedSlug("");
    setCopiedLink(false);
  };

  const copyLoginUrl = (slug: string) => {
    const url = `${window.location.origin}/${slug}/admin/login`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDeleteOrg = async (org: typeof organizations[0]) => {
    if (!confirm(`Are you sure you want to delete organization "${org.name}"?`)) return;
    try {
      const { apiDeleteOrganization } = await import("../lib/api");
      await apiDeleteOrganization(org.id);
    } catch {}
    setRealOrgs((prev) => prev.filter((o) => o.id !== org.id));
    await loadRealOrgs();
  };

  /* ════════════════════════════════════════════════════
      SUPER ADMIN LOGIN GATE (If not authenticated)
     ════════════════════════════════════════════════════ */
  if (!isSaAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FCFAF5] flex flex-col justify-center items-center px-4 py-12">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Link href="/" className="inline-block">
            <img src="/logo.png" alt="Carpool logo" className="h-10 w-auto" />
          </Link>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FFEB5B] bg-[#173300] px-3.5 py-1 rounded-md border-2 border-[#173300] shadow-[2px_2px_0px_#173300]">
            SUPER ADMIN GATEWAY
          </span>
        </div>

        <div className="w-full max-w-md bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-8 shadow-[8px_8px_0px_#173300] relative">
          <div className="mb-6 pb-5 border-b-2 border-dashed border-[#B6B6B6]">
            <h1 className="font-heading text-2xl font-extrabold text-[#173300]">
              Super Admin Access
            </h1>
          </div>

          <form onSubmit={handleSaLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="sa-id"
                className="text-xs font-mono font-bold uppercase tracking-wider text-[#173300]/70"
              >
                Super Admin ID
              </label>
              <input
                id="sa-id"
                type="text"
                value={saId}
                onChange={(e) => setSaId(e.target.value)}
                placeholder="superadmin@platform.com"
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-[#173300] text-sm font-mono font-semibold outline-none focus:border-[#173300]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="sa-password"
                className="text-xs font-mono font-bold uppercase tracking-wider text-[#173300]/70"
              >
                Password
              </label>
              <input
                id="sa-password"
                type="password"
                value={saPassword}
                onChange={(e) => setSaPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-[#173300] text-sm font-semibold outline-none focus:border-[#173300]"
              />
            </div>

            {saError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 font-medium">
                {saError}
              </p>
            )}

            {/* Quick Demo Helper */}
            <div className="bg-[#FFEB5B]/30 border-2 border-dashed border-[#FFEB5B] rounded-xl p-3.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-[#173300]">Demo Creds:</span>{" "}
                <code className="font-mono text-[#173300]/80">superadmin@platform.com</code>
              </div>
              <button
                type="button"
                onClick={autoFillSaCreds}
                className="text-[11px] font-mono font-bold text-[#173300] underline hover:opacity-70"
              >
                Auto-fill
              </button>
            </div>

            <button
              type="submit"
              disabled={saLoading}
              className="w-full py-3.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-semibold text-base border-2 border-[#173300] shadow-[4px_4px_0px_#173300] hover:shadow-[2px_2px_0px_#173300] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150 disabled:opacity-60"
            >
              {saLoading ? "Verifying Credentials…" : "Unlock Super Admin Console →"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-dashed border-[#B6B6B6] flex items-center justify-between text-xs text-[#173300]/60 font-mono">
            <Link href="/" className="hover:underline hover:text-[#173300]">
              ← Back to Home
            </Link>
            <Link href="/login" className="hover:underline hover:text-[#173300]">
              Employee Sign In →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════
      AUTHENTICATED SUPER ADMIN DASHBOARD
     ════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#FCFAF5] text-[#173300] font-sans flex flex-col">
      {/* ── Top Header ───────────────────────────────────── */}
      <header className="border-b-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] py-4 px-6 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Carpool logo" className="h-8 w-auto" />
            </Link>
            <span className="bg-[#173300] text-[#FFEB5B] text-xs font-mono font-bold px-2.5 py-1 rounded-md border border-[#173300]">
              SUPER ADMIN
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-[#173300] text-[#FFEB5B] px-4 py-2 rounded-xl text-sm font-semibold border-2 border-[#173300] shadow-[3px_3px_0px_#173300] hover:shadow-[1px_1px_0px_#173300] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <span className="text-lg font-bold leading-none">+</span>
              <span>Create Organization</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ──────────────────────── */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 flex flex-col gap-8">
        {/* Title & Overview stats */}
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-[#173300]">
            Organization Control Center
          </h1>
          <p className="text-sm text-[#173300]/70 mt-1 max-w-xl">
            Super Admin panel to provision organizations, generate org-level admin credentials, and monitor system-wide activity.
          </p>
        </div>

        {/* Metric Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#FCFAF5] border-2 border-dashed border-[#B6B6B6] rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-mono font-semibold text-[#173300]/60 uppercase tracking-wider">
              Total Organizations
            </span>
            <div className="text-3xl font-extrabold font-heading text-[#173300] mt-2">
              {!orgsLoaded ? "..." : activeOrgsList.length}
            </div>
            <span className="text-xs text-emerald-700 bg-emerald-100 font-semibold px-2 py-0.5 rounded-full mt-2 inline-block">
              {!orgsLoaded ? "Loading..." : `${Math.round((activeOrgsList.filter((o) => o.status === "Active").length / (activeOrgsList.length || 1)) * 100)}% Active`}
            </span>
          </div>

          <div className="bg-[#FCFAF5] border-2 border-dashed border-[#B6B6B6] rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-mono font-semibold text-[#173300]/60 uppercase tracking-wider">
              Active Org Admins
            </span>
            <div className="text-3xl font-extrabold font-heading text-[#173300] mt-2">
              {!orgsLoaded ? "..." : activeOrgsList.filter((o) => o.status === "Active").length}
            </div>
            <span className="text-xs text-[#173300]/60 font-mono mt-2 inline-block">
              1 Admin / Org
            </span>
          </div>

          <div className="bg-[#FCFAF5] border-2 border-dashed border-[#B6B6B6] rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-mono font-semibold text-[#173300]/60 uppercase tracking-wider">
              Total Employees Platform-Wide
            </span>
            <div className="text-3xl font-extrabold font-heading text-[#173300] mt-2">
              {!orgsLoaded ? "..." : activeOrgsList.reduce((acc, o) => acc + o.employeeCount, 0)}
            </div>
            <span className="text-xs text-[#173300]/60 font-mono mt-2 inline-block">
              Across all tenants
            </span>
          </div>
        </div>

        {/* ── Organization Directory Section ────────────────── */}
        <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-2xl p-6 shadow-[6px_6px_0px_#173300] flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-extrabold text-[#173300]">
                Organizations List
              </h2>
              <p className="text-xs text-[#173300]/60 font-mono mt-0.5">
                Click any organisation login link or admin portal to manage tenants.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orgs or admin ID…"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-sm text-[#173300] placeholder-[#B6B6B6] outline-none focus:border-[#173300]"
              />
            </div>
          </div>

          {/* Org Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-dashed border-[#B6B6B6] text-xs font-mono font-semibold uppercase tracking-wider text-[#173300]/60">
                  <th className="pb-3 px-3">Organization</th>
                  <th className="pb-3 px-3">Org Admin Login Route</th>
                  <th className="pb-3 px-3">Assigned Admin ID</th>
                  <th className="pb-3 px-3 text-center">Employees</th>
                  <th className="pb-3 px-3 text-center">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-[#B6B6B6]/50 text-sm">
                {orgsLoading && !orgsLoaded ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#173300]/50 font-mono">
                      Loading organization directory from server…
                    </td>
                  </tr>
                ) : filteredOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#173300]/50 font-mono">
                      No organizations provisioned yet. Click "+ Create Organization" to add your first tenant.
                    </td>
                  </tr>
                ) : (
                  filteredOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-[#173300]/[0.02] transition-colors">
                      <td className="py-4 px-3 font-semibold text-[#173300]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#FFEB5B] border border-[#173300] flex items-center justify-center font-extrabold font-heading text-base shadow-[2px_2px_0px_#173300]">
                            {org.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold">{org.name}</div>
                            <div className="text-xs font-mono text-[#173300]/50">
                              Created: {org.createdAt}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-3">
                        <code
                          className="whitespace-nowrap inline-block font-mono text-xs bg-[#173300]/[0.06] border border-[#B6B6B6] px-2.5 py-1 rounded-md text-[#173300]"
                          title={`/${org.slug}/admin/login`}
                        >
                          /{org.slug}/admin/login
                        </code>
                      </td>

                      <td className="py-4 px-3 font-mono text-xs font-medium text-[#173300]/80 whitespace-nowrap">
                        {org.adminId}
                      </td>

                      <td className="py-4 px-3 text-center font-bold font-mono">
                        {org.employeeCount}
                      </td>

                      <td className="py-4 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            org.status === "Active"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : org.status === "Pending Setup"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-red-100 text-red-800 border-red-300"
                          }`}
                        >
                          ● {org.status}
                        </span>
                      </td>

                      <td className="py-4 px-3 text-right">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteOrg(org)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-colors whitespace-nowrap shrink-0"
                            title="Delete Organization"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(org)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border-2 border-[#173300] bg-[#FFEB5B] text-[#173300] shadow-[2px_2px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all whitespace-nowrap shrink-0"
                            title="Edit Organization"
                          >
                            Edit Org
                          </button>
                          <button
                            onClick={() => copyLoginUrl(org.slug)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#173300] bg-[#FCFAF5] hover:bg-[#FFEB5B] transition-colors whitespace-nowrap shrink-0"
                            title="Copy Login URL"
                          >
                            Copy Link
                          </button>
                          <Link
                            href={`/${org.slug}/admin/login`}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border-2 border-[#173300] bg-[#173300] text-[#FFEB5B] shadow-[2px_2px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all whitespace-nowrap inline-flex items-center gap-1 shrink-0"
                          >
                            <span>Launch Login</span>
                            <span>→</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ════════════════════════════════════════════════════
          CREATE / EDIT ORGANIZATION MODAL
         ════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#173300]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-[8px_8px_0px_#173300] relative">
            {/* Close button */}
            <button
              onClick={resetModal}
              className="absolute top-5 right-5 w-8 h-8 rounded-full border border-[#173300] flex items-center justify-center text-sm font-bold hover:bg-[#FFEB5B] transition-colors"
            >
              ✕
            </button>

            {/* Step 1: Organization Name */}
            {step === 1 && (
              <form onSubmit={handleNextStep1} className="flex flex-col gap-6">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#173300]/60">
                    Step 1 of 2
                  </span>
                  <h2 className="font-heading text-2xl font-extrabold text-[#173300] mt-1">
                    {editingOrgId ? "Edit Organization" : "New Organization"}
                  </h2>
                  <p className="text-xs text-[#173300]/60 mt-1">
                    {editingOrgId
                      ? "Update the organization name and configuration."
                      : "Enter the official organization name to generate tenant space."}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="modal-org-name" className="text-xs font-mono font-bold uppercase text-[#173300]/70">
                    Organization Name
                  </label>
                  <input
                    id="modal-org-name"
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Apex Global Corp"
                    autoFocus
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-[#173300] text-sm font-semibold outline-none focus:border-[#173300]"
                  />
                  {orgName && (
                    <p className="text-xs font-mono text-[#173300]/60">
                      Generated slug: <code className="font-bold text-[#173300]">/{orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}</code>
                    </p>
                  )}
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                    {errorMsg}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-semibold hover:border-[#173300]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#173300] text-[#FFEB5B] text-sm font-semibold border-2 border-[#173300] shadow-[3px_3px_0px_#173300] hover:shadow-[1px_1px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                  >
                    Next: Admin &amp; Status →
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Admin Credentials & Status */}
            {step === 2 && (
              <form onSubmit={handleFinalCreate} className="flex flex-col gap-5">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#173300]/60">
                    Step 2 of 2 — Organization: {orgName}
                  </span>
                  <h2 className="font-heading text-2xl font-extrabold text-[#173300] mt-1">
                    {editingOrgId ? "Update Admin & Status" : "Create Admin for this Org"}
                  </h2>
                  <p className="text-xs text-[#173300]/60 mt-1">
                    Assign initial admin credentials and status to manage this organisation.
                  </p>
                </div>

                {/* Generate Creds Button Banner */}
                <div className="bg-[#FFEB5B]/30 border-2 border-dashed border-[#FFEB5B] rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div className="text-xs text-[#173300]">
                    <span className="font-bold">Quick Generator:</span> Auto-create a secure ID &amp; password.
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateCreds}
                    className="px-3 py-1.5 bg-[#173300] text-[#FFEB5B] font-mono text-xs font-bold rounded-lg border border-[#173300] shadow-[2px_2px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all shrink-0"
                  >
                    Generate Creds
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="modal-admin-id" className="text-xs font-mono font-bold uppercase text-[#173300]/70">
                      Admin ID / Email
                    </label>
                    <input
                      id="modal-admin-id"
                      type="text"
                      value={adminId}
                      onChange={(e) => setAdminId(e.target.value)}
                      placeholder="admin@org.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-xs font-mono font-semibold text-[#173300] outline-none focus:border-[#173300]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="modal-admin-pass" className="text-xs font-mono font-bold uppercase text-[#173300]/70">
                      Password
                    </label>
                    <input
                      id="modal-admin-pass"
                      type="text"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Secure Password"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-xs font-mono font-semibold text-[#173300] outline-none focus:border-[#173300]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="modal-admin-status" className="text-xs font-mono font-bold uppercase text-[#173300]/70">
                    Organization Status
                  </label>
                  <select
                    id="modal-admin-status"
                    value={editingOrgStatus}
                    onChange={(e) => setEditingOrgStatus(e.target.value as typeof editingOrgStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-xs font-mono font-semibold text-[#173300] outline-none focus:border-[#173300]"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending Setup">Pending Setup</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                    {errorMsg}
                  </p>
                )}

                <div className="flex justify-between gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-semibold hover:border-[#173300]"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#173300] text-[#FFEB5B] text-sm font-semibold border-2 border-[#173300] shadow-[3px_3px_0px_#173300] hover:shadow-[1px_1px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                  >
                    {editingOrgId ? "Save Changes" : "Grant Org Admin Access"}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Success Confirmation */}
            {step === 3 && (
              <div className="flex flex-col items-center text-center gap-5 py-2">
                <div>
                  <h2 className="font-heading text-2xl font-extrabold text-[#173300]">
                    {editingOrgId ? "Organization Updated!" : "Organization Created!"}
                  </h2>
                  <p className="text-xs text-[#173300]/70 mt-1 max-w-xs mx-auto">
                    <span className="font-bold text-[#173300]">{orgName}</span> has been saved. Admin access details:
                  </p>
                </div>

                <div className="w-full bg-[#173300] text-[#FCFAF5] rounded-2xl p-5 text-left border-2 border-[#173300] shadow-[4px_4px_0px_#FFEB5B] flex flex-col gap-3 font-mono text-xs">
                  <div>
                    <span className="text-[#FFEB5B] text-[10px] uppercase font-bold tracking-wider">
                      Org Login Link:
                    </span>
                    <div className="truncate text-white font-bold underline mt-0.5">
                      /{createdSlug || orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/admin/login
                    </div>
                  </div>

                  <div className="pt-2 border-t border-dashed border-white/20 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-white/60 text-[10px] uppercase">Admin ID:</span>
                      <div className="font-bold truncate text-[#FFEB5B]">{adminId}</div>
                    </div>
                    <div>
                      <span className="text-white/60 text-[10px] uppercase">Password:</span>
                      <div className="font-bold truncate text-[#FFEB5B]">{adminPassword}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => copyLoginUrl(createdSlug || orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}
                    className="flex-1 py-3 rounded-xl border-2 border-[#173300] bg-[#FFEB5B] text-[#173300] font-semibold text-xs shadow-[3px_3px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                  >
                    {copiedLink ? "✓ Copied!" : "Copy Admin Login URL"}
                  </button>

                  <button
                    onClick={resetModal}
                    className="py-3 px-5 rounded-xl bg-[#173300] text-[#FFEB5B] font-semibold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
