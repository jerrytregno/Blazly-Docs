"use client";

import { Star } from "lucide-react";
import { TESTIMONIALS } from "@/lib/landing-content";
import { FadeIn, HoverLift, StaggerContainer, StaggerItem } from "./motion";

export function Testimonials() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Testimonials
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Loved by agencies and local businesses
          </h2>
        </FadeIn>

        <StaggerContainer className="mt-14 grid gap-6 md:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <StaggerItem key={t.name}>
              <HoverLift>
                <blockquote className="glass-card flex h-full flex-col rounded-2xl p-6 sm:p-8">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="mt-4 flex-1 text-base leading-relaxed text-slate-700">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <footer className="mt-6 flex items-center gap-3 border-t border-slate-200 pt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{t.name}</p>
                      <p className="text-sm text-slate-500">
                        {t.role}, {t.company}
                      </p>
                    </div>
                  </footer>
                </blockquote>
              </HoverLift>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
