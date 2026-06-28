"use client";

import {
  Award,
  BarChart3,
  Building2,
  MapPin,
  Search,
} from "lucide-react";
import {
  SeoCardHeader,
  SeoMetricCell,
} from "@/components/dashboard/seo-metric-cell";
import {
  buildKeywordSparkline,
  buildTrafficSparkline,
} from "@/components/dashboard/sparkline";
import { Card, CardContent } from "@/components/ui/card";
import type { BusinessDoc, DashboardDoc, RankingsDoc, ReviewsDoc } from "@/types/firestore";

export function LocalSeoPerformanceCard({
  dashboard,
  business,
  rankings,
}: {
  dashboard: DashboardDoc;
  rankings: RankingsDoc | null;
  reviews: ReviewsDoc | null;
  business: BusinessDoc | null;
}) {
  const m = dashboard.metrics;
  const keywords = rankings?.keywords ?? [];
  const rankedKeywords = keywords
    .filter((k) => k.rank > 0)
    .sort((a, b) => a.rank - b.rank);
  const organicKeywordCount = rankedKeywords.length;

  const rankingNet = m.rankingGains - m.rankingLosses;
  const scoreChange = rankingNet;

  const organicTraffic = m.organicTraffic ?? 0;
  const trafficTrend =
    rankingNet !== 0
      ? Math.round((rankingNet / Math.max(organicKeywordCount || keywords.length, 1)) * 100)
      : undefined;

  const keywordTrend =
    rankingNet !== 0
      ? Math.round((rankingNet / Math.max(keywords.length, 1)) * 100)
      : undefined;

  const trafficSpark = buildTrafficSparkline(
    organicTraffic,
    keywords,
    m.rankingGains,
    m.rankingLosses
  );
  const keywordSpark = buildKeywordSparkline(keywords, m.rankingGains, m.rankingLosses);

  const scope = business?.name || "Local Business";
  const rankDisplay =
    m.averageRank > 0
      ? `#${m.averageRank}`
      : rankings?.competitionAnalysis?.yourRank
        ? `#${rankings.competitionAnalysis.yourRank}`
        : "—";

  const mapsVisibility = m.localVisibility ?? dashboard.visibilityScore ?? 0;

  return (
    <Card className="overflow-hidden border-slate-200/80 shadow-lg shadow-indigo-100/30 ring-1 ring-slate-200/60">
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
      <SeoCardHeader scope={scope} analyzedAt={dashboard.lastAnalyzedAt} />
      <CardContent className="grid grid-cols-1 gap-px bg-slate-100 p-0 md:grid-cols-2 lg:grid-cols-6">
        <SeoMetricCell
          className="lg:col-span-2"
          accent="violet"
          icon={Award}
          label="Authority Score"
          description="AI-assessed local SEO authority from your GBP profile, reviews, citations, and competitive position."
          value={m.overallScore}
          trend={scoreChange !== 0 ? scoreChange : undefined}
          trendSuffix=""
          showAuthorityGauge
          subLabel="Maps rank"
          subValue={rankDisplay}
          subTrend={
            m.averageRank > 0 && m.averageRank <= 3
              ? "up"
              : m.averageRank > 10
                ? "down"
                : undefined
          }
        />
        <SeoMetricCell
          className="lg:col-span-2"
          accent="indigo"
          icon={BarChart3}
          label="Organic Traffic"
          description="Estimated monthly organic visits from Google Search and Maps."
          value={organicTraffic > 0 ? organicTraffic.toLocaleString() : "—"}
          trend={trafficTrend}
          sparkData={organicTraffic > 0 ? trafficSpark : undefined}
          sparkVariant="area"
          sparkPositive={trafficTrend === undefined || trafficTrend >= 0}
        />
        <SeoMetricCell
          className="lg:col-span-2"
          accent="sky"
          icon={Search}
          label="Organic Keywords"
          description="Local keywords your business ranks for, with search volume and pack position."
          value={organicKeywordCount || keywords.length}
          trend={keywordTrend}
          sparkData={keywordSpark}
          sparkVariant="line"
          sparkPositive={keywordTrend === undefined || keywordTrend >= 0}
          expandAction={{
            buttonLabel: "View keywords",
            panel:
              rankedKeywords.length > 0 ? (
                <ul className="max-h-44 space-y-1.5 overflow-y-auto rounded-lg border border-indigo-100 bg-indigo-50/40 p-2.5 text-xs">
                  {rankedKeywords.map((kw) => (
                    <li
                      key={kw.keyword}
                      className="flex items-center justify-between gap-3 rounded-md bg-white px-2.5 py-1.5 shadow-sm"
                    >
                      <span className="min-w-0 truncate font-medium text-slate-800">
                        {kw.keyword}
                      </span>
                      <span className="shrink-0 font-semibold text-indigo-600">
                        #{kw.rank}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  Run analysis to generate keyword estimates.
                </p>
              ),
          }}
        />
        <SeoMetricCell
          className="lg:col-span-3"
          accent="emerald"
          icon={MapPin}
          label="Maps Visibility"
          description="Visibility score: Ranking (40%) + GBP (25%) + Reviews (20%) + Citations (10%) + Website (5%)."
          value={`${mapsVisibility}%`}
          trend={
            m.top10Keywords > 0
              ? Math.round((m.top10Keywords / Math.max(keywords.length, 1)) * 100)
              : undefined
          }
          subLabel="Top 10 keywords"
          subValue={String(
            m.top10Keywords ?? rankedKeywords.filter((k) => k.rank <= 10).length
          )}
        />
        <SeoMetricCell
          className="lg:col-span-3"
          accent="amber"
          icon={Building2}
          label="GBP Health"
          description="How complete and optimized your Google Business Profile is."
          value={m.gbpHealth}
          trend={m.gbpHealth >= 70 ? 5 : m.gbpHealth < 50 ? -5 : undefined}
          trendSuffix=""
          subLabel="Citation health"
          subValue={`${m.citationHealth}/100`}
        />
      </CardContent>
    </Card>
  );
}
