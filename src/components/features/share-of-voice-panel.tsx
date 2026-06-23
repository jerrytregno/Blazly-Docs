"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ShareOfVoice } from "@/types/firestore";

export function ShareOfVoicePanel({ data }: { data: ShareOfVoice[] | undefined }) {
  if (!data?.length) {
    return (
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6 text-sm text-gray-500">
          Track keywords to see share of voice vs competitors.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader>
        <CardTitle>Share of Voice</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {data.map((row) => (
          <div key={row.keyword}>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-gray-800">{row.keyword}</span>
              <span className="text-gray-600">
                {row.yourShare}% you · {row.competitorShare}% {row.topCompetitor}
              </span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="bg-violet-500 transition-all"
                style={{ width: `${row.yourShare}%` }}
              />
              <div
                className="bg-pink-400 transition-all"
                style={{ width: `${row.competitorShare}%` }}
              />
            </div>
          </div>
        ))}
        <p className="text-xs text-gray-400">
          Based on review volume and Maps visibility signals vs top local competitor.
        </p>
      </CardContent>
    </Card>
  );
}
