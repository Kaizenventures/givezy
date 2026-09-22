import { db } from "./db";
import { settings } from "./schema";
import { inArray } from "drizzle-orm";

/**
 * A physical de-clutter bag. Donors choose a bag, not a weight: the bag is what
 * gets posted to them, what they fill, and what the courier collects.
 */
export interface Bag {
  id: string;
  label: string;
  hint: string;
  widthCm: number; // flat size of the sack
  lengthCm: number;
  approxBooks: number; // shown to donors — most people judge count better than kilos
  maxKg: number; // the packing limit donors are told
  pricePaise: number;
  // Courier-facing: how the filled bag measures and what the empty sack weighs
  packedCm: [number, number, number]; // length, breadth, height
  tareGrams: number;
}

export interface Genre {
  id: string;
  label: string;
}

/** Where we collect from, and how far out. */
export interface ServiceArea {
  enabled: boolean;
  centreLat: number;
  centreLng: number;
  radiusKm: number;
}

export interface Caps {
  daily: number; // 0 = unlimited
  weekly: number;
  monthly: number;
}

export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  pickupLine: string;
  impactTitle: string;
  impactBody: string;
  getStartedTitle: string;
  clothesComingSoon: boolean;
  howItWorks: string[];
  nextStepTitle: string;
  nextStepBody: string;
  whatsappNumber: string;
  leadPopupTitle: string;
  leadPopupBody: string;
  leadPopupDelaySeconds: number;
  capMessageTitle: string;
  capMessageBody: string;
}

/*
 * Sizes are the three sacks the team is sourcing (flat, stitched kraft paper).
 * Capacities are estimates for books in a pillow-filled sack and should be
 * confirmed by filling one of each and weighing it. Books are dense enough
 * that their real weight exceeds courier volumetric weight at every size, so
 * the courier bills on actual weight — which is why maxKg drives the price.
 * Prices are placeholders until confirmed against real Shiprocket quotes.
 */
export const DEFAULT_BAGS: Bag[] = [
  {
    id: "bag-5kg",
    label: "Givezy bag",
    hint: "About a shelf's worth",
    widthCm: 35,
    lengthCm: 50,
    approxBooks: 10,
    maxKg: 5,
    pricePaise: 49900,
    packedCm: [42, 32, 18],
    tareGrams: 220,
  },
];

/** What the courier should be told the packed bag weighs: the limit plus the sack. */
export function shippingGrams(bag: Bag): number {
  return Math.round(bag.maxKg * 1000 + bag.tareGrams);
}

// Donations booked before bags existed still reference the old weight bands
const LEGACY_LABELS: Record<string, string> = {
  "upto-5kg": "Up to 5 kg (pre-bag)",
  "5-10kg": "5–10 kg (pre-bag)",
  "10-15kg": "10–15 kg (pre-bag)",
  "bag-small": "Small bag (retired)",
  "bag-medium": "Medium bag (retired)",
  "bag-large": "Large bag (retired)",
};

export function bagLabel(bags: Bag[], id: string): string {
  const bag = bags.find((b) => b.id === id);
  if (bag) return `${bag.label} (${bag.widthCm}×${bag.lengthCm} cm)`;
  return LEGACY_LABELS[id] ?? id;
}

export const DEFAULT_GENRES: Genre[] = [
  { id: "textbooks", label: "School / College textbooks" },
  { id: "exam_prep", label: "Competitive exam prep (UPSC, JEE, NEET)" },
  { id: "fiction", label: "Fiction & literature" },
  { id: "children", label: "Children's storybooks" },
  { id: "other", label: "Something else" },
];

// Off until someone actually draws the area in Settings: silently refusing
// customers because of an unconfigured default would be worse than accepting all.
export const DEFAULT_SERVICE_AREA: ServiceArea = {
  enabled: false,
  centreLat: 17.385,
  centreLng: 78.4867,
  radiusKm: 25,
};

export const DEFAULT_CAPS: Caps = { daily: 0, weekly: 0, monthly: 0 };

