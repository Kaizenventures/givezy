import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { donations, shipments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { AdminShell } from "../../layout";
import DonationStatusUpdate from "@/components/DonationStatusUpdate";
import FulfilPickupButton from "@/components/FulfilPickupButton";
import { getBuckets, findBucket } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function DonationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const [donation] = await db
    .select()
    .from(donations)
    .where(eq(donations.id, id))
    .limit(1);

  if (!donation) notFound();

  // Fetch associated shipment (if donor paid for shipping)
  const donationShipments = await db
    .select()
    .from(shipments)
    .where(eq(shipments.donationId, id));

  const shipment = donationShipments.length > 0 ? donationShipments[0] : null;

  const bucket = findBucket(await getBuckets(), donation.weightBucket);

  let photos: string[] = [];
  try {
    const parsed = JSON.parse(donation.photos);
    if (Array.isArray(parsed)) photos = parsed.filter((u): u is string => typeof u === "string");
  } catch {
    // pre-v2 rows stored a single imageUrl instead
  }
  if (photos.length === 0 && donation.imageUrl) photos = [donation.imageUrl];

  const fulfilBlockedReason =
    !shipment ? "No payment record for this donation."
    : shipment.paymentStatus !== "paid" ? "Book the pickup once payment has cleared."
    : shipment.shiprocketOrderId ? "A Shiprocket pickup already exists."
    : null;

  return (
    <AdminShell>
      <div className="mb-4">
        <Link href="/admin/donations" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Back to donations
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {donation.title || `${bucket?.label ?? donation.weightBucket} of ${donation.category}`}
            </h1>
            <p className="text-gray-500 text-sm mt-1 capitalize">
              {donation.category}
              {bucket ? ` · ${bucket.label} (up to ${bucket.maxKg} kg)` : ` · ${donation.weightBucket}`}
              {donation.condition ? ` · ${donation.condition.replace("_", " ")}` : ""}
            </p>
          </div>

          {donation.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
              <p className="text-gray-700 text-sm">{donation.description}</p>
            </div>
          )}

          {photos.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                {photos.length === 1 ? "Photo" : `Photos (${photos.length})`}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-md">
                {photos.map((url, i) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Donation photo ${i + 1}`}
                      className="w-full aspect-square rounded-lg object-cover border border-gray-200 hover:opacity-90 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Status update */}
          <DonationStatusUpdate
            donationId={donation.id}
            currentStatus={donation.status}
            currentPickupDate={donation.pickupDate}
            currentPickupNotes={donation.pickupNotes}
          />

          {/* Shipment info */}
          {shipment && (
            <div className="border border-gray-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Shipping & Payment</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Payment</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                    shipment.paymentStatus === "paid"
                      ? "bg-green-100 text-green-700"
                      : shipment.paymentStatus === "failed"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {shipment.paymentStatus.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Fulfillment</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                    shipment.fulfillmentStatus === "delivered"
                      ? "bg-green-100 text-green-700"
                      : shipment.fulfillmentStatus === "shipped"
                      ? "bg-blue-100 text-blue-700"
                      : shipment.fulfillmentStatus === "cancelled"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {shipment.fulfillmentStatus.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="bg-gray-50 rounded p-3 mb-4 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Pickup charge</span>
                  <span>₹{(shipment.shippingCost / 100).toFixed(2)}</span>
                </div>
                {shipment.serviceFee > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Service charge</span>
                    <span>₹{(shipment.serviceFee / 100).toFixed(2)}</span>
                  </div>
                )}
                {shipment.estimatedCourierCost !== null && (
                  <div className="flex justify-between text-gray-500">
                    <span>Courier quoted</span>
                    <span
                      className={
                        shipment.estimatedCourierCost > shipment.totalAmount ? "text-red-600 font-medium" : ""
                      }
                    >
                      ₹{(shipment.estimatedCourierCost / 100).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-gray-900 border-t pt-1">
                  <span>Total Paid</span>
                  <span>₹{(shipment.totalAmount / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Tracking details */}
              <dl className="space-y-2 text-sm">
                {shipment.razorpayPaymentId && (
                  <div>
                    <dt className="text-gray-500">Razorpay Payment ID</dt>
                    <dd className="font-mono text-xs text-gray-700">{shipment.razorpayPaymentId}</dd>
                  </div>
                )}
                {shipment.shiprocketOrderId && (
                  <div>
                    <dt className="text-gray-500">Shiprocket Order ID</dt>
                    <dd className="font-mono text-xs text-gray-700">{shipment.shiprocketOrderId}</dd>
                  </div>
                )}
                {shipment.shiprocketAwb && (
                  <div>
                    <dt className="text-gray-500">AWB Number</dt>
                    <dd className="font-mono text-xs text-gray-700">{shipment.shiprocketAwb}</dd>
                  </div>
                )}
                {shipment.trackingUrl && (
                  <div>
                    <dt className="text-gray-500">Tracking</dt>
                    <dd>
                      <a
                        href={shipment.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Track Shipment →
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>

        {/* Donor sidebar */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Donor Details</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium text-gray-900">{donation.donorName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd>
                  <a href={`tel:${donation.donorPhone}`} className="text-blue-600 hover:underline font-medium">
                    {donation.donorPhone}
                  </a>
                </dd>
              </div>
              {donation.donorEmail && (
                <div>
                  <dt className="text-gray-500">Email</dt>
                  <dd>
                    <a href={`mailto:${donation.donorEmail}`} className="text-blue-600 hover:underline">
                      {donation.donorEmail}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Address</dt>
                <dd className="text-gray-900">{donation.donorAddress}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Pincode</dt>
                <dd className="text-gray-900">{donation.donorPincode}</dd>
              </div>
              {donation.donorArea && (
                <div>
                  <dt className="text-gray-500">Area</dt>
                  <dd className="text-gray-900">{donation.donorArea}</dd>
                </div>
              )}
              {donation.preferredSlot && (
                <div>
                  <dt className="text-gray-500">Preferred Slot</dt>
                  <dd className="text-gray-900 capitalize">{donation.preferredSlot}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">WhatsApp</dt>
                <dd className="text-gray-900">{donation.whatsappOptin ? "Opted in" : "No"}</dd>
              </div>
            </dl>
          </div>

          {/* Quick actions */}
          <div className="bg-gray-50 rounded-lg p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <FulfilPickupButton donationId={donation.id} disabledReason={fulfilBlockedReason} />
              <a
                href={`tel:${donation.donorPhone}`}
                className="block w-full text-center py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Call Donor
              </a>
              {donation.whatsappOptin && (
                <a
                  href={`https://wa.me/91${donation.donorPhone.replace(/\D/g, "").replace(/^91/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  WhatsApp
                </a>
              )}
              {donation.donorEmail && (
                <a
                  href={`mailto:${donation.donorEmail}`}
                  className="block w-full text-center py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Send Email
                </a>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-400">
            Created: {new Date(donation.createdAt).toLocaleString("en-IN")}<br />
            Updated: {new Date(donation.updatedAt).toLocaleString("en-IN")}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
