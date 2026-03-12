export type Category =
  | "Food & Drinks"
  | "Clothing & Fashion"
  | "Electronics"
  | "Books & Stationery"
  | "Services"
  | "Beauty & Personal Care"
  | "Sports & Fitness"
  | "Home & Dorm"
  | "Tutoring"
  | "Other";

export type Condition = "New" | "Like New" | "Good" | "Fair";

export interface University {
  id: string;
  name: string;
  shortName: string;
  city: string;
  province: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  condition?: Condition;
  university: string;
  sellerId?: string;
  sellerName: string;
  sellerPhone: string;
  sellerAvatarUrl?: string;
  images: string[];
  createdAt: string;
  featured?: boolean;
  isService?: boolean;
}

export interface ListingFormData {
  title: string;
  description: string;
  price: number;
  category: Category;
  condition?: Condition;
  university: string;
  sellerName: string;
  sellerPhone: string;
}
