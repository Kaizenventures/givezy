import { NextRequest, NextResponse } from "next/server";
import { getShippingEstimate } from "@/lib/shiprocket";
import { calculateServiceCharge } from "@/lib/razorpay";

/**
 * POST /api/shipping/estimate
 * Get shipping cost estimate for a donation (donor pincode → warehouse)
 * Returns cost breakdown: shipping + 5% service charge = total
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pincode, weightGrams } = body;

    if (!pincode || pincode.length !== 6) {
      return NextResponse.json({ error: "Valid 6-digit pincode required" }, { status: 400 });
    }

    const estimate = await getShippingEstimate(pincode, weightGrams || 2000);

    if (estimate.error) {
      return NextResponse.json({ error: estimate.error }, { status: 400 });
    }

    // Convert to paise for consistency
    const shippingCostPaise = estimate.estimatedCost * 100;
    const serviceFeePaise = calculateServiceCharge(shippingCostPaise);
    const totalPaise = shippingCostPaise + serviceFeePaise;

    return NextResponse.json({
      success: true,
      shippingCost: shippingCostPaise, // in paise
      serviceFee: serviceFeePaise, // in paise (5% of shipping)
      total: totalPaise, // in paise
      courierName: estimate.courierName,
      estimatedDays: estimate.estimatedDays,
      // Formatted for display
      display: {
        shippingCost: `₹${estimate.estimatedCost}`,
        serviceFee: `₹${(serviceFeePaise / 100).toFixed(2)}`,
        total: `₹${(totalPaise / 100).toFixed(2)}`,
      },
    });
  } catch (error) {
    console.error("Shipping estimate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
