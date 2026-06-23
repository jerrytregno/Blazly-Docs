"use client";

import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { InsightPanel } from "@/components/dashboard/widgets";
import { ShareOfVoicePanel } from "@/components/features/share-of-voice-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function KeywordsPage() {
  const { rankings } = useData();
  const keywords = rankings?.keywords ?? [];

  return (
    <PageDataGuard>
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Keyword Dashboard</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto p-0">
            {keywords.length === 0 ? (
              <p className="p-6 text-sm text-[#b8a9d9]">No keywords tracked yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/10 text-left text-[#9b8ab8]"><th className="p-4">Keyword</th><th className="p-4">Search Volume</th><th className="p-4">Rank</th><th className="p-4">Change</th></tr></thead>
                <tbody>
                  {keywords.map((kw) => (
                    <tr key={kw.keyword} className="border-b border-white/10">
                      <td className="p-4 font-medium text-white">{kw.keyword}</td>
                      <td className="p-4 text-[#d4c4f5]">{kw.volume.toLocaleString()}</td>
                      <td className="p-4 text-[#d4c4f5]">#{kw.rank}</td>
                      <td className="p-4">
                        {kw.change > 0 && <Badge variant="success">+{kw.change}</Badge>}
                        {kw.change < 0 && <Badge variant="warning">{kw.change}</Badge>}
                        {kw.change === 0 && <span className="text-[#9b8ab8]">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
        <ShareOfVoicePanel data={rankings?.shareOfVoice} />
        <div className="flex justify-end">
          <Link href="/dashboard/rank-tracker/geo-grid" className="text-sm text-violet-300 hover:text-violet-200">
            View geo-grid rankings →
          </Link>
        </div>
        <InsightPanel title="AI Ranking Insights" items={rankings?.aiRankingInsights.length ? rankings.aiRankingInsights : ["Add keywords to get AI insights"]} variant="ai" />
      </div>
    </PageDataGuard>
  );
}
