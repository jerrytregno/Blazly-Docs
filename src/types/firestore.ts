export interface WeeklyHour {
  day: string;
  hours: string;
}

export interface BusinessService {
  name: string;
  description: string;
}

export interface ImageSection {
  type: string;
  count: number;
  status: string;
}

export interface BusinessDoc {
  userId: string;
  napAudit?: NapAudit;
  gbpAuditChecklist?: GbpAuditItem[];
  name: string;
  businessId: string;
  /** Website URL entered by the user during onboarding or settings */
  userWebsite?: string;
  website: string;
  phone: string;
  status: string;
  country: string;
  state: string;
  city: string;
  address: string;
  zip: string;
  serviceAreas: string[];
  primaryCategory: string;
  additionalCategories: string[];
  competitorCategories: string[];
  missingCategories: string[];
  categoryRecommendations: string[];
  description: string;
  shortDescription: string;
  businessSummary: string;
  missingKeywords: string[];
  missingServicesInDescription: string[];
  readabilityScore: number;
  weeklyHours: WeeklyHour[];
  holidayHours: { date: string; hours: string }[];
  specialHours: { date: string; hours: string }[];
  temporaryClosures: string[];
  services: BusinessService[];
  competitorServices: string[];
  missingServices: string[];
  imageSections: ImageSection[];
  /** User-provided Google Maps Place ID or link — used for direct lookup */
  mapsPlaceId?: string;
}

export interface DashboardMetrics {
  overallScore: number;
  aiVisibility: number;
  organicTraffic: number;
  localVisibility: number;
  gbpHealth: number;
  citationHealth: number;
  reviewScore: number;
  averageRank: number;
  top3Keywords: number;
  top10Keywords: number;
  rankingGains: number;
  rankingLosses: number;
  totalReviews: number;
  reviewsThisMonth: number;
  averageRating: number;
  responseRate: number;
}

export interface IssueItem {
  label: string;
  severity: "high" | "medium" | "low";
}

export interface ScoreItem {
  label: string;
  score: number;
}

export interface LocalSeoFactorScore {
  key: string;
  label: string;
  weight: string;
  score: number;
  why: string;
  contribution: number;
}

export interface ProgressArea {
  label: string;
  progress: number;
}

export interface StrategistTask {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
  priority: "high" | "medium" | "low";
}

export interface StrategistRecommendation {
  title: string;
  priority: string;
  impact: string;
  category: string;
}

export interface DashboardDoc {
  userId: string;
  visibilityScore?: number;
  listingSyncStatus?: "synced" | "pending" | "issues";
  metrics: DashboardMetrics;
  issues: IssueItem[];
  aiRecommendations: string[];
  gbpHealthBreakdown: ScoreItem[];
  localSeoFactors?: LocalSeoFactorScore[];
  progressAreas: ProgressArea[];
  strategistTasks: StrategistTask[];
  strategistRecommendations: StrategistRecommendation[];
  aiInsights: string[];
  analysisStatus?: "pending" | "analyzing" | "complete" | "error";
  lastAnalyzedAt?: string | null;
  analysisError?: string | null;
  searchRegion?: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  text: string;
  source: string;
  date: string;
  replied: boolean;
}

export interface ReviewCampaign {
  type: string;
  description: string;
  status: string;
}

export interface ReviewGoal {
  needed: number;
  target: string;
  currentGap: number;
}

export interface ReviewsDoc {
  userId: string;
  inbox: ReviewItem[];
  campaigns: ReviewCampaign[];
  reviewGoal: ReviewGoal;
  sentiment?: ReviewSentiment;
  monitoredPlatforms?: MonitoredPlatform[];
  /** Google place_id these reviews were fetched for */
  placeId?: string;
  /** ISO timestamp of last Google review fetch */
  fetchedAt?: string;
  /** How many reviews were scanned in the last fetch (paginated) */
  scannedCount?: number;
  /** Total reviews on Google for this place */
  totalOnGoogle?: number;
  /** Answered reviews found while scanning (not stored in inbox) */
  answeredCount?: number;
}

export interface Competitor {
  name: string;
  distance: string;
  rating: number;
  reviews: number;
  rank: number;
  isYou?: boolean;
  categories: number;
  photos: number;
  posts: number;
  services: number;
  citations: number;
}

export interface Keyword {
  keyword: string;
  volume: number;
  rank: number;
  change: number;
  group: string;
}

export interface KeywordGroup {
  name: string;
  count: number;
  keywords: string[];
}

export interface RankingTrend {
  period: string;
  avgRank: number;
  change: number;
}

export interface MapsRankingType {
  type: string;
  rank: number;
  change: number;
}

export interface CitationListing {
  directory: string;
  status: "live" | "dead" | "missing" | "duplicate";
  napMatch: boolean;
  authority: number;
  value: number;
  submitable: boolean;
  url?: string;
}

export interface NapField {
  field: string;
  gbpValue: string;
  webValue: string;
  consistent: boolean;
}

export interface NapAudit {
  score: number;
  fields: NapField[];
  duplicateListings: number;
}

