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
    <Link href={`/browse?category=${encodeURIComponent(label)}`}>
      <div className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-primary hover:shadow-xl hover:shadow-primary/5 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl dark:hover:border-primary/40 dark:hover:shadow-primary/10">
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
