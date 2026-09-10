/**
 * Demo mode lets the site be walked end to end before the Razorpay account is
 * live: checkout is skipped and the donation is recorded as paid.
 *
 * It requires DEMO_MODE=true AND the absence of a real Razorpay key, so the
 * moment live credentials are configured demo mode switches itself off even if
 * the flag was left behind. Never let it turn on implicitly.
 */
export function isDemoMode(): boolean {
  const flagged = process.env.DEMO_MODE === "true";
  const hasLiveKeys = !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET;
  return flagged && !hasLiveKeys;
}

/** Marker written into shipments.razorpayPaymentId for simulated payments. */
export function demoPaymentId(): string {
  return `demo_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;
}

export const DEMO_PAYMENT_PREFIX = "demo_";

export function isDemoRecord(razorpayPaymentId: string | null): boolean {
  return !!razorpayPaymentId?.startsWith(DEMO_PAYMENT_PREFIX);
}
