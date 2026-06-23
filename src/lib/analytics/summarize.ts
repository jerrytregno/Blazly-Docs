import type { AnalyticsReport } from "@/types/firestore";

export function summarizeAnalyticsReport(
  report: AnalyticsReport,
  businessName: string
): string {
  const u = report.userBusiness;
  const c = report.competitor;
  const s = report.scores;
  return `Business: ${businessName}
Period: last ${report.periodDays} days

User metrics:
${report.hasWebsite !== false ? `- Website traffic: ${u.websiteTraffic}
- Website clicks: ${u.websiteClicks}` : ""}
- GBP views: ${u.gbpViews}
- Calls: ${u.calls}
- Direction requests: ${u.directionRequests}
- New reviews: ${u.reviewsReceived}
- Average rating: ${u.averageRating}
- Peak hour: ${report.userPeakHour}

Competitor (${c.name}):
- Total reviews: ${c.reviewsCount}
- New reviews (30d est.): ${c.newReviews30d}
- Average rating: ${c.averageRating}
- Rating trend: ${c.ratingTrend}%
- Visibility score: ${c.visibilityScore}
- Peak hour: ${report.competitorPeakHour}

Scores (0-100):
- Traffic: ${s.trafficScore}
- Reviews: ${s.reviewScore}
- Reputation: ${s.reputationScore}
- Engagement: ${s.engagementScore}
- Visibility: ${s.visibilityScore}
- Overall: ${s.overallScore}

Better performing: ${report.betterPerforming}
Opportunity areas: ${report.opportunityAreas.join("; ")}`;
}
