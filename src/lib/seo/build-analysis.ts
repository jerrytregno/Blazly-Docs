import type { LocalBusiness } from "@/types";
import type {
  BusinessDoc,
  DashboardDoc,
  RankingsDoc,
  ReviewsDoc,
} from "@/types/firestore";
import { computeScores } from "./scoring-engine";
import { discoverListing, attachListingPosition } from "./discover-listing";
import { parseGoogleMapsPlaceId, normalizeUserWebsite } from "./maps-place";
import { generateSeoAudit } from "@/lib/gemini";
import {
  buildCitationListings,
  buildGbpAuditChecklist,
  buildShareOfVoice,
  competitorCitationGaps,
  TOP_DIRECTORIES,
} from "./citation-catalog";
import { buildNapAudit, napListingSyncStatus } from "./nap-audit";
import {
  openHoursToWeekly,
  imageCountFromListing,
  fetchRealReviews,
  buildRealGeoGrid,
  buildKeywordGroups,
  buildActivityFeed,
  buildStrategistTasks,
  buildStrategistRecommendations,
} from "./real-data";
import { computeVisibilityMetrics, keywordRankingProgress } from "./visibility-metrics";
import {
  buildOrganicMetricsInput,
  fetchOrganicPerformanceMetrics,
} from "./organic-metrics";
import { buildProfileOptimizationFromListing } from "./profile-optimization";
import { buildRankTrackerSeed } from "@/lib/keyword-research/build-from-analysis";
import { enrichCitationListingUrls } from "./citation-catalog";
import { regionGl } from "./search-regions";
import { analyzeCompetition } from "./competition-analysis";
import { fetchMapsCategoryRank } from "./maps-rank";

export interface AnalysisInput {
  businessName: string;
  website?: string;
  category?: string;
  location?: string;
  phone?: string;
  mapsPlaceId?: string;
  userId: string;
  searchRegion?: string;
}

function parseAddress(address?: string) {
  if (!address) return { city: "", state: "", zip: "", street: "" };
  const parts = address.split(",").map((p) => p.trim());
  const zipMatch =
    address.match(/\b\d{6}\b/)?.[0] ?? parts[parts.length - 1]?.match(/\d{5}(-\d{4})?/)?.[0];
  const zip = zipMatch ?? "";
  const statePart = parts.length >= 2 ? parts[parts.length - 2] : "";
  const state = statePart.replace(/\d{5,6}(-\d{4})?/, "").trim();
  const city = parts.length >= 3 ? parts[parts.length - 3] : parts[0] ?? "";
  return { city, state, zip, street: parts[0] ?? "" };
}

function buildBusinessUpdate(
  listing: LocalBusiness | null,
  input: AnalysisInput,
  existing?: Partial<BusinessDoc>
): Partial<BusinessDoc> {
  const types = listing?.types ?? (listing?.type ? [listing.type] : []);
  const primary = types[0] ?? input.category ?? existing?.primaryCategory ?? "";
  const additional = types.slice(1);
  const photos = imageCountFromListing(listing);
  const addr = parseAddress(listing?.address);
  const weeklyFromGbp = openHoursToWeekly(listing);

  const imageSections = [
    { type: "Logo", count: listing?.thumbnail ? 1 : 0, status: listing?.thumbnail ? "uploaded" : "missing" },
    { type: "Cover Photo", count: photos > 0 ? 1 : 0, status: photos > 0 ? "uploaded" : "missing" },
    { type: "Team Photos", count: Math.max(0, photos - 2), status: photos > 2 ? "uploaded" : "missing" },
    { type: "Interior Photos", count: 0, status: "missing" },
    { type: "Exterior Photos", count: photos > 1 ? 1 : 0, status: photos > 1 ? "uploaded" : "missing" },
    { type: "Product Photos", count: 0, status: "missing" },
  ];

  const userWebsite = normalizeUserWebsite(
    input.website || existing?.userWebsite || existing?.website
  );
  const googleWebsite = listing?.website
    ? normalizeUserWebsite(listing.website)
    : "";

  return {
    name: listing?.title ?? input.businessName,
    businessId: listing?.place_id ?? existing?.businessId ?? "",
    mapsPlaceId:
      parseGoogleMapsPlaceId(input.mapsPlaceId) ??
      existing?.mapsPlaceId ??
      listing?.place_id ??
      "",
    userWebsite,
    website: userWebsite || googleWebsite,
    phone: listing?.phone ?? existing?.phone ?? "",
    status: listing?.open_state ?? existing?.status ?? "Open",
    address: listing?.address ?? existing?.address ?? "",
    city: addr.city || existing?.city || input.location || "",
    state: addr.state || existing?.state || "",
    zip: addr.zip || existing?.zip || "",
    primaryCategory: primary,
    additionalCategories: additional.length ? additional : existing?.additionalCategories ?? [],
    description: listing?.description ?? existing?.description ?? "",
    businessSummary: listing?.description?.slice(0, 160) ?? existing?.businessSummary ?? "",
    missingCategories: additional.length < 2 ? ["Add secondary category on GBP"] : [],
    weeklyHours: weeklyFromGbp ?? existing?.weeklyHours ?? [],
    imageSections,
  };
}

