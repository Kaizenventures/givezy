import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shipments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getTrackingInfo } from "@/lib/shiprocket";
import { isAdmin } from "@/lib/admin-guard";

/**
 * GET /api/shipping/track/[donationId]
 * Get tracking info for a donation's shipment.
 *
 * Admin only. It was open, which made it the one public door that called an
 * external service and wrote to the database on a plain GET — unauthenticated
 * and unthrottled. Nothing in the app calls it, and there is no giver-facing
 * tracking page yet, so closing it costs nothing. When that page is built it
 * needs its own endpoint with a rate limit, not this one reopened.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ donationId: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { donationId } = await params;

    // Find the shipment for this donation
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.donationId, donationId))
      .limit(1);

    if (!shipment) {
      return NextResponse.json({ error: "No shipment found for this donation" }, { status: 404 });
    }

    // If we have a Shiprocket shipment ID, get live tracking
    if (shipment.shiprocketShipmentId) {
      const tracking = await getTrackingInfo(shipment.shiprocketShipmentId);

      // Update DB with latest tracking info if available
      if (tracking.awb || tracking.trackingUrl) {
        await db
          .update(shipments)
          .set({
            shiprocketAwb: tracking.awb || shipment.shiprocketAwb,
            trackingUrl: tracking.trackingUrl || shipment.trackingUrl,
            fulfillmentStatus: tracking.currentStatus || shipment.fulfillmentStatus,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(shipments.id, shipment.id));
      }

      return NextResponse.json({
        success: true,
        shipmentId: shipment.id,
        paymentStatus: shipment.paymentStatus,
        fulfillmentStatus: tracking.currentStatus || shipment.fulfillmentStatus,
        awb: tracking.awb || shipment.shiprocketAwb,
        trackingUrl: tracking.trackingUrl || shipment.trackingUrl,
        pricing: {
          shippingCost: shipment.shippingCost,
          serviceFee: shipment.serviceFee,
          total: shipment.totalAmount,
        },
      });
    }

    // No Shiprocket ID yet — return what we have
    return NextResponse.json({
      success: true,
      shipmentId: shipment.id,
      paymentStatus: shipment.paymentStatus,
      fulfillmentStatus: shipment.fulfillmentStatus,
      awb: shipment.shiprocketAwb,
      trackingUrl: shipment.trackingUrl,
      pricing: {
        shippingCost: shipment.shippingCost,
        serviceFee: shipment.serviceFee,
        total: shipment.totalAmount,
      },
    });
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
