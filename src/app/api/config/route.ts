import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/settings";
import { checkCapacity } from "@/lib/capacity";
import { isDemoMode, canAcceptDonations } from "@/lib/demo";

export const dynamic = "force-dynamic";

/**
 * GET /api/config
 * Public config the donate form needs: prices, copy, and whether we're
 * still accepting pickups right now.
 */
export async function GET() {
  try {
    const [{ buckets, countBuckets, genres, content }, capacity] = await Promise.all([
      getSiteConfig(),
      checkCapacity(),
    ]);

    const shape = (b: (typeof buckets)[number]) => ({
      id: b.id,
      label: b.label,
      hint: b.hint,
      maxKg: b.maxKg,
      pricePaise: b.pricePaise,
      priceDisplay: `₹${(b.pricePaise / 100).toFixed(0)}`,
    });

    return NextResponse.json({
      buckets: buckets.map(shape),
      countBuckets: countBuckets.map(shape),
      genres,
      content: {
        clothesComingSoon: content.clothesComingSoon,
        whatsappNumber: content.whatsappNumber,
        nextStepTitle: content.nextStepTitle,
        nextStepBody: content.nextStepBody,
        capMessageTitle: content.capMessageTitle,
        capMessageBody: content.capMessageBody,
      },
      accepting: capacity.available,
      remaining: capacity.remaining,
      demo: isDemoMode(),
      paymentsReady: canAcceptDonations(),
    });
  } catch (error) {
    console.error("Config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
