"use client";

import {
  Eye,
  Globe,
  MapPin,
  MousePointerClick,
  Phone,
  Star,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AnalyticsBusinessMetrics, AnalyticsCompetitorMetrics } from "@/types/firestore";
import { cn } from "@/lib/utils";

function KpiCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <Card className="border-gray-200 bg-white">
      <CardContent className="flex items-start gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsKpiSection({
  user,
  competitor,
  hasWebsite = true,
}: {
  user: AnalyticsBusinessMetrics;
  competitor: AnalyticsCompetitorMetrics;
  hasWebsite?: boolean;
}) {
  const userKpis = [
    ...(hasWebsite
      ? [
          {
            label: "Website Traffic",
            value: user.websiteTraffic.toLocaleString(),
            icon: Globe,
            sub: "Last 30 days",
          },
          {
            label: "Website Clicks",
            value: String(user.websiteClicks),
            icon: MousePointerClick,
          },
        ]
      : []),
    { label: "GBP Views", value: user.gbpViews.toLocaleString(), icon: Eye, sub: "Last 30 days" },
    { label: "Calls", value: String(user.calls), icon: Phone, sub: "From GBP" },
    { label: "Direction Requests", value: String(user.directionRequests), icon: MapPin },
    { label: "Reviews Received", value: String(user.reviewsReceived), icon: Star },
    { label: "Average Rating", value: user.averageRating ? `${user.averageRating}★` : "—", icon: Star },
  ];

  const competitorKpis = [
    { label: "Reviews Count", value: competitor.reviewsCount.toLocaleString(), icon: Star },
    { label: "Average Rating", value: `${competitor.averageRating}★`, icon: Star },
    {
      label: "Rating Trend",
      value: `${competitor.ratingTrend >= 0 ? "+" : ""}${competitor.ratingTrend}%`,
      icon: TrendingUp,
      sub: "30-day est.",
    },
    {
      label: "Visibility Score",
      value: `${competitor.visibilityScore}%`,
      icon: Eye,
      sub: competitor.name,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Your business — last 30 days</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {userKpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Top competitor — <span className="text-indigo-600">{competitor.name}</span>
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {competitorKpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AnalyticsComparisonCards({
  comparisons,
}: {
  comparisons: import("@/types/firestore").AnalyticsComparisonMetric[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {comparisons.map((c) => (
        <Card key={c.label} className="border-gray-200 bg-white">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-gray-500">{c.label}</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-gray-400">You</p>
                <p className="text-xl font-bold text-gray-900">
                  {c.userValue}
                  {c.unit === "★" ? "★" : c.unit && c.unit !== "reviews" ? "" : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Competitor</p>
                <p className="text-xl font-bold text-gray-600">{c.competitorValue}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  c.userWins
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                )}
              >
                {c.userWins ? "You lead" : "Competitor leads"}
              </span>
              {c.differencePercent !== undefined && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {c.differencePercent >= 0 ? "+" : ""}
                  {c.differencePercent}% diff
                </span>
              )}
              {c.growthPercent !== undefined && c.label === "Website Traffic" && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                  +{c.growthPercent}% growth
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
