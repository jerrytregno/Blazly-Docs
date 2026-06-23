"use client";

import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { ShareOfVoicePanel } from "@/components/features/share-of-voice-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const metrics = ["Reviews", "Ratings", "Categories", "Photos", "Posts", "Services", "Citations"] as const;

export default function ComparisonPage() {
  const { rankings } = useData();
  const competitors = rankings?.competitors ?? [];
  const top = competitors.filter((c) => !c.isYou).slice(0, 2);
  const you = competitors.find((c) => c.isYou);

  const getValue = (c: typeof you, metric: typeof metrics[number]) => {
    if (!c) return "—";
    switch (metric) {
      case "Reviews": return c.reviews;
      case "Ratings": return c.rating;
      case "Categories": return c.categories;
      case "Photos": return c.photos;
      case "Posts": return c.posts;
      case "Services": return c.services;
      case "Citations": return c.citations;
    }
  };

  const youWins = (metric: typeof metrics[number]) => {
    if (!you || !top.length) return false;
    const yourVal = getValue(you, metric);
    if (typeof yourVal !== "number") return false;
    return top.every((c) => yourVal >= (getValue(c, metric) as number));
  };

  return (
    <PageDataGuard>
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Side-by-Side GBP Comparison</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="p-3 text-[#9b8ab8]">Metric</th>
                  <th className="p-3 text-violet-300">You</th>
                  {top.map((c) => <th key={c.name} className="p-3 text-[#9b8ab8]">{c.name}</th>)}
                  <th className="p-3 text-[#9b8ab8]">Gap</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric) => {
                  const yourVal = getValue(you, metric);
                  const bestCompetitor = top.reduce((best, c) => {
                    const v = getValue(c, metric);
                    return typeof v === "number" && v > (best as number) ? v : best;
                  }, 0);
                  const gap = typeof yourVal === "number" ? (bestCompetitor as number) - yourVal : 0;

                  return (
                    <tr key={metric} className="border-b border-white/10">
                      <td className="p-3 font-medium text-white">{metric}</td>
                      <td className={cn("p-3", youWins(metric) ? "text-emerald-400" : "text-[#d4c4f5]")}>
                        {yourVal}
                        {youWins(metric) && <Badge variant="success" className="ml-2 text-[10px]">Lead</Badge>}
                      </td>
                      {top.map((c) => (
                        <td key={c.name} className="p-3 text-[#d4c4f5]">{getValue(c, metric)}</td>
                      ))}
                      <td className="p-3">
                        {gap > 0 ? (
                          <span className="text-amber-400">-{gap}</span>
                        ) : (
                          <span className="text-emerald-400">+{Math.abs(gap)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <ShareOfVoicePanel data={rankings?.shareOfVoice} />
      </div>
    </PageDataGuard>
  );
}
