import SuccessContent from "@/components/SuccessContent";
import DonationReceipt, { type ReceiptData } from "@/components/DonationReceipt";
import { db } from "@/lib/db";
import { donations, shipments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getBuckets, getCountBuckets, getGenres, findBucket } from "@/lib/settings";
import { isDemoRecord } from "@/lib/demo";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Thank you",
  description: "Your Givezy pickup is booked. Here's what happens next.",
});

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  let maxKg: number | null = null;
  let bucketLabel: string | null = null;
  let receipt: ReceiptData | null = null;

  if (id) {
    const [donation] = await db.select().from(donations).where(eq(donations.id, id)).limit(1);

    if (donation) {
      const buckets =
        donation.sizeMode === "count" ? await getCountBuckets() : await getBuckets();
      const bucket = findBucket(buckets, donation.weightBucket);
      if (bucket) {
        maxKg = bucket.maxKg;
        bucketLabel = bucket.label;
      }

      const [shipment] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.donationId, donation.id))
        .limit(1);

      // Only issue a receipt once the money has actually landed
      if (shipment?.paymentStatus === "paid") {
        const allGenres = await getGenres();
        let genreIds: string[] = [];
        try {
          const parsed = JSON.parse(donation.genres);
          if (Array.isArray(parsed)) genreIds = parsed.filter((g): g is string => typeof g === "string");
        } catch {
          // older rows predate genres
        }

        receipt = {
          bookingId: donation.id.slice(0, 8).toUpperCase(),
          paymentId: shipment.razorpayPaymentId,
          paidAt: shipment.updatedAt,
          donorName: donation.donorName,
          donorPhone: donation.donorPhone,
          donorEmail: donation.donorEmail,
          address: donation.donorAddress,
          pincode: donation.donorPincode,
          city: donation.donorArea,
          sizeLabel: bucket?.label ?? donation.weightBucket,
          maxKg: bucket?.maxKg ?? 0,
          genres: genreIds
            .map((gid) => allGenres.find((g) => g.id === gid)?.label)
            .filter((l): l is string => !!l),
          amountPaise: shipment.totalAmount,
          isDemo: isDemoRecord(shipment.razorpayPaymentId),
        };
      }
    }
  }

  return (
    <>
      <SuccessContent donationId={id ?? null} maxKg={maxKg} bucketLabel={bucketLabel} />
      {receipt && (
        <div className="max-w-xl mx-auto px-4 pb-16">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Your receipt</h2>
          <DonationReceipt data={receipt} />
        </div>
      )}
    </>
  );
}
