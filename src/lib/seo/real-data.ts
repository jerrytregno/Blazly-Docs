import type { LocalBusiness } from "@/types";
import type {
  GeoGridScan,
  Keyword,
  KeywordGroup,
  ReviewItem,
  ReviewSentiment,
  ActivityItem,
  StrategistTask,
  StrategistRecommendation,
} from "@/types/firestore";
import {
  fetchGoogleMapsReviews,
  searchAtCoordinates,
  type GoogleMapsReview,
  type GoogleMapsReviewsResponse,
} from "@/lib/searchapi";
import { findBestBusinessMatch } from "./match-business";

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function openHoursToWeekly(listing: LocalBusiness | null) {
  if (!listing?.open_hours) return null;
  return DAY_ORDER.map((day) => {
    const key = Object.keys(listing.open_hours!).find(
      (k) => k.toLowerCase() === day
    );
    return {
      day: day.charAt(0).toUpperCase() + day.slice(1),
      hours: key ? listing.open_hours![key] : "Closed",
    };
  });
}

export function imageCountFromListing(listing: LocalBusiness | null): number {
  if (!listing?.images?.length) return listing?.thumbnail ? 1 : 0;
  return listing.images.length;
}

function stripReviewHtml(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .trim();
}

function reviewBody(r: GoogleMapsReview): string {
  const raw = r.text ?? r.snippet ?? r.description ?? "";
  return stripReviewHtml(raw);
}

function hasOwnerResponse(r: GoogleMapsReview): boolean {
  if (r.owner_response_text?.trim()) return true;
  const resp = r.response;
  if (!resp) return false;
  if (resp.text?.trim()) return true;
  if (resp.snippet?.trim()) return true;
  if (resp.extracted_snippet?.original?.trim()) return true;
  if (resp.extracted_snippet?.translated?.trim()) return true;
  return false;
}

