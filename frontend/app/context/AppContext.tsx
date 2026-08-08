"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

/* ── Types ─────────────────────────────────────────── */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  adminId: string;
  adminPassword: string;
  createdAt: string;
  employeeCount: number;
  vehicleCount: number;
  status: "Active" | "Pending Setup" | "Suspended";
}

export interface PendingApplication {
  id: string;
  orgSlug: string;
  orgName: string;
  fullName: string;
  email: string;
  employeeId: string;
  idCardUrl?: string;
  department: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

export interface Employee {
  id: string;
  orgSlug: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  role: string;
  carpoolAccess: boolean;
  status: "Active" | "Pending Verification" | "Inactive";
  joinedDate: string;
  totalRides: number;
}

export interface Vehicle {
  id: string;
  orgSlug: string;
  plateNumber: string;
  model: string;
  driverName: string;
  driverEmployeeId: string;
  seatsAvailable: number;
  fuelType: "Electric" | "Hybrid" | "Petrol" | "Diesel";
  verificationStatus: "Verified" | "Pending Inspection" | "Rejected";
}

export interface OrgConfig {
  orgSlug: string;
  fuelCostPerKm: number;
  baseRideCharge: number;
  subsidyPercent: number;
  maxRidersPerCarpool: number;
  autoMatchEnabled: boolean;
  departmentRestriction: boolean;
  driverPriorityScore: boolean;
  carpoolEnabledGlobally: boolean;
}

interface AppContextValue {
  organizations: Organization[];
  pendingApplications: PendingApplication[];
  employees: Employee[];
  vehicles: Vehicle[];
  configs: Record<string, OrgConfig>;
  createOrganization: (name: string, adminId: string, adminPassword: string) => Organization;
  updateOrganization: (id: string, updates: Partial<Organization>) => void;
  approveApplication: (appId: string) => void;
  rejectApplication: (appId: string) => void;
  toggleEmployeeAccess: (empId: string) => void;
  addEmployee: (orgSlug: string, emp: Omit<Employee, "id" | "orgSlug">) => void;
  addVehicle: (orgSlug: string, vehicle: Omit<Vehicle, "id" | "orgSlug">) => void;
  updateVehicleStatus: (vehicleId: string, status: Vehicle["verificationStatus"]) => void;
  updateOrgConfig: (orgSlug: string, updates: Partial<OrgConfig>) => void;
}

/* ── Initial Clean Arrays (No Mock / Dummy Data) ───── */

const INITIAL_ORGS: Organization[] = [];
const INITIAL_APPLICATIONS: PendingApplication[] = [];
const INITIAL_EMPLOYEES: Employee[] = [];
const INITIAL_VEHICLES: Vehicle[] = [];
const DEFAULT_CONFIGS: Record<string, OrgConfig> = {};

/* ── Context Creation ──────────────────────────────── */

const AppContext = createContext<AppContextValue>({
  organizations: [],
  pendingApplications: [],
  employees: [],
  vehicles: [],
  configs: {},
  createOrganization: () => ({} as Organization),
  approveApplication: () => {},
  rejectApplication: () => {},
  toggleEmployeeAccess: () => {},
  addEmployee: () => {},
  addVehicle: () => {},
  updateVehicleStatus: () => {},
  updateOrgConfig: () => {},
  updateOrganization: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>(INITIAL_ORGS);
  const [pendingApplications, setPendingApplications] = useState<PendingApplication[]>(INITIAL_APPLICATIONS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [configs, setConfigs] = useState<Record<string, OrgConfig>>(DEFAULT_CONFIGS);

  // Load from localStorage if available
  useEffect(() => {
    try {
      const savedOrgs = localStorage.getItem("oddo_orgs");
      if (savedOrgs) setOrganizations(JSON.parse(savedOrgs));

      const savedApps = localStorage.getItem("oddo_apps");
      if (savedApps) setPendingApplications(JSON.parse(savedApps));

      const savedEmps = localStorage.getItem("oddo_emps");
      if (savedEmps) setEmployees(JSON.parse(savedEmps));

      const savedVehs = localStorage.getItem("oddo_vehs");
      if (savedVehs) setVehicles(JSON.parse(savedVehs));

      const savedConfigs = localStorage.getItem("oddo_configs");
      if (savedConfigs) setConfigs(JSON.parse(savedConfigs));
    } catch {
      // Ignore fallback
    }
  }, []);

  // Save changes
  const saveOrgs = (data: Organization[]) => {
    setOrganizations(data);
    try { localStorage.setItem("oddo_orgs", JSON.stringify(data)); } catch {}
  };
  const saveApps = (data: PendingApplication[]) => {
    setPendingApplications(data);
    try { localStorage.setItem("oddo_apps", JSON.stringify(data)); } catch {}
  };
  const saveEmps = (data: Employee[]) => {
    setEmployees(data);
    try { localStorage.setItem("oddo_emps", JSON.stringify(data)); } catch {}
  };
  const saveVehs = (data: Vehicle[]) => {
    setVehicles(data);
    try { localStorage.setItem("oddo_vehs", JSON.stringify(data)); } catch {}
  };
  const saveConfigs = (data: Record<string, OrgConfig>) => {
    setConfigs(data);
    try { localStorage.setItem("oddo_configs", JSON.stringify(data)); } catch {}
  };

  const createOrganization = useCallback(
    (name: string, adminId: string, adminPassword: string): Organization => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const newOrg: Organization = {
        id: `org-${Date.now()}`,
        name,
        slug,
        adminId,
        adminPassword,
        createdAt: new Date().toISOString().split("T")[0],
        employeeCount: 0,
        vehicleCount: 0,
        status: "Active",
      };
      saveOrgs([...organizations, newOrg]);

      // Initialize defaultConfig
      saveConfigs({
        ...configs,
        [slug]: {
          orgSlug: slug,
          fuelCostPerKm: 0.2,
          baseRideCharge: 2.5,
          subsidyPercent: 50,
          maxRidersPerCarpool: 4,
          autoMatchEnabled: true,
          departmentRestriction: false,
          driverPriorityScore: true,
          carpoolEnabledGlobally: true,
        },
      });

      return newOrg;
    },
    [organizations, configs]
  );

  const approveApplication = useCallback(
    (appId: string) => {
      const app = pendingApplications.find((a) => a.id === appId);
      if (!app) return;

      // Update app status
      const updatedApps = pendingApplications.map((a) =>
        a.id === appId ? { ...a, status: "approved" as const } : a
      );
      saveApps(updatedApps);

      // Create new employee
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        orgSlug: app.orgSlug,
        employeeId: app.employeeId,
        name: app.fullName,
        email: app.email,
        department: app.department,
        role: "Team Member",
        carpoolAccess: true,
        status: "Active",
        joinedDate: new Date().toISOString().split("T")[0],
        totalRides: 0,
      };
      saveEmps([...employees, newEmp]);

      // Bump count
      const updatedOrgs = organizations.map((o) =>
        o.slug === app.orgSlug ? { ...o, employeeCount: o.employeeCount + 1 } : o
      );
      saveOrgs(updatedOrgs);
    },
    [pendingApplications, employees, organizations]
  );

  const rejectApplication = useCallback(
    (appId: string) => {
      const updatedApps = pendingApplications.map((a) =>
        a.id === appId ? { ...a, status: "rejected" as const } : a
      );
      saveApps(updatedApps);
    },
    [pendingApplications]
  );

  const toggleEmployeeAccess = useCallback(
    (empId: string) => {
      const updated = employees.map((e) =>
        e.id === empId ? { ...e, carpoolAccess: !e.carpoolAccess } : e
      );
      saveEmps(updated);
    },
    [employees]
  );

  const addEmployee = useCallback(
    (orgSlug: string, empData: Omit<Employee, "id" | "orgSlug">) => {
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        orgSlug,
        ...empData,
      };
      saveEmps([...employees, newEmp]);
      const updatedOrgs = organizations.map((o) =>
        o.slug === orgSlug ? { ...o, employeeCount: o.employeeCount + 1 } : o
      );
      saveOrgs(updatedOrgs);
    },
    [employees, organizations]
  );

