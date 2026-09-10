"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, Loader2 } from "lucide-react";

export default function FulfilPickupButton({
  donationId,
  disabledReason,
}: {
  donationId: string;
  disabledReason: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function run() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/donations/${donationId}/fulfil`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create the pickup");
      setMessage({
        kind: "ok",
        text: data.courierEstimateRupees
          ? `Pickup booked. Courier quoted ₹${data.courierEstimateRupees}.`
          : "Pickup booked with Shiprocket.",
      });
      router.refresh();
    } catch (err) {
      setMessage({ kind: "err", text: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={run}
        disabled={loading || !!disabledReason}
        title={disabledReason ?? undefined}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
        Book Shiprocket pickup
      </button>

      {disabledReason && <p className="text-xs text-gray-400 mt-1.5">{disabledReason}</p>}

      {message && (
        <p className={`text-xs mt-2 ${message.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
