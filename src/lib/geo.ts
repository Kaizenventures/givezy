import { db } from "./db";
import { pincodes } from "./schema";
import { eq } from "drizzle-orm";
import { getServiceArea } from "./settings";

/**
 * Serviceability: is a giver's pincode close enough to our collection point
 * that we're willing to send a bag and book a courier?
 *
 * Pincodes are resolved to coordinates once and cached, so a busy day costs no
 * geocoder calls at all.
 */

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
// OpenStreetMap asks for a real identifier so they can contact heavy users
const USER_AGENT = "Givezy/1.0 (+https://givezy.in)";

export interface Coords {
  lat: number;
  lng: number;
  label: string | null;
}

/** Straight-line distance in km. */
export function haversineKm(a: Coords, b: Coords): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

interface GeocodeResult {
  coords: Coords | null;
  /** True when the lookup itself failed, as opposed to finding nothing. */
  errored: boolean;
}

async function geocode(pincode: string): Promise<GeocodeResult> {
  const url = `${NOMINATIM}?postalcode=${encodeURIComponent(pincode)}&country=India&format=json&limit=1`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { coords: null, errored: true };
    const rows = (await res.json()) as Array<{ lat: string; lon: string; display_name?: string }>;
    if (!Array.isArray(rows) || rows.length === 0) return { coords: null, errored: false };
    const lat = Number(rows[0].lat);
    const lng = Number(rows[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { coords: null, errored: false };
    return { coords: { lat, lng, label: rows[0].display_name ?? null }, errored: false };
  } catch {
    return { coords: null, errored: true };
  }
}

/**
 * Coordinates for a pincode, from cache where possible. A cached row with null
 * lat/lng means we already looked and found nothing.
 */
export async function lookupPincode(pincode: string): Promise<GeocodeResult> {
  const [cached] = await db.select().from(pincodes).where(eq(pincodes.pincode, pincode)).limit(1);
  if (cached) {
    return {
      coords:
        cached.lat !== null && cached.lng !== null
          ? { lat: cached.lat, lng: cached.lng, label: cached.label }
          : null,
      errored: false,
    };
  }

  const result = await geocode(pincode);

  // Cache a genuine miss so a typo'd pincode isn't re-geocoded on every visit,
  // but never cache a failed lookup — that would make an outage permanent.
  if (!result.errored) {
    await db
      .insert(pincodes)
      .values({
        pincode,
        lat: result.coords?.lat ?? null,
        lng: result.coords?.lng ?? null,
        label: result.coords?.label ?? null,
        lookedUpAt: new Date().toISOString(),
      })
      .onConflictDoNothing();
  }

  return result;
}

export type ServiceStatus =
  | "ok"
  | "outside"
  /** Geocoder answered, but has no such pincode — collect details, don't charge. */
  | "unknown"
  /** Lookup failed. We allow it: an outage must not stop every booking. */
  | "unverified"
  | "disabled";

export interface ServiceCheck {
  status: ServiceStatus;
  distanceKm: number | null;
  radiusKm: number | null;
  label: string | null;
}

/**
 * "unknown" means we could not place the pincode, not that we refuse it. The
 * caller should collect the person's details rather than turn them away.
 */
export async function checkServiceable(pincode: string): Promise<ServiceCheck> {
  const area = await getServiceArea();
  if (!area.enabled) {
    return { status: "disabled", distanceKm: null, radiusKm: null, label: null };
  }

  const { coords, errored } = await lookupPincode(pincode);
  if (errored) {
    console.warn(`[geo] lookup failed for ${pincode}; allowing the booking through`);
    return { status: "unverified", distanceKm: null, radiusKm: area.radiusKm, label: null };
  }
  if (!coords) {
    return { status: "unknown", distanceKm: null, radiusKm: area.radiusKm, label: null };
  }

  const distanceKm = haversineKm({ lat: area.centreLat, lng: area.centreLng, label: null }, coords);
  return {
    status: distanceKm <= area.radiusKm ? "ok" : "outside",
    distanceKm: Math.round(distanceKm * 10) / 10,
    radiusKm: area.radiusKm,
    label: coords.label,
  };
}
