import { Info } from "lucide-react";

export function GbpDescriptionGuidelines({ compact }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "rounded-lg border border-indigo-200 bg-indigo-50/60 px-4 py-3 text-sm text-blue-900"
          : "rounded-xl border border-indigo-200 bg-indigo-50/50 p-4"
      }
    >
      <div className="flex gap-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold">Google Business Profile description limits</p>
          <ul className={`mt-2 space-y-1 ${compact ? "text-xs" : ""} text-blue-800`}>
            <li>
              <strong>Maximum:</strong> 750 characters
            </li>
            <li>
              <strong>Recommended:</strong> 500–750 characters
            </li>
            <li>
              Only the first <strong>~250 characters</strong> show before users click
              &quot;Read more&quot; — put your strongest hook and primary keywords up front.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function descriptionCharStatus(length: number): {
  label: string;
  className: string;
} {
  if (length > 750) {
    return { label: `${length} / 750 — over limit`, className: "text-red-600" };
  }
  if (length >= 500) {
    return { label: `${length} / 750 characters`, className: "text-emerald-600" };
  }
  if (length >= 250) {
    return { label: `${length} / 750 — aim for 500+`, className: "text-amber-600" };
  }
  return {
    label: `${length} / 750 — above-the-fold preview is ~250 chars`,
    className: "text-amber-600",
  };
}
