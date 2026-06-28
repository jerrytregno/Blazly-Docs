"use client";

import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { ScoreRing } from "@/components/ui/score-ring";
import { CitationTrackerTable } from "@/components/features/citation-tracker-table";
import { NapConsistencyPanel } from "@/components/features/nap-consistency-panel";
import { InsightPanel } from "@/components/dashboard/widgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProFeatureLink } from "@/components/billing/pro-feature-link";

export default function CitationsPage() {
  const { rankings } = useData();
  const c = rankings?.citationHealth;

  return (
    <PageDataGuard>
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row">
            <ScoreRing score={c?.score ?? 0} label="Citation Health Score" />
            <div className="flex-1 space-y-4">
              <div>
                <p className="font-medium text-slate-900">Citation Coverage</p>
                <p className="text-sm text-slate-500">Google: {c?.googleListed ? "Listed" : "Missing"}</p>
                <p className="text-sm text-slate-500">
                  Other Directories: {c?.otherDirectories.listed ?? 0}/{c?.otherDirectories.total ?? 0}
                </p>
              </div>
              <ProFeatureLink
                href="/dashboard/franchise-tracking"
                featureLabel="Franchise Tracking"
                className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700"
              >
                Open Franchise Tracking →
              </ProFeatureLink>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Citation Errors</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700">{c?.errors.missingListings ?? 0} Missing Listings</p>
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700">{c?.errors.duplicateListings ?? 0} Duplicate Listings</p>
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700">{c?.errors.phoneMismatch ?? 0} Phone Mismatches</p>
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700">{c?.errors.addressMismatch ?? 0} Address Mismatches</p>
            </CardContent>
          </Card>
          <NapConsistencyPanel audit={rankings?.napAudit} />
        </div>

        <Card>
          <CardHeader><CardTitle>Live Citation Tracker</CardTitle></CardHeader>
          <CardContent>
            <CitationTrackerTable listings={c?.listings ?? []} />
          </CardContent>
        </Card>

        <InsightPanel title="Citation Opportunities" items={c?.opportunities.length ? c.opportunities : ["No opportunities yet"]} variant="ai" />
      </div>
    </PageDataGuard>
  );
}
