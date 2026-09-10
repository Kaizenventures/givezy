import { db } from "./db";
import { donations } from "./schema";
import { and, gte, ne } from "drizzle-orm";
import { getCaps, type Caps } from "./settings";

export interface CapacityStatus {
  available: boolean;
  /** The window that blocked the request, if any. */
  blockedBy: "daily" | "weekly" | "monthly" | null;
  counts: { daily: number; weekly: number; monthly: number };
  caps: Caps;
  /** Slots left in the tightest configured window; null when all caps are unlimited. */
  remaining: number | null;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Monday-based week start. */
function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}

function startOfMonth(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

/**
 * A donation only consumes a slot once it is actually paid for —
 * abandoned `pending_payment` rows and cancellations must not eat capacity.
 */
async function countSince(since: Date): Promise<number> {
  const rows = await db
    .select({ id: donations.id })
    .from(donations)
    .where(
      and(
        gte(donations.createdAt, since.toISOString()),
        ne(donations.status, "pending_payment"),
        ne(donations.status, "cancelled"),
      ),
    );
  return rows.length;
}

export async function checkCapacity(now: Date = new Date()): Promise<CapacityStatus> {
  const caps = await getCaps();

  const [daily, weekly, monthly] = await Promise.all([
    caps.daily > 0 ? countSince(startOfDay(now)) : Promise.resolve(0),
    caps.weekly > 0 ? countSince(startOfWeek(now)) : Promise.resolve(0),
    caps.monthly > 0 ? countSince(startOfMonth(now)) : Promise.resolve(0),
  ]);

  const counts = { daily, weekly, monthly };

  let blockedBy: CapacityStatus["blockedBy"] = null;
  if (caps.daily > 0 && daily >= caps.daily) blockedBy = "daily";
  else if (caps.weekly > 0 && weekly >= caps.weekly) blockedBy = "weekly";
  else if (caps.monthly > 0 && monthly >= caps.monthly) blockedBy = "monthly";

  const remainders: number[] = [];
  if (caps.daily > 0) remainders.push(caps.daily - daily);
  if (caps.weekly > 0) remainders.push(caps.weekly - weekly);
  if (caps.monthly > 0) remainders.push(caps.monthly - monthly);

  return {
    available: blockedBy === null,
    blockedBy,
    counts,
    caps,
    remaining: remainders.length > 0 ? Math.max(0, Math.min(...remainders)) : null,
  };
}
