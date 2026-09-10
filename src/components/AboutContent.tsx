"use client";

import Link from "next/link";
import { Heart, BookOpen, MapPin, Users, ArrowRight } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import ImpactStats from "@/components/ImpactStats";
import GivingIllustration from "@/components/illustrations/GivingIllustration";
import { slideInLeft, slideInRight, staggerContainer, fadeInUp } from "@/lib/animations";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const VALUES = [
  {
    icon: Heart,
    title: "Zero friction",
    description: "We come to your door. No drop-off points, no logistics for you to manage.",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    icon: Users,
    title: "Community first",
    description: "Every item goes directly to families, shelters, and schools in Hyderabad who need it.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: BookOpen,
    title: "Education matters",
    description: "Books are knowledge. A donated textbook can change the trajectory of a child's future.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: MapPin,
    title: "Hyderabad-rooted",
    description: "We know every area — from Gachibowli to Old City. Hyperlocal means we move fast.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
];

export default function AboutContent() {
  const valuesRef = useRef(null);
  const valuesInView = useInView(valuesRef, { once: true, margin: "-80px" });

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <AnimatedSection variants={slideInLeft}>
              <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3">
                Our story
              </p>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                Making generosity{" "}
                <span className="text-emerald-600">effortless</span>
              </h1>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Givezy started with a simple observation: most people in Hyderabad have books
                  they&apos;ve finished reading and clothes they no longer wear, but donating them
                  feels like a chore.
                </p>
                <p>
                  You have to find an NGO, pack things up, and figure out drop-off logistics.
                  We remove that friction entirely. You tell us what you have, we come to your
                  doorstep and pick it up.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection variants={slideInRight} className="hidden md:block">
              <GivingIllustration className="w-full h-auto max-w-sm mx-auto" />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <ImpactStats />

      {/* Values */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-14">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-2">
              What drives us
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our values</h2>
          </AnimatedSection>

          <motion.div
            ref={valuesRef}
            initial="hidden"
            animate={valuesInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {VALUES.map((v) => (
              <motion.div
                key={v.title}
                variants={fadeInUp}
                className="p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${v.bg} mb-4`}>
                  <v.icon className={`w-6 h-6 ${v.color}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{v.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* What we accept + Coverage */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <div className="space-y-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">What we accept</h2>
                <p className="text-gray-600 leading-relaxed">
                  Right now we focus on two categories: books (textbooks, novels, children&apos;s books,
                  magazines) and clothes (clean, wearable clothing for men, women, and children). We
                  plan to expand categories as we grow.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Where we operate</h2>
                <p className="text-gray-600 leading-relaxed">
                  We serve all of Hyderabad — from Secunderabad to Shamshabad, HITEC City to Old City,
                  Gachibowli to Uppal. If you have a Hyderabad pincode, we&apos;ll come to you.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-emerald-600 to-teal-700">
        <div className="max-w-2xl mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to make a difference?
            </h2>
            <p className="text-emerald-100 text-lg mb-8">
              It takes less than 2 minutes. We&apos;ll handle the rest.
            </p>
            <Link
              href="/donate"
              className="inline-flex items-center gap-2 bg-white text-emerald-700 px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-all hover:shadow-lg"
            >
              Donate Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
