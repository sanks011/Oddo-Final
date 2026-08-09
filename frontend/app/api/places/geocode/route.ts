import { NextRequest, NextResponse } from "next/server";

const OLA_API_KEY = process.env.OLA_MAPS_API_KEY || "";

// In-memory cache for geocoded addresses (24 hour TTL)
const geocodeCache = new Map<string, { timestamp: number; result: any }>();
const GEOCODE_TTL = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address || address.trim().length < 2) {
    return NextResponse.json({ error: "address param required" }, { status: 400 });
  }

  const query = address.trim().toLowerCase();
  const now = Date.now();

  const cached = geocodeCache.get(query);
  if (cached && now - cached.timestamp < GEOCODE_TTL) {
    return NextResponse.json(cached.result);
  }

  // Try Ola Maps Geocode first (if API key available)
  if (OLA_API_KEY) {
    try {
      const res = await fetch(
        `https://api.olamaps.io/places/v1/geocode?address=${encodeURIComponent(address)}&api_key=${OLA_API_KEY}`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const data = await res.json();
        const result = data?.geocodingResults?.[0];
        if (result?.geometry?.location) {
          const resObj = {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            formatted_address: result.formatted_address || address,
          };
          geocodeCache.set(query, { timestamp: now, result: resObj });
          return NextResponse.json(resObj);
        }
      }
    } catch { /* fall through to Nominatim */ }
  }

  // Fallback: Nominatim (OpenStreetMap) — free, no key needed
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: { "User-Agent": "OddoCarpooling/1.0" },
        next: { revalidate: 3600 },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const resObj = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          formatted_address: data[0].display_name,
        };
        geocodeCache.set(query, { timestamp: now, result: resObj });
        return NextResponse.json(resObj);
      }
    }
  } catch { /* fall through */ }

  // Final fallback: approximate India center
  return NextResponse.json(
    { error: "Could not geocode address", lat: 20.5937, lng: 78.9629 },
    { status: 422 }
  );
}
