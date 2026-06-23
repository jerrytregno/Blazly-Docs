"use client";

import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { ScoreRing } from "@/components/ui/score-ring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NapAudit } from "@/types/firestore";
import { cn } from "@/lib/utils";

export function NapConsistencyPanel({
  audit,
  analyzing = false,
}: {
  audit: NapAudit | null | undefined;
  analyzing?: boolean;
}) {
  if (analyzing && !audit) {
    return (
      <Card className="border-gray-200 bg-white">
        <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="font-medium text-gray-900">Running NAP audit…</p>
          <p className="text-sm text-gray-500">
            Fetching your Google Business Profile and comparing NAP data
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!audit) {
    return (
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6 text-sm text-gray-500">
          Run the NAP audit above to compare your Google listing with your saved business profile.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>NAP Consistency Audit</CardTitle>
        <ScoreRing score={audit.score} label="NAP Score" size={72} />
      </CardHeader>
      <CardContent className="space-y-4">
        {audit.duplicateListings > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {audit.duplicateListings} potential duplicate listing
              {audit.duplicateListings > 1 ? "s" : ""} detected. Suppress duplicates to consolidate
              reviews and rankings.
            </span>
          </div>
        )}

        <div className="space-y-2">
          {audit.fields.map((field) => (
            <div
              key={field.field}
              className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{field.field}</p>
                <p className="mt-1 truncate text-xs text-gray-500">
                  Google: {field.gbpValue || "—"}
                </p>
                <p className="truncate text-xs text-gray-500">
                  Your profile: {field.webValue || "—"}
                </p>
              </div>
              {field.consistent ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0 text-red-500" />
              )}
            </div>
          ))}
        </div>

        <p className={cn("text-xs", audit.score >= 80 ? "text-emerald-600" : "text-amber-600")}>
          {audit.score >= 80
            ? "NAP data is consistent — Google trusts your business information."
            : "Fix mismatches between Google and your profile to improve local rankings."}
        </p>
      </CardContent>
    </Card>
  );
}
