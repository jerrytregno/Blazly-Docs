import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  children,
}: {
  className?: string;
  variant?: "default" | "secondary" | "success" | "warning";
  children: React.ReactNode;
}) {
  const variants = {
    default: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100",
    secondary: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
    success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100",
    warning: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-100",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
