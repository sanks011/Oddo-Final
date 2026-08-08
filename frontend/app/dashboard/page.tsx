"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "../context/AuthContext";
import LocationInput from "../components/LocationInput";

const RouteMap = dynamic(() => import("../components/RouteMap"), { ssr: false });

/* ── Types ─────────────────────────────────────────── */
type MainTab =
  | "carpooling"
  | "my-trips"
  | "my-vehicle"
  | "ride-history"
  | "wallet"
  | "setting";

type FindRideStep = "search" | "route-confirm" | "available-rides";
type OfferRideStep = "form" | "route-confirm";
type TripDetailStep = "detail" | "finish" | "live-tracking";

interface SavedPlace {
  id: string;
  label: string;
  address: string;
}

interface Vehicle {
  id: string;
  model: string;
  plateNumber: string;
  capacity: number;
  fuelType: "Electric" | "Hybrid" | "Petrol" | "Diesel";
  status: "Verified" | "Pending";
}

interface AvailableRide {
  id: string;
  driverName: string;
  driverRating: number;
  driverPhone: string;
  model: string;
  plateNumber: string;
  pickupLabel: string;
  destinationLabel: string;
  departureTime: string;
  availableSeats: number;
  farePerSeat: number;
  distanceKm: number;
  durationMins: number;
}

interface Trip {
  id: string;
  role: "PASSENGER" | "DRIVER";
  driverName: string;
  driverPhone: string;
  passengers: string[];
  vehicleModel: string;
  plateNumber: string;
  pickupLabel: string;
  destinationLabel: string;
  departureTime: string;
  seatsBooked: number;
  fareAmount: number;
  status:
    | "RIDE_BOOKED"
    | "TRIP_STARTED"
    | "TRIP_IN_PROGRESS"
    | "TRIP_COMPLETED"
    | "PAYMENT_PENDING"
    | "PAYMENT_COMPLETED";
  distanceKm: number;
  durationMins: number;
}

/* ── Pre-seeded Demo Data ───────────────────────────── */
const INITIAL_SAVED_PLACES: SavedPlace[] = [
  { id: "sp-1", label: "Home", address: "Sector 4, Green Avenue" },
  { id: "sp-2", label: "Office", address: "Tech Tower, Block B" },
];

const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: "v-101",
    model: "Swift Dzire (Silver)",
    plateNumber: "GJ01AB1234",
    capacity: 4,
    fuelType: "Petrol",
    status: "Verified",
  },
];

const INITIAL_AVAILABLE_RIDES: AvailableRide[] = [
  {
    id: "ride-1",
    driverName: "Raj Patel",
    driverRating: 4.9,
    driverPhone: "+91 98765 43210",
    model: "Swift Dzire",
    plateNumber: "GJ01AB1234",
    pickupLabel: "Iskcon",
    destinationLabel: "Infocity",
    departureTime: "07:00 PM 18/July/26",
    availableSeats: 2,
    farePerSeat: 120,
    distanceKm: 26,
    durationMins: 33,
  },
  {
    id: "ride-2",
    driverName: "Krishna Singh",
    driverRating: 4.8,
    driverPhone: "+91 98765 11223",
    model: "Honda City",
    plateNumber: "GJ01XY9988",
    pickupLabel: "Iskcon",
    destinationLabel: "Infocity",
    departureTime: "08:00 PM 18/July/26",
    availableSeats: 2,
    farePerSeat: 120,
    distanceKm: 26,
    durationMins: 34,
  },
];

const INITIAL_TRIPS: Trip[] = [
  {
    id: "trip-901",
    role: "PASSENGER",
    driverName: "Raj Patel",
    driverPhone: "+91 98765 43210",
    passengers: ["Jane Doe"],
    vehicleModel: "Swift Dzire",
    plateNumber: "GJ01AB1234",
    pickupLabel: "Iskcon",
    destinationLabel: "Infocity",
    departureTime: "07:00 PM 18/July/26",
    seatsBooked: 1,
    fareAmount: 120,
    status: "TRIP_IN_PROGRESS",
    distanceKm: 26,
    durationMins: 33,
  },
];

