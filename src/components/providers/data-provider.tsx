"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
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
import { fetchGoogleReviews, fetchSeoAnalysis, type FetchReviewsProgress } from "@/lib/seo/client";
import { resolveSearchLocation } from "@/lib/seo/analysis-location";
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
  refresh: () => Promise<void>;
  runAnalysis: (override?: Partial<BusinessDoc> & { searchRegion?: string }) => Promise<void>;
  refreshReviews: (onProgress?: (progress: FetchReviewsProgress) => void) => Promise<void>;
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
    async (override?: Partial<BusinessDoc> & { searchRegion?: string }) => {
      if (!user || analyzing) return;
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
    [user, business, dashboard, searchRegion, analyzing]
  );

  const refreshReviews = useCallback(
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

    const result = await fetchGoogleReviews({
      mapsPlaceId,
      searchRegion: activeRegion,
      onProgress,
    });

    const inbox = result.reviews.inbox ?? [];
    const reviewUpdate: Partial<ReviewsDoc> = {
      ...result.reviews,
      inbox: inbox.length > 200 ? compactReviewsForStorage(inbox) : inbox,
      answeredCount: result.answeredCount,
    };

    try {
      await updateReviews(user.uid, reviewUpdate);
    } catch (error) {
      console.error("Failed to persist reviews to Firestore:", error);
    }
    setReviews((prev) =>
      prev
        ? {
            ...prev,
            ...reviewUpdate,
            inbox,
          }
        : prev
    );

    if (result.placeRating != null || result.reviews.totalOnGoogle != null) {
      const metrics = {
        ...(result.reviews.totalOnGoogle != null
          ? { totalReviews: result.reviews.totalOnGoogle }
          : {}),
        ...(result.placeRating != null ? { averageRating: result.placeRating } : {}),
      };
      if (Object.keys(metrics).length > 0) {
        await updateDashboard(user.uid, {
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
  },
    [user, business, dashboard, searchRegion]
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
      runAnalysis().finally(() => {
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
        refresh,
        runAnalysis,
        refreshReviews,
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
