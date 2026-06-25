"use client";

import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { LocalSeoPerformanceCard } from "@/components/dashboard/local-seo-performance-card";
import { DashboardInsightsRow, ProgressOverview } from "@/components/dashboard/dashboard-insights";
import { FeatureHighlightsRow } from "@/components/dashboard/feature-highlights-row";

export default function DashboardPage() {
  const {
    business,
    dashboard,
    rankings,
    reviews,
    profileOptimization,
    analyzing,
    analysisError,
    canRerunAnalysis,
    analysisCooldownMessage,
    runAnalysis,
  } = useData();

  const isAnalyzing = analyzing || dashboard?.analysisStatus === "analyzing";
  const hasData =
    dashboard?.analysisStatus === "complete" && dashboard.metrics.overallScore > 0;

  return (
    <PageDataGuard>
      <div className="space-y-8 pb-20 md:pb-0">
        <DashboardHeader
          business={business}
          analyzing={!!isAnalyzing}
          lastAnalyzedAt={dashboard?.lastAnalyzedAt}
          canRerunAnalysis={canRerunAnalysis}
          analysisCooldownMessage={analysisCooldownMessage}
          onRefresh={() => runAnalysis()}
        />

        {analysisError && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Analysis failed</p>
              <p className="mt-1 text-red-700">{analysisError}</p>
            </div>
          </div>
        )}

        {isAnalyzing && !hasData ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-gray-200 bg-white py-20 text-center shadow-sm">
            <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
            <div>
              <p className="font-medium text-gray-900">Analyzing your business...</p>
              <p className="mt-1 text-sm text-gray-500">
                Fetching Google Maps data, reviews, and local SEO signals
              </p>
            </div>
          </div>
        ) : dashboard ? (
          <>
            <LocalSeoPerformanceCard
              dashboard={dashboard}
              business={business}
              rankings={rankings}
              reviews={reviews}
            />

            <ProgressOverview
              areas={dashboard.progressAreas}
              rankings={rankings}
              dashboard={dashboard}
            />

            <FeatureHighlightsRow
              dashboard={dashboard}
              rankings={rankings}
              reviews={reviews}
              business={business}
              profileOptimization={profileOptimization}
            />

            <DashboardInsightsRow dashboard={dashboard} rankings={rankings} />

            {!business?.name && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Complete your{" "}
                <Link href="/dashboard/business-settings" className="underline">
                  business settings
                </Link>{" "}
                or{" "}
                <button
                  type="button"
                  onClick={() => runAnalysis()}
                  disabled={!canRerunAnalysis}
                  className="underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
                >
                  refresh analysis
                </button>{" "}
                to populate live local SEO data.
              </div>
            )}
          </>
        ) : null}
      </div>
    </PageDataGuard>
  );
}
