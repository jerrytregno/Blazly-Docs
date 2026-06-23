"use client";

import { CheckCircle2, Circle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GbpAuditItem } from "@/types/firestore";
import { cn } from "@/lib/utils";

export function GbpAuditChecklist({ items }: { items: GbpAuditItem[] | undefined }) {
  if (!items?.length) {
    return null;
  }

  const passed = items.filter((i) => i.passed).length;
  const pct = Math.round((passed / items.length) * 100);

  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>GBP Listing Audit</CardTitle>
        <Badge variant={pct >= 70 ? "success" : "warning"}>
          {passed}/{items.length} passed
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3",
              item.passed ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-gray-50"
            )}
          >
            {item.passed ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-gray-800">{item.label}</p>
                <Badge variant={item.priority === "high" ? "warning" : "secondary"} className="text-[10px]">
                  {item.priority}
                </Badge>
              </div>
              {item.tip && !item.passed && (
                <p className="mt-1 flex items-start gap-1 text-xs text-gray-500">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" />
                  {item.tip}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