function buildCompetitors(
  results: LocalBusiness[],
  listing: LocalBusiness | null,
  businessName: string
) {
  return results
    .filter((r) => r.place_id !== listing?.place_id)
    .slice(0, 8)
    .map((r, i) => ({
      name: r.title ?? `Competitor ${i + 1}`,
      distance: "—",
      rating: r.rating ?? 0,
      reviews: r.reviews ?? 0,
      rank: r.position ?? i + 2,
      isYou: false,
      categories: r.types?.length ?? (r.type ? 1 : 0),
      photos: imageCountFromListing(r),
      posts: 0,
      services: 0,
      citations: 0,
    }))
    .concat([
      {
        name: listing?.title ?? businessName,
        distance: "—",
        rating: listing?.rating ?? 0,
        reviews: listing?.reviews ?? 0,
        rank: listing?.position ?? 0,
        isYou: true,
        categories: listing?.types?.length ?? (listing?.type ? 1 : 0),
        photos: imageCountFromListing(listing),
        posts: 0,
        services: 0,
        citations: 0,
      },
    ]);
}

export async function runBusinessAnalysis(input: AnalysisInput) {
  const category = input.category?.trim() || "";
  const location = input.location?.trim() || "";
  const gl = regionGl(input.searchRegion);

  const discovery = await discoverListing({
    businessName: input.businessName,
    website: input.website,
    category: category || undefined,
    location: location || undefined,
    phone: input.phone,
    placeId: parseGoogleMapsPlaceId(input.mapsPlaceId),
    gl,
  });

  let listing = attachListingPosition(discovery.listing, discovery.results);
  const results = discovery.results;
  const ll = discovery.ll;
  const searchQuery = discovery.searchQueryUsed;

  const competitionCategory = category || input.category || input.businessName;
  const competitionLocation = location || input.location || "";

  let mapsRank = 0;
  let mapsRankQuery = "";
  let mapsRankResults: LocalBusiness[] = [];
  if (listing?.place_id && competitionLocation) {
    const rankResult = await fetchMapsCategoryRank({
      category: competitionCategory,
      location: competitionLocation,
      placeId: listing.place_id,
      businessName: input.businessName,
      ll,
      lat: listing.gps_coordinates?.latitude,
      lng: listing.gps_coordinates?.longitude,
      gl,
    });
    mapsRank = rankResult.rank;
    mapsRankQuery = rankResult.query;
    mapsRankResults = rankResult.results;
    if (mapsRank > 0) {
      listing = { ...listing, position: mapsRank };
    }
  }

  const business = buildBusinessUpdate(listing, input);
  const napAudit = buildNapAudit(listing, {
    name: business.name,
    phone: business.phone,
    address: business.address,
    city: business.city,
    state: business.state,
    zip: business.zip,
  });

  let scores = computeScores(
    listing,
    {
      website: input.website,
      name: input.businessName,
      phone: listing?.phone,
    },
    {
      napScore: napAudit.score,
      business: {
        name: business.name,
        website: business.website,
        phone: business.phone,
        address: business.address,
        city: business.city,
        state: business.state,
        zip: business.zip,
      },
    }
  );

  const competitors = buildCompetitors(results, listing, input.businessName);
  const competitionAnalysis = analyzeCompetition({
    results,
    listing,
    category: competitionCategory,
    location: competitionLocation,
    businessName: input.businessName,
    mapsRank: mapsRank > 0 ? mapsRank : undefined,
    mapsRankQuery: mapsRankQuery || undefined,
  });
  const citationListings = enrichCitationListingUrls(
    buildCitationListings(listing, scores.citationHealth),
    {
      businessName: business.name,
      mapsPlaceId: business.mapsPlaceId ?? listing?.place_id,
      address: business.address,
      city: business.city,
      state: business.state,
      zip: business.zip,
      phone: business.phone,
      website: business.website,
    }
  );
  const competitorNames = competitors.filter((c) => !c.isYou).map((c) => c.name);
  const gbpAuditChecklist = buildGbpAuditChecklist(listing);
  const citationGaps = competitorCitationGaps(citationListings, competitorNames);
  const missingDirs = citationListings
    .filter((c) => c.status === "missing" && c.value >= 70)
    .map((c) => c.directory);

  const topCompetitorReviews = competitors
    .filter((c) => !c.isYou)
    .reduce((max, c) => Math.max(max, c.reviews), 0);
  const yourReviews = listing?.reviews ?? 0;
  const reviewGap = Math.max(0, topCompetitorReviews - yourReviews);

  const keywordQuery = category || business.primaryCategory || input.businessName;
  const geoKeyword = keywordQuery;

  const [reviewData, organicMetrics, geoGrid, geminiAudit] = await Promise.all([
    listing?.place_id
      ? fetchRealReviews(listing.place_id, gl).catch(() => null)
      : Promise.resolve(null),
    fetchOrganicPerformanceMetrics(
      buildOrganicMetricsInput({
        businessName: input.businessName,
        category: keywordQuery,
        location: location || business.city || "",
        listing,
        mapsRank: mapsRank > 0 ? mapsRank : listing?.position,
        visibilityScore: scores.localVisibility,
        gbpHealth: scores.gbpHealth,
      })
    ).catch(() => ({
      authorityScore: scores.overallScore,
      organicTraffic: Math.max(100, (listing?.reviews ?? 10) * 12),
      keywords: [] as RankingsDoc["keywords"],
    })),
    listing?.gps_coordinates
      ? buildRealGeoGrid(listing, geoKeyword, input.businessName, gl).catch(() => null)
      : Promise.resolve(null),
    generateSeoAudit({
      businessName: input.businessName,
      keyword: keywordQuery,
      location: location || business.city || "",
      targetBusiness: listing ?? undefined,
      competitors: results.filter((r) => r.place_id !== listing?.place_id),
    }).catch(() => null),
  ]);

  const keywords =
    organicMetrics.keywords.length > 0
      ? organicMetrics.keywords
      : await import("./real-data").then((m) =>
          m.trackKeywords(
            input.businessName,
            keywordQuery,
            location || business.city || "",
            listing?.place_id,
            ll,
            gl,
            input.website
          )
        ).catch(() => [] as RankingsDoc["keywords"]);

  const aiRecommendations = [
    ...(geminiAudit?.recommendations ?? []),
    ...scores.aiRecommendations,
  ].filter((v, i, a) => a.indexOf(v) === i);

  const aiInsights = geminiAudit?.analysis
    ? [geminiAudit.analysis.split("\n")[0].slice(0, 200)]
    : [];

  const visibility = await computeVisibilityMetrics({
    listing,
    businessName: input.businessName,
    category: keywordQuery,
    location: location || business.city || "",
    placeId: listing?.place_id,
    ll,
    gl,
    keywords,
    geoGrid,
  }).catch(() => null);

  const top3Count = keywords.filter((k) => k.rank > 0 && k.rank <= 3).length;
  const top10Count = keywords.filter((k) => k.rank > 0 && k.rank <= 10).length;
  const avgKeywordRank =
    keywords.filter((k) => k.rank > 0).length > 0
      ? Math.round(
          keywords.filter((k) => k.rank > 0).reduce((s, k) => s + k.rank, 0) /
            keywords.filter((k) => k.rank > 0).length
        )
      : listing?.position ?? 0;

  const responseRate =
    reviewData && reviewData.inbox.length > 0
      ? Math.round(
          (reviewData.inbox.filter((r) => r.replied).length / reviewData.inbox.length) * 100
        )
      : 0;

  scores = computeScores(
    listing,
    {
      website: input.website,
      name: input.businessName,
      phone: listing?.phone,
    },
    {
      napScore: napAudit.score,
      responseRate,
      recentReviewCount: reviewData?.inbox.length,
      business: {
        name: business.name,
        website: business.website,
        phone: business.phone,
        address: business.address,
        city: business.city,
        state: business.state,
        zip: business.zip,
      },
    }
  );

  const keywordRankingScore = keywordRankingProgress(
    keywords,
    listing,
    geoGrid,
    visibility?.localVisibility,
    scores.localVisibility
  );

  const resolvedLocalVisibility =
    visibility?.localVisibility && visibility.localVisibility > 0
      ? visibility.localVisibility
      : geoGrid?.visibilityScore && geoGrid.visibilityScore > 0
        ? geoGrid.visibilityScore
        : keywordRankingScore > 0
          ? keywordRankingScore
          : scores.localVisibility;

  const dashboard: Partial<DashboardDoc> = {
    visibilityScore: resolvedLocalVisibility,
    listingSyncStatus: napListingSyncStatus(listing, napAudit),
    metrics: {
      overallScore: Math.max(scores.overallScore, organicMetrics.authorityScore),
      aiVisibility:
        visibility?.aiVisibility ??
        scores.localVisibility,
      organicTraffic:
        visibility?.organicTraffic ??
        organicMetrics.organicTraffic ??
        Math.max(1, Math.round((scores.localVisibility / 100) * (listing?.reviews ?? 10))),
      localVisibility: resolvedLocalVisibility,
      gbpHealth: scores.gbpHealth,
      citationHealth: scores.citationHealth,
      reviewScore: scores.reviewScore,
      averageRank: avgKeywordRank,
      top3Keywords: top3Count || (listing?.position && listing.position <= 3 ? 1 : 0),
      top10Keywords: top10Count || (listing?.position && listing.position <= 10 ? 1 : 0),
      rankingGains: keywords.filter((k) => k.change > 0).length,
      rankingLosses: keywords.filter((k) => k.change < 0).length,
      totalReviews: reviewData?.placeReviewCount ?? listing?.reviews ?? 0,
      reviewsThisMonth: reviewData?.inbox.length ?? 0,
      averageRating: reviewData?.placeRating ?? listing?.rating ?? 0,
      responseRate,
    },
    issues: scores.issues,
    aiRecommendations: aiRecommendations.slice(0, 8),
    aiInsights,
    gbpHealthBreakdown: scores.gbpHealthBreakdown,
    localSeoFactors: scores.localSeoFactors,
    progressAreas: [
      { label: "GBP Optimization", progress: scores.gbpHealth },
      { label: "Citation Fixes", progress: scores.citationHealth },
      { label: "Review Growth", progress: scores.reviewScore },
      { label: "Keyword Rankings", progress: keywordRankingScore },
    ],
    strategistTasks: buildStrategistTasks(scores.issues),
    strategistRecommendations: buildStrategistRecommendations(aiRecommendations),
    analysisStatus: "complete",
    lastAnalyzedAt: new Date().toISOString(),
    analysisError: null,
    searchRegion: input.searchRegion,
  };

  const rankTrackerSeed =
    mapsRankResults.length > 0 && competitionLocation
      ? buildRankTrackerSeed({
          category: competitionCategory,
          location: competitionLocation,
          businessName: input.businessName,
          placeId: listing?.place_id,
          mapsResults: mapsRankResults,
        })
      : undefined;

  const rankings: Partial<RankingsDoc> = {
    rankTrackerSeed,
    competitors,
    competitionAnalysis,
    keywords,
    keywordGroups: buildKeywordGroups(keywords),
    napAudit,
    geoGrid,
    aiSearchSignals: visibility?.platformSignals,
    visibilityQueries: visibility?.searchQueries,
    shareOfVoice: buildShareOfVoice(listing, competitors, keywords),
    activityFeed: buildActivityFeed(results, listing),
    mapsRankingTypes: [
      { type: "Google Maps", rank: visibility?.searchQueries.find((q) => q.label === "Maps")?.rank ?? listing?.position ?? 0, change: 0 },
      { type: "Local Pack", rank: visibility?.searchQueries.find((q) => q.label === "Near me")?.rank ?? listing?.position ?? 0, change: 0 },
      {
        type: "Organic Search",
        rank: visibility?.searchQueries.find((q) => q.label === "Category")?.rank ?? keywords[0]?.rank ?? 0,
        change: 0,
      },
    ],
    rankingTrends: [
      { period: "Daily", avgRank: avgKeywordRank, change: keywords.filter((k) => k.change !== 0).length },
      {
        period: "Weekly",
        avgRank: avgKeywordRank,
        change: keywords.filter((k) => k.change > 0).length - keywords.filter((k) => k.change < 0).length,
      },
      { period: "Monthly", avgRank: avgKeywordRank, change: visibility?.organicTraffic ?? 0 },
    ],
    citationHealth: {
      score: scores.citationHealth,
      googleListed: Boolean(listing?.place_id),
      otherDirectories: {
        listed: citationListings.filter((c) => c.status === "live").length - (listing ? 1 : 0),
        total: TOP_DIRECTORIES.length - 1,
      },
      errors: {
        missingListings: citationListings.filter((c) => c.status === "missing").length,
        duplicateListings: napAudit.duplicateListings,
        phoneMismatch: napAudit.fields.find((f) => f.field === "Phone Number" && !f.consistent) ? 1 : 0,
        addressMismatch: napAudit.fields.find((f) => f.field === "Street Address" && !f.consistent) ? 1 : 0,
      },
      opportunities: scores.citationHealth < 70
        ? ["Ensure NAP consistency across top directories", ...citationGaps.slice(0, 2)]
        : citationGaps.slice(0, 2),
      missingDirectories: missingDirs,
      competitorCitations: citationGaps,
      listings: citationListings,
    },
    competitorAiInsights: listing
      ? competitors
          .filter((c) => !c.isYou && c.reviews > yourReviews)
          .slice(0, 3)
          .map(
            (c) =>
              `${c.name} has ${c.reviews} reviews vs your ${yourReviews} — stronger review volume may boost their Maps ranking.`
          )
      : [],
    opportunityGaps: [
      {
        label: "Competition intensity",
        score: competitionAnalysis.score,
        insight: competitionAnalysis.summary,
      },
      ...(reviewGap > 0
        ? [
            {
              label: "Review gap vs leader",
              score: Math.min(100, reviewGap * 3),
              insight: `Close the gap with ~${reviewGap} more Google reviews.`,
            },
          ]
        : []),
    ],
    aiRankingInsights: [
      ...(listing?.position
        ? [`Live Maps position: #${listing.position} for "${searchQuery}"`]
        : ["Listing not found — verify business name, location, or add a Google Maps link"]),
      ...(geoGrid
        ? [`Geo-grid visibility: ${geoGrid.visibilityScore}% across ${geoGrid.points.length} points`]
        : []),
      ...(visibility
        ? visibility.searchQueries
            .filter((q) => q.rank > 0)
            .map((q) => `${q.label} search ("${q.query}") — rank #${q.rank}`)
        : []),
      ...keywords
        .filter((k) => k.rank > 0)
        .slice(0, 3)
        .map((k) => `"${k.keyword}" — rank #${k.rank}`),
    ],
  };

  const reviews: Partial<ReviewsDoc> = {
    inbox: reviewData?.inbox ?? [],
    placeId: reviewData?.placeId ?? listing?.place_id,
    fetchedAt: reviewData?.fetchedAt,
    scannedCount: reviewData?.scannedCount,
    totalOnGoogle: reviewData?.placeReviewCount ?? listing?.reviews,
    reviewGoal: {
      needed: reviewGap > 0 ? reviewGap : 10,
      target: competitors.find((c) => !c.isYou)?.name ?? "local leader",
      currentGap: reviewGap,
    },
    sentiment: reviewData?.sentiment ?? {
      positive: listing?.rating && listing.rating >= 4 ? 70 : 40,
      neutral: 20,
      negative: listing?.rating && listing.rating < 4 ? 30 : 10,
      nps: listing?.rating ? Math.round((listing.rating - 3) * 25) : 0,
      avgResponseTimeHours: 0,
      velocityPerMonth: reviewData?.inbox.length ?? 0,
    },
    monitoredPlatforms: [
      {
        name: "Google",
        count: reviewData?.placeReviewCount ?? listing?.reviews ?? 0,
        connected: Boolean(listing?.place_id),
      },
      { name: "Facebook", count: 0, connected: false },
      { name: "Yelp", count: 0, connected: false },
      { name: "TripAdvisor", count: 0, connected: false },
    ],
  };

  const profileOptimization = listing
    ? buildProfileOptimizationFromListing(listing, {
        mapsLink: business.mapsPlaceId ?? listing.place_id,
        websiteUrl: business.website,
      })
    : undefined;

  return {
    listing,
    business: {
      ...business,
      napAudit,
      gbpAuditChecklist,
    },
    dashboard,
    rankings,
    reviews,
    profileOptimization,
    scores,
  };
}