function formatReviewDate(r: GoogleMapsReview): string {
  if (r.date?.trim()) return r.date.trim();
  const iso = r.iso_date;
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function reviewHasWrittenText(text?: string | null): boolean {
  return Boolean(text?.trim());
}

export function reviewsToInbox(
  reviews: GoogleMapsReview[],
  placeId: string
): ReviewItem[] {
  return reviews.map((r, i) => ({
    id: r.review_id ?? `${placeId}-${i}`,
    author: r.user?.name ?? "Google User",
    rating: r.rating ?? 0,
    text: reviewBody(r),
    source: r.source ?? "Google",
    date: formatReviewDate(r),
    replied: hasOwnerResponse(r),
  }));
}

export interface FetchGoogleReviewsResult {
  inbox: ReviewItem[];
  unanswered: ReviewItem[];
  answered: ReviewItem[];
  sentiment: ReviewSentiment;
  histogram?: Record<string, number>;
  placeRating?: number;
  placeReviewCount?: number;
  placeTitle?: string;
  scannedCount: number;
  answeredCount: number;
  placeId: string;
  fetchedAt: string;
  nextPageToken?: string;
  isComplete: boolean;
}

const REVIEWS_PER_PAGE = 20;
const DEFAULT_CHUNK_PAGES = 10;
const MAX_PAGES_SAFETY = 500;

export const UNANSWERED_BATCH_SIZE = 20;
export const MAX_UNANSWERED_BATCHES = 5;
export const MAX_UNANSWERED_REVIEWS = 100;
const MAX_PAGES_PER_UNANSWERED_BATCH = 15;

function reviewStableId(r: GoogleMapsReview, placeId: string, index: number): string {
  return r.review_id ?? `${placeId}-${index}`;
}

function extractNextReviewPageToken(
  data: GoogleMapsReviewsResponse
): string | undefined {
  return (
    data.pagination?.next_page_token ??
    (data as GoogleMapsReviewsResponse & { next_page_token?: string }).next_page_token
  );
}

/** Fetch up to 20 new unanswered reviews (one user batch). */
export async function fetchUnansweredReviewsBatch(
  placeId: string,
  options: {
    gl?: string;
    nextPageToken?: string;
    existingIds?: string[];
    targetCount?: number;
  } = {}
): Promise<FetchGoogleReviewsResult> {
  const target = options.targetCount ?? UNANSWERED_BATCH_SIZE;
  const seen = new Set(options.existingIds ?? []);
  const batchUnanswered: GoogleMapsReview[] = [];
  let nextToken = options.nextPageToken;
  let placeMeta: GoogleMapsReviewsResponse["place_result"];
  let histogram: Record<string, number> | undefined;
  let pagesFetched = 0;
  let reviewsScanned = 0;
  let answeredScanned = 0;

  while (
    batchUnanswered.length < target &&
    pagesFetched < MAX_PAGES_PER_UNANSWERED_BATCH
  ) {
    const data = await fetchGoogleMapsReviews(placeId, {
      sort_by: "newest",
      num: REVIEWS_PER_PAGE,
      next_page_token: nextToken,
      gl: options.gl,
    });

    if (data.error) {
      throw new Error(data.error);
    }

    if (!placeMeta) {
      placeMeta = data.place_result;
      histogram = data.place_result?.reviews_histogram;
    }

    const batch = data.reviews ?? [];
    if (batch.length === 0) {
      nextToken = undefined;
      break;
    }

    for (let i = 0; i < batch.length; i++) {
      const review = batch[i];
      reviewsScanned++;
      if (hasOwnerResponse(review)) {
        answeredScanned++;
        continue;
      }
      const body = reviewBody(review);
      if (!body.trim()) continue;

      const id = reviewStableId(review, placeId, reviewsScanned);
      if (seen.has(id)) continue;
      seen.add(id);
      batchUnanswered.push(review);
      if (batchUnanswered.length >= target) break;
    }

    pagesFetched++;
    nextToken = extractNextReviewPageToken(data);
    if (!nextToken) break;
  }

  const unanswered = reviewsToInbox(batchUnanswered, placeId);

  return {
    inbox: unanswered,
    unanswered,
    answered: [],
    sentiment: histogramToSentiment(histogram),
    histogram,
    placeRating: placeMeta?.rating,
    placeReviewCount: placeMeta?.reviews,
    placeTitle: placeMeta?.title,
    scannedCount: reviewsScanned,
    answeredCount: answeredScanned,
    placeId,
    fetchedAt: new Date().toISOString(),
    nextPageToken: nextToken,
    isComplete: !nextToken,
  };
}

export async function fetchGoogleReviewsChunk(
  placeId: string,
  options: {
    gl?: string;
    nextPageToken?: string;
    maxPages?: number;
    unansweredOnly?: boolean;
  } = {}
): Promise<FetchGoogleReviewsResult> {
  const maxPages = options.maxPages ?? DEFAULT_CHUNK_PAGES;
  const unansweredOnly = options.unansweredOnly ?? true;
  const collected: GoogleMapsReview[] = [];
  const unansweredRaw: GoogleMapsReview[] = [];
  let answeredInChunk = 0;
  let reviewsInChunk = 0;
  let placeMeta: GoogleMapsReviewsResponse["place_result"];
  let histogram: Record<string, number> | undefined;
  let nextToken = options.nextPageToken;
  let pagesFetched = 0;

  while (pagesFetched < maxPages) {
    const data = await fetchGoogleMapsReviews(placeId, {
      sort_by: "newest",
      num: REVIEWS_PER_PAGE,
      next_page_token: nextToken,
      gl: options.gl,
    });

    if (data.error) {
      throw new Error(data.error);
    }

    if (!placeMeta) {
      placeMeta = data.place_result;
      histogram = data.place_result?.reviews_histogram;
    }

    const batch = data.reviews ?? [];
    if (batch.length === 0) {
      nextToken = undefined;
      break;
    }

    for (const review of batch) {
      reviewsInChunk++;
      if (hasOwnerResponse(review)) {
        answeredInChunk++;
        collected.push(review);
      } else {
        unansweredRaw.push(review);
        collected.push(review);
      }
    }

    pagesFetched++;
    nextToken = extractNextReviewPageToken(data);
    if (!nextToken) break;
  }

  const totalOnGoogle = placeMeta?.reviews;
  const hitSafetyCap = pagesFetched >= maxPages && Boolean(nextToken);

  const sourceReviews = unansweredOnly ? unansweredRaw : collected;
  const inbox = reviewsToInbox(sourceReviews, placeId);
  const unanswered = reviewsToInbox(unansweredRaw, placeId);
  const answered = reviewsToInbox(
    collected.filter((r) => hasOwnerResponse(r)),
    placeId
  );

  return {
    inbox,
    unanswered,
    answered,
    sentiment: histogramToSentiment(histogram),
    histogram,
    placeRating: placeMeta?.rating,
    placeReviewCount: totalOnGoogle,
    placeTitle: placeMeta?.title,
    scannedCount: reviewsInChunk,
    answeredCount: answeredInChunk,
    placeId,
    fetchedAt: new Date().toISOString(),
    nextPageToken: nextToken,
    isComplete: !nextToken && !hitSafetyCap,
  };
}

export async function fetchGoogleReviewsForInbox(
  placeId: string,
  options: { maxPages?: number; gl?: string; unansweredOnly?: boolean } = {}
): Promise<FetchGoogleReviewsResult> {
  const maxPages = options.maxPages ?? MAX_PAGES_SAFETY;
  const unansweredOnly = options.unansweredOnly ?? true;
  const allUnanswered: ReviewItem[] = [];
  let totalAnswered = 0;
  let totalScanned = 0;
  let nextToken: string | undefined;
  let meta: FetchGoogleReviewsResult | null = null;
  let pagesRemaining = maxPages;

  while (pagesRemaining > 0) {
    const chunkPages = Math.min(pagesRemaining, DEFAULT_CHUNK_PAGES);
    const chunk = await fetchGoogleReviewsChunk(placeId, {
      gl: options.gl,
      nextPageToken: nextToken,
      maxPages: chunkPages,
      unansweredOnly,
    });

    if (!meta) meta = chunk;
    allUnanswered.push(...chunk.unanswered);
    totalAnswered += chunk.answeredCount;
    totalScanned += chunk.scannedCount;
    nextToken = chunk.nextPageToken;
    pagesRemaining -= chunkPages;

    if (!nextToken) break;
  }

  const base = meta ?? (await fetchGoogleReviewsChunk(placeId, { gl: options.gl, maxPages: 1 }));

  return {
    ...base,
    inbox: allUnanswered,
    unanswered: allUnanswered,
    answered: [],
    scannedCount: totalScanned,
    answeredCount: totalAnswered,
    isComplete: !nextToken,
    nextPageToken: nextToken,
  };
}

export function histogramToSentiment(
  histogram?: Record<string, number>
): ReviewSentiment {
  if (!histogram) {
    return {
      positive: 0,
      neutral: 0,
      negative: 0,
      nps: 0,
      avgResponseTimeHours: 0,
      velocityPerMonth: 0,
    };
  }

  const stars = Object.entries(histogram).map(([k, v]) => ({
    star: Number(k),
    count: v,
  }));
  const total = stars.reduce((s, x) => s + x.count, 0) || 1;
  const positive = Math.round(
    ((stars.filter((s) => s.star >= 4).reduce((s, x) => s + x.count, 0)) / total) * 100
  );
  const negative = Math.round(
    ((stars.filter((s) => s.star <= 2).reduce((s, x) => s + x.count, 0)) / total) * 100
  );
  const neutral = Math.max(0, 100 - positive - negative);
  const weighted =
    stars.reduce((s, x) => s + x.star * x.count, 0) / total;
  const nps = Math.round((weighted - 3) * 25);

  return {
    positive,
    neutral,
    negative,
    nps,
    avgResponseTimeHours: 0,
    velocityPerMonth: 0,
  };
}

export async function fetchRealReviews(placeId: string, gl?: string) {
  const data = await fetchGoogleReviewsForInbox(placeId, {
    maxPages: 1,
    gl,
    unansweredOnly: false,
  });
  return {
    inbox: data.inbox,
    sentiment: data.sentiment,
    histogram: data.histogram,
    placeRating: data.placeRating,
    placeReviewCount: data.placeReviewCount,
    scannedCount: data.scannedCount,
    placeId: data.placeId,
    fetchedAt: data.fetchedAt,
  };
}

export async function trackKeywords(
  businessName: string,
  category: string,
  location: string,
  placeId: string | undefined,
  ll?: string,
  gl?: string,
  website?: string
): Promise<Keyword[]> {
  const { generateKeywordSuggestions } = await import("@/lib/gemini");
  const suggestions = await generateKeywordSuggestions(category || businessName, location);
  const keywords = suggestions.slice(0, 6);

  const results = await Promise.all(
    keywords.map(async (keyword) => {
      try {
        const search = await searchAtCoordinates(
          keyword,
          ...(await resolveCoords(location, ll, gl)),
          gl
        );
        const match = placeId
          ? search.local_results?.find((r) => r.place_id === placeId)
          : findBestBusinessMatch(search.local_results ?? [], businessName, {
              location,
              website,
            });

        return {
          keyword,
          volume: estimateVolume(keyword),
          rank: match?.position ?? 0,
          change: 0,
          group: category || "Local",
        } satisfies Keyword;
      } catch {
        return {
          keyword,
          volume: estimateVolume(keyword),
          rank: 0,
          change: 0,
          group: category || "Local",
        };
      }
    })
  );

  return results;
}

function estimateVolume(keyword: string): number {
  const words = keyword.split(" ").length;
  return Math.max(100, 1200 - words * 80);
}

async function resolveCoords(
  location: string,
  ll?: string,
  gl?: string
): Promise<[number, number, number?]> {
  if (ll) {
    const match = ll.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),(\d+)z/);
    if (match) {
      return [Number(match[1]), Number(match[2]), Number(match[3])];
    }
  }
  const { geocodeLocation } = await import("@/lib/searchapi");
  const coords = await geocodeLocation(location, gl);
  if (coords) {
    const match = coords.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),(\d+)z/);
    if (match) return [Number(match[1]), Number(match[2]), Number(match[3])];
  }
  return [40.7128, -74.006, 12];
}

