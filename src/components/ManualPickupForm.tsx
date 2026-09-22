"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Truck, ChevronDown } from "lucide-react";

/**
 * Records a collection arranged without the Shiprocket API — the only way
 * pickups happen until that account is live.
 */
export default function ManualPickupForm({
  donationId,
  disabledReason,
  startOpen = false,
}: {
  donationId: string;
  disabledReason: string | null;
  startOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(startOpen);
  const [courierName, setCourierName] = useState("");
  const [awb, setAwb] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/donations/${donationId}/manual-pickup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courierName, awb, trackingUrl, pickupDate, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setMessage({ kind: "ok", text: "Pickup recorded." });
      router.refresh();
    } catch (err) {
      setMessage({ kind: "err", text: err instanceof Error ? err.message : "Could not save" });
    } finally {
      setBusy(false);
    }
  }

  if (disabledReason) {
    return <p className="text-xs text-gray-400">{disabledReason}</p>;
  }

  const input =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none";

  return (
    <div className="border border-gray-200 rounded-xl">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-xl"
      >
        <span className="inline-flex items-center gap-2">
          <Truck className="w-4 h-4 text-gray-400" />
          Record a pickup you arranged
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
          <p className="text-xs text-gray-500">
            For collections booked by phone, another courier, or your own vehicle. Everything here is
            optional except the fact of the pickup itself.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Courier / who is collecting</label>
              <input value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="Porter" className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Pickup date</label>
              <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tracking reference</label>
              <input value={awb} onChange={(e) => setAwb(e.target.value)} placeholder="Optional" className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tracking link</label>
              <input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="https://" className={input} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth remembering" className={input} />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Mark pickup arranged
            </button>
            {message && (
              <p className={`text-sm ${message.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>
                {message.text}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
