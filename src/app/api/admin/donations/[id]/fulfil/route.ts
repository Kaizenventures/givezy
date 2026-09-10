import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { donations, shipments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-guard";
import { createShipmentOrder, getShippingEstimate } from "@/lib/shiprocket";
import { getBuckets, findBucket } from "@/lib/settings";

/**
 * POST /api/admin/donations/[id]/fulfil
 * Creates the Shiprocket pickup once the donor has confirmed (over WhatsApp)
 * that the de-clutter bag is packed and ready.
 */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const [donation] = await db.select().from(donations).where(eq(donations.id, id)).limit(1);
  if (!donation) {
    return NextResponse.json({ error: "Donation not found" }, { status: 404 });
  }

  const [shipment] = await db
    .select()
    .from(shipments)
    .where(eq(shipments.donationId, id))
    .limit(1);
  if (!shipment) {
    return NextResponse.json({ error: "No shipment for this donation" }, { status: 404 });
  }
  if (shipment.paymentStatus !== "paid") {
    return NextResponse.json({ error: "Donation has not been paid for" }, { status: 400 });
  }
  if (shipment.shiprocketOrderId) {
    return NextResponse.json(
      { error: "A pickup already exists for this donation", shiprocketOrderId: shipment.shiprocketOrderId },
      { status: 409 },
    );
  }

  const buckets = await getBuckets();
  const bucket = findBucket(buckets, donation.weightBucket);
  const weightGrams = bucket?.grams ?? 4000;

  // Record what the courier actually charges so under-priced buckets are visible
  const estimate = await getShippingEstimate(donation.donorPincode, weightGrams);

  const result = await createShipmentOrder({
    shipmentId: shipment.id,
    donationId: donation.id,
    donorName: donation.donorName,
    donorPhone: donation.donorPhone,
    donorEmail: donation.donorEmail || "donor@givezy.in",
    donorAddress: donation.donorAddress,
    donorPincode: donation.donorPincode,
    donorCity: donation.donorArea || "",
    itemTitle: donation.title || `${bucket?.label ?? "Donation"} of books`,
    itemCategory: donation.category,
    quantity: 1,
    weightGrams,
    totalPaidRupees: shipment.totalAmount / 100,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const now = new Date().toISOString();
  await db
    .update(shipments)
    .set({
      shiprocketOrderId: result.shiprocketOrderId,
      shiprocketShipmentId: result.shiprocketShipmentId,
      estimatedCourierCost: estimate.error ? null : estimate.estimatedCost * 100,
      fulfillmentStatus: "processing",
      updatedAt: now,
    })
    .where(eq(shipments.id, shipment.id));

  await db
    .update(donations)
    .set({ status: "pickup_scheduled", updatedAt: now })
    .where(eq(donations.id, donation.id));

  return NextResponse.json({
    success: true,
    shiprocketOrderId: result.shiprocketOrderId,
    shiprocketShipmentId: result.shiprocketShipmentId,
    courierEstimateRupees: estimate.error ? null : estimate.estimatedCost,
  });
}
