/**
 * Enterprise Carpooling Platform — API Client Utility
 * Handles REST requests to http://localhost:3000/api/v1 with JWT Bearer authentication.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

/* ── Helpers to manage tokens ───────────────────────── */
export function getAccessToken(): string | null {
  if (typeof document === "undefined") return null;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("access-token="))
    ?.split("=")[1] || null;
}

export function setTokens(accessToken: string, refreshToken?: string) {
  if (typeof document === "undefined") return;
  document.cookie = `access-token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}`;
  if (refreshToken) {
    document.cookie = `refresh-token=${refreshToken}; path=/; max-age=${60 * 60 * 24 * 30}`;
  }
}

export function clearTokens() {
  if (typeof document === "undefined") return;
  document.cookie = "access-token=; path=/; max-age=0";
  document.cookie = "refresh-token=; path=/; max-age=0";
  document.cookie = "auth-token=; path=/; max-age=0";
}

/* ── Base Fetch Wrapper ─────────────────────────────── */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  customToken?: string
): Promise<T> {
  const token = customToken || getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.errors?.[0]?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

/* ── Auth Module API Calls ─────────────────────────── */
export async function apiLogin(email: string, password: string) {
  const data = await fetchApi<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: "SUPER_ADMIN" | "ORG_ADMIN" | "USER";
      orgId?: string;
      verificationStatus: "APPROVED" | "PENDING" | "REJECTED";
    };
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (data.accessToken) {
    setTokens(data.accessToken, data.refreshToken);
  }
  return data;
}

export async function apiRegisterUser(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  orgId: string;
  employeeId?: string;
}) {
  return fetchApi<{
    message: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      verificationStatus: string;
    };
    pendingToken: string;
  }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiUploadIdProof(pendingToken: string, file: File) {
  const formData = new FormData();
  formData.append("idProof", file);

  return fetchApi<{
    message: string;
    userId: string;
    verificationStatus: string;
  }>(
    "/auth/register/id-proof",
    {
      method: "POST",
      body: formData,
    },
    pendingToken
  );
}

/* ── Organization Module API Calls ───────────────────── */
export async function apiListOrganizations() {
  return fetchApi<
    Array<{
      id: string;
      name: string;
      slug?: string;
      status?: string;
      _count?: { users: number };
    }>
  >("/orgs");
}

export async function apiCreateOrganization(payload: {
  name: string;
  slug?: string;
  fuelCostPerLitre?: number;
  costPerKmDefault?: number;
  status?: string;
}) {
  return fetchApi<{
    id: string;
    name: string;
    slug?: string;
    status?: string;
  }>("/orgs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiProvisionOrgAdmin(
  orgId: string,
  payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }
) {
  return fetchApi<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  }>(`/orgs/${orgId}/admins`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateOrgSettings(
  orgId: string,
  payload: {
    fuelCostPerLitre?: number;
    costPerKmDefault?: number;
    subsidyPercent?: number;
    baseRideCharge?: number;
    maxRidersPerCarpool?: number;
    autoMatchEnabled?: boolean;
    departmentRestriction?: boolean;
  }
) {
  return fetchApi(`/orgs/${orgId}/settings`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/* ── User & Approvals Module API Calls ──────────────── */
export async function apiGetPendingUsers(orgId?: string) {
  const query = orgId ? `?orgId=${orgId}` : "";
  return fetchApi<
    Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      employeeId?: string;
      department?: string;
      verificationStatus: string;
      idProofPath?: string;
      idProofUploadedAt?: string;
    }>
  >(`/users/pending${query}`);
}

export async function apiApproveUser(userId: string) {
  return fetchApi<{ message: string; user: { id: string; verificationStatus: string } }>(
    `/users/${userId}/approve`,
    {
      method: "PATCH",
    }
  );
}

export async function apiRejectUser(userId: string, rejectionReason: string) {
  return fetchApi<{ message: string; user: { id: string; verificationStatus: string } }>(
    `/users/${userId}/reject`,
    {
      method: "PATCH",
      body: JSON.stringify({ rejectionReason }),
    }
  );
}
