"use client";
/**
 * Socket.IO client singleton for the Oddo Carpooling frontend.
 * Provides typed helpers for /tracking and /chat namespaces.
 */

import { io, Socket } from "socket.io-client";
import { getAccessToken } from "./api";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "") ||
  "https://windows-virus-dsufygbauygroyiausgfiysrgf.onrender.com";

let trackingSocket: Socket | null = null;
let chatSocket: Socket | null = null;

/** Get or create the /tracking namespace socket */
export function getTrackingSocket(): Socket {
  const token = getAccessToken();
  if (!trackingSocket) {
    trackingSocket = io(`${SOCKET_URL}/tracking`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    trackingSocket.on("connect", () => {
      console.log("[Socket] /tracking connected:", trackingSocket?.id);
    });
    trackingSocket.on("disconnect", () => {
      console.log("[Socket] /tracking disconnected");
    });
    trackingSocket.on("error", (err: { message: string }) => {
      console.error("[Socket] /tracking error:", err.message);
    });
  } else if (!trackingSocket.connected) {
    trackingSocket.auth = { token };
    trackingSocket.connect();
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
  const sock = getTrackingSocket();
  const emitJoin = () => sock.emit("join:trip", { tripId });
  if (sock.connected) emitJoin();
  else sock.once("connect", emitJoin);
}

/** Join a ride room to receive negotiation events */
export function joinRideRoom(rideId: string) {
  const sock = getTrackingSocket();
  const emitJoin = () => sock.emit("join:ride", { rideId });
  if (sock.connected) emitJoin();
  else sock.once("connect", emitJoin);
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

/* ════════════════════════════════════════════════════
   /chat NAMESPACE
   ════════════════════════════════════════════════════ */

/** Get or create the /chat namespace socket */
export function getChatSocket(): Socket {
  const token = getAccessToken();
  if (!chatSocket) {
    chatSocket = io(`${SOCKET_URL}/chat`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    chatSocket.on("connect", () => {
      console.log("[Socket] /chat connected:", chatSocket?.id);
    });
    chatSocket.on("disconnect", () => {
      console.log("[Socket] /chat disconnected");
    });
    chatSocket.on("error", (err: { message: string }) => {
      console.error("[Socket] /chat error:", err.message);
    });
  } else if (!chatSocket.connected) {
    chatSocket.auth = { token };
    chatSocket.connect();
  }
  return chatSocket;
}

/** Disconnect the chat socket */
export function disconnectChatSocket() {
  if (chatSocket) {
    chatSocket.disconnect();
    chatSocket = null;
  }
}

/** Join a trip chat room to receive real-time messages */
export function joinChatTripRoom(tripId: string) {
  const sock = getChatSocket();
  const emitJoin = () => sock.emit("join:trip", { tripId });
  if (sock.connected) emitJoin();
  else sock.once("connect", emitJoin);
}

/** Emit a new chat message over WebSockets */
export function sendChatMessage(tripId: string, content: string) {
  getChatSocket().emit("message:send", { tripId, content });
}
