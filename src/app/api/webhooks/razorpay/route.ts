import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { shipments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { settlePayment } from "@/lib/settle-payment";

/**
 * POST /api/webhooks/razorpay
 *
 * Server-side safety net for payments. The browser callback in the donate form
 * can be lost (tab closed, connection dropped) leaving a captured payment with
 * an unpaid donation; Razorpay retries this endpoint until it succeeds, so the
 * donation is settled regardless.
 *
 * Configure in the Razorpay dashboard against `payment.captured` and
 * `payment.failed`, with the same secret as RAZORPAY_WEBHOOK_SECRET.
 */

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";

interface RazorpayWebhookPayload {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
      };
    };
  };
}

function signatureMatches(rawBody: string, received: string): boolean {
  const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  // Lengths must match before timingSafeEqual, and comparing this way avoids
  // leaking how much of the signature was correct.
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!WEBHOOK_SECRET) {
    console.error("[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  if (!signature || !signatureMatches(rawBody, signature)) {
    console.warn("[razorpay-webhook] rejected: bad signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let body: RazorpayWebhookPayload;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body.event;
  const payment = body.payload?.payment?.entity;

  if (!payment?.order_id || !payment.id) {
    // Nothing actionable, but acknowledge so Razorpay stops retrying
    return NextResponse.json({ received: true, ignored: true });
  }

  const [shipment] = await db
    .select()
    .from(shipments)
    .where(eq(shipments.razorpayOrderId, payment.order_id))
    .limit(1);

  if (!shipment) {
    console.warn(`[razorpay-webhook] no shipment for order ${payment.order_id}`);
    return NextResponse.json({ received: true, matched: false });
  }

  if (event === "payment.failed") {
    if (shipment.paymentStatus !== "paid") {
      await db
        .update(shipments)
        .set({ paymentStatus: "failed", updatedAt: new Date().toISOString() })
        .where(eq(shipments.id, shipment.id));
    }
    return NextResponse.json({ received: true, event });
  }

  if (event === "payment.captured" || payment.status === "captured") {
    const result = await settlePayment({
      shipmentId: shipment.id,
      razorpayPaymentId: payment.id,
    });
    console.log(`[razorpay-webhook] ${payment.order_id} -> ${result.status}`);
    return NextResponse.json({ received: true, result: result.status });
  }

  return NextResponse.json({ received: true, ignored: true });
}
