/**
 * Enterprise Carpooling Platform — API Client
 * Backend: https://windows-virus-dsufygbauygroyiausgfiysrgf.onrender.com/api/v1
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://windows-virus-dsufygbauygroyiausgfiysrgf.onrender.com/api/v1";

/* ── Token helpers ─────────────────────────────────── */
export function getAccessToken(): string | null {
  if (typeof document === "undefined") return null;
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("access-token="))
      ?.split("=")[1] || null
  );
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
  document.cookie = "super-admin-auth=; path=/; max-age=0";
}

/* ── Base fetch wrapper ─────────────────────────────── */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  customToken?: string
): Promise<T> {
  const token = customToken ?? getAccessToken();
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

  const text = await response.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = {}; }

  if (!response.ok) {
    const msg =
      data?.message ||
      data?.errors?.[0]?.message ||
      `Request failed: ${response.status}`;
    throw new Error(msg);
  }

  return data as T;
}

/* ════════════════════════════════════════════════════
   MODULE 1 — AUTH
   ════════════════════════════════════════════════════ */

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
      orgSlug?: string;
      verificationStatus: "APPROVED" | "PENDING" | "REJECTED";
    };
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (data.accessToken) setTokens(data.accessToken, data.refreshToken);
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
    user: { id: string; email: string; verificationStatus: string };
    pendingToken: string;
  }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiUploadIdProof(pendingToken: string, file: File) {
  const formData = new FormData();
  formData.append("idProof", file);
  return fetchApi<{ message: string; userId: string; verificationStatus: string }>(
    "/auth/register/id-proof",
    { method: "POST", body: formData },
    pendingToken
  );
}

export async function apiRefreshToken(refreshToken: string) {
  return fetchApi<{ accessToken: string }>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function apiLogout(refreshToken: string) {
  return fetchApi<{ message: string }>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

/* ════════════════════════════════════════════════════
   MODULE 2 — ORGANIZATIONS
   ════════════════════════════════════════════════════ */

export interface OrgData {
  id: string;
  name: string;
  slug?: string;
  status?: string;
  _count?: { users: number };
}

export async function apiListPublicOrganizations(): Promise<Array<{ id: string; name: string; slug: string }>> {
  return fetchApi<Array<{ id: string; name: string; slug: string }>>("/orgs/public");
}

export async function apiListOrganizations(): Promise<OrgData[]> {
  return fetchApi<OrgData[]>("/orgs");
}

export async function apiGetOrganization(orgId: string): Promise<OrgData> {
  return fetchApi<OrgData>(`/orgs/${orgId}`);
}

export async function apiCreateOrganization(payload: {
  name: string;
  slug?: string;
  status?: string;
}): Promise<OrgData> {
  const res = await fetchApi<any>("/orgs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const rawObj = res?.org || res?.data || res;
  return {
    ...rawObj,
    id: rawObj?.id || rawObj?._id || rawObj?.orgId || "",
  } as OrgData;
}

export async function apiUpdateOrganization(
  orgId: string,
  payload: Partial<{ name: string; status: string }>
) {
  return fetchApi<OrgData>(`/orgs/${orgId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteOrganization(orgId: string) {
  return fetchApi<{ message: string }>(`/orgs/${orgId}`, {
    method: "DELETE",
  });
}

export async function apiProvisionOrgAdmin(
  orgId: string,
  payload: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }
) {
  return fetchApi<{ id: string; email: string; role: string }>(
    `/orgs/${orgId}/admins`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export async function apiUpdateOrgSettings(
  orgId: string,
  payload: {
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

/* ════════════════════════════════════════════════════
   MODULE 3 — USERS
   ════════════════════════════════════════════════════ */

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  name?: string;
  phone?: string;
  employeeId?: string;
  role: string;
  department?: string;
  orgId?: string;
  verificationStatus: string;
  status?: string;
  carpoolAccess?: boolean;
  rating?: number;
  totalRides?: number;
  idProofPath?: string;
  idProofUploadedAt?: string;
}

export async function apiGetPendingUsers(orgId?: string): Promise<UserData[]> {
  const query = orgId ? `?orgId=${orgId}` : "";
  return fetchApi<UserData[]>(`/users/pending${query}`);
}

export async function apiListUsers(orgId?: string): Promise<UserData[]> {
  const query = orgId ? `?orgId=${orgId}` : "";
  return fetchApi<UserData[]>(`/users${query}`);
}

export async function apiGetUser(userId: string): Promise<UserData> {
  return fetchApi<UserData>(`/users/${userId}`);
}

export async function apiUpdateUser(
  userId: string,
  payload: Partial<{ firstName: string; lastName: string; phone: string; carpoolAccess: boolean }>
) {
  return fetchApi<UserData>(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function apiApproveUser(userId: string) {
  return fetchApi<{ message: string; user: { id: string; verificationStatus: string } }>(
    `/users/${userId}/approve`,
    { method: "PATCH" }
  );
}

export async function apiRejectUser(userId: string, rejectionReason: string) {
  return fetchApi<{ message: string; user: { id: string; verificationStatus: string } }>(
    `/users/${userId}/reject`,
    { method: "PATCH", body: JSON.stringify({ rejectionReason }) }
  );
}

export function getIdProofUrl(userId: string): string {
  const token = getAccessToken();
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${API_BASE_URL}/users/${userId}/id-proof${query}`;
}

/* ════════════════════════════════════════════════════
   MODULE 4 — VEHICLES
   ════════════════════════════════════════════════════ */

export interface VehicleData {
  id: string;
  model: string;
  registrationNumber: string;
  seatingCapacity: number;
  fuelType: "PETROL" | "DIESEL" | "ELECTRIC" | "HYBRID";
  status: "VERIFIED" | "PENDING" | "REJECTED";
  licensePath?: string;
  rejectionReason?: string;
  ownerId?: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    orgId?: string;
  };
}

export async function apiListVehicles(includeOrg = true): Promise<VehicleData[]> {
  const query = includeOrg ? "?all=true" : "";
  return fetchApi<VehicleData[]>(`/vehicles${query}`);
}

export async function apiGetPendingVehicles(): Promise<VehicleData[]> {
  return fetchApi<VehicleData[]>("/vehicles/pending");
}

export async function apiCreateVehicle(formData: FormData): Promise<VehicleData> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}/vehicles`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to register vehicle");
  }
  return data;
}

export async function apiApproveVehicle(vehicleId: string): Promise<{ message: string; vehicle: VehicleData }> {
  return fetchApi<{ message: string; vehicle: VehicleData }>(`/vehicles/${vehicleId}/approve`, {
    method: "PATCH",
  });
}

export async function apiRejectVehicle(vehicleId: string, rejectionReason: string): Promise<{ message: string; vehicle: VehicleData }> {
  return fetchApi<{ message: string; vehicle: VehicleData }>(`/vehicles/${vehicleId}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ rejectionReason }),
  });
}

