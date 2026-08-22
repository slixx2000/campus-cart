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
export type PaymentProviderName = "bila";
export type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";
export type PaymentPurpose =
  | "listing_boost"
  | "featured_listing"
  | "seller_subscription"
  | "storefront_upgrade"
  | "advertisement"
  | "sponsored_deal"
  | "transaction_fee"
  | "delivery";
export type PromotionProductKind = "boost" | "featured" | "seller_pro";
export type ReportType = "user" | "listing" | "conversation";

export type SellerReviewRow = {
  id: string;
  seller_id: string;
  reviewer_id: string;
  listing_id: string | null;
  rating: number;
  review_text: string | null;
  created_at: string;
  updated_at: string;
};

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
  student_email: string | null;
  student_email_requested_at: string | null;
  student_email_verified_at: string | null;
  verification_review_note: string | null;
  verification_rejection_reason: string | null;
  verification_reviewed_at: string | null;
  verification_reviewed_by: string | null;
  is_admin: boolean;
  is_verified_student: boolean;
  is_pioneer_seller: boolean;
  pioneer_awarded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ListingRow = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  search_vector: string;
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
  /** Legacy Supabase Storage path; null for R2-era rows. Use object_key. */
  storage_path: string | null;
  public_url: string | null;
  /** Cloudflare R2 key. Prefer over public_url; null on rows written before the R2 cutover. */
  object_key: string | null;
  sort_order: number;
  created_at: string;
};

/**
 * One row per presigned R2 URL minted. Doubles as the presign rate-limit counter and
 * as the orphan ledger for objects uploaded but never attached to a listing.
 */
export type UploadGrantRow = {
  object_key: string;
  user_id: string;
  listing_id: string | null;
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

export type SearchSynonymRow = {
  word: string;
  synonym: string;
  created_at: string;
};

export type ConversationRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  buyer_last_read_at: string | null;
  seller_last_read_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  expires_at: string;
  created_at: string;
};

export type StudentEmailVerificationTokenRow = {
  id: string;
  profile_id: string;
  student_email: string;
  token_hash: string;
  expires_at: string;
  consumed_at: string | null;
  created_by: string;
  created_at: string;
};

export type PushTokenRow = {
  id: string;
  user_id: string;
  expo_push_token: string;
  platform: "android" | "ios" | "web" | "unknown";
  is_active: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};

export type PaymentProductRow = {
 id: string;
 kind: PromotionProductKind;
 name: string;
 description: string | null;
 price_minor: number;
 currency: "ZMW";
 duration_days: number;
 is_active: boolean;
 metadata: Json;
 created_at: string;
 updated_at: string;
};

export type PaymentRow = {
  id: string;
  user_id: string;
  product_id: string | null;
  provider: PaymentProviderName;
  provider_payment_id: string | null;
  provider_reference: string | null;
  payment_reference: string;
  status: PaymentStatus;
  purpose: PaymentPurpose;
  amount_minor: number;
  currency: "ZMW";
  metadata: Json;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  fulfilled_at: string | null;
};

export type PaymentWebhookEventRow = {
 id: string;
 payment_id: string;
 provider: PaymentProviderName;
 event_name: string;
 provider_event_id: string | null;
 status: PaymentStatus | null;
 payload: Json;
 received_at: string;
};

export type ListingPromotionRow = {
  id: string;
  listing_id: string;
  kind: "featured" | "boost";
  starts_at: string;
  ends_at: string;
  amount_kwacha: number | null;
  note: string | null;
  granted_by: string;
  created_at: string;
}
 
