"use client";

import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ActivityPage() {
  const { rankings } = useData();

  return (
    <PageDataGuard>
      <Card>
        <CardHeader><CardTitle>Activity Feed</CardTitle></CardHeader>
        <CardContent>
          {(rankings?.activityFeed.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-500">No competitor activity tracked yet.</p>
          ) : (
            <ul className="space-y-3">
              {rankings?.activityFeed.map((item, i) => (
                <li key={i} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <div className="flex items-center gap-2"><Badge variant="secondary">{item.type}</Badge><span className="font-medium text-slate-900">{item.business}</span></div>
                    <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{item.time}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </PageDataGuard>
  );
}
