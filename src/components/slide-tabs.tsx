"use client";

import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

type NavTab = {
  label: "Browse" | "About" | "Messages" | "My Profile";
  route: "/browse" | "/about" | "/messages" | "/profile";
  badgeCount?: number;
};

type SlideTabsProps = {
  unreadMessages?: number;
};

const TABS: NavTab[] = [
  { label: "Browse", route: "/browse" },
  { label: "About", route: "/about" },
  { label: "Messages", route: "/messages" },
  { label: "My Profile", route: "/profile" },
];

export default function SlideTabs({
  unreadMessages = 0,
}: SlideTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const listRef = useRef<HTMLUListElement | null>(null);
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const [position, setPosition] = useState({ left: 0, width: 0, opacity: 0 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const tabs = useMemo(
    () =>
      TABS.map((tab) =>
        tab.label === "Messages"
          ? { ...tab, badgeCount: unreadMessages > 0 ? unreadMessages : undefined }
          : tab
      ),
    [unreadMessages]
  );

  const selectedIndex = useMemo(() => {
    const exact = tabs.findIndex((tab) => pathname === tab.route);
    if (exact >= 0) return exact;

    if (pathname.startsWith("/messages") || pathname.startsWith("/chat")) return 2;
    if (pathname.startsWith("/profile") || pathname.startsWith("/account")) return 3;
    if (pathname.startsWith("/browse")) return 0;
    if (pathname.startsWith("/about")) return 1;

    // No active tab for routes like homepage, so cursor only appears on hover.
    return -1;
  }, [pathname, tabs]);

  const applyCursorForIndex = (index: number) => {
    if (index < 0) {
      setPosition((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    const el = tabsRef.current[index];
    const listEl = listRef.current;
    if (!el) {
      setPosition((prev) => ({ ...prev, opacity: 0 }));
      return;
    }
    if (!listEl) {
      setPosition((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    const tabRect = el.getBoundingClientRect();
    const listRect = listEl.getBoundingClientRect();
    const left = tabRect.left - listRect.left;
    const width = tabRect.width;

    setPosition({ left, width, opacity: 1 });
  };

  useLayoutEffect(() => {
    applyCursorForIndex(selectedIndex);
  }, [selectedIndex]);

  useEffect(() => {
    const onResize = () => {
      if (hoveredIndex !== null) {
        applyCursorForIndex(hoveredIndex);
        return;
      }
      applyCursorForIndex(selectedIndex);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [hoveredIndex, selectedIndex]);

  const navigateToTab = (route: NavTab["route"], index: number) => {
    // Navigation logic: update the animated cursor immediately so the tab
    // feels responsive, then push to the route via Next router.
    applyCursorForIndex(index);
    router.push(route);
  };

  return (
    <div className="hidden md:block">
      <div
        className="relative rounded-full border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-white/5"
        onMouseLeave={() => {
          setHoveredIndex(null);
          applyCursorForIndex(selectedIndex);
        }}
      >
        <ul ref={listRef} className="relative flex items-center">
          {tabs.map((tab, index) => {
            const isSelected = selectedIndex === index;
            const isHovered = hoveredIndex === index;

            return (
              <li key={tab.label} className="relative">
                <TabButton
                  ref={(el) => {
                    tabsRef.current[index] = el;
                  }}
                  isSelected={isSelected}
                  isHovered={isHovered}
                  badgeCount={tab.badgeCount}
                  onMouseEnter={() => {
                    setHoveredIndex(index);
                    applyCursorForIndex(index);
                  }}
                  onClick={() => navigateToTab(tab.route, index)}
                >
                  {tab.label}
                </TabButton>
              </li>
            );
          })}

          <motion.li
            animate={position}
            transition={{ type: "spring", stiffness: 420, damping: 38, mass: 0.7 }}
            className="absolute inset-y-1 z-0 rounded-full bg-gradient-to-r from-primary to-blue-500 dark:from-sky-300 dark:to-cyan-300"
          />
        </ul>
      </div>
    </div>
  );
}

type TabButtonProps = {
  children: string;
  isSelected: boolean;
  isHovered: boolean;
  badgeCount?: number;
  onMouseEnter: () => void;
  onClick: () => void;
};

const TabButton = forwardRef(function TabButton(
  {
    children,
    isSelected,
    isHovered,
    badgeCount,
    onMouseEnter,
    onClick,
  }: TabButtonProps,
  ref: ForwardedRef<HTMLButtonElement>
) {
  const isActiveVisual = isSelected || isHovered;

  return (
    <button
      ref={ref}
      type="button"
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`relative z-10 flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors active:scale-[0.98] ${
        isActiveVisual
          ? "text-white dark:text-slate-950"
          : "text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
      }`}
    >
      <span>{children}</span>
      <motion.span
        initial={false}
        animate={{ opacity: isHovered || isSelected ? 1 : 0, x: isHovered || isSelected ? 0 : -2 }}
        transition={{ duration: 0.2 }}
        aria-hidden="true"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </motion.span>
      {typeof badgeCount === "number" && badgeCount > 0 ? (
        <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      ) : null}
    </button>
  );
});
