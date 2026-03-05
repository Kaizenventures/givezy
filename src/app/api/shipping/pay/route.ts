import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { donations, shipments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { createRazorpayOrder, calculateServiceCharge } from "@/lib/razorpay";
import { getShippingEstimate } from "@/lib/shiprocket";

/**
 * POST /api/shipping/pay
 * Creates a shipment record + Razorpay order so donor can pay for shipping
 *
 * Body: { donationId: string, weightGrams?: number }
 * Returns: { shipmentId, razorpayOrderId, amount, breakdown }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { donationId, weightGrams } = body;

    if (!donationId) {
      return NextResponse.json({ error: "donationId is required" }, { status: 400 });
    }

    // Fetch the donation
    const [donation] = await db
      .select()
      .from(donations)
      .where(eq(donations.id, donationId))
      .limit(1);

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    // Get shipping estimate from Shiprocket
    const estimate = await getShippingEstimate(donation.donorPincode, weightGrams || 2000);
    if (estimate.error || estimate.estimatedCost === 0) {
      return NextResponse.json(
        { error: estimate.error || "Could not estimate shipping" },
        { status: 400 }
      );
    }

    // Calculate pricing in paise
    const shippingCostPaise = estimate.estimatedCost * 100;
    const serviceFeePaise = calculateServiceCharge(shippingCostPaise);
    const totalPaise = shippingCostPaise + serviceFeePaise;

    // Create shipment record in DB
    const [shipment] = await db
      .insert(shipments)
      .values({
        donationId,
        shippingCost: shippingCostPaise,
        serviceFee: serviceFeePaise,
        totalAmount: totalPaise,
        paymentStatus: "pending",
        fulfillmentStatus: "pending",
      })
      .returning();

    // Create Razorpay order
    const razorpayResult = await createRazorpayOrder(totalPaise, shipment.id);
    if (razorpayResult.error) {
      return NextResponse.json({ error: razorpayResult.error }, { status: 500 });
    }

    // Store Razorpay order ID in shipment
    await db
      .update(shipments)
      .set({ razorpayOrderId: razorpayResult.razorpayOrderId })
      .where(eq(shipments.id, shipment.id));

    return NextResponse.json({
      success: true,
      shipmentId: shipment.id,
      razorpayOrderId: razorpayResult.razorpayOrderId,
      amount: totalPaise, // in paise
      currency: "INR",
      breakdown: {
        shippingCost: shippingCostPaise,
        serviceFee: serviceFeePaise,
        total: totalPaise,
      },
      donor: {
        name: donation.donorName,
        email: donation.donorEmail || "",
        phone: donation.donorPhone,
      },
    });
  } catch (error) {
    console.error("Create shipping payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
