"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Shirt, ArrowRight, Home, Hand, Repeat } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import TimelineSteps from "@/components/TimelineSteps";
import NextChapter from "@/components/home/NextChapter";
import PricingBlock from "@/components/home/PricingBlock";
import Faqs from "@/components/home/Faqs";
import HeroIllustration from "@/components/illustrations/HeroIllustration";
import LeadCapture from "@/components/LeadCapture";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/animations";
import type { SiteContent, Bag } from "@/lib/settings";

/*
 * The page answers one question per section, in the order someone actually
 * asks them: what is this → why should I care → how does it work → what
 * happens to my books → why does it cost that → can I trust you → how do I
 * start. Anything that doesn't answer one of those was cut.
 *
 * What was removed: a block of national statistics about out-of-school
 * children and childhood malnutrition. The numbers were real and sourced, but
 * they framed a paid convenience service as a charity appeal, and the
 * malnutrition figure had nothing to do with books.
 */

const BENEFITS = [
  {
    icon: Home,
    title: "Doorstep pickup",
    body: "No trips, no haggling with buyers, no working out where to donate.",
  },
  {
    icon: Hand,
    title: "Sorted by hand",
    body: "Every bag is opened and assessed when it reaches us — nothing is passed on blind.",
  },
  {
    icon: Repeat,
    title: "Reuse before recycling",
    body: "Books fit to read go towards reuse where partners are available. The rest go to paper recycling wherever feasible.",
  },
];

const CATEGORIES = [
  {
    name: "Books",
    slug: "books",
    icon: BookOpen,
    tone: "text-amber-700",
    bg: "bg-amber-50",
    description: "Books you've finished, outgrown, or simply no longer need.",
  },
  {
    name: "Clothes",
    slug: "clothes",
    icon: Shirt,
    tone: "text-emerald-700",
    bg: "bg-emerald-50",
    description: "Give your wardrobe some breathing room.",
  },
];

export default function HomeContent({
  content,
  bag,
}: {
  content: SiteContent;
  bag: Bag | null;
}) {
  const rupees = bag ? Math.round(bag.pricePaise / 100) : null;

  return (
    <>
      <LeadCapture
        title={content.leadPopupTitle}
        body={content.leadPopupBody}
        delaySeconds={content.leadPopupDelaySeconds}
      />

      {/* ── Hero: what is this ── */}
      <section className="relative overflow-hidden bg-[#FAF8F3] py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.p
                variants={fadeInUp}
                className="text-xs font-semibold tracking-[0.12em] uppercase text-emerald-700"
              >
                Books available now · Clothes coming soon
              </motion.p>

              <motion.h1
                variants={fadeInUp}
                className="mt-4 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.05] text-balance"
              >
                {content.heroTitle}
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="mt-5 text-lg text-gray-600 max-w-lg leading-relaxed"
              >
                {content.heroSubtitle}
              </motion.p>

              <motion.div variants={fadeInUp} className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/donate"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-emerald-800 transition-colors"
                >
                  {rupees ? `Declutter for ₹${rupees}` : "Book a pickup"}
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center border border-gray-300 text-gray-800 px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-white transition-colors"
                >
                  See how it works
                </a>
              </motion.div>

              {bag && (
                <motion.p variants={fadeInUp} className="mt-4 text-sm text-gray-500">
                  About {bag.approxBooks} books · up to {bag.maxKg} kg ·{" "}
                  {content.pickupLine.replace(/\.$/, "")}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="hidden md:block"
            >
              <HeroIllustration className="w-full h-auto max-w-md mx-auto" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Why should I care ── */}
      <section className="px-4 py-16 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {BENEFITS.map((b) => (
            <AnimatedSection key={b.title}>
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-50 mb-4">
                <b.icon className="w-5 h-5 text-emerald-700" aria-hidden="true" />
              </div>
              <h2 className="font-bold text-gray-900 text-lg">{b.title}</h2>
              <p className="mt-1.5 text-gray-600 leading-relaxed text-sm">{b.body}</p>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ── How does it work ── */}
      <div id="how-it-works">
        <TimelineSteps steps={content.howItWorks} />
      </div>

      {/* ── What happens to my books ── */}
      <NextChapter title={content.impactTitle} body={content.impactBody} />

      {/* ── Why does it cost that ── */}
      <PricingBlock bag={bag} />

      {/* ── What can I give ── */}
      <section className="px-4 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-balance">
              What you can give
            </h2>
            <p className="mt-2 text-gray-600">
              Starting with books. More categories are on the way.
            </p>
          </AnimatedSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
          >
            {CATEGORIES.map((cat) => {
              const comingSoon = cat.slug === "clothes" && content.clothesComingSoon;

              const inner = (
                <>
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${cat.bg} mb-5`}>
                    <cat.icon className={`w-6 h-6 ${cat.tone}`} aria-hidden="true" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-gray-900">{cat.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        comingSoon ? "bg-gray-100 text-gray-500" : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {comingSoon ? "Coming soon" : "Available now"}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-600 leading-relaxed">{cat.description}</p>
                  {!comingSoon && (
                    <span className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-emerald-700">
                      Declutter {cat.name.toLowerCase()}
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </span>
                  )}
                </>
              );

              return (
                <motion.div key={cat.slug} variants={scaleIn}>
                  {comingSoon ? (
                    <div className="block border border-gray-200 rounded-2xl p-7 bg-gray-50/50">
                      {inner}
                    </div>
                  ) : (
                    <Link
                      href={`/donate?category=${cat.slug}`}
                      className="group block border border-gray-200 rounded-2xl p-7 hover:border-emerald-300 hover:shadow-sm transition-all"
                    >
                      {inner}
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Can I trust you ── */}
      <Faqs faqs={content.faqs} />

      {/* ── How do I start ── */}
      <section className="px-4 py-20 bg-emerald-800">
        <AnimatedSection className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight text-balance">
            Ready for a little more space?
          </h2>
          <p className="mt-4 text-emerald-100 text-lg leading-relaxed">
            Clear the books you no longer need and let Givezy handle what comes next.
          </p>
          <Link
            href="/donate"
            className="inline-flex items-center gap-2 mt-8 bg-white text-emerald-800 px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-colors"
          >
            Book a pickup
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Link>
          {bag && (
            <p className="mt-4 text-sm text-emerald-200">
              ₹{Math.round(bag.pricePaise / 100)} · about {bag.approxBooks} books · doorstep
              collection
            </p>
          )}
        </AnimatedSection>
      </section>

      {/* ── Sticky mobile CTA: the page is long and the price is the decision ── */}
      {rupees && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-sm px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Link
            href="/donate"
            className="flex items-center justify-center gap-2 w-full bg-emerald-700 text-white py-3 rounded-xl font-semibold"
          >
            Book a pickup · ₹{rupees}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      )}
      {/* Keeps the final CTA clear of the sticky bar */}
      {rupees && <div aria-hidden="true" className="sm:hidden h-20" />}
    </>
  );
}
