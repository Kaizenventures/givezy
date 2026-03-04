import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import SuccessContent from "@/components/SuccessContent";

export const metadata = buildMetadata({ title: "Thank You" });

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-20 text-center text-gray-400">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
