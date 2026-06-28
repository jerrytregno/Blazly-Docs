"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { FeaturePanel } from "@/components/features/feature-panel";
import {
  AnalyticsComparisonCards,
  AnalyticsKpiSection,
} from "@/components/analytics/analytics-kpi-section";
import { AnalyticsTrafficSection } from "@/components/analytics/analytics-traffic-section";
import { AnalyticsReviewsSection } from "@/components/analytics/analytics-reviews-section";
import { AnalyticsPopularTimesSection } from "@/components/analytics/analytics-popular-times-section";
import { AnalyticsComparisonSection } from "@/components/analytics/analytics-comparison-section";
import { AnalyticsScoresSection } from "@/components/analytics/analytics-scores-section";
import { AnalyticsAiInsightsPanel } from "@/components/analytics/analytics-ai-insights-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AnalyticsAiInsights, AnalyticsDoc } from "@/types/firestore";
import { hasBusinessWebsite } from "@/lib/seo/maps-place";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { business, dashboard, reviews, analyzing, runAnalysis } = useData();
  const [doc, setDoc] = useState<AnalyticsDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [error, setError] = useState("");

  const hasAnalysis =
    dashboard?.analysisStatus === "complete" && (dashboard?.metrics.overallScore ?? 0) > 0;

  const loadAnalytics = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/analytics?userId=${user.uid}&refresh=false`);
      if (res.ok) {
        setDoc((await res.json()) as AnalyticsDoc);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to load analytics");
      }
    } catch {
      setError("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (hasAnalysis) {
      loadAnalytics();
    } else {
      setLoading(false);
    }
  }, [user, hasAnalysis, loadAnalytics, dashboard?.lastAnalyzedAt, reviews?.fetchedAt]);

  const buildReport = async () => {
    if (!user) return;
    setBuilding(true);
    setError("");
    try {
      const res = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, periodDays: 30 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to build analytics");
      setDoc({ userId: user.uid, aiInsights: doc?.aiInsights ?? null, ...data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to build analytics");
    } finally {
      setBuilding(false);
    }
  };

  const handleRefreshData = async () => {
    setBuilding(true);
    try {
      await runAnalysis();
      await buildReport();
    } finally {
      setBuilding(false);
    }
  };

  const generateInsights = async () => {
    if (!user) return;
    setGeneratingInsights(true);
    setError("");
    try {
      const res = await fetch("/api/analytics/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate insights");
      setDoc((prev) =>
        prev
          ? { ...prev, aiInsights: data.aiInsights as AnalyticsAiInsights }
          : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate insights");
    } finally {
      setGeneratingInsights(false);
    }
  };

  const report = doc?.report;
  const hasWebsite =
    report?.hasWebsite ?? hasBusinessWebsite(business?.website);

  return (
    <PageDataGuard>
      <div className="space-y-6 pb-20 md:pb-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <BarChart3 className="h-7 w-7 text-indigo-600" />
              Analytics
            </h1>
            <p className="mt-1 text-gray-600">
              GBP performance, traffic trends, reviews, footfall, and competitor comparisons.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleRefreshData}
              disabled={building || analyzing}
              className="gap-2"
            >
              {building || analyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh data
            </Button>
            <Button onClick={buildReport} disabled={building || !hasAnalysis} className="gap-2">
              {building ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {report ? "Rebuild report" : "Generate report"}
            </Button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {!hasAnalysis && !loading && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-6 text-center">
              <p className="font-medium text-gray-900">Run SEO analysis first</p>
              <p className="mt-1 text-sm text-gray-600">
                Analytics uses your latest Google Maps, review, and competitor data from SEO analysis.
              </p>
              <Button className="mt-4" onClick={() => runAnalysis()} disabled={analyzing}>
                Run analysis
              </Button>
            </CardContent>
          </Card>
        )}

        {loading && !report ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : report ? (
          <>
            <FeaturePanel title="Business analytics dashboard">
              <AnalyticsKpiSection
                user={report.userBusiness}
                competitor={report.competitor}
                hasWebsite={hasWebsite}
              />
              <div className="mt-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  You vs competitor
                </h3>
                <AnalyticsComparisonCards
                  comparisons={report.comparisons.filter(
                    (c) => hasWebsite || c.label !== "Website Traffic"
                  )}
                />
              </div>
            </FeaturePanel>

            <FeaturePanel title="Traffic trend analysis">
              <AnalyticsTrafficSection
                dailyTrend={report.dailyTrend}
                trafficSummary={report.trafficSummary}
                hasWebsite={hasWebsite}
              />
            </FeaturePanel>

            <FeaturePanel title="Reviews & ratings analytics">
              <AnalyticsReviewsSection
                userReviews={report.userReviews}
                competitorReviews={report.competitorReviews}
                competitorName={report.competitor.name}
              />
            </FeaturePanel>

            <FeaturePanel title="Popular times / footfall">
              <AnalyticsPopularTimesSection
                userTimes={report.userPopularTimes}
                competitorTimes={report.competitorPopularTimes}
                userPeakHour={report.userPeakHour}
                competitorPeakHour={report.competitorPeakHour}
                competitorName={report.competitor.name}
              />
            </FeaturePanel>

            <FeaturePanel title="User vs competitor comparison">
              <AnalyticsComparisonSection
                rows={report.comparisonTable.filter(
                  (row) => hasWebsite || !row.metric.startsWith("Website Traffic")
                )}
                betterPerforming={report.betterPerforming}
                opportunityAreas={report.opportunityAreas}
                businessName={business?.name ?? "Your business"}
                competitorName={report.competitor.name}
              />
            </FeaturePanel>

            <FeaturePanel title="SEO & visibility scores">
              <AnalyticsScoresSection scores={report.scores} />
            </FeaturePanel>

            <AnalyticsAiInsightsPanel
              insights={doc?.aiInsights ?? null}
              generating={generatingInsights}
              onGenerate={generateInsights}
            />
          </>
        ) : (
          hasAnalysis && (
            <Card className="border-gray-200 bg-white">
              <CardContent className="py-16 text-center">
                <BarChart3 className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-4 font-medium text-gray-900">No analytics report yet</p>
                <p className="mt-1 text-sm text-gray-500">
                  Generate a 30-day analytics report from your latest SEO data.
                </p>
                <Button className="mt-6" onClick={buildReport} disabled={building}>
                  Generate report
                </Button>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </PageDataGuard>
  );
}
