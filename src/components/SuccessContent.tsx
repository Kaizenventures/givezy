"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface BorzoEstimate {
  price: number;
  currency: string;
  error: string | null;
}

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const address = searchParams.get("address") || "";
  const name = searchParams.get("name") || "";
  const phone = searchParams.get("phone") || "";

  const [selectedOption, setSelectedOption] = useState<"pickup" | "ship" | null>(null);
  const [estimate, setEstimate] = useState<BorzoEstimate | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);

  useEffect(() => {
    if (selectedOption === "ship" && address && !estimate) {
      setLoadingEstimate(true);
      fetch("/api/borzo/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupAddress: address,
          contactName: name,
          contactPhone: phone,
        }),
      })
        .then((res) => res.json())
        .then((data) => setEstimate(data))
        .catch(() => setEstimate({ price: 0, currency: "INR", error: "Could not get estimate" }))
        .finally(() => setLoadingEstimate(false));
    }
  }, [selectedOption, address, name, phone, estimate]);

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <div className="text-5xl mb-4" aria-hidden="true">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Thank you for your donation!</h1>
        <p className="text-gray-500">
          We&apos;ve received your details. Now, how would you like to get the items to us?
        </p>
      </div>

      {/* Delivery options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => setSelectedOption("pickup")}
          className={`p-5 rounded-xl border-2 text-left transition-all ${
            selectedOption === "pickup"
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <span className="text-2xl" aria-hidden="true">🏠</span>
          <h3 className="mt-2 font-semibold text-gray-900">Free Pickup</h3>
          <p className="mt-1 text-sm text-gray-500">
            We&apos;ll come to your door. Our team will contact you within 48 hours to schedule.
          </p>
          <p className="mt-2 text-sm font-semibold text-emerald-600">Free</p>
        </button>

        <button
          onClick={() => setSelectedOption("ship")}
          className={`p-5 rounded-xl border-2 text-left transition-all ${
            selectedOption === "ship"
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <span className="text-2xl" aria-hidden="true">📦</span>
          <h3 className="mt-2 font-semibold text-gray-900">Ship via Borzo</h3>
          <p className="mt-1 text-sm text-gray-500">
            Send it to us today using Borzo same-day delivery. You pay the courier directly.
          </p>
          <p className="mt-2 text-sm font-semibold text-gray-500">Paid by you</p>
        </button>
      </div>

      {/* Free pickup selected */}
      {selectedOption === "pickup" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 mb-8">
          <h3 className="font-semibold text-emerald-800 mb-2">All set!</h3>
          <p className="text-sm text-emerald-700">
            Our team will contact you within 48 hours to schedule a free pickup at your convenience.
            Keep the items packed and ready.
          </p>
        </div>
      )}

      {/* Ship via Borzo selected */}
      {selectedOption === "ship" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-8">
          <h3 className="font-semibold text-blue-800 mb-2">Ship via Borzo</h3>

          {loadingEstimate && (
            <p className="text-sm text-blue-600">Estimating delivery cost...</p>
          )}

          {estimate && !estimate.error && estimate.price > 0 && (
            <div className="mb-3">
              <p className="text-sm text-blue-700">
                Estimated cost: <span className="font-bold text-lg">₹{estimate.price.toFixed(0)}</span>
              </p>
              <p className="text-xs text-blue-500 mt-1">Same-day delivery via motorbike courier</p>
            </div>
          )}

          {estimate?.error && (
            <p className="text-sm text-blue-600 mb-3">
              We couldn&apos;t estimate the exact price, but you can check on Borzo directly.
            </p>
          )}

          {!loadingEstimate && (
            <>
              <p className="text-sm text-blue-700 mb-3">
                Book a Borzo courier to pick up from your address and deliver to us. You pay the courier directly (cash or card).
              </p>
              <a
                href="https://borzodelivery.com/in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Book on Borzo
              </a>
              <p className="text-xs text-blue-500 mt-3">
                Ship to: <span className="font-medium">{process.env.NEXT_PUBLIC_DROP_OFF_ADDRESS || "Address will be shared soon"}</span>
              </p>
            </>
          )}
        </div>
      )}

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
