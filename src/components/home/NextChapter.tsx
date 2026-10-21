import { Sparkles, Recycle } from "lucide-react";

/**
 * Reuse first, recycling second — the thing that makes Givezy better than a bin.
 *
 * Every claim here is conditional on purpose. There are no named reuse partners
 * yet, so this says what we do with a book, not where it ends up. "Where they
 * are available" and "wherever feasible" are doing real work: the moment either
 * becomes a promise, it is a promise nobody can keep.
 */
export default function NextChapter({ title, body }: { title: string; body: string }) {
  const paragraphs = body.split("\n\n").filter(Boolean);

  return (
    <section id="what-happens" className="px-4 py-20 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mb-12">
          <p className="text-sm font-semibold text-brand uppercase tracking-wider mb-2">
            What happens next
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-balance">{title}</h2>
          {paragraphs.map((p) => (
            <p key={p} className="mt-4 text-gray-600 leading-relaxed">
              {p}
            </p>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <article className="rounded-2xl border-2 border-brand/15 bg-brand/5 p-7">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-brand/10 mb-4">
              <Sparkles className="w-5 h-5 text-brand" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold text-brand uppercase tracking-wider">
              First choice
            </p>
            <h3 className="mt-1 text-xl font-bold text-gray-900">Still fit to read</h3>
            <p className="mt-2 text-gray-600 leading-relaxed">
              Books in good condition are directed towards reuse — community organisations and
              other partners, where they are available and have room for them.
            </p>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-gray-50/60 p-7">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gray-200/70 mb-4">
              <Recycle className="w-5 h-5 text-gray-600" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              When reuse isn&apos;t possible
            </p>
            <h3 className="mt-1 text-xl font-bold text-gray-900">Beyond reading</h3>
            <p className="mt-2 text-gray-600 leading-relaxed">
              Books too damaged to be read again go towards paper recycling wherever feasible,
              rather than out with the general rubbish where nothing can be recovered.
            </p>
          </article>
        </div>

        <p className="mt-6 text-sm text-gray-400 max-w-2xl leading-relaxed">
          Where a particular book ends up depends on its condition and on which partners have
          capacity at the time. We&apos;d rather say that than promise every book finds a reader.
        </p>
      </div>
    </section>
  );
}
