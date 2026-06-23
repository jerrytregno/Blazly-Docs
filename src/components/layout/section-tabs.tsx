"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/config/navigation";

interface SectionTabsProps {
  items: NavItem[];
}

export function SectionTabs({ items }: SectionTabsProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
