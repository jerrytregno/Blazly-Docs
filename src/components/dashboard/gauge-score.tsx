import { cn } from "@/lib/utils";

export function GaugeScore({
  score,
  label,
  size = 120,
}: {
  score: number;
  label: string;
  size?: number;
}) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const progressAngle = startAngle + (Math.min(100, Math.max(0, score)) / 100) * Math.PI;

  const polar = (angle: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  const start = polar(startAngle);
  const end = polar(endAngle);
  const progress = polar(progressAngle);

  const bgPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
  const fgPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${progress.x} ${progress.y}`;
  const gradId = `gauge-grad-${size}`;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.58} viewBox={`0 0 ${size} ${size * 0.58}`}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <path
          d={bgPath}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={fgPath}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="-mt-10 text-center">
        <p
          className="font-semibold tracking-tight text-gray-900"
          style={{ fontSize: Math.max(32, size * 0.32) }}
        >
          {score}
        </p>
        <p className="mt-1 text-base text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export function TrendBadge({
  value,
  suffix = "%",
}: {
  value: number;
  suffix?: string;
}) {
  if (value === 0) {
    return <span className="text-xs text-gray-500">0{suffix}</span>;
  }
  const positive = value > 0;
  return (
    <span
      className={cn(
        "text-sm font-medium",
        positive ? "text-emerald-600" : "text-red-600"
      )}
    >
      {positive ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

function MiniDonut({ value, total, label, color }: { value: number; total: number; label: string; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  const r = 22;
  const size = 56;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={6} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-base font-semibold text-gray-900">
          {value}
        </div>
      </div>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  );
}

export { MiniDonut };
