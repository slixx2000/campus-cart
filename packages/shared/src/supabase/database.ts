export type MobileDatabase = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          university_id: string | null;
          avatar_url: string | null;
          is_verified_student: boolean;
          is_pioneer_seller: boolean;
          pioneer_awarded_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      listings: {
        Row: {
          id: string;
          seller_id: string;
          title: string;
          description: string;
          price: number;
          category_id: string;
          university_id: string;
          condition: "new" | "like_new" | "good" | "fair" | null;
          is_service: boolean;
          featured: boolean;
          status: "draft" | "active" | "sold" | "archived" | "removed";
          last_bumped_at: string;
          view_count: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
      };
      conversations: {
        Row: {
          id: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          created_at: string;
          updated_at: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          expires_at: string;
          created_at: string;
        };
      };
      universities: {
        Row: {
          id: string;
          code: string;
          name: string;
          short_name: string;
          city: string;
          province: string;
          created_at: string;
        };
      };
      listing_images: {
        Row: {
          id: string;
          listing_id: string;
          storage_path: string;
          public_url: string | null;
          sort_order: number;
          created_at: string;
        };
      };
    };
    Functions: {
      increment_listing_view: {
        Args: { p_listing_id: string };
        Returns: undefined;
      };
    };
  };
};
