import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { donations } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { AdminShell } from "../../layout";
import DonationStatusUpdate from "@/components/DonationStatusUpdate";

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
            <h1 className="text-2xl font-bold text-gray-900">{donation.title}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {donation.category} &middot; {donation.condition.replace("_", " ")} &middot; Qty: {donation.quantity}
            </p>
          </div>

          {donation.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
              <p className="text-gray-700 text-sm">{donation.description}</p>
            </div>
          )}

          {donation.imageUrl && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Photo</h3>
              <img
                src={donation.imageUrl}
                alt={donation.title}
                className="w-full max-w-md rounded-lg object-cover"
              />
            </div>
          )}

          {/* Status update */}
          <DonationStatusUpdate
            donationId={donation.id}
            currentStatus={donation.status}
            currentPickupDate={donation.pickupDate}
            currentPickupNotes={donation.pickupNotes}
          />
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
