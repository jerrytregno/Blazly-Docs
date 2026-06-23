"use client";

import { Check } from "lucide-react";
import { FEATURE_GROUPS } from "@/lib/landing-content";
import { FadeIn, HoverLift, StaggerContainer, StaggerItem } from "./motion";

export function FeatureHighlights() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Platform Features
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Everything you need to win local search
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            One platform for GBP optimization, competitor intelligence, rank tracking,
            review management, and AI-powered strategy.
          </p>
        </FadeIn>

        <StaggerContainer className="mt-16 grid gap-6 lg:grid-cols-2">
          {FEATURE_GROUPS.map((group) => {
            const Icon = group.icon;
            return (
              <StaggerItem key={group.id}>
                <HoverLift>
                  <article className="glass-card group h-full rounded-2xl p-6 transition hover:border-indigo-200 hover:shadow-md sm:p-8">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${group.color} shadow-sm`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-semibold text-slate-900">{group.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">{group.description}</p>
                      </div>
                    </div>
                    <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                      {group.items.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                          <Check className="h-4 w-4 shrink-0 text-indigo-600" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                </HoverLift>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
