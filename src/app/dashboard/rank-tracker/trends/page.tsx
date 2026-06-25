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
              <div key={p.period} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-sm text-slate-500">{p.period}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{p.avgRank}</p>
                <p className="text-sm text-slate-400">avg rank</p>
                <p className={`mt-1 text-sm ${p.change > 0 ? "text-emerald-600" : p.change < 0 ? "text-red-600" : "text-slate-400"}`}>
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
