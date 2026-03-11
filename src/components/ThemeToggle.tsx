"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("campuscart-theme", theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("campuscart-theme");
    const initialTheme: Theme =
      storedTheme === "dark" ||
      (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
        ? "dark"
        : "light";

    setTheme(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);
  }, []);

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={theme === "dark"}
      onClick={() => {
        setTheme(nextTheme);
        applyTheme(nextTheme);
      }}
      className="flex items-center justify-center rounded-full size-10 bg-slate-200/60 text-slate-700 transition-colors hover:bg-primary/15 hover:text-primary dark:bg-primary/10 dark:text-white dark:hover:bg-primary/20"
    >
      <span className="material-symbols-outlined text-[20px] leading-none">
        {mounted && theme === "dark" ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}