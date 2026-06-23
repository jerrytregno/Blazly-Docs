"use client";

import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { DashboardDoc, RankingsDoc } from "@/types/firestore";
import { keywordRankingProgress } from "@/lib/seo/visibility-metrics";

function resolveProgressAreas(
  areas: DashboardDoc["progressAreas"],
  rankings: RankingsDoc | null | undefined,
  dashboard: DashboardDoc | null | undefined
) {
  if (!areas.length) return areas;

  return areas.map((area) => {
    if (area.label !== "Keyword Rankings" || area.progress > 0) return area;

    const progress = keywordRankingProgress(
      rankings?.keywords ?? [],
      null,
      rankings?.geoGrid,
      dashboard?.metrics.localVisibility,
      dashboard?.metrics.overallScore ?? 0
    );

    return progress > 0 ? { ...area, progress } : area;
  });
}

export function DashboardInsightsRow({
  dashboard,
  rankings,
}: {
  dashboard: DashboardDoc;
  rankings: RankingsDoc | null;
}) {
  const topCompetitors = rankings?.competitors.filter((c) => !c.isYou).slice(0, 3) ?? [];

  return (
    <section className="space-y-4">
      <h2 className="dashboard-section-title">Insights & Actions</h2>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="p-6 pb-0">
            <CardTitle className="text-xl">Priority Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            {dashboard.issues.length === 0 ? (
              <p className="text-base text-gray-500">No critical issues detected.</p>
            ) : (
              <ul className="space-y-3">
                {dashboard.issues.slice(0, 4).map((issue) => (
                  <li
                    key={issue.label}
                    className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-base"
                  >
                    <span className="text-gray-700">{issue.label}</span>
                    <Badge variant={issue.severity === "high" ? "warning" : "secondary"}>
                      {issue.severity}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardHeader className="p-6 pb-0">
            <CardTitle className="text-xl">AI Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <ul className="space-y-3">
              {(dashboard.aiRecommendations.length
                ? dashboard.aiRecommendations
                : ["Complete onboarding or refresh data to get AI recommendations"]
              )
                .slice(0, 4)
                .map((item, i) => (
                  <li key={i} className="flex gap-3 text-base text-gray-700">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-purple-500" />
                    {item}
                  </li>
                ))}
            </ul>
            <Link
              href="/dashboard"
              className="mt-5 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Refresh analysis for more →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-6 pb-0">
            <CardTitle className="text-xl">Top Competitors</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            {topCompetitors.length === 0 ? (
              <p className="text-base text-gray-500">Run analysis to discover competitors.</p>
            ) : (
              <ul className="space-y-3">
                {topCompetitors.map((c) => (
                  <li
                    key={c.name}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-base"
                  >
                    <span className="font-medium text-gray-900">{c.name}</span>
                    <span className="flex items-center gap-2 text-gray-500">
                      {c.rating}★ · {c.reviews} reviews
                      {c.rank <= 3 ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-amber-500" />
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/dashboard/competitor-analysis"
              className="mt-5 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              View competitor analysis →
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function ProgressOverview({
  areas,
  rankings,
  dashboard,
}: {
  areas: DashboardDoc["progressAreas"];
  rankings?: RankingsDoc | null;
  dashboard?: DashboardDoc | null;
}) {
  const resolvedAreas = resolveProgressAreas(areas, rankings, dashboard);
  if (!resolvedAreas.length) return null;

  return (
    <section className="space-y-4">
      <h2 className="dashboard-section-title">Optimization Progress</h2>
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {resolvedAreas.map((area) => (
              <div key={area.label} className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                <div className="mb-3 flex justify-between text-base">
                  <span className="font-medium text-gray-700">{area.label}</span>
                  <span className="font-semibold text-gray-900">{area.progress}%</span>
                </div>
                <ProgressBar value={area.progress} className="h-2.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
