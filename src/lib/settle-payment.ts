import { db } from "./db";
import { donations, shipments } from "./schema";
import { eq } from "drizzle-orm";
import { getBuckets, findBucket } from "./settings";
import { sendDonationNotices } from "./notify";
import { isDemoRecord } from "./demo";

export interface SettleResult {
  status: "settled" | "already_paid" | "not_found";
  donationId?: string;
}

/**
 * Marks a shipment paid, moves its donation to `paid` and fires the
 * notification emails. Idempotent: the browser callback and the Razorpay
 * webhook both call this and whichever arrives second is a no-op.
 */
export async function settlePayment(params: {
  shipmentId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string | null;
  paymentMethod?: string | null;
}): Promise<SettleResult> {
  const [shipment] = await db
    .select()
    .from(shipments)
    .where(eq(shipments.id, params.shipmentId))
    .limit(1);

  if (!shipment) return { status: "not_found" };
  if (shipment.paymentStatus === "paid") {
    return { status: "already_paid", donationId: shipment.donationId };
  }

  const now = new Date().toISOString();

  await db
    .update(shipments)
    .set({
      paymentStatus: "paid",
      razorpayPaymentId: params.razorpayPaymentId,
      razorpaySignature: params.razorpaySignature ?? null,
      paymentMethod: params.paymentMethod ?? null,
      updatedAt: now,
    })
    .where(eq(shipments.id, shipment.id));

  await db
    .update(donations)
    .set({ status: "paid", updatedAt: now })
    .where(eq(donations.id, shipment.donationId));

  const [donation] = await db
    .select()
    .from(donations)
    .where(eq(donations.id, shipment.donationId))
    .limit(1);

  if (donation) {
    const bucket = findBucket(await getBuckets(), donation.weightBucket);
    sendDonationNotices({
      donationId: donation.id,
      donorName: donation.donorName,
      donorPhone: donation.donorPhone,
      donorEmail: donation.donorEmail,
      donorAddress: donation.donorAddress,
      donorPincode: donation.donorPincode,
      bucketLabel: bucket?.label ?? donation.weightBucket,
      maxKg: bucket?.maxKg ?? 0,
      amountPaise: shipment.totalAmount,
      isDemo: isDemoRecord(params.razorpayPaymentId),
    });
  }

  return { status: "settled", donationId: shipment.donationId };
}
