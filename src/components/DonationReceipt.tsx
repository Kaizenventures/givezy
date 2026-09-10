"use client";

import { Printer } from "lucide-react";

export interface ReceiptData {
  bookingId: string;
  paymentId: string | null;
  paidAt: string | null;
  donorName: string;
  donorPhone: string;
  donorEmail: string | null;
  address: string;
  pincode: string;
  city: string | null;
  sizeLabel: string;
  maxKg: number;
  genres: string[];
  amountPaise: number;
  isDemo: boolean;
}

export default function DonationReceipt({ data }: { data: ReceiptData }) {
  const rows: [string, string][] = [
    ["Booking ID", data.bookingId],
    ["Payment ID", data.paymentId || "—"],
    ["Date", data.paidAt ? new Date(data.paidAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"],
    ["Donor", data.donorName],
    ["Phone", data.donorPhone],
    ...(data.donorEmail ? ([["Email", data.donorEmail]] as [string, string][]) : []),
    ["Pickup address", [data.address, data.city, data.pincode].filter(Boolean).join(", ")],
    ["Donation size", `${data.sizeLabel} (up to ${data.maxKg} kg)`],
    ...(data.genres.length ? ([["Categories", data.genres.join(", ")]] as [string, string][]) : []),
  ];

  return (
    <div className="receipt-root">
      {/* Print rules live here so the receipt prints alone, without site chrome */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .receipt-root, .receipt-root * { visibility: visible !important; }
          .receipt-root { position: absolute; inset: 0; margin: 0; padding: 24px; }
          .receipt-noprint { display: none !important; }
          .receipt-card { border-color: #d1d5db !important; box-shadow: none !important; }
        }
      `}</style>

      <div className="receipt-card border border-gray-200 rounded-2xl p-6 bg-white">
        <div className="flex items-start justify-between mb-5 pb-5 border-b border-gray-100">
          <div>
            <p className="text-lg font-bold text-emerald-700">Givezy</p>
            <p className="text-xs text-gray-500 mt-0.5">Pickup confirmation</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Amount paid</p>
            <p className="text-xl font-bold text-gray-900">₹{(data.amountPaise / 100).toFixed(2)}</p>
          </div>
        </div>

        {data.isDemo && (
          <p className="mb-4 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            DEMO — no payment was actually taken
          </p>
        )}

        <dl className="space-y-2.5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex gap-4 text-sm">
              <dt className="text-gray-500 w-32 shrink-0">{label}</dt>
              <dd className={`text-gray-900 flex-1 break-words ${label.endsWith("ID") ? "font-mono text-xs pt-0.5" : ""}`}>
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-400 leading-relaxed">
          This is a receipt for a doorstep pickup service fee, not a charitable donation receipt.
          It is not valid for tax exemption purposes.
        </p>
      </div>

      <button
        onClick={() => window.print()}
        className="receipt-noprint mt-3 w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
      >
        <Printer className="w-4 h-4" />
        Print or save as PDF
      </button>
    </div>
  );
}
