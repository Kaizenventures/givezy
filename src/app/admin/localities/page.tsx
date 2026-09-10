import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { donations } from "@/lib/schema";
import { AdminShell } from "../layout";

export const dynamic = "force-dynamic";

interface Cluster {
  key: string;
  label: string;
  total: number;
  active: number;
}

export default async function LocalitiesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const rows = await db.select().from(donations);
  // Abandoned checkouts aren't real demand — leave them out of the picture
  const real = rows.filter((d) => d.status !== "pending_payment" && d.status !== "cancelled");

  const ACTIVE = ["paid", "bag_sent", "packed", "pickup_scheduled"];

  function cluster(keyOf: (d: (typeof real)[number]) => string | null): Cluster[] {
    const map = new Map<string, Cluster>();
    for (const d of real) {
      const key = keyOf(d);
      if (!key) continue;
      const existing = map.get(key) || { key, label: key, total: 0, active: 0 };
      existing.total += 1;
      if (ACTIVE.includes(d.status)) existing.active += 1;
      map.set(key, existing);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }

  const byPincode = cluster((d) => d.donorPincode || null);
  const byArea = cluster((d) => (d.donorArea?.trim() ? d.donorArea.trim() : null));

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Where donations come from</h1>
      <p className="text-sm text-gray-500 mb-8 max-w-2xl">
        Which parts of Hyderabad are actually donating. Useful for spotting clusters — if one pincode
        keeps coming up, that&apos;s where a single van run would collect the most in one trip.
        Unpaid and cancelled bookings are excluded.
      </p>

      {real.length === 0 ? (
        <p className="text-gray-500 text-sm">No donations yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          <ClusterTable title="By pincode" heading="Pincode" clusters={byPincode} linkKey="pincode" />
          <ClusterTable title="By area" heading="Area" clusters={byArea} linkKey="area" />
        </div>
      )}
    </AdminShell>
  );
}

function ClusterTable({
  title,
  heading,
  clusters,
  linkKey,
}: {
  title: string;
  heading: string;
  clusters: Cluster[];
  linkKey: string;
}) {
  const max = clusters[0]?.total ?? 1;

  return (
    <section>
      <h2 className="font-semibold text-gray-900 mb-3">{title}</h2>
      {clusters.length === 0 ? (
        <p className="text-sm text-gray-400">
          {linkKey === "area" ? "Nobody has filled in a city or area yet." : "No data yet."}
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="pb-2 font-medium">{heading}</th>
              <th className="pb-2 font-medium w-20">Total</th>
              <th className="pb-2 font-medium w-20">Open</th>
              <th className="pb-2 font-medium w-28"></th>
            </tr>
          </thead>
          <tbody>
            {clusters.map((c) => (
              <tr key={c.key} className="border-b border-gray-100">
                <td className="py-2.5">
                  <Link
                    href={`/admin/donations?${linkKey}=${encodeURIComponent(c.key)}`}
                    className="text-emerald-600 hover:underline font-medium"
                  >
                    {c.label}
                  </Link>
                </td>
                <td className="py-2.5 font-medium text-gray-900">{c.total}</td>
                <td className="py-2.5 text-gray-500">{c.active}</td>
                <td className="py-2.5">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.round((c.total / max) * 100)}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
