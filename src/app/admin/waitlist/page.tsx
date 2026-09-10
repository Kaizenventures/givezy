import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { waitlist } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { AdminShell } from "../layout";
import WaitlistStatusSelect from "@/components/WaitlistStatusSelect";

export const dynamic = "force-dynamic";

export default async function AdminWaitlistPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const entries = await db.select().from(waitlist).orderBy(desc(waitlist.createdAt));
  const waiting = entries.filter((e) => e.status === "waiting").length;

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Waiting list</h1>
      <p className="text-sm text-gray-500 mb-6">
        {waiting} waiting · {entries.length} total. These people hit the cap and couldn&apos;t book a pickup.
      </p>

      {entries.length === 0 ? (
        <p className="text-gray-500 text-sm">Nobody on the waiting list.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Phone</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Pincode</th>
                <th className="pb-2 font-medium">Wanted</th>
                <th className="pb-2 font-medium">Joined</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{e.name}</td>
                  <td className="py-3">
                    <a href={`tel:${e.phone}`} className="text-emerald-600 hover:underline">{e.phone}</a>
                  </td>
                  <td className="py-3 text-gray-600">{e.email || "—"}</td>
                  <td className="py-3 text-gray-600">{e.pincode || "—"}</td>
                  <td className="py-3 text-gray-600 capitalize">
                    {e.category || "—"}{e.weightBucket ? ` · ${e.weightBucket}` : ""}
                  </td>
                  <td className="py-3 text-gray-500">{new Date(e.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="py-3">
                    <WaitlistStatusSelect id={e.id} current={e.status} />
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
