"use client";

import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { InsightPanel } from "@/components/dashboard/widgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ServicesPage() {
  const { business } = useData();

  return (
    <PageDataGuard>
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Services</CardTitle></CardHeader>
          <CardContent>
            {(business?.services.length ?? 0) === 0 ? (
              <p className="text-sm text-slate-500">No services added yet.</p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {business?.services.map((s) => (
                  <li key={s.name} className="py-4 first:pt-0 last:pb-0">
                    <p className="font-medium text-slate-900">{s.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{s.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Competitor Services</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">{(business?.competitorServices ?? []).map((s) => <li key={s} className="text-sm text-slate-700">{s}</li>)}</ul>
              {(business?.competitorServices.length ?? 0) === 0 && <p className="text-sm text-slate-500">None listed</p>}
            </CardContent>
          </Card>
          <InsightPanel title="Insights" items={business?.missingServices.length ? [`Missing: ${business.missingServices.join(", ")}`] : ["No service gaps identified"]} variant="ai" />
        </div>
      </div>
    </PageDataGuard>
  );
}
