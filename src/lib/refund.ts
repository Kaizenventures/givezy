import { db } from "./db";
import { donations, shipments } from "./schema";
import { eq } from "drizzle-orm";
import type { Shipment } from "./schema";

/**
 * Recording a refund against a booking.
 *
 * Refunds can start in two places and both have to end up here: Siddhanth
 * pressing Refund in the admin panel, and Siddhanth refunding from the Razorpay
 * dashboard — which he will, because that is where refunds naturally live and
 * it keeps working when this app is down. The dashboard route arrives as a
 * webhook, so the two paths share this function the way payment settlement
 * shares settlePayment(), and for the same reason: whichever lands second must
 * be a no-op rather than a double-count.
 *
 * A full refund cancels the booking, which also releases the daily capacity
 * slot it was holding. A partial refund does not — the pickup is still
 * happening, somebody just gave money back — so the status stays `paid` and
 * only the amount is recorded.
 */

export interface RefundResult {
  status: "recorded" | "already_recorded" | "not_found" | "not_paid";
  /** True when this refund brought the total to the full amount. */
  full?: boolean;
  donationId?: string;
}

export function refundedInFull(shipment: Shipment): boolean {
  return shipment.refundAmount >= shipment.totalAmount && shipment.refundAmount > 0;
}

export async function recordRefund(params: {
  shipmentId: string;
  /** Paise. Razorpay reports the amount of this individual refund. */
  amountPaise: number;
  razorpayRefundId?: string | null;
  reason?: string | null;
}): Promise<RefundResult> {
  const [shipment] = await db
    .select()
    .from(shipments)
    .where(eq(shipments.id, params.shipmentId))
    .limit(1);

  if (!shipment) return { status: "not_found" };

  // Only a captured payment can be refunded. Anything else means the two sides
  // disagree about what happened, and guessing would be worse than stopping.
  if (shipment.paymentStatus !== "paid" && shipment.paymentStatus !== "refunded") {
    return { status: "not_paid", donationId: shipment.donationId };
  }

  // Razorpay retries webhooks, and the admin button and the dashboard can both
  // report the same refund. The refund id is the only thing that identifies one.
  if (params.razorpayRefundId && shipment.razorpayRefundId === params.razorpayRefundId) {
    return {
      status: "already_recorded",
      full: refundedInFull(shipment),
      donationId: shipment.donationId,
    };
  }

  // Without a refund id there is nothing to deduplicate on, so an
  // already-fully-refunded shipment is left alone rather than counted twice.
  if (!params.razorpayRefundId && refundedInFull(shipment)) {
    return { status: "already_recorded", full: true, donationId: shipment.donationId };
  }

  const total = Math.min(shipment.totalAmount, shipment.refundAmount + params.amountPaise);
  const full = total >= shipment.totalAmount;
  const now = new Date().toISOString();

  await db
    .update(shipments)
    .set({
      refundAmount: total,
      razorpayRefundId: params.razorpayRefundId ?? shipment.razorpayRefundId,
      refundReason: params.reason ?? shipment.refundReason,
      refundedAt: now,
      paymentStatus: full ? "refunded" : shipment.paymentStatus,
      // A refunded booking is not being fulfilled, so it should not sit in the
      // courier queue looking like outstanding work.
      fulfillmentStatus: full ? "cancelled" : shipment.fulfillmentStatus,
      updatedAt: now,
    })
    .where(eq(shipments.id, shipment.id));

  if (full) {
    await db
      .update(donations)
      .set({ status: "refunded", updatedAt: now })
      .where(eq(donations.id, shipment.donationId));
  }

  return { status: "recorded", full, donationId: shipment.donationId };
}
