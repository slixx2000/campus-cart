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
      <div className="group cursor-pointer bg-white p-6 rounded-xl border border-slate-200 hover:border-primary transition-all hover:shadow-xl hover:shadow-primary/5">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${color}`}
        >
          <span className="material-symbols-outlined text-3xl leading-none">
            {materialIcon}
          </span>
        </div>
        <h3 className="font-bold text-base mb-1">{label}</h3>
      </div>
    </Link>
  );
}
