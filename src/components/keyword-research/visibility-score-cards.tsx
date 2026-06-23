"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { KeywordResearchScores } from "@/types/firestore";

export function VisibilityScoreCards({ scores }: { scores: KeywordResearchScores }) {
  const items = [
    { label: "Overall visibility", value: scores.overall, highlight: true },
    { label: "Local ranking", value: scores.localRanking },
    { label: "Competitor gap", value: scores.competitor },
    { label: "Review score", value: scores.review },
    { label: "Profile optimization", value: scores.profileOptimization },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <Card
          key={item.label}
          className={item.highlight ? "border-indigo-200 bg-indigo-50/30" : "border-gray-200"}
        >
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{item.value}</p>
            <ProgressBar value={item.value} className="mt-3 h-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
