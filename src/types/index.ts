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
  universityShortName?: string;
  isNearby?: boolean;
  sellerId?: string;
  sellerName: string;
  sellerPhone: string;
  sellerAvatarUrl?: string;
  sellerIsPioneer?: boolean;
  images: string[];
  viewCount?: number;
  lastBumpedAt?: string;
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

export interface SellerReview {
  id: string;
  sellerId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatarUrl?: string | null;
  listingId?: string | null;
  rating: number;
  reviewText?: string | null;
  createdAt: string;
}

export interface SellerRatingSummary {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
