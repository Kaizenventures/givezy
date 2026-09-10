import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { donations, shipments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getBuckets, getCountBuckets, getGenres, findBucket } from "@/lib/settings";
import { checkCapacity } from "@/lib/capacity";
import { createRazorpayOrder } from "@/lib/razorpay";
import { isDemoMode, demoPaymentId, canAcceptDonations } from "@/lib/demo";
import { settlePayment } from "@/lib/settle-payment";
import { enforceRateLimit } from "@/lib/rate-limit";

const MAX_PHOTOS = 6;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
// Total upload budget per submission — the real guard against filling the disk.
// Indian mobile carriers put many users behind one CGNAT address, so the
// per-IP request limit has to stay generous; this caps the damage instead.
const MAX_TOTAL_BYTES = 15 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

async function savePhoto(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext || "jpg"}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

/**
 * POST /api/donate
 * Creates the donation and its Razorpay order in one shot. The donation is
 * held at `pending_payment` (and does not consume capacity) until
 * /api/shipping/verify confirms the payment.
 */
export async function POST(req: NextRequest) {
  try {
    // Photo uploads write to disk, so cap how often one client can submit
    const limited = enforceRateLimit(req, "donate", 12, 10 * 60 * 1000);
    if (limited) return limited;

    const declaredLength = Number(req.headers.get("content-length") || 0);
    if (declaredLength > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        { error: "Those photos are too large. Please add fewer or smaller images." },
        { status: 413 },
      );
    }

    if (!canAcceptDonations()) {
      return NextResponse.json(
        { error: "Donations aren't open yet", paymentsUnavailable: true },
        { status: 503 },
      );
    }

    // Capacity gate — the client also checks, but never trust it
    const capacity = await checkCapacity();
    if (!capacity.available) {
      return NextResponse.json(
        { error: "At capacity", atCapacity: true, blockedBy: capacity.blockedBy },
        { status: 409 },
      );
    }

    const formData = await req.formData();
    const str = (k: string) => (formData.get(k) as string | null)?.trim() || "";

    const category = str("category");
    const weightBucket = str("weightBucket");
    const sizeMode = str("sizeMode") === "count" ? "count" : "weight";
    const donorName = str("donorName");
    const donorPhone = str("donorPhone");
    const donorEmail = str("donorEmail");
    const donorAddress = str("donorAddress");
    const donorPincode = str("donorPincode");
    const donorArea = str("donorArea");
    const description = str("description");
    const whatsappOptin = formData.get("whatsappOptin") === "true";

    if (!category || !weightBucket || !donorName || !donorPhone || !donorAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!/^\d{6}$/.test(donorPincode)) {
      return NextResponse.json({ error: "A valid 6-digit pincode is required" }, { status: 400 });
    }
    if (category !== "books") {
      return NextResponse.json({ error: "Only book donations are open right now" }, { status: 400 });
    }

    // Price comes from server-side settings, never from the client. Both scales
    // resolve to the same bucket ids, so only the labelling differs.
    const buckets = sizeMode === "count" ? await getCountBuckets() : await getBuckets();
    const bucket = findBucket(buckets, weightBucket);
    if (!bucket) {
      return NextResponse.json({ error: "Unknown size option" }, { status: 400 });
    }

    // Genres are optional, but must be ones we actually offer
    const allowedGenres = new Set((await getGenres()).map((g) => g.id));
    const genres = formData
      .getAll("genres")
      .map((g) => String(g))
      .filter((g) => allowedGenres.has(g))
      .slice(0, 10);

    // Photos
    const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > MAX_PHOTOS) {
      return NextResponse.json({ error: `At most ${MAX_PHOTOS} photos` }, { status: 400 });
    }
    let totalBytes = 0;
    for (const f of files) {
      if (f.size > MAX_PHOTO_BYTES) {
        return NextResponse.json({ error: "Each photo must be under 5 MB" }, { status: 400 });
      }
      totalBytes += f.size;
      if (totalBytes > MAX_TOTAL_BYTES) {
        return NextResponse.json(
          { error: "Those photos are too large. Please add fewer or smaller images." },
          { status: 413 },
        );
      }
      if (f.type && !ALLOWED_TYPES.includes(f.type)) {
        return NextResponse.json({ error: "Photos must be JPEG, PNG or WebP" }, { status: 400 });
      }
    }
    const photoUrls: string[] = [];
    for (const f of files) photoUrls.push(await savePhoto(f));

    const [donation] = await db
      .insert(donations)
      .values({
        category,
        title: `${bucket.label} of ${category}`,
        description: description || null,
        // Legacy NOT NULL column; v2 doesn't ask donors to grade condition
        condition: "unspecified",
        photos: JSON.stringify(photoUrls),
        imageUrl: photoUrls[0] || null,
        weightBucket: bucket.id,
        sizeMode,
        genres: JSON.stringify(genres),
        status: "pending_payment",
        donorName,
        donorPhone,
        donorEmail: donorEmail || null,
        donorAddress,
        donorPincode,
        donorArea: donorArea || null,
        whatsappOptin,
      })
      .returning();

    const [shipment] = await db
      .insert(shipments)
      .values({
        donationId: donation.id,
        shippingCost: bucket.pricePaise,
        serviceFee: 0,
        totalAmount: bucket.pricePaise,
        paymentStatus: "pending",
        fulfillmentStatus: "pending",
      })
      .returning();

    // Demo mode: no gateway available, so record the donation as paid and let
    // the caller skip straight to the thank-you page.
    if (isDemoMode()) {
      await settlePayment({ shipmentId: shipment.id, razorpayPaymentId: demoPaymentId() });
      return NextResponse.json(
        {
          success: true,
          demo: true,
          donationId: donation.id,
          shipmentId: shipment.id,
          amount: bucket.pricePaise,
          bucket: { id: bucket.id, label: bucket.label, maxKg: bucket.maxKg },
        },
        { status: 201 },
      );
    }

    const order = await createRazorpayOrder(bucket.pricePaise, shipment.id);
    if (order.error) {
      return NextResponse.json({ error: order.error }, { status: 500 });
    }

    await db
      .update(shipments)
      .set({ razorpayOrderId: order.razorpayOrderId })
      .where(eq(shipments.id, shipment.id));

    return NextResponse.json(
      {
        success: true,
        donationId: donation.id,
        shipmentId: shipment.id,
        razorpayOrderId: order.razorpayOrderId,
        amount: bucket.pricePaise,
        currency: "INR",
        bucket: { id: bucket.id, label: bucket.label, maxKg: bucket.maxKg },
        donor: { name: donorName, email: donorEmail, phone: donorPhone },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Donation submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
