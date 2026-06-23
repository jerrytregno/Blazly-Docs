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
            <p className="text-sm text-[#b8a9d9]">No competitor activity tracked yet.</p>
          ) : (
            <ul className="space-y-3">
              {rankings?.activityFeed.map((item, i) => (
                <li key={i} className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <div className="flex items-center gap-2"><Badge variant="secondary">{item.type}</Badge><span className="font-medium text-white">{item.business}</span></div>
                    <p className="mt-1 text-sm text-[#b8a9d9]">{item.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs text-[#9b8ab8]">{item.time}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </PageDataGuard>
  );
}
