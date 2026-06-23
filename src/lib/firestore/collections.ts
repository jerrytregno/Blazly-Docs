import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { OnboardingInput } from "@/types/user";
import type {
  BusinessDoc,
  DashboardDoc,
  ProfileOptimizationDoc,
  AnalyticsDoc,
  KeywordResearchDoc,
  RankingsDoc,
  ReviewsDoc,
} from "@/types/firestore";
import {
  createDefaultBusiness,
  createDefaultDashboard,
  createDefaultProfileOptimization,
  createDefaultAnalytics,
  createDefaultKeywordResearch,
  createDefaultRankings,
  createDefaultReviews,
} from "./defaults";
import { stripUndefined } from "./sanitize";

async function getOrCreate<T extends { userId: string }>(
  collection: string,
  userId: string,
  create: () => T
): Promise<T> {
  const ref = doc(db, collection, userId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { userId, ...snap.data() } as T;
  }
  const data = create();
  await setDoc(ref, { ...data, updatedAt: serverTimestamp(), createdAt: serverTimestamp() });
  return data;
}

export async function getBusiness(userId: string): Promise<BusinessDoc> {
  return getOrCreate("businesses", userId, () =>
    createDefaultBusiness(userId, {
      businessName: "",
      website: "",
      category: "",
      location: "",
    })
  );
}

export async function getDashboard(userId: string): Promise<DashboardDoc> {
  return getOrCreate("dashboard", userId, () => createDefaultDashboard(userId));
}

export async function getReviews(userId: string): Promise<ReviewsDoc> {
  return getOrCreate("reviews", userId, () => createDefaultReviews(userId));
}

export async function getRankings(userId: string): Promise<RankingsDoc> {
  return getOrCreate("rankings", userId, () =>
    createDefaultRankings(userId, "")
  );
}

export async function initializeUserData(
  userId: string,
  input: OnboardingInput
): Promise<void> {
  const business = createDefaultBusiness(userId, input);
  const dashboard = createDefaultDashboard(userId);
  const reviews = createDefaultReviews(userId);
  const rankings = createDefaultRankings(userId, input.businessName.trim());

  const ts = serverTimestamp();
  await Promise.all([
    setDoc(doc(db, "businesses", userId), { ...business, createdAt: ts, updatedAt: ts }),
    setDoc(doc(db, "dashboard", userId), { ...dashboard, createdAt: ts, updatedAt: ts }),
    setDoc(doc(db, "reviews", userId), { ...reviews, createdAt: ts, updatedAt: ts }),
    setDoc(doc(db, "rankings", userId), { ...rankings, createdAt: ts, updatedAt: ts }),
  ]);
}

export async function updateBusiness(
  userId: string,
  data: Partial<BusinessDoc>
): Promise<void> {
  await updateDoc(doc(db, "businesses", userId), {
    ...stripUndefined(data),
    updatedAt: serverTimestamp(),
  });
}

export async function updateDashboard(
  userId: string,
  data: Partial<DashboardDoc>
): Promise<void> {
  await updateDoc(doc(db, "dashboard", userId), {
    ...stripUndefined(data),
    updatedAt: serverTimestamp(),
  });
}

export async function updateReviews(
  userId: string,
  data: Partial<ReviewsDoc>
): Promise<void> {
  await updateDoc(doc(db, "reviews", userId), {
    ...stripUndefined(data),
    updatedAt: serverTimestamp(),
  });
}

export async function updateRankings(
  userId: string,
  data: Partial<RankingsDoc>
): Promise<void> {
  await updateDoc(doc(db, "rankings", userId), {
    ...stripUndefined(data),
    updatedAt: serverTimestamp(),
  });
}

export async function getProfileOptimization(
  userId: string
): Promise<ProfileOptimizationDoc> {
  return getOrCreate("profileOptimization", userId, () =>
    createDefaultProfileOptimization(userId)
  );
}

export async function updateProfileOptimization(
  userId: string,
  data: Partial<ProfileOptimizationDoc>
): Promise<void> {
  await updateDoc(doc(db, "profileOptimization", userId), {
    ...stripUndefined(data),
    updatedAt: serverTimestamp(),
  });
}

export async function getAnalytics(userId: string): Promise<AnalyticsDoc> {
  return getOrCreate("analytics", userId, () => createDefaultAnalytics(userId));
}

export async function updateAnalytics(
  userId: string,
  data: Partial<AnalyticsDoc>
): Promise<void> {
  await updateDoc(doc(db, "analytics", userId), {
    ...stripUndefined(data),
    updatedAt: serverTimestamp(),
  });
}

export async function getKeywordResearch(
  userId: string
): Promise<KeywordResearchDoc> {
  return getOrCreate("keywordResearch", userId, () =>
    createDefaultKeywordResearch(userId)
  );
}

export async function updateKeywordResearch(
  userId: string,
  data: Partial<KeywordResearchDoc>
): Promise<void> {
  await updateDoc(doc(db, "keywordResearch", userId), {
    ...stripUndefined(data),
    updatedAt: serverTimestamp(),
  });
}

export async function loadAllUserData(userId: string) {
  const [business, dashboard, reviews, rankings, profileOptimization, analytics, keywordResearch] =
    await Promise.all([
    getBusiness(userId),
    getDashboard(userId),
    getReviews(userId),
    getRankings(userId),
    getProfileOptimization(userId),
    getAnalytics(userId),
    getKeywordResearch(userId),
  ]);
  return { business, dashboard, reviews, rankings, profileOptimization, analytics, keywordResearch };
}
