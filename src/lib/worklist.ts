import { db } from "./db";
import { donations, shipments, waitlist } from "./schema";
import { desc, eq } from "drizzle-orm";
import type { Donation, Shipment } from "./schema";

/** How long after starting checkout an unpaid donation counts as abandoned. */
export const ABANDONED_AFTER_MINUTES = 30;

export interface WorkItem {
  donation: Donation;
  shipment: Shipment | null;
}

export interface Worklist {
  /** Paid, waiting for us to post the de-clutter bag. */
  postBag: WorkItem[];
  /** Bag posted, waiting on the donor to say it's packed. */
  awaitingDonor: WorkItem[];
  /** Donor confirmed packed — book the courier. */
  bookPickup: WorkItem[];
  /** Filled in their details but never paid — worth a follow-up. */
  abandoned: WorkItem[];
  /** People who hit the cap and are still waiting. */
  waitingList: number;
  /** Pickups booked and in transit. */
  inTransit: WorkItem[];
}

function pair(ds: Donation[], byDonation: Map<string, Shipment>): WorkItem[] {
  return ds.map((d) => ({ donation: d, shipment: byDonation.get(d.id) ?? null }));
}

export async function getWorklist(now: Date = new Date()): Promise<Worklist> {
  const [allDonations, allShipments, waitingRows] = await Promise.all([
    db.select().from(donations).orderBy(desc(donations.createdAt)),
    db.select().from(shipments),
    db.select({ id: waitlist.id }).from(waitlist).where(eq(waitlist.status, "waiting")),
  ]);

  const byDonation = new Map(allShipments.map((s) => [s.donationId, s]));
  const cutoff = new Date(now.getTime() - ABANDONED_AFTER_MINUTES * 60 * 1000).toISOString();

  const byStatus = (status: string) => allDonations.filter((d) => d.status === status);

  return {
    postBag: pair(byStatus("paid"), byDonation),
    awaitingDonor: pair(byStatus("bag_sent"), byDonation),
    bookPickup: pair(byStatus("packed"), byDonation),
    abandoned: pair(
      allDonations.filter((d) => d.status === "pending_payment" && d.createdAt < cutoff),
      byDonation,
    ),
    waitingList: waitingRows.length,
    inTransit: pair(
      allDonations.filter((d) => ["pickup_scheduled", "picked_up"].includes(d.status)),
      byDonation,
    ),
  };
}

/** Digits-only phone for wa.me links. */
export function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("91") ? digits : `91${digits}`;
}

export function bookingRef(donationId: string): string {
  return donationId.slice(0, 8).toUpperCase();
}
