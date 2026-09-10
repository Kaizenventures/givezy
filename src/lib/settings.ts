import { db } from "./db";
import { settings } from "./schema";
import { inArray } from "drizzle-orm";

export interface WeightBucket {
  id: string;
  label: string;
  hint: string;
  maxKg: number;
  pricePaise: number;
  grams: number; // representative weight used for Shiprocket calls
}

export interface Genre {
  id: string;
  label: string;
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

export const DEFAULT_BUCKETS: WeightBucket[] = [
  { id: "upto-5kg", label: "Up to 5 kg", hint: "A small stack of books", maxKg: 5, pricePaise: 19900, grams: 4000 },
  { id: "5-10kg", label: "5 – 10 kg", hint: "A medium box", maxKg: 10, pricePaise: 29900, grams: 8000 },
  { id: "10-15kg", label: "10 – 15 kg", hint: "A large box", maxKg: 15, pricePaise: 39900, grams: 13000 },
];

/**
 * Book-count sizing. Most people can estimate "about 30 books" far more
 * accurately than "about 8 kg", so both scales map onto the same priced bucket.
 */
export const DEFAULT_COUNT_BUCKETS: WeightBucket[] = [
  { id: "upto-5kg", label: "5 – 15 books", hint: "A small stack", maxKg: 5, pricePaise: 19900, grams: 4000 },
  { id: "5-10kg", label: "15 – 30 books", hint: "A full shelf", maxKg: 10, pricePaise: 29900, grams: 8000 },
  { id: "10-15kg", label: "30+ books", hint: "A big clear-out", maxKg: 15, pricePaise: 39900, grams: 13000 },
];

export const DEFAULT_GENRES: Genre[] = [
  { id: "textbooks", label: "School / College textbooks" },
  { id: "exam_prep", label: "Competitive exam prep (UPSC, JEE, NEET)" },
  { id: "fiction", label: "Fiction & literature" },
  { id: "children", label: "Children's storybooks" },
  { id: "other", label: "Something else" },
];

export const DEFAULT_CAPS: Caps = { daily: 0, weekly: 0, monthly: 0 };

export const DEFAULT_CONTENT: SiteContent = {
  heroTitle: "Your clutter is someone's treasure.",
  heroSubtitle:
    "Books gathering dust on your shelf can restart someone's education. Tell us what you have — we handle the rest.",
  pickupLine: "We pick them up from your doorstep.",
  impactTitle: "That textbook gathering dust on your shelf?",
  impactBody: [
    "It could be the reason a child in Old City learns to read this year. In Hyderabad alone, thousands of families can't afford school supplies — but they have the hunger to learn.",
    "Every bag you send is sorted, checked and passed on to schools, libraries and community centres that need it most. Nothing goes to landfill.",
    "Your clutter is someone's comfort. Your old is someone's new beginning.",
  ].join("\n\n"),
  getStartedTitle: "Get started",
  clothesComingSoon: true,
  howItWorks: [
    "Fill in a quick form — pick a category and snap a picture.",
    "Estimate the total weight and select your bag size.",
    "Pay for the pickup.",
    "We send you a de-clutter bag.",
    "You pack it and send the bag back to us.",
  ],
  nextStepTitle: "The Next Step",
  nextStepBody:
    "You will now receive a de-clutter bag from Givezy. Once you receive it, pack it up to the weight you selected. Once done, please ping us on WhatsApp for the pickup.",
  whatsappNumber: "",
  leadPopupTitle: "Not ready to donate yet?",
  leadPopupBody:
    "Leave your details and we'll remind you when we're picking up in your area.",
  leadPopupDelaySeconds: 7,
  // Reaching the cap is good news — say so, rather than turning people away flat.
  capMessageTitle: "So many donations today that we're full!",
  capMessageBody:
    "Hyderabad has been generous today and every pickup slot is taken. Leave your details and you'll go straight to the front of tomorrow's queue — no payment needed now.",
};

const KEY_BUCKETS = "pricing.buckets";
const KEY_COUNT_BUCKETS = "pricing.countBuckets";
const KEY_GENRES = "genres";
const KEY_CAPS = "caps";
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

export async function getBuckets(): Promise<WeightBucket[]> {
  const found = (await readMany([KEY_BUCKETS]))[KEY_BUCKETS];
  if (!Array.isArray(found) || found.length === 0) return DEFAULT_BUCKETS;
  return found as WeightBucket[];
}

export async function getCountBuckets(): Promise<WeightBucket[]> {
  const found = (await readMany([KEY_COUNT_BUCKETS]))[KEY_COUNT_BUCKETS];
  if (!Array.isArray(found) || found.length === 0) return DEFAULT_COUNT_BUCKETS;
  return found as WeightBucket[];
}

export async function getGenres(): Promise<Genre[]> {
  const found = (await readMany([KEY_GENRES]))[KEY_GENRES];
  if (!Array.isArray(found) || found.length === 0) return DEFAULT_GENRES;
  return found as Genre[];
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
  const [buckets, countBuckets, genres, caps, content] = await Promise.all([
    getBuckets(),
    getCountBuckets(),
    getGenres(),
    getCaps(),
    getContent(),
  ]);
  return { buckets, countBuckets, genres, caps, content };
}

export async function setBuckets(v: WeightBucket[]) {
  return writeSetting(KEY_BUCKETS, v);
}
export async function setCountBuckets(v: WeightBucket[]) {
  return writeSetting(KEY_COUNT_BUCKETS, v);
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

export function findBucket(buckets: WeightBucket[], id: string): WeightBucket | undefined {
  return buckets.find((b) => b.id === id);
}
