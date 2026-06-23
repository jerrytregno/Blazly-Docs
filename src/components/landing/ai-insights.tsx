"use client";

import { Sparkles } from "lucide-react";
import { AI_INSIGHTS } from "@/lib/landing-content";
import { FadeIn, HoverLift, StaggerContainer, StaggerItem } from "./motion";

const impactColors: Record<string, string> = {
  "High impact": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Medium impact": "bg-amber-50 text-amber-700 border-amber-200",
};

export function AiInsights() {
  return (
    <section className="border-t border-slate-200 bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm text-indigo-700">
            <Sparkles className="h-4 w-4" />
            AI-Powered Insights
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Recommendations that drive real results
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Blazly analyzes your market 24/7 and surfaces prioritized actions — so you
            always know what to fix, improve, or double down on.
          </p>
        </FadeIn>

        <StaggerContainer className="mt-14 grid gap-5 sm:grid-cols-2">
          {AI_INSIGHTS.map((insight) => (
            <StaggerItem key={insight.message}>
              <HoverLift>
                <article className="glass-card rounded-2xl p-6 transition hover:border-indigo-200 hover:shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                      {insight.type}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        impactColors[insight.impact] ?? impactColors["Medium impact"]
                      }`}
                    >
                      {insight.impact}
                    </span>
                  </div>
                  <p className="mt-4 text-base leading-relaxed text-slate-700">
                    &ldquo;{insight.message}&rdquo;
                  </p>
                </article>
              </HoverLift>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
