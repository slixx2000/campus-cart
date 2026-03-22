export type TabKey = 'Home' | 'Browse' | 'Sell' | 'Account';

export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  featured: boolean;
  isService: boolean;
  category: string;
  university: string;
  universityShortName?: string;
  sellerName: string;
  sellerPhone: string;
  sellerAvatarUrl?: string | null;
  sellerId?: string;
  sellerVerified: boolean;
  sellerPioneer: boolean;
  images: string[];
  createdAt: string;
  lastBumpedAt?: string | null;
  viewCount: number;
  condition?: string | null;
  status?: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_verified_student: boolean | null;
  is_pioneer_seller?: boolean | null;
  university_id: string | null;
  student_email?: string | null;
  student_email_requested_at?: string | null;
  student_email_verified_at?: string | null;
};

export type CategoryRow = {
  id: string;
  name: string;
};

export type UniversityRow = {
  id: string;
  name: string;
  short_name?: string | null;
};

export type ConversationPreview = {
  id: string;
  listing_id: string;
  listing_title: string;
  buyer_id: string;
  seller_id: string;
  other_participant_id: string;
  other_participant_name: string;
  other_participant_avatar: string | null;
  last_message_content: string | null;
  last_message_at: string | null;
  updated_at: string;
  created_at: string;
  unread: boolean;
};

export type MessageItem = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type RootStackParamList = {
  MainTabs: undefined;
  ListingDetail: { listing: Listing };
  ChatDetail: { conversationId: string; title: string; currentUserId: string };
  SellerProfile: { sellerId: string; sellerName: string };
};

export type MainTabParamList = {
  Home: undefined;
  Browse: undefined;
  Sell: undefined;
  Messages: undefined;
  Account: undefined;
};
