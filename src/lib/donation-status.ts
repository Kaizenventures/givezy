export const DONATION_STATUSES = [
  { value: "pending_payment", label: "Awaiting payment", color: "bg-gray-100 text-gray-600" },
  { value: "paid", label: "Paid", color: "bg-blue-100 text-blue-700" },
  { value: "bag_sent", label: "Bag sent", color: "bg-indigo-100 text-indigo-700" },
  { value: "packed", label: "Packed (donor confirmed)", color: "bg-purple-100 text-purple-700" },
  { value: "pickup_scheduled", label: "Pickup scheduled", color: "bg-amber-100 text-amber-700" },
  { value: "picked_up", label: "Picked up", color: "bg-teal-100 text-teal-700" },
  { value: "completed", label: "Completed", color: "bg-emerald-100 text-emerald-700" },
  { value: "cancelled", label: "Cancelled", color: "bg-gray-100 text-gray-500" },
  // Legacy values from the pre-v2 flow, kept so old rows still render
  { value: "pending", label: "Pending (legacy)", color: "bg-yellow-100 text-yellow-700" },
  { value: "contacted", label: "Contacted (legacy)", color: "bg-blue-50 text-blue-600" },
  { value: "scheduled", label: "Scheduled (legacy)", color: "bg-purple-50 text-purple-600" },
] as const;

export const ACTIVE_STATUSES = DONATION_STATUSES.filter((s) => !s.label.includes("legacy"));

export function statusLabel(value: string): string {
  return DONATION_STATUSES.find((s) => s.value === value)?.label ?? value.replace(/_/g, " ");
}

export function statusColor(value: string): string {
  return DONATION_STATUSES.find((s) => s.value === value)?.color ?? "bg-gray-100 text-gray-600";
}