export interface GeoGridPoint {
  row: number;
  col: number;
  rank: number;
}

export interface GeoGridScan {
  keyword: string;
  centerRank: number;
  averageRank: number;
  visibilityScore: number;
  points: GeoGridPoint[];
  scannedAt: string;
}

export interface ShareOfVoice {
  keyword: string;
  yourShare: number;
  topCompetitor: string;
  competitorShare: number;
}

export interface GbpAuditItem {
  label: string;
  passed: boolean;
  priority: "high" | "medium" | "low";
  tip?: string;
}

export interface ReviewSentiment {
  positive: number;
  neutral: number;
  negative: number;
  nps: number;
  avgResponseTimeHours: number;
  velocityPerMonth: number;
}

export interface MonitoredPlatform {
  name: string;
  count: number;
  connected: boolean;
}

export interface CitationHealth {
  score: number;
  googleListed: boolean;
  otherDirectories: { listed: number; total: number };
  errors: {
    missingListings: number;
    duplicateListings: number;
    phoneMismatch: number;
    addressMismatch: number;
  };
  opportunities: string[];
  missingDirectories: string[];
  competitorCitations: string[];
  listings?: CitationListing[];
}

export interface ActivityItem {
  type: string;
  business: string;
  detail: string;
  time: string;
}

export interface OpportunityGap {
  label: string;
  score: number;
  insight: string;
}

export type CompetitionLevel = "low" | "medium" | "high";

export interface CompetitionFactor {
  label: string;
  value: string;
  impact: CompetitionLevel;
}

export interface CompetitionAnalysis {
  category: string;
  location: string;
  businessName: string;
  level: CompetitionLevel;
  levelLabel: string;
  /** 0–100 competition intensity (higher = more competitive) */
  score: number;
  competitorCount: number;
  avgCompetitorRating: number;
  avgCompetitorReviews: number;
  establishedCompetitors: number;
  dominantCompetitors: number;
  yourRank?: number;
  /** Maps search query used to determine yourRank */
  mapsRankQuery?: string;
  yourRating?: number;
  yourReviews?: number;
  topCompetitor?: {
    name: string;
    rating: number;
    reviews: number;
    rank: number;
  };
  summary: string;
  factors: CompetitionFactor[];
  searchedAt: string;
}

export interface RankingsDoc {
  userId: string;
  aiSearchSignals?: {
    chatgpt: { mentions: number; cited: number };
    aiOverview: { mentions: number; cited: number };
    aiMode: { mentions: number; cited: number };
    gemini: { mentions: number; cited: number };
  };
  visibilityQueries?: Array<{ label: string; query: string; rank: number }>;
  keywords: Keyword[];
  keywordGroups: KeywordGroup[];
  rankingTrends: RankingTrend[];
  mapsRankingTypes: MapsRankingType[];
  competitors: Competitor[];
  competitionAnalysis?: CompetitionAnalysis;
  citationHealth: CitationHealth;
  napAudit?: NapAudit;
  geoGrid?: GeoGridScan | null;
  shareOfVoice?: ShareOfVoice[];
  activityFeed: ActivityItem[];
  opportunityGaps: OpportunityGap[];
  competitorAiInsights: string[];
  aiRankingInsights: string[];
}

export type ProfileImpactLevel = "high" | "medium" | "low";

export interface ProfileFieldAudit {
  field: string;
  label: string;
  status: "complete" | "missing" | "incomplete";
  value?: string;
  tip?: string;
}

export interface ProfileOptimizationScores {
  profileCompleteness: number;
  localSeo: number;
  reputation: number;
  visibility: number;
  localSeoFactors?: LocalSeoFactorScore[];
}

export interface ProfileRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  impact: ProfileImpactLevel;
  action?: string;
}

export interface ProfileActionPlan {
  quickWins: string[];
  shortTerm: string[];
  longTerm: string[];
}

export interface ProfileEnhancementSections {
  businessInformation: ProfileRecommendation[];
  businessDescription: ProfileRecommendation[];
  reviewsOptimization: ProfileRecommendation[];
  photosOptimization: ProfileRecommendation[];
  servicesOptimization: ProfileRecommendation[];
  gbpOptimization: ProfileRecommendation[];
}

export interface ProfileEnhancement {
  generatedAt: string;
  optimizedDescription?: string;
  recommendations: ProfileRecommendation[];
  sections: ProfileEnhancementSections;
  actionPlan: ProfileActionPlan;
}

export interface ProfileSnapshot {
  name: string;
  address: string;
  phone: string;
  website: string;
  primaryCategory: string;
  additionalCategories: string[];
  hoursSummary: string;
  weeklyHours: { day: string; hours: string }[];
  reviewsCount: number;
  averageRating: number;
  description: string;
  photosCount: number;
  services: string[];
  attributes: string[];
  placeId?: string;
}

export interface ProfileOptimizationDoc {
  userId: string;
  websiteUrl: string;
  mapsLink: string;
  snapshot: ProfileSnapshot | null;
  fieldAudit: ProfileFieldAudit[];
  scores: ProfileOptimizationScores;
  enhancement: ProfileEnhancement | null;
  analyzedAt: string | null;
  error: string | null;
}

