"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

interface RouteMapProps {
  startAddress: string;
  destAddress: string;
  onRouteCalculated?: (distanceKm: number, durationMins: number) => void;
}

export default function RouteMap({
  startAddress,
  destAddress,
  onRouteCalculated,
}: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    distanceKm: number;
    durationMins: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initMapAndRoute() {
      setLoading(true);
      setErrorMsg(null);

      // Load Leaflet dynamically client-side
      const L = (await import("leaflet")).default;

      if (!mapContainerRef.current) return;

      // Clean up previous map instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      try {
        // 1. Geocode Start Location
        const startQuery = startAddress || "Kalyani, West Bengal";
        const destQuery = destAddress || "Chakdaha, West Bengal";

        const [startRes, destRes] = await Promise.all([
          fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(startQuery)}&format=json&limit=1`
          ),
          fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destQuery)}&format=json&limit=1`
          ),
        ]);

        const startData = await startRes.json();
        const destData = await destRes.json();

        // Default fallbacks if geocode fails
        const lat1 = startData && startData[0] ? parseFloat(startData[0].lat) : 22.9751;
        const lng1 = startData && startData[0] ? parseFloat(startData[0].lon) : 88.4345;

        const lat2 = destData && destData[0] ? parseFloat(destData[0].lat) : 23.0805;
        const lng2 = destData && destData[0] ? parseFloat(destData[0].lon) : 88.5255;

        // Initialize Leaflet Map
        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          scrollWheelZoom: false,
        }).setView([(lat1 + lat2) / 2, (lng1 + lng2) / 2], 11);

        mapInstanceRef.current = map;

        // OpenStreetMap Standard Tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Custom Neubrutalism Marker Icons
        const createMarkerIcon = (letter: string, bgColor: string) =>
          L.divIcon({
            className: "custom-leaflet-marker",
            html: `<div style="
              background-color: ${bgColor};
              color: #173300;
              border: 3px solid #173300;
              box-shadow: 3px 3px 0px #173300;
              border-radius: 50%;
              width: 36px;
              height: 36px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: monospace;
              font-weight: 900;
              font-size: 16px;
            ">${letter}</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });

        const markerA = L.marker([lat1, lng1], {
          icon: createMarkerIcon("A", "#FFEB5B"),
        }).addTo(map);

        const markerB = L.marker([lat2, lng2], {
          icon: createMarkerIcon("B", "#FFEB5B"),
        }).addTo(map);

        markerA.bindPopup(`<b>Pickup Point (A)</b><br/>${startQuery}`);
        markerB.bindPopup(`<b>Drop Point (B)</b><br/>${destQuery}`);

        // 2. Fetch OSRM Real Driving Route Polyline & Distance/Duration
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
        const osrmRes = await fetch(osrmUrl);

        if (osrmRes.ok) {
          const osrmData = await osrmRes.json();
          if (osrmData.routes && osrmData.routes.length > 0) {
            const route = osrmData.routes[0];
            const distKm = Math.round((route.distance / 1000) * 10) / 10;
            const durMins = Math.round(route.duration / 60);

            if (isMounted) {
              setRouteInfo({ distanceKm: distKm, durationMins: durMins });
              if (onRouteCalculated) {
                onRouteCalculated(distKm, durMins);
              }
            }

            // Draw Real Road Polyline
            const coordinates = route.geometry.coordinates.map(
              (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
            );

            // Shadow outline polyline
            L.polyline(coordinates, {
              color: "#173300",
              weight: 8,
              opacity: 0.9,
            }).addTo(map);

            // Inner main road line
            const routeLine = L.polyline(coordinates, {
              color: "#FFEB5B",
              weight: 5,
              opacity: 1,
            }).addTo(map);

            // Fit Map View to show full route with padding
            map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
          } else {
            // Direct straight fallback line if no routing available
            const fallbackLine = L.polyline(
              [
                [lat1, lng1],
                [lat2, lng2],
              ],
              { color: "#173300", weight: 4, dashArray: "8, 8" }
            ).addTo(map);
            map.fitBounds(fallbackLine.getBounds(), { padding: [50, 50] });
          }
        }
      } catch (err: any) {
        if (isMounted) setErrorMsg("Could not calculate live route.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initMapAndRoute();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [startAddress, destAddress]);

  return (
    <div className="relative w-full h-[380px] rounded-2xl border-2 border-[#173300] overflow-hidden bg-[#E8F0E6] shadow-[4px_4px_0px_#173300]">
      {/* Real Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Loading Overlay — spinner only, no text */}
      {loading && (
        <div className="absolute inset-0 bg-[#FCFAF5]/80 z-20 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#173300] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Live Route Distance Badge */}
      {routeInfo && !loading && (
        <div className="absolute top-4 left-4 z-10 bg-[#173300] text-[#FFEB5B] border-2 border-[#173300] rounded-xl px-4 py-2 shadow-[3px_3px_0px_#173300] font-mono text-xs font-extrabold flex items-center gap-2">
          <svg className="w-4 h-4 text-[#FFEB5B]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          <span>
            {routeInfo.durationMins} min • {routeInfo.distanceKm} km Route
          </span>
        </div>
      )}
    </div>
  );
}