export async function buildRealGeoGrid(
  listing: LocalBusiness,
  keyword: string,
  businessName: string,
  gl?: string
): Promise<GeoGridScan | null> {
  const lat = listing.gps_coordinates?.latitude;
  const lng = listing.gps_coordinates?.longitude;
  if (!lat || !lng) return null;

  const size = 3;
  const step = 0.012;
  const points: GeoGridScan["points"] = [];
  const center = Math.floor(size / 2);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const pointLat = lat + (center - row) * step;
      const pointLng = lng + (col - center) * step;

      try {
        const search = await searchAtCoordinates(keyword, pointLat, pointLng, 15, gl);
        const actualRank =
          search.local_results?.find((r) => r.place_id === listing.place_id)
            ?.position ?? 20;

        points.push({ row, col, rank: actualRank });
      } catch {
        points.push({ row, col, rank: 20 });
      }
    }
  }

  const ranked = points.filter((p) => p.rank > 0 && p.rank <= 20);
  const avgRank =
    ranked.length > 0
      ? Math.round(ranked.reduce((s, p) => s + p.rank, 0) / ranked.length)
      : 20;
  const centerRank = points.find((p) => p.row === center && p.col === center)?.rank ?? avgRank;
  const top3 = points.filter((p) => p.rank <= 3).length;
  const visibilityScore = Math.round((top3 / points.length) * 100);

  return {
    keyword,
    centerRank,
    averageRank: avgRank,
    visibilityScore,
    points,
    scannedAt: new Date().toISOString(),
  };
}

