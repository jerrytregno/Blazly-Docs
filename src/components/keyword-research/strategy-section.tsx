"use client";

import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { KeywordResearchStrategy } from "@/types/firestore";

export function StrategySection({
  strategy,
  loading,
  onGenerate,
  yourPosition,
}: {
  strategy?: KeywordResearchStrategy;
  loading?: boolean;
  onGenerate: () => void;
  yourPosition?: number;
}) {
  return (
    <Card className="border-indigo-200 bg-white">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              How can I reach position #1?
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              AI strategy based on your profile, competitors, and ranking gaps
              {yourPosition ? ` (currently #${yourPosition})` : ""}.
            </p>
          </div>
          <Button onClick={onGenerate} disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate AI strategy
          </Button>
        </div>

        {strategy && (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {[
              { title: "High priority", items: strategy.highPriority, color: "border-red-200 bg-red-50" },
              { title: "Medium priority", items: strategy.mediumPriority, color: "border-amber-200 bg-amber-50" },
              { title: "Low priority", items: strategy.lowPriority, color: "border-emerald-200 bg-emerald-50" },
            ].map((block) => (
              <div key={block.title} className={`rounded-xl border p-4 ${block.color}`}>
                <p className="text-sm font-semibold text-gray-900">{block.title}</p>
                <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-gray-700">
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
