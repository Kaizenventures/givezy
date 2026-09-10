import SuccessContent from "@/components/SuccessContent";
import { db } from "@/lib/db";
import { donations } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getBuckets, findBucket } from "@/lib/settings";
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

  if (id) {
    const [donation] = await db
      .select({ weightBucket: donations.weightBucket })
      .from(donations)
      .where(eq(donations.id, id))
      .limit(1);

    if (donation) {
      const bucket = findBucket(await getBuckets(), donation.weightBucket);
      if (bucket) {
        maxKg = bucket.maxKg;
        bucketLabel = bucket.label;
      }
    }
  }

  return <SuccessContent donationId={id ?? null} maxKg={maxKg} bucketLabel={bucketLabel} />;
}
