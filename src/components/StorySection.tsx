"use client";

import AnimatedSection from "./AnimatedSection";
import { slideInLeft, slideInRight } from "@/lib/animations";
import StoryIllustration from "./illustrations/StoryIllustration";

export default function StorySection({ title, body }: { title: string; body: string }) {
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
              {title}
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              {body
                .split(/\n{2,}/)
                .map((para) => para.trim())
                .filter(Boolean)
                .map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
