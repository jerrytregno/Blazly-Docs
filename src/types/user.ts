export type AccountPlan = "Free" | "Pro" | "Enterprise";

export interface UserProfile {
  userId: string;
  businessName: string;
  website: string;
  category: string;
  location: string;
  mapsPlaceId?: string;
  onboardingComplete: boolean;
  fullName: string;
  phone: string;
  companyName: string;
  country: string;
  timeZone: string;
  plan: AccountPlan;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccountProfileInput {
  fullName: string;
  phone: string;
  companyName: string;
  country: string;
  timeZone: string;
}

export interface OnboardingInput {
  businessName: string;
  website: string;
  category: string;
  location: string;
  mapsPlaceId?: string;
}
