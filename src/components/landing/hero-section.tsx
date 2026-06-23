"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { DEMO_CALENDLY_URL } from "@/lib/landing-content";
import { DashboardMockup } from "./dashboard-mockup";

export function HeroSection() {
  return (
    <section className="landing-hero relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-24 lg:pt-36 lg:pb-32">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700"
          >
            <Sparkles className="h-4 w-4" />
            AI-powered local SEO platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
          >
            The SaaS platform to{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              dominate local search
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl"
          >
            Manage Google Business Profile, track competitors, reply to reviews with AI,
            and grow visibility — all in one dashboard built for local businesses.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
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
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-8 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 sm:w-auto"
            >
              <Calendar className="h-4 w-4" />
              Book a demo
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-xs text-slate-400"
          >
            No credit card required · Setup in under 5 minutes
          </motion.p>
        </div>

        <div className="mt-16 sm:mt-20">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
