import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-guard";
import { getBags, shippingGrams } from "@/lib/settings";
import { getShippingEstimate } from "@/lib/shiprocket";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/admin/price-check
 * Asks Shiprocket what each saved bag would cost to collect from a sample
 * pincode to the collection address, so prices can be set against the real
 * courier charge rather than guessed.
 */
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceRateLimit(req, "price-check", 10, 10 * 60 * 1000);
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const pincode = String(body.pincode || "").trim();
  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ error: "Enter a 6-digit pincode" }, { status: 400 });
  }

  const bags = await getBags();

  // One at a time: the courier API rate-limits bursts and the list is short
  const quotes = [];
  for (const bag of bags) {
    const grams = shippingGrams(bag);
    const estimate = await getShippingEstimate(pincode, grams);
    quotes.push({
      id: bag.id,
      label: bag.label,
      pricePaise: bag.pricePaise,
      shippingKg: grams / 1000,
      courierPaise: estimate.error ? null : estimate.estimatedCost * 100,
      courierName: estimate.courierName,
      error: estimate.error,
    });
  }

  if (quotes.every((q) => q.error === "Shiprocket not configured")) {
    return NextResponse.json(
      { error: "Shiprocket isn't connected yet. Add its login to the server, then try again." },
      { status: 503 },
    );
  }

  return NextResponse.json({ pincode, quotes });
}
