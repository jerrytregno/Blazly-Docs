"use client";

import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HoursPage() {
  const { business } = useData();

  return (
    <PageDataGuard>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Weekly Hours</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(business?.weeklyHours ?? []).map((row) => (
                <li key={row.day} className="flex justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  <span className="font-medium text-white">{row.day}</span>
                  <span className="text-[#b8a9d9]">{row.hours}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card><CardHeader><CardTitle>Holiday Hours</CardTitle></CardHeader><CardContent className="text-sm text-[#b8a9d9]">{(business?.holidayHours.length ?? 0) === 0 ? "No holiday hours configured." : business?.holidayHours.map((h) => <p key={h.date}>{h.date}: {h.hours}</p>)}</CardContent></Card>
          <Card><CardHeader><CardTitle>Special Hours</CardTitle></CardHeader><CardContent className="text-sm text-[#b8a9d9]">{(business?.specialHours.length ?? 0) === 0 ? "No special hours configured." : business?.specialHours.map((h) => <p key={h.date}>{h.date}: {h.hours}</p>)}</CardContent></Card>
          <Card><CardHeader><CardTitle>Temporary Closures</CardTitle></CardHeader><CardContent className="text-sm text-[#b8a9d9]">{(business?.temporaryClosures.length ?? 0) === 0 ? "No temporary closures scheduled." : business?.temporaryClosures.map((c) => <p key={c}>{c}</p>)}</CardContent></Card>
        </div>
      </div>
    </PageDataGuard>
  );
}
