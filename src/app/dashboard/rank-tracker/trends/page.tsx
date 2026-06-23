"use client";

import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TrendsPage() {
  const { rankings } = useData();

  return (
    <PageDataGuard>
      <Card>
        <CardHeader><CardTitle>Ranking Trends</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {(rankings?.rankingTrends ?? []).map((p) => (
              <div key={p.period} className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-sm text-[#b8a9d9]">{p.period}</p>
                <p className="mt-2 text-3xl font-bold text-white">{p.avgRank}</p>
                <p className="text-sm text-[#9b8ab8]">avg rank</p>
                <p className={`mt-1 text-sm ${p.change > 0 ? "text-emerald-400" : p.change < 0 ? "text-red-400" : "text-[#9b8ab8]"}`}>
                  {p.change > 0 ? "+" : ""}{p.change} vs prior period
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageDataGuard>
  );
}