  const addVehicle = useCallback(
    (orgSlug: string, vehicleData: Omit<Vehicle, "id" | "orgSlug">) => {
      const newVeh: Vehicle = {
        id: `veh-${Date.now()}`,
        orgSlug,
        ...vehicleData,
      };
      saveVehs([...vehicles, newVeh]);
      const updatedOrgs = organizations.map((o) =>
        o.slug === orgSlug ? { ...o, vehicleCount: o.vehicleCount + 1 } : o
      );
      saveOrgs(updatedOrgs);
    },
    [vehicles, organizations]
  );

  const updateVehicleStatus = useCallback(
    (vehicleId: string, status: Vehicle["verificationStatus"]) => {
      const updated = vehicles.map((v) =>
        v.id === vehicleId ? { ...v, verificationStatus: status } : v
      );
      saveVehs(updated);
    },
    [vehicles]
  );

  const updateOrgConfig = useCallback(
    (orgSlug: string, updates: Partial<OrgConfig>) => {
      const current = configs[orgSlug] || {
        orgSlug,
        fuelCostPerKm: 0.2,
        baseRideCharge: 2.5,
        subsidyPercent: 50,
        maxRidersPerCarpool: 4,
        autoMatchEnabled: true,
        departmentRestriction: false,
        driverPriorityScore: true,
        carpoolEnabledGlobally: true,
      };
      saveConfigs({
        ...configs,
        [orgSlug]: { ...current, ...updates },
      });
    },
    [configs]
  );

  const updateOrganization = useCallback(
    (id: string, updates: Partial<Organization>) => {
      const updated = organizations.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      );
      saveOrgs(updated);
    },
    [organizations]
  );

  return (
    <AppContext.Provider
      value={{
        organizations,
        pendingApplications,
        employees,
        vehicles,
        configs,
        createOrganization,
        updateOrganization,
        approveApplication,
        rejectApplication,
        toggleEmployeeAccess,
        addEmployee,
        addVehicle,
        updateVehicleStatus,
        updateOrgConfig,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
