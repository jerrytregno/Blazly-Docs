import type {
  BusinessDoc,
  DashboardDoc,
  RankingsDoc,
  ReviewItem,
  ReviewsDoc,
} from "@/types/firestore";

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

export interface FetchReviewsResponse {
  reviews: Partial<ReviewsDoc>;
  unansweredCount: number;
  answeredCount: number;
  placeTitle?: string;
  placeRating?: number;
}

interface FetchReviewsChunkResponse {
  reviews: Partial<ReviewsDoc>;
  reviewsInBatch?: ReviewItem[];
  unansweredInBatch: ReviewItem[];
  answeredInBatch: ReviewItem[];
  scannedInBatch: number;
  placeTitle?: string;
  placeRating?: number;
  nextPageToken?: string;
  isComplete: boolean;
  error?: string;
}

const PAGES_PER_REQUEST = 25;

export async function fetchGoogleReviews(input: {
  mapsPlaceId: string;
  searchRegion?: string;
  onProgress?: (progress: FetchReviewsProgress) => void;
}): Promise<FetchReviewsResponse> {
  const allReviews: ReviewItem[] = [];
  const seenIds = new Set<string>();
  let nextPageToken: string | undefined;
  let totalAnswered = 0;
  let totalUnanswered = 0;
  let totalScanned = 0;
  let meta: Partial<ReviewsDoc> = {};
  let placeTitle: string | undefined;
  let placeRating: number | undefined;
  let isComplete = false;

  while (true) {
    const res = await fetch("/api/reviews/fetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mapsPlaceId: input.mapsPlaceId,
        searchRegion: input.searchRegion,
        nextPageToken,
        maxPages: PAGES_PER_REQUEST,
      }),
    });

    const data = (await res.json()) as FetchReviewsChunkResponse;
    if (!res.ok) {
      throw new Error(data.error ?? "Failed to fetch reviews");
    }

    const batchReviews =
      data.reviewsInBatch ??
      [...(data.unansweredInBatch ?? []), ...(data.answeredInBatch ?? [])];

    for (const review of batchReviews) {
      if (seenIds.has(review.id)) continue;
      seenIds.add(review.id);
      allReviews.push(review);
      if (review.replied) totalAnswered++;
      else totalUnanswered++;
    }

    meta = { ...meta, ...data.reviews };
    totalScanned = allReviews.length;
    placeTitle = data.placeTitle ?? placeTitle;
    placeRating = data.placeRating ?? placeRating;
    isComplete = data.isComplete;
    nextPageToken = data.nextPageToken;

    input.onProgress?.({
      scanned: totalScanned,
      unanswered: totalUnanswered,
      answered: totalAnswered,
      totalOnGoogle: meta.totalOnGoogle,
      isComplete: isComplete && !nextPageToken,
    });

    if (isComplete || !nextPageToken) break;
  }

  return {
    reviews: {
      ...meta,
      inbox: allReviews,
      scannedCount: totalScanned,
      answeredCount: totalAnswered,
      totalOnGoogle: meta.totalOnGoogle,
      fetchedAt: new Date().toISOString(),
    },
    unansweredCount: totalUnanswered,
    answeredCount: totalAnswered,
    placeTitle,
    placeRating,
  };
}
