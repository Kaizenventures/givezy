import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "./layout";
import { checkCapacity } from "@/lib/capacity";
import { getWorklist, type WorkItem } from "@/lib/worklist";
import WorkCard from "@/components/WorkCard";
import QuickStatusButton from "@/components/QuickStatusButton";
import FulfilPickupButton from "@/components/FulfilPickupButton";
import { Package, Clock, Truck, PhoneCall, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const [work, capacity] = await Promise.all([getWorklist(), checkCapacity()]);

  const todoCount = work.postBag.length + work.bookPickup.length + work.abandoned.length;

  return (
    <AdminShell>
      <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Today</h1>
        <p className="text-sm text-gray-500">
          {todoCount === 0 ? "Nothing needs doing right now." : `${todoCount} thing${todoCount === 1 ? "" : "s"} to do`}
        </p>
      </div>
      <p className="text-sm text-gray-500 mb-8">
        Work down this list top to bottom. Everything else lives under Donations.
      </p>

      {todoCount === 0 && work.awaitingDonor.length === 0 && work.inTransit.length === 0 && (
        <div className="border border-gray-200 rounded-xl p-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="font-semibold text-gray-900">All clear</p>
          <p className="text-sm text-gray-500 mt-1">
            No bags to post, no pickups to book and nobody to chase.
          </p>
        </div>
      )}

      <Section
        icon={Package}
        title="Post a de-clutter bag"
        help="These donors have paid. Post their bag, then mark it sent."
        items={work.postBag}
        tone="emerald"
        action={(item) => (
          <QuickStatusButton donationId={item.donation.id} toStatus="bag_sent" label="Bag posted" />
        )}
        waMessage="Hi {name}, your Givezy de-clutter bag is on its way! Pack it up and message us here when it's ready. Ref: {ref}"
      />

      <Section
        icon={Truck}
        title="Book the courier"
        help="These donors say their bag is packed. Book the Shiprocket pickup."
        items={work.bookPickup}
        tone="amber"
        action={(item) => (
          <div className="w-40">
            <FulfilPickupButton
              donationId={item.donation.id}
              disabledReason={
                !item.shipment
                  ? "No payment record."
                  : item.shipment.paymentStatus !== "paid"
                  ? "Not paid yet."
                  : item.shipment.shiprocketOrderId
                  ? "Pickup already booked."
                  : null
              }
            />
          </div>
        )}
        waMessage="Hi {name}, we're booking your Givezy pickup now. Ref: {ref}"
      />

      <Section
        icon={PhoneCall}
        title="Follow up — didn't finish paying"
        help="They filled in their full address then stopped at payment. Usually worth one message."
        items={work.abandoned.slice(0, 5)}
        tone="rose"
        more={work.abandoned.length > 5 ? { href: "/admin/recovery", count: work.abandoned.length } : undefined}
        waMessage="Hi {name}, you were booking a Givezy book pickup but didn't finish. Need a hand? Ref: {ref}"
      />

      <Section
        icon={Clock}
        title="Waiting on the donor"
        help="Bag posted — they'll message when it's packed. Nothing to do unless it's been a while."
        items={work.awaitingDonor}
        tone="gray"
        collapsed
        action={(item) => (
          <QuickStatusButton
            donationId={item.donation.id}
            toStatus="packed"
            label="They're packed"
            variant="subtle"
          />
        )}
        waMessage="Hi {name}, just checking in — is your Givezy bag ready for pickup? Ref: {ref}"
      />

      <Section
        icon={Truck}
        title="Out for pickup"
        help="Courier booked. Mark complete once it reaches you."
        items={work.inTransit}
        tone="gray"
        collapsed
        action={(item) => (
          <QuickStatusButton
            donationId={item.donation.id}
            toStatus="completed"
            label="Received"
            variant="subtle"
          />
        )}
      />

      {/* Capacity */}
      <div className="border border-gray-200 rounded-xl p-5 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Today&apos;s slots</h2>
          <Link href="/admin/settings" className="text-sm text-emerald-600 hover:underline">
            Change limits
          </Link>
        </div>
        <CapacityBars capacity={capacity} waitingList={work.waitingList} />
      </div>
    </AdminShell>
  );
}

const TONES = {
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
  gray: "bg-gray-100 text-gray-600",
} as const;

function Section({
  icon: Icon,
  title,
  help,
  items,
  tone,
  action,
  waMessage,
  collapsed,
  more,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  help: string;
  items: WorkItem[];
  tone: keyof typeof TONES;
  action?: (item: WorkItem) => React.ReactNode;
  waMessage?: string;
  collapsed?: boolean;
  more?: { href: string; count: number };
}) {
  if (items.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2.5 mb-1">
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${TONES[tone]}`}>
          <Icon className="w-4 h-4" />
        </span>
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${TONES[tone]}`}>{items.length}</span>
      </div>
      <p className="text-sm text-gray-500 mb-3 ml-9.5">{help}</p>

      <div className="space-y-2">
        {(collapsed ? items.slice(0, 3) : items).map((item) => (
          <WorkCard key={item.donation.id} item={item} waMessage={waMessage}>
            {action?.(item)}
          </WorkCard>
        ))}
      </div>

      {collapsed && items.length > 3 && (
        <p className="text-xs text-gray-400 mt-2">
          + {items.length - 3} more —{" "}
          <Link href="/admin/donations" className="text-emerald-600 hover:underline">
            see all donations
          </Link>
        </p>
      )}

      {more && (
        <p className="text-xs text-gray-400 mt-2">
          Showing 5 of {more.count} —{" "}
          <Link href={more.href} className="text-emerald-600 hover:underline">
            see the full follow-up list
          </Link>
        </p>
      )}
    </section>
  );
}

function CapacityBars({
  capacity,
  waitingList,
}: {
  capacity: Awaited<ReturnType<typeof checkCapacity>>;
  waitingList: number;
}) {
  const rows = (["daily", "weekly", "monthly"] as const)
    .filter((k) => capacity.caps[k] > 0)
    .map((k) => ({ period: k, used: capacity.counts[k], cap: capacity.caps[k] }));

  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No limit set — the site accepts as many pickups as come in. Set a daily limit in Settings if
        you can only handle so many a day.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {rows.map((r) => {
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
          ? `Accepting bookings — ${capacity.remaining} slot(s) left.`
          : `Full. New donors are going onto the waiting list instead of paying.`}
      </p>
      {waitingList > 0 && (
        <p className="text-sm text-gray-500 mt-1">
          <Link href="/admin/waitlist" className="text-emerald-600 hover:underline">
            {waitingList} on the waiting list
          </Link>{" "}
          — invite them when slots free up.
        </p>
      )}
    </>
  );
}
