"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "../context/AuthContext";
import LocationInput from "../components/LocationInput";

const RouteMap = dynamic(() => import("../components/RouteMap"), { ssr: false });

/* ── Types ─────────────────────────────────────────── */
type MainTab = "carpooling" | "my-trips" | "my-vehicle" | "ride-history" | "wallet" | "setting";
type FindRideStep = "search" | "route-confirm" | "available-rides";
type OfferRideStep = "form" | "route-confirm";

interface SavedPlace { id: string; label: string; address: string; }
interface Vehicle { id: string; model: string; plateNumber: string; capacity: number; fuelType: string; status: string; }

interface AvailableRide {
  id: string; driverName: string; driverRating: number; driverPhone: string;
  model: string; plateNumber: string; pickupLabel: string; destinationLabel: string;
  departureTime: string; availableSeats: number; farePerSeat: number;
  distanceKm: number; durationMins: number; isScheduled: boolean;
}

interface Trip {
  id: string; rideId?: string; role: "PASSENGER" | "DRIVER";
  driverName: string; driverPhone: string; driverId?: string;
  passengers: string[]; vehicleModel: string; plateNumber: string;
  pickupLabel: string; pickupLat?: number; pickupLng?: number;
  destinationLabel: string; destinationLat?: number; destinationLng?: number;
  departureTime: string; seatsBooked: number; fareAmount: number;
  status: string; distanceKm: number; durationMins: number;
  routeGeometry?: string;
}

interface NegotiationState {
  rideId: string; negotiationId: string | null;
  currentOffer: number; listedFare: number;
  lastOfferedBy: "PASSENGER" | "DRIVER" | null;
  status: "idle" | "pending" | "accepted" | "rejected";
  history: Array<{ by: string; amount: number; time: string }>;
}

/* ─── geocode helper ───────────────────────────────── */
async function geocodeAddress(addr: string): Promise<{ lat: number; lng: number }> {
  try {
    const res = await fetch(`/api/places/geocode?address=${encodeURIComponent(addr)}`);
    const d = await res.json();
    if (d.lat) return { lat: d.lat, lng: d.lng };
  } catch {}
  return { lat: 23.03, lng: 72.587 }; // Ahmedabad fallback
}

