"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp } from "lucide-react";

export function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="landing-mockup relative mx-auto w-full max-w-4xl perspective-[1200px]"
      aria-hidden
    >
      <div className="absolute -inset-4 rounded-3xl bg-indigo-100/50 blur-3xl" />
      <div className="glass-card relative overflow-hidden rounded-2xl border border-slate-200 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="mx-auto rounded-lg bg-white px-4 py-1 text-xs text-slate-500">
            app.blazly.com/dashboard
          </div>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-[180px_1fr] md:p-6">
          <div className="hidden space-y-2 md:block">
            {[
              "Dashboard",
              "Profile Optimization",
              "Competitor Analysis",
              "Review Management",
            ].map((item, i) => (
              <div
                key={item}
                className={`rounded-lg px-3 py-2 text-xs ${
                  i === 0
                    ? "bg-slate-900 font-medium text-white"
                    : "text-slate-600"
                }`}
              >
                {item}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">Local SEO Overview</p>
                <p className="text-lg font-semibold text-slate-900">Summit Dental Group</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                <TrendingUp className="h-3.5 w-3.5" />
                +12% visibility
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "SEO Score", value: "87", color: "text-indigo-600" },
                { label: "Avg. Rank", value: "#3.2", color: "text-violet-600" },
                { label: "Reviews", value: "4.9", color: "text-amber-600" },
                { label: "GBP Health", value: "92%", color: "text-emerald-600" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">{stat.label}</p>
                  <p className={`mt-1 text-xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-600">Ranking Trends</p>
                <div className="mt-3 flex h-20 items-end gap-1">
                  {[40, 55, 48, 62, 58, 72, 68, 80, 76, 88].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-indigo-500 opacity-80"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-indigo-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Recommendation
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  Add 2 missing categories and request 8 reviews this month to close the gap
                  with your top competitor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
