"use client";

import { useEffect, useMemo } from "react";

type BrowseScrollRestorerProps = {
  storageKey: string;
};

export default function BrowseScrollRestorer({ storageKey }: BrowseScrollRestorerProps) {
  const key = useMemo(() => `browse-scroll:${storageKey}`, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedY = Number.parseInt(sessionStorage.getItem(key) ?? "", 10);
    if (Number.isFinite(savedY) && savedY > 0) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedY, behavior: "auto" });
      });
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking) {
        return;
      }

      ticking = true;
      requestAnimationFrame(() => {
        sessionStorage.setItem(key, String(window.scrollY));
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [key]);

  return null;
}
