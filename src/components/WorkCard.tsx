import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";
import type { WorkItem } from "@/lib/worklist";
import { whatsappNumber, bookingRef } from "@/lib/worklist";

/** One donation in a worklist, with the contact shortcuts Siddhanth needs. */
export default function WorkCard({
  item,
  waMessage,
  children,
}: {
  item: WorkItem;
  waMessage?: string;
  children?: React.ReactNode;
}) {
  const d = item.donation;
  const ref = bookingRef(d.id);
  const wa = whatsappNumber(d.donorPhone);

  return (
    <div className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/admin/donations/${d.id}`}
            className="font-semibold text-gray-900 hover:text-emerald-600 hover:underline"
          >
            {d.donorName}
          </Link>
          <span className="font-mono text-xs text-gray-400">{ref}</span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5 truncate">
          {d.donorAddress}
          {d.donorArea ? `, ${d.donorArea}` : ""} — {d.donorPincode}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {d.weightBucket.replace(/-/g, " ")} ·{" "}
          {new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <a
          href={`tel:${d.donorPhone}`}
          title={`Call ${d.donorPhone}`}
          className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          <Phone className="w-4 h-4" />
        </a>
        <a
          href={`https://wa.me/${wa}${waMessage ? `?text=${encodeURIComponent(waMessage.replace("{ref}", ref).replace("{name}", d.donorName))}` : ""}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Message on WhatsApp"
          className="p-2 rounded-lg border border-gray-300 text-emerald-600 hover:bg-emerald-50"
        >
          <MessageCircle className="w-4 h-4" />
        </a>
        {children}
      </div>
    </div>
  );
}
