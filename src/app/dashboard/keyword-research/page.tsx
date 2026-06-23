"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { FeaturePanel } from "@/components/features/feature-panel";
import { KeywordResearchFilters } from "@/components/keyword-research/search-filters";
import { RankingList } from "@/components/keyword-research/ranking-list";
import { VisibilityScoreCards } from "@/components/keyword-research/visibility-score-cards";
import { CompetitorPanel } from "@/components/keyword-research/competitor-panel";
import { KeywordOpportunities } from "@/components/keyword-research/keyword-opportunities";
import { StrategySection } from "@/components/keyword-research/strategy-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildSearchQuery } from "@/lib/keyword-research/fetch-rankings";
import { resolveSearchLocation } from "@/lib/seo/analysis-location";
import type {
  KeywordResearchDoc,
  KeywordResearchListing,
  KeywordResearchReport,
} from "@/types/firestore";

function normalizeStoredLocation(saved: string, businessCity: string): string {
  if (!saved || saved === "Nearby") return businessCity;
  return saved;
}

export default function KeywordResearchPage() {
  const { user } = useAuth();
  const { business } = useData();

  const businessLocation = useMemo(() => {
    const city = business?.city?.trim();
    if (city) return city;
    if (business) return resolveSearchLocation(business);
    return "";
  }, [business]);
  const defaultCategory = business?.primaryCategory || "";

  const [category, setCategory] = useState(defaultCategory);
  const [location, setLocation] = useState("");
  const [report, setReport] = useState<KeywordResearchReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | undefined>();
  const lastSearchKey = useRef("");
  const filtersReady = useRef(false);

  useEffect(() => {
    if (!business) return;
    setCategory((prev) => {
      if (!prev) return business.primaryCategory || "";
      return prev;
    });
    if (businessLocation) {
      setLocation((prev) => {
        if (!prev || prev === "Nearby") return businessLocation;
        return prev;
      });
    }
  }, [business, businessLocation]);

  const activeCategory = category.trim() || business?.primaryCategory || "Local business";
  const activeLocation = location.trim() || businessLocation;
  const searchHeading = buildSearchQuery(activeCategory, activeLocation);

  const runSearch = useCallback(
    async (opts?: {
      category?: string;
      location?: string;
      competitorPlaceId?: string;
      includeStrategy?: boolean;
      force?: boolean;
    }) => {
      if (!user) return;

      const searchCategory = opts?.category ?? activeCategory;
      const searchLocation = opts?.location ?? activeLocation;
      if (!searchLocation || !searchCategory) return;

      const searchKey = `${searchCategory}|${searchLocation}`;
      if (!opts?.force && !opts?.competitorPlaceId && searchKey === lastSearchKey.current) {
        return;
      }

      setSearching(true);
      setError("");
      try {
        const res = await fetch("/api/keyword-research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            category: searchCategory,
            location: searchLocation,
            competitorPlaceId: opts?.competitorPlaceId,
            includeStrategy: opts?.includeStrategy,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Search failed");

        setReport(data.report);
        if (!opts?.competitorPlaceId) {
          lastSearchKey.current = searchKey;
        }
        if (data.report?.competitorDetail?.placeId) {
          setSelectedPlaceId(data.report.competitorDetail.placeId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setSearching(false);
        setCompetitorLoading(false);
      }
    },
    [user, activeCategory, activeLocation]
  );

  const loadStored = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/keyword-research?userId=${user.uid}`);
      if (!res.ok) return;
      const data = (await res.json()) as KeywordResearchDoc;
      if (data.report) {
        setReport(data.report);
        setCategory(data.report.category);
        setLocation(normalizeStoredLocation(data.report.location, businessLocation));
        const normalized = normalizeStoredLocation(data.report.location, businessLocation);
        if (data.report.location === "Nearby") {
          lastSearchKey.current = "";
        } else {
          lastSearchKey.current = `${data.report.category}|${normalized}`;
        }
        if (data.report.competitorDetail?.placeId) {
          setSelectedPlaceId(data.report.competitorDetail.placeId);
        }
      } else if (businessLocation) {
        setLocation(businessLocation);
      }
      if (data.error) setError(data.error);
    } catch {
      /* ignore load errors */
    } finally {
      setLoading(false);
      filtersReady.current = true;
    }
  }, [user, businessLocation]);

  useEffect(() => {
    void loadStored();
  }, [loadStored]);

  useEffect(() => {
    if (!user || loading || !filtersReady.current) return;
    if (!activeLocation.trim() || !activeCategory.trim()) return;

    const timer = window.setTimeout(() => {
      void runSearch({ category: activeCategory, location: activeLocation });
    }, 600);

    return () => window.clearTimeout(timer);
  }, [user, loading, category, location, activeCategory, activeLocation, runSearch]);

  const handleRefresh = () => {
    void runSearch({ category: activeCategory, location: activeLocation, force: true });
  };

  const handleSelectCompetitor = (listing: KeywordResearchListing) => {
    if (!listing.placeId || listing.isYou) return;
    setSelectedPlaceId(listing.placeId);
    setCompetitorLoading(true);
    void runSearch({ competitorPlaceId: listing.placeId, location: activeLocation });
  };

  const handleGenerateStrategy = async () => {
    if (!user) return;
    setStrategyLoading(true);
    setError("");
    try {
      const res = await fetch("/api/keyword-research/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Strategy generation failed");
      if (data.report) setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Strategy generation failed");
    } finally {
      setStrategyLoading(false);
    }
  };

  const busy = loading || searching;

  return (
    <PageDataGuard>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Keyword Research</h1>
            <p className="mt-1 text-gray-600">Local Maps Rankings for:</p>
            <p className="text-lg font-semibold text-gray-900">
              &ldquo;{report?.query ?? searchHeading}&rdquo;
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={busy || !activeLocation}
            className="gap-2"
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh rankings
          </Button>
        </div>

        <Card className="border-gray-200">
          <CardContent className="p-6">
            <KeywordResearchFilters
              category={category}
              location={location}
              onCategoryChange={setCategory}
              onLocationChange={setLocation}
              disabled={busy}
            />
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        {busy && !report && (
          <Card className="border-gray-200">
            <CardContent className="flex items-center justify-center gap-3 py-16 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin" />
              Fetching local rankings…
            </CardContent>
          </Card>
        )}

        {report && (
          <>
            {report.scores && <VisibilityScoreCards scores={report.scores} />}

            <div className="grid gap-6 lg:grid-cols-2">
              <FeaturePanel title="Top 10 local rankings">
                <RankingList
                  listings={report.listings}
                  yourPosition={report.yourPosition}
                  selectedPlaceId={selectedPlaceId}
                  onSelect={handleSelectCompetitor}
                />
              </FeaturePanel>

              <FeaturePanel title="Competitor deep dive">
                <CompetitorPanel
                  detail={report.competitorDetail}
                  loading={competitorLoading}
                />
              </FeaturePanel>
            </div>

            <FeaturePanel title="Keyword opportunities">
              <KeywordOpportunities keywords={report.keywords} />
            </FeaturePanel>

            <StrategySection
              strategy={report.strategy}
              loading={strategyLoading}
              onGenerate={handleGenerateStrategy}
              yourPosition={report.yourPosition}
            />
          </>
        )}
      </div>
    </PageDataGuard>
  );
}
