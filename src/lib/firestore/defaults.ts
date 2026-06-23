import type { OnboardingInput } from "@/types/user";
import { parseGoogleMapsPlaceId } from "@/lib/seo/maps-place";
import type {
  BusinessDoc,
  DashboardDoc,
  ProfileOptimizationDoc,
  AnalyticsDoc,
  KeywordResearchDoc,
  RankingsDoc,
  ReviewsDoc,
} from "@/types/firestore";

const defaultWeeklyHours = [
  { day: "Monday", hours: "9:00 AM – 6:00 PM" },
  { day: "Tuesday", hours: "9:00 AM – 6:00 PM" },
  { day: "Wednesday", hours: "9:00 AM – 6:00 PM" },
  { day: "Thursday", hours: "9:00 AM – 7:00 PM" },
  { day: "Friday", hours: "9:00 AM – 5:00 PM" },
  { day: "Saturday", hours: "10:00 AM – 2:00 PM" },
  { day: "Sunday", hours: "Closed" },
];

export function createDefaultBusiness(
  userId: string,
  input: OnboardingInput
): BusinessDoc {
  const website = input.website.trim().replace(/^https?:\/\//, "");
  return {
    userId,
    name: input.businessName.trim(),
    businessId: "",
    userWebsite: website,
    website,
    phone: "",
    status: "Open",
    country: "",
    state: "",
    city: input.location.trim(),
    address: "",
    zip: "",
    serviceAreas: [],
    primaryCategory: input.category.trim(),
    mapsPlaceId: parseGoogleMapsPlaceId(input.mapsPlaceId) ?? input.mapsPlaceId?.trim() ?? "",
    additionalCategories: [],
    competitorCategories: [],
    missingCategories: [],
    categoryRecommendations: [],
    description: "",
    shortDescription: "",
    businessSummary: "",
    missingKeywords: [],
    missingServicesInDescription: [],
    readabilityScore: 0,
    weeklyHours: defaultWeeklyHours,
    holidayHours: [],
    specialHours: [],
    temporaryClosures: [],
    services: [],
    competitorServices: [],
    missingServices: [],
    imageSections: [
      { type: "Logo", count: 0, status: "missing" },
      { type: "Cover Photo", count: 0, status: "missing" },
      { type: "Team Photos", count: 0, status: "missing" },
      { type: "Interior Photos", count: 0, status: "missing" },
      { type: "Exterior Photos", count: 0, status: "missing" },
      { type: "Product Photos", count: 0, status: "missing" },
    ],
  };
}

export function createDefaultDashboard(userId: string): DashboardDoc {
  return {
    userId,
    metrics: {
      overallScore: 0,
      aiVisibility: 0,
      organicTraffic: 0,
      localVisibility: 0,
      gbpHealth: 0,
      citationHealth: 0,
      reviewScore: 0,
      averageRank: 0,
      top3Keywords: 0,
      top10Keywords: 0,
      rankingGains: 0,
      rankingLosses: 0,
      totalReviews: 0,
      reviewsThisMonth: 0,
      averageRating: 0,
      responseRate: 0,
    },
    issues: [],
    aiRecommendations: [],
    gbpHealthBreakdown: [
      { label: "Categories", score: 0 },
      { label: "Services", score: 0 },
      { label: "Photos", score: 0 },
      { label: "Description", score: 0 },
      { label: "Hours", score: 0 },
    ],
    progressAreas: [
      { label: "GBP Optimization", progress: 0 },
      { label: "Citation Fixes", progress: 0 },
      { label: "Review Growth", progress: 0 },
      { label: "Keyword Rankings", progress: 0 },
    ],
    strategistTasks: [],
    strategistRecommendations: [],
    aiInsights: [],
    analysisStatus: "pending",
    lastAnalyzedAt: null,
    analysisError: null,
    searchRegion: "us",
  };
}

export function createDefaultReviews(userId: string): ReviewsDoc {
  return {
    userId,
    inbox: [],
    campaigns: [
      {
        type: "SMS Campaign",
        description: "Send review requests via text after appointments",
        status: "Draft",
      },
      {
        type: "Email Campaign",
        description: "Automated email follow-ups requesting Google reviews",
        status: "Draft",
      },
      {
        type: "QR Code Campaign",
        description: "In-office QR codes linking directly to review page",
        status: "Draft",
      },
    ],
    reviewGoal: { needed: 0, target: "", currentGap: 0 },
  };
}

export function createDefaultRankings(
  userId: string,
  businessName: string
): RankingsDoc {
  return {
    userId,
    keywords: [],
    keywordGroups: [],
    rankingTrends: [
      { period: "Daily", avgRank: 0, change: 0 },
      { period: "Weekly", avgRank: 0, change: 0 },
      { period: "Monthly", avgRank: 0, change: 0 },
    ],
    mapsRankingTypes: [
      { type: "Google Maps", rank: 0, change: 0 },
      { type: "Local Pack", rank: 0, change: 0 },
      { type: "Organic Search", rank: 0, change: 0 },
    ],
    competitors: [
      {
        name: businessName,
        distance: "—",
        rating: 0,
        reviews: 0,
        rank: 0,
        isYou: true,
        categories: 0,
        photos: 0,
        posts: 0,
        services: 0,
        citations: 0,
      },
    ],
    citationHealth: {
      score: 0,
      googleListed: false,
      otherDirectories: { listed: 0, total: 0 },
      errors: {
        missingListings: 0,
        duplicateListings: 0,
        phoneMismatch: 0,
        addressMismatch: 0,
      },
      opportunities: [],
      missingDirectories: [],
      competitorCitations: [],
    },
    activityFeed: [],
    opportunityGaps: [],
    competitorAiInsights: [],
    aiRankingInsights: [],
  };
}

export function createDefaultProfileOptimization(
  userId: string
): ProfileOptimizationDoc {
  return {
    userId,
    websiteUrl: "",
    mapsLink: "",
    snapshot: null,
    fieldAudit: [],
    scores: {
      profileCompleteness: 0,
      localSeo: 0,
      reputation: 0,
      visibility: 0,
    },
    enhancement: null,
    analyzedAt: null,
    error: null,
  };
}

export function createDefaultAnalytics(userId: string): AnalyticsDoc {
  return {
    userId,
    report: null,
    aiInsights: null,
    analyzedAt: null,
    error: null,
  };
}

export function createDefaultKeywordResearch(userId: string): KeywordResearchDoc {
  return {
    userId,
    report: null,
    analyzedAt: null,
    error: null,
  };
}
