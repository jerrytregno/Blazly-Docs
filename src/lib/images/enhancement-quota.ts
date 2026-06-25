export const IMAGE_ENHANCEMENTS_MONTHLY_LIMIT = 15;

export interface ImageEnhancementQuota {
  used: number;
  limit: number;
  remaining: number;
  period: string;
  canEnhance: boolean;
  limitMessage: string | null;
  resetsAt: string;
}

export function currentEnhancementPeriod(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function nextEnhancementResetDate(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

function limitReachedMessage(resetsAt: Date): string {
  const label = resetsAt.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `You've used all ${IMAGE_ENHANCEMENTS_MONTHLY_LIMIT} image enhancements for this business profile this month. Your limit resets on ${label}.`;
}

export function resolveImageEnhancementQuota(input: {
  used?: number;
  period?: string;
  now?: Date;
}): ImageEnhancementQuota {
  const now = input.now ?? new Date();
  const currentPeriod = currentEnhancementPeriod(now);
  const storedPeriod = input.period?.trim();
  const used =
    storedPeriod === currentPeriod ? Math.max(0, input.used ?? 0) : 0;
  const remaining = Math.max(0, IMAGE_ENHANCEMENTS_MONTHLY_LIMIT - used);
  const resetsAt = nextEnhancementResetDate(now);

  return {
    used,
    limit: IMAGE_ENHANCEMENTS_MONTHLY_LIMIT,
    remaining,
    period: currentPeriod,
    canEnhance: remaining > 0,
    limitMessage: remaining > 0 ? null : limitReachedMessage(resetsAt),
    resetsAt: resetsAt.toISOString(),
  };
}
