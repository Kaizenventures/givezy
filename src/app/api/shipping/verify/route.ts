import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shipments, donations } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { verifyPaymentSignature } from "@/lib/razorpay";

/**
 * POST /api/shipping/verify
 * Confirms the Razorpay payment and moves the donation to `paid`.
 *
 * The Shiprocket pickup is deliberately NOT created here: the donor first
 * receives a de-clutter bag, packs it, and pings us on WhatsApp. Admin then
 * creates the pickup from /admin/donations/[id].
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shipmentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!shipmentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId))
      .limit(1);

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    // The order id must be the one we created for this shipment, otherwise a
    // valid signature from an unrelated order could be replayed here.
    if (shipment.razorpayOrderId !== razorpayOrderId) {
      return NextResponse.json({ error: "Payment does not match this order" }, { status: 400 });
    }

    if (shipment.paymentStatus === "paid") {
      return NextResponse.json({ success: true, alreadyPaid: true, shipmentId });
    }

    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      await db
        .update(shipments)
        .set({ paymentStatus: "failed", updatedAt: new Date().toISOString() })
        .where(eq(shipments.id, shipmentId));
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    await db
      .update(shipments)
      .set({
        paymentStatus: "paid",
        razorpayPaymentId,
        razorpaySignature,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(shipments.id, shipmentId));

    await db
      .update(donations)
      .set({ status: "paid", updatedAt: new Date().toISOString() })
      .where(eq(donations.id, shipment.donationId));

    return NextResponse.json({
      success: true,
      shipmentId,
      donationId: shipment.donationId,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
