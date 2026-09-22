"use client";

import { useState } from "react";
import { Loader2, Check, X, HelpCircle } from "lucide-react";

interface Result {
  status: "ok" | "outside" | "unknown" | "unverified" | "disabled";
  distanceKm: number | null;
  radiusKm: number | null;
}

/** Check a real pincode against the saved area, so the radius can be sanity-checked. */
export default function ServiceAreaTester() {
  const [pincode, setPincode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/serviceability?pincode=${encodeURIComponent(pincode)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't check that pincode");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't check that pincode");
    } finally {
      setBusy(false);
    }
  }

  const view = {
    ok: { icon: Check, tone: "text-emerald-600", text: "Inside the area — this booking would go through." },
    outside: { icon: X, tone: "text-red-600", text: "Outside the area — they'd be offered the waiting list." },
    unknown: { icon: HelpCircle, tone: "text-amber-600", text: "Pincode not found — they'd be offered the waiting list." },
    unverified: { icon: HelpCircle, tone: "text-amber-600", text: "Lookup unavailable — bookings are let through while that's the case." },
    disabled: { icon: HelpCircle, tone: "text-gray-500", text: "Area checking is switched off, so every address is accepted." },
  }[result?.status ?? "disabled"];

  const Icon = view.icon;

  return (
    <div>
      <h3 className="font-semibold text-gray-900">Test a pincode</h3>
      <p className="text-sm text-gray-500 mt-1 mb-3">
        Checks against the <em>saved</em> area, so save your changes first.
      </p>
      <div className="flex items-end gap-2">
        <div className="w-36">
          <label className="block text-xs font-medium text-gray-500 mb-1">Pincode</label>
          <input
            value={pincode}
            inputMode="numeric"
            maxLength={6}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="500032"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>
        <button
          onClick={run}
          disabled={busy || pincode.length !== 6}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Check
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

      {result && (
        <p className={`text-sm mt-3 inline-flex items-start gap-2 ${view.tone}`}>
          <Icon className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            {view.text}
            {result.distanceKm !== null && (
              <span className="block text-gray-500 text-xs mt-0.5 tabular-nums">
                {result.distanceKm} km away, limit {result.radiusKm} km
              </span>
            )}
          </span>
        </p>
      )}
    </div>
  );
}
