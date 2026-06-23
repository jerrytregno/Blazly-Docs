"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { AnalyticsDayHours } from "@/types/firestore";
import { cn } from "@/lib/utils";

function hoursToBarWidth(open: string, close: string, closed?: boolean): number {
  if (closed) return 0;
  const parseHour = (t: string) => {
    const m = t.match(/(\d+):?(\d*)?\s*(AM|PM)/i);
    if (!m) return 9;
    let h = Number(m[1]);
    const ampm = m[3]?.toUpperCase();
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return h;
  };
  const start = parseHour(open);
  const end = parseHour(close);
  const span = Math.max(end - start, 1);
  return Math.min(100, Math.round((span / 16) * 100));
}

function HoursBlock({
  title,
  hours,
  accent,
}: {
  title: string;
  hours: AnalyticsDayHours[];
  accent: string;
}) {
  return (
    <Card className="border-gray-200 bg-white">
      <CardContent className="p-6">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <div className="mt-4 space-y-3">
          {hours.map((row) => {
            const width = hoursToBarWidth(row.open, row.close, row.closed);
            const label = row.closed ? "Closed" : `${row.open} – ${row.close}`;
            return (
              <div key={row.day}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{row.day}</span>
                  <span className="text-gray-500">{label}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={cn("h-full rounded-full transition-all", accent)}
                    style={{ width: `${Math.max(width, row.closed ? 0 : 8)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsHoursSection({
  userHours,
  competitorHours,
  competitorName,
}: {
  userHours: AnalyticsDayHours[];
  competitorHours: AnalyticsDayHours[];
  competitorName: string;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <HoursBlock title="Your business hours" hours={userHours} accent="bg-indigo-500" />
      <HoursBlock
        title={`${competitorName} hours (estimated)`}
        hours={competitorHours}
        accent="bg-amber-500"
      />
    </div>
  );
}
