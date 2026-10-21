import type { Faq } from "@/lib/settings";

/**
 * Built on <details>/<summary> rather than React state: it opens and closes
 * with no JavaScript, is keyboard-navigable and screen-reader-friendly for
 * free, and its content is in the HTML for search engines to read.
 */
export default function Faqs({ faqs }: { faqs: Faq[] }) {
  if (!faqs || faqs.length === 0) return null;

  return (
    <section id="faq" className="px-4 py-20 bg-cream">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-10 text-balance">
          Questions people ask
        </h2>

        <div className="divide-y divide-gray-200 border-y border-gray-200">
          {faqs.map((faq) => (
            <details key={faq.q} className="group py-5">
              <summary className="flex items-start justify-between gap-4 cursor-pointer list-none font-semibold text-gray-900 marker:content-none">
                <span>{faq.q}</span>
                <span
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-45"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-gray-600 leading-relaxed pr-8">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
