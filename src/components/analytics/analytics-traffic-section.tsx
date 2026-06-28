"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AnalyticsDailyPoint, AnalyticsTrafficSummary } from "@/types/firestore";

type RangeKey = "7" | "14" | "30";
type MetricKey = "websiteTraffic" | "gbpViews";

const METRIC_LABELS: Record<MetricKey, string> = {
  websiteTraffic: "Maps Website Clicks",
  gbpViews: "GBP Views",
};

const SUMMARY_UNIT: Record<MetricKey, string> = {
  websiteTraffic: "visits",
  gbpViews: "views",
};

export function AnalyticsTrafficSection({
  dailyTrend,
  trafficSummary,
  hasWebsite = true,
}: {
  dailyTrend: AnalyticsDailyPoint[];
  trafficSummary: AnalyticsTrafficSummary;
  hasWebsite?: boolean;
}) {
  const availableMetrics = useMemo(
    () =>
      (Object.keys(METRIC_LABELS) as MetricKey[]).filter(
        (key) => hasWebsite || key !== "websiteTraffic"
      ),
    [hasWebsite]
  );

  const [range, setRange] = useState<RangeKey>("30");
  const [metric, setMetric] = useState<MetricKey>(hasWebsite ? "websiteTraffic" : "gbpViews");

  useEffect(() => {
    if (!availableMetrics.includes(metric)) {
      setMetric(availableMetrics[0] ?? "gbpViews");
    }
  }, [availableMetrics, metric]);

  const chartData = useMemo(() => {
    const days = Number(range);
    return dailyTrend.slice(-days).map((d) => ({
      ...d,
      label: new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [dailyTrend, range]);

  const summary = useMemo(() => {
    if (metric === "websiteTraffic" && hasWebsite) {
      return trafficSummary;
    }

    const byMetric = [...chartData].sort((a, b) => b[metric] - a[metric]);
    const averageDaily =
      chartData.length > 0
        ? Math.round(chartData.reduce((sum, point) => sum + point[metric], 0) / chartData.length)
        : 0;

    return {
      highestDay: {
        date: byMetric[0]?.date ?? "—",
        value: byMetric[0]?.[metric] ?? 0,
      },
      lowestDay: {
        date: byMetric[byMetric.length - 1]?.date ?? "—",
        value: byMetric[byMetric.length - 1]?.[metric] ?? 0,
      },
      averageDaily,
    };
  }, [chartData, hasWebsite, metric, trafficSummary]);

  const unit = SUMMARY_UNIT[metric];

  return (
    <Card className="border-gray-200 bg-white">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Traffic trend analysis</h2>
            <p className="mt-1 text-sm text-gray-500">
              {hasWebsite
                ? "Daily performance over the selected range"
                : "Website traffic is hidden — no website is linked to this business"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["7", "14", "30"] as RangeKey[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  range === r
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                {r} days
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {availableMetrics.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setMetric(key)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                metric === key
                  ? "border-violet-600 bg-violet-50 text-violet-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
            >
              {METRIC_LABELS[key]}
            </button>
          ))}
        </div>

        <div className="mt-6 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 13,
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={metric}
                name={METRIC_LABELS[metric]}
                stroke="#b5523b"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase text-emerald-700">Highest day</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {summary.highestDay.value.toLocaleString()} {unit}
            </p>
            <p className="text-xs text-gray-500">{summary.highestDay.date}</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase text-amber-700">Lowest day</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {summary.lowestDay.value.toLocaleString()} {unit}
            </p>
            <p className="text-xs text-gray-500">{summary.lowestDay.date}</p>
          </div>
          <div className="rounded-lg bg-indigo-50 p-4">
            <p className="text-xs font-semibold uppercase text-indigo-700">Daily average</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {summary.averageDaily.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">{unit} / day</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
