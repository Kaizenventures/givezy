import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Bag } from "@/lib/settings";

/**
 * The price, stated once and plainly.
 *
 * The figures come from the bag in Settings rather than the markup, so raising
 * the price is still one field in the admin panel and the homepage cannot go
 * stale behind it. The book count leads because it is the number someone can
 * actually picture; the weight is the fine print it belongs in.
 */
export default function PricingBlock({ bag }: { bag: Bag | null }) {
  if (!bag) return null;

  const rupees = Math.round(bag.pricePaise / 100);

  return (
    <section id="pricing" className="px-4 py-20 bg-cream">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-brand uppercase tracking-wider mb-2">
            Simple pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-balance">
            One simple fee. A lighter home.
          </h2>
        </div>

        <div className="rounded-3xl border border-brand/15 bg-white p-8 md:p-12 shadow-sm">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="flex items-baseline gap-2">
                <span className="text-6xl md:text-7xl font-extrabold tracking-tight text-gray-900">
                  ₹{rupees}
                </span>
              </p>
              <p className="mt-2 text-lg text-gray-700 font-medium">
                for about {bag.approxBooks} books
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Up to {bag.maxKg} kg · {bag.widthCm} × {bag.lengthCm} cm bag · doorstep collection
                included
              </p>

              <Link
                href="/donate"
                className="mt-7 inline-flex items-center justify-center gap-2 bg-brand text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-brand-dark transition-colors"
              >
                Book my pickup
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="md:border-l md:border-gray-100 md:pl-10">
              <h3 className="font-semibold text-gray-900 mb-3">What you&apos;re paying for</h3>
              <ul className="space-y-2.5 text-sm text-gray-600 leading-relaxed">
                {[
                  "A kraft bag posted to your door",
                  "Doorstep collection by courier",
                  "Sorting every book by hand once it reaches us",
                  "The logistics of finding each book a next destination",
                ].map((line) => (
                  <li key={line} className="flex gap-2.5">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs text-gray-400 leading-relaxed">
                This is a decluttering service, not a donation — your receipt says so and it
                isn&apos;t valid for tax exemption.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
