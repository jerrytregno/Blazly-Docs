"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Loader2, MessageSquare, RefreshCw, Star } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { GoogleReviewCard } from "@/components/reviews/google-review-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { parseGoogleMapsPlaceId } from "@/lib/seo/maps-place";
import {
  canLoadMoreUnansweredReviews,
  canRefreshUnansweredReviews,
  isReviewWeeklyLimitReached,
  type FetchReviewsProgress,
} from "@/lib/seo/client";
import { getReviewLoadCooldownState } from "@/lib/seo/analysis-cooldown";
import {
  MAX_UNANSWERED_BATCHES,
  MAX_UNANSWERED_REVIEWS,
  reviewHasWrittenText,
} from "@/lib/seo/real-data";

export default function ReviewManagementPage() {
  const {
    reviews,
    business,
    dashboard,
    refreshReviews,
    loadMoreUnansweredReviews,
    saveReviews,
  } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [fetchProgress, setFetchProgress] = useState<FetchReviewsProgress | null>(null);
  const autoFetchStarted = useRef(false);

  const businessPlaceId = parseGoogleMapsPlaceId(business?.mapsPlaceId);
  const reviewsStale =
    Boolean(businessPlaceId && reviews?.placeId && reviews.placeId !== businessPlaceId);
  const hasMapsLink = Boolean(business?.mapsPlaceId?.trim());

  const inbox = reviews?.inbox ?? [];
  const unansweredWritten = useMemo(
    () => inbox.filter((r) => !r.replied && reviewHasWrittenText(r.text)),
    [inbox]
  );

  const totalOnGoogle =
    reviews?.totalOnGoogle ?? dashboard?.metrics.totalReviews ?? inbox.length;
  const batchesLoaded = reviews?.unansweredBatchesLoaded ?? 0;
  const canLoadMore = canLoadMoreUnansweredReviews(reviews);
  const canRefresh = canRefreshUnansweredReviews(reviews);
  const reviewCooldown = useMemo(
    () => getReviewLoadCooldownState(reviews?.fetchedAt),
    [reviews?.fetchedAt]
  );
  const atWeeklyLimit = isReviewWeeklyLimitReached(reviews);
  const showWeeklyMessage =
    Boolean(reviews?.fetchedAt) &&
    !reviewCooldown.canRun &&
    (atWeeklyLimit || !canLoadMore);

  const needsInitialFetch = useMemo(() => {
    if (!hasMapsLink) return false;
    if (reviewsStale) return true;
    if (unansweredWritten.length === 0 && batchesLoaded === 0) return true;
    return false;
  }, [hasMapsLink, reviewsStale, unansweredWritten.length, batchesLoaded]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setFetchError("");
    setFetchProgress(null);
    try {
      await refreshReviews((progress) => {
        setFetchProgress(progress);
      });
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to fetch reviews");
    } finally {
      setRefreshing(false);
      setFetchProgress(null);
    }
  }, [refreshReviews]);

  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true);
    setFetchError("");
    try {
      await loadMoreUnansweredReviews((progress) => {
        setFetchProgress(progress);
      });
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to load more reviews");
    } finally {
      setLoadingMore(false);
      setFetchProgress(null);
    }
  }, [loadMoreUnansweredReviews]);

  useEffect(() => {
    autoFetchStarted.current = false;
  }, [businessPlaceId]);

  useEffect(() => {
    if (!needsInitialFetch || autoFetchStarted.current || refreshing) return;
    autoFetchStarted.current = true;
    void handleRefresh();
  }, [needsInitialFetch, refreshing, handleRefresh]);

  const busy = refreshing || loadingMore;

  const avgRating =
    dashboard?.metrics.averageRating ??
    (unansweredWritten.length > 0
      ? Math.round(
          (unansweredWritten.reduce((s, r) => s + r.rating, 0) / unansweredWritten.length) * 10
        ) / 10
      : 0);

  const markReplied = async (id: string) => {
    if (!reviews) return;
    const updated = reviews.inbox.map((r) =>
      r.id === id ? { ...r, replied: true } : r
    );
    await saveReviews({
      inbox: updated,
      answeredCount: updated.filter((r) => r.replied).length,
    });
  };

  const showInitialLoader =
    hasMapsLink && needsInitialFetch && refreshing && unansweredWritten.length === 0;

  return (
    <PageDataGuard>
      <div className="space-y-6 pb-20 md:pb-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Management</h1>
            <p className="mt-1 text-gray-600">
              Loads up to {MAX_UNANSWERED_REVIEWS} unanswered written reviews from Google. Reply
              with AI and post on Google Business Profile.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canLoadMore && (
              <Button
                onClick={handleLoadMore}
                disabled={busy || !hasMapsLink}
                className="gap-2"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Load more unanswered
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={busy || !hasMapsLink || !canRefresh}
              className="gap-2"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {refreshing ? "Refreshing…" : `Refresh latest ${MAX_UNANSWERED_REVIEWS}`}
            </Button>
          </div>
        </div>

        {showWeeklyMessage && reviewCooldown.message && (
          <p className="text-sm text-amber-700">{reviewCooldown.message}</p>
        )}

        {!hasMapsLink && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              Add your Google Maps link in Business Settings so we can fetch reviews for the correct location.
            </CardContent>
          </Card>
        )}

        {reviewsStale && !busy && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-amber-900">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  These reviews may be from a different business. Refresh after updating your Maps link.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {fetchError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-red-800">
              <span>{fetchError}</span>
              <Button size="sm" variant="outline" onClick={handleRefresh} disabled={busy}>
                Try again
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total on Google",
              value: String(totalOnGoogle || "—"),
              icon: MessageSquare,
            },
            {
              label: "Loaded unanswered",
              value: `${unansweredWritten.length}/${MAX_UNANSWERED_REVIEWS}`,
              icon: MessageSquare,
            },
            {
              label: "Batches loaded",
              value: `${batchesLoaded}/${MAX_UNANSWERED_BATCHES}`,
              icon: MessageSquare,
              highlight: unansweredWritten.length > 0,
            },
            {
              label: "Average rating",
              value: avgRating ? `${avgRating}★` : "—",
              icon: Star,
            },
          ].map((stat) => (
            <Card key={stat.label} className="border-gray-200 bg-white">
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    stat.highlight ? "bg-amber-100 text-amber-700" : "bg-indigo-50 text-indigo-600"
                  )}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {showInitialLoader ? (
          <Card className="border-gray-200 bg-white">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
              <p className="mt-4 font-medium text-gray-900">Loading unanswered reviews</p>
              <p className="mt-1 text-sm text-gray-500">
                Fetching up to {MAX_UNANSWERED_REVIEWS} newest written reviews without owner replies
              </p>
            </CardContent>
          </Card>
        ) : unansweredWritten.length === 0 && !busy ? (
          <Card className="border-gray-200 bg-white">
            <CardContent className="py-16 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-4 font-medium text-gray-900">No written unanswered reviews</p>
              <p className="mt-1 text-sm text-gray-500">
                {hasMapsLink
                  ? "No unanswered reviews with text in this batch. Load more or refresh to check older reviews."
                  : "Add your Google Maps link in Business Settings first."}
              </p>
              {hasMapsLink && canLoadMore && (
                <Button className="mt-6" onClick={handleLoadMore} disabled={busy}>
                  Load more unanswered
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Google reviews</h2>
                <p className="text-sm text-gray-500">
                  {unansweredWritten.length} unanswered written review
                  {unansweredWritten.length === 1 ? "" : "s"} (max {MAX_UNANSWERED_REVIEWS}).
                </p>
              </div>
              {canLoadMore && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={busy}
                  className="gap-2"
                >
                  {loadingMore ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  Load more unanswered
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {unansweredWritten.map((review) => (
                <GoogleReviewCard
                  key={review.id}
                  review={review}
                  highlightUnanswered
                  onMarkReplied={markReplied}
                />
              ))}
            </div>

            {canLoadMore && (
              <div className="flex flex-col items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={busy}
                  className="gap-2"
                >
                  {loadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Load more unanswered
                </Button>
                <p className="text-xs text-gray-500">
                  {canLoadMore
                    ? "More unanswered written reviews are available on Google."
                    : ""}
                  {fetchProgress && loadingMore
                    ? `${canLoadMore ? " · " : ""}Scanned ${fetchProgress.scanned} on Google`
                    : ""}
                </p>
              </div>
            )}

            {!canLoadMore && batchesLoaded > 0 && (
              <p className="text-center text-xs text-gray-500">
                {showWeeklyMessage
                  ? reviewCooldown.message
                  : unansweredWritten.length >= MAX_UNANSWERED_REVIEWS
                    ? `Showing the maximum of ${MAX_UNANSWERED_REVIEWS} unanswered written reviews.`
                    : batchesLoaded >= MAX_UNANSWERED_BATCHES
                      ? "All 5 batches loaded. After 1 week you can refresh to load the next 100 unanswered reviews."
                      : "No more unanswered written reviews to load from Google."}
              </p>
            )}
          </section>
        )}
      </div>
    </PageDataGuard>
  );
}
