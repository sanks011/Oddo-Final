"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { useApp, Vehicle } from "../../context/AppContext";
import type { UserData, VehicleData } from "../../lib/api";
import { API_BASE_URL } from "../../lib/api";

type AdminTab =
  | "overview"
  | "approvals"
  | "employees"
  | "vehicles"
  | "carpool-config"
  | "cost-config"
  | "analytics";

export default function OrgAdminDashboard({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const resolvedParams = use(params);
  const { orgSlug } = resolvedParams;

  const {
    organizations,
    pendingApplications,
    employees,
    vehicles,
    configs,
    approveApplication,
    rejectApplication,
    toggleEmployeeAccess,
    addEmployee,
    addVehicle,
    updateVehicleStatus,
    updateOrgConfig,
  } = useApp();

  const org = organizations.find((o) => o.slug === orgSlug) || {
    name: orgSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    slug: orgSlug,
    adminId: `admin@${orgSlug}.com`,
    employeeCount: 14,
    vehicleCount: 4,
    status: "Active" as const,
  };

  /* ── Real API data state ─────────────────────────── */
  const [apiPendingUsers, setApiPendingUsers] = useState<UserData[]>([]);
  const [apiEmployees, setApiEmployees] = useState<UserData[]>([]);
  const [apiVehicles, setApiVehicles] = useState<VehicleData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      try {
        const { apiGetPendingUsers, apiListUsers, apiListVehicles } = await import("../../lib/api");
        const [pending, emps] = await Promise.all([
          apiGetPendingUsers().catch(() => [] as UserData[]),
          apiListUsers().catch(() => [] as UserData[]),
        ]);
        setApiPendingUsers(pending);
        setApiEmployees(emps.filter((u) => u.verificationStatus === "APPROVED"));
      } catch {}
      setDataLoading(false);
    };
    loadData();
  }, [orgSlug]);

  /* Fallback to AppContext data if API returns empty */
  const orgApps = pendingApplications.filter((a) => a.orgSlug === orgSlug || a.orgSlug === "acme-corp");
  const pendingApps = apiPendingUsers.length > 0 ? apiPendingUsers : orgApps.filter((a) => a.status === "pending");
  const orgEmps = apiEmployees.length > 0 ? apiEmployees : employees.filter((e) => e.orgSlug === orgSlug || e.orgSlug === "acme-corp");
  const orgVehs = vehicles.filter((v) => v.orgSlug === orgSlug || v.orgSlug === "acme-corp");

  const orgConfig = configs[orgSlug] || {
    orgSlug,
    fuelCostPerKm: 0.18,
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
    } catch {}
    approveApplication(appId);
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
      } catch {}
      rejectApplication(appId);
    }
  };

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [empSearch, setEmpSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");


  /* Modals state */
  const [isAddEmpOpen, setIsAddEmpOpen] = useState(false);
  const [isAddVehOpen, setIsAddVehOpen] = useState(false);

  /* Form states for adding Employee */
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpEmail, setNewEmpEmail] = useState("");
  const [newEmpId, setNewEmpId] = useState("");
  const [newEmpDept, setNewEmpDept] = useState("Engineering");
  const [newEmpRole, setNewEmpRole] = useState("Team Member");

  /* Form states for adding Vehicle */
  const [newPlate, setNewPlate] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverEmpId, setNewDriverEmpId] = useState("");
  const [newSeats, setNewSeats] = useState(4);
  const [newFuelType, setNewFuelType] = useState<"Electric" | "Hybrid" | "Petrol" | "Diesel">("Electric");

  /* Image preview modal state */
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  /* Handlers */
  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName || !newEmpEmail || !newEmpId) return;
    addEmployee(orgSlug, {
      name: newEmpName,
      email: newEmpEmail,
      employeeId: newEmpId,
      department: newEmpDept,
      role: newEmpRole,
      carpoolAccess: true,
      status: "Active",
      joinedDate: new Date().toISOString().split("T")[0],
      totalRides: 0,
    });
    setIsAddEmpOpen(false);
    setNewEmpName("");
    setNewEmpEmail("");
    setNewEmpId("");
  };

  const handleAddVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate || !newModel || !newDriverName) return;
    addVehicle(orgSlug, {
      plateNumber: newPlate,
      model: newModel,
      driverName: newDriverName,
      driverEmployeeId: newDriverEmpId || "EMP-001",
      seatsAvailable: Number(newSeats),
      fuelType: newFuelType,
      verificationStatus: "Verified",
    });
    setIsAddVehOpen(false);
    setNewPlate("");
    setNewModel("");
    setNewDriverName("");
  };

  /* Calculated operational figures */
  const avgDistanceKm = 14.5;
  const costPerRideNoSubsidy = orgConfig.baseRideCharge + avgDistanceKm * orgConfig.fuelCostPerKm;
  const companySubsidyPerRide = (costPerRideNoSubsidy * orgConfig.subsidyPercent) / 100;
  const employeePayPerRide = costPerRideNoSubsidy - companySubsidyPerRide;

  const carpoolEnabledCount = (orgEmps as any[]).filter((e) => e.carpoolAccess).length;
  const totalEmployeesCount = orgEmps.length;
  const adoptionRatePercent = totalEmployeesCount > 0
    ? ((carpoolEnabledCount / totalEmployeesCount) * 100).toFixed(1)
    : "0.0";

  const totalAccumulatedRides = (orgEmps as any[]).reduce((sum, e) => sum + (e.totalRides || 0), 0);
  const totalRidesCount = totalAccumulatedRides > 0 ? totalAccumulatedRides : 48;
  const totalDistanceKm = totalRidesCount * avgDistanceKm;
  const co2OffsetKg = Math.round(totalDistanceKm * 0.12);
  const treesPlantedEquivalent = Math.round(co2OffsetKg / 21.7);
  const totalFuelCostSaved = (totalDistanceKm * orgConfig.fuelCostPerKm).toFixed(2);

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
            { id: "cost-config", label: "Fuel & Travel Costs", badge: null },
            { id: "analytics", label: "Participation", badge: null },
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
                  Manage organization registration grants, fleet drivers, carpool formulas, and cost rates.
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
                  {(orgEmps as any[]).filter((e) => e.status === "Active" || e.verificationStatus === "APPROVED").length}
                </div>
                <span className="text-xs text-emerald-800 bg-emerald-100 font-semibold px-2 py-0.5 rounded-full mt-2 inline-block">
                  {(orgEmps as any[]).filter((e) => e.carpoolAccess).length} Carpool Enabled
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
                  {orgVehs.filter((v) => v.verificationStatus === "Verified").length} Verified Vehicles
                </span>
              </div>

              <div className="bg-[#FCFAF5] border-2 border-dashed border-[#B6B6B6] rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-mono font-semibold text-[#173300]/60 uppercase tracking-wider">
                  Configured Fuel Rate
                </span>
                <div className="text-3xl font-extrabold font-heading text-[#173300] mt-2">
                  ${orgConfig.fuelCostPerKm.toFixed(2)} <span className="text-sm font-normal font-mono">/ km</span>
                </div>
                <span className="text-xs text-[#173300]/60 font-mono mt-2 inline-block">
                  {orgConfig.subsidyPercent}% Org Subsidy
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
                Review employee sign-up submissions, inspect uploaded company ID cards, and grant platform access.
              </p>
            </div>

            <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-2xl p-6 shadow-[6px_6px_0px_#173300] flex flex-col gap-6">
              {orgApps.length === 0 ? (
                <div className="py-12 text-center text-sm font-mono text-[#173300]/50">
                  No applications received yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {orgApps.map((app) => (
                    <div
                      key={app.id}
                      className={`border-2 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all ${
                        app.status === "pending"
                          ? "border-[#173300] bg-[#FCFAF5] shadow-[4px_4px_0px_#173300]"
                          : app.status === "approved"
                          ? "border-emerald-500 bg-emerald-50/50 opacity-90"
                          : "border-red-300 bg-red-50/50 opacity-80"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#173300]/50">
                            {app.department}
                          </span>
                          <h3 className="font-heading text-xl font-extrabold text-[#173300]">
                            {app.fullName}
                          </h3>
                          <div className="text-xs font-mono text-[#173300]/70 mt-0.5">
                            ID: <span className="font-bold text-[#173300]">{app.employeeId}</span>
                          </div>
                          <div className="text-xs text-[#173300]/60 mt-0.5">
                            {app.email}
                          </div>
                        </div>

                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                            app.status === "pending"
                              ? "bg-[#FFEB5B] text-[#173300] border-[#173300]"
                              : app.status === "approved"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-400"
                              : "bg-red-100 text-red-800 border-red-300"
                          }`}
                        >
                          {app.status === "pending" ? "● PENDING REVIEW" : app.status.toUpperCase()}
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
                              Submitted {app.submittedAt}
                            </div>
                          </div>
                        </div>
                        {app.idCardUrl && (
                          <button
                            onClick={() => setPreviewImage(app.idCardUrl || "/login-panel.png")}
                            className="px-3 py-1 bg-[#173300] text-[#FFEB5B] text-[11px] font-mono font-bold rounded-md hover:opacity-90"
                          >
                            Inspect ID Card
                          </button>
                        )}
                      </div>

                      {/* Action buttons */}
                      {app.status === "pending" ? (
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
                      ) : (
                        <div className="text-xs font-mono text-center text-[#173300]/60 pt-1 border-t border-dashed border-[#B6B6B6]">
                          Decision Recorded • Employee {app.status}
                        </div>
                      )}
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
                  Manage organization personnel, assign roles, and toggle carpool platform privileges.
                </p>
              </div>

              <button
                onClick={() => setIsAddEmpOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-bold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all shrink-0"
              >
                + Register New Employee
              </button>
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
                      <th className="pb-3 px-3 text-right">Rides Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-[#B6B6B6]/50 text-xs">
                    {filteredEmployees.map((emp) => {
                      const empName = emp.name || `${(emp as UserData).firstName || ""} ${(emp as UserData).lastName || ""}`.trim() || emp.email;
                      const empDept = emp.department || "General";
                      const empStatus = emp.status || ((emp as UserData).verificationStatus === "APPROVED" ? "Active" : (emp as UserData).verificationStatus || "Active");
                      const empTotalRides = emp.totalRides ?? 0;
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
                                empStatus === "Active"
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
                              onClick={() => toggleEmployeeAccess(emp.id)}
                              className={`px-3 py-1 rounded-full text-xs font-bold font-mono transition-all border ${
                                emp.carpoolAccess
                                  ? "bg-[#FFEB5B] text-[#173300] border-[#173300]"
                                  : "bg-gray-100 text-gray-500 border-gray-300"
                              }`}
                            >
                              {emp.carpoolAccess ? "ENABLED" : "DISABLED"}
                            </button>
                          </td>

                          <td className="py-3.5 px-3 text-right font-mono font-bold text-sm">
                            {empTotalRides}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB 4: VEHICLES & DRIVERS ══════════════ */}
        {activeTab === "vehicles" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="font-heading text-3xl font-extrabold text-[#173300]">
                  Registered Vehicles &amp; Drivers
                </h1>
                <p className="text-xs text-[#173300]/60 font-mono mt-1">
                  Manage carpooling fleet, license plates, seating capacity, and driver inspection status.
                </p>
              </div>

              <button
                onClick={() => setIsAddVehOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-bold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all shrink-0"
              >
                + Register Vehicle
              </button>
            </div>

            <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-2xl p-6 shadow-[6px_6px_0px_#173300] flex flex-col gap-6">
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
                          Plate: {veh.plateNumber}
                        </div>
                      </div>

                      <select
                        value={veh.verificationStatus}
                        onChange={(e) =>
                          updateVehicleStatus(veh.id, e.target.value as Vehicle["verificationStatus"])
                        }
                        className="text-[11px] font-mono font-bold px-2 py-1 rounded-lg border border-[#173300] bg-[#FCFAF5] outline-none"
                      >
                        <option value="Verified">Verified</option>
                        <option value="Pending Inspection">Pending</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    <div className="bg-[#173300]/[0.03] border border-dashed border-[#B6B6B6] rounded-xl p-3 font-mono text-xs flex justify-between items-center">
                      <div>
                        <span className="text-[#173300]/60 block text-[10px]">DRIVER NAME</span>
                        <span className="font-bold text-[#173300]">{veh.driverName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#173300]/60 block text-[10px]">SEATS AVAILABLE</span>
                        <span className="font-bold text-[#173300]">{veh.seatsAvailable} Seats</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                Configure organization-specific matching policies, rider limits, and restrictions.
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

              {/* Auto Match Toggle */}
              <div className="flex items-center justify-between p-4 bg-[#173300]/[0.03] border-2 border-dashed border-[#B6B6B6] rounded-2xl">
                <div>
                  <div className="font-bold text-sm text-[#173300]">Automated Route Matching</div>
                  <div className="text-xs text-[#173300]/60 mt-0.5">
                    Automatically match riders with overlapping commute paths.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={orgConfig.autoMatchEnabled}
                  onChange={(e) =>
                    updateOrgConfig(orgSlug, { autoMatchEnabled: e.target.checked })
                  }
                  className="w-5 h-5 accent-[#173300] cursor-pointer"
                />
              </div>

              {/* Department Restriction */}
              <div className="flex items-center justify-between p-4 bg-[#173300]/[0.03] border-2 border-dashed border-[#B6B6B6] rounded-2xl">
                <div>
                  <div className="font-bold text-sm text-[#173300]">Same Department Preference</div>
                  <div className="text-xs text-[#173300]/60 mt-0.5">
                    Prioritize carpool matches within the same department.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={orgConfig.departmentRestriction}
                  onChange={(e) =>
                    updateOrgConfig(orgSlug, { departmentRestriction: e.target.checked })
                  }
                  className="w-5 h-5 accent-[#173300] cursor-pointer"
                />
              </div>

              {/* Driver Priority Score */}
              <div className="flex items-center justify-between p-4 bg-[#173300]/[0.03] border-2 border-dashed border-[#B6B6B6] rounded-2xl">
                <div>
                  <div className="font-bold text-sm text-[#173300]">Driver Priority Scoring</div>
                  <div className="text-xs text-[#173300]/60 mt-0.5">
                    Reward frequent drivers with priority parking badges.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={orgConfig.driverPriorityScore}
                  onChange={(e) =>
                    updateOrgConfig(orgSlug, { driverPriorityScore: e.target.checked })
                  }
                  className="w-5 h-5 accent-[#173300] cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB 6: FUEL & TRAVEL COST CONFIGS ══════════════ */}
        {activeTab === "cost-config" && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="font-heading text-3xl font-extrabold text-[#173300]">
                Fuel &amp; Travel Cost Operational Setup
              </h1>
              <p className="text-xs text-[#173300]/60 font-mono mt-1">
                Maintain fuel per km rates, base charges, and company reimbursement percentage.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form Controls */}
              <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-2xl p-6 shadow-[6px_6px_0px_#173300] flex flex-col gap-6">
                <h3 className="font-heading text-xl font-extrabold text-[#173300]">
                  Cost Parameter Rates
                </h3>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono font-bold uppercase text-[#173300]/70">
                    Fuel Cost Rate ($ / kilometer)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={orgConfig.fuelCostPerKm}
                    onChange={(e) =>
                      updateOrgConfig(orgSlug, { fuelCostPerKm: Number(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] font-mono text-base font-bold text-[#173300] outline-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono font-bold uppercase text-[#173300]/70">
                    Base Travel Booking Fee ($)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={orgConfig.baseRideCharge}
                    onChange={(e) =>
                      updateOrgConfig(orgSlug, { baseRideCharge: Number(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] font-mono text-base font-bold text-[#173300] outline-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-mono font-bold uppercase">
                    <span className="text-[#173300]/70">Organization Subsidy Rate</span>
                    <span className="text-[#173300] text-sm">{orgConfig.subsidyPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={orgConfig.subsidyPercent}
                    onChange={(e) =>
                      updateOrgConfig(orgSlug, { subsidyPercent: Number(e.target.value) })
                    }
                    className="w-full accent-[#173300] cursor-pointer"
                  />
                </div>
              </div>

              {/* Real-time Calculation Simulator Card */}
              <div className="bg-[#173300] text-[#FFEB5B] border-2 border-[#173300] rounded-2xl p-6 shadow-[6px_6px_0px_#173300] flex flex-col justify-between gap-6">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FFEB5B]/60">
                    Live Travel Cost Calculation Formula
                  </span>
                  <h3 className="font-heading text-2xl font-extrabold mt-1">
                    Sample Commute Simulation
                  </h3>
                  <p className="text-xs text-[#FCFAF5]/80 mt-1 font-mono">
                    Based on average 14.5 km commute trip:
                  </p>
                </div>

                <div className="bg-[#FCFAF5]/10 border border-[#FFEB5B]/30 rounded-xl p-4 font-mono text-xs space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#FCFAF5]/70">Distance (Avg):</span>
                    <span className="font-bold text-[#FCFAF5]">14.5 km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#FCFAF5]/70">Fuel Cost (14.5 × ${orgConfig.fuelCostPerKm.toFixed(2)}):</span>
                    <span className="font-bold text-[#FCFAF5]">
                      ${(14.5 * orgConfig.fuelCostPerKm).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#FCFAF5]/70">Base Charge:</span>
                    <span className="font-bold text-[#FCFAF5]">${orgConfig.baseRideCharge.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-[#FFEB5B]/30 pt-2 flex justify-between font-bold text-sm">
                    <span>Total Commute Cost:</span>
                    <span className="text-[#FFEB5B]">${costPerRideNoSubsidy.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-[#FFEB5B] text-[#173300] rounded-xl p-4 font-mono text-xs flex justify-between items-center shadow-[3px_3px_0px_#173300]">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#173300]/60">
                      Company Subsidy ({orgConfig.subsidyPercent}%)
                    </span>
                    <span className="font-extrabold text-base">
                      -${companySubsidyPerRide.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] uppercase font-bold text-[#173300]/60">
                      Employee Pay Out-of-Pocket
                    </span>
                    <span className="font-extrabold text-base">
                      ${employeePayPerRide.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB 7: PARTICIPATION & ANALYTICS ══════════════ */}
        {activeTab === "analytics" && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="font-heading text-3xl font-extrabold text-[#173300]">
                Carpool Participation &amp; Impact
              </h1>
              <p className="text-xs text-[#173300]/60 font-mono mt-1">
                Track sustainability milestones, fuel saved, and top participating employees.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-2xl p-6 shadow-[5px_5px_0px_#173300] flex flex-col gap-2">
                <span className="text-xs font-mono font-bold text-[#173300]/60 uppercase">
                  CO₂ Carbon Offsets
                </span>
                <div className="text-3xl font-extrabold font-heading text-[#173300]">
                  {co2OffsetKg.toLocaleString()} kg
                </div>
                <p className="text-xs text-emerald-800 font-semibold mt-1">
                  Equivalent to planting {treesPlantedEquivalent} trees
                </p>
              </div>

              <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-2xl p-6 shadow-[5px_5px_0px_#173300] flex flex-col gap-2">
                <span className="text-xs font-mono font-bold text-[#173300]/60 uppercase">
                  Total Shared Rides
                </span>
                <div className="text-3xl font-extrabold font-heading text-[#173300]">
                  {totalRidesCount} Rides
                </div>
                <p className="text-xs text-[#173300]/60 font-mono mt-1">
                  Calculated from employee ride logs
                </p>
              </div>

              <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-2xl p-6 shadow-[5px_5px_0px_#173300] flex flex-col gap-2">
                <span className="text-xs font-mono font-bold text-[#173300]/60 uppercase">
                  Fuel Cost Saved
                </span>
                <div className="text-3xl font-extrabold font-heading text-[#173300]">
                  ${Number(totalFuelCostSaved).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-[#173300]/60 font-mono mt-1">
                  Saved across company workforce
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ════════════════════════════════════════════════════
          ADD EMPLOYEE MODAL
         ════════════════════════════════════════════════════ */}
      {isAddEmpOpen && (
        <div className="fixed inset-0 z-50 bg-[#173300]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 max-w-md w-full shadow-[8px_8px_0px_#173300] relative">
            <button
              onClick={() => setIsAddEmpOpen(false)}
              className="absolute top-4 right-4 text-sm font-bold w-8 h-8 rounded-full border border-[#173300] flex items-center justify-center hover:bg-[#FFEB5B]"
            >
              ✕
            </button>

            <h2 className="font-heading text-2xl font-extrabold text-[#173300] mb-4">
              Register New Employee
            </h2>

            <form onSubmit={handleAddEmployeeSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                value={newEmpName}
                onChange={(e) => setNewEmpName(e.target.value)}
                placeholder="Full Name"
                required
                className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-semibold outline-none"
              />
              <input
                type="email"
                value={newEmpEmail}
                onChange={(e) => setNewEmpEmail(e.target.value)}
                placeholder="Work Email"
                required
                className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-semibold outline-none"
              />
              <input
                type="text"
                value={newEmpId}
                onChange={(e) => setNewEmpId(e.target.value)}
                placeholder="Employee ID (e.g. EMP-992)"
                required
                className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-semibold outline-none"
              />
              <select
                value={newEmpDept}
                onChange={(e) => setNewEmpDept(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-semibold outline-none"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product Design">Product Design</option>
                <option value="Supply Chain">Supply Chain</option>
                <option value="Operations & Logistics">Operations &amp; Logistics</option>
              </select>

              <button
                type="submit"
                className="mt-2 w-full py-3 rounded-xl bg-[#173300] text-[#FFEB5B] font-bold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300]"
              >
                Save Employee Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          ADD VEHICLE MODAL
         ════════════════════════════════════════════════════ */}
      {isAddVehOpen && (
        <div className="fixed inset-0 z-50 bg-[#173300]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 max-w-md w-full shadow-[8px_8px_0px_#173300] relative">
            <button
              onClick={() => setIsAddVehOpen(false)}
              className="absolute top-4 right-4 text-sm font-bold w-8 h-8 rounded-full border border-[#173300] flex items-center justify-center hover:bg-[#FFEB5B]"
            >
              ✕
            </button>

            <h2 className="font-heading text-2xl font-extrabold text-[#173300] mb-4">
              Register Carpool Vehicle
            </h2>

            <form onSubmit={handleAddVehicleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="Vehicle Model (e.g. Tesla Model 3)"
                required
                className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-semibold outline-none"
              />
              <input
                type="text"
                value={newPlate}
                onChange={(e) => setNewPlate(e.target.value)}
                placeholder="Plate Number (e.g. CA 998-XX)"
                required
                className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-semibold outline-none"
              />
              <input
                type="text"
                value={newDriverName}
                onChange={(e) => setNewDriverName(e.target.value)}
                placeholder="Driver Full Name"
                required
                className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-semibold outline-none"
              />
              <select
                value={newFuelType}
                onChange={(e) => setNewFuelType(e.target.value as typeof newFuelType)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-semibold outline-none"
              >
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
              </select>

              <button
                type="submit"
                className="mt-2 w-full py-3 rounded-xl bg-[#173300] text-[#FFEB5B] font-bold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300]"
              >
                Register Vehicle
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          IMAGE INSPECT MODAL
         ════════════════════════════════════════════════════ */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-[#173300]/70 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-4 max-w-lg w-full shadow-[10px_10px_0px_#173300] relative flex flex-col items-center">
            <img
              src={previewImage}
              alt="Uploaded ID preview"
              className="w-full h-80 object-cover rounded-2xl border border-[#173300]"
            />
            <p className="text-xs font-mono font-bold text-[#173300] mt-3">
              Click anywhere to close inspection
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
