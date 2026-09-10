import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { donations, shipments } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { AdminShell } from "../layout";
import { isDemoRecord } from "@/lib/demo";
import { bookingRef } from "@/lib/worklist";

export const dynamic = "force-dynamic";

const METHOD_LABELS: Record<string, string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Netbanking",
  wallet: "Wallet",
  emi: "EMI",
};

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const [allShipments, allDonations] = await Promise.all([
    db.select().from(shipments).orderBy(desc(shipments.createdAt)),
    db.select().from(donations),
  ]);
  const donorById = new Map(allDonations.map((d) => [d.id, d]));

  const paid = allShipments.filter((s) => s.paymentStatus === "paid");
  const real = paid.filter((s) => !isDemoRecord(s.razorpayPaymentId));
  const demo = paid.length - real.length;
  const failed = allShipments.filter((s) => s.paymentStatus === "failed");

  const collected = real.reduce((sum, s) => sum + s.totalAmount, 0);

  // Where couriers cost more than we charged
  const underwater = real.filter(
    (s) => s.estimatedCourierCost !== null && s.estimatedCourierCost > s.totalAmount,
  );

  const methodCounts = new Map<string, number>();
  for (const s of real) {
    const key = s.paymentMethod || "unknown";
    methodCounts.set(key, (methodCounts.get(key) || 0) + 1);
  }
  const methods = [...methodCounts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Payments</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat label="Collected" value={`₹${(collected / 100).toFixed(0)}`} tone="bg-emerald-50 text-emerald-700" />
        <Stat label="Paid bookings" value={real.length} tone="bg-gray-100 text-gray-900" />
        <Stat label="Failed payments" value={failed.length} tone="bg-rose-50 text-rose-700" />
        {demo > 0 && <Stat label="Demo (not real)" value={demo} tone="bg-amber-50 text-amber-700" />}
      </div>

      {underwater.length > 0 && (
        <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-xl">
          <p className="font-semibold text-rose-900 text-sm">
            {underwater.length} pickup{underwater.length === 1 ? "" : "s"} cost more than we charged
          </p>
          <p className="text-rose-700 text-sm mt-1">
            The courier quoted more than the donor paid. If this keeps happening, raise the prices in{" "}
            <Link href="/admin/settings" className="underline font-medium">Settings</Link>.
          </p>
        </div>
      )}

      {/* Payment methods */}
      {methods.length > 0 && (
        <section className="mb-8">
          <h2 className="font-semibold text-gray-900 mb-3">How people paid</h2>
          <div className="space-y-2">
            {methods.map(([method, count]) => {
              const pct = Math.round((count / real.length) * 100);
              return (
                <div key={method}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{METHOD_LABELS[method] || "Not recorded"}</span>
                    <span className="text-gray-900 font-medium">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Failed payments */}
      <section>
        <h2 className="font-semibold text-gray-900 mb-1">Failed payments</h2>
        <p className="text-sm text-gray-500 mb-3">
          Payments the bank or gateway declined. The reason usually tells you whether it&apos;s worth
          asking them to try again.
        </p>

        {failed.length === 0 ? (
          <p className="text-gray-500 text-sm">No failed payments.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 font-medium">Donor</th>
                  <th className="pb-2 font-medium">Ref</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Reason</th>
                  <th className="pb-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {failed.map((s) => {
                  const d = donorById.get(s.donationId);
                  return (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3">
                        {d ? (
                          <Link href={`/admin/donations/${d.id}`} className="text-emerald-600 hover:underline font-medium">
                            {d.donorName}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="py-3 font-mono text-xs text-gray-500">
                        {d ? bookingRef(d.id) : "—"}
                      </td>
                      <td className="py-3">₹{(s.totalAmount / 100).toFixed(0)}</td>
                      <td className="py-3 text-gray-600">{s.failureReason || "Not recorded"}</td>
                      <td className="py-3 text-gray-500">
                        {new Date(s.failedAt || s.updatedAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className={`rounded-lg p-4 ${tone}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium opacity-70">{label}</p>
    </div>
  );
}
