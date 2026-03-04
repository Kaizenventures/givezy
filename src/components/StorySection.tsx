"use client";

import AnimatedSection from "./AnimatedSection";
import { slideInLeft, slideInRight } from "@/lib/animations";
import StoryIllustration from "./illustrations/StoryIllustration";

export default function StorySection() {
  return (
    <section className="py-20 px-4 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Illustration */}
          <AnimatedSection variants={slideInLeft}>
            <div className="max-w-sm mx-auto md:max-w-none">
              <StoryIllustration className="w-full h-auto" />
            </div>
          </AnimatedSection>

          {/* Narrative */}
          <AnimatedSection variants={slideInRight}>
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3">
              Your impact
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
              That textbook gathering dust on your shelf?
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                It could be the reason a child in Old City learns to read this year. In Hyderabad alone,
                thousands of families can't afford school supplies — but they have the hunger to learn.
              </p>
              <p>
                The shirt you haven't worn in two years? It could keep someone warm through a Deccan winter night.
                India generates nearly 8 million tonnes of textile waste every year, while millions go without
                basic clothing.
              </p>
              <p className="font-medium text-gray-800">
                Your clutter is someone's comfort. Your old is someone's new beginning.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
