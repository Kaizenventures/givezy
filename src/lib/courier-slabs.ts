// Type-only import, so this module stays free of the database and can be used
// from the Settings form in the browser as well as on the server.
import type { Bag } from "./settings";

/**
 * Couriers do not charge by the gram — they charge by slab. A 5.22 kg parcel
 * and a 10.00 kg parcel cost exactly the same, so the only weight that matters
 * is which slab the declared weight lands in.
 *
 * This cost us real money once: a 5 kg packing limit plus the 220 g sack
 * declares 5.22 kg, which falls into the 10 kg slab and paid ₹80 more per
 * pickup than it needed to, for no extra books. The fix was one number, but the
 * mistake was invisible — nothing in the admin panel said which slab a bag
 * billed in. So it lives here, and Settings shows it while you type.
 *
 * Rates are indicative surface quotes for Hyderabad, October 2026. Re-check
 * them against a real quote before relying on the rupee figures; the slab
 * boundaries matter more than the prices and change far less often.
 */
export interface Slab {
  maxGrams: number;
  pricePaise: number;
}

export const COURIER_SLABS: Slab[] = [
  { maxGrams: 5000, pricePaise: 23100 },
  { maxGrams: 10000, pricePaise: 31100 },
  { maxGrams: 15000, pricePaise: 39100 },
  { maxGrams: 20000, pricePaise: 47100 },
];

export interface SlabFit {
  /** The slab this weight bills in, or null when it exceeds every known slab. */
  slab: Slab | null;
  /** Declared weight: packing limit plus the empty sack. */
  declaredGrams: number;
  /** Grams of room left before the next slab. */
  headroomGrams: number;
  /**
   * How much would be saved by trimming the packing limit to fit the slab
   * below, and what limit that implies. Null when the bag already sits in the
   * cheapest slab its weight allows.
   */
  waste: { savingPaise: number; suggestedMaxKg: number } | null;
}

function slabFor(grams: number): Slab | null {
  return COURIER_SLABS.find((s) => grams <= s.maxGrams) ?? null;
}

/**
 * Where a bag's declared weight lands, and whether it is paying for a slab it
 * barely uses. A bag "wastes" a slab when dropping the packing limit by a
 * plausible amount — less than a quarter of the slab's width — would move it
 * down a slab. Trimming 4.9 kg to 4.5 kg is worth flagging; trimming 9 kg to
 * 4.5 kg is a different bag, not a rounding error.
 */
export function slabFit(bag: Pick<Bag, "maxKg" | "tareGrams">): SlabFit {
  const declaredGrams = Math.round(bag.maxKg * 1000 + bag.tareGrams);
  const slab = slabFor(declaredGrams);

  if (!slab) {
    return { slab: null, declaredGrams, headroomGrams: 0, waste: null };
  }

  const index = COURIER_SLABS.indexOf(slab);
  const headroomGrams = slab.maxGrams - declaredGrams;
  const below = index > 0 ? COURIER_SLABS[index - 1] : null;

  let waste: SlabFit["waste"] = null;
  if (below) {
    const overshootGrams = declaredGrams - below.maxGrams;
    const slabWidth = slab.maxGrams - below.maxGrams;
    if (overshootGrams > 0 && overshootGrams < slabWidth / 4) {
      // Round down to the nearest half kilo so the suggestion is a number
      // someone would actually print on a website.
      const fittingKg = (below.maxGrams - bag.tareGrams) / 1000;
      waste = {
        savingPaise: slab.pricePaise - below.pricePaise,
        suggestedMaxKg: Math.floor(fittingKg * 2) / 2,
      };
    }
  }

  return { slab, declaredGrams, headroomGrams, waste };
}
