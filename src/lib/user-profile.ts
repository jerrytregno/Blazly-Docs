import { doc, getDoc, setDoc, serverTimestamp, Timestamp, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { initializeUserData } from "@/lib/firestore/collections";
import { hasActiveBusiness } from "@/lib/firestore/reset-business";
import type { AccountPlan, AccountProfileInput, OnboardingInput, UserProfile } from "@/types/user";

function toIso(value: unknown): string | undefined {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return undefined;
}

function parsePlan(value: unknown): AccountPlan {
  if (value === "Pro" || value === "Enterprise" || value === "Free") return value;
  return "Free";
}

function mapProfileData(userId: string, data: Record<string, unknown>): UserProfile {
  const businessName = (data.businessName as string) ?? "";
  return {
    userId,
    businessName,
    website: (data.website as string) ?? "",
    category: (data.category as string) ?? "",
    location: (data.location as string) ?? "",
    mapsPlaceId: (data.mapsPlaceId as string) ?? "",
    onboardingComplete: data.onboardingComplete === true,
    fullName: (data.fullName as string) ?? "",
    phone: (data.phone as string) ?? "",
    companyName: (data.companyName as string) ?? businessName,
    country: (data.country as string) ?? "",
    timeZone: (data.timeZone as string) ?? "America/New_York",
    plan: parsePlan(data.plan),
    businessSlots: typeof data.businessSlots === "number" ? data.businessSlots : 0,
    businessesUsed:
      typeof data.businessesUsed === "number"
        ? data.businessesUsed
        : data.onboardingComplete === true
          ? 1
          : 0,
    stripeCustomerId: (data.stripeCustomerId as string) ?? undefined,
    stripeSubscriptionId: (data.stripeSubscriptionId as string) ?? undefined,
    subscriptionStatus: (data.subscriptionStatus as string) ?? undefined,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return null;
  return mapProfileData(userId, snap.data());
}

export async function ensureUserProfile(userId: string): Promise<void> {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(ref, {
    userId,
    businessName: "",
    website: "",
    category: "",
    location: "",
    fullName: "",
    phone: "",
    companyName: "",
    country: "",
    timeZone: "America/New_York",
    plan: "Free",
    businessSlots: 0,
    businessesUsed: 0,
    onboardingComplete: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateAccountProfile(
  userId: string,
  input: AccountProfileInput
): Promise<void> {
  await setDoc(
    doc(db, "users", userId),
    {
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      companyName: input.companyName.trim(),
      country: input.country,
      timeZone: input.timeZone,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function updateUserBusinessProfile(
  userId: string,
  input: {
    businessName: string;
    website: string;
    category: string;
    location: string;
    mapsPlaceId?: string;
  }
): Promise<void> {
  const website = input.website.trim().replace(/^https?:\/\//, "");
  await setDoc(
    doc(db, "users", userId),
    {
      businessName: input.businessName.trim(),
      website,
      category: input.category.trim(),
      location: input.location.trim(),
      mapsPlaceId: input.mapsPlaceId?.trim() ?? "",
      companyName: input.businessName.trim(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function completeOnboarding(
  userId: string,
  input: OnboardingInput,
  options?: { isAddingBusiness?: boolean; isReplacingBusiness?: boolean }
): Promise<void> {
  const website = input.website.trim().replace(/^https?:\/\//, "");
  const mapsPlaceId = input.mapsPlaceId?.trim() ?? "";

  await initializeUserData(userId, input);

  const profileUpdate: Record<string, unknown> = {
    userId,
    businessName: input.businessName.trim(),
    website,
    category: input.category.trim(),
    location: input.location.trim(),
    mapsPlaceId,
    companyName: input.businessName.trim(),
    onboardingComplete: true,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  if (options?.isAddingBusiness) {
    profileUpdate.businessesUsed = increment(1);
  } else if (!options?.isReplacingBusiness) {
    profileUpdate.businessesUsed = 1;
  }

  await setDoc(doc(db, "users", userId), profileUpdate, { merge: true });
}

export async function getPostAuthPath(userId: string): Promise<string> {
  const [profile, active] = await Promise.all([
    getUserProfile(userId),
    hasActiveBusiness(userId),
  ]);
  if (profile?.onboardingComplete === true && active) {
    return "/dashboard";
  }
  return "/onboarding";
}
