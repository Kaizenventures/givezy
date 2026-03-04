import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Thank You" });

export default function SuccessPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-6">🎉</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Thank you for your donation!</h1>
      <p className="text-gray-500 mb-8">
        We&apos;ve received your details. Our team will contact you within 48 hours to
        schedule a pickup at your convenience.
      </p>
      <Link
        href="/"
        className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
