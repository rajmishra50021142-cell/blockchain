"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  name: string;
  href: string;
  icon?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/" },
  { name: "Documents", href: "/documents" },
  { name: "Register Document", href: "/register" },
  { name: "Verify", href: "/verify" },
  { name: "Wallet & Identity", href: "/wallet" },
  { name: "Configuration", href: "/settings" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main Navigation"
      className="border-b border-zinc-800/60 bg-zinc-950/40 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2 overflow-x-auto py-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? "bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
