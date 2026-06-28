import type {
  AnalyticsBusinessMetrics,
  AnalyticsComparisonMetric,
  AnalyticsComparisonRow,
  AnalyticsDailyPoint,
  AnalyticsDayHours,
  AnalyticsPopularHour,
  AnalyticsRatingBucket,
  AnalyticsReport,
  AnalyticsReviewMetrics,
  AnalyticsScores,
  AnalyticsTrafficSummary,
  BusinessDoc,
  Competitor,
  DashboardDoc,
  RankingsDoc,
  ReviewsDoc,
} from "@/types/firestore";
import { hasBusinessWebsite, parseGoogleMapsPlaceId } from "@/lib/seo/maps-place";
import {
  computeRatingTrend,
  histogramToDistribution,
  type LiveAnalyticsSnapshot,
} from "./fetch-live-analytics";
import {
  generateCategoryPopularTimes,
  type CategoryPopularTimes,
} from "./generate-popular-times";

const DAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const HOUR_LABELS = [
  "6 AM",
  "7 AM",
  "8 AM",
  "9 AM",
  "10 AM",
  "11 AM",
  "12 PM",
  "1 PM",
  "2 PM",
  "3 PM",
  "4 PM",
  "5 PM",
  "6 PM",
  "7 PM",
  "8 PM",
  "9 PM",
  "10 PM",
];

function clamp(n: number, min = 0, max = 100) {
  return Math.round(Math.max(min, Math.min(max, n)));
}

