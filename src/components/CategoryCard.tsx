import Link from "next/link";
import { Category } from "@/types";

interface CategoryCardProps {
  label: Category;
  icon: string;
  materialIcon: string;
  color: string;
}

export default function CategoryCard({
  label,
  materialIcon,
  color,
}: CategoryCardProps) {
  return (
    <Link href={`/browse?category=${encodeURIComponent(label)}`} className="group block h-full">
      <div className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-xl hover:ring-1 hover:ring-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:border-primary/40 dark:hover:ring-white/10">
        <div
          className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full transition-transform group-hover:scale-110 ${color}`}
        >
          <span className="material-symbols-outlined text-2xl leading-none">
            {materialIcon}
          </span>
        </div>
        <h3 className="mb-1 text-[0.82rem] font-bold text-slate-900 dark:text-white">{label}</h3>
      </div>
    </Link>
  );
}
