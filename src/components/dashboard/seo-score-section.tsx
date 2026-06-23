"use client";

import { RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { ScoreRing } from "@/components/ui/score-ring";
import { StatCard } from "@/components/dashboard/widgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export function SeoScoreSection() {
  const { dashboard, analyzing, analysisError, runAnalysis } = useData();

  if (!dashboard) return null;

  const isAnalyzing = analyzing || dashboard.analysisStatus === "analyzing";
  const hasScores = dashboard.analysisStatus === "complete" && dashboard.metrics.overallScore > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Local SEO Score</CardTitle>
          {dashboard.lastAnalyzedAt && (
            <p className="mt-1 text-xs text-[#9b8ab8]">
              Last analyzed {formatDate(dashboard.lastAnalyzedAt)}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => runAnalysis()}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isAnalyzing ? "Analyzing..." : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        {analysisError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Analysis failed</p>
              <p className="mt-1 text-red-200/80">{analysisError}</p>
            </div>
          </div>
        )}

        {isAnalyzing && !hasScores ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
            <div>
              <p className="font-medium text-white">Analyzing your business...</p>
              <p className="mt-1 text-sm text-[#b8a9d9]">
                Fetching Google Maps data, reviews, and profile signals via SearchAPI
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="relative">
                <ScoreRing
                  score={dashboard.metrics.overallScore}
                  label="Overall Score"
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[#2a1454]/60">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-300" />
                  </div>
                )}
              </div>
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <StatCard label="AI Visibility" value={dashboard.metrics.aiVisibility ?? dashboard.metrics.localVisibility} />
                <StatCard label="Organic Traffic" value={dashboard.metrics.organicTraffic ?? 0} />
                <StatCard label="Local Visibility" value={dashboard.metrics.localVisibility} />
                <StatCard
                  label="Citation Health"
                  value={dashboard.metrics.citationHealth}
                />
                <StatCard label="Review Score" value={dashboard.metrics.reviewScore} />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
