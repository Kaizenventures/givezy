import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { donations, shipments, leads, waitlist } from "@/lib/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { AdminShell } from "./layout";
import { checkCapacity } from "@/lib/capacity";
import { statusLabel, statusColor } from "@/lib/donation-status";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const [allDonations, allShipments, allLeads, allWaitlist, capacity] = await Promise.all([
    db.select().from(donations).orderBy(desc(donations.createdAt)),
    db.select().from(shipments),
    db.select().from(leads),
    db.select().from(waitlist),
    checkCapacity(),
  ]);

  // Abandoned checkouts aren't real donations — keep them out of the headline count
  const real = allDonations.filter((d) => d.status !== "pending_payment");
  const abandoned = allDonations.length - real.length;

  const paid = allShipments.filter((s) => s.paymentStatus === "paid");
  const collected = paid.reduce((sum, s) => sum + s.totalAmount, 0);

  const awaitingPickup = real.filter((d) => ["paid", "bag_sent", "packed"].includes(d.status)).length;
  const inTransit = real.filter((d) => ["pickup_scheduled", "picked_up"].includes(d.status)).length;
  const completed = real.filter((d) => d.status === "completed").length;
  const waitingCount = allWaitlist.filter((w) => w.status === "waiting").length;

  const stats = [
    { label: "Donations", value: real.length, color: "bg-gray-100 text-gray-900" },
    { label: "Awaiting pickup", value: awaitingPickup, color: "bg-blue-50 text-blue-700" },
    { label: "In transit", value: inTransit, color: "bg-amber-50 text-amber-700" },
    { label: "Completed", value: completed, color: "bg-emerald-50 text-emerald-700" },
    { label: "Collected", value: `₹${(collected / 100).toFixed(0)}`, color: "bg-pink-50 text-pink-700" },
    { label: "Paid orders", value: paid.length, color: "bg-indigo-50 text-indigo-700" },
    { label: "Leads", value: allLeads.length, color: "bg-purple-50 text-purple-700" },
    { label: "Waiting list", value: waitingCount, color: "bg-orange-50 text-orange-700" },
  ];

  const capRows = (["daily", "weekly", "monthly"] as const)
    .filter((k) => capacity.caps[k] > 0)
    .map((k) => ({ period: k, used: capacity.counts[k], cap: capacity.caps[k] }));

  const recent = allDonations.slice(0, 8);

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className={`rounded-lg p-4 ${stat.color}`}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm font-medium opacity-70">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Capacity */}
      <div className="border border-gray-200 rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Capacity</h2>
          <Link href="/admin/settings" className="text-sm text-emerald-600 hover:underline">
            Change caps
          </Link>
        </div>

        {capRows.length === 0 ? (
          <p className="text-sm text-gray-500">
            No caps set — the site accepts unlimited pickups. Set a limit in Settings to switch donors
            onto the waiting list once you&apos;re full.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {capRows.map((r) => {
                const pct = Math.min(100, Math.round((r.used / r.cap) * 100));
                return (
                  <div key={r.period}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-gray-600">{r.period}</span>
                      <span className={`font-medium ${r.used >= r.cap ? "text-red-600" : "text-gray-900"}`}>
                        {r.used} / {r.cap}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className={`text-sm mt-4 ${capacity.available ? "text-emerald-600" : "text-red-600 font-medium"}`}>
              {capacity.available
                ? `Accepting donations — ${capacity.remaining} slot(s) left.`
                : `At capacity (${capacity.blockedBy} limit reached). Donors are being sent to the waiting list.`}
            </p>
          </>
        )}
      </div>

      {/* Recent donations */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Donations</h2>
        <Link href="/admin/donations" className="text-sm text-emerald-600 hover:underline">
          View all
        </Link>
      </div>

      {abandoned > 0 && (
        <p className="text-xs text-gray-400 mb-3">
          {abandoned} checkout{abandoned === 1 ? "" : "s"} started but never paid for. They don&apos;t count
          toward your caps.
        </p>
      )}

      {recent.length === 0 ? (
        <p className="text-gray-500 text-sm">No donations yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">Donor</th>
                <th className="pb-2 font-medium">Phone</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((d) => (
                <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3">
                    <Link href={`/admin/donations/${d.id}`} className="text-emerald-600 hover:underline font-medium">
                      {d.title || `${d.weightBucket} of ${d.category}`}
                    </Link>
                  </td>
                  <td className="py-3 capitalize">{d.category}</td>
                  <td className="py-3">{d.donorName}</td>
                  <td className="py-3">{d.donorPhone}</td>
                  <td className="py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(d.status)}`}>
                      {statusLabel(d.status)}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{new Date(d.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
