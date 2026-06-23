"use client";

import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnalyticsAiInsights } from "@/types/firestore";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  low: "bg-gray-50 text-gray-600 border-gray-200",
};

function InsightList({
  title,
  items,
  empty,
}: {
  title: string;
  items: AnalyticsAiInsights["strengths"];
  empty: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-gray-400">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item, i) => (
            <li
              key={`${title}-${i}`}
              className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3 text-sm text-gray-700"
            >
              <Badge
                className={cn(
                  "shrink-0 capitalize",
                  PRIORITY_STYLES[item.priority]
                )}
              >
                {item.priority}
              </Badge>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AnalyticsAiInsightsPanel({
  insights,
  generating,
  onGenerate,
}: {
  insights: AnalyticsAiInsights | null;
  generating: boolean;
  onGenerate: () => void;
}) {
  return (
    <Card className="border-violet-200 bg-gradient-to-br from-violet-50/80 to-white">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI insights</h2>
            <p className="mt-1 text-sm text-gray-500">
              Gemini analyzes your analytics and competitor data for actionable recommendations
            </p>
          </div>
          <Button
            onClick={onGenerate}
            disabled={generating}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? "Analyzing…" : "Generate insights"}
          </Button>
        </div>

        {insights ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <InsightList
              title="Strengths"
              items={insights.strengths}
              empty="Generate insights to see strengths."
            />
            <InsightList
              title="Weaknesses"
              items={insights.weaknesses}
              empty="Generate insights to see weaknesses."
            />
            <InsightList
              title="Recommendations"
              items={insights.recommendations}
              empty="Generate insights to see recommendations."
            />
          </div>
        ) : (
          <p className="mt-6 rounded-lg border border-dashed border-violet-200 bg-white/60 p-8 text-center text-sm text-gray-500">
            Click &quot;Generate insights&quot; to get AI-powered strengths, weaknesses, and
            prioritized recommendations.
          </p>
        )}

        {insights?.generatedAt && (
          <p className="mt-4 text-xs text-gray-400">
            Generated {new Date(insights.generatedAt).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
