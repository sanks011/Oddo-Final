"use client";
/**
 * Socket.IO client singleton for the Oddo Carpooling frontend.
 * Provides typed helpers for the /tracking namespace used for:
 *  - Live driver location updates
 *  - Real-time fare negotiations
 *  - OTP broadcast events
 *  - Ride match notifications
 */

import { io, Socket } from "socket.io-client";
import { getAccessToken } from "./api";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "") ||
  "https://windows-virus-dsufygbauygroyiausgfiysrgf.onrender.com";

let trackingSocket: Socket | null = null;

/** Get or create the /tracking namespace socket */
export function getTrackingSocket(): Socket {
  if (!trackingSocket || !trackingSocket.connected) {
    const token = getAccessToken();
    trackingSocket = io(`${SOCKET_URL}/tracking`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 2000,
    });

    trackingSocket.on("connect", () => {
      console.log("[Socket] /tracking connected:", trackingSocket?.id);
    });
    trackingSocket.on("disconnect", () => {
      console.log("[Socket] /tracking disconnected");
    });
    trackingSocket.on("error", (err: { message: string }) => {
      console.error("[Socket] error:", err.message);
    });
  }
  return trackingSocket;
}

/** Disconnect the tracking socket (call on unmount or logout) */
export function disconnectTrackingSocket() {
  if (trackingSocket) {
    trackingSocket.disconnect();
    trackingSocket = null;
  }
}

/** Join a trip room to receive live location + OTP events */
export function joinTripRoom(tripId: string) {
  getTrackingSocket().emit("join:trip", { tripId });
}

/** Join a ride room to receive negotiation events */
export function joinRideRoom(rideId: string) {
  getTrackingSocket().emit("join:ride", { rideId });
}

/** Emit a fare negotiation offer */
export function emitNegotiationOffer(
  rideId: string,
  negotiationId: string,
  amount: number,
  offeredBy: "PASSENGER" | "DRIVER"
) {
  getTrackingSocket().emit("negotiation:offer", {
    rideId,
    negotiationId,
    amount,
    offeredBy,
  });
}

/** Emit negotiation accepted */
export function emitNegotiationAccept(
  rideId: string,
  negotiationId: string,
  agreedFare: number
) {
  getTrackingSocket().emit("negotiation:accept", {
    rideId,
    negotiationId,
    agreedFare,
  });
}

/** Driver emits their current GPS location */
export function emitDriverLocation(tripId: string, lat: number, lng: number) {
  getTrackingSocket().emit("location:update", { tripId, lat, lng });
}
