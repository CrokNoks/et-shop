"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBagIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import { ChefHat } from "lucide-react";

interface TabItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  isActive: (pathname: string) => boolean;
}

const TABS: TabItem[] = [
  {
    href: "/",
    label: "Ma liste",
    icon: ShoppingBagIcon,
    isActive: (pathname) => pathname === "/",
  },
  {
    href: "/stores",
    label: "Magasins",
    icon: BuildingStorefrontIcon,
    isActive: (pathname) => pathname.startsWith("/stores"),
  },
  {
    href: "/recipes",
    label: "Recettes",
    icon: ChefHat,
    isActive: (pathname) => pathname.startsWith("/recipes"),
  },
];

export const TabBar: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-white dark:bg-[#16223a] border-t border-[rgba(18,36,63,0.1)] dark:border-[rgba(255,255,255,0.09)] flex items-stretch justify-around"
      aria-label="Navigation principale"
    >
      {TABS.map(({ href, label, icon: Icon, isActive }) => {
        const active = isActive(pathname);
        return (
          <Link
            key={href}
            href={href}
            className="relative flex-1 flex flex-col items-center justify-center gap-1 outline-none focus-visible:outline-2 focus-visible:outline-[#FF6B35] focus-visible:outline-offset-[-2px]"
          >
            {active && (
              <span className="absolute top-0 h-0.5 w-4 rounded-full bg-[#FF6B35]" />
            )}
            <Icon
              className={`w-[22px] h-[22px] ${
                active
                  ? "text-[#1A365D] dark:text-[#e8ecf4]"
                  : "text-[#9397ab] dark:text-[#75798c]"
              }`}
              strokeWidth={active ? 1.8 : 1.6}
            />
            <span
              className={`text-[10.5px] ${
                active
                  ? "font-semibold text-[#1A365D] dark:text-[#e8ecf4]"
                  : "font-normal text-[#9397ab] dark:text-[#75798c]"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
