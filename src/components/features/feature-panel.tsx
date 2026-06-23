import { cn } from "@/lib/utils";

export function FeaturePanel({
  title,
  description,
  badge,
  children,
  className,
}: {
  title: string;
  description?: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
          {badge && (
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{description}</p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
