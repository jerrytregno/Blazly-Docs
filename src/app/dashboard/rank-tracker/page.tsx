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
import { getRankSearchCooldownState } from "@/lib/seo/analysis-cooldown";
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

export default function RankTrackerPage() {
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
  const [lastSearchedAt, setLastSearchedAt] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | undefined>();
  const lastSearchKey = useRef("");

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

  const activeCategory = category.trim();
  const activeLocation = location.trim();
  const canSearch = Boolean(activeCategory && activeLocation);
  const searchCooldown = useMemo(
    () => getRankSearchCooldownState(lastSearchedAt),
    [lastSearchedAt]
  );
  const searchHeading = canSearch
    ? buildSearchQuery(activeCategory, activeLocation)
    : "";

  const runSearch = useCallback(
    async (opts?: {
      category?: string;
      location?: string;
      competitorPlaceId?: string;
      includeStrategy?: boolean;
      force?: boolean;
    }) => {
      if (!user) return;

      const searchCategory = (opts?.category ?? activeCategory).trim();
      const searchLocation = (opts?.location ?? activeLocation).trim();
      if (!searchLocation || !searchCategory) return;

      const searchKey = `${searchCategory}|${searchLocation}`;
      const isCompetitorOnly = Boolean(opts?.competitorPlaceId);
      if (!opts?.force && !isCompetitorOnly && searchKey === lastSearchKey.current) {
        return;
      }

      if (!isCompetitorOnly && !searchCooldown.canRun) {
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
        if (!isCompetitorOnly) {
          lastSearchKey.current = searchKey;
          if (data.analyzedAt) setLastSearchedAt(data.analyzedAt);
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
    [user, activeCategory, activeLocation, searchCooldown.canRun]
  );

  const loadStored = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/keyword-research?userId=${user.uid}`);
      if (!res.ok) return;
      const data = (await res.json()) as KeywordResearchDoc;
      if (data.analyzedAt) setLastSearchedAt(data.analyzedAt);
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
    }
  }, [user, businessLocation]);

  useEffect(() => {
    void loadStored();
  }, [loadStored]);

  const handleSearch = () => {
    if (!activeCategory || !activeLocation) {
      setError("Enter both category and location, then click Search.");
      return;
    }
    if (!searchCooldown.canRun) {
      setError(searchCooldown.message ?? "");
      return;
    }
    setError("");
    void runSearch({
      category: activeCategory,
      location: activeLocation,
      force: true,
    });
  };

  const handleRefresh = () => {
    if (!activeCategory || !activeLocation) {
      setError("Enter both category and location, then click Search.");
      return;
    }
    if (!searchCooldown.canRun) {
      setError(searchCooldown.message ?? "");
      return;
    }
    void runSearch({ category: activeCategory, location: activeLocation, force: true });
  };

  const handleSelectCompetitor = (listing: KeywordResearchListing) => {
    if (!listing.placeId || listing.isYou) return;
    setSelectedPlaceId(listing.placeId);
    setCompetitorLoading(true);
    const searchCategory = report?.category ?? activeCategory;
    const searchLocation = report?.location ?? activeLocation;
    void runSearch({
      competitorPlaceId: listing.placeId,
      category: searchCategory,
      location: searchLocation,
    });
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
            <h1 className="text-2xl font-bold text-gray-900">Rank Tracker</h1>
            <p className="mt-1 text-gray-600">Local Maps Rankings for:</p>
            <p className="text-lg font-semibold text-gray-900">
              {report?.query ? (
                <>&ldquo;{report.query}&rdquo;</>
              ) : searchHeading ? (
                <span className="text-gray-500">
                  &ldquo;{searchHeading}&rdquo; <span className="text-sm font-normal">(click Search)</span>
                </span>
              ) : (
                <span className="text-base font-normal text-gray-500">
                  Enter category and location, then click Search
                </span>
              )}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={busy || !canSearch || !searchCooldown.canRun}
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
              onSearch={handleSearch}
              searching={searching}
              disabled={busy}
              canRunSearch={searchCooldown.canRun}
              cooldownMessage={searchCooldown.message}
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
                  yourPosition={report.yourPosition}
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
