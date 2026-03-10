import Link from "next/link";
import { Category } from "@/types";

interface CategoryCardProps {
  label: Category;
  icon: string;
  color: string;
}

export default function CategoryCard({
  label,
  icon,
  color,
}: CategoryCardProps) {
  return (
    <Link href={`/browse?category=${encodeURIComponent(label)}`}>
      <div
        className={`${color} rounded-xl p-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform cursor-pointer text-center`}
      >
        <span className="text-3xl">{icon}</span>
        <span className="text-xs font-semibold leading-tight">{label}</span>
      </div>
    </Link>
  );
}
