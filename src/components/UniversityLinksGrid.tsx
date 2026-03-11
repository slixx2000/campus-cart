"use client";

import Link from "next/link";
import { useUniversities } from "@/hooks/useUniversities";

export default function UniversityLinksGrid() {
  const { universities, isLoading, error } = useUniversities();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse"
          >
            <div className="h-6 w-16 rounded bg-slate-200 mx-auto mb-2" />
            <div className="h-3 w-28 rounded bg-slate-100 mx-auto mb-2" />
            <div className="h-3 w-14 rounded bg-slate-100 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        {error}
      </div>
    );
  }

  if (universities.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
        No universities are available yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {universities.map((university) => (
        <Link
          key={university.id}
          href={`/browse?university=${encodeURIComponent(university.code)}`}
          className="group rounded-xl border border-slate-200 bg-white p-4 text-center transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/5 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl dark:hover:border-primary/40 dark:hover:shadow-primary/10"
        >
          <p className="font-bold text-primary text-lg group-hover:scale-105 transition-transform inline-block">
            {university.short_name}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-300">
            {university.name}
          </p>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{university.city}</p>
        </Link>
      ))}
    </div>
  );
}