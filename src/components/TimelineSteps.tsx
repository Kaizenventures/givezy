"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ClipboardList, Scale, CreditCard, PackageOpen, Truck, CircleDot } from "lucide-react";
import { staggerContainer, fadeInUp } from "@/lib/animations";

const STEP_ICONS = [ClipboardList, Scale, CreditCard, PackageOpen, Truck];

export default function TimelineSteps({ steps }: { steps: string[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="text-center mb-14">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-2">
              Simple process
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How it works</h2>
          </motion.div>

          <div className="relative">
            {/* Vertical rail */}
            <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-emerald-200 -translate-x-1/2" />

            <ol className="space-y-8">
              {steps.map((step, i) => {
                const Icon = STEP_ICONS[i] ?? CircleDot;
                return (
                  <motion.li key={`${i}-${step}`} variants={fadeInUp} className="relative flex items-start gap-5">
                    <div className="relative z-10 shrink-0 w-12 h-12 rounded-full bg-white border-2 border-emerald-200 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="pt-2.5">
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                        Step {i + 1}
                      </p>
                      <p className="text-gray-700 leading-relaxed">{step}</p>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
