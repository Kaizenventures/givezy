import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { donations } from "@/lib/schema";
import { eq, desc, sql } from "drizzle-orm";
import Link from "next/link";
import { AdminShell } from "./layout";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const allDonations = await db.select().from(donations).orderBy(desc(donations.createdAt));

  const total = allDonations.length;
  const pending = allDonations.filter((d) => d.status === "pending").length;
  const contacted = allDonations.filter((d) => d.status === "contacted").length;
  const scheduled = allDonations.filter((d) => d.status === "scheduled").length;
  const pickedUp = allDonations.filter((d) => d.status === "picked_up").length;

  const recent = allDonations.slice(0, 5);

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total", value: total, color: "bg-gray-100 text-gray-900" },
          { label: "Pending", value: pending, color: "bg-yellow-50 text-yellow-700" },
          { label: "Contacted", value: contacted, color: "bg-blue-50 text-blue-700" },
          { label: "Scheduled", value: scheduled, color: "bg-purple-50 text-purple-700" },
          { label: "Picked Up", value: pickedUp, color: "bg-emerald-50 text-emerald-700" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-lg p-4 ${stat.color}`}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm font-medium opacity-70">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent donations */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Donations</h2>
        <Link href="/admin/donations" className="text-sm text-emerald-600 hover:underline">
          View all
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="text-gray-500 text-sm">No donations yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-2 font-medium">Title</th>
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
                      {d.title}
                    </Link>
                  </td>
                  <td className="py-3 capitalize">{d.category}</td>
                  <td className="py-3">{d.donorName}</td>
                  <td className="py-3">{d.donorPhone}</td>
                  <td className="py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      d.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      d.status === "contacted" ? "bg-blue-100 text-blue-700" :
                      d.status === "scheduled" ? "bg-purple-100 text-purple-700" :
                      d.status === "picked_up" ? "bg-emerald-100 text-emerald-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {d.status.replace("_", " ")}
                    </span>
                  </td>
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
