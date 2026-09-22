import { NextRequest, NextResponse } from "next/server";
import { checkServiceable } from "@/lib/geo";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/serviceability?pincode=500032
 * Tells the give form whether we collect from an address before the giver fills
 * in the rest and reaches for their card.
 */
export async function GET(req: NextRequest) {
  // Each miss can cost a geocoder call, so cap how fast one client can probe
  const limited = enforceRateLimit(req, "serviceability", 40, 10 * 60 * 1000);
  if (limited) return limited;

  const pincode = (req.nextUrl.searchParams.get("pincode") || "").trim();
  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ error: "Enter a 6-digit pincode" }, { status: 400 });
  }

  try {
    const result = await checkServiceable(pincode);
    return NextResponse.json({
      status: result.status,
      distanceKm: result.distanceKm,
      radiusKm: result.radiusKm,
    });
  } catch (error) {
    console.error("Serviceability check failed:", error);
    // Never block the form on our own failure
    return NextResponse.json({ status: "unverified", distanceKm: null, radiusKm: null });
  }
}
