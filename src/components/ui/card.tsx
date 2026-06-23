import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBanner({
  children,
  tone = "indigo",
  className,
}: {
  children: React.ReactNode;
  tone?: "indigo" | "slate" | "gray";
  className?: string;
}) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-900 border-b border-indigo-100",
    slate: "bg-slate-50 text-slate-800 border-b border-slate-200",
    gray: "bg-slate-50 text-slate-800 border-b border-slate-200",
  };
  return (
    <div className={cn("px-4 py-2.5 text-sm font-semibold", tones[tone], className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardProps) {
  return (
    <div className={cn("flex flex-col gap-1.5 p-6 pb-0", className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h3 className={cn("text-lg font-semibold leading-none text-slate-900", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn("text-sm text-slate-500", className)}>{children}</p>
  );
}

export function CardContent({ className, children }: CardProps) {
  return <div className={cn("p-6", className)}>{children}</div>;
}
