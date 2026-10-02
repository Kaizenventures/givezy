import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { donations, shipments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-guard";
import { createRazorpayRefund } from "@/lib/razorpay";
import { recordRefund, refundedInFull } from "@/lib/refund";
import { isDemoRecord, paymentsConfigured } from "@/lib/demo";
import { bookingRef } from "@/lib/worklist";

/**
 * POST /api/admin/donations/[id]/refund
 *
 * Refunds a booking through Razorpay and records it here. The alternative — a
 * refund in the Razorpay dashboard — reaches the same place through the webhook,
 * so doing it from this screen is a convenience, not the only path.
 *
 * Razorpay is the source of truth, so the money moves first and the local record
 * follows. A refund that succeeds at Razorpay and fails to record here is
 * recoverable: the webhook will arrive and settle it.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const reason =
    typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim().slice(0, 300)
      : null;

  const [donation] = await db.select().from(donations).where(eq(donations.id, id)).limit(1);
  if (!donation) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const [shipment] = await db
    .select()
    .from(shipments)
    .where(eq(shipments.donationId, id))
    .limit(1);
  if (!shipment) {
    return NextResponse.json({ error: "No payment record for this booking" }, { status: 404 });
  }

  if (refundedInFull(shipment)) {
    return NextResponse.json({ error: "This booking is already fully refunded" }, { status: 400 });
  }
  if (shipment.paymentStatus !== "paid") {
    return NextResponse.json(
      { error: "Only a paid booking can be refunded" },
      { status: 400 },
    );
  }

  const refundable = shipment.totalAmount - shipment.refundAmount;

  // A partial amount may be sent in rupees; everything internal is paise.
  let amountPaise = refundable;
  if (body.amountRupees !== undefined && body.amountRupees !== null && body.amountRupees !== "") {
    const rupees = Number(body.amountRupees);
    if (!Number.isFinite(rupees) || rupees <= 0) {
      return NextResponse.json({ error: "Enter a refund amount above zero" }, { status: 400 });
    }
    amountPaise = Math.round(rupees * 100);
    if (amountPaise > refundable) {
      return NextResponse.json(
        { error: `Only ₹${(refundable / 100).toFixed(0)} is left to refund` },
        { status: 400 },
      );
    }
  }

  // Demo bookings never took real money, so there is nothing at Razorpay to
  // reverse — but the record still needs clearing out of the worklist.
  if (isDemoRecord(shipment.razorpayPaymentId)) {
    const result = await recordRefund({
      shipmentId: shipment.id,
      amountPaise,
      reason: reason ?? "Demo booking — no real payment to reverse",
    });
    return NextResponse.json({ success: true, demo: true, full: result.full ?? false });
  }

  if (!paymentsConfigured()) {
    return NextResponse.json(
      { error: "Razorpay is not configured on this server, so it cannot issue refunds" },
      { status: 503 },
    );
  }
  if (!shipment.razorpayPaymentId) {
    return NextResponse.json(
      { error: "No Razorpay payment id on this booking — refund it from the Razorpay dashboard" },
      { status: 400 },
    );
  }

  const refund = await createRazorpayRefund(shipment.razorpayPaymentId, amountPaise, {
    givezy_booking: bookingRef(donation.id),
    ...(reason ? { reason } : {}),
  });

  if (refund.error) {
    return NextResponse.json({ error: refund.error }, { status: 502 });
  }

  const result = await recordRefund({
    shipmentId: shipment.id,
    amountPaise: refund.amountPaise || amountPaise,
    razorpayRefundId: refund.refundId,
    reason,
  });

  return NextResponse.json({
    success: true,
    refundId: refund.refundId,
    full: result.full ?? false,
  });
}
