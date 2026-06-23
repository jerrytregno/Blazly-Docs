"use client";

import { WHY_CHOOSE } from "@/lib/landing-content";
import { FadeIn, HoverLift, StaggerContainer, StaggerItem } from "./motion";

export function WhyChoose() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <FadeIn>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Why Blazly
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Why choose Blazly Local SEO?
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Stop juggling spreadsheets, manual GBP updates, and guesswork. Blazly
              gives your team a single source of truth for local search growth — with
              AI that tells you exactly what to do next.
            </p>
            <div className="mt-8 rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
              <p className="text-3xl font-bold text-slate-900">3.2x</p>
              <p className="mt-1 text-sm text-slate-600">
                Average increase in local visibility within the first 90 days
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid gap-4 sm:grid-cols-2">
            {WHY_CHOOSE.map((item) => {
              const Icon = item.icon;
              return (
                <StaggerItem key={item.title}>
                  <HoverLift>
                    <div className="glass-card h-full rounded-xl p-5 transition hover:border-indigo-200 hover:shadow-md">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                        <Icon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <h3 className="mt-3 font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                    </div>
                  </HoverLift>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
