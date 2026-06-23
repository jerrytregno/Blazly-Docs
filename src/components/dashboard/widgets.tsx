import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  subtext,
  trend,
  className,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}) {
  return (
    <Card className={cn("border-slate-200 bg-white", className)}>
      <CardContent className="p-4">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        {subtext && (
          <p
            className={cn(
              "mt-1 text-xs",
              trend === "up" && "text-emerald-600",
              trend === "down" && "text-red-600",
              !trend && "text-slate-400"
            )}
          >
            {subtext}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function InsightPanel({
  title,
  items,
  variant = "default",
}: {
  title: string;
  items: string[];
  variant?: "default" | "ai";
}) {
  return (
    <Card
      className={cn(
        "border-slate-200 bg-white",
        variant === "ai" && "border-indigo-200 bg-indigo-50/50"
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {variant === "ai" ? "⭐ " : ""}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function FieldGrid({
  fields,
}: {
  fields: { label: string; value: string }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {field.label}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">{field.value}</p>
        </div>
      ))}
    </div>
  );
}