export const DEFAULT_CONTENT: SiteContent = {
  heroTitle: "Your clutter is someone's treasure.",
  heroSubtitle:
    "Books gathering dust on your shelf don't have to end up in the bin. Tell us what you have — we collect from your door and make sure they're reused or recycled.",
  pickupLine: "We pick them up from your doorstep.",
  impactTitle: "That textbook gathering dust on your shelf?",
  impactBody: [
    "Most books that leave a house go out with the general rubbish, mixed in with everything else, where nothing can be recovered from them.",
    "We sort every bag we collect. Books still fit to read are directed towards reuse, and the rest towards paper recycling.",
    "You get your shelf back, and they get a second life instead of a bin.",
  ].join("\n\n"),
  getStartedTitle: "Get started",
  clothesComingSoon: true,
  howItWorks: [
    "Fill in a quick form and snap a picture of your books.",
    "Pay for the pickup.",
    "We post you a Givezy bag.",
    "Fill it with up to 5 kg of books.",
    "Message us on WhatsApp and the courier collects it.",
  ],
  nextStepTitle: "The Next Step",
  nextStepBody:
    "You will now receive a de-clutter bag from Givezy. Once you receive it, pack it up to the weight you selected. Once done, please ping us on WhatsApp for the pickup.",
  whatsappNumber: "",
  leadPopupTitle: "Not ready to give yet?",
  leadPopupBody:
    "Leave your details and we'll remind you when we're picking up in your area.",
  leadPopupDelaySeconds: 7,
  // Reaching the cap is good news — say so, rather than turning people away flat.
  capMessageTitle: "So many books given today that we're full!",
  capMessageBody:
    "Hyderabad has been generous today and every pickup slot is taken. Leave your details and you'll go straight to the front of tomorrow's queue — no payment needed now.",
};

// A new key on purpose — pricing saved under the old weight-band keys is ignored
const KEY_BAGS = "pricing.bags";
const KEY_GENRES = "genres";
const KEY_CAPS = "caps";
const KEY_SERVICE_AREA = "serviceArea";
const KEY_CONTENT = "content";

async function readMany(keys: string[]): Promise<Record<string, unknown>> {
  try {
    const rows = await db.select().from(settings).where(inArray(settings.key, keys));
    const out: Record<string, unknown> = {};
    for (const row of rows) {
      try {
        out[row.key] = JSON.parse(row.value);
      } catch {
        // ignore malformed rows and fall back to defaults
      }
    }
    return out;
  } catch {
    // settings table may not exist yet (pre-migration) — fall back to defaults
    return {};
  }
}

export async function writeSetting(key: string, value: unknown): Promise<void> {
  const encoded = JSON.stringify(value);
  await db
    .insert(settings)
    .values({ key, value: encoded, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: encoded, updatedAt: new Date().toISOString() },
    });
}

export async function getBags(): Promise<Bag[]> {
  const found = (await readMany([KEY_BAGS]))[KEY_BAGS];
  if (!Array.isArray(found) || found.length === 0) return DEFAULT_BAGS;
  return found as Bag[];
}

export async function getGenres(): Promise<Genre[]> {
  const found = (await readMany([KEY_GENRES]))[KEY_GENRES];
  if (!Array.isArray(found) || found.length === 0) return DEFAULT_GENRES;
  return found as Genre[];
}

export async function getServiceArea(): Promise<ServiceArea> {
  const found = (await readMany([KEY_SERVICE_AREA]))[KEY_SERVICE_AREA];
  return { ...DEFAULT_SERVICE_AREA, ...(found as Partial<ServiceArea> | undefined) };
}

export async function setServiceArea(v: ServiceArea) {
  return writeSetting(KEY_SERVICE_AREA, v);
}

export async function getCaps(): Promise<Caps> {
  const found = (await readMany([KEY_CAPS]))[KEY_CAPS];
  return { ...DEFAULT_CAPS, ...(found as Partial<Caps> | undefined) };
}

export async function getContent(): Promise<SiteContent> {
  const found = (await readMany([KEY_CONTENT]))[KEY_CONTENT];
  return { ...DEFAULT_CONTENT, ...(found as Partial<SiteContent> | undefined) };
}

export async function getSiteConfig() {
  const [bags, genres, caps, content, serviceArea] = await Promise.all([
    getBags(),
    getGenres(),
    getCaps(),
    getContent(),
    getServiceArea(),
  ]);
  return { bags, genres, caps, content, serviceArea };
}

export async function setBags(v: Bag[]) {
  return writeSetting(KEY_BAGS, v);
}
export async function setGenres(v: Genre[]) {
  return writeSetting(KEY_GENRES, v);
}
export async function setCaps(v: Caps) {
  return writeSetting(KEY_CAPS, v);
}
export async function setContent(v: SiteContent) {
  return writeSetting(KEY_CONTENT, v);
}

export function findBag(bags: Bag[], id: string): Bag | undefined {
  return bags.find((b) => b.id === id);
}
