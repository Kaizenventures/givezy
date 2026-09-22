import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/settings";
import { checkCapacity } from "@/lib/capacity";
import { isDemoMode, canAcceptDonations } from "@/lib/demo";

export const dynamic = "force-dynamic";

/**
 * GET /api/config
 * Public config the donate form needs: bag sizes and prices, copy, and whether
 * we're still accepting pickups right now.
 */
export async function GET() {
  try {
    const [{ bags, genres, content }, capacity] = await Promise.all([
      getSiteConfig(),
      checkCapacity(),
    ]);

    return NextResponse.json({
      // Courier-only fields (packed size, sack weight) stay server-side
      bags: bags.map((b) => ({
        id: b.id,
        label: b.label,
        hint: b.hint,
        widthCm: b.widthCm,
        lengthCm: b.lengthCm,
        approxBooks: b.approxBooks,
        maxKg: b.maxKg,
        pricePaise: b.pricePaise,
        priceDisplay: `₹${(b.pricePaise / 100).toFixed(0)}`,
      })),
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
      // The Razorpay key id is public by design — it is handed to the checkout
      // widget in the browser. Serving it here rather than inlining it at build
      // time means the image can be built without any credentials at all.
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || null,
    });
  } catch (error) {
    console.error("Config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
