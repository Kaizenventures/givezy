"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface ShippingEstimate {
  shippingCost: number; // paise
  serviceFee: number;
  total: number;
  courierName: string | null;
  estimatedDays: number | null;
  display: {
    shippingCost: string;
    serviceFee: string;
    total: string;
  };
}

interface PaymentOrder {
  shipmentId: string;
  razorpayOrderId: string;
  amount: number;
  breakdown: {
    shippingCost: number;
    serviceFee: number;
    total: number;
  };
  donor: {
    name: string;
    email: string;
    phone: string;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const donationId = searchParams.get("id") || "";
  const name = searchParams.get("name") || "";
  const phone = searchParams.get("phone") || "";
  const pincode = searchParams.get("pincode") || "";

  const [estimate, setEstimate] = useState<ShippingEstimate | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Auto-fetch shipping estimate on page load
  useEffect(() => {
    if (pincode && !estimate && !loadingEstimate) {
      setLoadingEstimate(true);
      setEstimateError(null);
      fetch("/api/shipping/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode, weightGrams: 2000 }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setEstimateError(data.error);
          } else {
            setEstimate(data);
          }
        })
        .catch(() => setEstimateError("Could not get shipping estimate"))
        .finally(() => setLoadingEstimate(false));
    }
  }, [pincode, estimate, loadingEstimate]);

  // Handle Razorpay payment
  const handlePayForShipping = useCallback(async () => {
    if (!donationId) return;

    setPaymentLoading(true);
    setPaymentError(null);

    try {
      // Step 1: Create shipment + Razorpay order
      const payRes = await fetch("/api/shipping/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId, weightGrams: 2000 }),
      });
      const payData: PaymentOrder & { error?: string } = await payRes.json();

      if (!payRes.ok || payData.error) {
        throw new Error(payData.error || "Failed to create payment");
      }

      // Step 2: Open Razorpay modal
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: payData.amount,
        currency: "INR",
        name: "Givezy",
        description: "Donation Shipping",
        order_id: payData.razorpayOrderId,
        prefill: {
          name: payData.donor.name || name,
          email: payData.donor.email || "",
          contact: payData.donor.phone || phone,
        },
        theme: { color: "#059669" },
        handler: async (response: RazorpayResponse) => {
          // Step 3: Verify payment
          try {
            const verifyRes = await fetch("/api/shipping/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                shipmentId: payData.shipmentId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              setPaymentSuccess(true);
            } else {
              setPaymentError("Payment verification failed. Contact support.");
            }
          } catch {
            setPaymentError("Payment may have succeeded but verification failed. Contact support.");
          }
          setPaymentLoading(false);
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
          },
        },
      };

      if (typeof window.Razorpay === "undefined") {
        throw new Error("Payment system is loading. Please try again.");
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Payment failed");
      setPaymentLoading(false);
    }
  }, [donationId, name, phone]);

  // Success state — payment done
  if (paymentSuccess) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4" aria-hidden="true">🚚</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Shipping Confirmed!</h1>
        <p className="text-gray-500 mb-6">
          Payment received. A courier will be assigned to pick up your donation.
          You&apos;ll receive tracking details shortly.
        </p>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-emerald-700">
            Thank you for donating and covering the shipping! Your items will reach us
            and be put to good use.
          </p>
        </div>
        <Link
          href="/"
          className="inline-block bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4" aria-hidden="true">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Thank you for your donation!</h1>
        <p className="text-gray-500">
          One last step — pay for shipping and a courier will pick up from your address.
        </p>
      </div>

      {/* Shipping payment card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl" aria-hidden="true">📦</span>
          <h3 className="font-semibold text-gray-900">Courier Pickup</h3>
        </div>

        {loadingEstimate && (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Calculating shipping cost...
          </div>
        )}

        {estimateError && (
          <div className="text-sm text-red-600 py-4">
            {estimateError}. Please try again or contact us for help.
          </div>
        )}

        {estimate && (
          <>
            {/* Price breakdown */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping ({estimate.courierName || "Courier"})</span>
                <span>{estimate.display.shippingCost}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Service Charge (5%)</span>
                <span>{estimate.display.serviceFee}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span>{estimate.display.total}</span>
              </div>
              {estimate.estimatedDays && (
                <p className="text-xs text-gray-400 pt-1">
                  Estimated delivery: {estimate.estimatedDays} day{estimate.estimatedDays > 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Pay button */}
            <button
              onClick={handlePayForShipping}
              disabled={paymentLoading}
              className="w-full bg-emerald-600 text-white px-5 py-3 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {paymentLoading ? "Processing..." : `Pay ${estimate.display.total} & Schedule Pickup`}
            </button>

            {paymentError && (
              <p className="text-sm text-red-600 mt-2">{paymentError}</p>
            )}

            <p className="text-xs text-gray-400 mt-3 text-center">
              Secure payment powered by Razorpay
            </p>
          </>
        )}
      </div>

      <div className="text-center">
        <Link
          href="/"
          className="inline-block text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
        >
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}
