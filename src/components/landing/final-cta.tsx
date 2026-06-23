"use client";

import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { DEMO_CALENDLY_URL } from "@/lib/landing-content";
import { FadeIn } from "./motion";

export function FinalCta() {
  return (
    <section id="contact" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#3a1a13] to-slate-900 px-6 py-16 text-center sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(181,82,59,0.28),transparent_55%)]" />
            <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Ready to rank #1 in local search?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-lg text-[#f5e4df]">
              Join businesses using Blazly to dominate Google Maps, outrank competitors,
              and grow with AI.
            </p>
            <div className="relative mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="gradient-btn group flex h-12 w-full items-center justify-center gap-2 rounded-xl px-8 text-sm font-semibold sm:w-auto"
              >
                Start free trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href={DEMO_CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-8 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 sm:w-auto"
              >
                <Calendar className="h-4 w-4" />
                Schedule a demo
              </a>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
