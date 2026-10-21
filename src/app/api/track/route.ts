import { NextRequest, NextResponse } from "next/server";
import { recordVisit } from "@/lib/analytics";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/track
 *
 * Records one pageview. Called from the browser rather than from the render
 * path for two reasons: a page never waits on a database write to be served,
 * and crawlers — which mostly do not run JavaScript — filter themselves out
 * instead of inflating the numbers.
 *
 * Nothing identifying is stored. See src/lib/analytics.ts.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  // Generous, because a real person browsing the site will trip a tight limit.
  // This exists to stop someone scripting the counter upwards, not to police
  // ordinary reading.
  const limited = rateLimit(`track:${ip}`, 120, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.path !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const userAgent = req.headers.get("user-agent") || "";
  // Cheap bot filter for the crawlers that do execute JavaScript.
  if (/bot|crawler|spider|crawling|headless|lighthouse|preview/i.test(userAgent)) {
    return NextResponse.json({ ok: true, ignored: "bot" });
  }

  try {
    const recorded = await recordVisit({
      path: body.path,
      referrer: typeof body.referrer === "string" ? body.referrer.slice(0, 500) : null,
      ip,
      userAgent,
      selfHost: req.nextUrl.hostname,
    });
    return NextResponse.json({ ok: recorded });
  } catch (err) {
    // Analytics must never be the reason a visitor sees an error, and the
    // browser ignores this response anyway.
    console.error("[track] could not record visit", err);
    return NextResponse.json({ ok: false });
  }
}
