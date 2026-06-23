"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Original",
  afterLabel = "Enhanced",
}: {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const onMove = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, pct)));
  };

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100 select-none"
        onMouseMove={(e) => e.buttons === 1 && onMove(e.clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
      >
        <img
          src={afterSrc}
          alt={afterLabel}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${position}%` }}
        >
          <img
            src={beforeSrc}
            alt={beforeLabel}
            className="h-full w-full max-w-none object-cover"
            style={{ width: containerRef.current?.offsetWidth ?? "100%" }}
          />
        </div>
        <div
          className="absolute inset-y-0 w-1 bg-white shadow-lg"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          className="absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
          aria-label="Compare before and after"
        />
      </div>
      <div className="flex justify-between text-xs font-medium text-gray-500">
        <span>{beforeLabel}</span>
        <span className="text-gray-400">Drag slider to compare</span>
        <span>{afterLabel}</span>
      </div>
    </div>
  );
}

export function ScorePill({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  const color =
    value >= 70 ? "text-emerald-600" : value >= 40 ? "text-amber-600" : "text-red-600";

  return (
    <div className={cn("rounded-lg border border-gray-200 bg-white p-3 text-center", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold", color)}>{value}</p>
    </div>
  );
}
