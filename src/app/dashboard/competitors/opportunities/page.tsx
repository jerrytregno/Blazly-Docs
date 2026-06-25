"use client";

import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { InsightPanel } from "@/components/dashboard/widgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";

export default function OpportunitiesPage() {
  const { rankings } = useData();

  return (
    <PageDataGuard>
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Opportunity Analysis — Gap Scores</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {(rankings?.opportunityGaps ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">No gap analysis data yet.</p>
            ) : (
              rankings?.opportunityGaps.map((gap) => (
                <div key={gap.label}>
                  <div className="mb-1 flex justify-between text-sm text-slate-700"><span className="font-medium">{gap.label}</span><span>{gap.score}/100</span></div>
                  <ProgressBar value={gap.score} />
                  <p className="mt-1 text-xs text-slate-400">{gap.insight}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <InsightPanel title="AI Insights" items={rankings?.competitorAiInsights.length ? rankings.competitorAiInsights : ["Run competitor analysis to generate insights"]} variant="ai" />
      </div>
    </PageDataGuard>
  );
}
