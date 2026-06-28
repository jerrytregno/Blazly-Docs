"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { getUserProfile } from "@/lib/user-profile";
import {
  loadAllUserData,
  updateBusiness,
  updateDashboard,
  updateProfileOptimization,
  updateReviews,
  updateRankings,
} from "@/lib/firestore/collections";
import { fetchUnansweredReviews, fetchSeoAnalysis, type FetchReviewsProgress } from "@/lib/seo/client";
import { getReviewLoadCooldownState } from "@/lib/seo/analysis-cooldown";
import { MAX_UNANSWERED_REVIEWS, reviewHasWrittenText } from "@/lib/seo/real-data";
import { resolveSearchLocation } from "@/lib/seo/analysis-location";
import { getAnalysisCooldownState } from "@/lib/seo/analysis-cooldown";
import {
  DEFAULT_SEARCH_REGION,
  resolveSearchRegionId,
} from "@/lib/seo/search-regions";
import { normalizeUserWebsite } from "@/lib/seo/maps-place";
import type {
  BusinessDoc,
  DashboardDoc,
  ProfileOptimizationDoc,
  RankingsDoc,
  ReviewItem,
  ReviewsDoc,
} from "@/types/firestore";

interface DataContextValue {
  loading: boolean;
  error: string | null;
  analyzing: boolean;
  analysisError: string | null;
  business: BusinessDoc | null;
  dashboard: DashboardDoc | null;
  reviews: ReviewsDoc | null;
  rankings: RankingsDoc | null;
  profileOptimization: ProfileOptimizationDoc | null;
  searchRegion: string;
  canRerunAnalysis: boolean;
  analysisCooldownMessage: string | null;
  refresh: () => Promise<void>;
  runAnalysis: (
    override?: Partial<BusinessDoc> & { searchRegion?: string },
    options?: { skipCooldown?: boolean }
  ) => Promise<void>;
  refreshReviews: (onProgress?: (progress: FetchReviewsProgress) => void) => Promise<void>;
  loadMoreUnansweredReviews: (onProgress?: (progress: FetchReviewsProgress) => void) => Promise<void>;
  saveBusiness: (data: Partial<BusinessDoc>) => Promise<void>;
  saveDashboard: (data: Partial<DashboardDoc>) => Promise<void>;
  saveReviews: (data: Partial<ReviewsDoc>) => Promise<void>;
  saveRankings: (data: Partial<RankingsDoc>) => Promise<void>;
  saveProfileOptimization: (data: Partial<ProfileOptimizationDoc>) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

function compactReviewsForStorage(inbox: ReviewItem[]): ReviewItem[] {
  return inbox.map((review) => ({
    ...review,
    text:
      review.text.length > 500 ? `${review.text.slice(0, 497)}...` : review.text,
  }));
}

function mergeUnansweredBatches(
  existing: ReviewItem[],
  newBatch: ReviewItem[]
): ReviewItem[] {
  const answered = existing.filter((r) => r.replied);
  const byId = new Map<string, ReviewItem>();
  for (const r of existing.filter((r) => !r.replied)) {
    byId.set(r.id, r);
  }
  for (const r of newBatch.filter((r) => !r.replied)) {
    byId.set(r.id, r);
  }
  const unanswered = Array.from(byId.values()).slice(0, MAX_UNANSWERED_REVIEWS);
  return [...unanswered, ...answered];
}

async function persistReviewFetch(
  userId: string,
  result: Awaited<ReturnType<typeof fetchUnansweredReviews>>,
  inbox: ReviewItem[],
  dashboard: DashboardDoc | null,
  setReviews: Dispatch<SetStateAction<ReviewsDoc | null>>,
  setDashboard: Dispatch<SetStateAction<DashboardDoc | null>>
) {
  const reviewUpdate: Partial<ReviewsDoc> = {
    ...result.reviews,
    inbox: compactReviewsForStorage(inbox),
    answeredCount: inbox.filter((r) => r.replied).length,
    nextPageToken: result.reviews.nextPageToken,
    unansweredBatchesLoaded: result.unansweredBatchesLoaded,
  };

  try {
    await updateReviews(userId, reviewUpdate);
  } catch (error) {
    console.error("Failed to persist reviews to Firestore:", error);
  }

  setReviews((prev) => ({
    userId,
    campaigns: prev?.campaigns ?? [],
    reviewGoal: prev?.reviewGoal ?? { needed: 10, target: "local leader", currentGap: 0 },
    ...prev,
    ...reviewUpdate,
    inbox,
  }));

  if (result.placeRating != null || result.reviews.totalOnGoogle != null) {
    const metrics = {
      ...(result.reviews.totalOnGoogle != null
        ? { totalReviews: result.reviews.totalOnGoogle }
        : {}),
      ...(result.placeRating != null ? { averageRating: result.placeRating } : {}),
    };
    if (Object.keys(metrics).length > 0) {
      await updateDashboard(userId, {
        metrics: {
          ...(dashboard?.metrics ?? {}),
          ...metrics,
        } as DashboardDoc["metrics"],
      });
      setDashboard((prev) =>
        prev
          ? {
              ...prev,
              metrics: { ...prev.metrics, ...metrics },
            }
          : prev
      );
    }
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [business, setBusiness] = useState<BusinessDoc | null>(null);
  const [dashboard, setDashboard] = useState<DashboardDoc | null>(null);
  const [reviews, setReviews] = useState<ReviewsDoc | null>(null);
  const [rankings, setRankings] = useState<RankingsDoc | null>(null);
  const [profileOptimization, setProfileOptimization] =
    useState<ProfileOptimizationDoc | null>(null);
  const [searchRegion, setSearchRegionState] = useState(DEFAULT_SEARCH_REGION);
  const analysisQueued = useRef(false);

  const analysisCooldown = useMemo(
    () => getAnalysisCooldownState(dashboard?.lastAnalyzedAt),
    [dashboard?.lastAnalyzedAt]
  );

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [data, profile] = await Promise.all([
        loadAllUserData(user.uid),
        getUserProfile(user.uid),
      ]);

      const userWebsite = normalizeUserWebsite(
        data.business?.userWebsite || data.business?.website || profile?.website
      );

      setBusiness(
        data.business
          ? {
              ...data.business,
              userWebsite: userWebsite || data.business.userWebsite,
              website: userWebsite || data.business.website,
            }
          : null
      );
      setDashboard(data.dashboard);
      setReviews(data.reviews);
      setRankings(data.rankings);
      setProfileOptimization(data.profileOptimization);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const runAnalysis = useCallback(
    async (
      override?: Partial<BusinessDoc> & { searchRegion?: string },
      options?: { skipCooldown?: boolean }
    ) => {
      if (!user || analyzing) return;
      if (!options?.skipCooldown && !analysisCooldown.canRun) return;
      const { searchRegion: regionOverride, ...businessOverride } = override ?? {};
      const source = business ? { ...business, ...businessOverride } : null;
      if (!source?.name) return;

      const activeRegion =
        regionOverride ??
        resolveSearchRegionId(dashboard?.searchRegion ?? searchRegion, source.country);

      setAnalyzing(true);
      setAnalysisError(null);

      await updateDashboard(user.uid, {
        analysisStatus: "analyzing",
        analysisError: null,
      }).catch(() => {});
      setDashboard((prev) =>
        prev ? { ...prev, analysisStatus: "analyzing", analysisError: null } : prev
      );

      try {
        const result = await fetchSeoAnalysis({
          userId: user.uid,
          businessName: source.name,
          website: normalizeUserWebsite(source.userWebsite || source.website),
          category: source.primaryCategory,
          location: resolveSearchLocation(source),
          phone: source.phone || undefined,
          mapsPlaceId: source.mapsPlaceId || source.businessId || undefined,
          searchRegion: activeRegion,
        });

        await Promise.all([
          updateBusiness(user.uid, result.business),
          updateDashboard(user.uid, result.dashboard),
          updateRankings(user.uid, result.rankings),
          updateReviews(user.uid, result.reviews),
          ...(result.profileOptimization
            ? [updateProfileOptimization(user.uid, result.profileOptimization)]
            : []),
        ]);

        setBusiness((prev) =>
          prev
            ? {
                ...prev,
                ...result.business,
                userWebsite:
                  normalizeUserWebsite(
                    result.business.userWebsite ||
                      prev.userWebsite ||
                      result.business.website
                  ) || prev.userWebsite,
                website:
                  normalizeUserWebsite(
                    result.business.userWebsite ||
                      prev.userWebsite ||
                      result.business.website
                  ) || prev.website,
                napAudit: result.business.napAudit ?? prev.napAudit,
                gbpAuditChecklist:
                  result.business.gbpAuditChecklist ?? prev.gbpAuditChecklist,
              }
            : prev
        );
        setDashboard((prev) =>
          prev
            ? {
                ...prev,
                ...result.dashboard,
                searchRegion: activeRegion,
                metrics: { ...prev.metrics, ...result.dashboard.metrics! },
              }
            : prev
        );
        setRankings((prev) =>
          prev
            ? {
                ...prev,
                ...result.rankings,
                keywords: result.rankings.keywords ?? prev.keywords,
                napAudit: result.rankings.napAudit ?? prev.napAudit,
                rankTrackerSeed: result.rankings.rankTrackerSeed ?? prev.rankTrackerSeed,
              }
            : prev
        );
        setReviews((prev) =>
          prev
            ? {
                ...prev,
                ...result.reviews,
                inbox: result.reviews.inbox ?? prev.inbox,
              }
            : prev
        );
        if (result.profileOptimization) {
          setProfileOptimization((prev) =>
            prev
              ? { ...prev, ...result.profileOptimization }
              : ({ userId: user.uid, ...result.profileOptimization } as ProfileOptimizationDoc)
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Analysis failed";
        setAnalysisError(message);
        await updateDashboard(user.uid, {
          analysisStatus: "error",
          analysisError: message,
        }).catch(() => {});
        setDashboard((prev) =>
          prev
            ? { ...prev, analysisStatus: "error", analysisError: message }
            : prev
        );
      } finally {
        setAnalyzing(false);
      }
    },
    [user, business, dashboard, searchRegion, analyzing, analysisCooldown.canRun]
  );

  const refreshReviews = useCallback(
    async (onProgress?: (progress: FetchReviewsProgress) => void) => {
      if (!user) return;
      const mapsPlaceId = business?.mapsPlaceId?.trim();
      if (!mapsPlaceId) {
        throw new Error("Add a Google Maps link in Business Settings first.");
      }

      const cooldown = getReviewLoadCooldownState(reviews?.fetchedAt);
      if ((reviews?.unansweredBatchesLoaded ?? 0) > 0 && reviews?.fetchedAt && !cooldown.canRun) {
        throw new Error(cooldown.message ?? "After 1 week you can load next 100 unanswered reviews.");
      }

      const activeRegion = resolveSearchRegionId(
        dashboard?.searchRegion ?? searchRegion,
        business?.country
      );

      const result = await fetchUnansweredReviews({
        mapsPlaceId,
        searchRegion: activeRegion,
        reset: true,
        fetchedAt: reviews?.fetchedAt,
        onProgress,
      });

      const inbox = result.newUnanswered;
      await persistReviewFetch(
        user.uid,
        result,
        inbox,
        dashboard,
        setReviews,
        setDashboard
      );
    },
    [user, business, dashboard, searchRegion, reviews]
  );

  const loadMoreUnansweredReviews = useCallback(
    async (onProgress?: (progress: FetchReviewsProgress) => void) => {
      if (!user) return;
      const mapsPlaceId = business?.mapsPlaceId?.trim();
      if (!mapsPlaceId) {
        throw new Error("Add a Google Maps link in Business Settings first.");
      }

      const activeRegion = resolveSearchRegionId(
        dashboard?.searchRegion ?? searchRegion,
        business?.country
      );

      const existingInbox = reviews?.inbox ?? [];
      const currentUnansweredCount = existingInbox.filter(
        (r) => !r.replied && reviewHasWrittenText(r.text)
      ).length;
      const result = await fetchUnansweredReviews({
        mapsPlaceId,
        searchRegion: activeRegion,
        reset: false,
        nextPageToken: reviews?.nextPageToken,
        existingReviewIds: existingInbox.map((r) => r.id),
        unansweredBatchesLoaded: reviews?.unansweredBatchesLoaded ?? 0,
        currentUnansweredCount,
        onProgress,
      });

      const inbox = mergeUnansweredBatches(existingInbox, result.newUnanswered);
      await persistReviewFetch(
        user.uid,
        result,
        inbox,
        dashboard,
        setReviews,
        setDashboard
      );
    },
    [user, business, dashboard, searchRegion, reviews]
  );

  useEffect(() => {
    if (!user) {
      setBusiness(null);
      setDashboard(null);
      setReviews(null);
      setRankings(null);
      setLoading(false);
      return;
    }
    refresh();
  }, [user, refresh]);

  useEffect(() => {
    if (dashboard || business) {
      setSearchRegionState(
        resolveSearchRegionId(dashboard?.searchRegion, business?.country)
      );
    }
  }, [dashboard?.searchRegion, business?.country]);

  useEffect(() => {
    if (loading || !business || !dashboard || analyzing) return;
    const needsAnalysis =
      dashboard.analysisStatus === "pending" ||
      (dashboard.metrics.overallScore === 0 &&
        dashboard.analysisStatus !== "complete");

    if (needsAnalysis && !analysisQueued.current) {
      analysisQueued.current = true;
      runAnalysis(undefined, { skipCooldown: true }).finally(() => {
        analysisQueued.current = false;
      });
    }
  }, [loading, business, dashboard, analyzing, runAnalysis]);

  const saveBusiness = async (data: Partial<BusinessDoc>) => {
    if (!user) return;
    await updateBusiness(user.uid, data);
    setBusiness((prev) => (prev ? { ...prev, ...data } : prev));
    analysisQueued.current = false;
    await runAnalysis(data);
  };

  const saveDashboard = async (data: Partial<DashboardDoc>) => {
    if (!user) return;
    await updateDashboard(user.uid, data);
    setDashboard((prev) => (prev ? { ...prev, ...data } : prev));
  };

  const saveReviews = async (data: Partial<ReviewsDoc>) => {
    if (!user) return;
    await updateReviews(user.uid, data);
    setReviews((prev) => (prev ? { ...prev, ...data } : prev));
  };

  const saveRankings = async (data: Partial<RankingsDoc>) => {
    if (!user) return;
    await updateRankings(user.uid, data);
    setRankings((prev) => (prev ? { ...prev, ...data } : prev));
  };

  const saveProfileOptimization = async (data: Partial<ProfileOptimizationDoc>) => {
    if (!user) return;
    await updateProfileOptimization(user.uid, data);
    setProfileOptimization((prev) => (prev ? { ...prev, ...data } : prev));
  };

  return (
    <DataContext.Provider
      value={{
        loading,
        error,
        analyzing,
        analysisError,
        business,
        dashboard,
        reviews,
        rankings,
        profileOptimization,
        searchRegion,
        canRerunAnalysis: analysisCooldown.canRun,
        analysisCooldownMessage: analysisCooldown.message,
        refresh,
        runAnalysis,
        refreshReviews,
        loadMoreUnansweredReviews,
        saveBusiness,
        saveDashboard,
        saveReviews,
        saveRankings,
        saveProfileOptimization,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
