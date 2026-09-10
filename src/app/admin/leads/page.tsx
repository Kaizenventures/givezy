import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { leads } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { AdminShell } from "../layout";
import LeadImport from "@/components/LeadImport";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
  const timed = rows.filter((r) => r.source === "homepage_timed").length;
  const exitIntent = rows.filter((r) => r.source === "homepage_exit").length;
  const imported = rows.filter((r) => r.source === "email_inbox" || r.source === "manual").length;

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Leads</h1>
      <p className="text-sm text-gray-500 mb-6">
        {rows.length} total · {timed} timed popup, {exitIntent} exit intent, {imported} imported.
      </p>

      <LeadImport />

      {rows.length === 0 ? (
        <p className="text-gray-500 text-sm">No leads captured yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Phone</th>
                <th className="pb-2 font-medium">Source</th>
                <th className="pb-2 font-medium">Captured</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{r.name || "—"}</td>
                  <td className="py-3">
                    {r.email ? (
                      <a href={`mailto:${r.email}`} className="text-emerald-600 hover:underline">{r.email}</a>
                    ) : "—"}
                  </td>
                  <td className="py-3">
                    {r.phone ? (
                      <a href={`tel:${r.phone}`} className="text-emerald-600 hover:underline">{r.phone}</a>
                    ) : "—"}
                  </td>
                  <td className="py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {r.source === "homepage_exit"
                        ? "Exit intent"
                        : r.source === "email_inbox"
                        ? "Emailed us"
                        : r.source === "manual"
                        ? "Added manually"
                        : "Timed popup"}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">
                    {new Date(r.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
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
