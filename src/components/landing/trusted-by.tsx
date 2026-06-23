"use client";

import { TRUSTED_BY } from "@/lib/landing-content";
import { FadeIn } from "./motion";

export function TrustedBy() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 py-12 sm:py-14" aria-label="Trusted by">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Trusted by agencies, local businesses, and growing brands
          </p>
        </FadeIn>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {TRUSTED_BY.map((name, i) => (
            <FadeIn key={name} delay={i * 0.05}>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 shadow-sm transition hover:border-slate-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">
                  {name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-slate-700">{name}</span>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
