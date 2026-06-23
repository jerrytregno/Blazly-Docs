"use client";

import { Loader2 } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ScoreRing } from "@/components/ui/score-ring";

export function GbpHealthScore() {
  const { dashboard, analyzing } = useData();
  if (!dashboard) return null;

  const isAnalyzing = analyzing || dashboard.analysisStatus === "analyzing";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          GBP Health Score — {isAnalyzing ? "…" : `${dashboard.metrics.gbpHealth}/100`}
          {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin text-violet-400" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <ScoreRing score={dashboard.metrics.gbpHealth} size={100} />
        <div className="flex-1 space-y-3">
          {dashboard.gbpHealthBreakdown.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex justify-between text-sm text-[#d4c4f5]">
                <span>{item.label}</span>
                <span>{item.score}/100</span>
              </div>
              <ProgressBar value={item.score} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function GbpHealthScoreSection() {
  return (
    <PageDataGuard>
      <GbpHealthScore />
    </PageDataGuard>
  );
}
