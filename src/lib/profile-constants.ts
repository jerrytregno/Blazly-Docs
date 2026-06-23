export const ACCOUNT_PLANS = ["Free", "Pro", "Enterprise"] as const;

export const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "India",
  "Germany",
  "France",
  "Netherlands",
  "Singapore",
  "United Arab Emirates",
  "Other",
];

export const TIME_ZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export function formatTimeZoneLabel(tz: string) {
  return tz.replace(/_/g, " ").replace("/", " — ");
}
