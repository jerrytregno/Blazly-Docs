"use client";

import { useMemo } from "react";
import { Building2, Loader2, RefreshCw } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { FranchiseListingsTable } from "@/components/features/franchise-listings-table";
import { FeaturePanel } from "@/components/features/feature-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFranchiseListings } from "@/hooks/use-franchise-listings";

export default function FranchiseTrackingPage() {
  const { analyzing, runAnalysis, canRerunAnalysis, analysisCooldownMessage } =
    useData();
  const { listings, liveCount, summary, hasData } = useFranchiseListings();
  const { business } = useData();

  const listed = useMemo(
    () => listings.filter((l) => l.status === "live"),
    [listings]
  );
  const missing = useMemo(
    () => listings.filter((l) => l.status === "missing" || l.status === "dead"),
    [listings]
  );

  return (
    <PageDataGuard>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600">
              <Building2 className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">
                Franchise Tracking
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Directory listings</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              See where your business is listed across directories. Data comes from your SEO
              analysis cache — run analysis to refresh listings.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => runAnalysis()}
            disabled={analyzing || !canRerunAnalysis}
            className="gap-2"
          >
            {analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh from analysis
          </Button>
        </div>

        {!canRerunAnalysis && analysisCooldownMessage && (
          <p className="text-sm text-amber-700">{analysisCooldownMessage}</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Live listings</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{summary.live}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Missing</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{summary.missing}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Inactive</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{summary.inactive}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Citation score</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{summary.score}%</p>
            </CardContent>
          </Card>
        </div>

        {!hasData ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-sm text-gray-500">
              Run SEO analysis from the dashboard to populate franchise listing data.
            </CardContent>
          </Card>
        ) : (
          <>
            <FeaturePanel
              title={`Listed platforms (${liveCount})`}
              description="Directories where your business profile appears to be live."
            >
              <FranchiseListingsTable
                listings={listed}
                businessName={business?.name}
                mode="listed"
              />
            </FeaturePanel>

            <FeaturePanel
              title={`Not listed yet (${missing.length})`}
              description="Platforms where you can submit or claim your business listing."
            >
              <FranchiseListingsTable
                listings={missing}
                businessName={business?.name}
                mode="missing"
                emptyMessage="Great — no missing high-value directories detected."
              />
            </FeaturePanel>
          </>
        )}
      </div>
    </PageDataGuard>
  );
}
