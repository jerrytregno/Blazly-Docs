"use client";

import { HOW_IT_WORKS } from "@/lib/landing-content";
import { FadeIn, StaggerContainer, StaggerItem } from "./motion";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-slate-200 bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
            How It Works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            From setup to local dominance in four steps
          </h2>
        </FadeIn>

        <StaggerContainer className="relative mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div
            className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent lg:block"
            aria-hidden
          />
          {HOW_IT_WORKS.map((step) => {
            const Icon = step.icon;
            return (
              <StaggerItem key={step.step}>
                <div className="relative text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-lg font-bold text-indigo-700">
                    {step.step}
                  </div>
                  <div className="mx-auto mt-4 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white">
                    <Icon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
