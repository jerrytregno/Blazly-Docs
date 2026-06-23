"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { FeaturePanel } from "@/components/features/feature-panel";
import {
  COMPETITION_LEVEL_STYLES,
  competitionFromCompetitors,
} from "@/lib/seo/competition-analysis";
import { resolveSearchLocation } from "@/lib/seo/analysis-location";
import { fetchMapsCategoryRank } from "@/lib/seo/maps-rank";
import { parseGoogleMapsPlaceId } from "@/lib/seo/maps-place";
import { regionGl, resolveSearchRegionId } from "@/lib/seo/search-regions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CompetitionAnalysis } from "@/types/firestore";

function FactorBadge({ impact }: { impact: CompetitionAnalysis["level"] }) {
  const styles = COMPETITION_LEVEL_STYLES[impact];
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-xs font-semibold capitalize",
        styles.bg,
        styles.text,
        styles.border
      )}
    >
      {impact}
    </span>
  );
}

export default function CompetitorAnalysisPage() {
  const { business, rankings, dashboard, searchRegion, analyzing, runAnalysis } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [mapsRankOverride, setMapsRankOverride] = useState<{
    rank: number;
    query: string;
  } | null>(null);

  const category = business?.primaryCategory || "Local business";
  const location = resolveSearchLocation(business ?? {}) || business?.city || "Your market";

  const baseAnalysis =
    rankings?.competitionAnalysis ??
    (rankings?.competitors?.length
      ? competitionFromCompetitors(
          rankings.competitors,
          category,
          location,
          business?.name ?? "Your business"
        )
      : null);

  const analysis = useMemo(() => {
    if (!baseAnalysis) return null;
    if (mapsRankOverride) {
      return {
        ...baseAnalysis,
        yourRank: mapsRankOverride.rank,
        mapsRankQuery: mapsRankOverride.query,
      };
    }
    return baseAnalysis;
  }, [baseAnalysis, mapsRankOverride]);

  useEffect(() => {
    setMapsRankOverride(null);
  }, [rankings?.competitionAnalysis?.searchedAt]);

  useEffect(() => {
    if (baseAnalysis?.mapsRankQuery || !business?.mapsPlaceId) return;
    const placeId = parseGoogleMapsPlaceId(business.mapsPlaceId);
    if (!placeId) return;

    const gl = regionGl(
      resolveSearchRegionId(dashboard?.searchRegion ?? searchRegion, business.country)
    );

    let cancelled = false;
    void fetchMapsCategoryRank({
      category,
      location,
      placeId,
      businessName: business.name,
      gl,
    }).then((result) => {
      if (!cancelled && result.rank > 0) {
        setMapsRankOverride({ rank: result.rank, query: result.query });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    baseAnalysis?.mapsRankQuery,
    business?.mapsPlaceId,
    business?.name,
    business?.country,
    category,
    location,
    dashboard?.searchRegion,
    searchRegion,
  ]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await runAnalysis();
    } finally {
      setRefreshing(false);
    }
  };

  const styles = analysis ? COMPETITION_LEVEL_STYLES[analysis.level] : null;

  return (
    <PageDataGuard>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Competitor Analysis</h1>
            <p className="mt-1 text-gray-600">
              How crowded is <span className="font-medium">{category}</span> in{" "}
              <span className="font-medium">{location}</span>?
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing || analyzing}
          >
            {refreshing || analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh scan
          </Button>
        </div>

        {!analysis ? (
          <Card className="border-gray-200 bg-white">
            <CardContent className="py-16 text-center">
              <p className="text-gray-600">No competition data yet.</p>
              <Button className="mt-4" onClick={handleRefresh} disabled={refreshing}>
                Run analysis
              </Button>
            </CardContent>
          </Card>
        ) : analysis.competitorCount === 0 ? (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="py-12 text-center">
              <p className="font-medium text-gray-900">No competitors found in the last scan</p>
              <p className="mt-2 text-sm text-gray-600">
                Click <span className="font-medium">Refresh scan</span> to search Google Maps for
                nearby businesses in your category ({category}).
              </p>
              <Button className="mt-4" onClick={handleRefresh} disabled={refreshing || analyzing}>
                Refresh scan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className={cn("border-2 bg-white", styles?.border)}>
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Competition level</p>
                    <p
                      className={cn(
                        "mt-1 text-4xl font-bold uppercase tracking-tight",
                        styles?.text
                      )}
                    >
                      {analysis.levelLabel}
                    </p>
                    <p className="mt-3 max-w-xl text-gray-600">{analysis.summary}</p>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-sm text-gray-500">Intensity score</p>
                    <p className="text-5xl font-bold text-gray-900">{analysis.score}</p>
                    <p className="mt-1 text-xs text-gray-400">out of 100</p>
                  </div>
                </div>
                <div className="mt-6 h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={cn("h-full rounded-full", styles?.bar)}
                    style={{ width: `${analysis.score}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Competitors in market", value: analysis.competitorCount },
                { label: "Established players", value: analysis.establishedCompetitors },
                { label: "Dominant players", value: analysis.dominantCompetitors },
                {
                  label: "Your Maps rank",
                  value: analysis.yourRank
                    ? `#${analysis.yourRank}`
                    : analysis.competitorCount > 0
                      ? "Not in top 20"
                      : "—",
                  sub: analysis.mapsRankQuery
                    ? `for "${analysis.mapsRankQuery}"`
                    : "Run analysis to refresh",
                },
              ].map((s) => (
                <Card key={s.label} className="border-gray-200 bg-white">
                  <CardContent className="p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {s.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{s.value}</p>
                    {"sub" in s && s.sub ? (
                      <p className="mt-1 text-xs text-gray-500">{s.sub}</p>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>

            <FeaturePanel
              title="Competition factors"
              description="Signals used to rate market difficulty for your category and location."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {analysis.factors.map((factor) => (
                  <div
                    key={factor.label}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{factor.label}</p>
                      <p className="text-lg font-bold text-gray-800">{factor.value}</p>
                    </div>
                    <FactorBadge impact={factor.impact} />
                  </div>
                ))}
              </div>
            </FeaturePanel>

            {analysis.topCompetitor && (
              <FeaturePanel title="Top competitor in this market">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {analysis.topCompetitor.name}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Rank #{analysis.topCompetitor.rank} · {analysis.topCompetitor.rating}★ ·{" "}
                      {analysis.topCompetitor.reviews} reviews
                    </p>
                  </div>
                </div>
              </FeaturePanel>
            )}

            <FeaturePanel title="All competitors in scan">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
                      <th className="p-4 font-medium">Business</th>
                      <th className="p-4 font-medium">Rank</th>
                      <th className="p-4 font-medium">Rating</th>
                      <th className="p-4 font-medium">Reviews</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rankings?.competitors ?? []).map((c) => (
                      <tr
                        key={c.name}
                        className={cn(
                          "border-b border-gray-100 last:border-0",
                          c.isYou && "bg-indigo-50"
                        )}
                      >
                        <td className="p-4 font-medium text-gray-900">
                          {c.name}
                          {c.isYou && (
                            <Badge className="ml-2" variant="secondary">
                              You
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-gray-600">#{c.rank || "—"}</td>
                        <td className="p-4 text-gray-600">{c.rating}★</td>
                        <td className="p-4 text-gray-600">{c.reviews}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </FeaturePanel>
          </>
        )}
      </div>
    </PageDataGuard>
  );
}
