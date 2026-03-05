import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shipments, donations } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { createShipmentOrder } from "@/lib/shiprocket";

/**
 * POST /api/shipping/verify
 * Verifies Razorpay payment → marks shipment as paid → creates Shiprocket order
 *
 * Body: { shipmentId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shipmentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!shipmentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the payment signature
    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      // Mark payment as failed
      await db
        .update(shipments)
        .set({ paymentStatus: "failed", updatedAt: new Date().toISOString() })
        .where(eq(shipments.id, shipmentId));

      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    // Mark payment as successful
    await db
      .update(shipments)
      .set({
        paymentStatus: "paid",
        razorpayPaymentId,
        razorpaySignature,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(shipments.id, shipmentId));

    // Fetch shipment + donation for Shiprocket order
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId))
      .limit(1);

    const [donation] = await db
      .select()
      .from(donations)
      .where(eq(donations.id, shipment.donationId))
      .limit(1);

    if (!donation) {
      return NextResponse.json({
        success: true,
        message: "Payment verified, but donation not found for Shiprocket",
        shipmentId,
      });
    }

    // Create Shiprocket order (donor → your warehouse)
    const shiprocketResult = await createShipmentOrder({
      shipmentId: shipment.id,
      donationId: donation.id,
      donorName: donation.donorName,
      donorPhone: donation.donorPhone,
      donorEmail: donation.donorEmail || "donor@givezy.in",
      donorAddress: donation.donorAddress,
      donorPincode: donation.donorPincode,
      donorCity: donation.donorArea || "Hyderabad",
      itemTitle: donation.title,
      itemCategory: donation.category,
      quantity: donation.quantity,
      weightGrams: 2000, // default 2kg
      totalPaidRupees: shipment.totalAmount / 100,
    });

    if (shiprocketResult.error) {
      console.error("Shiprocket order failed (payment was successful):", shiprocketResult.error);
      // Payment succeeded but Shiprocket failed — admin can retry manually
      return NextResponse.json({
        success: true,
        message: "Payment verified. Shipping order will be created shortly.",
        shipmentId,
        shiprocketError: shiprocketResult.error,
      });
    }

    // Update shipment with Shiprocket IDs
    await db
      .update(shipments)
      .set({
        shiprocketOrderId: shiprocketResult.shiprocketOrderId,
        shiprocketShipmentId: shiprocketResult.shiprocketShipmentId,
        fulfillmentStatus: "processing",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(shipments.id, shipmentId));

    // Update donation status to "scheduled"
    await db
      .update(donations)
      .set({ status: "scheduled", updatedAt: new Date().toISOString() })
      .where(eq(donations.id, donation.id));

    return NextResponse.json({
      success: true,
      message: "Payment verified, shipment created!",
      shipmentId,
      shiprocketOrderId: shiprocketResult.shiprocketOrderId,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
