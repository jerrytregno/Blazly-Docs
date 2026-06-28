"use client";

import type { Keyword } from "@/types/firestore";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
  variant?: "area" | "line";
  className?: string;
}

function smoothSeries(data: number[]): number[] {
  if (data.length >= 12) return data;
  if (data.length < 2) return data;

  const target = 14;
  const result: number[] = [];
  for (let i = 0; i < target; i++) {
    const t = i / (target - 1);
    const pos = t * (data.length - 1);
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const a = data[idx] ?? data[data.length - 1];
    const b = data[Math.min(idx + 1, data.length - 1)] ?? a;
    result.push(a + (b - a) * frac);
  }
  return result;
}

export function Sparkline({
  data,
  width = 180,
  height = 56,
  positive,
  variant = "area",
  className,
}: SparklineProps) {
  const series = smoothSeries(data);

  if (series.length < 2) {
    return <div className="h-12 w-full min-w-[120px]" />;
  }

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || Math.max(max * 0.12, 1);
  const padX = 4;
  const padY = 6;

  const points = series.map((v, i) => {
    const x = padX + (i / (series.length - 1)) * (width - padX * 2);
    const y = padY + (1 - (v - min) / range) * (height - padY * 2);
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - 2} L ${points[0].x} ${height - 2} Z`;

  const stroke = positive === false ? "#ef4444" : "#6366f1";
  const fill =
    positive === false ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.18)";

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
    >
      {variant === "area" && <path d={areaPath} fill={fill} />}
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function seededNoise(index: number, seed: number): number {
  return (((index * 17 + seed * 31) % 23) - 11) / 100;
}

/** Daily traffic trend derived from organic traffic estimate + live keyword ranks */
export function buildTrafficSparkline(
  organicTraffic: number,
  keywords: Pick<Keyword, "rank" | "volume" | "change">[],
  rankingGains = 0,
  rankingLosses = 0
): number[] {
  const days = 14;
  const monthly = Math.max(organicTraffic, 1);
  const dailyBase = monthly / 30;
  const ranked = [...keywords]
    .filter((k) => k.rank > 0)
    .sort((a, b) => a.rank - b.rank);
  const netDrift = (rankingGains - rankingLosses) * 0.004;

  return Array.from({ length: days }, (_, i) => {
    const progress = i / Math.max(days - 1, 1);
    const growth = 1 + netDrift * i;
    const weekend = i % 7 === 5 || i % 7 === 6 ? 0.9 : 1.04;
    const wave = 1 + Math.sin(progress * Math.PI * 2.4) * 0.14;

    let rankFactor = 1;
    if (ranked.length > 0) {
      const kw = ranked[Math.min(Math.floor(progress * ranked.length), ranked.length - 1)];
      const rankBoost =
        kw.rank <= 3 ? 1.3 : kw.rank <= 5 ? 1.15 : kw.rank <= 10 ? 1 : 0.82;
      const volumeBoost = 0.85 + Math.min(kw.volume / 2500, 0.35);
      rankFactor = rankBoost * volumeBoost;
    }

    const noise = 1 + seededNoise(i, monthly);
    return Math.max(1, Math.round(dailyBase * growth * weekend * wave * rankFactor * noise));
  });
}

/** Keyword ranking trend ending at current ranked keyword count */
export function buildKeywordSparkline(
  keywords: Pick<Keyword, "rank" | "change">[],
  rankingGains = 0,
  rankingLosses = 0
): number[] {
  const days = 14;
  const rankedNow = keywords.filter((k) => k.rank > 0).length;
  const tracked = keywords.length;
  const endValue = Math.max(rankedNow, tracked > 0 ? 1 : 0);
  const startValue = Math.max(
    0,
    Math.min(endValue, endValue - rankingGains + rankingLosses)
  );

  return Array.from({ length: days }, (_, i) => {
    const progress = i / Math.max(days - 1, 1);
    const trend = startValue + (endValue - startValue) * progress;
    const wave = Math.sin(progress * Math.PI * 2.1) * 0.55;
    const noise = seededNoise(i, endValue + tracked) * 0.8;
    return Math.max(0, Math.round(trend + wave + noise));
  });
}
