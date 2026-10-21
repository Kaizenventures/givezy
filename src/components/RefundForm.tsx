"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, ChevronDown, AlertTriangle } from "lucide-react";

/**
 * Refunds a booking. Kept collapsed and behind a confirmation step because this
 * moves real money out and cannot be undone from here — and because it sits
 * beside buttons that merely record things.
 */
export default function RefundForm({
  donationId,
  refundableRupees,
  partiallyRefunded,
  disabledReason,
}: {
  donationId: string;
  refundableRupees: number;
  partiallyRefunded: boolean;
  disabledReason: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const requested = amount.trim() === "" ? refundableRupees : Number(amount);
  const isPartial = Number.isFinite(requested) && requested > 0 && requested < refundableRupees;

  async function refund() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/donations/${donationId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountRupees: amount.trim() === "" ? null : amount, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not refund");
      setMessage({
        kind: "ok",
        text: data.full
          ? "Refunded. The booking is closed and its pickup slot is free again."
          : "Partial refund sent. The booking is still live.",
      });
      setConfirming(false);
      router.refresh();
    } catch (err) {
      setMessage({ kind: "err", text: err instanceof Error ? err.message : "Could not refund" });
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  if (disabledReason) {
    return <p className="text-xs text-gray-400">{disabledReason}</p>;
  }

  const inp =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none";

  return (
    <div className="border border-gray-200 rounded-xl">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-xl"
      >
        <span className="inline-flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-gray-400" />
          Refund {partiallyRefunded ? "the rest" : "this booking"}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
          <p className="text-xs text-gray-500">
            Sends the money back through Razorpay. ₹{refundableRupees} is left to refund. A full
            refund closes the booking and frees its pickup slot; a partial one leaves the pickup
            going ahead.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Amount (₹) — blank refunds it all
              </label>
              <input
                type="number"
                min={1}
                max={refundableRupees}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setConfirming(false);
                }}
                placeholder={String(refundableRupees)}
                className={inp}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Out of area, changed their mind…"
                className={inp}
              />
            </div>
          </div>

          {confirming ? (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
              <p className="inline-flex items-start gap-2 text-sm text-rose-900">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Refund <strong>₹{Number.isFinite(requested) ? requested : refundableRupees}</strong>
                  {isPartial ? " (partial)" : " in full"}? This cannot be undone here.
                </span>
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={refund}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50"
                >
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  Yes, refund it
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={busy}
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-white rounded-lg"
                >
                  Keep the payment
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-700 border border-rose-300 rounded-lg hover:bg-rose-50"
              >
                Refund…
              </button>
              {message && (
                <p className={`text-sm ${message.kind === "ok" ? "text-brand" : "text-red-500"}`}>
                  {message.text}
                </p>
              )}
            </div>
          )}

          {confirming && message?.kind === "err" && (
            <p className="text-sm text-red-500">{message.text}</p>
          )}
        </div>
      )}
    </div>
  );
}
