"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { NapConsistencyPanel } from "@/components/features/nap-consistency-panel";
import { GbpAuditChecklist } from "@/components/features/gbp-audit-checklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function syncStatusBadge(status?: string) {
  switch (status) {
    case "synced":
      return <Badge className="bg-emerald-50 text-emerald-700">Synced</Badge>;
    case "issues":
      return <Badge className="bg-amber-50 text-amber-700">Needs attention</Badge>;
    default:
      return <Badge className="bg-indigo-50 text-indigo-700">Pending</Badge>;
  }
}

export default function NapAuditPage() {
  const {
    business,
    rankings,
    dashboard,
    analyzing,
    analysisError,
    runAnalysis,
  } = useData();
  const audit = rankings?.napAudit ?? business?.napAudit;
  const queued = useRef(false);

  const needsAnalysis = Boolean(business?.name) && !audit && !analyzing;

  useEffect(() => {
    if (!needsAnalysis || queued.current) return;
    queued.current = true;
    runAnalysis().finally(() => {
      queued.current = false;
    });
  }, [needsAnalysis, runAnalysis]);

  const handleRefresh = () => {
    if (!analyzing) runAnalysis();
  };

  return (
    <PageDataGuard>
      <div className="space-y-6">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle>NAP Consistency Checker</CardTitle>
              <p className="text-sm text-slate-500">
                Name, Address, and Phone must match everywhere online. Even small mismatches can hurt Google trust and local rankings.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={analyzing || !business?.name}
              className="shrink-0"
            >
              {analyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {analyzing ? "Analyzing…" : "Run NAP audit"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-slate-400">Listing sync:</span>
              {syncStatusBadge(dashboard?.listingSyncStatus)}
              {audit && (
                <span className="text-slate-400">
                  NAP score: <span className="font-medium text-slate-900">{audit.score}%</span>
                </span>
              )}
              {audit && audit.duplicateListings > 0 && (
                <span className="text-amber-600">
                  {audit.duplicateListings} duplicate listing{audit.duplicateListings > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {analysisError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Analysis failed</p>
                  <p className="mt-1 text-red-600">{analysisError}</p>
                </div>
              </div>
            )}

            {!business?.name && (
              <p className="text-sm text-amber-700">
                Add your business details in{" "}
                <Link href="/dashboard/gbp/business-details" className="underline">
                  Business Details
                </Link>{" "}
                or complete onboarding to run a NAP audit.
              </p>
            )}
          </CardContent>
        </Card>

        <NapConsistencyPanel audit={audit} analyzing={analyzing} />

        <GbpAuditChecklist items={business?.gbpAuditChecklist} />

        {audit && audit.score < 80 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 text-sm text-slate-700">
              <p className="font-medium text-slate-900">Recommended fixes</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-slate-600">
                {audit.fields
                  .filter((f) => !f.consistent)
                  .map((f) => (
                    <li key={f.field}>
                      Align <span className="text-slate-900">{f.field}</span> — GBP shows &quot;{f.gbpValue}&quot;, your profile has &quot;{f.webValue}&quot;
                    </li>
                  ))}
              </ul>
              <Link
                href="/dashboard/gbp/business-details"
                className={cn("mt-3 inline-block text-indigo-600 hover:text-indigo-700")}
              >
                Update business profile →
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </PageDataGuard>
  );
}
