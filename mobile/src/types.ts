import type { ConversationSummary, ListingSummary, UserProfileSummary } from "@campuscart/shared";

export type FeedListing = ListingSummary & {
  imageUrl?: string;
  listing_images?: Array<{
    public_url: string | null;
    sort_order: number;
  }>;
};

export type HomeFeed = {
  newListings: FeedListing[];
  nearbyListings: FeedListing[];
  recentlyActiveListings: FeedListing[];
};

export type ListingDetail = ListingSummary & {
  categoryName?: string;
  universityId?: string;
  seller?: UserProfileSummary & { phone?: string | null };
  images: string[];
};

export type ConversationItem = ConversationSummary & {
  listingTitle?: string;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  expiresAt: string;
};

export type RootTabParamList = {
  HomeStack: undefined;
  SellStack: undefined;
  ChatStack: undefined;
  ProfileStack: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  ItemDetails: { listingId: string };
};

export type ChatStackParamList = {
  Chats: undefined;
  ChatThread: { conversationId: string };
};

export type SellStackParamList = {
  PostUploadPhotos: undefined;
  PostItemDetails: { photoUris: string[] };
};

export type ProfileStackParamList = {
  Profile: undefined;
  ProfileSettings: undefined;
  EditListing: { listingId: string };
};
