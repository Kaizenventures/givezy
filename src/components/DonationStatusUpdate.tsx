"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  { value: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-700" },
  { value: "scheduled", label: "Scheduled", color: "bg-purple-100 text-purple-700" },
  { value: "picked_up", label: "Picked Up", color: "bg-emerald-100 text-emerald-700" },
  { value: "cancelled", label: "Cancelled", color: "bg-gray-100 text-gray-600" },
];

export default function DonationStatusUpdate({
  donationId,
  currentStatus,
  currentPickupDate,
  currentPickupNotes,
}: {
  donationId: string;
  currentStatus: string;
  currentPickupDate: string | null;
  currentPickupNotes: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [pickupDate, setPickupDate] = useState(currentPickupDate || "");
  const [pickupNotes, setPickupNotes] = useState(currentPickupNotes || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/donations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: donationId,
          status,
          pickupDate: pickupDate || null,
          pickupNotes: pickupNotes || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      setMessage("Updated successfully");
      router.refresh();
    } catch {
      setMessage("Failed to update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
      <h3 className="font-semibold text-gray-900">Update Status</h3>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatus(s.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
              status === s.value
                ? `${s.color} border-current`
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
        <input
          type="date"
          value={pickupDate}
          onChange={(e) => setPickupDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={pickupNotes}
          onChange={(e) => setPickupNotes(e.target.value)}
          rows={2}
          placeholder="Internal notes about this donation..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {message && (
          <span className={`text-sm ${message.includes("success") ? "text-emerald-600" : "text-red-600"}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