function seededUnit(seed: string, offset: number): number {
  let h = 0;
  const s = `${seed}:${offset}`;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return (Math.abs(h) % 1000) / 1000;
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function parseHoursRange(hours: string): { open: string; close: string; closed: boolean } {
  const closed = /closed/i.test(hours);
  if (closed) return { open: "—", close: "—", closed: true };
  const parts = hours.split(/[–\-—]/).map((p) => p.trim());
  return {
    open: parts[0] ?? hours,
    close: parts[1] ?? "—",
    closed: false,
  };
}

function weeklyToDayHours(weekly: { day: string; hours: string }[]): AnalyticsDayHours[] {
  return DAY_LABELS.map((day) => {
    const row = weekly.find((w) => w.day.toLowerCase() === day.toLowerCase());
    const hours = row?.hours ?? "9:00 AM – 6:00 PM";
    const parsed = parseHoursRange(hours);
    return { day, ...parsed };
  });
}

function competitorHours(seed: string): AnalyticsDayHours[] {
  const templates = [
    "8:00 AM – 10:00 PM",
    "9:00 AM – 8:00 PM",
    "7:00 AM – 9:00 PM",
    "10:00 AM – 7:00 PM",
  ];
  return DAY_LABELS.map((day, i) => {
    if (day === "Sunday" && seededUnit(seed, i) > 0.65) {
      return { day, open: "—", close: "—", closed: true };
    }
    const hours = templates[Math.floor(seededUnit(seed, i + 10) * templates.length)];
    const parsed = parseHoursRange(hours);
    return { day, ...parsed };
  });
}

function pickCompetitor(competitors: Competitor[], analysis?: RankingsDoc["competitionAnalysis"]) {
  if (analysis?.topCompetitor) {
    return {
      name: analysis.topCompetitor.name,
      rating: analysis.topCompetitor.rating,
      reviews: analysis.topCompetitor.reviews,
      rank: analysis.topCompetitor.rank,
    };
  }
  const rival = competitors
    .filter((c) => !c.isYou)
    .sort((a, b) => b.reviews - a.reviews)[0];
  if (!rival) {
    return { name: "Local competitor", rating: 4.2, reviews: 45, rank: 2 };
  }
  return { name: rival.name, rating: rival.rating, reviews: rival.reviews, rank: rival.rank };
}

function buildDistribution(
  total: number,
  avgRating: number,
  seed: string
): AnalyticsRatingBucket[] {
  const weights = [1, 2, 3, 4, 5].map((stars) => {
    const dist = Math.abs(stars - avgRating);
    const base = stars >= 4 ? 1.2 : stars === 3 ? 0.6 : 0.35;
    return base / (dist + 0.5) + seededUnit(seed, stars) * 0.3;
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  const counts = weights.map((w) => Math.max(0, Math.round((w / sum) * total)));
  const diff = total - counts.reduce((a, b) => a + b, 0);
  if (diff !== 0) counts[4] = Math.max(0, counts[4] + diff);
  return [1, 2, 3, 4, 5].map((stars, i) => ({ stars, count: counts[i] }));
}

function buildPopularTimes(seed: string, category: string): AnalyticsPopularHour[] {
  const cat = category.toLowerCase();
  const lunchPeak = cat.includes("restaurant") || cat.includes("food") || cat.includes("cafe");
  const retailPeak = cat.includes("retail") || cat.includes("shop") || cat.includes("store");

  return Array.from({ length: 17 }, (_, i) => {
    const hour = 6 + i;
    let base = 15 + seededUnit(seed, hour) * 25;
    if (lunchPeak && (hour === 12 || hour === 13)) base += 55;
    if (lunchPeak && (hour === 18 || hour === 19)) base += 45;
    if (retailPeak && hour >= 14 && hour <= 17) base += 35;
    if (hour >= 9 && hour <= 11) base += 20;
    if (hour <= 7 || hour >= 21) base *= 0.45;

    const visitors = Math.round(base);
    let level: AnalyticsPopularHour["level"] = "medium";
    if (visitors >= 100) level = "very-high";
    else if (visitors >= 70) level = "high";
    else if (visitors >= 40) level = "medium";
    else if (visitors >= 20) level = "low";
    else level = "very-low";

    return {
      hour,
      label: HOUR_LABELS[i],
      visitors,
      level,
    };
  });
}

function peakHourLabel(times: AnalyticsPopularHour[]): string {
  const peak = [...times].sort((a, b) => b.visitors - a.visitors)[0];
  return peak ? `${peak.label} (${peak.visitors} visitors)` : "—";
}

/** Sun=0 … Sat=6 — deterministic weekly pattern for rank-based traffic estimates */
const DOW_MULTIPLIER = [1.1, 0.9, 0.95, 1, 1, 1.05, 1.15];

function buildDailyTrend(
  seed: string,
  days: number,
  baseTraffic: number,
  baseViews: number,
  baseEngagement: number
): AnalyticsDailyPoint[] {
  const points: AnalyticsDailyPoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    const weekend = dayOfWeek === 0 || dayOfWeek === 6;
    const noise = 0.75 + seededUnit(seed, i) * 0.5;
    const weekendBoost = weekend ? 1.12 : 1;
    points.push({
      date: formatDate(d),
      websiteTraffic: Math.round(baseTraffic * noise * weekendBoost),
      gbpViews: Math.round(baseViews * noise * weekendBoost),
      engagement: Math.round(baseEngagement * noise * weekendBoost),
    });
  }
  return points;
}

function buildOrganicDailyTrend(
  days: number,
  organicMonthly: number,
  localVisibility: number,
  engagementBase: number
): AnalyticsDailyPoint[] {
  const dailyTraffic = Math.max(1, organicMonthly / 30);
  const dailyViews = Math.max(2, (localVisibility / 100) * 18);
  const dailyEngagement = Math.max(1, engagementBase / 30);
  const points: AnalyticsDailyPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const mult = DOW_MULTIPLIER[d.getDay()] ?? 1;
    points.push({
      date: formatDate(d),
      websiteTraffic: Math.round(dailyTraffic * mult),
      gbpViews: Math.round(dailyViews * mult),
      engagement: Math.round(dailyEngagement * mult),
    });
  }
  return points;
}

function trafficSummary(daily: AnalyticsDailyPoint[]): AnalyticsTrafficSummary {
  const byTraffic = [...daily].sort((a, b) => b.websiteTraffic - a.websiteTraffic);
  const avg =
    daily.length > 0
      ? Math.round(daily.reduce((s, d) => s + d.websiteTraffic, 0) / daily.length)
      : 0;
  return {
    highestDay: {
      date: byTraffic[0]?.date ?? "—",
      value: byTraffic[0]?.websiteTraffic ?? 0,
    },
    lowestDay: {
      date: byTraffic[byTraffic.length - 1]?.date ?? "—",
      value: byTraffic[byTraffic.length - 1]?.websiteTraffic ?? 0,
    },
    averageDaily: avg,
  };
}

function pctDiff(user: number, competitor: number): number {
  if (competitor === 0) return user > 0 ? 100 : 0;
  return Math.round(((user - competitor) / competitor) * 100);
}

function averageInboxRating(reviews: ReviewsDoc): number {
  const rated = reviews.inbox.filter((r) => r.rating > 0);
  if (!rated.length) return 0;
  return Math.round((rated.reduce((sum, r) => sum + r.rating, 0) / rated.length) * 10) / 10;
}

function resolveUserMetrics(
  dashboard: DashboardDoc,
  reviews: ReviewsDoc,
  rankings: RankingsDoc
): {
  totalReviews: number;
  averageRating: number;
  localVisibility: number;
  responseRate: number;
  reviewsThisMonth: number;
} {
  const m = dashboard.metrics;
  const you = rankings.competitors?.find((c) => c.isYou);
  const inboxCount = reviews.inbox.length;
  const answeredInInbox = reviews.inbox.filter((r) => r.replied).length;
  const googleTotal =
    reviews.totalOnGoogle ??
    reviews.scannedCount ??
    inboxCount + (reviews.answeredCount ?? 0);

  const keywordVisibility = rankings.keywords?.length
    ? Math.round(
        rankings.keywords.filter((k) => k.rank > 0 && k.rank <= 20).length /
          Math.max(rankings.keywords.length, 1) *
          100
      )
    : 0;

  const totalReviews =
    m.totalReviews ||
    googleTotal ||
    you?.reviews ||
    0;
  const averageRating =
    m.averageRating ||
    averageInboxRating(reviews) ||
    you?.rating ||
    0;
  const localVisibility =
    m.localVisibility ||
    dashboard.visibilityScore ||
    rankings.geoGrid?.visibilityScore ||
    keywordVisibility ||
    m.aiVisibility ||
    m.overallScore ||
    m.gbpHealth ||
    0;
  const responseRate =
    m.responseRate ||
    (inboxCount > 0 ? Math.round((answeredInInbox / inboxCount) * 100) : 0);
  const reviewsThisMonth =
    m.reviewsThisMonth ||
    reviews.inbox.filter((r) => {
      const d = new Date(r.date);
      if (Number.isNaN(d.getTime())) return false;
      const days = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
      return days <= 30;
    }).length ||
    inboxCount;

  return {
    totalReviews,
    averageRating,
    localVisibility,
    responseRate,
    reviewsThisMonth,
  };
}

export async function prepareAnalyticsInput(
  input: BuildAnalyticsInput,
  live?: LiveAnalyticsSnapshot | null
): Promise<BuildAnalyticsInput> {
  const resolved = resolveUserMetrics(input.dashboard, input.reviews, input.rankings);
  let { totalReviews, averageRating, localVisibility } = resolved;

  if (live?.userPlace) {
    totalReviews = live.userPlace.reviews ?? totalReviews;
    averageRating = live.userPlace.rating ?? averageRating;
  } else if (
    !live?.fromAnalysisCache &&
    (totalReviews === 0 || averageRating === 0) &&
    input.business.mapsPlaceId
  ) {
    const placeId = parseGoogleMapsPlaceId(input.business.mapsPlaceId);
    if (placeId) {
      try {
        const { fetchGoogleMapsPlace } = await import("@/lib/searchapi");
        const place = await fetchGoogleMapsPlace(placeId);
        const detail = place.place_result ?? place.local_results?.[0];
        totalReviews = totalReviews || detail?.reviews || 0;
        averageRating = averageRating || detail?.rating || 0;
      } catch {
        // keep resolved fallbacks
      }
    }
  }

  if (live?.visibility) {
    localVisibility = live.visibility.localVisibility || localVisibility;
  }

  const organicTraffic =
    live?.visibility?.organicTraffic ?? input.dashboard.metrics.organicTraffic;

  const metricsPatch = {
    totalReviews: totalReviews || input.dashboard.metrics.totalReviews,
    averageRating: averageRating || input.dashboard.metrics.averageRating,
    localVisibility: localVisibility || input.dashboard.metrics.localVisibility,
    organicTraffic: organicTraffic || input.dashboard.metrics.organicTraffic,
  };

  const changed =
    metricsPatch.totalReviews !== input.dashboard.metrics.totalReviews ||
    metricsPatch.averageRating !== input.dashboard.metrics.averageRating ||
    metricsPatch.localVisibility !== input.dashboard.metrics.localVisibility ||
    metricsPatch.organicTraffic !== input.dashboard.metrics.organicTraffic;

  if (!changed) return input;

  return {
    ...input,
    dashboard: {
      ...input.dashboard,
      visibilityScore: metricsPatch.localVisibility || input.dashboard.visibilityScore,
      metrics: {
        ...input.dashboard.metrics,
        ...metricsPatch,
      },
    },
  };
}

export async function buildAnalyticsReportFromSources(
  input: BuildAnalyticsInput
): Promise<AnalyticsReport> {
  let live: LiveAnalyticsSnapshot | null = null;
  const { shouldUseCachedAnalytics, buildCachedAnalyticsSnapshot, fetchLiveAnalyticsData } =
    await import("./fetch-live-analytics");

  if (shouldUseCachedAnalytics(input)) {
    live = buildCachedAnalyticsSnapshot(input);
  } else {
    try {
      live = await fetchLiveAnalyticsData(input);
    } catch (error) {
      console.error("Live analytics fetch failed:", error);
    }
  }
  const prepared = await prepareAnalyticsInput(input, live);

  const rival = live?.competitor ?? pickCompetitor(
    prepared.rankings.competitors ?? [],
    prepared.rankings.competitionAnalysis
  );
  const location =
    prepared.rankings.competitionAnalysis?.location ||
    [prepared.business.city, prepared.business.state, prepared.business.country]
      .filter(Boolean)
      .join(", ") ||
    prepared.business.address;

  let popularTimes: CategoryPopularTimes | null = null;
  try {
    popularTimes = await generateCategoryPopularTimes({
      businessName: prepared.business.name,
      primaryCategory: prepared.business.primaryCategory,
      additionalCategories: prepared.business.additionalCategories,
      location,
      weeklyHours: live?.userWeeklyHours ?? prepared.business.weeklyHours,
      competitorName: rival.name,
      competitorWeeklyHours: live?.competitorWeeklyHours ?? undefined,
    });
  } catch (error) {
    console.error("Popular times generation failed:", error);
  }

  return buildAnalyticsReport(prepared, live, popularTimes);
}

function buildScores(
  dashboard: DashboardDoc,
  resolved: ReturnType<typeof resolveUserMetrics>
): AnalyticsScores {
  const m = dashboard.metrics;
  const trafficScore = clamp(m.organicTraffic > 0 ? Math.min(100, m.organicTraffic / 2) : resolved.localVisibility * 0.85);
  const reviewScore = clamp(m.reviewScore || resolved.averageRating * 20);
  const reputationScore = clamp(resolved.averageRating * 20);
  const visibilityScore = clamp(resolved.localVisibility);
  const overallScore = clamp(
    trafficScore * 0.27 +
      reviewScore * 0.27 +
      reputationScore * 0.22 +
      visibilityScore * 0.24
  );
  return {
    trafficScore,
    reviewScore,
    reputationScore,
    visibilityScore,
    overallScore,
  };
}

export interface BuildAnalyticsInput {
  business: BusinessDoc;
  dashboard: DashboardDoc;
  rankings: RankingsDoc;
  reviews: ReviewsDoc;
  periodDays?: number;
}

function buildDataNote(live: LiveAnalyticsSnapshot | null | undefined): string {
  if (live?.fromAnalysisCache) {
    return "Metrics are built from your onboarding SEO analysis. Use Refresh to pull live Google Maps data via SearchAPI.";
  }
  if (!live) {
    return "Metrics blend stored analysis data with estimates where live Maps data is unavailable. Add a Google Maps place ID and refresh to pull live SearchAPI data.";
  }
  const parts: string[] = [];
  if (live.liveFields.userPlace) parts.push("Maps place details");
  if (live.liveFields.visibility) parts.push("live search rankings");
  if (live.liveFields.reviewsHistogram) parts.push("review star distribution");
  if (live.liveFields.recentReviews) parts.push("30-day review counts");
  if (live.liveFields.competitorPlace) parts.push("competitor Maps profile");

  if (!parts.length) {
    return "Could not reach SearchAPI — showing stored analysis data with traffic and footfall estimates.";
  }

  return `Reviews, ratings, visibility, and distribution use live Google Maps data via SearchAPI (${parts.join(", ")}). Daily traffic, GBP views, and popular times are estimated from search visibility signals because Google does not expose public daily analytics.`;
}

function zeroWebsiteTraffic(daily: AnalyticsDailyPoint[]): AnalyticsDailyPoint[] {
  return daily.map((point) => ({ ...point, websiteTraffic: 0 }));
}

export function buildAnalyticsReport(
  input: BuildAnalyticsInput,
  live?: LiveAnalyticsSnapshot | null,
  popularTimes?: CategoryPopularTimes | null
): AnalyticsReport {
  const { business, dashboard, rankings, reviews } = input;
  const periodDays = input.periodDays ?? 30;
  const m = dashboard.metrics;
  const resolved = resolveUserMetrics(dashboard, reviews, rankings);
  const seed = business.businessId || business.name || business.userId;
  const rival = live?.competitor ?? pickCompetitor(rankings.competitors ?? [], rankings.competitionAnalysis);
  const hasWebsite = hasBusinessWebsite(business.website, live?.userPlace?.website);

  const organicMonthly = live?.visibility?.organicTraffic ?? m.organicTraffic ?? 0;
  const visibilityScore = live?.visibility?.localVisibility ?? resolved.localVisibility;
  const engagementBase = Math.max(3, m.responseRate + m.gbpHealth);

  const dailyTrendRaw =
    live?.visibility && organicMonthly > 0
      ? buildOrganicDailyTrend(
          periodDays,
          organicMonthly,
          visibilityScore,
          engagementBase
        )
      : buildDailyTrend(
          seed,
          periodDays,
          Math.max(8, Math.round((m.organicTraffic || 40) * 0.35)),
          Math.max(12, Math.round((visibilityScore || 50) * 0.55)),
          Math.max(3, Math.round(engagementBase / 25))
        );
  const dailyTrend = hasWebsite ? dailyTrendRaw : zeroWebsiteTraffic(dailyTrendRaw);

  const totalReviews =
    live?.userPlace?.reviews ?? resolved.totalReviews;
  const averageRating =
    live?.userPlace?.rating ?? resolved.averageRating;
  const reviewsThisMonth =
    live?.userNewReviews30d ?? resolved.reviewsThisMonth;
  const localVisibility = visibilityScore;

  const userBusiness: AnalyticsBusinessMetrics = {
    websiteTraffic: hasWebsite
      ? dailyTrend.reduce((s, d) => s + d.websiteTraffic, 0)
      : 0,
    gbpViews: dailyTrend.reduce((s, d) => s + d.gbpViews, 0),
    calls: Math.round(dailyTrend.reduce((s, d) => s + d.engagement, 0) * 0.35),
    directionRequests: Math.round(dailyTrend.reduce((s, d) => s + d.engagement, 0) * 0.45),
    websiteClicks: hasWebsite
      ? Math.round(dailyTrend.reduce((s, d) => s + d.websiteTraffic, 0) * 0.28)
      : 0,
    reviewsReceived: reviewsThisMonth,
    averageRating,
  };

  const competitorVisibility = clamp(
    (rival.reviews / Math.max(totalReviews, 1)) * 35 +
      rival.rating * 14 +
      (rival.rank > 0 ? Math.max(0, 22 - rival.rank) * 2.5 : 20)
  );

  const competitorNewReviews =
    live?.competitorNewReviews30d ??
    Math.max(1, Math.round(rival.reviews * 0.08 + seededUnit(rival.name, 3) * 12));

  const competitorRatingTrend =
    live?.competitorRecentReviews.length && rival.rating
      ? computeRatingTrend(live.competitorRecentReviews, rival.rating, periodDays)
      : Math.round((seededUnit(rival.name, 1) - 0.4) * 8 * 10) / 10;

  const competitor: AnalyticsReport["competitor"] = {
    name: rival.name,
    reviewsCount: rival.reviews,
    averageRating: rival.rating,
    ratingTrend: competitorRatingTrend,
    visibilityScore: competitorVisibility,
    newReviews30d: competitorNewReviews,
  };

  const userDistribution =
    live?.userReviewsHistogram &&
    Object.values(live.userReviewsHistogram).some((n) => n > 0)
      ? histogramToDistribution(live.userReviewsHistogram)
      : buildDistribution(totalReviews || 10, averageRating || 4, seed);

  const competitorDistribution =
    live?.competitorReviewsHistogram &&
    Object.values(live.competitorReviewsHistogram).some((n) => n > 0)
      ? histogramToDistribution(live.competitorReviewsHistogram)
      : buildDistribution(rival.reviews || 10, rival.rating || 4, rival.name);

  const userReviews: AnalyticsReviewMetrics = {
    totalReviews,
    newReviews30d: reviewsThisMonth,
    averageRating,
    ratingTrend:
      live?.userRecentReviews.length && averageRating
        ? computeRatingTrend(live.userRecentReviews, averageRating, periodDays)
        : Math.round((seededUnit(seed, 99) - 0.35) * 6 * 10) / 10,
    distribution: userDistribution,
  };

  const competitorReviews: AnalyticsReviewMetrics = {
    totalReviews: rival.reviews,
    newReviews30d: competitorNewReviews,
    averageRating: rival.rating,
    ratingTrend:
      live?.competitorRecentReviews.length && rival.rating
        ? competitorRatingTrend
        : Math.round((seededUnit(rival.name, 1) - 0.4) * 8 * 10) / 10,
    distribution: competitorDistribution,
  };

  const userHours =
    live?.userWeeklyHours?.length
      ? weeklyToDayHours(live.userWeeklyHours)
      : business.weeklyHours?.length >= 5
        ? weeklyToDayHours(business.weeklyHours)
        : weeklyToDayHours([
            { day: "Monday", hours: "9:00 AM – 9:00 PM" },
            { day: "Tuesday", hours: "9:00 AM – 9:00 PM" },
            { day: "Wednesday", hours: "9:00 AM – 9:00 PM" },
            { day: "Thursday", hours: "9:00 AM – 9:00 PM" },
            { day: "Friday", hours: "9:00 AM – 9:00 PM" },
            { day: "Saturday", hours: "10:00 AM – 6:00 PM" },
            { day: "Sunday", hours: "Closed" },
          ]);

  const competitorHoursList =
    live?.competitorWeeklyHours?.length
      ? weeklyToDayHours(live.competitorWeeklyHours)
      : competitorHours(rival.name);
  const userPopularTimes =
    popularTimes?.user ?? buildPopularTimes(seed, business.primaryCategory);
  const competitorPopularTimes =
    popularTimes?.competitor ?? buildPopularTimes(rival.name, business.primaryCategory);

  const competitorTraffic = hasWebsite
    ? Math.round(userBusiness.websiteTraffic * (0.85 + seededUnit(rival.name, 5) * 0.35))
    : 0;

  const comparisons: AnalyticsComparisonMetric[] = [
    {
      label: "Total Reviews",
      userValue: totalReviews,
      competitorValue: rival.reviews,
      userWins: totalReviews >= rival.reviews,
      differencePercent: pctDiff(totalReviews, rival.reviews),
      unit: "reviews",
    },
    {
      label: "Average Rating",
      userValue: averageRating,
      competitorValue: rival.rating,
      userWins: averageRating >= rival.rating,
      differencePercent: pctDiff(averageRating * 100, rival.rating * 100),
      unit: "★",
    },
    ...(hasWebsite
      ? [
          {
            label: "Website Traffic",
            userValue: userBusiness.websiteTraffic,
            competitorValue: competitorTraffic,
            userWins: userBusiness.websiteTraffic >= competitorTraffic,
            growthPercent: Math.round(5 + seededUnit(seed, 50) * 18),
            unit: "visits",
          } satisfies AnalyticsComparisonMetric,
        ]
      : []),
    {
      label: "Visibility Score",
      userValue: localVisibility,
      competitorValue: competitorVisibility,
      userWins: localVisibility >= competitorVisibility,
      differencePercent: pctDiff(localVisibility, competitorVisibility),
      unit: "%",
    },
  ];

  const userWinsCount = comparisons.filter((c) => c.userWins).length;

  const comparisonTable: AnalyticsComparisonRow[] = [
    {
      metric: "Total Reviews",
      user: String(totalReviews),
      competitor: String(rival.reviews),
      winner:
        totalReviews > rival.reviews
          ? "user"
          : totalReviews < rival.reviews
            ? "competitor"
            : "tie",
    },
    {
      metric: "Average Rating",
      user: `${averageRating}★`,
      competitor: `${rival.rating}★`,
      winner:
        averageRating > rival.rating
          ? "user"
          : averageRating < rival.rating
            ? "competitor"
            : "tie",
    },
    ...(hasWebsite
      ? [
          {
            metric: "Website Traffic (30d)",
            user: String(userBusiness.websiteTraffic),
            competitor: "Est. unavailable",
            winner: "user" as const,
          },
        ]
      : []),
    {
      metric: "Peak Visitor Time",
      user: peakHourLabel(userPopularTimes),
      competitor: peakHourLabel(competitorPopularTimes),
      winner: "tie",
    },
    {
      metric: "Visibility Score",
      user: `${localVisibility}%`,
      competitor: `${competitorVisibility}%`,
      winner:
        localVisibility > competitorVisibility
          ? "user"
          : localVisibility < competitorVisibility
            ? "competitor"
            : "tie",
    },
  ];

  const opportunityAreas: string[] = [];
  if (totalReviews < rival.reviews) {
    opportunityAreas.push(`Close the review gap — ${rival.reviews - totalReviews} fewer reviews than ${rival.name}`);
  }
  if (averageRating < rival.rating) {
    opportunityAreas.push(`Improve average rating to match or beat ${rival.rating}★`);
  }
  if (localVisibility < competitorVisibility) {
    opportunityAreas.push("Boost Maps visibility with GBP completeness and local keywords");
  }
  if (resolved.responseRate < 60) {
    opportunityAreas.push("Reply to more Google reviews to strengthen your reputation");
  }
  if (!hasWebsite) {
    opportunityAreas.push("Add a website to your Google Business Profile to track website clicks and traffic");
  }
  if (opportunityAreas.length === 0) {
    opportunityAreas.push("Maintain momentum — refresh photos and post weekly GBP updates");
  }

  return {
    periodDays,
    generatedAt: new Date().toISOString(),
    hasWebsite,
    userBusiness,
    competitor,
    comparisons,
    dailyTrend,
    trafficSummary: trafficSummary(dailyTrend),
    userReviews,
    competitorReviews,
    userHours,
    competitorHours: competitorHoursList,
    userPopularTimes,
    competitorPopularTimes,
    userPeakHour: peakHourLabel(userPopularTimes),
    competitorPeakHour: peakHourLabel(competitorPopularTimes),
    comparisonTable,
    opportunityAreas,
    betterPerforming: userWinsCount >= 3 ? "user" : "competitor",
    scores: buildScores(dashboard, {
      ...resolved,
      totalReviews,
      averageRating,
      localVisibility,
      reviewsThisMonth,
    }),
    dataNote: buildDataNote(live),
  };
}
