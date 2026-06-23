import {
  LayoutDashboard,
  Star,
  Radar,
  ClipboardCheck,
  ImageIcon,
  BarChart3,
  Search,
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

}



export const navigation: NavSection[] = [

  {

    id: "dashboard",

    label: "Dashboard",

    icon: LayoutDashboard,

    href: "/dashboard",

  },

  {
    id: "profile-optimization",
    label: "Profile Optimization",
    icon: ClipboardCheck,
    href: "/dashboard/profile-optimization",
  },
  {
    id: "keyword-research",
    label: "Keyword Research",
    icon: Search,
    href: "/dashboard/keyword-research",
  },
  {
    id: "competitor-analysis",

    label: "Competitor Analysis",

    icon: Radar,

    href: "/dashboard/competitor-analysis",

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

];

