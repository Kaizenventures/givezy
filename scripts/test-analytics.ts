/**
 * Visitor counting, against a real database.
 *
 *   DATABASE_URL=file:/tmp/a.db npx tsx scripts/test-analytics.ts
 *
 * The things worth checking are the ones that would quietly produce flattering
 * numbers: a refresh counting as a new person, a booking reference ending up
 * in the stats table, the admin panel counting its own traffic.
 */
import { db } from "../src/lib/db";
import { pageStats, visitorDays, referrerStats, dayStats } from "../src/lib/schema";
import { eq, and } from "drizzle-orm";
import {
  recordVisit,
  getAnalytics,
  normalisePath,
  referrerSource,
  istDay,
} from "../src/lib/analytics";

let failures = 0;
function check(what: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(
    `${ok ? "  ok  " : " FAIL "} ${what}${ok ? "" : `\n         expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`}`,
  );
}

const visit = (path: string, ip: string, ua = "Mozilla/5.0", referrer: string | null = null) =>
  recordVisit({ path, ip, userAgent: ua, referrer, selfHost: "givezy.in" });

async function statFor(path: string) {
  const [row] = await db
    .select()
    .from(pageStats)
    .where(and(eq(pageStats.day, istDay()), eq(pageStats.path, path)))
    .limit(1);
  return row ?? null;
}

async function main() {
  // These assertions are absolute counts, so the tables have to start empty.
  // Without this the suite passes once and then fails on every re-run against
  // the same database, which reads like a regression and is not one.
  await db.delete(pageStats);
  await db.delete(referrerStats);
  await db.delete(visitorDays);
  await db.delete(dayStats);

  console.log("\nPath handling");
  check("plain path", normalisePath("/donate"), "/donate");
  check("trailing slash collapsed", normalisePath("/donate/"), "/donate");
  check("query dropped", normalisePath("/donate?category=books"), "/donate");
  // A booking reference in a URL is personal data and must not reach the table.
  check(
    "booking reference stripped",
    normalisePath("/donate/success?id=7f1e4a21-db9b-4653-bec2-2d865eac9388"),
    "/donate/success",
  );
  check("admin not tracked", normalisePath("/admin/payments"), null);
  check("api not tracked", normalisePath("/api/track"), null);
  check("absurd path rejected", normalisePath("/" + "x".repeat(200)), null);

  console.log("\nReferrers");
  check("instagram", referrerSource("https://l.instagram.com/?u=x", "givezy.in"), "instagram");
  check("google", referrerSource("https://www.google.com/search?q=books", "givezy.in"), "google");
  check("our own site is direct", referrerSource("https://givezy.in/donate", "givezy.in"), "direct");
  check("no referrer is direct", referrerSource(null, "givezy.in"), "direct");
  check("rubbish is direct", referrerSource("not-a-url", "givezy.in"), "direct");
  // Only the host, never the search terms that came with it.
  check("search terms not kept", referrerSource("https://bing.com/?q=secret", "givezy.in"), "bing");

  console.log("\nCounting");
  check("a visit is recorded", await visit("/", "1.1.1.1"), true);
  let home = await statFor("/");
  check("one view", home?.views, 1);
  check("one visitor", home?.visitors, 1);

  // The flattering bug: someone refreshing should not become five people.
  for (let i = 0; i < 4; i++) await visit("/", "1.1.1.1");
  home = await statFor("/");
  check("refreshes add views", home?.views, 5);
  check("but not visitors", home?.visitors, 1);

  // Same person, same day, different browser: a different device is a
  // different visitor, which is the best a cookieless count can do.
  await visit("/", "1.1.1.1", "Safari/17");
  home = await statFor("/");
  check("a second device counts once more", home?.visitors, 2);

  // A different person entirely.
  await visit("/", "2.2.2.2");
  home = await statFor("/");
  check("a new address is a new visitor", home?.visitors, 3);

  console.log("\nSeparate pages — the funnel depends on this");
  await visit("/donate", "1.1.1.1");
  const donate = await statFor("/donate");
  check("recorded against its own path", donate?.views, 1);
  // The bug this replaced: deduplicating only by day meant someone who read
  // the homepage first counted as zero visitors to /donate, so every funnel
  // step below the entry page read zero.
  check("someone who came via the homepage still counts here", donate?.visitors, 1);

  // But they are still one person as far as the site total goes.
  const today = await db.select().from(dayStats).where(eq(dayStats.day, istDay()));
  check("site visitors counts them once", today[0]?.visitors, 3);
  check("site views counts every page", today[0]?.views, 8);

  console.log("\nAdmin traffic is ignored");
  check("not recorded", await visit("/admin/donations", "3.3.3.3"), false);
  const rows = await db.select().from(pageStats).where(eq(pageStats.path, "/admin/donations"));
  check("nothing written", rows.length, 0);

  console.log("\nNothing identifying is stored");
  const stored = await db.select().from(visitorDays);
  const ips = stored.filter((r) => /\d+\.\d+\.\d+\.\d+/.test(r.hash));
  check("no address appears in any hash", ips.length, 0);
  check("hashes are fixed length", [...new Set(stored.map((r) => r.hash.length))], [32]);
  const columns = Object.keys(stored[0] ?? {});
  check("only a day, a hash and a path are kept", columns.sort(), ["day", "hash", "path"]);

  console.log("\nReferrer attribution");
  await visit("/", "9.9.9.9", "Mozilla/5.0", "https://l.instagram.com/?u=givezy.in");
  const refs = await db
    .select()
    .from(referrerStats)
    .where(and(eq(referrerStats.day, istDay()), eq(referrerStats.source, "instagram")));
  check("instagram credited", refs[0]?.views, 1);

  console.log("\nThe admin summary");
  const summary = await getAnalytics(30);
  check("totals add up", summary.totals.views, 9);
  check("visitors are people, not pageviews", summary.totals.visitors, 4);
  check("homepage is the top page", summary.topPages[0]?.path, "/");
  check("today is the last point", summary.daily.at(-1)?.day, istDay());
  check("window is 30 days", summary.daily.length, 30);

  console.log(
    failures === 0 ? "\nAll analytics checks passed.\n" : `\n${failures} check(s) FAILED.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
