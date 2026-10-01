import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { donations } from "@/lib/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { AdminShell } from "../layout";
import { ACTIVE_STATUSES, statusLabel, statusColor, isLegacyStatus } from "@/lib/donation-status";

export const dynamic = "force-dynamic";

export default async function DonationsListPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    category?: string;
    pincode?: string;
    area?: string;
    q?: string;
    archive?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const allDonations = await db.select().from(donations).orderBy(desc(donations.createdAt));

  // Old-site rows are history, not work. They are hidden unless asked for,
  // otherwise 170 of them bury the handful that need attention.
  const showArchive = params.archive === "1";
  const archivedCount = allDonations.filter((d) => isLegacyStatus(d.status)).length;

  let filtered = allDonations.filter((d) =>
    showArchive ? isLegacyStatus(d.status) : !isLegacyStatus(d.status),
  );

  if (params.status) filtered = filtered.filter((d) => d.status === params.status);
  if (params.category) filtered = filtered.filter((d) => d.category === params.category);
  if (params.pincode) filtered = filtered.filter((d) => d.donorPincode === params.pincode);
  if (params.area)
    filtered = filtered.filter(
      (d) => d.donorArea?.trim().toLowerCase() === params.area!.trim().toLowerCase(),
    );

  const query = (params.q ?? "").trim();
  if (query) {
    const lower = query.toLowerCase();
    const digits = query.replace(/\D/g, "");
    filtered = filtered.filter(
      (d) =>
        d.donorName.toLowerCase().includes(lower) ||
        (d.donorEmail ?? "").toLowerCase().includes(lower) ||
        d.donorPincode.includes(query) ||
        d.id.slice(0, 8).toLowerCase() === lower ||
        // Only match on phone when the query actually contains digits
        (digits.length >= 4 && d.donorPhone.replace(/\D/g, "").includes(digits)),
    );
  }

  // Filters combine instead of replacing one another
  function withParams(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    const merged = { ...params, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) next.set(k, v);
    }
    const qs = next.toString();
    return qs ? `/admin/donations?${qs}` : "/admin/donations";
  }

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All pickups</h1>
        <span className="text-sm text-gray-500">{filtered.length} results</span>
      </div>

      {/* Filters */}
      <form method="get" className="flex gap-2 mb-4">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search name, phone, email, pincode or reference"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
        {params.status && <input type="hidden" name="status" value={params.status} />}
        {params.category && <input type="hidden" name="category" value={params.category} />}
        {showArchive && <input type="hidden" name="archive" value="1" />}
        <button className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800">
          Search
        </button>
        {query && (
          <Link
            href={withParams({ q: undefined })}
            className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear
          </Link>
        )}
      </form>

      <div className="flex gap-2 mb-6 flex-wrap items-center">
        <Link
          href={withParams({ status: undefined, category: undefined })}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            !params.status && !params.category
              ? "bg-gray-900 text-white border-gray-900"
              : "border-gray-300 text-gray-600 hover:border-gray-400"
          }`}
        >
          All
        </Link>
        {ACTIVE_STATUSES.map((s) => (
          <Link
            key={s.value}
            href={withParams({ status: params.status === s.value ? undefined : s.value })}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              params.status === s.value
                ? "bg-gray-900 text-white border-gray-900"
                : "border-gray-300 text-gray-600 hover:border-gray-400"
            }`}
          >
            {s.label}
          </Link>
        ))}
        <span className="text-gray-300">|</span>
        {["books", "clothes"].map((c) => (
          <Link
            key={c}
            href={withParams({ category: params.category === c ? undefined : c })}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
              params.category === c
                ? "bg-gray-900 text-white border-gray-900"
                : "border-gray-300 text-gray-600 hover:border-gray-400"
            }`}
          >
            {c}
          </Link>
        ))}
        {archivedCount > 0 && (
          <>
            <span className="text-gray-300">|</span>
            <Link
              href={withParams({ archive: showArchive ? undefined : "1", status: undefined })}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                showArchive
                  ? "bg-amber-600 text-white border-amber-600"
                  : "border-amber-300 text-amber-700 hover:border-amber-400"
              }`}
            >
              {showArchive ? "Showing old site" : `Old site (${archivedCount})`}
            </Link>
          </>
        )}
      </div>

      {showArchive && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-4">
          These are bookings from the previous version of the site, kept as history. They are not
          part of the current workflow and need no action.
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">No pickups found.</p>
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
