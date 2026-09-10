"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Package, MessageCircle, Truck, Loader2 } from "lucide-react";

interface NextStep {
  nextStepTitle: string;
  nextStepBody: string;
  whatsappNumber: string;
}

export default function SuccessContent({
  donationId,
  maxKg,
  bucketLabel,
}: {
  donationId: string | null;
  maxKg: number | null;
  bucketLabel: string | null;
}) {
  const [content, setContent] = useState<NextStep | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setContent(d.content))
      .catch(() => setContent(null))
      .finally(() => setLoading(false));
  }, []);

  const waNumber = content?.whatsappNumber?.replace(/[^\d]/g, "") || "";
  const waMessage = encodeURIComponent(
    donationId
      ? `Hi Givezy! My de-clutter bag is packed and ready for pickup. Donation ref: ${donationId.slice(0, 8)}`
      : "Hi Givezy! My de-clutter bag is packed and ready for pickup.",
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Payment received</h1>
        <p className="text-gray-500 text-sm mt-1">
          Thank you — your pickup is booked.
          {donationId && (
            <>
              {" "}Your reference is{" "}
              <span className="font-mono font-medium text-gray-700">{donationId.slice(0, 8).toUpperCase()}</span>.
            </>
          )}
        </p>
      </div>

      {/* The Next Step */}
      <div className="border-2 border-gray-900 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 text-center mb-5">
          {loading ? "The Next Step" : content?.nextStepTitle || "The Next Step"}
        </h2>

        <ol className="space-y-5">
          <Step icon={Package} n={1}>
            You will now receive a <strong>de-clutter bag</strong> from Givezy.
          </Step>
          <Step icon={Truck} n={2}>
            Once you receive it, you are allowed to pack it up to{" "}
            <strong>{maxKg ? `${maxKg} kgs` : "the weight you selected"}</strong>
            {bucketLabel ? ` (${bucketLabel})` : ""}.
          </Step>
          <Step icon={MessageCircle} n={3}>
            Once done, please ping us on WhatsApp and we&apos;ll arrange the pickup.
          </Step>
        </ol>
      </div>

      {loading ? (
        <div className="flex justify-center text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : waNumber ? (
        <a
          href={`https://wa.me/${waNumber}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          Ping us on WhatsApp when packed
        </a>
      ) : (
        <p className="text-center text-sm text-gray-500">
          We&apos;ll be in touch shortly with WhatsApp details for the pickup.
        </p>
      )}

      <div className="text-center mt-8">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}

function Step({
  icon: Icon,
  n,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  n: number;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <div className="shrink-0 w-9 h-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
      <div className="pt-1.5">
        <span className="text-xs font-bold text-gray-400 mr-1.5">{n}.</span>
        <span className="text-sm text-gray-700 leading-relaxed">{children}</span>
      </div>
    </li>
  );
}
