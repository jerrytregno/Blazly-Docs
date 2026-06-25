export const ANALYSIS_COOLDOWN_DAYS = 3;
export const REVIEW_LOAD_COOLDOWN_DAYS = 7;

export const ANALYSIS_COOLDOWN_MESSAGE =
  "Only after three days you can re-run analysis.";

export const RANK_SEARCH_COOLDOWN_MESSAGE =
  "After three days you can search for another category and location.";

export const REVIEW_LOAD_COOLDOWN_MESSAGE =
  "After 1 week you can load next 100 unanswered reviews.";

export function getCooldownState(
  lastAt?: string | null,
  blockedMessage = ANALYSIS_COOLDOWN_MESSAGE,
  cooldownDays = ANALYSIS_COOLDOWN_DAYS
) {
  if (!lastAt) {
    return { canRun: true, message: null as string | null, availableAt: null as Date | null };
  }

  const lastMs = new Date(lastAt).getTime();
  if (Number.isNaN(lastMs)) {
    return { canRun: true, message: null, availableAt: null };
  }

  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
  const availableAt = new Date(lastMs + cooldownMs);
  const canRun = Date.now() >= availableAt.getTime();

  return {
    canRun,
    message: canRun ? null : blockedMessage,
    availableAt: canRun ? null : availableAt,
  };
}
export function getAnalysisCooldownState(lastAnalyzedAt?: string | null) {
  return getCooldownState(lastAnalyzedAt, ANALYSIS_COOLDOWN_MESSAGE);
}

export function getRankSearchCooldownState(lastSearchedAt?: string | null) {
  return getCooldownState(lastSearchedAt, RANK_SEARCH_COOLDOWN_MESSAGE);
}

export function getReviewLoadCooldownState(lastFetchedAt?: string | null) {
  return getCooldownState(
    lastFetchedAt,
    REVIEW_LOAD_COOLDOWN_MESSAGE,
    REVIEW_LOAD_COOLDOWN_DAYS
  );
}