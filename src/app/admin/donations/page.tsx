import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { donations } from "@/lib/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { AdminShell } from "../layout";
import { ACTIVE_STATUSES, statusLabel, statusColor } from "@/lib/donation-status";

export const dynamic = "force-dynamic";

export default async function DonationsListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; pincode?: string; area?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const allDonations = await db.select().from(donations).orderBy(desc(donations.createdAt));

  let filtered = allDonations;
  if (params.status) filtered = filtered.filter((d) => d.status === params.status);
  if (params.category) filtered = filtered.filter((d) => d.category === params.category);
  if (params.pincode) filtered = filtered.filter((d) => d.donorPincode === params.pincode);
  if (params.area)
    filtered = filtered.filter(
      (d) => d.donorArea?.trim().toLowerCase() === params.area!.trim().toLowerCase(),
    );

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Donations</h1>
        <span className="text-sm text-gray-500">{filtered.length} results</span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link
          href="/admin/donations"
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            !params.status && !params.category ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 text-gray-600 hover:border-gray-400"
          }`}
        >
          All
        </Link>
        {ACTIVE_STATUSES.map((s) => (
          <Link
            key={s.value}
            href={`/admin/donations?status=${s.value}`}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              params.status === s.value ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 text-gray-600 hover:border-gray-400"
            }`}
          >
            {s.label}
          </Link>
        ))}
        <span className="text-gray-300">|</span>
        {["books", "clothes"].map((c) => (
          <Link
            key={c}
            href={`/admin/donations?category=${c}`}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
              params.category === c ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 text-gray-600 hover:border-gray-400"
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">No donations found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-2 font-medium">Title</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">Donor</th>
                <th className="pb-2 font-medium">Phone</th>
                <th className="pb-2 font-medium">Area</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">WhatsApp</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3">
                    <Link href={`/admin/donations/${d.id}`} className="text-emerald-600 hover:underline font-medium">
                      {d.title || `${d.weightBucket} of ${d.category}`}
                    </Link>
                  </td>
                  <td className="py-3 capitalize">{d.category}</td>
                  <td className="py-3">{d.donorName}</td>
                  <td className="py-3">
                    <a href={`tel:${d.donorPhone}`} className="text-blue-600 hover:underline">{d.donorPhone}</a>
                  </td>
                  <td className="py-3 text-gray-500">{d.donorArea || "—"}</td>
                  <td className="py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(d.status)}`}>
                      {statusLabel(d.status)}
                    </span>
                  </td>
                  <td className="py-3">{d.whatsappOptin ? "Yes" : "No"}</td>
                  <td className="py-3 text-gray-500">
                    {new Date(d.createdAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
