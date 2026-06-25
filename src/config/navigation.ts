import {
  LayoutDashboard,
  Star,
  Radar,
  ClipboardCheck,
  ImageIcon,
  BarChart3,
  CreditCard,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";



export interface NavItem {

  href: string;

  label: string;

}



export interface NavSection {

  id: string;

  label: string;

  icon: LucideIcon;

  href?: string;

  items?: NavItem[];

  /** Included on the free plan */
  free?: boolean;

}



export const navigation: NavSection[] = [

  {

    id: "dashboard",

    label: "Dashboard",

    icon: LayoutDashboard,

    href: "/dashboard",

    free: true,

  },

  {
    id: "profile-optimization",
    label: "Profile Optimization",
    icon: ClipboardCheck,
    href: "/dashboard/profile-optimization",
    free: true,
  },
  {
    id: "rank-tracker",
    label: "Rank Tracker",
    icon: TrendingUp,
    href: "/dashboard/rank-tracker",
  },
  {
    id: "competitor-analysis",

    label: "Competitor Analysis",

    icon: Radar,

    href: "/dashboard/competitor-analysis",

    free: true,

  },

  {

    id: "review-management",

    label: "Review Management",

    icon: Star,

    href: "/dashboard/review-management",

  },

  {

    id: "enhance-images",

    label: "Enhance Images",

    icon: ImageIcon,

    href: "/dashboard/enhance-images",

  },

  {

    id: "analytics",

    label: "Analytics",

    icon: BarChart3,

    href: "/dashboard/analytics",

  },

  {

    id: "pricing",

    label: "Pricing",

    icon: CreditCard,

    href: "/dashboard/pricing",

    free: true,

  },

];

