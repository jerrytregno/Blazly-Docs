"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function IconRail() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-14 shrink-0 flex-col border-r border-gray-800 bg-gray-900 lg:flex">
      <div className="flex flex-1 flex-col items-center gap-1 py-3">
        {navigation.map((section) => {
          const Icon = section.icon;
          const href = section.href ?? section.items?.[0]?.href ?? "/dashboard";
          const active =
            pathname === section.href ||
            section.items?.some(
              (item) =>
                pathname === item.href || pathname.startsWith(item.href + "/")
            );

          return (
            <Link
              key={section.id}
              href={href}
              title={section.label}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                active
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
