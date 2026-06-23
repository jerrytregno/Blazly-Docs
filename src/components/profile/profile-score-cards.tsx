"use client";

import { ProgressBar } from "@/components/ui/progress-bar";
import type { ProfileOptimizationScores } from "@/types/firestore";

const SCORE_META = [
  { key: "profileCompleteness" as const, label: "Profile Completeness", color: "text-indigo-600" },
  { key: "localSeo" as const, label: "Local SEO Score", color: "text-violet-600" },
  { key: "reputation" as const, label: "Reputation Score", color: "text-amber-600" },
  { key: "visibility" as const, label: "Visibility Score", color: "text-emerald-600" },
];

export function ProfileScoreCards({ scores }: { scores: ProfileOptimizationScores }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {SCORE_META.map((meta) => {
        const value = scores[meta.key];
        return (
          <div
            key={meta.key}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {meta.label}
            </p>
            <p className={`mt-2 text-4xl font-bold ${meta.color}`}>{value}</p>
            <div className="mt-3">
              <ProgressBar value={value} className="h-2.5" />
            </div>
            <p className="mt-2 text-xs text-gray-400">out of 100</p>
          </div>
        );
      })}
    </div>
  );
}
