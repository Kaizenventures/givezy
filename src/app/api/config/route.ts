import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/settings";
import { checkCapacity } from "@/lib/capacity";

export const dynamic = "force-dynamic";

/**
 * GET /api/config
 * Public config the donate form needs: prices, copy, and whether we're
 * still accepting pickups right now.
 */
export async function GET() {
  try {
    const [{ buckets, content }, capacity] = await Promise.all([
      getSiteConfig(),
      checkCapacity(),
    ]);

    return NextResponse.json({
      buckets: buckets.map((b) => ({
        id: b.id,
        label: b.label,
        hint: b.hint,
        maxKg: b.maxKg,
        pricePaise: b.pricePaise,
        priceDisplay: `₹${(b.pricePaise / 100).toFixed(0)}`,
      })),
      content: {
        clothesComingSoon: content.clothesComingSoon,
        whatsappNumber: content.whatsappNumber,
        nextStepTitle: content.nextStepTitle,
        nextStepBody: content.nextStepBody,
      },
      accepting: capacity.available,
      remaining: capacity.remaining,
    });
  } catch (error) {
    console.error("Config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
