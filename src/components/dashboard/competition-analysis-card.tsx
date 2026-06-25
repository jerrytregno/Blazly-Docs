"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Tag, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  COMPETITION_LEVEL_STYLES,
  resolveCompetitionAnalysis,
} from "@/lib/seo/competition-analysis";
import { resolveSearchLocation } from "@/lib/seo/analysis-location";
import type { BusinessDoc, CompetitionAnalysis, RankingsDoc } from "@/types/firestore";
import { cn } from "@/lib/utils";

function CompetitionBadge({ level, label }: { level: CompetitionAnalysis["level"]; label: string }) {
  const styles = COMPETITION_LEVEL_STYLES[level];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-bold uppercase tracking-wide",
        styles.bg,
        styles.text,
        styles.border
      )}
    >
      {label} competition
    </span>
  );
}

export function CompetitionAnalysisCard({
  business,
  rankings,
  analyzing,
}: {
  business: BusinessDoc | null;
  rankings: RankingsDoc | null;
  analyzing?: boolean;
}) {
  const category = business?.primaryCategory || "Local business";
  const location = resolveSearchLocation(business ?? {}) || business?.city || "Your market";

  const analysis = resolveCompetitionAnalysis(rankings, business, category, location);

  if (!analysis && !analyzing) {
    return (
      <Card className="border-indigo-200 bg-gradient-to-br from-blue-50/80 to-white">
        <CardContent className="p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Competitor Analysis
          </p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">Market competition scan</h2>
          <p className="mt-2 max-w-2xl text-gray-600">
            Run SEO analysis to measure competition for your category and location on Google Maps.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (analyzing && !analysis) {
    return (
      <Card className="border-indigo-200 bg-white">
        <CardContent className="flex items-center gap-4 p-6 sm:p-8">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <div>
            <p className="font-semibold text-gray-900">Analyzing local competition…</p>
            <p className="text-sm text-gray-500">
              Scanning {category} in {location}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const styles = COMPETITION_LEVEL_STYLES[analysis.level];

  return (
    <Card className={cn("overflow-hidden border-2", styles.border)}>
      <CardContent className="p-0">
        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
              Competitor Analysis
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Market competition level
            </h2>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5">
                <Tag className="h-4 w-4 text-gray-400" />
                {analysis.category}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5">
                <MapPin className="h-4 w-4 text-gray-400" />
                {analysis.location}
              </span>
            </div>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600">
              {analysis.summary}
            </p>

            <Link
              href="/dashboard/competitor-analysis"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View full competitor breakdown
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-4 lg:items-end">
            <CompetitionBadge level={analysis.level} label={analysis.levelLabel} />
            <div className="w-full min-w-[200px] max-w-xs rounded-xl border border-gray-200 bg-white p-4 text-center lg:w-56">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Competition score
              </p>
              <p className="mt-1 text-4xl font-bold text-gray-900">{analysis.score}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={cn("h-full rounded-full transition-all", styles.bar)}
                  style={{ width: `${analysis.score}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">0 = easy market · 100 = saturated</p>
            </div>
          </div>
        </div>

        <div className="grid border-t border-gray-200 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Competitors found",
              value: String(analysis.competitorCount),
              icon: Users,
            },
            {
              label: "Avg. reviews",
              value: String(analysis.avgCompetitorReviews),
              icon: Users,
            },
            {
              label: "Avg. rating",
              value: analysis.avgCompetitorRating ? `${analysis.avgCompetitorRating}★` : "—",
              icon: Users,
            },
            {
              label: "Your Maps rank",
              value: analysis.yourRank ? `#${analysis.yourRank}` : analysis.competitorCount > 0 ? "Not in top 20" : "—",
              icon: Users,
              sub: analysis.mapsRankQuery ? `for "${analysis.mapsRankQuery}"` : undefined,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="border-b border-gray-100 px-6 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
              {stat.sub ? (
                <p className="mt-1 text-xs text-gray-500">{stat.sub}</p>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
