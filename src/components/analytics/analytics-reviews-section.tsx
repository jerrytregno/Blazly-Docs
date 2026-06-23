"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { AnalyticsReviewMetrics } from "@/types/firestore";
import { cn } from "@/lib/utils";

function ReviewStat({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend?: number;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
      <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {trend !== undefined && (
        <p
          className={cn(
            "mt-1 text-xs font-medium",
            trend >= 0 ? "text-emerald-600" : "text-red-600"
          )}
        >
          {trend >= 0 ? "+" : ""}
          {trend}% trend
        </p>
      )}
    </div>
  );
}

export function AnalyticsReviewsSection({
  userReviews,
  competitorReviews,
  competitorName,
}: {
  userReviews: AnalyticsReviewMetrics;
  competitorReviews: AnalyticsReviewMetrics;
  competitorName: string;
}) {
  const ratingCompare = [
    { name: "You", rating: userReviews.averageRating, reviews: userReviews.totalReviews },
    {
      name: competitorName.slice(0, 12),
      rating: competitorReviews.averageRating,
      reviews: competitorReviews.totalReviews,
    },
  ];

  const growthCompare = [
    { name: "You", newReviews: userReviews.newReviews30d },
    { name: competitorName.slice(0, 12), newReviews: competitorReviews.newReviews30d },
  ];

  const distributionData = userReviews.distribution.map((b) => ({
    stars: `${b.stars}★`,
    you: b.count,
    competitor:
      competitorReviews.distribution.find((c) => c.stars === b.stars)?.count ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900">Your reviews</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ReviewStat label="Total reviews" value={String(userReviews.totalReviews)} />
              <ReviewStat
                label="New (30 days)"
                value={String(userReviews.newReviews30d)}
              />
              <ReviewStat
                label="Average rating"
                value={`${userReviews.averageRating}★`}
                trend={userReviews.ratingTrend}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900">{competitorName}</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ReviewStat
                label="Total reviews"
                value={String(competitorReviews.totalReviews)}
              />
              <ReviewStat
                label="New (30 days)"
                value={String(competitorReviews.newReviews30d)}
              />
              <ReviewStat
                label="Average rating"
                value={`${competitorReviews.averageRating}★`}
                trend={competitorReviews.ratingTrend}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900">Star rating comparison</h3>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingCompare}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="rating" name="Avg rating" fill="#4b7bec" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900">Reviews growth (30 days)</h3>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthCompare}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="newReviews" name="New reviews" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900">Rating distribution</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="stars" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="you" name="You" fill="#4b7bec" radius={[4, 4, 0, 0]} />
                <Bar dataKey="competitor" name={competitorName} fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
