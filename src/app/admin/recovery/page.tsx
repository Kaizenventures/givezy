import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "../layout";
import { getWorklist, ABANDONED_AFTER_MINUTES } from "@/lib/worklist";
import WorkCard from "@/components/WorkCard";
import QuickStatusButton from "@/components/QuickStatusButton";

export const dynamic = "force-dynamic";

export default async function RecoveryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const work = await getWorklist();

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Follow-ups</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-2xl">
        These people typed in their full name, phone and home address, then stopped at the payment
        screen. They wanted to donate — usually something small got in the way. One WhatsApp message
        recovers a good share of them. Anyone who started in the last {ABANDONED_AFTER_MINUTES} minutes
        is hidden, since they may still be paying.
      </p>

      {work.abandoned.length === 0 ? (
        <p className="text-gray-500 text-sm">Nobody to follow up right now.</p>
      ) : (
        <div className="space-y-2">
          {work.abandoned.map((item) => (
            <WorkCard
              key={item.donation.id}
              item={item}
              waMessage="Hi {name}, you started booking a Givezy book pickup but didn't finish. Anything we can help with? Ref: {ref}"
            >
              <QuickStatusButton
                donationId={item.donation.id}
                toStatus="cancelled"
                label="Not interested"
                variant="subtle"
              />
            </WorkCard>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
