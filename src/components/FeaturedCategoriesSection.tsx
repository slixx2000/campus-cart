"use client";

import { useState } from "react";
import CategoryCard from "@/components/CategoryCard";
import { CATEGORIES } from "@/lib/data";

export default function FeaturedCategoriesSection() {
  const [isOpen, setIsOpen] = useState(false);
  const categories = CATEGORIES.slice(0, 10);

  return (
    <section className="mx-auto mt-8 max-w-[1200px] px-4 sm:mt-14 sm:px-6">
      <h2 className="mb-6 text-2xl font-semibold tracking-tight text-fg">
        Featured Categories
      </h2>

      <details
        className="group rounded-2xl border border-line bg-surface p-3 shadow-sm lg:hidden dark:bg-surface"
        onToggle={(event) => setIsOpen(event.currentTarget.open)}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-2 py-2 text-sm font-bold text-slate-800 transition-colors hover:bg-surface-2 dark:text-slate-100 dark:hover:bg-surface">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary">grid_view</span>
            {isOpen ? "Hide Categories" : "Show Categories"}
          </span>
          <span className="material-symbols-outlined text-slate-500 transition-transform duration-300 group-open:rotate-180 dark:text-slate-300">
            expand_more
          </span>
        </summary>

        <div className="mt-3 border-t border-line pt-3">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.label}
                label={cat.label}
                icon={cat.icon}
                materialIcon={cat.materialIcon}
                color={cat.color}
              />
            ))}
          </div>
        </div>
      </details>

      <div className="hidden lg:grid lg:grid-cols-5 lg:gap-3">
        {categories.map((cat) => (
          <CategoryCard
            key={cat.label}
            label={cat.label}
            icon={cat.icon}
            materialIcon={cat.materialIcon}
            color={cat.color}
          />
        ))}
      </div>
    </section>
  );
}
