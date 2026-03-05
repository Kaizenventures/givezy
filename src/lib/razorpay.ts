import Razorpay from "razorpay";
import crypto from "crypto";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

let razorpayInstance: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

export interface CreateOrderResult {
  razorpayOrderId: string;
  amount: number; // in paise
  currency: string;
  error: string | null;
}

/**
 * Create a Razorpay order for the given amount
 */
export async function createRazorpayOrder(
  amountPaise: number,
  givezyOrderId: string,
  receipt?: string
): Promise<CreateOrderResult> {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return {
      razorpayOrderId: "",
      amount: 0,
      currency: "INR",
      error: "Razorpay not configured",
    };
  }

  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: receipt || givezyOrderId,
      notes: {
        givezy_order_id: givezyOrderId,
      },
    });

    return {
      razorpayOrderId: order.id,
      amount: order.amount as number,
      currency: order.currency,
      error: null,
    };
  } catch (err) {
    console.error("Razorpay create order error:", err);
    return {
      razorpayOrderId: "",
      amount: 0,
      currency: "INR",
      error: "Failed to create payment order",
    };
  }
}

/**
 * Verify Razorpay payment signature using HMAC-SHA256
 */
export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  if (!RAZORPAY_KEY_SECRET) return false;

  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  return expectedSignature === razorpaySignature;
}

/**
 * Calculate service charge (5% by default)
 */
export function calculateServiceCharge(subtotalPaise: number): number {
  const percent = parseInt(process.env.NEXT_PUBLIC_SERVICE_CHARGE_PERCENT || "5");
  return Math.round(subtotalPaise * (percent / 100));
}
