"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { FeaturePanel } from "@/components/features/feature-panel";
import {
  COMPETITION_LEVEL_STYLES,
  isCompetitionDataCurrent,
  resolveCompetitionAnalysis,
} from "@/lib/seo/competition-analysis";
import { resolveSearchLocation } from "@/lib/seo/analysis-location";
import { fetchCompetitionScan } from "@/lib/seo/client";
import { fetchMapsCategoryRank } from "@/lib/seo/maps-rank";
import { parseGoogleMapsPlaceId } from "@/lib/seo/maps-place";
import { regionGl, resolveSearchRegionId } from "@/lib/seo/search-regions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CompetitionAnalysis, Competitor } from "@/types/firestore";

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
  const { user } = useAuth();
  const { business, rankings, dashboard, searchRegion, loading, saveRankings } = useData();
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const scanStartedRef = useRef(false);
  const [mapsRankOverride, setMapsRankOverride] = useState<{
    rank: number;
    query: string;
  } | null>(null);

  const category = business?.primaryCategory || "Local business";
  const location = resolveSearchLocation(business ?? {}) || business?.city || "Your market";
  const businessName = business?.name ?? "Your business";
  const resolvedRegion = resolveSearchRegionId(
    dashboard?.searchRegion ?? searchRegion,
    business?.country
  );

  const isDataCurrent = isCompetitionDataCurrent(rankings, businessName, category, location);

  const baseAnalysis = useMemo(
    () => resolveCompetitionAnalysis(rankings, business, category, location),
    [rankings, business, category, location]
  );

  const competitors = useMemo((): Competitor[] => {
    if (!isDataCurrent) return [];
    return rankings?.competitors ?? [];
  }, [isDataCurrent, rankings?.competitors]);

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

  const runCompetitionScan = useCallback(async () => {
    if (!business?.name) return;
    setScanning(true);
    setScanError(null);
    try {
      const result = await fetchCompetitionScan({
        businessName: business.name,
        website: business.website,
        category,
        location,
        phone: business.phone,
        mapsPlaceId: business.mapsPlaceId,
        searchRegion: resolvedRegion,
      });
      await saveRankings({
        competitors: result.competitors,
        competitionAnalysis: result.competitionAnalysis,
      });
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Competition scan failed");
    } finally {
      setScanning(false);
    }
  }, [business, category, location, resolvedRegion, saveRankings]);

  useEffect(() => {
    setMapsRankOverride(null);
    scanStartedRef.current = false;
  }, [business?.name, category, location]);

  useEffect(() => {
    if (loading || !business?.name || !user) return;
    if (isDataCurrent || scanning || scanStartedRef.current) return;
    scanStartedRef.current = true;
    void runCompetitionScan();
  }, [loading, business?.name, user, isDataCurrent, scanning, runCompetitionScan]);

  useEffect(() => {
    if (!baseAnalysis?.mapsRankQuery || !business?.mapsPlaceId) return;
    const placeId = parseGoogleMapsPlaceId(business.mapsPlaceId);
    if (!placeId) return;

    const gl = regionGl(resolvedRegion);

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
    category,
    location,
    resolvedRegion,
  ]);

  const styles = analysis ? COMPETITION_LEVEL_STYLES[analysis.level] : null;
  const showLoading = scanning || (loading && !analysis);

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
            onClick={() => void runCompetitionScan()}
            disabled={scanning || !business?.name}
          >
            {scanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh scan
          </Button>
        </div>

        {scanError ? (
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="py-4 text-sm text-red-700">{scanError}</CardContent>
          </Card>
        ) : null}

        {showLoading && !analysis ? (
          <Card className="border-gray-200 bg-white">
            <CardContent className="flex items-center gap-4 py-16">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <div>
                <p className="font-semibold text-gray-900">Scanning local competition…</p>
                <p className="text-sm text-gray-500">
                  Searching Google Maps for {category} near {location}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : !analysis ? (
          <Card className="border-gray-200 bg-white">
            <CardContent className="py-16 text-center">
              <p className="text-gray-600">No competition data yet.</p>
              <Button
                className="mt-4"
                onClick={() => void runCompetitionScan()}
                disabled={scanning || !business?.name}
              >
                Run scan
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
              <Button className="mt-4" onClick={() => void runCompetitionScan()} disabled={scanning}>
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
                    : "Refresh scan to update",
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
                    {competitors.map((c) => (
                      <tr
                        key={`${c.name}-${c.rank}`}
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
