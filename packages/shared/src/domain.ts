export type ListingStatus = "draft" | "active" | "sold" | "archived" | "removed";

export type ListingSummary = {
  id: string;
  title: string;
  description: string;
  price: number;
  universityName: string;
  universityShortName?: string;
  createdAt: string;
  lastBumpedAt?: string;
  viewCount?: number;
  featured?: boolean;
  isService?: boolean;
};

export type UserProfileSummary = {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  universityId?: string | null;
  isPioneerSeller?: boolean;
};

export type ConversationSummary = {
  id: string;
  listingId: string;
  otherParticipantId: string;
  otherParticipantName: string;
  otherParticipantAvatar?: string | null;
  lastMessageContent?: string | null;
  lastMessageAt?: string | null;
  blockedByCurrentUser?: boolean;
  blockedByOtherUser?: boolean;
};
