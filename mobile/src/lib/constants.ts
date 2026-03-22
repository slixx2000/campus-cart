export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop';

export const CATEGORY_OPTIONS = [
  'Food & Drinks',
  'Clothing & Fashion',
  'Electronics',
  'Books & Stationery',
  'Services',
  'Beauty & Personal Care',
  'Sports & Fitness',
  'Home & Dorm',
  'Tutoring',
  'Other',
] as const;

export const LISTING_SELECT = `
  id,
  title,
  description,
  price,
  featured,
  is_service,
  created_at,
  last_bumped_at,
  view_count,
  condition,
  status,
  seller_id,
  category_id,
  university_id,
  categories ( id, name, material_icon, color_class ),
  universities ( id, name, short_name ),
  profiles!listings_seller_id_fkey ( id, full_name, phone, avatar_url, is_verified_student, is_pioneer_seller ),
  listing_images ( id, public_url, sort_order )
`;
