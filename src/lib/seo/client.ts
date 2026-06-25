import type {
  BusinessDoc,
  DashboardDoc,
  RankingsDoc,
  ReviewItem,
  ReviewsDoc,
} from "@/types/firestore";
import {
  MAX_UNANSWERED_BATCHES,
  MAX_UNANSWERED_REVIEWS,
  reviewHasWrittenText,
} from "@/lib/seo/real-data";

export interface AnalyzeResponse {
  business: Partial<BusinessDoc>;
  dashboard: Partial<DashboardDoc>;
  rankings: Partial<RankingsDoc>;
  reviews: Partial<ReviewsDoc>;
  foundListing: boolean;
}

export async function fetchSeoAnalysis(input: {
  userId: string;
  businessName: string;
  website?: string;
  category?: string;
  location?: string;
  phone?: string;
  mapsPlaceId?: string;
  searchRegion?: string;
}): Promise<AnalyzeResponse> {
  const res = await fetch("/api/seo/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Analysis failed");
  }
  return data as AnalyzeResponse;
}

export interface FetchReviewsProgress {
  scanned: number;
  unanswered: number;
  answered: number;
  totalOnGoogle?: number;
  isComplete: boolean;
}

export interface FetchUnansweredReviewsResponse {
  reviews: Partial<ReviewsDoc>;
  newUnanswered: ReviewItem[];
  unansweredCount: number;
  answeredCount: number;
  placeTitle?: string;
  placeRating?: number;
  canLoadMore: boolean;
  unansweredBatchesLoaded: number;
}

interface FetchUnansweredReviewsApiResponse extends FetchUnansweredReviewsResponse {
  error?: string;
}

export async function fetchUnansweredReviews(input: {
  mapsPlaceId: string;
  searchRegion?: string;
  reset?: boolean;
  nextPageToken?: string;
  existingReviewIds?: string[];
  unansweredBatchesLoaded?: number;
  onProgress?: (progress: FetchReviewsProgress) => void;
}): Promise<FetchUnansweredReviewsResponse> {
  const res = await fetch("/api/reviews/fetch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mapsPlaceId: input.mapsPlaceId,
      searchRegion: input.searchRegion,
      mode: "unanswered_batch",
      reset: Boolean(input.reset),
      nextPageToken: input.reset ? undefined : input.nextPageToken,
      existingReviewIds: input.reset ? [] : input.existingReviewIds ?? [],
      unansweredBatchesLoaded: input.reset ? 0 : input.unansweredBatchesLoaded ?? 0,
    }),
  });

  const data = (await res.json()) as FetchUnansweredReviewsApiResponse;
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to fetch reviews");
  }

  input.onProgress?.({
    scanned: data.reviews.scannedCount ?? data.newUnanswered.length,
    unanswered: data.unansweredCount,
    answered: data.answeredCount,
    totalOnGoogle: data.reviews.totalOnGoogle,
    isComplete: !data.canLoadMore,
  });

  return data;
}

export function canLoadMoreUnansweredReviews(reviews: ReviewsDoc | null): boolean {
  if (!reviews) return false;
  const batches = reviews.unansweredBatchesLoaded ?? 0;
  const unanswered = reviews.inbox.filter(
    (r) => !r.replied && reviewHasWrittenText(r.text)
  ).length;
  if (batches >= MAX_UNANSWERED_BATCHES) return false;
  if (unanswered >= MAX_UNANSWERED_REVIEWS) return false;
  return true;
}
