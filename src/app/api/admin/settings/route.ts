import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-guard";
import {
  getSiteConfig,
  setBags,
  setGenres,
  setCaps,
  setContent,
  DEFAULT_CONTENT,
  DEFAULT_CAPS,
  type Bag,
  type Caps,
  type SiteContent,
  type Genre,
} from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getSiteConfig());
}

function sanitizeBags(input: unknown): Bag[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  const positive = (v: unknown, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  const seen = new Set<string>();
  const out: Bag[] = [];
  for (const raw of input) {
    const b = (raw || {}) as Partial<Bag>;
    const id = String(b.id || "").trim().slice(0, 40);
    const pricePaise = Number(b.pricePaise);
    // Bookings reference bags by id, so ids must be present and unique
    if (!id || seen.has(id) || !Number.isFinite(pricePaise) || pricePaise < 0) return null;
    seen.add(id);
    const packed = Array.isArray(b.packedCm) ? b.packedCm : [];
    out.push({
      id,
      label: String(b.label || id).slice(0, 60),
      hint: String(b.hint || "").slice(0, 120),
      widthCm: positive(b.widthCm, 35),
      lengthCm: positive(b.lengthCm, 50),
      approxBooks: Math.round(positive(b.approxBooks, 10)),
      maxKg: positive(b.maxKg, 5),
      pricePaise: Math.round(pricePaise),
      packedCm: [positive(packed[0], 40), positive(packed[1], 30), positive(packed[2], 20)],
      tareGrams: Math.round(positive(b.tareGrams, 220)),
    });
  }
  return out;
}

function sanitizeGenres(input: unknown): Genre[] | null {
  if (!Array.isArray(input)) return null;
  const out: Genre[] = [];
  for (const raw of input) {
    const g = raw as Partial<Genre>;
    const id = String(g.id || "").trim();
    if (!id) return null;
    out.push({ id: id.slice(0, 40), label: String(g.label || id).slice(0, 80) });
  }
  return out;
}

function sanitizeCaps(input: unknown): Caps {
  const c = (input || {}) as Partial<Record<keyof Caps, unknown>>;
  const num = (v: unknown, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
  };
  return {
    daily: num(c.daily, DEFAULT_CAPS.daily),
    weekly: num(c.weekly, DEFAULT_CAPS.weekly),
    monthly: num(c.monthly, DEFAULT_CAPS.monthly),
  };
}

function sanitizeContent(input: unknown): SiteContent {
  const c = (input || {}) as Partial<SiteContent>;
  const text = (v: unknown, fallback: string, max = 600) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : fallback;
  return {
    heroTitle: text(c.heroTitle, DEFAULT_CONTENT.heroTitle, 160),
    heroSubtitle: text(c.heroSubtitle, DEFAULT_CONTENT.heroSubtitle),
    pickupLine: text(c.pickupLine, DEFAULT_CONTENT.pickupLine, 160),
    impactTitle: text(c.impactTitle, DEFAULT_CONTENT.impactTitle, 120),
    impactBody: text(c.impactBody, DEFAULT_CONTENT.impactBody, 1200),
    getStartedTitle: text(c.getStartedTitle, DEFAULT_CONTENT.getStartedTitle, 120),
    clothesComingSoon: typeof c.clothesComingSoon === "boolean" ? c.clothesComingSoon : DEFAULT_CONTENT.clothesComingSoon,
    howItWorks: Array.isArray(c.howItWorks) && c.howItWorks.length > 0
      ? c.howItWorks.map((s) => String(s).slice(0, 300)).slice(0, 10)
      : DEFAULT_CONTENT.howItWorks,
    nextStepTitle: text(c.nextStepTitle, DEFAULT_CONTENT.nextStepTitle, 120),
    nextStepBody: text(c.nextStepBody, DEFAULT_CONTENT.nextStepBody, 1200),
    whatsappNumber: typeof c.whatsappNumber === "string" ? c.whatsappNumber.replace(/[^\d+]/g, "").slice(0, 20) : "",
    leadPopupTitle: text(c.leadPopupTitle, DEFAULT_CONTENT.leadPopupTitle, 120),
    leadPopupBody: text(c.leadPopupBody, DEFAULT_CONTENT.leadPopupBody, 600),
    leadPopupDelaySeconds: Number.isFinite(Number(c.leadPopupDelaySeconds))
      ? Math.min(120, Math.max(0, Math.floor(Number(c.leadPopupDelaySeconds))))
      : DEFAULT_CONTENT.leadPopupDelaySeconds,
    capMessageTitle: text(c.capMessageTitle, DEFAULT_CONTENT.capMessageTitle, 160),
    capMessageBody: text(c.capMessageBody, DEFAULT_CONTENT.capMessageBody, 600),
  };
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (body.bags !== undefined) {
      const bags = sanitizeBags(body.bags);
      if (!bags) {
        return NextResponse.json(
          { error: "Every bag needs a price and a unique ID" },
          { status: 400 },
        );
      }
      await setBags(bags);
    }
    if (body.genres !== undefined) {
      const genres = sanitizeGenres(body.genres);
      if (!genres) {
        return NextResponse.json({ error: "Invalid genre configuration" }, { status: 400 });
      }
      await setGenres(genres);
    }
    if (body.caps !== undefined) await setCaps(sanitizeCaps(body.caps));
    if (body.content !== undefined) await setContent(sanitizeContent(body.content));

    return NextResponse.json({ success: true, ...(await getSiteConfig()) });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
