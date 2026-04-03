"use client";

import { useState } from "react";
import CategoryCard from "@/components/CategoryCard";
import { CATEGORIES } from "@/lib/data";

export default function FeaturedCategoriesSection() {
  const [isOpen, setIsOpen] = useState(false);
  const categories = CATEGORIES.slice(0, 10);

  return (
    <section className="mx-auto mt-8 max-w-[1200px] px-4 sm:mt-14 sm:px-6">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-extrabold text-slate-900 sm:mb-6 sm:text-2xl dark:text-white">
        <span className="material-symbols-outlined rounded-md bg-primary/10 p-2 text-primary">
          category
        </span>
        Featured Categories
      </h2>

      <details
        className="group rounded-2xl border border-slate-200/80 bg-white/85 p-3 shadow-sm lg:hidden dark:border-white/10 dark:bg-white/5"
        onToggle={(event) => setIsOpen(event.currentTarget.open)}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-2 py-2 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-100/80 dark:text-slate-100 dark:hover:bg-white/10">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary">grid_view</span>
            {isOpen ? "Hide Categories" : "Show Categories"}
          </span>
          <span className="material-symbols-outlined text-slate-500 transition-transform duration-300 group-open:rotate-180 dark:text-slate-300">
            expand_more
          </span>
        </summary>

        <div className="mt-3 border-t border-slate-200/80 pt-3 dark:border-white/10">
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
