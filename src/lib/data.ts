import { Category } from "@/types";

export const CATEGORIES: {
  label: Category;
  icon: string;
  materialIcon: string;
  color: string;
}[] = [
  {
    label: "Food & Drinks",
    icon: "🍔",
    materialIcon: "restaurant",
    color: "bg-orange-100 text-orange-600",
  },
  {
    label: "Clothing & Fashion",
    icon: "👕",
    materialIcon: "checkroom",
    color: "bg-purple-100 text-purple-600",
  },
  {
    label: "Electronics",
    icon: "📱",
    materialIcon: "devices",
    color: "bg-blue-100 text-blue-600",
  },
  {
    label: "Books & Stationery",
    icon: "📚",
    materialIcon: "auto_stories",
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    label: "Services",
    icon: "🔧",
    materialIcon: "construction",
    color: "bg-teal-100 text-teal-600",
  },
  {
    label: "Beauty & Personal Care",
    icon: "💄",
    materialIcon: "spa",
    color: "bg-pink-100 text-pink-600",
  },
  {
    label: "Sports & Fitness",
    icon: "⚽",
    materialIcon: "sports_soccer",
    color: "bg-green-100 text-green-600",
  },
  {
    label: "Home & Dorm",
    icon: "🏠",
    materialIcon: "chair_alt",
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    label: "Tutoring",
    icon: "🎓",
    materialIcon: "school",
    color: "bg-red-100 text-red-600",
  },
  {
    label: "Other",
    icon: "📦",
    materialIcon: "inventory_2",
    color: "bg-slate-100 text-slate-600",
  },
];

export const formatPrice = (amount: number): string => {
  return `ZMW ${amount.toLocaleString("en-ZM")}`;
};
