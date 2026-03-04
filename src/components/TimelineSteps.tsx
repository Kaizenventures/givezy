"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ClipboardList, Phone, Truck } from "lucide-react";
import { staggerContainer, fadeInUp } from "@/lib/animations";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Tell us what you have",
    description: "Fill a quick form — pick a category, describe the items, snap a photo. Takes under 2 minutes.",
  },
  {
    icon: Phone,
    title: "We get in touch",
    description: "Our team calls or messages you within 48 hours to schedule a time that works for you.",
  },
  {
    icon: Truck,
    title: "Free doorstep pickup",
    description: "We come to your door, collect the items, and make sure they reach someone who needs them.",
  },
];

export default function TimelineSteps() {
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              How it works
            </h2>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-emerald-200 -translate-x-1/2 hidden md:block" />

            <div className="space-y-12">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.title}
                  variants={fadeInUp}
                  className={`relative flex items-start gap-6 md:gap-12 ${
                    i % 2 === 1 ? "md:flex-row-reverse md:text-right" : ""
                  }`}
                >
                  {/* Icon circle */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                      <step.icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                        Step {i + 1}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 mt-1">{step.title}</h3>
                      <p className="text-gray-500 mt-2 text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