export interface AnalyticsDailyPoint {
  date: string;
  websiteTraffic: number;
  gbpViews: number;
  engagement: number;
}

export interface AnalyticsBusinessMetrics {
  websiteTraffic: number;
  gbpViews: number;
  calls: number;
  directionRequests: number;
  websiteClicks: number;
  reviewsReceived: number;
  averageRating: number;
}

export interface AnalyticsCompetitorMetrics {
  name: string;
  reviewsCount: number;
  averageRating: number;
  ratingTrend: number;
  visibilityScore: number;
  newReviews30d: number;
}

export interface AnalyticsComparisonMetric {
  label: string;
  userValue: number | string;
  competitorValue: number | string;
  userWins: boolean;
  growthPercent?: number;
  differencePercent?: number;
  unit?: string;
}

export interface AnalyticsDayHours {
  day: string;
  open: string;
  close: string;
  closed?: boolean;
}

export interface AnalyticsPopularHour {
  hour: number;
  label: string;
  visitors: number;
  level: "very-high" | "high" | "medium" | "low" | "very-low";
}

export interface AnalyticsRatingBucket {
  stars: number;
  count: number;
}

export interface AnalyticsReviewMetrics {
  totalReviews: number;
  newReviews30d: number;
  averageRating: number;
  ratingTrend: number;
  distribution: AnalyticsRatingBucket[];
}

export interface AnalyticsTrafficSummary {
  highestDay: { date: string; value: number };
  lowestDay: { date: string; value: number };
  averageDaily: number;
}

export interface AnalyticsScores {
  trafficScore: number;
  reviewScore: number;
  reputationScore: number;
  engagementScore: number;
  visibilityScore: number;
  overallScore: number;
}

export interface AnalyticsComparisonRow {
  metric: string;
  user: string;
  competitor: string;
  winner: "user" | "competitor" | "tie";
}

export interface AnalyticsInsightItem {
  text: string;
  priority: "high" | "medium" | "low";
}

export interface AnalyticsAiInsights {
  generatedAt: string;
  strengths: AnalyticsInsightItem[];
  weaknesses: AnalyticsInsightItem[];
  recommendations: AnalyticsInsightItem[];
}

export interface AnalyticsReport {
  periodDays: number;
  generatedAt: string;
  hasWebsite: boolean;
  userBusiness: AnalyticsBusinessMetrics;
  competitor: AnalyticsCompetitorMetrics;
  comparisons: AnalyticsComparisonMetric[];
  dailyTrend: AnalyticsDailyPoint[];
  trafficSummary: AnalyticsTrafficSummary;
  userReviews: AnalyticsReviewMetrics;
  competitorReviews: AnalyticsReviewMetrics;
  userHours: AnalyticsDayHours[];
  competitorHours: AnalyticsDayHours[];
  userPopularTimes: AnalyticsPopularHour[];
  competitorPopularTimes: AnalyticsPopularHour[];
  userPeakHour: string;
  competitorPeakHour: string;
  comparisonTable: AnalyticsComparisonRow[];
  opportunityAreas: string[];
  betterPerforming: "user" | "competitor";
  scores: AnalyticsScores;
  dataNote: string;
}

export interface AnalyticsDoc {
  userId: string;
  report: AnalyticsReport | null;
  aiInsights: AnalyticsAiInsights | null;
  analyzedAt: string | null;
  error: string | null;
}

export interface KeywordResearchListing {
  position: number;
  placeId?: string;
  name: string;
  rating: number;
  reviews: number;
  category: string;
  address: string;
  isYou?: boolean;
  photoCount?: number;
}

export interface KeywordOpportunity {
  keyword: string;
  tier: "primary" | "secondary" | "long-tail";
  searchVolume: number;
  competitionScore: number;
  difficulty: number;
}

export interface KeywordResearchScores {
  localRanking: number;
  competitor: number;
  review: number;
  profileOptimization: number;
  overall: number;
}

export interface CompetitorDeepDive {
  placeId: string;
  name: string;
  position: number;
  rating: number;
  reviews: number;
  category: string;
  address: string;
  hoursSummary: string;
  photoCount: number;
  visibilityScore: number;
  description?: string;
  whyTheyRankHigher: string[];
  userComparison: {
    rating: number;
    reviews: number;
    photoCount: number;
    visibilityScore: number;
  };
}

export interface KeywordResearchStrategy {
  generatedAt: string;
  highPriority: string[];
  mediumPriority: string[];
  lowPriority: string[];
}

export interface KeywordResearchReport {
  category: string;
  location: string;
  query: string;
  listings: KeywordResearchListing[];
  yourPosition?: number;
  yourPlaceId?: string;
  keywords: KeywordOpportunity[];
  scores: KeywordResearchScores;
  competitorDetail?: CompetitorDeepDive;
  strategy?: KeywordResearchStrategy;
  searchedAt: string;
}

export interface KeywordResearchDoc {
  userId: string;
  report: KeywordResearchReport | null;
  analyzedAt: string | null;
  error: string | null;
}
