"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { AnalyticsPopularHour } from "@/types/firestore";
import { cn } from "@/lib/utils";

const LEVEL_COLORS: Record<AnalyticsPopularHour["level"], string> = {
  "very-high": "bg-red-700",
  high: "bg-orange-500",
  medium: "bg-yellow-400",
  low: "bg-lime-300",
  "very-low": "bg-gray-300",
};

const LEVEL_LABELS: Record<AnalyticsPopularHour["level"], string> = {
  "very-high": "Very high",
  high: "High",
  medium: "Medium",
  low: "Low",
  "very-low": "Very low",
};

function PopularTimesChart({
  title,
  times,
  peakHour,
}: {
  title: string;
  times: AnalyticsPopularHour[];
  peakHour: string;
}) {
  const maxVisitors = Math.max(...times.map((t) => t.visitors), 1);

  return (
    <Card className="border-gray-200 bg-white">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">
            Peak: <span className="font-medium text-gray-700">{peakHour}</span>
          </p>
        </div>

        <div className="mt-4 flex items-end gap-1 overflow-x-auto pb-2" style={{ minHeight: 180 }}>
          {times.map((slot) => {
            const heightPct = Math.max(8, (slot.visitors / maxVisitors) * 100);
            return (
              <div
                key={slot.hour}
                className="flex min-w-[28px] flex-1 flex-col items-center gap-1"
                title={`${slot.label}: ${slot.visitors} visitors`}
              >
                <span className="text-[10px] font-medium text-gray-600">{slot.visitors}</span>
                <div
                  className="flex w-full items-end justify-center"
                  style={{ height: 120 }}
                >
                  <div
                    className={cn(
                      "w-full max-w-[32px] rounded-t-md transition-all",
                      LEVEL_COLORS[slot.level]
                    )}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="text-[9px] text-gray-400">{slot.label.replace(" ", "\n")}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {(Object.keys(LEVEL_COLORS) as AnalyticsPopularHour["level"][]).map((level) => (
            <div key={level} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className={cn("h-2.5 w-2.5 rounded-sm", LEVEL_COLORS[level])} />
              {LEVEL_LABELS[level]}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsPopularTimesSection({
  userTimes,
  competitorTimes,
  userPeakHour,
  competitorPeakHour,
  competitorName,
}: {
  userTimes: AnalyticsPopularHour[];
  competitorTimes: AnalyticsPopularHour[];
  userPeakHour: string;
  competitorPeakHour: string;
  competitorName: string;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <PopularTimesChart
        title="Your popular times"
        times={userTimes}
        peakHour={userPeakHour}
      />
      <PopularTimesChart
        title={`${competitorName} popular times (estimated)`}
        times={competitorTimes}
        peakHour={competitorPeakHour}
      />
    </div>
  );
}
