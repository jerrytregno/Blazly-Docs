import {
  LayoutDashboard,
  MessageSquare,
  Radar,
  MapPin,
  Sparkles,
  Star,
  Target,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

export const DEMO_CALENDLY_URL = "https://calendly.com/blazly-marketing/blazly-demo";

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
];

export const TRUSTED_BY = [
  "BrightPath Agency",
  "LocalLift Marketing",
  "Summit Dental Group",
  "Harbor Home Services",
  "Peak Fitness Studios",
  "Northline Legal",
];

export interface FeatureGroup {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  items: string[];
}

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Your command center for local SEO performance at a glance.",
    icon: LayoutDashboard,
    color: "from-violet-500 to-purple-600",
    items: [
      "Local SEO Score",
      "AI Visibility Overview",
      "Priority Actions",
      "Competitor Snapshot",
      "Optimization Progress",
    ],
  },
  {
    id: "profile-optimization",
    title: "Profile Optimization",
    description: "Complete GBP audit with AI-powered enhancement recommendations.",
    icon: Target,
    color: "from-fuchsia-500 to-pink-600",
    items: [
      "Google Maps profile fetch",
      "Profile Completion Score",
      "Missing field detection",
      "Enhance Profile with AI",
      "Action plan (quick wins to long-term)",
      "Category & description optimization",
    ],
  },
  {
    id: "competitor-analysis",
    title: "Competitor Analysis",
    description: "See how crowded your market is by category and location.",
    icon: Radar,
    color: "from-indigo-500 to-violet-600",
    items: [
      "Low / Medium / High competition level",
      "Competitor density scoring",
      "Established & dominant player counts",
      "Top competitor breakdown",
      "Full competitor list from Google Maps",
    ],
  },
  {
    id: "reviews",
    title: "Review Management",
    description: "Fetch Google reviews and reply faster with AI.",
    icon: MessageSquare,
    color: "from-amber-500 to-orange-600",
    items: [
      "Live Google review sync",
      "Reviewer name & star rating",
      "Unanswered review highlights",
      "AI reply generation",
      "Copy & mark as replied",
    ],
  },
];

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Connect your business",
    description: "Add your business name, category, location, and website during onboarding.",
    icon: MapPin,
  },
  {
    step: 2,
    title: "Optimize your profile",
    description: "Audit your Google Business Profile and get AI recommendations to fill gaps.",
    icon: ClipboardCheck,
  },
  {
    step: 3,
    title: "Check competition level",
    description: "See whether your category and location is low, medium, or high competition.",
    icon: Radar,
  },
  {
    step: 4,
    title: "Manage reviews with AI",
    description: "Respond to unanswered Google reviews with AI-generated replies.",
    icon: Sparkles,
  },
];

export const WHY_CHOOSE = [
  { icon: ClipboardCheck, title: "GBP profile audit", description: "Fetch and score your Google Business Profile in one click." },
  { icon: MapPin, title: "Local market insights", description: "Understand your competition level by category and location." },
  { icon: Target, title: "Competitor analysis", description: "See who ranks near you and how established they are." },
  { icon: Star, title: "Google review management", description: "Fetch reviews and generate AI replies for unanswered feedback." },
  { icon: LayoutDashboard, title: "Unified dashboard", description: "Track SEO score, visibility, and priorities in one place." },
  { icon: Sparkles, title: "AI-powered enhancements", description: "Get prioritized profile optimization recommendations instantly." },
];

export const AI_INSIGHTS = [
  {
    type: "GBP Optimization",
    message: "Add 2 missing categories to improve GBP optimization.",
    impact: "High impact",
  },
  {
    type: "Competitor Analysis",
    message: "Your competitor ranks higher due to stronger review volume.",
    impact: "Medium impact",
  },
  {
    type: "Citation Health",
    message: "Fix 12 citation inconsistencies across top directories.",
    impact: "High impact",
  },
  {
    type: "Review Growth",
    message: "Request 15 more reviews to match the local leader.",
    impact: "High impact",
  },
];

export const TESTIMONIALS = [
  {
    quote: "Blazly helped us jump from position 8 to the top 3 in Google Maps within 90 days. The AI recommendations are incredibly actionable.",
    name: "Sarah Mitchell",
    role: "Owner",
    company: "Summit Dental Group",
    rating: 5,
  },
  {
    quote: "We manage 40+ local clients. Blazly cut our reporting time in half and gave us a clear playbook for every account.",
    name: "Marcus Chen",
    role: "Director of SEO",
    company: "BrightPath Agency",
    rating: 5,
  },
  {
    quote: "The competitor intelligence alone transformed our workflow. We finally understand why rivals outrank us and what to fix first.",
    name: "Elena Rodriguez",
    role: "Marketing Manager",
    company: "Harbor Home Services",
    rating: 5,
  },
  {
    quote: "Review campaigns and AI replies transformed our reputation. Response time dropped and our average rating climbed to 4.9.",
    name: "James Okonkwo",
    role: "Franchise Owner",
    company: "Peak Fitness Studios",
    rating: 5,
  },
];

export const FAQ_ITEMS = [
  {
    question: "What is local SEO and why does it matter?",
    answer: "Local SEO helps your business appear in Google Maps and local search results when nearby customers search for your services. Blazly gives you a dashboard, competitor analysis, and review tools to improve visibility.",
  },
  {
    question: "How does competitor analysis work?",
    answer: "Blazly searches Google Maps for your category and location, scores market density, and shows whether competition is low, medium, or high — with a breakdown of nearby competitors.",
  },
  {
    question: "Can Blazly fetch my Google reviews?",
    answer: "Yes. After SEO analysis, Blazly pulls your Google reviews with reviewer names, star ratings, and text. Unanswered reviews can get AI-generated reply drafts.",
  },
  {
    question: "Does Blazly post replies to Google for me?",
    answer: "Blazly generates reply text with AI. You copy the response and post it on your Google Business Profile.",
  },
  {
    question: "What does the dashboard show?",
    answer: "Your local SEO score, AI visibility, organic traffic estimate, priority actions, competitor snapshot, and links to competitor analysis and review management.",
  },
];

export const FOOTER_LINKS = {
  product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Competitor Analysis", href: "#features" },
  ],
  resources: [
    { label: "Documentation", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Contact", href: "#" },
    { label: "FAQ", href: "#faq" },
  ],
  legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};
