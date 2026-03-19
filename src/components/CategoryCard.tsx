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
      <div className="cursor-pointer rounded-xl border border-slate-200 bg-white p-6 transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-xl hover:-translate-y-1 hover:ring-1 hover:ring-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:border-primary/40 dark:hover:ring-white/10">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${color}`}
        >
          <span className="material-symbols-outlined text-3xl leading-none">
            {materialIcon}
          </span>
        </div>
        <h3 className="mb-1 text-base font-bold text-slate-900 dark:text-white">{label}</h3>
      </div>
    </Link>
  );
}