export type AdBannerRow = {
  id: string;
  placement: "home" | "browse";
  title: string;
  image_url: string;
  target_url: string;
  advertiser: string | null;
  starts_at: string;
  ends_at: string;
  sort_order: number;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      universities: {
        Row: UniversityRow;
        Insert: Omit<UniversityRow, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<UniversityRow>;
        Relationships: [];
      };
      categories: {
        Row: CategoryRow;
        Insert: Omit<CategoryRow, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<CategoryRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Omit<
          ProfileRow,
          | "created_at"
          | "updated_at"
          | "full_name"
          | "phone"
          | "university_id"
          | "avatar_url"
          | "student_email"
          | "student_email_requested_at"
          | "student_email_verified_at"
          | "verification_review_note"
          | "verification_rejection_reason"
          | "verification_reviewed_at"
          | "verification_reviewed_by"
          | "is_admin"
          | "is_verified_student"
          | "is_pioneer_seller"
          | "pioneer_awarded_at"
        > & {
          full_name?: string;
          phone?: string | null;
          university_id?: string | null;
          avatar_url?: string | null;
          student_email?: string | null;
          student_email_requested_at?: string | null;
          student_email_verified_at?: string | null;
          verification_review_note?: string | null;
          verification_rejection_reason?: string | null;
          verification_reviewed_at?: string | null;
          verification_reviewed_by?: string | null;
          is_admin?: boolean;
          is_verified_student?: boolean;
          is_pioneer_seller?: boolean;
          pioneer_awarded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      payment_products: {
        Row: PaymentProductRow;
        Insert: Omit<PaymentProductRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<PaymentProductRow>;
        Relationships: [];
      };
      payments: {
        Row: PaymentRow;
        Insert: Omit<PaymentRow, "id" | "created_at" | "updated_at" | "paid_at" | "fulfilled_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          paid_at?: string | null;
          fulfilled_at?: string | null;
        };
        Update: Partial<PaymentRow>;
        Relationships: [];
      };
      payment_webhook_events: {
        Row: PaymentWebhookEventRow;
        Insert: Omit<PaymentWebhookEventRow, "id" | "received_at"> & {
          id?: string;
          received_at?: string;
        };
        Update: Partial<PaymentWebhookEventRow>;
        Relationships: [];
      };
      listing_promotions: {
        // Written only by admin_grant_listing_promotion / admin_end_listing_promotion;
        // clients hold no INSERT/UPDATE grant on this table.
        Row: ListingPromotionRow;
        Insert: Omit<ListingPromotionRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<ListingPromotionRow>;
        Relationships: [];
      };
      ad_banners: {
        Row: AdBannerRow;
        Insert: Omit<AdBannerRow, "id" | "created_at" | "starts_at" | "sort_order"> & {
          id?: string;
          created_at?: string;
          starts_at?: string;
          sort_order?: number;
        };
        Update: Partial<AdBannerRow>;
        Relationships: [];
      };
      listings: {
        Row: ListingRow;
        // `featured` is deliberately absent: it is not insertable or updatable by
        // the authenticated role (see migration 20260819091000) — only the
        // security-definer admin functions may set it.
        Insert: Omit<
          ListingRow,
          | "id"
          | "created_at"
          | "updated_at"
          | "deleted_at"
          | "last_bumped_at"
          | "view_count"
          | "search_vector"
          | "featured"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          status?: ListingStatus;
        };
        Update: Partial<ListingRow>;
        Relationships: [];
      };
      listing_images: {
        Row: ListingImageRow;
        Insert: Omit<ListingImageRow, "id" | "created_at" | "object_key" | "storage_path"> & {
          id?: string;
          created_at?: string;
          object_key?: string | null;
          // Nullable since 20260820150000 — R2-era rows have no Supabase path.
          storage_path?: string | null;
        };
        Update: Partial<ListingImageRow>;
        Relationships: [];
      };
      upload_grants: {
        Row: UploadGrantRow;
        Insert: Omit<UploadGrantRow, "created_at"> & { created_at?: string };
        Update: Partial<UploadGrantRow>;
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
        Insert: Omit<ReportRow, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<ReportRow>;
        Relationships: [];
      };
      seller_reviews: {
        Row: SellerReviewRow;
        Insert: Omit<SellerReviewRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<SellerReviewRow>;
        Relationships: [];
      };
      blocked_users: {
        Row: BlockedUserRow;
        Insert: Omit<BlockedUserRow, "created_at"> & { created_at?: string };
        Update: Partial<BlockedUserRow>;
        Relationships: [];
      };
      search_synonyms: {
        Row: SearchSynonymRow;
        Insert: Omit<SearchSynonymRow, "created_at"> & { created_at?: string };
        Update: Partial<SearchSynonymRow>;
        Relationships: [];
      };
      conversations: {
        Row: ConversationRow;
        Insert: Omit<ConversationRow, "id" | "created_at" | "updated_at" | "buyer_last_read_at" | "seller_last_read_at"> & {
          id?: string;
          buyer_last_read_at?: string | null;
          seller_last_read_at?: string | null;
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
      student_email_verification_tokens: {
        Row: StudentEmailVerificationTokenRow;
        Insert: Omit<StudentEmailVerificationTokenRow, "id" | "created_at" | "consumed_at"> & {
          id?: string;
          created_at?: string;
          consumed_at?: string | null;
        };
        Update: Partial<StudentEmailVerificationTokenRow>;
        Relationships: [];
      };
      push_tokens: {
        Row: PushTokenRow;
        Insert: Omit<PushTokenRow, "id" | "created_at" | "updated_at" | "last_seen_at" | "is_active"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          last_seen_at?: string;
          is_active?: boolean;
        };
        Update: Partial<PushTokenRow>;
        Relationships: [];
      };
    };
    Enums: {
      listing_condition: ListingCondition;
      listing_status: ListingStatus;
      payment_provider_name: PaymentProviderName;
      payment_status: PaymentStatus;
      payment_purpose: PaymentPurpose;
      promotion_product_kind: PromotionProductKind;
    };
    Views: Record<string, never>;
    Functions: {
      increment_listing_view: {
        Args: { p_listing_id: string };
        Returns: undefined;
      };
      consume_student_email_verification: {
        Args: { p_token_hash: string };
        Returns: boolean;
      };
      admin_review_student_verification: {
        Args: {
          p_profile_id: string;
          p_approve: boolean;
          p_note?: string | null;
          p_reason?: string | null;
        };
        Returns: undefined;
      };
      issue_student_email_verification: {
        Args: { p_profile_id?: string | null };
        Returns: string;
      };
      listing_seller_contact: {
        Args: { p_listing_id: string };
        Returns: string | null;
      };
      admin_grant_listing_promotion: {
        Args: {
          p_listing_id: string;
          p_days: number;
          p_amount?: number | null;
          p_note?: string | null;
        };
        Returns: string;
      };
      admin_end_listing_promotion: {
        Args: { p_listing_id: string };
        Returns: undefined;
      };
      bump_listing: {
        Args: { p_listing_id: string; p_request_id?: string | null };
        Returns: undefined;
      };
      mark_conversation_read: {
        Args: { p_conversation_id: string };
        Returns: undefined;
      };
      send_expo_push_to_user: {
        Args: {
          p_user_id: string;
          p_title: string;
          p_body: string;
          p_data?: Json;
        };
        Returns: undefined;
      };
      search_listings_ranked: {
        Args: {
          p_query: string;
          p_page?: number;
          p_page_size?: number;
          p_category_id?: string | null;
          p_university_id?: string | null;
          p_max_price?: number | null;
          p_is_service?: boolean | null;
        };
        Returns: Array<{
          listing_id: string;
          combined_score: number;
          total_count: number;
        }>;
      };
      search_listings: {
        Args: { query_text: string };
        Returns: Array<{
          listing_id: string;
          combined_score: number;
          total_count: number;
        }>;
      };
    };
  };
};

export type ConversationWithRelations = ConversationRow & {
  listings: { id: string; title: string } | null;
  buyer_profile: { id: string; full_name: string; avatar_url: string | null } | null;
  seller_profile: { id: string; full_name: string; avatar_url: string | null } | null;
  last_message?: { content: string; created_at: string } | null;
};

export type ListingWithRelations = ListingRow & {
  categories: Pick<CategoryRow, "id" | "name" | "slug" | "material_icon" | "color_class"> | null;
  universities: Pick<UniversityRow, "id" | "name" | "short_name" | "city"> | null;
  profiles: Pick<ProfileRow, "id" | "full_name" | "avatar_url" | "is_pioneer_seller"> | null;
  listing_images: ListingImageRow[];
};
