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
}: CategoryCardProps) {
  return (
    <Link href={`/browse?category=${encodeURIComponent(label)}`} className="group block h-full">
      <div className="card h-full cursor-pointer p-4 transition-shadow hover:shadow-hover">
        <span className="material-symbols-outlined mb-3 block text-2xl leading-none text-fg">
          {materialIcon}
        </span>
        <h3 className="text-sm font-medium text-fg">{label}</h3>
      </div>
    </Link>
  );
}
