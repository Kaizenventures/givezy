"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Shirt, ArrowRight } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import ImpactStats from "@/components/ImpactStats";
import StorySection from "@/components/StorySection";
import TimelineSteps from "@/components/TimelineSteps";
import HeroIllustration from "@/components/illustrations/HeroIllustration";
import GivingIllustration from "@/components/illustrations/GivingIllustration";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/animations";

const CATEGORIES = [
  {
    name: "Books",
    slug: "books",
    icon: BookOpen,
    color: "text-amber-600",
    bg: "bg-amber-50",
    accent: "group-hover:border-amber-300",
    description: "Textbooks, novels, children's books — any readable material in decent shape.",
  },
  {
    name: "Clothes",
    slug: "clothes",
    icon: Shirt,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    accent: "group-hover:border-emerald-300",
    description: "Clean, wearable clothing for men, women, or children. All sizes welcome.",
  },
];

export default function HomeContent() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50 py-20 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.1]"
              >
                Every book finds a reader.{" "}
                <span className="text-emerald-600">Every shirt finds a home.</span>
              </motion.h1>
              <motion.p
                variants={fadeInUp}
                className="mt-6 text-lg text-gray-600 max-w-lg leading-relaxed"
              >
                Donate your pre-loved books and clothes in Hyderabad. We pick them up
                from your doorstep — for free — and give them to those who need them most.
              </motion.p>
              <motion.div variants={fadeInUp} className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/donate"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-emerald-700 transition-all hover:shadow-lg hover:shadow-emerald-200"
                >
                  Donate Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#impact"
                  className="inline-flex items-center justify-center border-2 border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-white hover:border-gray-300 transition-all"
                >
                  See Our Impact
                </a>
              </motion.div>
            </motion.div>

            {/* Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="hidden md:block"
            >
              <HeroIllustration className="w-full h-auto max-w-md mx-auto" />
            </motion.div>
          </div>
        </div>

        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl" />
      </section>

      {/* Impact Stats */}
      <div id="impact">
        <ImpactStats />
      </div>

      {/* Story Section */}
      <StorySection />

      {/* Categories */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center mb-12">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-2">
              Get started
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              What can you donate?
            </h2>
          </AnimatedSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {CATEGORIES.map((cat) => (
              <motion.div key={cat.slug} variants={scaleIn}>
                <Link
                  href={`/donate?category=${cat.slug}`}
                  className={`group block border-2 border-gray-100 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 ${cat.accent} hover:-translate-y-1`}
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${cat.bg} mb-5`}>
                    <cat.icon className={`w-7 h-7 ${cat.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="mt-2 text-gray-500 leading-relaxed">{cat.description}</p>
                  <span className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Donate {cat.name.toLowerCase()} <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Timeline Steps */}
      <TimelineSteps />

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-emerald-600 to-teal-700 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                Your clutter is someone&apos;s comfort.
              </h2>
              <p className="mt-4 text-emerald-100 text-lg leading-relaxed">
                It takes less than 2 minutes to make a difference. Fill the form, and
                we&apos;ll handle the rest — right from your doorstep in Hyderabad.
              </p>
              <Link
                href="/donate"
                className="inline-flex items-center gap-2 mt-8 bg-white text-emerald-700 px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-all hover:shadow-lg"
              >
                Donate Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </AnimatedSection>

            <AnimatedSection variants={scaleIn} className="hidden md:block">
              <GivingIllustration className="w-full h-auto max-w-xs mx-auto opacity-90" />
            </AnimatedSection>
          </div>
        </div>

        {/* Decorative */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      </section>
    </>
  );
}
