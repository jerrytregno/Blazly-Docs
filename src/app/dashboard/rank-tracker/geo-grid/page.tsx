"use client";

import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { GeoGridMap } from "@/components/features/geo-grid-map";
import { ShareOfVoicePanel } from "@/components/features/share-of-voice-panel";
import { FeaturePanel } from "@/components/features/feature-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GeoGridPage() {
  const { rankings, business } = useData();
  const scan = rankings?.geoGrid;

  return (
    <PageDataGuard>
      <div className="space-y-6">
        <FeaturePanel
          title="Local Ranking Grid"
          badge="Whitespark-style geo-grid"
          description={`Visualize how you rank across ${business?.city || "your service area"} at multiple geographic points. Compare visibility by neighborhood and spot ranking blind spots.`}
        >
          <GeoGridMap scan={scan} />
        </FeaturePanel>

        <div className="grid gap-6 lg:grid-cols-2">
          <ShareOfVoicePanel data={rankings?.shareOfVoice} />
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle>Grid Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                {(rankings?.aiRankingInsights.length
                  ? rankings.aiRankingInsights
                  : ["Run analysis to populate grid insights"]
                ).map((item, i) => (
                  <li
                    key={i}
                    className="flex gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageDataGuard>
  );
}
