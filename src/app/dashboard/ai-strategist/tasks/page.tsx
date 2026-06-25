"use client";

import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusVariant = {
  pending: "secondary" as const,
  in_progress: "warning" as const,
  completed: "success" as const,
};

export default function TasksPage() {
  const { dashboard } = useData();

  return (
    <PageDataGuard>
      <Card>
        <CardHeader><CardTitle>SEO Tasks</CardTitle></CardHeader>
        <CardContent>
          {(dashboard?.strategistTasks.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-500">No tasks yet.</p>
          ) : (
            <ul className="space-y-3">
              {dashboard?.strategistTasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div><p className="font-medium text-slate-900">{task.title}</p><p className="text-sm capitalize text-slate-500">Priority: {task.priority}</p></div>
                  <Badge variant={statusVariant[task.status]}>{task.status.replace("_", " ")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </PageDataGuard>
  );
}
