// Type definitions for CampusCart Supabase schema.
// Regenerate any time you change the schema:
//   npx supabase gen types typescript --project-id <id> > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ListingCondition = "new" | "like_new" | "good" | "fair";
export type ListingStatus = "draft" | "active" | "sold" | "archived" | "removed";
export type ReportType = "user" | "listing" | "conversation";

// Row shapes — must be `type` aliases (not interfaces) so they satisfy
// Record<string, unknown> in TypeScript's conditional type checking,
// which is required by Supabase's GenericTable constraint.
export type UniversityRow = {
  id: string;
  code: string;
  name: string;
  short_name: string;
  city: string;
  province: string;
  created_at: string;
};

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  material_icon: string | null;
  color_class: string | null;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  full_name: string;
  phone: string | null;
  university_id: string | null;
  avatar_url: string | null;
  is_verified_student: boolean;
  created_at: string;
  updated_at: string;
};

export type ListingRow = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category_id: string;
  university_id: string;
  condition: ListingCondition | null;
  is_service: boolean;
  featured: boolean;
  status: ListingStatus;
  last_bumped_at: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ListingImageRow = {
  id: string;
  listing_id: string;
  storage_path: string;
  public_url: string | null;
  sort_order: number;
  created_at: string;
};

export type FavoriteRow = {
  user_id: string;
  listing_id: string;
  created_at: string;
};

export type ReportRow = {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  listing_id: string | null;
  conversation_id: string | null;
  report_type: ReportType;
  reason: string;
  details: string | null;
  created_at: string;
};

export type BlockedUserRow = {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};

export type ConversationRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  /** ISO timestamp when this message is no longer visible. */
  expires_at: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      universities: {
        Row: UniversityRow;
        Insert: Omit<UniversityRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<UniversityRow>;
        Relationships: [];
      };
      categories: {
        Row: CategoryRow;
        Insert: Omit<CategoryRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<CategoryRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "created_at" | "updated_at" | "full_name" | "is_verified_student" | "phone" | "university_id" | "avatar_url"> & {
          full_name?: string;
          phone?: string | null;
          university_id?: string | null;
          avatar_url?: string | null;
          is_verified_student?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      listings: {
        Row: ListingRow;
        Insert: Omit<ListingRow, "id" | "created_at" | "updated_at" | "deleted_at" | "last_bumped_at" | "view_count"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          last_bumped_at?: string;
          view_count?: number;
          status?: ListingStatus;
          featured?: boolean;
        };
        Update: Partial<ListingRow>;
        Relationships: [];
      };
      listing_images: {
        Row: ListingImageRow;
        Insert: Omit<ListingImageRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<ListingImageRow>;
        Relationships: [];
      };
      favorites: {
        Row: FavoriteRow;
        Insert: Omit<FavoriteRow, "created_at"> & { created_at?: string };
        Update: Partial<FavoriteRow>;
        Relationships: [];
      };
      reports: {
        Row: ReportRow;
        Insert: Omit<ReportRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<ReportRow>;
        Relationships: [];
      };
      blocked_users: {
        Row: BlockedUserRow;
        Insert: Omit<BlockedUserRow, "created_at"> & { created_at?: string };
        Update: Partial<BlockedUserRow>;
        Relationships: [];
      };
      conversations: {
        Row: ConversationRow;
        Insert: Omit<ConversationRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ConversationRow>;
        Relationships: [];
      };
      messages: {
        Row: MessageRow;
        Insert: Omit<MessageRow, "id" | "created_at" | "expires_at"> & {
          id?: string;
          expires_at?: string;
          created_at?: string;
        };
        Update: Partial<MessageRow>;
        Relationships: [];
      };
    };
    Enums: {
      listing_condition: ListingCondition;
      listing_status: ListingStatus;
    };
    Views: Record<string, never>;
    Functions: {
      increment_listing_view: {
        Args: { p_listing_id: string };
        Returns: undefined;
      };
    };
  };
};

/** A conversation joined with listing title and both participant profiles. */
export type ConversationWithRelations = ConversationRow & {
  listings: { id: string; title: string } | null;
  /** Profile of the buyer (joined via buyer_id FK). */
  buyer_profile: { id: string; full_name: string; avatar_url: string | null } | null;
  /** Profile of the seller (joined via seller_id FK). */
  seller_profile: { id: string; full_name: string; avatar_url: string | null } | null;
  /** Most recent non-expired message preview (optional, enriched in JS). */
  last_message?: { content: string; created_at: string } | null;
};

/** A listing joined with its images, seller profile, category, and university. */
export type ListingWithRelations = ListingRow & {
  categories: Pick<CategoryRow, "id" | "name" | "slug" | "material_icon" | "color_class"> | null;
  universities: Pick<UniversityRow, "id" | "name" | "short_name" | "city"> | null;
  profiles: Pick<ProfileRow, "id" | "full_name" | "phone" | "avatar_url"> | null;
  listing_images: ListingImageRow[];
};
