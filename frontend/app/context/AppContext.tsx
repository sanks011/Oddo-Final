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
  fuelCostPerKm: number; // e.g. 0.18 $/km
  baseRideCharge: number; // e.g. 2.50 $
  subsidyPercent: number; // e.g. 50%
  maxRidersPerCarpool: number; // e.g. 4
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

/* ── Pre-seeded Mock Data ───────────────────────────── */

const INITIAL_ORGS: Organization[] = [];

const INITIAL_APPLICATIONS: PendingApplication[] = [
  {
    id: "app-101",
    orgSlug: "acme-corp",
    orgName: "Acme Corp",
    fullName: "Elena Rostova",
    email: "elena.r@acme.com",
    employeeId: "EMP-4091",
    idCardUrl: "/hero-sketch.png",
    department: "Hardware Engineering",
    submittedAt: "2 hours ago",
    status: "pending",
  },
  {
    id: "app-102",
    orgSlug: "acme-corp",
    orgName: "Acme Corp",
    fullName: "Marcus Vance",
    email: "marcus.v@acme.com",
    employeeId: "EMP-4092",
    idCardUrl: "/client.png",
    department: "Operations & Logistics",
    submittedAt: "5 hours ago",
    status: "pending",
  },
  {
    id: "app-103",
    orgSlug: "novatech-industries",
    orgName: "NovaTech Industries",
    fullName: "Sophia Lin",
    email: "sophia.l@novatech.io",
    employeeId: "NT-8812",
    idCardUrl: "/meeting.png",
    department: "R&D",
    submittedAt: "1 day ago",
    status: "pending",
  },
];

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "emp-1",
    orgSlug: "acme-corp",
    employeeId: "EMP-1001",
    name: "David Chen",
    email: "david.c@acme.com",
    department: "Engineering",
    role: "Senior Embedded Engineer",
    carpoolAccess: true,
    status: "Active",
    joinedDate: "2024-03-12",
    totalRides: 34,
  },
  {
    id: "emp-2",
    orgSlug: "acme-corp",
    employeeId: "EMP-1002",
    name: "Sarah Jenkins",
    email: "sarah.j@acme.com",
    department: "Product Design",
    role: "Lead UI Designer",
    carpoolAccess: true,
    status: "Active",
    joinedDate: "2024-05-19",
    totalRides: 28,
  },
  {
    id: "emp-3",
    orgSlug: "acme-corp",
    employeeId: "EMP-1003",
    name: "Michael Chang",
    email: "michael.c@acme.com",
    department: "Supply Chain",
    role: "Inventory Analyst",
    carpoolAccess: false,
    status: "Pending Verification",
    joinedDate: "2026-07-01",
    totalRides: 0,
  },
  {
    id: "emp-4",
    orgSlug: "novatech-industries",
    employeeId: "NT-101",
    name: "James Wilson",
    email: "james.w@novatech.io",
    department: "AI Research",
    role: "Principal Scientist",
    carpoolAccess: true,
    status: "Active",
    joinedDate: "2025-01-10",
    totalRides: 42,
  },
];

const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: "veh-1",
    orgSlug: "acme-corp",
    plateNumber: "CA 8XYZ94",
    model: "Tesla Model Y (White)",
    driverName: "David Chen",
    driverEmployeeId: "EMP-1001",
    seatsAvailable: 3,
    fuelType: "Electric",
    verificationStatus: "Verified",
  },
  {
    id: "veh-2",
    orgSlug: "acme-corp",
    plateNumber: "CA 4LMN22",
    model: "Toyota RAV4 Hybrid (Silver)",
    driverName: "Sarah Jenkins",
    driverEmployeeId: "EMP-1002",
    seatsAvailable: 4,
    fuelType: "Hybrid",
    verificationStatus: "Verified",
  },
  {
    id: "veh-3",
    orgSlug: "novatech-industries",
    plateNumber: "NY K90-221",
    model: "Honda Civic Sedan (Blue)",
    driverName: "James Wilson",
    driverEmployeeId: "NT-101",
    seatsAvailable: 3,
    fuelType: "Petrol",
    verificationStatus: "Pending Inspection",
  },
];

const DEFAULT_CONFIGS: Record<string, OrgConfig> = {
  "acme-corp": {
    orgSlug: "acme-corp",
    fuelCostPerKm: 0.18,
    baseRideCharge: 2.5,
    subsidyPercent: 50,
    maxRidersPerCarpool: 4,
    autoMatchEnabled: true,
    departmentRestriction: false,
    driverPriorityScore: true,
    carpoolEnabledGlobally: true,
  },
  "novatech-industries": {
    orgSlug: "novatech-industries",
    fuelCostPerKm: 0.22,
    baseRideCharge: 3.0,
    subsidyPercent: 40,
    maxRidersPerCarpool: 3,
    autoMatchEnabled: true,
    departmentRestriction: true,
    driverPriorityScore: false,
    carpoolEnabledGlobally: true,
  },
  "skyline-ventures": {
    orgSlug: "skyline-ventures",
    fuelCostPerKm: 0.2,
    baseRideCharge: 2.0,
    subsidyPercent: 60,
    maxRidersPerCarpool: 4,
    autoMatchEnabled: false,
    departmentRestriction: false,
    driverPriorityScore: true,
    carpoolEnabledGlobally: true,
  },
};

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