/* ─── distance helper (metres) ─────────────────────── */
function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const { logout, user } = useAuth();

  /* Auth Guard */
  useEffect(() => {
    if (typeof document !== "undefined") {
      const hasToken = document.cookie.split("; ").some(r => r.startsWith("auth-token=") || r.startsWith("access-token="));
      if (!hasToken) router.replace("/login?from=/dashboard");
    }
  }, [router]);

  /* Main Navigation */
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("carpooling");
  const [carpoolMode, setCarpoolMode] = useState<"find" | "offer">("find");
  const [findStep, setFindStep] = useState<FindRideStep>("search");
  const [offerStep, setOfferStep] = useState<OfferRideStep>("form");

  /* Real Data States — start empty, filled from API */
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [availableRides, setAvailableRides] = useState<AvailableRide[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [rideHistory, setRideHistory] = useState<Trip[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletTransactions, setWalletTransactions] = useState<Array<{ id: string; type: string; amount: number; description: string; createdAt: string }>>([]);

  /* Search Loading */
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  /* Find Ride Inputs */
  const [startLoc, setStartLoc] = useState("");
  const [destLoc, setDestLoc] = useState("");
  const [scheduledEnabled, setScheduledEnabled] = useState(false);
  const [travelDateTime, setTravelDateTime] = useState(() => new Date(Date.now() + 1800000).toISOString().slice(0, 16));
  const [selectedSeats, setSelectedSeats] = useState(1);

  /* Offer Ride Inputs */
  const [offerVehId, setOfferVehId] = useState("");
  const [offerStartLoc, setOfferStartLoc] = useState("");
  const [offerDestLoc, setOfferDestLoc] = useState("");
  const [offerScheduledEnabled, setOfferScheduledEnabled] = useState(false);
  const [offerDateTime, setOfferDateTime] = useState(() => new Date(Date.now() + 3600000).toISOString().slice(0, 16));
  const [offerSeatsAvailable, setOfferSeatsAvailable] = useState(3);
  const [offerFarePerSeat, setOfferFarePerSeat] = useState(80);
  const [offerLoading, setOfferLoading] = useState(false);

  /* Negotiation */
  const [negotiating, setNegotiating] = useState<NegotiationState | null>(null);
  const [bargainAmount, setBargainAmount] = useState(0);

  /* Trip actions */
  const [activeOtpTrip, setActiveOtpTrip] = useState<Trip | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpDisplay, setOtpDisplay] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  /* Live tracking */
  const [trackingTripId, setTrackingTripId] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const locationPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<import("socket.io-client").Socket | null>(null);

  /* Payment */
  const [paymentTrip, setPaymentTrip] = useState<Trip | null>(null);
  const [payMethod, setPayMethod] = useState<"WALLET" | "CASH" | "CARD" | "UPI">("CASH");
  const [payLoading, setPayLoading] = useState(false);

  /* Vehicle modal */
  const [isAddVehOpen, setIsAddVehOpen] = useState(false);
  const [newModel, setNewModel] = useState("");
  const [newPlate, setNewPlate] = useState("");
  const [newCap, setNewCap] = useState(4);
  const [newFuel, setNewFuel] = useState("Petrol");
  const [vehLoading, setVehLoading] = useState(false);

  /* Saved place modal */
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [newPlaceLabel, setNewPlaceLabel] = useState("");
  const [newPlaceAddress, setNewPlaceAddress] = useState("");

  /* Wallet recharge */
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [rechargeAmt, setRechargeAmt] = useState(200);

  /* Chat */
  const [chatOpenTrip, setChatOpenTrip] = useState<Trip | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([]);
  const [chatText, setChatText] = useState("");

  /* ── Load backend data on mount ── */
  useEffect(() => {
    const load = async () => {
      try {
        const { apiListVehicles, apiGetMyTrips, apiGetWallet, apiListSavedPlaces, apiGetTripHistory } = await import("../lib/api");
        const [vehData, tripData, walletData, places, histData] = await Promise.allSettled([
          apiListVehicles(),
          apiGetMyTrips(),
          apiGetWallet(),
          apiListSavedPlaces(),
          apiGetTripHistory(1, 30),
        ]);

        if (vehData.status === "fulfilled" && vehData.value.length > 0) {
          const mapped = vehData.value.map(v => ({
            id: v.id, model: v.model, plateNumber: v.registrationNumber,
            capacity: v.seatingCapacity,
            fuelType: v.fuelType.charAt(0) + v.fuelType.slice(1).toLowerCase(),
            status: v.status === "VERIFIED" ? "Verified" : "Pending",
          }));
          setVehicles(mapped);
          setOfferVehId(mapped[0]?.id || "");
        }

        if (tripData.status === "fulfilled") {
          setTrips(tripData.value.map(mapTrip));
        }
        if (histData.status === "fulfilled") {
          setRideHistory(histData.value.trips.map(mapTrip));
        }
        if (walletData.status === "fulfilled") {
          setWalletBalance(walletData.value.balance);
          setWalletTransactions(walletData.value.transactions || []);
        }
        if (places.status === "fulfilled" && places.value.length > 0) {
          setSavedPlaces(places.value.map(p => ({ id: p.id, label: p.label, address: p.address })));
        }
      } catch { /* graceful fail */ }
    };
    load();
  }, []);

  /* ── helper: map raw TripData to local Trip interface ── */
  function mapTrip(t: any): Trip {
    return {
      id: t.id,
      rideId: t.rideId,
      role: (t.callerRole || "PASSENGER") as "PASSENGER" | "DRIVER",
      driverName: t.driver ? `${t.driver.firstName} ${t.driver.lastName}` : "Driver",
      driverPhone: t.driver?.phone || "",
      driverId: t.driver?.id,
      passengers: (t.passengers || []).map((p: any) => `${p.firstName} ${p.lastName}`),
      vehicleModel: t.ride?.vehicle?.model || "Vehicle",
      plateNumber: t.ride?.vehicle?.registrationNumber || "",
      pickupLabel: t.ride?.pickupLabel || "",
      pickupLat: t.ride?.pickupLat,
      pickupLng: t.ride?.pickupLng,
      destinationLabel: t.ride?.destinationLabel || "",
      destinationLat: t.ride?.destinationLat,
      destinationLng: t.ride?.destinationLng,
      departureTime: t.ride?.departureAt ? new Date(t.ride.departureAt).toLocaleString() : "",
      seatsBooked: t.passengers?.[0]?.seatsBooked || 1,
      fareAmount: t.fareAmount || t.passengers?.[0]?.fareAmount || 0,
      status: t.status,
      distanceKm: t.ride?.routeDistanceKm || 0,
      durationMins: t.ride?.routeDurationMinutes || 0,
      routeGeometry: t.ride?.routeGeometry,
    };
  }

  /* ── Live tracking via Socket.IO ── */
  useEffect(() => {
    if (!trackingTripId) return;
    const setupSocket = async () => {
      const { getTrackingSocket, joinTripRoom } = await import("../lib/socket");
      const sock = getTrackingSocket();
      socketRef.current = sock;
      joinTripRoom(trackingTripId);
      sock.on("location:update", (data: { tripId: string; lat: number; lng: number; etaMinutes?: number }) => {
        if (data.tripId === trackingTripId) {
          setDriverLocation({ lat: data.lat, lng: data.lng });
          if (data.etaMinutes != null) setEtaMinutes(data.etaMinutes);
        }
      });
      sock.on("otp:generated", (data: { tripId: string; otp: string }) => {
        if (data.tripId === trackingTripId) setOtpDisplay(data.otp);
      });
      sock.on("ride:started", (data: { tripId: string }) => {
        if (data.tripId === trackingTripId) {
          setTrips(prev => prev.map(t => t.id === data.tripId ? { ...t, status: "IN_PROGRESS" } : t));
        }
      });
    };
    setupSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.off("location:update");
        socketRef.current.off("otp:generated");
        socketRef.current.off("ride:started");
      }
    };
  }, [trackingTripId]);

  /* ── Driver: emit GPS every 5s if driving ── */
  useEffect(() => {
    const driverTrip = trips.find(t => t.role === "DRIVER" && t.status === "IN_PROGRESS");
    if (!driverTrip || !driverTrip.id) return;
    const sendLoc = async () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(async pos => {
        const { emitDriverLocation } = await import("../lib/socket");
        emitDriverLocation(driverTrip.id, pos.coords.latitude, pos.coords.longitude);
      });
    };
    locationPollRef.current = setInterval(sendLoc, 5000);
    return () => { if (locationPollRef.current) clearInterval(locationPollRef.current); };
  }, [trips]);

  /* ── FIND RIDE handlers ── */
  const handleSwapLocations = () => { setStartLoc(destLoc); setDestLoc(startLoc); };

  const handleFindRideClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startLoc.trim() || !destLoc.trim()) { setSearchError("Please enter both pickup and destination."); return; }
    setSearchError("");
    setFindStep("route-confirm");
  };

  const handleConfirmRouteClick = async () => {
    setFindStep("available-rides");
    setSearchLoading(true);
    setSearchError("");
    try {
      const [pickupGeo, destGeo] = await Promise.all([geocodeAddress(startLoc), geocodeAddress(destLoc)]);
      const { apiSearchRides } = await import("../lib/api");
      const payload: any = {
        pickupLabel: startLoc, pickupLat: pickupGeo.lat, pickupLng: pickupGeo.lng,
        destinationLabel: destLoc, destinationLat: destGeo.lat, destinationLng: destGeo.lng,
        seatsNeeded: selectedSeats,
      };
      if (scheduledEnabled) {
        payload.departureDate = travelDateTime.split("T")[0];
        payload.departureTime = travelDateTime.split("T")[1];
      }
      const res = await apiSearchRides(payload);
      if (res.rides && res.rides.length > 0) {
        setAvailableRides(res.rides.map((r: any) => ({
          id: r.id,
          driverName: r.driver ? `${r.driver.firstName} ${r.driver.lastName}` : "Driver",
          driverRating: r.driver?.rating || 4.5,
          driverPhone: r.driver?.phone || "",
          model: r.vehicle?.model || "Vehicle",
          plateNumber: r.vehicle?.registrationNumber || "",
          pickupLabel: r.pickupLabel,
          destinationLabel: r.destinationLabel,
          departureTime: new Date(r.departureAt).toLocaleString(),
          availableSeats: r.availableSeats,
          farePerSeat: Number(r.farePerSeat),
          distanceKm: r.routeDistanceKm || 0,
          durationMins: r.routeDurationMinutes || 0,
          isScheduled: r.isRecurring || false,
        })));
      } else {
        setAvailableRides([]);
        setSearchError("No rides found near your location. Try a different address or time.");
      }
    } catch (err: any) {
      setSearchError(err?.message || "Search failed. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  /* ── NEGOTIATION handlers ── */
  const handleOpenBargain = (ride: AvailableRide) => {
    setNegotiating({
      rideId: ride.id, negotiationId: null,
      currentOffer: ride.farePerSeat - 10,
      listedFare: ride.farePerSeat,
      lastOfferedBy: null, status: "idle",
      history: [],
    });
    setBargainAmount(ride.farePerSeat - 10);
  };

  const handleSendOffer = async () => {
    if (!negotiating) return;
    try {
      const { apiStartNegotiation, apiCounterOffer } = await import("../lib/api");
      const { emitNegotiationOffer, joinRideRoom } = await import("../lib/socket");
      joinRideRoom(negotiating.rideId);

      let neg: any;
      if (!negotiating.negotiationId) {
        neg = await apiStartNegotiation(negotiating.rideId, bargainAmount);
      } else {
        neg = await apiCounterOffer(negotiating.rideId, negotiating.negotiationId, bargainAmount);
      }
      emitNegotiationOffer(negotiating.rideId, neg.id, bargainAmount, "PASSENGER");
      setNegotiating(prev => prev ? {
        ...prev, negotiationId: neg.id,
        currentOffer: bargainAmount, lastOfferedBy: "PASSENGER",
        status: "pending",
        history: [...prev.history, { by: "You", amount: bargainAmount, time: new Date().toLocaleTimeString() }],
      } : null);
    } catch (err: any) {
      setSearchError(err?.message || "Could not send offer");
    }
  };

  const handleAcceptNegotiation = async () => {
    if (!negotiating?.negotiationId) return;
    try {
      const { apiAcceptNegotiation, apiSubmitJoinRequest } = await import("../lib/api");
      const { emitNegotiationAccept } = await import("../lib/socket");
      await apiAcceptNegotiation(negotiating.rideId, negotiating.negotiationId);
      emitNegotiationAccept(negotiating.rideId, negotiating.negotiationId, negotiating.currentOffer);
      await apiSubmitJoinRequest(negotiating.rideId, { agreedFare: negotiating.currentOffer, seatsRequested: selectedSeats });
      setNegotiating(null);
      setActiveMainTab("my-trips");
      const { apiGetMyTrips } = await import("../lib/api");
      const fresh = await apiGetMyTrips();
      setTrips(fresh.map(mapTrip));
    } catch (err: any) { setSearchError(err?.message || "Failed to accept negotiation"); }
  };

  /* ── BOOK NOW (at listed price) ── */
  const handleBookNow = async (ride: AvailableRide) => {
    try {
      const { apiSubmitJoinRequest, apiGetMyTrips } = await import("../lib/api");
      await apiSubmitJoinRequest(ride.id, { agreedFare: ride.farePerSeat, seatsRequested: selectedSeats });
      const fresh = await apiGetMyTrips();
      setTrips(fresh.map(mapTrip));
      setActiveMainTab("my-trips");
    } catch (err: any) {
      setSearchError(err?.message || "Could not book ride. Driver may need to accept first.");
    }
  };

  /* ── OFFER RIDE handlers ── */
  const handleOfferFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerVehId) { alert("Please select a vehicle first."); return; }
    setOfferStep("route-confirm");
  };

  const handleConfirmOfferPublish = async () => {
    setOfferLoading(true);
    try {
      const [pickupGeo, destGeo] = await Promise.all([geocodeAddress(offerStartLoc), geocodeAddress(offerDestLoc)]);
      const { apiPublishRide, apiGetMyTrips } = await import("../lib/api");
      await apiPublishRide({
        vehicleId: offerVehId,
        pickupLabel: offerStartLoc, pickupLat: pickupGeo.lat, pickupLng: pickupGeo.lng,
        destinationLabel: offerDestLoc, destinationLat: destGeo.lat, destinationLng: destGeo.lng,
        departureAt: offerScheduledEnabled ? new Date(offerDateTime).toISOString() : new Date().toISOString(),
        availableSeats: offerSeatsAvailable,
        farePerSeat: offerFarePerSeat,
        isRecurring: false,
      });
      setOfferStep("form");
      setOfferStartLoc(""); setOfferDestLoc("");
      setCarpoolMode("find");
      const fresh = await apiGetMyTrips();
      setTrips(fresh.map(mapTrip));
      setActiveMainTab("my-trips");
    } catch (err: any) {
      alert(err?.message || "Failed to publish ride. Please try again.");
    } finally {
      setOfferLoading(false);
    }
  };

  /* ── OTP: Driver starts ride ── */
  const handleDriverStartRide = async (trip: Trip) => {
    setOtpLoading(true);
    setOtpError("");
    try {
      const { apiUpdateTripStatus } = await import("../lib/api");
      const res = await apiUpdateTripStatus(trip.id, "IN_PROGRESS");
      if (res.otp) setOtpDisplay(res.otp);
      setActiveOtpTrip(trip);
      setTrackingTripId(trip.id);
    } catch (err: any) {
      setOtpError(err?.message || "Could not start ride");
    } finally {
      setOtpLoading(false);
    }
  };

  /* ── OTP: Passenger verifies ── */
  const handleVerifyOtp = async (trip: Trip) => {
    if (!otpInput.trim()) { setOtpError("Enter the 4-digit OTP from your driver."); return; }
    setOtpLoading(true);
    setOtpError("");
    try {
      const { apiVerifyOtp, apiGetMyTrips } = await import("../lib/api");
      await apiVerifyOtp(trip.id, otpInput.trim());
      setOtpInput("");
      setActiveOtpTrip(null);
      setTrackingTripId(trip.id);
      const fresh = await apiGetMyTrips();
      setTrips(fresh.map(mapTrip));
    } catch (err: any) {
      setOtpError(err?.message || "Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  /* ── Driver: End Ride ── */
  const handleEndRide = async (trip: Trip) => {
    try {
      const { apiUpdateTripStatus, apiGetMyTrips } = await import("../lib/api");
      await apiUpdateTripStatus(trip.id, "COMPLETED");
      setPaymentTrip(trip);
      setTrackingTripId(null);
      const fresh = await apiGetMyTrips();
      setTrips(fresh.map(mapTrip));
    } catch (err: any) { alert(err?.message || "Could not end ride"); }
  };

  /* ── Payment ── */
  const handlePayNow = async () => {
    if (!paymentTrip) return;
    setPayLoading(true);
    try {
      if (payMethod === "CASH") {
        // Cash — just mark completed
        const { apiUpdateTripStatus } = await import("../lib/api");
        await apiUpdateTripStatus(paymentTrip.id, "COMPLETED").catch(() => {});
        setTrips(prev => prev.map(t => t.id === paymentTrip!.id ? { ...t, status: "COMPLETED" } : t));
        setPaymentTrip(null);
      } else {
        const { apiPayForTrip } = await import("../lib/api");
        const res = await apiPayForTrip(paymentTrip.id, payMethod);
        if (res.trip) setTrips(prev => prev.map(t => t.id === paymentTrip!.id ? { ...t, status: res.trip.status } : t));
        if (payMethod === "WALLET") setWalletBalance(prev => prev - paymentTrip!.fareAmount);
        setPaymentTrip(null);
      }
    } catch (err: any) { alert(err?.message || "Payment failed"); }
    finally { setPayLoading(false); }
  };

  /* ── Vehicle / Place handlers ── */
  const handleAddVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel || !newPlate) return;
    setVehLoading(true);
    try {
      const { apiCreateVehicle } = await import("../lib/api");
      const created = await apiCreateVehicle({ model: newModel, registrationNumber: newPlate, seatingCapacity: newCap, fuelType: newFuel.toUpperCase() });
      setVehicles(prev => [...prev, { id: created.id, model: created.model, plateNumber: created.registrationNumber, capacity: created.seatingCapacity, fuelType: newFuel, status: "Pending" }]);
      if (!offerVehId) setOfferVehId(created.id);
    } catch (err: any) { alert(err?.message || "Could not register vehicle"); }
    finally { setVehLoading(false); setNewModel(""); setNewPlate(""); setIsAddVehOpen(false); }
  };

  const handleAddPlaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaceLabel || !newPlaceAddress) return;
    setSavedPlaces(prev => [...prev, { id: `sp-${Date.now()}`, label: newPlaceLabel, address: newPlaceAddress }]);
    setNewPlaceLabel(""); setNewPlaceAddress(""); setIsAddPlaceOpen(false);
  };

  /* ── Chat handlers ── */
  const handleOpenChat = async (trip: Trip) => {
    setChatOpenTrip(trip);
    try {
      const { apiGetMessages } = await import("../lib/api");
      const msgs = await apiGetMessages(trip.id);
      setChatMessages(msgs.map(m => ({
        sender: `${m.sender?.firstName || "User"} ${m.sender?.lastName || ""}`.trim(),
        text: m.content,
        time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      })));
    } catch { setChatMessages([]); }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() || !chatOpenTrip) return;
    const text = chatText.trim();
    setChatText("");
    setChatMessages(prev => [...prev, {
      sender: user ? `${user.firstName} ${user.lastName} (You)` : "You",
      text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }]);
    try {
      const { apiSendMessage } = await import("../lib/api");
      await apiSendMessage(chatOpenTrip.id, text);
    } catch { /* message still shows locally */ }
  };

  /* ── Status helpers ── */
  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      SCHEDULED:   { label: "Booked", cls: "bg-blue-100 text-blue-800" },
      IN_PROGRESS: { label: "In Progress", cls: "bg-green-100 text-green-800" },
      COMPLETED:   { label: "Completed", cls: "bg-gray-100 text-gray-700" },
      CANCELLED:   { label: "Cancelled", cls: "bg-red-100 text-red-700" },
      RIDE_BOOKED: { label: "Booked", cls: "bg-blue-100 text-blue-800" },
      TRIP_STARTED:{ label: "Starting…", cls: "bg-yellow-100 text-yellow-800" },
      TRIP_IN_PROGRESS:{ label: "In Progress", cls: "bg-green-100 text-green-800" },
      TRIP_COMPLETED:  { label: "Completed", cls: "bg-gray-100 text-gray-700" },
      PAYMENT_PENDING: { label: "Payment Due", cls: "bg-orange-100 text-orange-800" },
    };
    const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-700" };
    return <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${s.cls}`}>{s.label}</span>;
  };

  const isActiveTrip = (t: Trip) => ["SCHEDULED", "IN_PROGRESS", "TRIP_STARTED", "TRIP_IN_PROGRESS", "RIDE_BOOKED"].includes(t.status);
  const needsPayment = (t: Trip) => ["COMPLETED", "TRIP_COMPLETED", "PAYMENT_PENDING"].includes(t.status);
  const activeTrips = trips.filter(isActiveTrip);

  return (
    <div className="min-h-screen bg-[#FCFAF5] text-[#173300] flex flex-col font-sans">
      {/* ── Header ── */}
      <header className="border-b-2 border-[#173300] bg-[#FCFAF5] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <img src="/logo.svg" alt="Oddo Logo" className="h-8 w-auto" />
            <span className="font-heading font-extrabold text-2xl text-[#173300] tracking-tight">Carpooling</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none font-heading font-bold text-xs sm:text-sm p-1">
            {(["carpooling","my-trips","my-vehicle","ride-history","wallet","setting"] as MainTab[]).map(tab => (
              <button key={tab} onClick={() => setActiveMainTab(tab)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${activeMainTab === tab ? "bg-[#173300] text-[#FFEB5B] border-2 border-[#173300] shadow-[2px_2px_0px_#173300] font-extrabold" : "text-[#173300]/80 hover:bg-[#173300]/[0.08] border-2 border-transparent"}`}>
                {tab === "carpooling" ? "Dashboard" : tab === "my-trips" ? `My Trips${activeTrips.length > 0 ? ` (${activeTrips.length})` : ""}` : tab === "my-vehicle" ? "My Vehicle" : tab === "ride-history" ? "Ride History" : tab === "wallet" ? "Wallet" : "Settings"}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 bg-[#FCFAF5] border-2 border-[#173300] rounded-2xl px-3 py-1.5 shadow-[2px_2px_0px_#173300] font-mono text-xs font-bold text-[#173300]">
              <div className="w-6 h-6 rounded-full bg-[#FFEB5B] border border-[#173300] flex items-center justify-center font-extrabold text-xs">
                {user?.firstName?.charAt(0) || "U"}
              </div>
              <span className="hidden sm:inline">{user ? `${user.firstName} ${user.lastName}` : "User"}</span>
            </div>
            <button onClick={() => { logout(); router.push("/login"); }}
              className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl border-2 border-[#173300] bg-[#FCFAF5] hover:bg-[#FFEB5B] shadow-[2px_2px_0px_#173300] transition-all">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ═══ CARPOOLING TAB ═══ */}
        {activeMainTab === "carpooling" && (
          <div className="flex flex-col gap-6">
            {/* Mode Toggle */}
            <div className="flex items-center gap-4 border-b-2 border-dashed border-[#B6B6B6] pb-4">
              <div className="bg-[#173300]/[0.06] p-1 rounded-2xl border-2 border-dashed border-[#B6B6B6] flex items-center gap-2 max-w-md w-full">
                {(["find","offer"] as const).map(m => (
                  <button key={m} onClick={() => { setCarpoolMode(m); setFindStep("search"); setOfferStep("form"); setSearchError(""); }}
                    className={`flex-1 py-3 rounded-xl font-heading font-extrabold text-sm transition-all text-center ${carpoolMode === m ? "bg-[#173300] text-[#FFEB5B] shadow-[3px_3px_0px_#173300]" : "text-[#173300]/70 hover:text-[#173300]"}`}>
                    {m === "find" ? "Find Ride" : "Offer Ride"}
                  </button>
                ))}
              </div>
            </div>

            {/* ── FIND RIDE ── */}
            {carpoolMode === "find" && (
              <>
                {findStep === "search" && (
                  <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_#173300] max-w-3xl w-full mx-auto flex flex-col gap-6">
                    {savedPlaces.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-[#173300]/60 uppercase">Quick Pick:</span>
                        {savedPlaces.map(sp => (
                          <button key={sp.id} type="button" onClick={() => setStartLoc(sp.address)}
                            className="px-3 py-1 bg-[#173300]/[0.05] border border-[#B6B6B6] rounded-xl text-xs font-semibold hover:bg-[#FFEB5B] transition-colors">
                            {sp.label}
                          </button>
                        ))}
                      </div>
                    )}

                    <form onSubmit={handleFindRideClick} className="flex flex-col gap-6">
                      <div className="flex flex-col gap-5 relative">
                        <LocationInput id="start-location" label="Start Location" value={startLoc} onChange={setStartLoc} placeholder="Enter pickup location" required showAutoDetect />
                        <div className="flex justify-end -my-2">
                          <button type="button" onClick={handleSwapLocations} className="w-10 h-10 rounded-2xl bg-[#FCFAF5] border-2 border-[#173300] shadow-[2px_2px_0px_#173300] flex items-center justify-center font-bold text-base hover:bg-[#FFEB5B] transition-all" title="Swap">⇅</button>
                        </div>
                        <LocationInput id="dest-location" label="Destination" value={destLoc} onChange={setDestLoc} placeholder="Enter drop location" required />
                      </div>

                      {/* Seats */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-mono font-bold uppercase text-[#173300]">Required Seats</label>
                        <div className="flex gap-2">
                          {[1,2,3,4].map(n => (
                            <button key={n} type="button" onClick={() => setSelectedSeats(n)}
                              className={`w-10 h-10 rounded-xl border-2 font-heading font-extrabold text-sm transition-all ${selectedSeats === n ? "bg-[#173300] text-[#FFEB5B] border-[#173300]" : "border-[#B6B6B6] hover:border-[#173300]"}`}>
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Schedule Toggle */}
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#173300]/[0.04] border-2 border-dashed border-[#B6B6B6]">
                        <div>
                          <div className="font-heading font-extrabold text-sm text-[#173300]">Schedule for Later</div>
                          <div className="text-xs text-[#173300]/60 mt-0.5">Toggle ON to pick a specific date & time</div>
                        </div>
                        <button type="button" onClick={() => setScheduledEnabled(!scheduledEnabled)}
                          className={`w-12 h-6 rounded-full p-0.5 border-2 border-[#173300] transition-all flex items-center ${scheduledEnabled ? "bg-[#173300] justify-end" : "bg-[#B6B6B6] justify-start"}`}>
                          <div className="w-4 h-4 rounded-full bg-[#FFEB5B] border border-[#173300]" />
                        </button>
                      </div>

                      {scheduledEnabled && (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-mono font-bold uppercase text-[#173300]">Travel Date & Time</label>
                          <input type="datetime-local" value={travelDateTime} onChange={e => setTravelDateTime(e.target.value)}
                            min={new Date().toISOString().slice(0,16)}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-sm font-mono font-bold text-[#173300] outline-none focus:border-[#173300]" />
                        </div>
                      )}

                      {searchError && <p className="text-red-600 text-xs font-semibold">{searchError}</p>}

                      <button type="submit" className="mt-2 w-full py-4 rounded-2xl bg-[#173300] text-[#FFEB5B] font-heading font-extrabold text-base border-2 border-[#173300] shadow-[4px_4px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                        Find Ride
                      </button>
                    </form>
                  </div>
                )}

                {findStep === "route-confirm" && (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setFindStep("search")} className="px-3 py-1.5 rounded-xl border-2 border-[#173300] bg-[#FCFAF5] font-bold text-xs hover:bg-[#FFEB5B]">← Back</button>
                      <h2 className="font-heading text-2xl font-extrabold text-[#173300]">Confirm Your Route</h2>
                    </div>
                    <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 shadow-[8px_8px_0px_#173300] flex flex-col gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                        <div className="bg-[#173300]/[0.04] p-3 rounded-xl border border-[#B6B6B6]">
                          <span className="text-[#173300]/60 uppercase block text-[10px]">Pickup</span>
                          <span className="font-bold text-sm text-[#173300]">{startLoc}</span>
                        </div>
                        <div className="bg-[#173300]/[0.04] p-3 rounded-xl border border-[#B6B6B6]">
                          <span className="text-[#173300]/60 uppercase block text-[10px]">Destination</span>
                          <span className="font-bold text-sm text-[#173300]">{destLoc}</span>
                        </div>
                      </div>
                      {scheduledEnabled && (
                        <div className="bg-[#FFEB5B]/40 border border-[#173300] rounded-xl p-3 text-xs font-mono">
                          Scheduled for: <strong>{new Date(travelDateTime).toLocaleString()}</strong>
                        </div>
                      )}
                      <RouteMap startAddress={startLoc} destAddress={destLoc} />
                      <button onClick={handleConfirmRouteClick} className="w-full py-4 rounded-2xl bg-[#FFEB5B] text-[#173300] font-heading font-extrabold text-lg border-2 border-[#173300] shadow-[4px_4px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                        Search Rides Near This Route
                      </button>
                    </div>
                  </div>
                )}

                {findStep === "available-rides" && (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setFindStep("route-confirm")} className="px-3 py-1.5 rounded-xl border-2 border-[#173300] bg-[#FCFAF5] font-bold text-xs hover:bg-[#FFEB5B]">← Route</button>
                        <h2 className="font-heading text-2xl font-extrabold text-[#173300]">Available Rides</h2>
                      </div>
                      <button onClick={() => setFindStep("search")} className="text-xs font-mono font-bold underline text-[#173300]">New Search</button>
                    </div>

                    {searchLoading && (
                      <div className="text-center py-16 text-[#173300]/60 font-mono text-sm">
                        <p>Searching nearby rides within 1km…</p>
                      </div>
                    )}

                    {!searchLoading && searchError && (
                      <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 text-center">
                        <p className="text-orange-700 font-semibold text-sm">{searchError}</p>
                      </div>
                    )}

                    {!searchLoading && !searchError && availableRides.length === 0 && (
                      <div className="bg-[#FCFAF5] border-2 border-dashed border-[#B6B6B6] rounded-3xl p-12 text-center">
                        <h3 className="font-heading text-xl font-extrabold text-[#173300]">No rides found nearby</h3>
                        <p className="text-xs font-mono text-[#173300]/60 mt-2">No one from your organization is offering a ride on this route right now.</p>
                        <button onClick={() => setFindStep("search")} className="mt-6 px-6 py-2.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-heading font-extrabold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300]">Try Different Route</button>
                      </div>
                    )}

                    {!searchLoading && availableRides.map(ride => (
                      <div key={ride.id} className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 shadow-[6px_6px_0px_#173300] flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-[#FFEB5B] border-2 border-[#173300] flex items-center justify-center font-heading font-extrabold text-xl shadow-[3px_3px_0px_#173300]">
                              {ride.driverName.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-heading text-xl font-extrabold text-[#173300]">{ride.driverName}</h3>
                              <div className="text-xs font-mono text-[#173300]/60">{ride.model} · Rating: {ride.driverRating.toFixed(1)}</div>
                              <div className="text-xs font-mono text-[#173300]/70 mt-0.5">{ride.pickupLabel} to {ride.destinationLabel}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-heading text-2xl font-extrabold text-[#173300]">₹{ride.farePerSeat}</div>
                            <div className="text-xs font-mono text-[#173300]/60">per seat</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                          <div className="bg-[#173300]/[0.04] p-2 rounded-xl text-center">
                            <div className="text-[#173300]/60 text-[10px]">Departure</div>
                            <div className="font-bold text-[#173300] mt-0.5">{ride.departureTime}</div>
                          </div>
                          <div className="bg-[#173300]/[0.04] p-2 rounded-xl text-center">
                            <div className="text-[#173300]/60 text-[10px]">Seats</div>
                            <div className="font-bold text-[#173300] mt-0.5">{ride.availableSeats} left</div>
                          </div>
                          <div className="bg-[#173300]/[0.04] p-2 rounded-xl text-center">
                            <div className="text-[#173300]/60 text-[10px]">Distance</div>
                            <div className="font-bold text-[#173300] mt-0.5">{ride.distanceKm.toFixed(1)} km</div>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-1">
                          <button onClick={() => handleBookNow(ride)} className="flex-1 py-2.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-heading font-extrabold text-sm border-2 border-[#173300] shadow-[3px_3px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                            Book Now ₹{ride.farePerSeat}
                          </button>
                          <button onClick={() => handleOpenBargain(ride)} className="flex-1 py-2.5 rounded-xl bg-[#FFEB5B] text-[#173300] font-heading font-extrabold text-sm border-2 border-[#173300] shadow-[3px_3px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                            Bargain
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── OFFER RIDE ── */}
            {carpoolMode === "offer" && (
              <>
                {offerStep === "form" && (
                  <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_#173300] max-w-3xl w-full mx-auto flex flex-col gap-6">
                    <h3 className="font-heading text-2xl font-extrabold text-[#173300]">Publish a Ride Offer</h3>

                    {vehicles.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="font-semibold text-[#173300]">You need a registered vehicle to offer a ride.</p>
                        <button onClick={() => { setActiveMainTab("my-vehicle"); setIsAddVehOpen(true); }} className="mt-4 px-6 py-2.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-bold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300]">
                          Register a Vehicle
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleOfferFormSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-mono font-bold uppercase text-[#173300]">Select Vehicle</label>
                          <select value={offerVehId} onChange={e => setOfferVehId(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-sm font-mono font-bold text-[#173300] outline-none">
                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.model} ({v.plateNumber})</option>)}
                          </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <LocationInput id="offer-pickup" label="Pickup Point" value={offerStartLoc} onChange={setOfferStartLoc} placeholder="Enter pickup" required showAutoDetect />
                          <LocationInput id="offer-drop" label="Drop Point" value={offerDestLoc} onChange={setOfferDestLoc} placeholder="Enter drop" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-mono font-bold uppercase text-[#173300]">Available Seats</label>
                            <input type="number" min={1} max={6} value={offerSeatsAvailable} onChange={e => setOfferSeatsAvailable(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-sm font-mono font-bold text-[#173300] outline-none" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-mono font-bold uppercase text-[#173300]">Fare Per Seat (₹)</label>
                            <input type="number" min={10} value={offerFarePerSeat} onChange={e => setOfferFarePerSeat(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-sm font-mono font-bold text-[#173300] outline-none" />
                          </div>
                        </div>

                        {/* Offer Schedule Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#173300]/[0.04] border-2 border-dashed border-[#B6B6B6]">
                          <div>
                            <div className="font-heading font-extrabold text-sm text-[#173300]">Schedule for Later</div>
                            <div className="text-xs text-[#173300]/60 mt-0.5">OFF = offer right now. ON = set future time.</div>
                          </div>
                          <button type="button" onClick={() => setOfferScheduledEnabled(!offerScheduledEnabled)}
                            className={`w-12 h-6 rounded-full p-0.5 border-2 border-[#173300] transition-all flex items-center ${offerScheduledEnabled ? "bg-[#173300] justify-end" : "bg-[#B6B6B6] justify-start"}`}>
                            <div className="w-4 h-4 rounded-full bg-[#FFEB5B] border border-[#173300]" />
                          </button>
                        </div>

                        {offerScheduledEnabled && (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-mono font-bold uppercase text-[#173300]">Departure Date & Time</label>
                            <input type="datetime-local" value={offerDateTime} onChange={e => setOfferDateTime(e.target.value)} min={new Date().toISOString().slice(0,16)} className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-sm font-mono font-bold text-[#173300] outline-none focus:border-[#173300]" />
                          </div>
                        )}

                        <button type="submit" className="mt-2 w-full py-4 rounded-2xl bg-[#173300] text-[#FFEB5B] font-heading font-extrabold text-base border-2 border-[#173300] shadow-[4px_4px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                          Preview Route
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {offerStep === "route-confirm" && (
                  <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 shadow-[8px_8px_0px_#173300] max-w-3xl w-full mx-auto flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-heading text-2xl font-extrabold text-[#173300]">Confirm Offer Route</h3>
                      <button onClick={() => setOfferStep("form")} className="text-xs font-mono font-bold underline">Edit Details</button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                      <div className="bg-[#173300]/[0.04] p-3 rounded-xl"><span className="text-[#173300]/60 block text-[10px]">Vehicle</span><span className="font-bold">{vehicles.find(v => v.id === offerVehId)?.model || "-"}</span></div>
                      <div className="bg-[#173300]/[0.04] p-3 rounded-xl"><span className="text-[#173300]/60 block text-[10px]">Seats</span><span className="font-bold">{offerSeatsAvailable}</span></div>
                      <div className="bg-[#FFEB5B] p-3 rounded-xl"><span className="text-[#173300]/60 block text-[10px]">Fare/Seat</span><span className="font-extrabold text-[#173300]">₹{offerFarePerSeat}</span></div>
                    </div>

                    <RouteMap startAddress={offerStartLoc} destAddress={offerDestLoc} />

                    <button onClick={handleConfirmOfferPublish} disabled={offerLoading} className="w-full py-4 rounded-2xl bg-[#FFEB5B] text-[#173300] font-heading font-extrabold text-lg border-2 border-[#173300] shadow-[4px_4px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-60">
                      {offerLoading ? "Publishing…" : "Publish Ride Offer"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══ MY TRIPS TAB ═══ */}
        {activeMainTab === "my-trips" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b-2 border-dashed border-[#B6B6B6] pb-4">
              <h1 className="font-heading text-3xl font-extrabold text-[#173300]">My Trips</h1>
              <button onClick={async () => {
                const { apiGetMyTrips } = await import("../lib/api");
                const fresh = await apiGetMyTrips().catch(() => []);
                setTrips(fresh.map(mapTrip));
              }} className="text-xs font-mono font-bold underline text-[#173300]">Refresh</button>
            </div>

            {trips.length === 0 && (
              <div className="text-center py-16">
                <h3 className="font-heading text-xl font-extrabold text-[#173300]">No trips yet</h3>
                <p className="text-xs text-[#173300]/60 mt-2">Find or offer a ride to get started.</p>
                <button onClick={() => setActiveMainTab("carpooling")} className="mt-6 px-6 py-2.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-bold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300]">Go to Dashboard</button>
              </div>
            )}

            <div className="flex flex-col gap-6 max-w-4xl w-full mx-auto">
              {trips.map(trip => (
                <div key={trip.id} className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_#173300] flex flex-col gap-5">
                  {/* Trip Header */}
                  <div className="flex justify-between items-start pb-4 border-b-2 border-dashed border-[#B6B6B6]">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#FFEB5B] border-2 border-[#173300] flex items-center justify-center font-heading font-extrabold text-xl shadow-[3px_3px_0px_#173300]">
                        {trip.role === "DRIVER" ? "D" : trip.driverName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading text-xl font-extrabold text-[#173300]">{trip.role === "DRIVER" ? "Your Ride" : trip.driverName}</h3>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#173300]/10 rounded-lg">{trip.role}</span>
                        </div>
                        <div className="text-xs font-mono text-[#173300]/70">{trip.pickupLabel} to {trip.destinationLabel}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {statusBadge(trip.status)}
                      <span className="font-mono text-xs text-[#173300]/60">{trip.departureTime}</span>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
                    <div className="bg-[#173300]/[0.04] p-3 rounded-xl"><span className="text-[#173300]/60 uppercase block text-[10px]">Vehicle</span><span className="font-bold">{trip.vehicleModel}</span><span className="block text-[10px] text-[#173300]/60">{trip.plateNumber}</span></div>
                    <div className="bg-[#173300]/[0.04] p-3 rounded-xl"><span className="text-[#173300]/60 uppercase block text-[10px]">Pickup</span><span className="font-bold">{trip.pickupLabel}</span></div>
                    <div className="bg-[#173300]/[0.04] p-3 rounded-xl"><span className="text-[#173300]/60 uppercase block text-[10px]">Drop</span><span className="font-bold">{trip.destinationLabel}</span></div>
                  </div>

                  {/* Fare */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-[#173300]">₹{trip.fareAmount} · {trip.seatsBooked} seat{trip.seatsBooked > 1 ? "s" : ""}</span>
                    {trip.distanceKm > 0 && <span className="font-mono text-xs text-[#173300]/60">{trip.distanceKm.toFixed(1)} km · ~{Math.round(trip.durationMins)} min</span>}
                  </div>

                  {/* Live tracking map */}
                  {trackingTripId === trip.id && driverLocation && (
                    <div className="rounded-2xl overflow-hidden border-2 border-[#173300]">
                      <div className="bg-[#173300] text-[#FFEB5B] px-4 py-2 text-xs font-mono font-bold flex justify-between">
                        <span>Live Tracking</span>
                        {etaMinutes != null && <span>ETA: ~{Math.round(etaMinutes)} min</span>}
                      </div>
                      <RouteMap startAddress={trip.pickupLabel} destAddress={trip.destinationLabel} />
                    </div>
                  )}

                  {/* OTP display for passenger (received via socket) */}
                  {trip.role === "PASSENGER" && otpDisplay && trackingTripId === trip.id && (
                    <div className="bg-[#FFEB5B] border-2 border-[#173300] rounded-2xl p-4 text-center">
                      <div className="text-xs font-mono font-bold text-[#173300]/70 mb-1">Your OTP — Share with driver</div>
                      <div className="font-heading text-5xl font-extrabold text-[#173300] tracking-widest">{otpDisplay}</div>
                    </div>
                  )}

                  {/* Driver: start ride → generates OTP */}
                  {trip.role === "DRIVER" && trip.status === "SCHEDULED" && (
                    <div className="flex flex-col gap-3">
                      {otpDisplay && activeOtpTrip?.id === trip.id ? (
                        <div className="bg-[#FFEB5B] border-2 border-[#173300] rounded-2xl p-4 text-center">
                          <div className="text-xs font-mono font-bold text-[#173300]/70 mb-1">OTP for Passenger</div>
                          <div className="font-heading text-5xl font-extrabold text-[#173300] tracking-widest">{otpDisplay}</div>
                          <div className="text-xs font-mono text-[#173300]/60 mt-2">Ask passenger to confirm with this OTP</div>
                        </div>
                      ) : (
                        <button onClick={() => handleDriverStartRide(trip)} disabled={otpLoading}
                          className="w-full py-3.5 rounded-2xl bg-[#173300] text-[#FFEB5B] font-heading font-extrabold text-base border-2 border-[#173300] shadow-[4px_4px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-60">
                          {otpLoading ? "Generating OTP…" : "Start Ride — Generate OTP"}
                        </button>
                      )}
                      {otpError && <p className="text-red-600 text-xs font-semibold text-center">{otpError}</p>}
                    </div>
                  )}

                  {/* Passenger: enter OTP to start ride */}
                  {trip.role === "PASSENGER" && trip.status === "SCHEDULED" && !otpDisplay && (
                    <div className="flex flex-col gap-3">
                      <div className="text-xs font-mono text-[#173300]/60">Waiting for driver to start. Enter OTP when driver arrives:</div>
                      <div className="flex gap-2">
                        <input value={otpInput} onChange={e => setOtpInput(e.target.value)} placeholder="4-digit OTP" maxLength={4}
                          className="flex-1 px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-center font-heading text-2xl font-extrabold tracking-widest text-[#173300] outline-none focus:border-[#173300]" />
                        <button onClick={() => handleVerifyOtp(trip)} disabled={otpLoading}
                          className="px-5 py-2.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-bold text-sm border-2 border-[#173300] shadow-[3px_3px_0px_#173300] disabled:opacity-60">
                          {otpLoading ? "…" : "Verify"}
                        </button>
                      </div>
                      {otpError && <p className="text-red-600 text-xs font-semibold">{otpError}</p>}
                    </div>
                  )}

                  {/* Driver: end ride */}
                  {trip.role === "DRIVER" && trip.status === "IN_PROGRESS" && (
                    <button onClick={() => handleEndRide(trip)} className="w-full py-3.5 rounded-2xl bg-red-600 text-white font-heading font-extrabold text-base border-2 border-red-700 shadow-[4px_4px_0px_red] hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                      End Ride
                    </button>
                  )}

                  {/* Start tracking button */}
                  {isActiveTrip(trip) && trackingTripId !== trip.id && trip.status === "IN_PROGRESS" && (
                    <button onClick={() => setTrackingTripId(trip.id)} className="w-full py-2.5 rounded-xl border-2 border-[#173300] bg-[#FCFAF5] font-heading font-extrabold text-sm hover:bg-[#FFEB5B] transition-colors">
                      Track Live Location
                    </button>
                  )}

                  {/* Payment due */}
                  {needsPayment(trip) && (
                    <div className="flex items-center justify-between pt-2 border-t-2 border-dashed border-[#B6B6B6]">
                      <span className="font-heading text-2xl font-extrabold text-[#173300]">₹{trip.fareAmount}</span>
                      <button onClick={() => setPaymentTrip(trip)} className="px-8 py-3 rounded-xl bg-[#173300] text-[#FFEB5B] font-heading font-extrabold text-base border-2 border-[#173300] shadow-[4px_4px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                        Pay Now
                      </button>
                    </div>
                  )}

                  {/* Action buttons */}
                  {isActiveTrip(trip) && (
                    <div className="flex gap-3">
                      <button onClick={() => handleOpenChat(trip)} className="flex-1 px-4 py-2.5 rounded-xl border-2 border-[#173300] bg-[#FCFAF5] font-heading font-extrabold text-xs hover:bg-[#FFEB5B] transition-colors">
                        Chat
                      </button>
                      {trip.driverPhone && (
                        <a href={`tel:${trip.driverPhone}`} className="flex-1 px-4 py-2.5 rounded-xl border-2 border-[#173300] bg-[#FCFAF5] font-heading font-extrabold text-xs hover:bg-[#FFEB5B] transition-colors text-center">
                          Call {trip.role === "DRIVER" ? "Passenger" : "Driver"}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ MY VEHICLE TAB ═══ */}
        {activeMainTab === "my-vehicle" && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center border-b-2 border-dashed border-[#B6B6B6] pb-4">
              <h1 className="font-heading text-3xl font-extrabold text-[#173300]">My Vehicles</h1>
              <button onClick={() => setIsAddVehOpen(true)} className="px-5 py-2.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-heading font-extrabold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300]">
                + Register Vehicle
              </button>
            </div>

            {vehicles.length === 0 ? (
              <div className="text-center py-16">
                <h3 className="font-heading text-xl font-extrabold text-[#173300]">No vehicles registered</h3>
                <p className="text-xs text-[#173300]/60 mt-2">Register your vehicle to start offering rides.</p>
                <button onClick={() => setIsAddVehOpen(true)} className="mt-6 px-6 py-2.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-bold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300]">Register Now</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vehicles.map(v => (
                  <div key={v.id} className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 shadow-[6px_6px_0px_#173300] flex flex-col justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 bg-[#FFEB5B] border border-[#173300] rounded-md">{v.fuelType}</span>
                      <h3 className="font-heading text-2xl font-extrabold text-[#173300] mt-2">{v.model}</h3>
                      <div className="text-xs font-mono font-bold text-[#173300]/80 mt-0.5">Plate: {v.plateNumber}</div>
                    </div>
                    <div className="bg-[#173300]/[0.04] border border-dashed border-[#B6B6B6] rounded-xl p-3 font-mono text-xs flex justify-between">
                      <span>Capacity: {v.capacity} Seats</span>
                      <span className={`font-bold ${v.status === "Verified" ? "text-emerald-700" : "text-amber-700"}`}>● {v.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ RIDE HISTORY TAB ═══ */}
        {activeMainTab === "ride-history" && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <h1 className="font-heading text-3xl font-extrabold text-[#173300] border-b-2 border-dashed border-[#B6B6B6] pb-4">Ride History</h1>

            {rideHistory.length === 0 ? (
              <div className="text-center py-16">
                <h3 className="font-heading text-xl font-extrabold text-[#173300]">No completed trips yet</h3>
                <p className="text-xs text-[#173300]/60 mt-2">Completed rides will appear here.</p>
              </div>
            ) : (
              <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 shadow-[6px_6px_0px_#173300] space-y-4">
                {rideHistory.map(h => (
                  <div key={h.id} className="bg-[#173300]/[0.03] border-2 border-dashed border-[#B6B6B6] rounded-2xl p-4 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] font-mono text-[#173300]/50">{h.departureTime}</div>
                      <h4 className="font-heading text-lg font-extrabold text-[#173300]">{h.pickupLabel} to {h.destinationLabel}</h4>
                      <div className="text-xs text-[#173300]/70">
                        {h.role === "DRIVER" ? "You drove" : `Driver: ${h.driverName}`} · {h.vehicleModel}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-extrabold font-heading text-[#173300]">₹{h.fareAmount}</span>
                      <div>{statusBadge(h.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ WALLET TAB ═══ */}
        {activeMainTab === "wallet" && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <h1 className="font-heading text-3xl font-extrabold text-[#173300] border-b-2 border-dashed border-[#B6B6B6] pb-4">Wallet</h1>
            <div className="bg-[#FFEB5B] border-2 border-[#173300] rounded-3xl p-8 shadow-[8px_8px_0px_#173300] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-[#173300]/70">Current Balance</span>
                <div className="text-4xl font-extrabold font-heading text-[#173300] mt-1">₹ {walletBalance.toFixed(2)}</div>
              </div>
              <button onClick={() => setIsRechargeOpen(true)} className="px-6 py-3 rounded-2xl bg-[#173300] text-[#FFEB5B] font-heading font-extrabold text-sm border-2 border-[#173300] shadow-[3px_3px_0px_#173300]">
                Recharge Wallet
              </button>
            </div>
            {walletTransactions.length > 0 && (
              <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 shadow-[6px_6px_0px_#173300]">
                <h3 className="font-heading font-extrabold text-lg text-[#173300] mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                  {walletTransactions.slice(0, 10).map(tx => (
                    <div key={tx.id} className="flex justify-between items-center py-2 border-b border-dashed border-[#B6B6B6] last:border-0">
                      <div>
                        <div className="font-semibold text-sm text-[#173300]">{tx.description}</div>
                        <div className="text-xs text-[#173300]/60">{new Date(tx.createdAt).toLocaleDateString()}</div>
                      </div>
                      <span className={`font-heading font-extrabold text-base ${tx.type === "CREDIT" ? "text-emerald-700" : "text-red-600"}`}>
                        {tx.type === "CREDIT" ? "+" : "-"}₹{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ SETTINGS TAB ═══ */}
        {activeMainTab === "setting" && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center border-b-2 border-dashed border-[#B6B6B6] pb-4">
              <h1 className="font-heading text-3xl font-extrabold text-[#173300]">Saved Places</h1>
              <button onClick={() => setIsAddPlaceOpen(true)} className="px-4 py-2 rounded-xl bg-[#173300] text-[#FFEB5B] font-bold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300]">+ Add Place</button>
            </div>
            {savedPlaces.length === 0 ? (
              <div className="text-center py-12">
                <p className="font-semibold text-[#173300]">No saved places yet.</p>
                <button onClick={() => setIsAddPlaceOpen(true)} className="mt-4 px-6 py-2 rounded-xl bg-[#173300] text-[#FFEB5B] font-bold text-xs border-2 border-[#173300] shadow-[2px_2px_0px_#173300]">Add Your First Place</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedPlaces.map(sp => (
                  <div key={sp.id} className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-5 shadow-[5px_5px_0px_#173300]">
                    <h3 className="font-heading text-lg font-extrabold text-[#173300]">{sp.label}</h3>
                    <p className="text-xs font-mono text-[#173300]/70 mt-1">{sp.address}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ════ BARGAIN / NEGOTIATION MODAL ════ */}
      {negotiating && (
        <div className="fixed inset-0 z-50 bg-[#173300]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 max-w-md w-full shadow-[8px_8px_0px_#173300] flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <h3 className="font-heading text-2xl font-extrabold text-[#173300]">Bargain Fare</h3>
              <button onClick={() => setNegotiating(null)} className="w-8 h-8 rounded-full border border-[#173300] font-bold text-xs hover:bg-[#FFEB5B]">✕</button>
            </div>

            <div className="bg-[#173300]/[0.04] rounded-2xl p-4 text-center">
              <div className="text-xs font-mono text-[#173300]/60 mb-1">Listed Fare</div>
              <div className="text-2xl font-extrabold font-heading text-[#173300] line-through opacity-50">₹{negotiating.listedFare}</div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono font-bold uppercase text-[#173300]">Your Offer</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setBargainAmount(Math.max(10, bargainAmount - 10))} className="w-10 h-10 rounded-xl border-2 border-[#173300] font-extrabold hover:bg-[#FFEB5B]">−₹10</button>
                <button onClick={() => setBargainAmount(Math.max(10, bargainAmount - 5))} className="w-10 h-10 rounded-xl border-2 border-[#173300] font-extrabold hover:bg-[#FFEB5B]">−₹5</button>
                <div className="flex-1 text-center font-heading text-3xl font-extrabold text-[#173300]">₹{bargainAmount}</div>
                <button onClick={() => setBargainAmount(bargainAmount + 5)} className="w-10 h-10 rounded-xl border-2 border-[#173300] font-extrabold hover:bg-[#FFEB5B]">+₹5</button>
                <button onClick={() => setBargainAmount(bargainAmount + 10)} className="w-10 h-10 rounded-xl border-2 border-[#173300] font-extrabold hover:bg-[#FFEB5B]">+₹10</button>
              </div>
            </div>

            {negotiating.history.length > 0 && (
              <div className="bg-[#173300]/[0.04] rounded-xl p-3 max-h-32 overflow-y-auto space-y-1">
                {negotiating.history.map((h, i) => (
                  <div key={i} className="text-xs font-mono flex justify-between">
                    <span className="text-[#173300]/70">{h.by}</span>
                    <span className="font-bold text-[#173300]">₹{h.amount} at {h.time}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleSendOffer} className="flex-1 py-3 rounded-xl bg-[#173300] text-[#FFEB5B] font-heading font-extrabold text-sm border-2 border-[#173300] shadow-[3px_3px_0px_#173300]">
                Send Offer ₹{bargainAmount}
              </button>
              {negotiating.negotiationId && (
                <button onClick={handleAcceptNegotiation} className="flex-1 py-3 rounded-xl bg-[#FFEB5B] text-[#173300] font-heading font-extrabold text-sm border-2 border-[#173300] shadow-[3px_3px_0px_#173300]">
                  Accept & Book
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════ PAYMENT MODAL ════ */}
      {paymentTrip && (
        <div className="fixed inset-0 z-50 bg-[#173300]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 max-w-md w-full shadow-[8px_8px_0px_#173300] flex flex-col gap-5">
            <h3 className="font-heading text-2xl font-extrabold text-[#173300]">Pay for Ride</h3>
            <div className="bg-[#173300]/[0.04] border border-dashed border-[#B6B6B6] rounded-2xl p-4 font-mono text-xs space-y-1">
              <div>Route: <span className="font-bold">{paymentTrip.pickupLabel} to {paymentTrip.destinationLabel}</span></div>
              <div>Total: <span className="font-bold text-lg text-[#173300]">₹{paymentTrip.fareAmount}</span></div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono font-bold uppercase text-[#173300]/70">Payment Method</label>
              {(["CASH","WALLET","CARD","UPI"] as const).map(m => (
                <button key={m} onClick={() => setPayMethod(m)}
                  className={`p-3 rounded-xl border-2 font-mono text-xs font-bold flex justify-between items-center ${payMethod === m ? "bg-[#173300] text-[#FFEB5B] border-[#173300]" : "bg-[#FCFAF5] text-[#173300] border-[#B6B6B6]"}`}>
                  <span>{m === "CASH" ? "Cash" : m === "WALLET" ? "Wallet" : m === "CARD" ? "Card" : "UPI"}</span>
                  {m === "WALLET" && <span className="opacity-70">(Balance: ₹{walletBalance.toFixed(0)})</span>}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPaymentTrip(null)} className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-semibold">Cancel</button>
              <button onClick={handlePayNow} disabled={payLoading} className="flex-1 py-2.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-bold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300] disabled:opacity-60">
                {payLoading ? "Processing…" : `Confirm ₹${paymentTrip.fareAmount}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ CHAT MODAL ════ */}
      {chatOpenTrip && (
        <div className="fixed inset-0 z-50 bg-[#173300]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 max-w-lg w-full shadow-[8px_8px_0px_#173300] flex flex-col gap-4">
            <div className="flex justify-between items-center border-b-2 border-dashed border-[#B6B6B6] pb-3">
              <div>
                <h3 className="font-heading text-xl font-extrabold text-[#173300]">Trip Chat</h3>
                <span className="text-xs font-mono text-[#173300]/60">{chatOpenTrip.pickupLabel} to {chatOpenTrip.destinationLabel}</span>
              </div>
              <button onClick={() => setChatOpenTrip(null)} className="w-8 h-8 rounded-full border border-[#173300] font-bold text-xs hover:bg-[#FFEB5B]">✕</button>
            </div>
            <div className="h-64 overflow-y-auto space-y-3 bg-[#173300]/[0.03] border border-dashed border-[#B6B6B6] rounded-2xl p-4">
              {chatMessages.length === 0 && <p className="text-xs text-center text-[#173300]/40 font-mono mt-8">No messages yet. Say hi!</p>}
              {chatMessages.map((msg, idx) => (
                <div key={idx} className="bg-[#FCFAF5] border border-[#173300] rounded-xl p-3 text-xs font-mono">
                  <div className="flex justify-between text-[10px] font-bold text-[#173300]/50 mb-1"><span>{msg.sender}</span><span>{msg.time}</span></div>
                  <p className="text-[#173300] font-semibold">{msg.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input type="text" value={chatText} onChange={e => setChatText(e.target.value)} placeholder="Type message…" className="flex-1 px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-xs outline-none focus:border-[#173300]" />
              <button type="submit" className="px-5 py-2.5 bg-[#173300] text-[#FFEB5B] font-bold text-xs rounded-xl border-2 border-[#173300] shadow-[2px_2px_0px_#173300]">Send</button>
            </form>
          </div>
        </div>
      )}

      {/* ════ ADD VEHICLE MODAL ════ */}
      {isAddVehOpen && (
        <div className="fixed inset-0 z-50 bg-[#173300]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 max-w-md w-full shadow-[8px_8px_0px_#173300] flex flex-col gap-4">
            <h3 className="font-heading text-2xl font-extrabold text-[#173300]">Register Vehicle</h3>
            <form onSubmit={handleAddVehicleSubmit} className="flex flex-col gap-4">
              <input type="text" value={newModel} onChange={e => setNewModel(e.target.value)} placeholder="Model (e.g. Swift Dzire)" required className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-sm font-semibold outline-none focus:border-[#173300]" />
              <input type="text" value={newPlate} onChange={e => setNewPlate(e.target.value)} placeholder="Plate Number (e.g. GJ01AB1234)" required className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-sm font-semibold outline-none focus:border-[#173300]" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min={1} max={8} value={newCap} onChange={e => setNewCap(Number(e.target.value))} placeholder="Seats" required className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-sm font-mono outline-none" />
                <select value={newFuel} onChange={e => setNewFuel(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-sm font-mono outline-none">
                  {["Petrol","Diesel","Electric","Hybrid"].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAddVehOpen(false)} className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-semibold">Cancel</button>
                <button type="submit" disabled={vehLoading} className="flex-1 py-2.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-bold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300] disabled:opacity-60">
                  {vehLoading ? "Saving…" : "Save Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ ADD SAVED PLACE MODAL ════ */}
      {isAddPlaceOpen && (
        <div className="fixed inset-0 z-50 bg-[#173300]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 max-w-md w-full shadow-[8px_8px_0px_#173300] flex flex-col gap-4">
            <h3 className="font-heading text-2xl font-extrabold text-[#173300]">Add Saved Place</h3>
            <form onSubmit={handleAddPlaceSubmit} className="flex flex-col gap-4">
              <input type="text" value={newPlaceLabel} onChange={e => setNewPlaceLabel(e.target.value)} placeholder="Label (Home, Office…)" required className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-sm font-semibold outline-none focus:border-[#173300]" />
              <LocationInput id="new-place-address" label="Address" value={newPlaceAddress} onChange={setNewPlaceAddress} placeholder="Full address" required showAutoDetect />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAddPlaceOpen(false)} className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-semibold">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-bold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300]">Save Place</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ RECHARGE WALLET MODAL ════ */}
      {isRechargeOpen && (
        <div className="fixed inset-0 z-50 bg-[#173300]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 max-w-md w-full shadow-[8px_8px_0px_#173300] flex flex-col gap-5">
            <h3 className="font-heading text-2xl font-extrabold text-[#173300]">Recharge Wallet</h3>
            <form onSubmit={async e => {
              e.preventDefault();
              try {
                const { apiRechargeWallet } = await import("../lib/api");
                const order = await apiRechargeWallet(rechargeAmt);
                alert(`Razorpay order created: ${order.orderId}. Integrate Razorpay checkout here.`);
              } catch { /* fallback: add locally for demo */
                setWalletBalance(prev => prev + rechargeAmt);
              }
              setIsRechargeOpen(false);
            }} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold uppercase text-[#173300]/70">Amount (₹)</label>
                <input type="number" min={50} value={rechargeAmt} onChange={e => setRechargeAmt(Number(e.target.value))} required className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-sm font-mono font-bold text-[#173300] outline-none" />
                <div className="flex gap-2 mt-1">
                  {[100,200,500,1000].map(amt => <button key={amt} type="button" onClick={() => setRechargeAmt(amt)} className="flex-1 py-1.5 rounded-lg border border-[#B6B6B6] text-xs font-bold hover:bg-[#FFEB5B] transition-colors">₹{amt}</button>)}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsRechargeOpen(false)} className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-semibold">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-bold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300]">Recharge ₹{rechargeAmt}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
