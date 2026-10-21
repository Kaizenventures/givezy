import crypto from "crypto";
import { db } from "./db";
import { pageStats, referrerStats, visitorDays, dayStats } from "./schema";
import { and, eq, gte, lt, sql } from "drizzle-orm";

/**
 * Visitor counting, kept deliberately small.
 *
 * No cookies, no third party, no identifier that survives the day. A visitor
 * is a one-way hash of IP + user agent + the date + a server secret, used only
 * to stop one person refreshing five times reading as five people. The salt
 * changes daily, so the same person hashes differently tomorrow, and the rows
 * are deleted once the day has rolled over.
 *
 * Totals are rolled up per day rather than logged per hit — see schema.ts for
 * why that matters on a 10 GB disk.
 */

/** Today in IST, which is the clock the rest of the app counts days by. */
export function istDay(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/*
 * NEXTAUTH_SECRET is already required for the app to boot, so reusing it means
 * there is no new secret to configure or forget. It never leaves the server
 * and only ever appears inside a hash.
 */
const SALT = process.env.NEXTAUTH_SECRET || "givezy-analytics";

function visitorHash(ip: string, userAgent: string, day: string): string {
  return crypto
    .createHash("sha256")
    .update(`${ip}|${userAgent}|${day}|${SALT}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Where a visit came from, reduced to a bare source name.
 *
 * Only the host is kept — never the full referring URL, which can carry search
 * terms and other things we have no business storing.
 */
export function referrerSource(referrer: string | null, selfHost: string): string {
  if (!referrer) return "direct";
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "direct";
  }
  if (!host || host === selfHost.replace(/^www\./, "")) return "direct";

  const known: Record<string, string> = {
    "instagram.com": "instagram",
    "l.instagram.com": "instagram",
    "facebook.com": "facebook",
    "l.facebook.com": "facebook",
    "google.com": "google",
    "google.co.in": "google",
    "bing.com": "bing",
    "duckduckgo.com": "duckduckgo",
    "t.co": "twitter",
    "x.com": "twitter",
    "linkedin.com": "linkedin",
    "web.whatsapp.com": "whatsapp",
    "wa.me": "whatsapp",
  };
  return known[host] ?? host.slice(0, 60);
}

/**
 * Paths are normalised before being stored so the table stays small and no
 * identifier ends up in it. A booking reference in a URL is personal data, and
 * thousands of distinct one-visit paths would defeat the point of a rollup.
 */
export function normalisePath(raw: string): string | null {
  let path: string;
  try {
    path = new URL(raw, "https://givezy.in").pathname;
  } catch {
    return null;
  }
  if (!path.startsWith("/")) return null;
  if (path.length > 1) path = path.replace(/\/+$/, "");

  // Never record the admin panel — it is our own traffic, not visitors'.
  if (path.startsWith("/admin") || path.startsWith("/api")) return null;

  // Collapse anything carrying an id. /donate/success?id=… is the thank-you
  // page for one specific booking.
  if (/^\/donate\/success/.test(path)) return "/donate/success";
  if (path.length > 80) return null;

  return path;
}

export interface RecordVisitInput {
  path: string;
  referrer: string | null;
  ip: string;
  userAgent: string;
  selfHost: string;
}

/** Returns false when the hit was not something worth counting. */
export async function recordVisit(input: RecordVisitInput): Promise<boolean> {
  const path = normalisePath(input.path);
  if (!path) return false;

  const day = istDay();
  const hash = visitorHash(input.ip, input.userAgent, day);

  /*
   * Two different questions, so two different counts.
   *
   * "New to this page today" drives the funnel — someone who read the homepage
   * and then opened the form is a visitor to both. "New to the site today"
   * drives the headline figure, where that same person must count once.
   *
   * onConflictDoNothing answers each in a single statement, so two
   * simultaneous requests cannot both decide they are the first.
   */
  const newToPage = await db
    .insert(visitorDays)
    .values({ day, hash, path })
    .onConflictDoNothing()
    .returning({ hash: visitorDays.hash });
  const isNewToPage = newToPage.length > 0;

  let isNewToSite = false;
  if (isNewToPage) {
    const seenElsewhere = await db
      .select({ hash: visitorDays.hash })
      .from(visitorDays)
      .where(and(eq(visitorDays.day, day), eq(visitorDays.hash, hash)))
      .limit(2);
    // Only the row we just wrote: this is their first page of the day.
    isNewToSite = seenElsewhere.length <= 1;
  }

  await db
    .insert(pageStats)
    .values({ day, path, views: 1, visitors: isNewToPage ? 1 : 0 })
    .onConflictDoUpdate({
      target: [pageStats.day, pageStats.path],
      set: {
        views: sql`${pageStats.views} + 1`,
        visitors: sql`${pageStats.visitors} + ${isNewToPage ? 1 : 0}`,
      },
    });

  await db
    .insert(dayStats)
    .values({ day, views: 1, visitors: isNewToSite ? 1 : 0 })
    .onConflictDoUpdate({
      target: dayStats.day,
      set: {
        views: sql`${dayStats.views} + 1`,
        visitors: sql`${dayStats.visitors} + ${isNewToSite ? 1 : 0}`,
      },
    });

  // Attribute the arrival, not every page they then read.
  if (isNewToSite) {
    const source = referrerSource(input.referrer, input.selfHost);
    await db
      .insert(referrerStats)
      .values({ day, source, views: 1 })
      .onConflictDoUpdate({
        target: [referrerStats.day, referrerStats.source],
        set: { views: sql`${referrerStats.views} + 1` },
      });
  }

  await pruneVisitors(day);
  return true;
}

/*
 * Yesterday's hashes are useless — the salt has changed, so they cannot
 * deduplicate anything any more — and keeping them would be retaining a
 * fingerprint for no reason. Pruning here rather than on a cron means it
 * cannot be forgotten, and the delete is a no-op on all but the first few
 * requests after midnight.
 */
let lastPrunedDay = "";
async function pruneVisitors(day: string) {
  if (lastPrunedDay === day) return;
  lastPrunedDay = day;
  try {
    await db.delete(visitorDays).where(lt(visitorDays.day, day));
  } catch (err) {
    console.error("[analytics] could not prune visitor hashes", err);
  }
}

export interface DailyPoint {
  day: string;
  views: number;
  visitors: number;
}

export interface AnalyticsSummary {
  daily: DailyPoint[];
  topPages: { path: string; views: number; visitors: number }[];
  referrers: { source: string; views: number }[];
  totals: { views: number; visitors: number };
}

/** Rolled-up figures for the last `days` days, newest last. */
export async function getAnalytics(days = 30): Promise<AnalyticsSummary> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  const from = istDay(since);

  const [pages, refs, days_] = await Promise.all([
    db.select().from(pageStats).where(gte(pageStats.day, from)),
    db.select().from(referrerStats).where(gte(referrerStats.day, from)),
    db.select().from(dayStats).where(gte(dayStats.day, from)),
  ]);

  const byDay = new Map<string, DailyPoint>();
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    byDay.set(istDay(d), { day: istDay(d), views: 0, visitors: 0 });
  }

  // Site totals come from day_stats, where a person is counted once however
  // many pages they read. Summing the per-page figures would inflate them.
  for (const row of days_) {
    const point = byDay.get(row.day);
    if (point) {
      point.views = row.views;
      point.visitors = row.visitors;
    }
  }

  const byPath = new Map<string, { path: string; views: number; visitors: number }>();
  for (const row of pages) {
    const p = byPath.get(row.path) ?? { path: row.path, views: 0, visitors: 0 };
    p.views += row.views;
    p.visitors += row.visitors;
    byPath.set(row.path, p);
  }

  const bySource = new Map<string, number>();
  for (const row of refs) bySource.set(row.source, (bySource.get(row.source) ?? 0) + row.views);

  const daily = [...byDay.values()];
  return {
    daily,
    topPages: [...byPath.values()].sort((a, b) => b.views - a.views).slice(0, 12),
    referrers: [...bySource.entries()]
      .map(([source, views]) => ({ source, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10),
    totals: {
      views: daily.reduce((n, d) => n + d.views, 0),
      visitors: daily.reduce((n, d) => n + d.visitors, 0),
    },
  };
}

/** Views of one path over the window, for the funnel. */
export async function viewsOf(path: string, days = 30): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  const rows = await db
    .select({ visitors: pageStats.visitors })
    .from(pageStats)
    .where(and(eq(pageStats.path, path), gte(pageStats.day, istDay(since))));
  return rows.reduce((n, r) => n + r.visitors, 0);
}
