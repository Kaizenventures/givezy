import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { shipments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { settlePayment } from "@/lib/settle-payment";
import { recordRefund } from "@/lib/refund";

/**
 * POST /api/webhooks/razorpay
 *
 * Server-side safety net for payments. The browser callback in the donate form
 * can be lost (tab closed, connection dropped) leaving a captured payment with
 * an unpaid donation; Razorpay retries this endpoint until it succeeds, so the
 * donation is settled regardless.
 *
 * It is also the only way a refund issued from the Razorpay dashboard reaches
 * this app — and the dashboard is where refunds will usually be made, because
 * it works even when this app does not.
 *
 * Configure in the Razorpay dashboard against `payment.captured`,
 * `payment.failed`, `refund.processed` and `refund.created`, with the same
 * secret as RAZORPAY_WEBHOOK_SECRET.
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
        method?: string;
        amount_refunded?: number;
        error_description?: string;
        error_reason?: string;
      };
    };
    refund?: {
      entity?: {
        id?: string;
        payment_id?: string;
        amount?: number;
        status?: string;
        notes?: Record<string, string>;
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
  const refund = body.payload?.refund?.entity;
  const payment = body.payload?.payment?.entity;

  // ─── Refunds ───
  // A refund event carries the payment it reverses, not the order, so the
  // shipment is found by payment id. `refund.created` and `refund.processed`
  // both describe the same refund; recordRefund deduplicates on the refund id
  // so whichever arrives first wins and the other is a no-op.
  if (refund?.payment_id && refund.id) {
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.razorpayPaymentId, refund.payment_id))
      .limit(1);

    if (!shipment) {
      console.warn(`[razorpay-webhook] no shipment for payment ${refund.payment_id}`);
      return NextResponse.json({ received: true, matched: false });
    }

    const result = await recordRefund({
      shipmentId: shipment.id,
      amountPaise: Number(refund.amount ?? 0),
      razorpayRefundId: refund.id,
      reason: refund.notes?.reason ?? "Refunded in the Razorpay dashboard",
    });
    console.log(`[razorpay-webhook] ${event} ${refund.id} -> ${result.status}`);
    return NextResponse.json({ received: true, result: result.status });
  }

  if (!payment?.id) {
    // Nothing actionable, but acknowledge so Razorpay stops retrying
    return NextResponse.json({ received: true, ignored: true });
  }

  // ─── Payments ───
  if (!payment.order_id) {
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
    // A later successful retry must not be overwritten by a stale failure
    if (shipment.paymentStatus !== "paid") {
      const now = new Date().toISOString();
      await db
        .update(shipments)
        .set({
          paymentStatus: "failed",
          paymentMethod: payment.method || null,
          failureReason: payment.error_description || payment.error_reason || "Payment failed",
          failedAt: now,
          updatedAt: now,
        })
        .where(eq(shipments.id, shipment.id));
    }
    return NextResponse.json({ received: true, event });
  }

  // Sent when a payment becomes fully or partly refunded. The refund events
  // above carry more detail, so this is a backstop for the case where only
  // `payment.refunded` is subscribed to in the dashboard. It reports the
  // cumulative amount refunded, so the delta is what has not been recorded yet.
  if (event === "payment.refunded" || event === "payment.partially_refunded") {
    const alreadyRefunded = shipment.refundAmount;
    const cumulative = Number(payment.amount_refunded ?? 0);
    const delta = cumulative - alreadyRefunded;
    if (delta <= 0) {
      return NextResponse.json({ received: true, result: "already_recorded" });
    }
    const result = await recordRefund({
      shipmentId: shipment.id,
      amountPaise: delta,
      reason: "Refunded in the Razorpay dashboard",
    });
    console.log(`[razorpay-webhook] ${event} ${payment.id} -> ${result.status}`);
    return NextResponse.json({ received: true, result: result.status });
  }

  if (event === "payment.captured" || payment.status === "captured") {
    const result = await settlePayment({
      shipmentId: shipment.id,
      razorpayPaymentId: payment.id,
      paymentMethod: payment.method || null,
    });
    console.log(`[razorpay-webhook] ${payment.order_id} -> ${result.status}`);
    return NextResponse.json({ received: true, result: result.status });
  }

  return NextResponse.json({ received: true, ignored: true });
}
