import { NextRequest, NextResponse } from "next/server";

// In-memory cache for autocomplete queries (15-minute TTL)
const autocompleteCache = new Map<string, { timestamp: number; predictions: any[] }>();
const AUTOCOMPLETE_TTL = 15 * 60 * 1000;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get("input");

  if (!input || input.trim().length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  const query = input.trim().toLowerCase();
  const now = Date.now();

  const cached = autocompleteCache.get(query);
  if (cached && now - cached.timestamp < AUTOCOMPLETE_TTL) {
    return NextResponse.json({ predictions: cached.predictions });
  }

  const apiKey =
    process.env.MAPS_MY_INDIA_API_KEY ||
    process.env.NEXT_PUBLIC_MAPS_MY_INDIA_API_KEY ||
    "jewzlepwtxuotlcdfbmjmtctuzcxakkyruby";

  // ── Strategy 1: Mappls / MapmyIndia REST API ───────────────────────
  try {
    const mapmyindiaUrl = `https://atlas.mapmyindia.com/api/places/search/json?query=${encodeURIComponent(query)}&access_token=${apiKey}`;
    const response = await fetch(mapmyindiaUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "OddoStock-Carpooling/1.0",
      },
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      const rawList =
        data?.suggestedLocations ||
        data?.results ||
        data?.predictions ||
        data?.places ||
        [];

      if (Array.isArray(rawList) && rawList.length > 0) {
        const formatted = rawList.map((item: any, idx: number) => {
          const main =
            item.placeName ||
            item.name ||
            item.structured_formatting?.main_text ||
            query;
          const secondary =
            item.placeAddress ||
            item.formatted_address ||
            item.structured_formatting?.secondary_text ||
            "India";

          return {
            place_id: item.eLoc || item.place_id || `mmi-${idx}`,
            description: `${main}, ${secondary}`,
            structured_formatting: {
              main_text: main,
              secondary_text: secondary,
            },
          };
        });

        autocompleteCache.set(query, { timestamp: now, predictions: formatted });
        return NextResponse.json({ predictions: formatted });
      }
    }
  } catch {
    // Mappls API unreachable
  }

  // ── Strategy 2: High-Performance Global Place Search (Photon/OSM) ─────
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`;
    const photonRes = await fetch(photonUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (photonRes.ok) {
      const photonData = await photonRes.json();
      if (photonData?.features && Array.isArray(photonData.features) && photonData.features.length > 0) {
        const predictions = photonData.features.map((feat: any, idx: number) => {
          const props = feat.properties || {};
          const main = props.name || props.street || query;
          const cityState = [props.district, props.city, props.state, props.country].filter(Boolean).join(", ");
          const desc = `${main}${cityState ? `, ${cityState}` : ""}`;

          return {
            place_id: `photon-${props.osm_id || "id"}-${idx}`,
            description: desc,
            structured_formatting: {
              main_text: main,
              secondary_text: cityState || "India",
            },
          };
        });

        autocompleteCache.set(query, { timestamp: now, predictions });
        return NextResponse.json({ predictions });
      }
    }
  } catch {
    // Photon fallback
  }

  // ── Strategy 3: OpenStreetMap Nominatim Live Search ──────────────
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&countrycodes=in&limit=6`;
    const nomRes = await fetch(nomUrl, {
      headers: {
        "User-Agent": "OddoStock-Carpooling/1.0",
        Accept: "application/json",
      },
    });

    if (nomRes.ok) {
      const nomData = await nomRes.json();
      if (Array.isArray(nomData) && nomData.length > 0) {
        const predictions = nomData.map((item: any, idx: number) => {
          const main = item.name || item.display_name.split(",")[0].trim();
          const secondary = item.display_name.split(",").slice(1).join(",").trim();

          return {
            place_id: `osm-${item.place_id || "id"}-${idx}`,
            description: item.display_name,
            structured_formatting: {
              main_text: main,
              secondary_text: secondary || "India",
            },
          };
        });

        autocompleteCache.set(query, { timestamp: now, predictions });
        return NextResponse.json({ predictions });
      }
    }
  } catch {
    // Backup
  }

  return NextResponse.json({ predictions: [] });
}
