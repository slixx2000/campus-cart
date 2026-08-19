"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/browse", icon: "search", label: "Search" },
  { href: "/sell", icon: "add_circle", label: "Sell" },
  { href: "/profile", icon: "person", label: "Profile" },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  // Suppressed during the transactional listing flow, per the design.
  if (pathname.startsWith("/sell")) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex justify-around border-t border-line bg-surface md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
              isActive ? "text-fg" : "text-muted"
            }`}
          >
            <span
              className="material-symbols-outlined text-2xl leading-none"
              style={
                isActive ? { fontVariationSettings: "'FILL' 1" } : undefined
              }
            >
              {tab.icon}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
