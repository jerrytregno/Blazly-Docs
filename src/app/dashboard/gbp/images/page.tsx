"use client";

import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { InsightPanel } from "@/components/dashboard/widgets";
import { StatCard } from "@/components/dashboard/widgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ImagesPage() {
  const { business } = useData();
  const sections = business?.imageSections ?? [];
  const total = sections.reduce((sum, i) => sum + i.count, 0);
  const missing = sections.filter((i) => i.status === "missing").length;

  return (
    <PageDataGuard>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Photo Count" value={total} />
          <StatCard label="Missing Image Types" value={missing} />
          <StatCard label="Competitor Avg" value={0} subtext="photos" />
        </div>
        <Card>
          <CardHeader><CardTitle>Image Management</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {sections.map((img) => (
                <li key={img.type} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <span className="font-medium text-slate-900">{img.type}</span>
                  <span className="text-slate-500">{img.count} uploaded · {img.status}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <InsightPanel title="Insights" items={["Upload photos to improve GBP health score"]} variant="ai" />
      </div>
    </PageDataGuard>
  );
}
