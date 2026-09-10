import { Suspense } from "react";
import DonationForm from "@/components/DonationForm";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Donate",
  description:
    "Donate books and clothes in Hyderabad. Fill a quick form, pick a bag size, and we'll collect from your doorstep.",
});

export default function DonatePage() {
  return (
    <div className="px-4 py-12">
      <Suspense fallback={<div className="max-w-xl mx-auto text-center text-gray-400">Loading form...</div>}>
        <DonationForm />
      </Suspense>
    </div>
  );
}