export function buildKeywordGroups(keywords: Keyword[]): KeywordGroup[] {
  const groups = new Map<string, string[]>();
  for (const kw of keywords) {
    const list = groups.get(kw.group) ?? [];
    list.push(kw.keyword);
    groups.set(kw.group, list);
  }
  return Array.from(groups.entries()).map(([name, kws]) => ({
    name,
    count: kws.length,
    keywords: kws,
  }));
}

export function buildActivityFeed(
  competitors: LocalBusiness[],
  listing: LocalBusiness | null
): ActivityItem[] {
  const feed: ActivityItem[] = [];
  const now = new Date();

  competitors.slice(0, 5).forEach((c, i) => {
    if (c.place_id === listing?.place_id) return;
    feed.push({
      type: "Ranking",
      business: c.title ?? `Competitor ${i + 1}`,
      detail: `Ranked #${c.position ?? "?"} with ${c.reviews ?? 0} reviews (${c.rating ?? "—"}★)`,
      time: new Date(now.getTime() - i * 3600000).toISOString(),
    });
  });

  if (listing?.reviews) {
    feed.push({
      type: "Reviews",
      business: listing.title ?? "Your business",
      detail: `${listing.reviews} total Google reviews at ${listing.rating ?? "—"}★ average`,
      time: now.toISOString(),
    });
  }

  return feed.slice(0, 8);
}

export function buildStrategistTasks(
  issues: { label: string; severity: string }[]
): StrategistTask[] {
  return issues.slice(0, 6).map((issue, i) => ({
    id: `task-${i + 1}`,
    title: issue.label,
    status: "pending" as const,
    priority:
      issue.severity === "high"
        ? ("high" as const)
        : issue.severity === "medium"
          ? ("medium" as const)
          : ("low" as const),
  }));
}

export function buildStrategistRecommendations(
  recommendations: string[]
): StrategistRecommendation[] {
  return recommendations.slice(0, 5).map((title, i) => ({
    title,
    priority: i < 2 ? "High" : "Medium",
    impact: i < 2 ? "High impact" : "Medium impact",
    category: ["GBP", "Reviews", "Citations", "Rankings", "Competitors"][i % 5],
  }));
}
