import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { donations, shipments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-guard";

/**
 * POST /api/admin/donations/[id]/manual-pickup
 *
 * Records a pickup arranged outside Shiprocket — by phone, another courier, or
 * our own vehicle. Until the Shiprocket API is available this is how collections
 * actually get booked, so it has to be a first-class path rather than a
 * workaround.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const text = (v: unknown, max = 200) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

  const courierName = text(body.courierName, 80);
  const awb = text(body.awb, 60);
  const trackingUrl = text(body.trackingUrl, 500);
  const pickupDate = text(body.pickupDate, 40);
  const notes = text(body.notes, 500);

  if (trackingUrl && !/^https?:\/\//i.test(trackingUrl)) {
    return NextResponse.json({ error: "Tracking link must start with http" }, { status: 400 });
  }

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
    return NextResponse.json({ error: "No payment record for this pickup" }, { status: 404 });
  }
  if (shipment.paymentStatus !== "paid") {
    return NextResponse.json({ error: "This pickup has not been paid for" }, { status: 400 });
  }

  const now = new Date().toISOString();

  await db
    .update(shipments)
    .set({
      bookedManually: true,
      courierName,
      shiprocketAwb: awb,
      trackingUrl,
      fulfillmentStatus: "processing",
      updatedAt: now,
    })
    .where(eq(shipments.id, shipment.id));

  await db
    .update(donations)
    .set({
      status: "pickup_scheduled",
      pickupDate,
      // Keep any note already on the booking rather than silently replacing it
      pickupNotes: notes ?? donation.pickupNotes,
      updatedAt: now,
    })
    .where(eq(donations.id, donation.id));

  return NextResponse.json({ success: true });
}
