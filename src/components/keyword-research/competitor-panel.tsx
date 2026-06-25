"use client";

import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CompetitorDeepDive } from "@/types/firestore";

export function CompetitorPanel({
  detail,
  loading,
  yourPosition,
}: {
  detail?: CompetitorDeepDive;
  loading?: boolean;
  yourPosition?: number;
}) {
  if (loading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-6 text-sm text-gray-500">Loading competitor details…</CardContent>
      </Card>
    );
  }

  if (!detail) {
    return (
      <Card className="border-dashed border-gray-300 bg-gray-50">
        <CardContent className="p-6 text-sm text-gray-500">
          Click a competitor in the ranking list to see their profile and how you compare.
        </CardContent>
      </Card>
    );
  }

  const showWhyTheyRankHigher =
    yourPosition == null || yourPosition > detail.position;

  return (
    <div className="space-y-4">
      <Card className="border-gray-200">
        <CardContent className="p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Competitor analysis
          </p>
          <h3 className="mt-1 text-xl font-bold text-gray-900">
            #{detail.position} {detail.name}
          </h3>
          <p className="mt-1 text-sm text-gray-500">{detail.address}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { label: "Rating", value: `${detail.rating}★` },
              { label: "Reviews", value: detail.reviews.toLocaleString() },
              { label: "Photos", value: String(detail.photoCount) },
              { label: "Visibility", value: `${detail.visibilityScore}/100` },
              { label: "Category", value: detail.category },
              { label: "Hours", value: detail.hoursSummary },
            ].map((row) => (
              <div key={row.label} className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">{row.label}</p>
                <p className="text-sm font-medium text-gray-900">{row.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showWhyTheyRankHigher && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-6">
            <h4 className="font-semibold text-gray-900">Why they rank higher</h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {detail.whyTheyRankHigher.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <Star className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  {reason}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="border-gray-200">
        <CardContent className="p-6">
          <h4 className="font-semibold text-gray-900">You vs competitor</h4>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              {
                label: "Rating",
                you: `${detail.userComparison.rating}★`,
                them: `${detail.rating}★`,
              },
              {
                label: "Reviews",
                you: detail.userComparison.reviews.toLocaleString(),
                them: detail.reviews.toLocaleString(),
              },
              {
                label: "Photos",
                you: String(detail.userComparison.photoCount),
                them: String(detail.photoCount),
              },
              {
                label: "Visibility",
                you: `${detail.userComparison.visibilityScore}/100`,
                them: `${detail.visibilityScore}/100`,
              },
            ].map((row) => (
              <div key={row.label} className="rounded-lg border border-gray-100 p-3 text-sm">
                <p className="text-xs text-gray-500">{row.label}</p>
                <p className="mt-1">
                  You: <span className="font-medium">{row.you}</span>
                </p>
                <p>
                  Them: <span className="font-medium">{row.them}</span>
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
