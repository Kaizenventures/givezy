"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPTIONS = [
  { value: "waiting", label: "Waiting" },
  { value: "invited", label: "Invited" },
  { value: "converted", label: "Converted" },
  { value: "dropped", label: "Dropped" },
];

export default function WaitlistStatusSelect({ id, current }: { id: string; current: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [saving, setSaving] = useState(false);

  async function change(next: string) {
    const previous = status;
    setStatus(next);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setStatus(previous);
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={status}
      disabled={saving}
      onChange={(e) => change(e.target.value)}
      className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white disabled:opacity-50"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
