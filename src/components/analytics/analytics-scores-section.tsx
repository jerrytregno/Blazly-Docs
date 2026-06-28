"use client";

import { ProgressBar } from "@/components/ui/progress-bar";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreRing } from "@/components/ui/score-ring";
import type { AnalyticsScores } from "@/types/firestore";

const SCORE_ITEMS: { key: keyof AnalyticsScores; label: string; color: string }[] = [
  { key: "trafficScore", label: "Traffic Score", color: "text-indigo-600" },
  { key: "reviewScore", label: "Review Score", color: "text-violet-600" },
  { key: "reputationScore", label: "Reputation Score", color: "text-amber-600" },
  { key: "visibilityScore", label: "Visibility Score", color: "text-cyan-600" },
];

export function AnalyticsScoresSection({ scores }: { scores: AnalyticsScores }) {
  return (
    <Card className="border-gray-200 bg-white">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">SEO & visibility scores</h2>
        <p className="mt-1 text-sm text-gray-500">
          Composite scores based on traffic, reviews, reputation, and visibility
        </p>

        <div className="mt-6 flex flex-col items-center gap-8 lg:flex-row lg:items-start">
          <ScoreRing score={scores.overallScore} label="Overall Score" />
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            {SCORE_ITEMS.map((item) => {
              const value = scores[item.key];
              return (
                <div
                  key={item.key}
                  className="rounded-xl border border-gray-100 bg-gray-50/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">{item.label}</p>
                    <p className={`text-xl font-bold ${item.color}`}>{value}</p>
                  </div>
                  <ProgressBar value={value} className="mt-3 h-2" />
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
