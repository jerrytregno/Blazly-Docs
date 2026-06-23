"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function SemrushCardHeader({
  badge,
  badgeTone = "purple",
  onClose,
}: {
  badge: string;
  badgeTone?: "purple" | "blue";
  onClose?: () => void;
}) {
  const badgeStyles = {
    purple: "bg-purple-100 text-purple-900",
    blue: "bg-indigo-100 text-blue-900",
  };

  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
      <span
        className={cn(
          "rounded-full px-3 py-1 text-sm font-semibold",
          badgeStyles[badgeTone]
        )}
      >
        {badge}
      </span>
      <div className="flex items-center gap-4">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
