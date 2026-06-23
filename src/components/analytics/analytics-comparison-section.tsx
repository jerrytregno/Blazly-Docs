"use client";

import { Trophy, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnalyticsComparisonRow } from "@/types/firestore";
import { cn } from "@/lib/utils";

export function AnalyticsComparisonSection({
  rows,
  betterPerforming,
  opportunityAreas,
  businessName,
  competitorName,
}: {
  rows: AnalyticsComparisonRow[];
  betterPerforming: "user" | "competitor";
  opportunityAreas: string[];
  businessName: string;
  competitorName: string;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          className={cn(
            "border-2 bg-white",
            betterPerforming === "user" ? "border-emerald-300" : "border-gray-200"
          )}
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Better performing</p>
              <p className="text-lg font-bold text-gray-900">
                {betterPerforming === "user" ? businessName : competitorName}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-white">
          <CardContent className="flex items-start gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Opportunity areas</p>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {opportunityAreas.slice(0, 3).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200 bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Metric</th>
                  <th className="px-5 py-3">You</th>
                  <th className="px-5 py-3">Competitor</th>
                  <th className="px-5 py-3">Winner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.metric}>
                    <td className="px-5 py-4 font-medium text-gray-900">{row.metric}</td>
                    <td className="px-5 py-4 text-gray-700">{row.user}</td>
                    <td className="px-5 py-4 text-gray-700">{row.competitor}</td>
                    <td className="px-5 py-4">
                      <Badge
                        className={cn(
                          "capitalize",
                          row.winner === "user"
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                            : row.winner === "competitor"
                              ? "bg-amber-50 text-amber-800 hover:bg-amber-50"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        {row.winner === "user" ? "You" : row.winner === "competitor" ? "Competitor" : "Tie"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
