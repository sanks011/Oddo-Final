import { NextRequest, NextResponse } from "next/server";

// In-memory cache for reverse geocoding (24 hour TTL)
const reverseGeocodeCache = new Map<string, { timestamp: number; formatted_address: string }>();
const REVERSE_GEOCODE_TTL = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ formatted_address: "Current GPS Location" });
  }

  const cacheKey = `${parseFloat(lat).toFixed(4)},${parseFloat(lng).toFixed(4)}`;
  const now = Date.now();

  const cached = reverseGeocodeCache.get(cacheKey);
  if (cached && now - cached.timestamp < REVERSE_GEOCODE_TTL) {
    return NextResponse.json({ formatted_address: cached.formatted_address });
  }

  const apiKey =
    process.env.MAPS_MY_INDIA_API_KEY ||
    process.env.NEXT_PUBLIC_MAPS_MY_INDIA_API_KEY ||
    "jewzlepwtxuotlcdfbmjmtctuzcxakkyruby";

  try {
    const mapmyindiaUrl = `https://atlas.mapmyindia.com/api/places/geocode?address=${lat},${lng}&access_token=${apiKey}`;
    const response = await fetch(mapmyindiaUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "OddoStock-Carpooling/1.0",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.results && data.results[0]) {
        const formatted_address =
          data.results[0].formatted_address ||
          data.results[0].formattedAddress ||
          data.results[0].placeName ||
          `GPS Location (${lat}, ${lng})`;
        reverseGeocodeCache.set(cacheKey, { timestamp: now, formatted_address });
        return NextResponse.json({ formatted_address });
      }
    }
  } catch {
    // Return default coordinate label
  }

  const fallbackAddress = `Current GPS Location (${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)})`;
  reverseGeocodeCache.set(cacheKey, { timestamp: now, formatted_address: fallbackAddress });
  return NextResponse.json({ formatted_address: fallbackAddress });
}
