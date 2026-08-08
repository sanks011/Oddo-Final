import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ formatted_address: "Current GPS Location" });
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
        return NextResponse.json({
          formatted_address:
            data.results[0].formatted_address ||
            data.results[0].formattedAddress ||
            data.results[0].placeName ||
            `GPS Location (${lat}, ${lng})`,
        });
      }
    }
  } catch {
    // Return default coordinate label
  }

  return NextResponse.json({
    formatted_address: `Current GPS Location (${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)})`,
  });
}
