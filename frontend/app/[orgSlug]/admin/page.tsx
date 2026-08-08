"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { useApp, Vehicle } from "../../context/AppContext";
import type { UserData, VehicleData, OrgData } from "../../lib/api";
import { getIdProofUrl, API_BASE_URL } from "../../lib/api";

type AdminTab =
  | "overview"
  | "approvals"
  | "employees"
  | "vehicles"
  | "carpool-config";

export default function OrgAdminDashboard({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const resolvedParams = use(params);
  const { orgSlug } = resolvedParams;

  const {
    configs,
    approveApplication,
    rejectApplication,
    toggleEmployeeAccess,
    updateOrgConfig,
  } = useApp();

  /* ── Real API data state ─────────────────────────── */
  const [realOrg, setRealOrg] = useState<OrgData | null>(null);
  const [apiPendingUsers, setApiPendingUsers] = useState<UserData[]>([]);
  const [apiEmployees, setApiEmployees] = useState<UserData[]>([]);
  const [apiVehicles, setApiVehicles] = useState<VehicleData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const { apiGetPendingUsers, apiListUsers, apiListVehicles, apiGetOrganization } = await import("../../lib/api");
      const [orgData, pending, emps, vehs] = await Promise.all([
        apiGetOrganization(orgSlug).catch(() => null),
        apiGetPendingUsers().catch(() => [] as UserData[]),
        apiListUsers().catch(() => [] as UserData[]),
        apiListVehicles(true).catch(() => [] as VehicleData[]),
      ]);
      if (orgData) setRealOrg(orgData);
      setApiPendingUsers(pending);
      setApiEmployees(emps.filter((u) => u.verificationStatus === "APPROVED"));
      setApiVehicles(vehs);
    } catch {}
    setDataLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [orgSlug]);

  const orgNameFromSlug = orgSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const org = {
    id: realOrg?.id || orgSlug,
    name: realOrg?.name || orgNameFromSlug,
    slug: realOrg?.slug || orgSlug,
    adminId: `admin@${orgSlug}.com`,
    employeeCount: apiEmployees.length,
    vehicleCount: apiVehicles.length,
    status: realOrg?.status || "Active",
  };

  const pendingApps = apiPendingUsers;
  const orgEmps = apiEmployees;
  const orgVehs = apiVehicles;

  const orgConfig = configs[orgSlug] || {
    orgSlug,
    baseRideCharge: 2.5,
    subsidyPercent: 50,
    maxRidersPerCarpool: 4,
    autoMatchEnabled: true,
    departmentRestriction: false,
    driverPriorityScore: true,
    carpoolEnabledGlobally: true,
  };

  const handleApproveUser = async (appId: string) => {
    try {
      const { apiApproveUser } = await import("../../lib/api");
      await apiApproveUser(appId);
      setApiPendingUsers((prev) => prev.filter((u) => u.id !== appId));
      loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to approve user");
    }
  };

  const handleRejectUser = async (appId: string) => {
    const reason = prompt(
      "Enter rejection reason for this employee registration:",
      "ID proof document image is blurred and unreadable."
    );
    if (reason !== null) {
      try {
        const { apiRejectUser } = await import("../../lib/api");
        await apiRejectUser(appId, reason);
        setApiPendingUsers((prev) => prev.filter((u) => u.id !== appId));
        loadData();
      } catch (err: any) {
        alert(err?.message || "Failed to reject user");
      }
    }
  };

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [empSearch, setEmpSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");

  const carpoolEnabledCount = (orgEmps as any[]).filter((e) => e.carpoolAccess !== false).length;
  const totalEmployeesCount = orgEmps.length;
  const adoptionRatePercent = totalEmployeesCount > 0
    ? ((carpoolEnabledCount / totalEmployeesCount) * 100).toFixed(1)
    : "0.0";

  const filteredEmployees = orgEmps.filter((e: any) => {
    const displayName = e.name || `${e.firstName || ""} ${e.lastName || ""}`.trim();
    const matchesSearch =
      displayName.toLowerCase().includes(empSearch.toLowerCase()) ||
      (e.employeeId || "").toLowerCase().includes(empSearch.toLowerCase()) ||
      (e.email || "").toLowerCase().includes(empSearch.toLowerCase());
    const matchesDept = deptFilter === "All" || (e.department || "") === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="min-h-screen bg-[#FCFAF5] text-[#173300] font-sans flex flex-col">
      {/* ── Top Admin Header Bar ─────────────────────────── */}
      <header className="border-b-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] py-3.5 px-6 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="Oddo Logo" className="h-8 w-auto" />
            </Link>
            <span className="h-5 w-px bg-[#B6B6B6]" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FFEB5B] border border-[#173300] flex items-center justify-center font-bold text-xs font-heading">
                {org.name.charAt(0)}
              </div>
              <span className="font-heading font-extrabold text-lg text-[#173300]">
                {org.name}
              </span>
              <span className="bg-[#173300] text-[#FFEB5B] text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                ORG ADMIN
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/super-admin"
              className="text-xs font-mono font-semibold text-[#173300]/70 hover:underline"
            >
              ← Super Admin
            </Link>
          </div>
        </div>
      </header>

      {/* ── Navigation Tabs Bar ───────────────────────────── */}
      <div className="border-b-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {[
            { id: "overview", label: "Overview", badge: null },
            {
              id: "approvals",
              label: "Grant Applications",
              badge: pendingApps.length > 0 ? pendingApps.length : null,
            },
            { id: "employees", label: "Employees", badge: orgEmps.length },
            { id: "vehicles", label: "Vehicles & Drivers", badge: orgVehs.length },
            { id: "carpool-config", label: "Carpool Rules", badge: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[#173300] text-[#FFEB5B] shadow-[3px_3px_0px_#173300]"
                  : "text-[#173300]/70 hover:bg-[#173300]/[0.06] hover:text-[#173300]"
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    activeTab === tab.id
                      ? "bg-[#FFEB5B] text-[#173300]"
                      : "bg-[#173300]/10 text-[#173300]"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Tab Content ──────────────────────────────── */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 flex flex-col gap-8">
        {/* ══════════════ TAB 1: OVERVIEW ══════════════ */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading text-3xl font-extrabold text-[#173300]">
                  {org.name} Operations Hub
                </h1>
                <p className="text-xs text-[#173300]/60 font-mono mt-1">
                  Manage organization registration grants, fleet drivers, and carpool policies.
                </p>
              </div>

              {pendingApps.length > 0 && (
                <div
                  onClick={() => setActiveTab("approvals")}
                  className="cursor-pointer bg-[#FFEB5B] border-2 border-[#173300] rounded-2xl px-4 py-3 shadow-[4px_4px_0px_#173300] flex items-center gap-3 hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#173300] text-[#FFEB5B] flex items-center justify-center font-bold text-sm">
                    !
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[#173300]">
                      {pendingApps.length} Registration Request{pendingApps.length > 1 ? "s" : ""}
                    </div>
                    <div className="text-[11px] text-[#173300]/70 font-mono">
                      Awaiting employee access grant →
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Metrics Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#FCFAF5] border-2 border-dashed border-[#B6B6B6] rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-mono font-semibold text-[#173300]/60 uppercase tracking-wider">
                  Total Active Employees
                </span>
                <div className="text-3xl font-extrabold font-heading text-[#173300] mt-2">
                  {orgEmps.length}
                </div>
                <span className="text-xs text-emerald-800 bg-emerald-100 font-semibold px-2 py-0.5 rounded-full mt-2 inline-block">
                  {(orgEmps as any[]).filter((e) => e.carpoolAccess !== false).length} Carpool Enabled
                </span>
              </div>

              <div className="bg-[#FCFAF5] border-2 border-dashed border-[#B6B6B6] rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-mono font-semibold text-[#173300]/60 uppercase tracking-wider">
                  Registered Drivers &amp; Vehicles
                </span>
                <div className="text-3xl font-extrabold font-heading text-[#173300] mt-2">
                  {orgVehs.length}
                </div>
                <span className="text-xs text-[#173300]/60 font-mono mt-2 inline-block">
                  {orgVehs.filter((v) => v.status === "VERIFIED" || (v as any).verificationStatus === "Verified").length} Verified Vehicles
                </span>
              </div>

              <div className="bg-[#FCFAF5] border-2 border-dashed border-[#B6B6B6] rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-mono font-semibold text-[#173300]/60 uppercase tracking-wider">
                  Organization Subsidy
                </span>
                <div className="text-3xl font-extrabold font-heading text-[#173300] mt-2">
                  {orgConfig.subsidyPercent}%
                </div>
                <span className="text-xs text-[#173300]/60 font-mono mt-2 inline-block">
                  Org Travel Support
                </span>
              </div>

              <div className="bg-[#FCFAF5] border-2 border-dashed border-[#B6B6B6] rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-mono font-semibold text-[#173300]/60 uppercase tracking-wider">
                  Carpool Adoption Rate
                </span>
                <div className="text-3xl font-extrabold font-heading text-[#173300] mt-2">
                  {adoptionRatePercent}%
                </div>
                <span className="text-xs text-emerald-700 font-semibold mt-2 inline-block">
                  {carpoolEnabledCount} of {totalEmployeesCount} Employees Enabled
                </span>
              </div>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Config Card */}
              <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-2xl p-6 shadow-[5px_5px_0px_#173300] flex flex-col gap-4">
                <h3 className="font-heading text-xl font-extrabold text-[#173300]">
                  Quick Settings Summary
                </h3>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between py-2 border-b border-dashed border-[#B6B6B6]">
                    <span className="text-[#173300]/60">Max Riders / Vehicle:</span>
                    <span className="font-bold">{orgConfig.maxRidersPerCarpool} Riders</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed border-[#B6B6B6]">
                    <span className="text-[#173300]/60">Auto Match:</span>
                    <span className="font-bold">{orgConfig.autoMatchEnabled ? "ENABLED" : "DISABLED"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed border-[#B6B6B6]">
                    <span className="text-[#173300]/60">Base Travel Charge:</span>
                    <span className="font-bold">${orgConfig.baseRideCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#173300]/60">Global Carpool Platform:</span>
                    <span className="font-bold text-emerald-800">ACTIVE</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("carpool-config")}
                  className="mt-2 w-full py-2.5 rounded-xl border-2 border-[#173300] bg-[#FFEB5B] font-semibold text-xs text-[#173300] shadow-[2px_2px_0px_#173300]"
                >
                  Adjust Operational Rules →
                </button>
              </div>

              {/* Recent Pending Applications Table */}
              <div className="lg:col-span-2 bg-[#FCFAF5] border-2 border-[#173300] rounded-2xl p-6 shadow-[5px_5px_0px_#173300] flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-heading text-xl font-extrabold text-[#173300]">
                    Pending Grant Requests
                  </h3>
                  <button
                    onClick={() => setActiveTab("approvals")}
                    className="text-xs font-mono font-bold text-[#173300] underline"
                  >
                    View All ({pendingApps.length}) →
                  </button>
                </div>

                {pendingApps.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#173300]/50 font-mono">
                    No pending registration applications for {org.name}.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingApps.map((app) => {
                      const appName = app.fullName || `${(app as UserData).firstName || ""} ${(app as UserData).lastName || ""}`.trim() || app.email;
                      const appDept = app.department || "General";
                      return (
                        <div
                          key={app.id}
                          className="bg-[#173300]/[0.03] border-2 border-dashed border-[#B6B6B6] rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                        >
                          <div>
                            <div className="font-bold text-sm text-[#173300]">
                              {appName}{" "}
                              <span className="text-xs font-mono text-[#173300]/60 font-normal">
                                ({app.employeeId || "N/A"})
                              </span>
                            </div>
                            <div className="text-xs text-[#173300]/60 font-mono mt-0.5">
                              {app.email} • {appDept}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRejectUser(app.id)}
                              className="px-3 py-1.5 rounded-lg border border-red-300 bg-red-50 text-red-700 font-bold text-xs hover:bg-red-100 transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApproveUser(app.id)}
                              className="px-4 py-1.5 rounded-lg border-2 border-[#173300] bg-[#173300] text-[#FFEB5B] font-bold text-xs shadow-[2px_2px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                            >
                              Grant Access
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB 2: REGISTRATION APPROVALS ══════════════ */}
        {activeTab === "approvals" && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="font-heading text-3xl font-extrabold text-[#173300]">
                Registration &amp; Grant Applications
              </h1>
              <p className="text-xs text-[#173300]/60 font-mono mt-1">
                Review employee sign-up submissions, inspect uploaded company ID cards, and grant platform access for {org.name}.
              </p>
            </div>

            <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-2xl p-6 shadow-[6px_6px_0px_#173300] flex flex-col gap-6">
              {pendingApps.length === 0 ? (
                <div className="py-12 text-center text-sm font-mono text-[#173300]/50">
                  No pending registration applications for {org.name}.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingApps.map((app) => (
                    <div
                      key={app.id}
                      className="border-2 border-[#173300] bg-[#FCFAF5] shadow-[4px_4px_0px_#173300] rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#173300]/50">
                            {app.department || "General"}
                          </span>
                          <h3 className="font-heading text-xl font-extrabold text-[#173300]">
                            {app.fullName || `${app.firstName || ""} ${app.lastName || ""}`.trim() || app.email}
                          </h3>
                          <div className="text-xs font-mono text-[#173300]/70 mt-0.5">
                            ID: <span className="font-bold text-[#173300]">{app.employeeId || "N/A"}</span>
                          </div>
                          <div className="text-xs text-[#173300]/60 mt-0.5">
                            {app.email}
                          </div>
                        </div>

                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full border bg-[#FFEB5B] text-[#173300] border-[#173300]">
                          ● PENDING REVIEW
                        </span>
                      </div>

                      {/* Uploaded ID Card Preview Thumbnail */}
                      <div className="bg-[#173300]/[0.03] border-2 border-dashed border-[#B6B6B6] rounded-xl p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#173300]/10 flex items-center justify-center font-mono font-bold text-xs text-[#173300]">
                            ID
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-[#173300]">
                              Uploaded Company ID Card
                            </div>
                            <div className="text-[10px] font-mono text-[#173300]/50">
                              Submitted {app.idProofUploadedAt ? new Date(app.idProofUploadedAt).toLocaleDateString() : "Recently"}
                            </div>
                          </div>
                        </div>
                        <a
                          href={getIdProofUrl(app.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 bg-[#173300] text-[#FFEB5B] text-[11px] font-mono font-bold rounded-md hover:opacity-90 inline-block"
                        >
                          Inspect ID Card
                        </a>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => handleRejectUser(app.id)}
                          className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-red-300 text-red-700 font-bold text-xs hover:bg-red-50 transition-colors"
                        >
                          Reject Application
                        </button>
                        <button
                          onClick={() => handleApproveUser(app.id)}
                          className="flex-2 py-2.5 rounded-xl border-2 border-[#173300] bg-[#173300] text-[#FFEB5B] font-bold text-xs shadow-[3px_3px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                        >
                          Grant Employee Access
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ TAB 3: EMPLOYEES MANAGEMENT ══════════════ */}
        {activeTab === "employees" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="font-heading text-3xl font-extrabold text-[#173300]">
                  Employee Records &amp; Platform Access
                </h1>
                <p className="text-xs text-[#173300]/60 font-mono mt-1">
                  Manage personnel records and toggle carpool privileges for {org.name}.
                </p>
              </div>
            </div>

            <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-2xl p-6 shadow-[6px_6px_0px_#173300] flex flex-col gap-6">
              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <input
                  type="text"
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  placeholder="Search by name, ID or email…"
                  className="w-full sm:w-72 px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-xs text-[#173300] outline-none focus:border-[#173300]"
                />

                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-xs font-semibold text-[#173300] outline-none focus:border-[#173300]"
                >
                  <option value="All">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Product Design">Product Design</option>
                  <option value="Supply Chain">Supply Chain</option>
                  <option value="Hardware Engineering">Hardware Engineering</option>
                  <option value="Operations & Logistics">Operations &amp; Logistics</option>
                </select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-dashed border-[#B6B6B6] text-xs font-mono uppercase text-[#173300]/60">
                      <th className="pb-3 px-3">Employee</th>
                      <th className="pb-3 px-3">ID Number</th>
                      <th className="pb-3 px-3">Department &amp; Role</th>
                      <th className="pb-3 px-3 text-center">Status</th>
                      <th className="pb-3 px-3 text-center">Carpool Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-[#B6B6B6]/50 text-xs">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#173300]/50 font-mono">
                          No registered employees found for {org.name}.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => {
                        const empName = emp.name || `${(emp as UserData).firstName || ""} ${(emp as UserData).lastName || ""}`.trim() || emp.email;
                        const empDept = emp.department || "General";
                        const empStatus = emp.status || ((emp as UserData).verificationStatus === "APPROVED" ? "Active" : (emp as UserData).verificationStatus || "Active");
                        return (
                          <tr key={emp.id} className="hover:bg-[#173300]/[0.02]">
                            <td className="py-3.5 px-3">
                              <div className="font-bold text-sm text-[#173300]">{empName}</div>
                              <div className="text-[11px] text-[#173300]/60">{emp.email}</div>
                            </td>

                            <td className="py-3.5 px-3 font-mono font-bold">{emp.employeeId || "N/A"}</td>

                            <td className="py-3.5 px-3">
                              <div className="font-semibold text-[#173300]">{empDept}</div>
                              <div className="text-[11px] text-[#173300]/60">{emp.role}</div>
                            </td>

                            <td className="py-3.5 px-3 text-center">
                              <span
                                className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                                  empStatus === "Active" || empStatus === "APPROVED"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : "bg-amber-100 text-amber-800 border-amber-300"
                                }`}
                              >
                                {empStatus}
                              </span>
                            </td>

                            {/* Interactive Access Toggle */}
                            <td className="py-3.5 px-3 text-center">
                              <button
                                onClick={async () => {
                                  try {
                                    const { apiUpdateUser } = await import("../../lib/api");
                                    await apiUpdateUser(emp.id, { carpoolAccess: !emp.carpoolAccess });
                                    loadData();
                                  } catch (err: any) {
                                    alert(err?.message || "Failed to update carpool access");
                                  }
                                }}
                                className={`px-3 py-1 rounded-full text-xs font-bold font-mono transition-all border ${
                                  emp.carpoolAccess !== false
                                    ? "bg-[#FFEB5B] text-[#173300] border-[#173300]"
                                    : "bg-gray-100 text-gray-500 border-gray-300"
                                }`}
                              >
                                {emp.carpoolAccess !== false ? "ENABLED" : "DISABLED"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB 4: VEHICLES & DRIVERS ══════════════ */}
        {activeTab === "vehicles" && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="font-heading text-3xl font-extrabold text-[#173300]">
                Registered Vehicles &amp; Drivers
              </h1>
              <p className="text-xs text-[#173300]/60 font-mono mt-1">
                View vehicles and registered fleet drivers for {org.name}.
              </p>
            </div>

            <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-2xl p-6 shadow-[6px_6px_0px_#173300] flex flex-col gap-6">
              {orgVehs.length === 0 ? (
                <div className="py-12 text-center text-sm font-mono text-[#173300]/50">
                  No registered vehicles found for {org.name} yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {orgVehs.map((veh) => (
                    <div
                      key={veh.id}
                      className="border-2 border-[#173300] bg-[#FCFAF5] rounded-2xl p-5 shadow-[4px_4px_0px_#173300] flex flex-col justify-between gap-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#FFEB5B] border border-[#173300] rounded-md">
                            {veh.fuelType}
                          </span>
                          <h3 className="font-heading text-lg font-extrabold text-[#173300] mt-2">
                            {veh.model}
                          </h3>
                          <div className="text-xs font-mono font-bold text-[#173300]/80 mt-0.5">
                            Plate: {veh.registrationNumber}
                          </div>
                        </div>

                        <span className="text-[11px] font-mono font-bold px-2 py-1 rounded-lg border border-[#173300] bg-[#FCFAF5]">
                          {veh.status}
                        </span>
                      </div>

                      <div className="bg-[#173300]/[0.03] border border-dashed border-[#B6B6B6] rounded-xl p-3 font-mono text-xs flex justify-between items-center">
                        <div>
                          <span className="text-[#173300]/60 block text-[10px]">SEATING CAPACITY</span>
                          <span className="font-bold text-[#173300]">{veh.seatingCapacity} Seats</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ TAB 5: CARPOOL RULES CONFIG ══════════════ */}
        {activeTab === "carpool-config" && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="font-heading text-3xl font-extrabold text-[#173300]">
                Carpooling Operational Settings
              </h1>
              <p className="text-xs text-[#173300]/60 font-mono mt-1">
                Configure tenant operational matching policies and rider limits for {org.name}.
              </p>
            </div>

            <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-2xl p-6 shadow-[6px_6px_0px_#173300] grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Max Riders */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-mono font-bold uppercase text-[#173300]/70">
                  Max Riders per Carpool Vehicle
                </label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={orgConfig.maxRidersPerCarpool}
                  onChange={(e) =>
                    updateOrgConfig(orgSlug, { maxRidersPerCarpool: Number(e.target.value) })
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] font-mono text-sm font-bold text-[#173300] outline-none"
                />
                <p className="text-xs text-[#173300]/60">
                  Maximum passenger capacity enforced during route creation.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
