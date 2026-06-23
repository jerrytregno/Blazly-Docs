"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import type { ReviewSentiment, MonitoredPlatform } from "@/types/firestore";

export function ReviewSentimentPanel({ sentiment }: { sentiment: ReviewSentiment | undefined }) {
  if (!sentiment) return null;

  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader>
        <CardTitle>Sentiment Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {[
          { label: "Positive", value: sentiment.positive, color: "text-emerald-600" },
          { label: "Neutral", value: sentiment.neutral, color: "text-amber-600" },
          { label: "Negative", value: sentiment.negative, color: "text-red-600" },
        ].map((s) => (
          <div key={s.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className={s.color}>{s.label}</span>
              <span className="font-medium text-gray-900">{s.value}%</span>
            </div>
            <ProgressBar value={s.value} />
          </div>
        ))}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
            <p className="text-xs text-gray-500">NPS Score</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{sentiment.nps}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
            <p className="text-xs text-gray-500">Avg Response</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {sentiment.avgResponseTimeHours ? `${sentiment.avgResponseTimeHours}h` : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
            <p className="text-xs text-gray-500">Velocity</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {sentiment.velocityPerMonth ? `+${sentiment.velocityPerMonth}/mo` : "—"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MonitoredPlatformsPanel({ platforms }: { platforms: MonitoredPlatform[] | undefined }) {
  if (!platforms?.length) return null;

  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Review Monitoring</CardTitle>
        <Badge variant="secondary">80+ sites supported</Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {platforms.map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
            >
              <span className="text-sm text-gray-700">{p.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{p.count}</span>
                <Badge variant={p.connected ? "success" : "secondary"}>
                  {p.connected ? "Connected" : "Pending"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
