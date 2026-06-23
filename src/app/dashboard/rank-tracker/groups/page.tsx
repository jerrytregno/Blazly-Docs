"use client";

import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GroupsPage() {
  const { rankings } = useData();

  return (
    <PageDataGuard>
      <div className="grid gap-4 sm:grid-cols-3">
        {(rankings?.keywordGroups ?? []).length === 0 ? (
          <Card className="sm:col-span-3"><CardContent className="p-6 text-sm text-[#b8a9d9]">No keyword groups yet.</CardContent></Card>
        ) : (
          rankings?.keywordGroups.map((group) => (
            <Card key={group.name}>
              <CardHeader><CardTitle className="text-base">{group.name}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{group.count}</p>
                <p className="text-sm text-[#b8a9d9]">tracked keywords</p>
                <ul className="mt-4 space-y-1">{group.keywords.map((k) => <li key={k} className="text-xs text-[#9b8ab8]">{k}</li>)}</ul>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PageDataGuard>
  );
}
