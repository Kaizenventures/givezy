"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { BookOpen, Shirt, Utensils } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";
import { staggerContainer, fadeInUp } from "@/lib/animations";

const STATS = [
  {
    icon: BookOpen,
    value: 47,
    decimals: 0,
    suffix: "M+",
    label: "children in India are out of school",
    source: "UDISE+ 2023-24",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: Shirt,
    value: 7.8,
    decimals: 1,
    suffix: "M tonnes",
    label: "of textile waste generated in India yearly",
    source: "Ministry of Textiles",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Utensils,
    value: 38,
    decimals: 0,
    suffix: "%",
    label: "of Indian children are stunted from malnutrition",
    source: "NFHS-5",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
];

export default function ImpactStats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-amber-50/50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-14"
        >
          <motion.p variants={fadeInUp} className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-2">
            The reality
          </motion.p>
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-gray-900">
            Why your donation matters
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeInUp}
              className="text-center p-8 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${stat.bg} mb-5`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div className={`text-4xl font-extrabold ${stat.color} mb-2`}>
                <AnimatedCounter target={stat.value} suffix={stat.suffix} duration={2000} decimals={stat.decimals} />
              </div>
              <p className="text-gray-700 font-medium mb-2">{stat.label}</p>
              <p className="text-xs text-gray-400">Source: {stat.source}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