export function getVehicleLicenseUrl(vehicleId: string): string {
  const token = getAccessToken();
  return `${API_BASE_URL}/vehicles/${vehicleId}/license${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

export async function apiUpdateVehicle(
  vehicleId: string,
  payload: Partial<{ model: string; seatingCapacity: number }>
): Promise<VehicleData> {
  return fetchApi<VehicleData>(`/vehicles/${vehicleId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteVehicle(vehicleId: string) {
  return fetchApi<{ message: string }>(`/vehicles/${vehicleId}`, {
    method: "DELETE",
  });
}

/* ════════════════════════════════════════════════════
   MODULE 5 — SAVED PLACES
   ════════════════════════════════════════════════════ */

export interface SavedPlaceData {
  id: string;
  label: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export async function apiListSavedPlaces(): Promise<SavedPlaceData[]> {
  return fetchApi<SavedPlaceData[]>("/settings/saved-places");
}

export async function apiCreateSavedPlace(payload: {
  label: string;
  address: string;
  latitude?: number;
  longitude?: number;
}): Promise<SavedPlaceData> {
  return fetchApi<SavedPlaceData>("/settings/saved-places", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteSavedPlace(placeId: string) {
  return fetchApi<{ message: string }>(`/settings/saved-places/${placeId}`, {
    method: "DELETE",
  });
}

/* ════════════════════════════════════════════════════
   MODULE 6 — RIDES
   ════════════════════════════════════════════════════ */

export interface RideData {
  id: string;
  driverId: string;
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    rating?: number;
  };
  vehicle?: { id: string; model: string; registrationNumber: string };
  vehicleId?: string;
  pickupLabel: string;
  pickupLat: number;
  pickupLng: number;
  destinationLabel: string;
  destinationLat: number;
  destinationLng: number;
  departureAt: string;
  availableSeats: number;
  farePerSeat: number;
  status: string;
  routeDistanceKm?: number;
  routeDurationMinutes?: number;
  routeGeometry?: string;
  isRecurring?: boolean;
  orgId?: string;
}

export async function apiSearchRides(payload: {
  pickupLat: number;
  pickupLng: number;
  pickupLabel: string;
  destinationLat: number;
  destinationLng: number;
  destinationLabel: string;
  departureDate: string;
  departureTime?: string;
  seatsNeeded: number;
  isRecurring?: boolean;
}): Promise<{ searchRoute: { distanceKm: number; durationMinutes: number; routeGeometry?: string }; rides: RideData[] }> {
  return fetchApi("/rides/search", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiPublishRide(payload: {
  vehicleId: string;
  pickupLabel: string;
  pickupLat: number;
  pickupLng: number;
  destinationLabel: string;
  destinationLat: number;
  destinationLng: number;
  departureAt: string;
  availableSeats: number;
  farePerSeat: number;
  isRecurring?: boolean;
}): Promise<RideData> {
  return fetchApi<RideData>("/rides", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiGetRide(rideId: string): Promise<RideData> {
  return fetchApi<RideData>(`/rides/${rideId}`);
}

/* ════════════════════════════════════════════════════
   MODULE 7 — JOIN REQUESTS
   ════════════════════════════════════════════════════ */

export async function apiSubmitJoinRequest(
  rideId: string,
  payload: { agreedFare: number; seatsRequested: number; initiatedBy?: string }
) {
  return fetchApi(`/rides/${rideId}/join-requests`, {
    method: "POST",
    body: JSON.stringify({ initiatedBy: "PASSENGER", ...payload }),
  });
}

export async function apiGetJoinRequests(rideId: string) {
  return fetchApi(`/rides/${rideId}/join-requests`);
}

export async function apiAcceptJoinRequest(rideId: string, requestId: string) {
  return fetchApi(`/rides/${rideId}/join-requests/${requestId}/accept`, {
    method: "PATCH",
  });
}

export async function apiDeclineJoinRequest(rideId: string, requestId: string) {
  return fetchApi(`/rides/${rideId}/join-requests/${requestId}/decline`, {
    method: "PATCH",
  });
}

/* ════════════════════════════════════════════════════
   MODULE 8 — TRIPS
   ════════════════════════════════════════════════════ */

export interface TripData {
  id: string;
  status: string;
  rideId: string;
  callerRole?: "DRIVER" | "PASSENGER";
  ride?: {
    pickupLabel: string;
    pickupLat?: number;
    pickupLng?: number;
    destinationLabel: string;
    destinationLat?: number;
    destinationLng?: number;
    departureAt: string;
    farePerSeat: number;
    routeDistanceKm?: number;
    routeDurationMinutes?: number;
    routeGeometry?: string;
    vehicle?: { model: string; registrationNumber: string };
  };
  driver?: { id: string; firstName: string; lastName: string; phone?: string };
  passengers?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    seatsBooked: number;
    fareAmount: number;
    paymentStatus?: string;
  }>;
  fareAmount?: number;
}

export async function apiGetMyTrips(): Promise<TripData[]> {
  return fetchApi<TripData[]>("/trips");
}

export async function apiGetTrip(tripId: string): Promise<TripData> {
  return fetchApi<TripData>(`/trips/${tripId}`);
}

export async function apiUpdateTripStatus(
  tripId: string,
  status: string
): Promise<{ message: string; otp?: string | null; trip: { id: string; status: string } }> {
  return fetchApi(`/trips/${tripId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function apiGetTripHistory(page = 1, limit = 20) {
  return fetchApi<{ total: number; page: number; limit: number; trips: TripData[] }>(
    `/trips/history?page=${page}&limit=${limit}`
  );
}

/* ════════════════════════════════════════════════════
   MODULE 9 — LIVE TRACKING (REST fallback)
   ════════════════════════════════════════════════════ */

export async function apiGetTripLocation(tripId: string) {
  return fetchApi<{
    tripId: string;
    status: string;
    latestLocation?: { lat: number; lng: number; recordedAt: string };
    routeGeometry?: string;
    routeDistanceKm?: number;
    routeDurationMinutes?: number;
  }>(`/trips/${tripId}/location`);
}

/* ════════════════════════════════════════════════════
   MODULE 10 — CHAT (REST)
   ════════════════════════════════════════════════════ */

export interface MessageData {
  id: string;
  tripId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: { firstName: string; lastName: string; role: string };
}

export async function apiGetMessages(tripId: string, page = 1): Promise<MessageData[]> {
  return fetchApi<MessageData[]>(`/trips/${tripId}/messages?page=${page}&limit=50`);
}

export async function apiSendMessage(tripId: string, content: string): Promise<MessageData> {
  return fetchApi<MessageData>(`/trips/${tripId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

/* ════════════════════════════════════════════════════
   MODULE 11 — WALLET & PAYMENTS
   ════════════════════════════════════════════════════ */

export interface WalletData {
  id: string;
  userId: string;
  balance: number;
  transactions: Array<{
    id: string;
    type: "CREDIT" | "DEBIT";
    amount: number;
    description: string;
    createdAt: string;
  }>;
}

export async function apiGetWallet(): Promise<WalletData> {
  return fetchApi<WalletData>("/wallet");
}

export async function apiRechargeWallet(amount: number) {
  return fetchApi<{ orderId: string; amount: number; currency: string; keyId: string }>(
    "/wallet/recharge",
    { method: "POST", body: JSON.stringify({ amount }) }
  );
}

export async function apiVerifyRecharge(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number;
}) {
  return fetchApi<{ message: string; balance: number }>("/wallet/recharge/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiPayForTrip(
  tripId: string,
  method: "WALLET" | "CASH" | "CARD" | "UPI"
) {
  return fetchApi<{
    message: string;
    payment: { id: string; amount: number; status: string; method: string };
    trip: { id: string; status: string };
  }>(`/payments/trips/${tripId}/pay`, {
    method: "POST",
    body: JSON.stringify({ method }),
  });
}

/* ════════════════════════════════════════════════════
   MODULE 12 — REPORTS
   ════════════════════════════════════════════════════ */

export async function apiGetReportSummary(startDate?: string, endDate?: string) {
  const q = new URLSearchParams();
  if (startDate) q.set("startDate", startDate);
  if (endDate) q.set("endDate", endDate);
  return fetchApi<{ orgId: string; totalTrips: number; totalDistanceKm: number; dateRange: object }>(
    `/reports/summary?${q.toString()}`
  );
}

export async function apiGetFuelReport() {
  return fetchApi<{
    orgId: string;
    orgName: string;
    totalDistanceKm: number;
    assumedKmPerLitre: number;
    estimatedFuelLitres: number;
  }>("/reports/fuel");
}

export async function apiGetVehicleCostReport() {
  return fetchApi<
    Array<{
      vehicleId: string;
      model: string;
      registrationNumber: string;
      totalTrips: number;
      totalDistanceKm: number;
      estimatedFuelLitres: number;
    }>
  >("/reports/vehicle-cost");
}

/* ════════════════════════════════════════════════════
   MODULE 13 — GEOCODING (Next.js internal route)
   ════════════════════════════════════════════════════ */

export async function apiGeocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; formatted_address?: string }> {
  const res = await fetch(
    `/api/places/geocode?address=${encodeURIComponent(address)}`
  );
  const data = await res.json();
  if (!res.ok || !data.lat) {
    throw new Error(data.error || "Geocoding failed");
  }
  return data;
}

/* ════════════════════════════════════════════════════
   MODULE 14 — NEARBY RIDES (by lat/lng radius)
   ════════════════════════════════════════════════════ */

export async function apiGetNearbyRides(
  pickupLat: number,
  pickupLng: number,
  radiusKm = 1.0
) {
  return fetchApi<any[]>(
    `/rides/nearby-drivers?lat=${pickupLat}&lng=${pickupLng}&radius=${radiusKm}`
  );
}

/* ════════════════════════════════════════════════════
   MODULE 15 — NEGOTIATIONS
   ════════════════════════════════════════════════════ */

export interface NegotiationData {
  id: string;
  rideId: string;
  passengerId: string;
  status: "OPEN" | "ACCEPTED" | "REJECTED";
  offers: Array<{
    id: string;
    offeredBy: "PASSENGER" | "DRIVER";
    amount: number;
    createdAt: string;
  }>;
}

export async function apiStartNegotiation(rideId: string, amount: number) {
  return fetchApi<NegotiationData>(`/rides/${rideId}/negotiations`, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export async function apiGetNegotiations(rideId: string) {
  return fetchApi<NegotiationData[]>(`/rides/${rideId}/negotiations`);
}

export async function apiCounterOffer(
  rideId: string,
  negotiationId: string,
  amount: number
) {
  return fetchApi<NegotiationData>(
    `/rides/${rideId}/negotiations/${negotiationId}/counter`,
    { method: "POST", body: JSON.stringify({ amount }) }
  );
}

export async function apiAcceptNegotiation(
  rideId: string,
  negotiationId: string
) {
  return fetchApi<{ message: string; negotiation: NegotiationData }>(
    `/rides/${rideId}/negotiations/${negotiationId}/accept`,
    { method: "PATCH" }
  );
}

export async function apiRejectNegotiation(
  rideId: string,
  negotiationId: string
) {
  return fetchApi<{ message: string }>(
    `/rides/${rideId}/negotiations/${negotiationId}/reject`,
    { method: "PATCH" }
  );
}

/* ════════════════════════════════════════════════════
   MODULE 16 — OTP
   ════════════════════════════════════════════════════ */

export async function apiVerifyOtp(tripId: string, otp: string) {
  return fetchApi<{ message: string; trip: { id: string; status: string } }>(
    `/trips/${tripId}/otp/verify`,
    { method: "POST", body: JSON.stringify({ otp }) }
  );
}

export async function apiGetTripOtp(tripId: string) {
  return fetchApi<{ otp: string }>(`/trips/${tripId}/otp`);
}

