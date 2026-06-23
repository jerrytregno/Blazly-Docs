"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { MiniDonut, TrendBadge } from "@/components/dashboard/gauge-score";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardDoc, RankingsDoc } from "@/types/firestore";
import { formatDate } from "@/lib/utils";

export function PositionTrackingCard({
  dashboard,
  rankings,
  businessCity,
}: {
  dashboard: DashboardDoc;
  rankings: RankingsDoc | null;
  businessCity?: string;
}) {
  const m = dashboard.metrics;
  const keywords = rankings?.keywords ?? [];
  const visibility =
    dashboard.visibilityScore ??
    rankings?.geoGrid?.visibilityScore ??
    m.localVisibility;

  const visibilityTrend =
    m.rankingGains > m.rankingLosses
      ? Math.round(((m.rankingGains - m.rankingLosses) / Math.max(keywords.length, 1)) * 100)
      : m.rankingLosses > m.rankingGains
        ? -Math.round(((m.rankingLosses - m.rankingGains) / Math.max(keywords.length, 1)) * 100)
        : 0;

  const topKeywords = [...keywords]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Position Tracking</h2>
          <Info className="h-4 w-4 text-gray-400" />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          {dashboard.lastAnalyzedAt && (
            <span>Updated: {formatDate(dashboard.lastAnalyzedAt)}</span>
          )}
          <button type="button" className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5">
            last 7 days
          </button>
        </div>
      </div>

      <CardContent className="p-0">
        <div className="grid gap-8 border-b border-gray-200 p-6 sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <div>
            <p className="dashboard-metric-label">Visibility</p>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-4xl font-semibold tracking-tight text-gray-900">
                {visibility.toFixed(2)}%
              </span>
              {visibilityTrend !== 0 && <TrendBadge value={visibilityTrend} />}
            </div>
            {businessCity && (
              <p className="mt-2 text-sm text-gray-500">{businessCity} local market</p>
            )}
          </div>
          <MiniDonut
            value={m.top3Keywords}
            total={keywords.length || m.top3Keywords + m.top10Keywords || 1}
            label="Top 3"
            color="#3b82f6"
          />
          <MiniDonut
            value={m.top10Keywords}
            total={keywords.length || m.top10Keywords || 1}
            label="Top 10"
            color="#8b5cf6"
          />
        </div>

        {topKeywords.length === 0 ? (
          <div className="p-8 text-center text-base text-gray-500">
            No keywords tracked yet.{" "}
            <Link href="/dashboard/rank-tracker/keywords" className="font-medium text-indigo-600 hover:underline">
              Add keywords
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-lg">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-base font-medium text-gray-500">
                  <th className="px-6 py-4">Keyword</th>
                  <th className="px-6 py-4">Position</th>
                  <th className="px-6 py-4">Visibility</th>
                  <th className="px-6 py-4">Volume</th>
                </tr>
              </thead>
              <tbody>
                {topKeywords.map((kw) => {
                  const kwVisibility = kw.rank > 0 ? Math.max(0, (21 - kw.rank) * 5) : 0;
                  return (
                    <tr key={kw.keyword} className="border-b border-gray-100">
                      <td className="px-6 py-4 font-medium text-gray-900">{kw.keyword}</td>
                      <td className="px-6 py-4 text-lg font-semibold text-indigo-600">#{kw.rank || "—"}</td>
                      <td className="px-6 py-4 text-gray-600">{kwVisibility.toFixed(1)}%</td>
                      <td className="px-6 py-4 text-gray-600">{kw.volume.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-gray-200 px-5 py-4">
          <Link
            href="/dashboard/rank-tracker/keywords"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all keywords →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
