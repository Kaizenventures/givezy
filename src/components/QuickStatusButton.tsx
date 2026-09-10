"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/** One-click status advance for the admin worklist. */
export default function QuickStatusButton({
  donationId,
  toStatus,
  label,
  variant = "primary",
}: {
  donationId: string;
  toStatus: string;
  label: string;
  variant?: "primary" | "subtle";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function run() {
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/donations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: donationId, status: toStatus }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const styles =
    variant === "primary"
      ? "bg-gray-900 text-white hover:bg-gray-800"
      : "border border-gray-300 text-gray-700 hover:bg-gray-50";

  return (
    <button
      onClick={run}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${styles}`}
    >
      {busy && <Loader2 className="w-3 h-3 animate-spin" />}
      {error ? "Try again" : label}
    </button>
  );
}
