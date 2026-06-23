"use client";

import { Badge } from "@/components/ui/badge";
import type { KeywordOpportunity } from "@/types/firestore";

const TIER_LABELS: Record<KeywordOpportunity["tier"], string> = {
  primary: "Primary",
  secondary: "Secondary",
  "long-tail": "Long-tail",
};

export function KeywordOpportunities({
  keywords,
}: {
  keywords: KeywordOpportunity[];
}) {
  if (!keywords.length) return null;

  const groups: KeywordOpportunity["tier"][] = ["primary", "secondary", "long-tail"];

  return (
    <div className="space-y-4">
      {groups.map((tier) => {
        const items = keywords.filter((k) => k.tier === tier);
        if (!items.length) return null;
        return (
          <div key={tier}>
            <h4 className="mb-2 text-sm font-semibold text-gray-700">
              {TIER_LABELS[tier]} keywords
            </h4>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Keyword</th>
                    <th className="px-4 py-3">Volume</th>
                    <th className="px-4 py-3">Competition</th>
                    <th className="px-4 py-3">Difficulty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((k) => (
                    <tr key={k.keyword} className="bg-white">
                      <td className="px-4 py-3 font-medium text-gray-900">{k.keyword}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {k.searchVolume.toLocaleString()}/mo
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{k.competitionScore}%</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{k.difficulty}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
