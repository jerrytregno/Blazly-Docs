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
import type { FetchReviewsProgress } from "@/lib/seo/client";

type Filter = "unanswered" | "answered";

const REVIEWS_PER_PAGE = 30;

export default function ReviewManagementPage() {
  const { reviews, business, dashboard, refreshReviews, saveReviews } = useData();
  const [filter, setFilter] = useState<Filter>("unanswered");
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [fetchProgress, setFetchProgress] = useState<FetchReviewsProgress | null>(null);
  const [filterInitialized, setFilterInitialized] = useState(false);
  const [visibleCount, setVisibleCount] = useState(REVIEWS_PER_PAGE);
  const autoFetchStarted = useRef(false);

  const businessPlaceId = parseGoogleMapsPlaceId(business?.mapsPlaceId);
  const reviewsStale =
    Boolean(businessPlaceId && reviews?.placeId && reviews.placeId !== businessPlaceId);
  const hasMapsLink = Boolean(business?.mapsPlaceId?.trim());

  const inbox = reviews?.inbox ?? [];
  const unanswered = useMemo(() => inbox.filter((r) => !r.replied), [inbox]);
  const answered = useMemo(() => inbox.filter((r) => r.replied), [inbox]);

  const totalOnGoogle =
    reviews?.totalOnGoogle ?? dashboard?.metrics.totalReviews ?? inbox.length;
  const loadedCount = inbox.length;

  const needsFullFetch = useMemo(() => {
    if (!hasMapsLink) return false;
    if (reviewsStale) return true;
    if (loadedCount === 0) return true;
    if (totalOnGoogle > 0 && loadedCount < totalOnGoogle) return true;
    return false;
  }, [hasMapsLink, reviewsStale, loadedCount, totalOnGoogle]);

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

  useEffect(() => {
    autoFetchStarted.current = false;
  }, [businessPlaceId]);

  useEffect(() => {
    if (!needsFullFetch || autoFetchStarted.current || refreshing) return;
    autoFetchStarted.current = true;
    void handleRefresh();
  }, [needsFullFetch, refreshing, handleRefresh]);

  useEffect(() => {
    if (!filterInitialized && inbox.length > 0 && !refreshing) {
      if (unanswered.length > 0) setFilter("unanswered");
      else if (answered.length > 0) setFilter("answered");
      setFilterInitialized(true);
    }
  }, [filterInitialized, inbox.length, unanswered.length, answered.length, refreshing]);

  useEffect(() => {
    setVisibleCount(REVIEWS_PER_PAGE);
  }, [filter]);

  const listReviews = filter === "unanswered" ? unanswered : answered;
  const visibleReviews = listReviews.slice(0, visibleCount);
  const hasMore = visibleCount < listReviews.length;

  const progressScanned = fetchProgress?.scanned ?? loadedCount;
  const progressUnanswered = fetchProgress?.unanswered ?? unanswered.length;
  const progressAnswered = fetchProgress?.answered ?? answered.length;
  const progressTotal = fetchProgress?.totalOnGoogle ?? totalOnGoogle;

  const avgRating =
    dashboard?.metrics.averageRating ??
    (inbox.length > 0
      ? Math.round((inbox.reduce((s, r) => s + r.rating, 0) / inbox.length) * 10) / 10
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

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "unanswered", label: "Unanswered", count: refreshing ? progressUnanswered : unanswered.length },
    { id: "answered", label: "Answered", count: refreshing ? progressAnswered : answered.length },
  ];

  const fetchButtonLabel = () => {
    if (!refreshing) return "Refresh reviews";
    if (!fetchProgress) return "Fetching all reviews…";
    const progressText = progressTotal
      ? `${progressScanned}/${progressTotal}`
      : `${progressScanned}`;
    return `Fetching… ${progressText}`;
  };

  const showBlockingLoader =
    hasMapsLink &&
    (refreshing || needsFullFetch) &&
    (loadedCount === 0 || (totalOnGoogle > 0 && loadedCount < totalOnGoogle));

  return (
    <PageDataGuard>
      <div className="space-y-6 pb-20 md:pb-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Management</h1>
            <p className="mt-1 text-gray-600">
              All Google reviews load automatically. Filter by answered or unanswered and reply with AI.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing || !hasMapsLink}
            className="gap-2"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {fetchButtonLabel()}
          </Button>
        </div>

        {!hasMapsLink && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              Add your Google Maps link in Business Settings so we can fetch reviews for the correct location.
            </CardContent>
          </Card>
        )}

        {reviewsStale && !refreshing && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-amber-900">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  These reviews may be from a different business. Refreshing after updating your Maps link.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {fetchError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-red-800">
              <span>{fetchError}</span>
              <Button size="sm" variant="outline" onClick={handleRefresh} disabled={refreshing}>
                Try again
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total on Google",
              value: String(progressTotal || "—"),
              icon: MessageSquare,
            },
            {
              label: "Answered",
              value: String(refreshing ? progressAnswered : answered.length),
              icon: MessageSquare,
            },
            {
              label: "Unanswered",
              value: String(refreshing ? progressUnanswered : unanswered.length),
              icon: MessageSquare,
              highlight: (refreshing ? progressUnanswered : unanswered.length) > 0,
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

        {showBlockingLoader ? (
          <Card className="border-gray-200 bg-white">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
              <p className="mt-4 font-medium text-gray-900">Loading all Google reviews</p>
              <p className="mt-1 text-sm text-gray-500">
                {progressTotal
                  ? `${progressScanned} of ${progressTotal} reviews fetched`
                  : `${progressScanned} reviews fetched so far`}
              </p>
              {fetchProgress && (
                <p className="mt-2 text-xs text-gray-400">
                  {progressUnanswered} unanswered · {progressAnswered} answered
                </p>
              )}
            </CardContent>
          </Card>
        ) : inbox.length === 0 ? (
          <Card className="border-gray-200 bg-white">
            <CardContent className="py-16 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-4 font-medium text-gray-900">No Google reviews found</p>
              <p className="mt-1 text-sm text-gray-500">
                {hasMapsLink
                  ? "We could not load reviews for this business. Try refreshing."
                  : "Add your Google Maps link in Business Settings first."}
              </p>
              {hasMapsLink && (
                <Button className="mt-6" onClick={handleRefresh} disabled={refreshing}>
                  Refresh reviews
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
                  {filter === "unanswered"
                    ? "Generate an AI reply, copy it, and post on Google Business Profile."
                    : "Reviews you have already replied to on Google."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                      filter === f.id
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
            </div>

            {listReviews.length === 0 ? (
              <p className="text-sm text-gray-500">
                {filter === "unanswered"
                  ? "No unanswered reviews."
                  : "No answered reviews yet."}
              </p>
            ) : (
              <div className="space-y-3">
                {visibleReviews.map((review) => (
                  <GoogleReviewCard
                    key={review.id}
                    review={review}
                    highlightUnanswered={!review.replied}
                    onMarkReplied={!review.replied ? markReplied : undefined}
                  />
                ))}
                {hasMore && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setVisibleCount((n) => n + REVIEWS_PER_PAGE)}
                    >
                      Load more ({listReviews.length - visibleCount} remaining)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </PageDataGuard>
  );
}
