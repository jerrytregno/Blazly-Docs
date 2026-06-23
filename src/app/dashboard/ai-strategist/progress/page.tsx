"use client";

import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { ScoreRing } from "@/components/ui/score-ring";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProgressPage() {
  const { dashboard } = useData();

  return (
    <PageDataGuard>
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row">
            <ScoreRing score={dashboard?.metrics.overallScore ?? 0} label="Overall Progress" />
            <div className="flex-1 space-y-4">
              {(dashboard?.progressAreas ?? []).map((area) => (
                <div key={area.label}>
                  <div className="mb-1 flex justify-between text-sm text-[#d4c4f5]"><span>{area.label}</span><span>{area.progress}%</span></div>
                  <ProgressBar value={area.progress} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>GBP Health Progress</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(dashboard?.gbpHealthBreakdown ?? []).map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex justify-between text-sm text-[#d4c4f5]"><span>{item.label}</span><span>{item.score}/100</span></div>
                <ProgressBar value={item.score} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageDataGuard>
  );
}