export default function EmployeeDashboard() {
  const router = useRouter();
  const { logout } = useAuth();

  /* Auth Guard */
  useEffect(() => {
    if (typeof document !== "undefined") {
      const hasToken = document.cookie
        .split("; ")
        .some((row) => row.startsWith("auth-token=") || row.startsWith("access-token="));
      if (!hasToken) {
        router.replace("/login?from=/dashboard");
      }
    }
  }, [router]);

  /* Main Navigation Tab State */
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("carpooling");

  /* Mode Switcher inside Carpooling: Find Ride vs Offer Ride */
  const [carpoolMode, setCarpoolMode] = useState<"find" | "offer">("find");

  /* Sub-screen steps */
  const [findStep, setFindStep] = useState<FindRideStep>("search");
  const [offerStep, setOfferStep] = useState<OfferRideStep>("form");

  /* Form & Data States */
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>(INITIAL_SAVED_PLACES);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [availableRides, setAvailableRides] = useState<AvailableRide[]>(INITIAL_AVAILABLE_RIDES);
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);
  const [walletBalance, setWalletBalance] = useState<number>(500);

  /* Find Ride Inputs */
  const [startLoc, setStartLoc] = useState("");
  const [destLoc, setDestLoc] = useState("");
  const [travelDateTime, setTravelDateTime] = useState("2026-08-08T18:30");
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [isRecurring, setIsRecurring] = useState(true);
  const [recurringDays, setRecurringDays] = useState(["Mo", "Tu", "We", "Th", "Fr"]);

  /* Offer Ride Inputs */
  const [offerVehId, setOfferVehId] = useState(vehicles[0]?.id || "");
  const [offerStartLoc, setOfferStartLoc] = useState("");
  const [offerDestLoc, setOfferDestLoc] = useState("");
  const [offerDateTime, setOfferDateTime] = useState("2026-08-08T19:00");
  const [offerSeatsAvailable, setOfferSeatsAvailable] = useState(3);
  const [offerFarePerSeat, setOfferFarePerSeat] = useState(120);

  /* Modals */
  const [chatOpenTrip, setChatOpenTrip] = useState<Trip | null>(null);
  const [chatMessages, setChatMessages] = useState([
    { sender: "Raj Patel (Driver)", text: "Hi Jane! Reaching Iskcon pickup point in 5 minutes.", time: "06:55 PM" },
    { sender: "Jane Doe (You)", text: "Sure Raj, standing right near the main gate.", time: "06:56 PM" },
  ]);
  const [chatText, setChatText] = useState("");
  const [callTrip, setCallTrip] = useState<Trip | null>(null);
  const [callActive, setCallActive] = useState(true);

  /* Payment modal */
  const [paymentTrip, setPaymentTrip] = useState<Trip | null>(null);
  const [payMethod, setPayMethod] = useState<"WALLET" | "CASH" | "CARD" | "UPI">("WALLET");

  /* New Vehicle / Saved Place Modals */
  const [isAddVehOpen, setIsAddVehOpen] = useState(false);
  const [newModel, setNewModel] = useState("");
  const [newPlate, setNewPlate] = useState("");
  const [newCap, setNewCap] = useState(4);
  const [newFuel, setNewFuel] = useState<Vehicle["fuelType"]>("Petrol");

  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [newPlaceLabel, setNewPlaceLabel] = useState("");
  const [newPlaceAddress, setNewPlaceAddress] = useState("");

  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [rechargeAmt, setRechargeAmt] = useState(200);

  /* ── Handlers ───────────────────────────────────────── */

  /* Swap Start & Destination */
  const handleSwapLocations = () => {
    const temp = startLoc;
    setStartLoc(destLoc);
    setDestLoc(temp);
  };

  /* Step 1 -> Step 2 (Route Confirm) */
  const handleFindRideClick = (e: React.FormEvent) => {
    e.preventDefault();
    setFindStep("route-confirm");
  };

  /* Step 2 -> Step 3 (Available Rides) */
  const handleConfirmRouteClick = () => {
    setFindStep("available-rides");
  };

  /* Book Seat from Available Rides */
  const handleBookNow = (ride: AvailableRide) => {
    const newTrip: Trip = {
      id: `trip-${Date.now().toString().slice(-4)}`,
      role: "PASSENGER",
      driverName: ride.driverName,
      driverPhone: ride.driverPhone,
      passengers: ["Jane Doe"],
      vehicleModel: ride.model,
      plateNumber: ride.plateNumber,
      pickupLabel: ride.pickupLabel,
      destinationLabel: ride.destinationLabel,
      departureTime: ride.departureTime,
      seatsBooked: selectedSeats,
      fareAmount: ride.farePerSeat * selectedSeats,
      status: "RIDE_BOOKED",
      distanceKm: ride.distanceKm,
      durationMins: ride.durationMins,
    };
    setTrips((prev) => [newTrip, ...prev]);
    setActiveMainTab("my-trips");
  };

  /* Offer Ride Publish Flow */
  const handleOfferFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOfferStep("route-confirm");
  };

  const handleConfirmOfferPublish = () => {
    const veh = vehicles.find((v) => v.id === offerVehId) || vehicles[0];
    const newRideOffer: AvailableRide = {
      id: `ride-${Date.now().toString().slice(-4)}`,
      driverName: "Jane Doe (You)",
      driverRating: 5.0,
      driverPhone: "+91 99999 88888",
      model: veh?.model || "Swift Dzire",
      plateNumber: veh?.plateNumber || "GJ01AB1234",
      pickupLabel: offerStartLoc,
      destinationLabel: offerDestLoc,
      departureTime: offerDateTime,
      availableSeats: offerSeatsAvailable,
      farePerSeat: offerFarePerSeat,
      distanceKm: 26,
      durationMins: 33,
    };
    setAvailableRides((prev) => [newRideOffer, ...prev]);
    setOfferStep("form");
    setCarpoolMode("find");
    setFindStep("available-rides");
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { sender: "Jane Doe (You)", text: chatText.trim(), time: "Just now" },
    ]);
    setChatText("");
  };

  const handlePayNow = () => {
    if (!paymentTrip) return;
    if (payMethod === "WALLET") {
      if (walletBalance < paymentTrip.fareAmount) {
        alert("Insufficient Wallet balance. Please recharge your wallet.");
        return;
      }
      setWalletBalance((prev) => prev - paymentTrip.fareAmount);
    }
    setTrips((prev) =>
      prev.map((t) => (t.id === paymentTrip.id ? { ...t, status: "PAYMENT_COMPLETED" } : t))
    );
    setPaymentTrip(null);
  };

  const handleAddVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel || !newPlate) return;
    setVehicles((prev) => [
      ...prev,
      {
        id: `v-${Date.now()}`,
        model: newModel,
        plateNumber: newPlate,
        capacity: newCap,
        fuelType: newFuel,
        status: "Verified",
      },
    ]);
    setNewModel("");
    setNewPlate("");
    setIsAddVehOpen(false);
  };

  const handleAddPlaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaceLabel || !newPlaceAddress) return;
    setSavedPlaces((prev) => [
      ...prev,
      { id: `sp-${Date.now()}`, label: newPlaceLabel, address: newPlaceAddress },
    ]);
    setNewPlaceLabel("");
    setNewPlaceAddress("");
    setIsAddPlaceOpen(false);
  };

  const activeTrip = trips.find(
    (t) => t.status === "TRIP_IN_PROGRESS" || t.status === "TRIP_STARTED"
  );

  return (
    <div className="min-h-screen bg-[#FCFAF5] text-[#173300] flex flex-col font-sans">
      {/* ── Wireframe Navigation Bar Header ─────────────────────── */}
      <header className="border-b-2 border-[#173300] bg-[#FCFAF5] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-6">
          {/* Main Logo & Title */}
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <img src="/logo.svg" alt="Oddo Logo" className="h-8 w-auto" />
            <span className="font-heading font-extrabold text-2xl text-[#173300] tracking-tight">
              Carpooling
            </span>
          </Link>

          {/* Navigation Links Matching Wireframe */}
          <nav className="flex items-center gap-1 sm:gap-2 lg:gap-3 overflow-x-auto scrollbar-none font-heading font-bold text-xs sm:text-sm p-2">
            {[
              { id: "carpooling", label: "Dashboard" },
              { id: "my-trips", label: "My Trips" },
              { id: "my-vehicle", label: "My Vehicle" },
              { id: "ride-history", label: "Ride History" },
              { id: "wallet", label: "Wallet" },
              { id: "setting", label: "Setting" },
            ].map((nav) => (
              <button
                key={nav.id}
                onClick={() => setActiveMainTab(nav.id as MainTab)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  activeMainTab === nav.id
                    ? "bg-[#173300] text-[#FFEB5B] border-2 border-[#173300] shadow-[2px_2px_0px_#173300] font-extrabold"
                    : "text-[#173300]/80 hover:bg-[#173300]/[0.08] hover:text-[#173300] border-2 border-transparent"
                }`}
              >
                {nav.label}
              </button>
            ))}
          </nav>

          {/* User Profile Pill & Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-[#FCFAF5] border-2 border-[#173300] rounded-2xl px-3 py-1.5 shadow-[2px_2px_0px_#173300] font-mono text-xs font-bold text-[#173300]">
              <div className="w-6 h-6 rounded-full bg-[#FFEB5B] border border-[#173300] flex items-center justify-center font-extrabold text-xs">
                J
              </div>
              <span className="hidden sm:inline">Jane Doe</span>
            </div>

            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              title="Sign Out"
              className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl border-2 border-[#173300] bg-[#FCFAF5] hover:bg-[#FFEB5B] shadow-[2px_2px_0px_#173300] transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Canvas Layout ──────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ═════════════════════════════════════════════════════════
            1. CARPOOLING MAIN SECTION (Find Ride / Offer Ride)
           ═════════════════════════════════════════════════════════ */}
        {activeMainTab === "carpooling" && (
          <div className="flex flex-col gap-6">
            {/* Top Toggle Switcher: Find Ride vs Offer Ride (Matching Image 1) */}
            <div className="flex items-center gap-4 border-b-2 border-dashed border-[#B6B6B6] pb-4">
              <div className="bg-[#173300]/[0.06] p-1 rounded-2xl border-2 border-dashed border-[#B6B6B6] flex items-center gap-2 max-w-md w-full">
                <button
                  onClick={() => {
                    setCarpoolMode("find");
                    setFindStep("search");
                  }}
                  className={`flex-1 py-3 rounded-xl font-heading font-extrabold text-sm transition-all text-center ${
                    carpoolMode === "find"
                      ? "bg-[#173300] text-[#FFEB5B] shadow-[3px_3px_0px_#173300]"
                      : "text-[#173300]/70 hover:text-[#173300]"
                  }`}
                >
                  Find Ride
                </button>
                <button
                  onClick={() => {
                    setCarpoolMode("offer");
                    setOfferStep("form");
                  }}
                  className={`flex-1 py-3 rounded-xl font-heading font-extrabold text-sm transition-all text-center ${
                    carpoolMode === "offer"
                      ? "bg-[#173300] text-[#FFEB5B] shadow-[3px_3px_0px_#173300]"
                      : "text-[#173300]/70 hover:text-[#173300]"
                  }`}
                >
                  Offer Ride
                </button>
              </div>
            </div>

            {/* ────── MODE A: FIND RIDE FLOW ────── */}
            {carpoolMode === "find" && (
              <>
                {/* FIND RIDE - SCREEN 1: Search Inputs (Matching Image 1 Wireframe) */}
                {findStep === "search" && (
                  <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_#173300] max-w-3xl w-full mx-auto flex flex-col gap-6">
                    {/* Quick Pick Saved Places */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#173300]/60 uppercase">
                        Quick Pick:
                      </span>
                      {savedPlaces.map((sp) => (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() => setStartLoc(sp.address)}
                          className="px-3 py-1 bg-[#173300]/[0.05] border border-[#B6B6B6] rounded-xl text-xs font-semibold hover:bg-[#FFEB5B]"
                        >
                          {sp.label}
                        </button>
                      ))}
                    </div>

                    <form onSubmit={handleFindRideClick} className="flex flex-col gap-6">
                      {/* Start Location & Destination with Swap Button */}
                      <div className="flex flex-col gap-5 relative">
                        {/* Start Location Input with Ola Maps Autocomplete & Auto-Detect GPS */}
                        <LocationInput
                          id="start-location"
                          label="Start Location"
                          value={startLoc}
                          onChange={setStartLoc}
                          placeholder="Enter Your location"
                          required
                          showAutoDetect={true}
                        />

                        {/* Interactive Swap Button (Matching Image 1 Wireframe) */}
                        <div className="flex justify-end -my-2 z-10">
                          <button
                            type="button"
                            onClick={handleSwapLocations}
                            className="w-10 h-10 rounded-2xl bg-[#FCFAF5] border-2 border-[#173300] shadow-[2px_2px_0px_#173300] flex items-center justify-center font-bold text-base hover:bg-[#FFEB5B] transition-all"
                            title="Swap Start & Destination"
                          >
                            ⇅
                          </button>
                        </div>

                        {/* Destination Location Input with Ola Maps Autocomplete */}
                        <LocationInput
                          id="dest-location"
                          label="Destination Location"
                          value={destLoc}
                          onChange={setDestLoc}
                          placeholder="Enter Drop location"
                          required
                        />
                      </div>

                      {/* Travel Date/Time & Seat Selector */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                        {/* Travel Date & Time */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-mono font-bold uppercase text-[#173300]">
                            Travel Schedule
                          </label>
                          <div className="flex items-center gap-2 border-b-2 border-[#173300] pb-2">
                            <svg className="w-5 h-5 text-[#173300]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <input
                              type="datetime-local"
                              value={travelDateTime}
                              onChange={(e) => setTravelDateTime(e.target.value)}
                              className="w-full bg-[#FCFAF5] text-xs font-mono font-extrabold text-[#173300] outline-none cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Seat Selector */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-mono font-bold uppercase text-[#173300]">
                            Required Seats
                          </label>
                          <div className="flex items-center gap-2 border-b-2 border-[#173300] pb-2">
                            <svg className="w-5 h-5 text-[#173300]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            <select
                              value={selectedSeats}
                              onChange={(e) => setSelectedSeats(Number(e.target.value))}
                              className="w-full bg-[#FCFAF5] text-sm font-heading font-extrabold text-[#173300] outline-none cursor-pointer"
                            >
                              <option value={1}>Seat 1</option>
                              <option value={2}>Seat 2</option>
                              <option value={3}>Seat 3</option>
                              <option value={4}>Seat 4</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Recurring Ride Switch & Days (Matching Image 1 Wireframe) */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-b-2 border-[#173300] pb-4">
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-[#173300]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <polyline points="23 4 23 10 17 10" />
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                          </svg>
                          <span className="font-heading font-extrabold text-sm text-[#173300]">
                            Recurring Ride — {recurringDays.join(",")}
                          </span>
                        </div>

                        {/* Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => setIsRecurring(!isRecurring)}
                          className={`w-12 h-6 rounded-full p-0.5 border-2 border-[#173300] transition-all flex items-center ${
                            isRecurring ? "bg-[#173300] justify-end" : "bg-[#B6B6B6] justify-start"
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-[#FFEB5B] border border-[#173300]" />
                        </button>
                      </div>

                      {/* Full-width Find Ride Button */}
                      <button
                        type="submit"
                        className="mt-2 w-full py-4 rounded-2xl bg-[#173300] text-[#FFEB5B] font-heading font-extrabold text-base border-2 border-[#173300] shadow-[4px_4px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                      >
                        Find Ride
                      </button>
                    </form>
                  </div>
                )}

                {/* FIND RIDE - SCREEN 2: Route Confirmation Map (Matching Image 2 Wireframe) */}
                {findStep === "route-confirm" && (
                  <div className="flex flex-col gap-6">
                    {/* Header Breadcrumb */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setFindStep("search")}
                        className="px-3 py-1.5 rounded-xl border-2 border-[#173300] bg-[#FCFAF5] font-bold text-xs hover:bg-[#FFEB5B]"
                      >
                        ← Back to Search
                      </button>
                      <h2 className="font-heading text-2xl font-extrabold text-[#173300]">
                        Route Confirmation
                      </h2>
                    </div>

                    {/* Route Confirmation Container */}
                    <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 shadow-[8px_8px_0px_#173300] flex flex-col gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                        <div className="bg-[#173300]/[0.04] p-3 rounded-xl border border-[#B6B6B6]">
                          <span className="text-[#173300]/60 uppercase block text-[10px]">Start Location</span>
                          <span className="font-bold text-sm text-[#173300]">{startLoc}</span>
                        </div>
                        <div className="bg-[#173300]/[0.04] p-3 rounded-xl border border-[#B6B6B6]">
                          <span className="text-[#173300]/60 uppercase block text-[10px]">Destination Location</span>
                          <span className="font-bold text-sm text-[#173300]">{destLoc}</span>
                        </div>
                      </div>

                      {/* Real Interactive OpenStreetMap & OSRM Driving Route Map */}
                      <RouteMap startAddress={startLoc} destAddress={destLoc} />

                      {/* Bottom Full-width Confirm Button */}
                      <button
                        onClick={handleConfirmRouteClick}
                        className="w-full py-4 rounded-2xl bg-[#FFEB5B] text-[#173300] font-heading font-extrabold text-lg border-2 border-[#173300] shadow-[4px_4px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                      >
                        Confirm Route &amp; Search Rides
                      </button>
                    </div>
                  </div>
                )}

                {/* FIND RIDE - SCREEN 3: Available Rides List (Matching Image 3 Wireframe) */}
                {findStep === "available-rides" && (
                  <div className="flex flex-col gap-6">
                    {/* Header Breadcrumb */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setFindStep("route-confirm")}
                          className="px-3 py-1.5 rounded-xl border-2 border-[#173300] bg-[#FCFAF5] font-bold text-xs hover:bg-[#FFEB5B]"
                        >
                          ← Route
                        </button>
                        <h2 className="font-heading text-2xl font-extrabold text-[#173300]">
                          Available Rides
                        </h2>
                      </div>

                      <button
                        onClick={() => setFindStep("search")}
                        className="text-xs font-mono font-bold underline text-[#173300]"
                      >
                        New Search
                      </button>
                    </div>

                    {/* Available Rides Cards List */}
                    <div className="flex flex-col gap-4">
                      {availableRides.map((ride) => (
                        <div
                          key={ride.id}
                          className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 shadow-[6px_6px_0px_#173300] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative"
                        >
                          {/* Driver Avatar & Details */}
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-[#FFEB5B] border-2 border-[#173300] flex items-center justify-center font-heading font-extrabold text-xl shadow-[3px_3px_0px_#173300]">
                              {ride.driverName.charAt(0)}
                            </div>

                            <div>
                              <h3 className="font-heading text-xl font-extrabold text-[#173300]">
                                {ride.driverName}
                              </h3>
                              <div className="text-xs font-mono font-semibold text-[#173300]/70 mt-0.5">
                                {ride.pickupLabel} to {ride.destinationLabel}
                              </div>
                            </div>
                          </div>

                          {/* Time, Fare & Seats Info */}
                          <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-dashed border-[#B6B6B6]">
                            <span className="font-mono text-xs font-bold text-[#173300]">
                              {ride.departureTime}
                            </span>
                            <div className="text-sm font-mono font-bold text-[#173300]">
                              ₹ {ride.farePerSeat} / Seat {ride.availableSeats} Available
                            </div>

                            {/* Book Now Button (Matching Image 3 Wireframe) */}
                            <button
                              onClick={() => handleBookNow(ride)}
                              className="mt-1 px-6 py-2.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-heading font-extrabold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Refresh Button Banner (Matching Image 3 Wireframe) */}
                    <button
                      onClick={() => setFindStep("search")}
                      className="w-full py-3.5 rounded-2xl border-2 border-[#173300] bg-[#FCFAF5] font-heading font-extrabold text-sm text-[#173300] shadow-[4px_4px_0px_#173300] hover:bg-[#FFEB5B] transition-colors"
                    >
                      Refresh Available Rides
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ────── MODE B: OFFER RIDE FLOW ────── */}
            {carpoolMode === "offer" && (
              <>
                {offerStep === "form" && (
                  <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_#173300] max-w-3xl w-full mx-auto flex flex-col gap-6">
                    <h3 className="font-heading text-2xl font-extrabold text-[#173300]">
                      Publish a Ride Offer
                    </h3>

                    <form onSubmit={handleOfferFormSubmit} className="flex flex-col gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-mono font-bold uppercase text-[#173300]">
                          Select Vehicle
                        </label>
                        <select
                          value={offerVehId}
                          onChange={(e) => setOfferVehId(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-xs font-mono font-bold text-[#173300] outline-none"
                        >
                          {vehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.model} ({v.plateNumber})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <LocationInput
                          id="offer-pickup"
                          label="Pickup Point"
                          value={offerStartLoc}
                          onChange={setOfferStartLoc}
                          placeholder="Enter Pickup Point"
                          required
                          showAutoDetect={true}
                        />

                        <LocationInput
                          id="offer-drop"
                          label="Drop Point"
                          value={offerDestLoc}
                          onChange={setOfferDestLoc}
                          placeholder="Enter Drop Point"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-mono font-bold uppercase text-[#173300]">
                            Departure Schedule
                          </label>
                          <input
                            type="datetime-local"
                            value={offerDateTime}
                            onChange={(e) => setOfferDateTime(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-xs font-mono font-semibold outline-none cursor-pointer"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-mono font-bold uppercase text-[#173300]">
                            Available Seats
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={6}
                            value={offerSeatsAvailable}
                            onChange={(e) => setOfferSeatsAvailable(Number(e.target.value))}
                            className="w-full px-3.5 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-xs font-mono font-bold text-[#173300] outline-none"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-mono font-bold uppercase text-[#173300]">
                            Fare Per Seat (₹)
                          </label>
                          <input
                            type="number"
                            value={offerFarePerSeat}
                            onChange={(e) => setOfferFarePerSeat(Number(e.target.value))}
                            className="w-full px-3.5 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-xs font-mono font-bold text-[#173300] outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="mt-2 w-full py-4 rounded-2xl bg-[#173300] text-[#FFEB5B] font-heading font-extrabold text-base border-2 border-[#173300] shadow-[4px_4px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                      >
                        Calculate Route &amp; Confirm Offer
                      </button>
                    </form>
                  </div>
                )}

                {offerStep === "route-confirm" && (
                  <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 shadow-[8px_8px_0px_#173300] max-w-3xl w-full mx-auto flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-heading text-2xl font-extrabold text-[#173300]">
                        Confirm Offer Route
                      </h3>
                      <button
                        onClick={() => setOfferStep("form")}
                        className="text-xs font-mono font-bold underline"
                      >
                        Edit Details
                      </button>
                    </div>

                    <div className="w-full h-80 bg-[#173300] border-2 border-[#173300] rounded-2xl relative overflow-hidden flex flex-col justify-between p-6">
                      <span className="bg-[#FFEB5B] text-[#173300] font-mono text-xs font-bold px-3 py-1 rounded-full w-fit">
                        Route: 26 km • 33 min
                      </span>

                      <div className="flex justify-between items-center text-[#FFEB5B] font-mono font-bold text-sm z-10 px-8">
                        <div>Pickup: {offerStartLoc}</div>
                        <div>→</div>
                        <div>Drop: {offerDestLoc}</div>
                      </div>

                      <button
                        onClick={handleConfirmOfferPublish}
                        className="w-full py-4 rounded-2xl bg-[#FFEB5B] text-[#173300] font-heading font-extrabold text-lg border-2 border-[#173300] shadow-[4px_4px_0px_#173300]"
                      >
                        Publish Ride Offer
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            2. MY TRIPS SECTION (Matching Image 4 & 5 Wireframes)
           ═════════════════════════════════════════════════════════ */}
        {activeMainTab === "my-trips" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b-2 border-dashed border-[#B6B6B6] pb-4">
              <h1 className="font-heading text-3xl font-extrabold text-[#173300]">
                My Trips
              </h1>
              <span className="text-xs font-mono font-semibold text-[#173300]/60">
                Active Bookings &amp; Finished Trips
              </span>
            </div>

            <div className="flex flex-col gap-6 max-w-4xl w-full mx-auto">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_#173300] flex flex-col gap-6"
                >
                  {/* Trip Card Header (Matching Image 4 & 5 Wireframe) */}
                  <div className="flex justify-between items-start pb-4 border-b-2 border-dashed border-[#B6B6B6]">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#FFEB5B] border-2 border-[#173300] flex items-center justify-center font-heading font-extrabold text-xl shadow-[3px_3px_0px_#173300]">
                        {trip.driverName.charAt(0)}
                      </div>

                      <div>
                        <h3 className="font-heading text-2xl font-extrabold text-[#173300]">
                          {trip.driverName}
                        </h3>
                        <div className="text-xs font-mono font-semibold text-[#173300]/70 mt-0.5">
                          {trip.pickupLabel} to {trip.destinationLabel}
                        </div>
                      </div>
                    </div>

                    <span className="font-mono text-xs font-bold text-[#173300]/80">
                      {trip.departureTime}
                    </span>
                  </div>

                  {/* Trip Details Grid (Matching Image 4) */}
                  {trip.status !== "PAYMENT_PENDING" && trip.status !== "PAYMENT_COMPLETED" && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                        <div className="bg-[#173300]/[0.04] p-3 rounded-xl border border-[#B6B6B6]">
                          <span className="text-[#173300]/60 uppercase block text-[10px]">Vehicle</span>
                          <span className="font-bold text-[#173300]">{trip.vehicleModel}</span>
                          <span className="block text-[10px] text-[#173300]/70">{trip.plateNumber}</span>
                        </div>

                        <div className="bg-[#173300]/[0.04] p-3 rounded-xl border border-[#B6B6B6]">
                          <span className="text-[#173300]/60 uppercase block text-[10px]">Pick UP Point</span>
                          <span className="font-bold text-[#173300]">{trip.pickupLabel}</span>
                        </div>

                        <div className="bg-[#173300]/[0.04] p-3 rounded-xl border border-[#B6B6B6]">
                          <span className="text-[#173300]/60 uppercase block text-[10px]">Drop Point</span>
                          <span className="font-bold text-[#173300]">{trip.destinationLabel}</span>
                        </div>
                      </div>

                      {/* Action Buttons Row (Matching Image 4: Chat with Driver & Call To Driver) */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setChatOpenTrip(trip)}
                            className="px-5 py-2.5 rounded-xl border-2 border-[#173300] bg-[#FCFAF5] font-heading font-extrabold text-xs text-[#173300] shadow-[2px_2px_0px_#173300] hover:bg-[#FFEB5B] transition-colors"
                          >
                            Chat with Driver
                          </button>
                          <button
                            onClick={() => {
                              setCallTrip(trip);
                              setCallActive(true);
                            }}
                            className="px-5 py-2.5 rounded-xl border-2 border-[#173300] bg-[#FCFAF5] font-heading font-extrabold text-xs text-[#173300] shadow-[2px_2px_0px_#173300] hover:bg-[#FFEB5B] transition-colors"
                          >
                            Call To Driver
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-sm font-bold text-[#173300]">
                            ₹ {trip.fareAmount} / Seat {trip.seatsBooked}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Trip Finish View (Matching Image 5 Wireframe: ISKCON to Infocity, Pick UP Point, Drop Point, ₹ 120, Pay Now Button) */}
                  {(trip.status === "PAYMENT_PENDING" || trip.status === "TRIP_COMPLETED") && (
                    <div className="flex flex-col gap-6 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                        <div className="bg-[#173300]/[0.04] p-3 rounded-xl border border-[#B6B6B6]">
                          <span className="text-[#173300]/60 uppercase block text-[10px]">Pick UP Point</span>
                          <span className="font-bold text-sm text-[#173300]">{trip.pickupLabel}</span>
                        </div>
                        <div className="bg-[#173300]/[0.04] p-3 rounded-xl border border-[#B6B6B6]">
                          <span className="text-[#173300]/60 uppercase block text-[10px]">Drop Point</span>
                          <span className="font-bold text-sm text-[#173300]">{trip.destinationLabel}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="font-heading text-3xl font-extrabold text-[#173300]">
                          ₹ {trip.fareAmount}
                        </span>

                        <button
                          onClick={() => setPaymentTrip(trip)}
                          className="px-8 py-3 rounded-xl bg-[#173300] text-[#FFEB5B] font-heading font-extrabold text-base border-2 border-[#173300] shadow-[4px_4px_0px_#173300] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                        >
                          Pay Now
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            3. MY VEHICLE SECTION
           ═════════════════════════════════════════════════════════ */}
        {activeMainTab === "my-vehicle" && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center border-b-2 border-dashed border-[#B6B6B6] pb-4">
              <h1 className="font-heading text-3xl font-extrabold text-[#173300]">
                My Registered Vehicles
              </h1>
              <button
                onClick={() => setIsAddVehOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-heading font-extrabold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300]"
              >
                + Register New Vehicle
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 shadow-[6px_6px_0px_#173300] flex flex-col justify-between gap-4"
                >
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 bg-[#FFEB5B] border border-[#173300] rounded-md">
                      {v.fuelType}
                    </span>
                    <h3 className="font-heading text-2xl font-extrabold text-[#173300] mt-2">
                      {v.model}
                    </h3>
                    <div className="text-xs font-mono font-bold text-[#173300]/80 mt-0.5">
                      Plate: {v.plateNumber}
                    </div>
                  </div>

                  <div className="bg-[#173300]/[0.04] border border-dashed border-[#B6B6B6] rounded-xl p-3 font-mono text-xs flex justify-between">
                    <span>Capacity: {v.capacity} Seats</span>
                    <span className="font-bold text-emerald-800">● {v.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            4. RIDE HISTORY SECTION
           ═════════════════════════════════════════════════════════ */}
        {activeMainTab === "ride-history" && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <h1 className="font-heading text-3xl font-extrabold text-[#173300] border-b-2 border-dashed border-[#B6B6B6] pb-4">
              Ride History
            </h1>

            <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 shadow-[6px_6px_0px_#173300] space-y-4">
              {[
                {
                  id: "hist-101",
                  date: "18/July/26",
                  driver: "Raj Patel",
                  route: "Iskcon to Infocity",
                  vehicle: "Swift Dzire (GJ01AB1234)",
                  fare: 120,
                },
              ].map((h) => (
                <div
                  key={h.id}
                  className="bg-[#173300]/[0.03] border-2 border-dashed border-[#B6B6B6] rounded-2xl p-4 flex justify-between items-center font-mono text-xs"
                >
                  <div>
                    <span className="text-[#173300]/50 block text-[10px]">{h.date}</span>
                    <h4 className="font-heading text-lg font-extrabold text-[#173300]">
                      {h.route}
                    </h4>
                    <div className="text-xs text-[#173300]/70">
                      Driver: <span className="font-bold">{h.driver}</span> ({h.vehicle})
                    </div>
                  </div>

                  <span className="text-xl font-extrabold font-heading text-[#173300]">
                    ₹ {h.fare}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            5. WALLET SECTION
           ═════════════════════════════════════════════════════════ */}
        {activeMainTab === "wallet" && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <h1 className="font-heading text-3xl font-extrabold text-[#173300] border-b-2 border-dashed border-[#B6B6B6] pb-4">
              Wallet
            </h1>

            <div className="bg-[#FFEB5B] border-2 border-[#173300] rounded-3xl p-8 shadow-[8px_8px_0px_#173300] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-[#173300]/70">
                  Current Balance
                </span>
                <div className="text-4xl font-extrabold font-heading text-[#173300] mt-1">
                  ₹ {walletBalance}
                </div>
              </div>

              <button
                onClick={() => setIsRechargeOpen(true)}
                className="px-6 py-3 rounded-2xl bg-[#173300] text-[#FFEB5B] font-heading font-extrabold text-sm border-2 border-[#173300] shadow-[3px_3px_0px_#173300]"
              >
                Recharge Wallet
              </button>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            6. SETTING SECTION
           ═════════════════════════════════════════════════════════ */}
        {activeMainTab === "setting" && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center border-b-2 border-dashed border-[#B6B6B6] pb-4">
              <h1 className="font-heading text-3xl font-extrabold text-[#173300]">
                Saved Places &amp; Settings
              </h1>
              <button
                onClick={() => setIsAddPlaceOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#173300] text-[#FFEB5B] font-bold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300]"
              >
                + Add Place
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedPlaces.map((sp) => (
                <div
                  key={sp.id}
                  className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-5 shadow-[5px_5px_0px_#173300] flex flex-col gap-1"
                >
                  <h3 className="font-heading text-lg font-extrabold text-[#173300]">
                    {sp.label}
                  </h3>
                  <p className="text-xs font-mono text-[#173300]/70">
                    {sp.address}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ════════════════════════════════════════════════════
          IN-TRIP CHAT DRAWER MODAL
         ════════════════════════════════════════════════════ */}
      {chatOpenTrip && (
        <div className="fixed inset-0 z-50 bg-[#173300]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 max-w-lg w-full shadow-[8px_8px_0px_#173300] relative flex flex-col gap-4">
            <div className="flex justify-between items-center border-b-2 border-dashed border-[#B6B6B6] pb-3">
              <div>
                <h3 className="font-heading text-xl font-extrabold text-[#173300]">
                  Chat with Driver
                </h3>
                <span className="text-xs font-mono text-[#173300]/60">
                  Driver: {chatOpenTrip.driverName}
                </span>
              </div>
              <button
                onClick={() => setChatOpenTrip(null)}
                className="w-8 h-8 rounded-full border border-[#173300] font-bold text-xs hover:bg-[#FFEB5B]"
              >
                ✕
              </button>
            </div>

            <div className="h-64 overflow-y-auto space-y-3 bg-[#173300]/[0.03] border border-dashed border-[#B6B6B6] rounded-2xl p-4">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className="bg-[#FCFAF5] border border-[#173300] rounded-xl p-3 text-xs font-mono">
                  <div className="flex justify-between text-[10px] font-bold text-[#173300]/50 mb-1">
                    <span>{msg.sender}</span>
                    <span>{msg.time}</span>
                  </div>
                  <p className="text-[#173300] font-semibold">{msg.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Type message to driver…"
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-xs outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#173300] text-[#FFEB5B] font-bold text-xs rounded-xl border-2 border-[#173300] shadow-[2px_2px_0px_#173300]"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          VOICE CALL MODAL
         ════════════════════════════════════════════════════ */}
      {callTrip && (
        <div className="fixed inset-0 z-50 bg-[#173300]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#173300] text-[#FFEB5B] border-2 border-[#173300] rounded-3xl p-8 max-w-sm w-full shadow-[10px_10px_0px_#173300] flex flex-col items-center text-center gap-5">
            <div>
              <h3 className="font-heading text-2xl font-extrabold">
                {callTrip.driverName}
              </h3>
              <span className="text-xs font-mono text-[#FFEB5B]/70 block mt-1">
                Calling Driver... ({callTrip.driverPhone})
              </span>
            </div>

            <button
              onClick={() => setCallTrip(null)}
              className="px-6 py-2.5 bg-red-500 text-white font-bold text-xs rounded-xl border-2 border-[#173300] shadow-[3px_3px_0px_#173300]"
            >
              End Call
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          PAYMENT MODAL
         ════════════════════════════════════════════════════ */}
      {paymentTrip && (
        <div className="fixed inset-0 z-50 bg-[#173300]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 max-w-md w-full shadow-[8px_8px_0px_#173300] flex flex-col gap-5">
            <h3 className="font-heading text-2xl font-extrabold text-[#173300]">
              Pay Now
            </h3>

            <div className="bg-[#173300]/[0.04] border border-dashed border-[#B6B6B6] rounded-2xl p-4 font-mono text-xs space-y-1">
              <div>Route: <span className="font-bold">{paymentTrip.pickupLabel} to {paymentTrip.destinationLabel}</span></div>
              <div>Total Fare: <span className="font-bold text-base text-[#173300]">₹ {paymentTrip.fareAmount}</span></div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono font-bold uppercase text-[#173300]/70">
                Payment Method
              </label>
              {(["WALLET", "CASH", "CARD", "UPI"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPayMethod(m)}
                  className={`p-3 rounded-xl border-2 font-mono text-xs font-bold flex justify-between items-center ${
                    payMethod === m
                      ? "bg-[#173300] text-[#FFEB5B] border-[#173300]"
                      : "bg-[#FCFAF5] text-[#173300] border-[#B6B6B6]"
                  }`}
                >
                  <span>{m}</span>
                  {m === "WALLET" && <span>(Balance: ₹ {walletBalance})</span>}
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPaymentTrip(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handlePayNow}
                className="flex-1 py-2.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-bold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300]"
              >
                Confirm Payment ₹ {paymentTrip.fareAmount}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          ADD VEHICLE MODAL
         ════════════════════════════════════════════════════ */}
      {isAddVehOpen && (
        <div className="fixed inset-0 z-50 bg-[#173300]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 max-w-md w-full shadow-[8px_8px_0px_#173300] flex flex-col gap-4">
            <h3 className="font-heading text-2xl font-extrabold text-[#173300]">
              Register Vehicle
            </h3>

            <form onSubmit={handleAddVehicleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="Vehicle Model (e.g. Swift Dzire)"
                required
                className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-semibold outline-none"
              />
              <input
                type="text"
                value={newPlate}
                onChange={(e) => setNewPlate(e.target.value)}
                placeholder="Plate Number (e.g. GJ01AB1234)"
                required
                className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-semibold outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={newCap}
                  onChange={(e) => setNewCap(Number(e.target.value))}
                  placeholder="Capacity"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-mono outline-none"
                />
                <select
                  value={newFuel}
                  onChange={(e) => setNewFuel(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-mono outline-none"
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddVehOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-bold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300]"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          ADD SAVED PLACE MODAL
         ════════════════════════════════════════════════════ */}
      {isAddPlaceOpen && (
        <div className="fixed inset-0 z-50 bg-[#173300]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 max-w-md w-full shadow-[8px_8px_0px_#173300] flex flex-col gap-4">
            <h3 className="font-heading text-2xl font-extrabold text-[#173300]">
              Add Saved Place
            </h3>

            <form onSubmit={handleAddPlaceSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                value={newPlaceLabel}
                onChange={(e) => setNewPlaceLabel(e.target.value)}
                placeholder="Label (e.g. Home, Office)"
                required
                className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-semibold outline-none"
              />
              <LocationInput
                id="new-place-address"
                label="Full Address"
                value={newPlaceAddress}
                onChange={setNewPlaceAddress}
                placeholder="Full Address"
                required
                showAutoDetect={true}
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddPlaceOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-bold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300]"
                >
                  Save Place
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          RECHARGE WALLET MODAL
         ════════════════════════════════════════════════════ */}
      {isRechargeOpen && (
        <div className="fixed inset-0 z-50 bg-[#173300]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FCFAF5] border-2 border-[#173300] rounded-3xl p-6 max-w-md w-full shadow-[8px_8px_0px_#173300] flex flex-col gap-5">
            <h3 className="font-heading text-2xl font-extrabold text-[#173300]">
              Recharge Wallet
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setWalletBalance((prev) => prev + Number(rechargeAmt));
                setIsRechargeOpen(false);
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold uppercase text-[#173300]/70">
                  Recharge Amount (₹)
                </label>
                <input
                  type="number"
                  min={50}
                  value={rechargeAmt}
                  onChange={(e) => setRechargeAmt(Number(e.target.value))}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-sm font-mono font-bold text-[#173300] outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRechargeOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#173300] text-[#FFEB5B] font-bold text-xs border-2 border-[#173300] shadow-[3px_3px_0px_#173300]"
                >
                  Recharge ₹ {rechargeAmt}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
