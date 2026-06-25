"use client";

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
import { formatDate } from "@/lib/utils";

export function LocalSeoPerformanceCard({
  dashboard,
  business,
  rankings,
  reviews,
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
  const citation = rankings?.citationHealth;
  const listedDirectories =
    (citation?.otherDirectories.listed ?? 0) + (citation?.googleListed ? 1 : 0);
  const liveCitations =
    citation?.listings?.filter((l) => l.status === "live").length ?? listedDirectories;

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
  const keywordSpark = buildKeywordSparkline(
    keywords,
    m.rankingGains,
    m.rankingLosses
  );

  const citationListed = citation?.otherDirectories.listed ?? 0;
  const citationTotal = citation?.otherDirectories.total ?? 0;
  const citationTrend =
    citationTotal > 0
      ? Math.round((citationListed / citationTotal) * 100) - 50
      : undefined;

  const scope = business?.name || "Local Business";
  const rankDisplay =
    m.averageRank > 0
      ? `#${m.averageRank}`
      : rankings?.competitionAnalysis?.yourRank
        ? `#${rankings.competitionAnalysis.yourRank}`
        : "—";

  const mapsVisibility = m.localVisibility ?? dashboard.visibilityScore ?? 0;

  return (
    <Card className="h-full overflow-hidden">
      <SeoCardHeader
        scope={scope}
        date={dashboard.lastAnalyzedAt ? formatDate(dashboard.lastAnalyzedAt) : undefined}
      />
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 [&>*]:border-b [&>*]:border-gray-200 md:[&>*:nth-child(odd)]:border-r lg:[&>*:nth-child(3n)]:border-r-0 lg:[&>*:nth-child(n+4)]:border-b-0">
          <SeoMetricCell
            label="Authority Score"
            description="Your overall local SEO strength from GBP completeness, reviews, NAP consistency, citations, and rankings."
            value={m.overallScore}
            trend={scoreChange !== 0 ? scoreChange : undefined}
            trendSuffix=""
            showAuthorityGauge
            subLabel="Local Rank"
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
            label="Organic Traffic"
            description="Estimated monthly visits from your live Google Maps and keyword ranking positions."
            value={organicTraffic > 0 ? organicTraffic.toLocaleString() : "—"}
            trend={trafficTrend}
            sparkData={organicTraffic > 0 ? trafficSpark : undefined}
            sparkVariant="area"
            sparkPositive={trafficTrend === undefined || trafficTrend >= 0}
          />
          <SeoMetricCell
            label="Organic Keywords"
            description="Keywords your business ranks for in live local Google search results."
            value={organicKeywordCount || keywords.length}
            trend={keywordTrend}
            sparkData={keywordSpark}
            sparkVariant="line"
            sparkPositive={keywordTrend === undefined || keywordTrend >= 0}
            className="border-b border-gray-200 lg:border-r-0"
            expandAction={{
              buttonLabel: "View ranking keywords",
              panel:
                rankedKeywords.length > 0 ? (
                  <ul className="max-h-44 space-y-1.5 overflow-y-auto rounded-lg border border-gray-200 bg-slate-50 p-2.5 text-xs">
                    {rankedKeywords.map((kw) => (
                      <li
                        key={kw.keyword}
                        className="flex items-center justify-between gap-3 rounded-md bg-white px-2.5 py-1.5"
                      >
                        <span className="min-w-0 truncate font-medium text-slate-800">
                          {kw.keyword}
                        </span>
                        <span className="shrink-0 font-semibold text-indigo-600">#{kw.rank}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    No ranking keywords yet. Run analysis to discover what your business ranks for
                    on Google.
                  </p>
                ),
            }}
          />
          <SeoMetricCell
            label="Maps Visibility"
            description="Local search visibility score from brand, category, near-me, and Maps ranking checks."
            value={`${mapsVisibility}%`}
            trend={
              m.top10Keywords > 0
                ? Math.round((m.top10Keywords / Math.max(keywords.length, 1)) * 100)
                : undefined
            }
            subLabel="Top 10 keywords"
            subValue={String(m.top10Keywords ?? rankedKeywords.filter((k) => k.rank <= 10).length)}
            className="border-b border-r border-gray-200 sm:border-b-0"
          />
          <SeoMetricCell
            label="Directory Listings"
            description="Business directories where your NAP listing is found, from live citation analysis."
            value={listedDirectories}
            trend={citationTrend}
            subLabel="Live citations"
            subValue={String(liveCitations)}
            subTrend={citation?.score && citation.score >= 70 ? "up" : citation?.score && citation.score < 50 ? "down" : undefined}
            className="border-r border-gray-200"
          />
          <SeoMetricCell
            label="GBP Health"
            description="How complete and optimized your Google Business Profile is."
            value={m.gbpHealth}
            trend={m.gbpHealth >= 70 ? 5 : m.gbpHealth < 50 ? -5 : undefined}
            trendSuffix=""
            subLabel="Citation Health"
            subValue={`${m.citationHealth}/100`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
