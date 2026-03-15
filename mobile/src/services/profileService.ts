import type { ListingSummary, UserProfileSummary } from "@campuscart/shared";
import { getSupabaseClient } from "@/lib/supabase";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

const PROFILE_IMAGE_BUCKET = "profile-images";
const PROFILE_AVATAR_MAX_DIMENSION = 400;
const bumpRequestsInFlight = new Set<string>();

type UpdateProfileInput = {
  fullName: string;
  phone: string;
  avatarUrl?: string;
};

export type ProfileSettingsData = {
  fullName: string;
  phone: string;
  avatarUrl: string | null;
};

export type EditableListing = {
  id: string;
  title: string;
  description: string;
  price: number;
};

type UpdateMyListingInput = {
  title: string;
  description: string;
  price: number;
};

async function getCurrentUserId(): Promise<string | null> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function getMyProfile(): Promise<UserProfileSummary | null> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, university_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
    universityId: data.university_id,
  };
}

export async function getMyProfileSettings(): Promise<ProfileSettingsData | null> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();

  if (!userId) return null;

  const { data } = await supabase
    .from("profiles")
    .select("full_name, phone, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (!data) return null;

  return {
    fullName: data.full_name ?? "",
    phone: data.phone ?? "",
    avatarUrl: data.avatar_url ?? null,
  };
}

export async function getMyListings(): Promise<ListingSummary[]> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("listings")
    .select("id, title, description, price, created_at, last_bumped_at, view_count, featured, is_service, universities(name, short_name)")
    .eq("seller_id", user.id)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(40);

  return (data ?? []).map((row) => {
    const uniRaw = (row as { universities?: { name: string; short_name: string } | Array<{ name: string; short_name: string }> | null }).universities;
    const uni = Array.isArray(uniRaw) ? uniRaw[0] : uniRaw;
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      price: Number(row.price),
      universityName: uni?.name ?? "",
      universityShortName: uni?.short_name,
      createdAt: row.created_at,
      lastBumpedAt: row.last_bumped_at,
      viewCount: Number(row.view_count ?? 0),
      featured: row.featured,
      isService: row.is_service,
    } as ListingSummary;
  });
}

export async function uploadMyAvatarFromUri(uri: string): Promise<string> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must sign in to upload an avatar.");
  }

  const manipulated = await manipulateAsync(
    uri,
    [{ resize: { width: PROFILE_AVATAR_MAX_DIMENSION } }],
    {
      compress: 0.75,
      format: SaveFormat.JPEG,
    }
  );

  const blobResponse = await fetch(manipulated.uri);
  const blob = await blobResponse.blob();

  const storagePath = `${userId}/avatar.jpg`;
  const { error: uploadError } = await supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .upload(storagePath, blob, {
      cacheControl: "3600",
      upsert: true,
      contentType: "image/jpeg",
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PROFILE_IMAGE_BUCKET).getPublicUrl(storagePath);

  return publicUrl;
}

export async function updateMyProfile(input: UpdateProfileInput): Promise<UserProfileSummary> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must sign in to update your profile.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName.trim(),
      phone: input.phone.trim() || null,
      ...(input.avatarUrl ? { avatar_url: input.avatarUrl } : {}),
    })
    .eq("id", userId)
    .select("id, full_name, avatar_url, university_id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not update profile.");
  }

  return {
    id: data.id,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
    universityId: data.university_id,
  };
}

export async function getMyListingForEdit(listingId: string): Promise<EditableListing | null> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must sign in to manage listings.");
  }

  const { data, error } = await supabase
    .from("listings")
    .select("id, title, description, price")
    .eq("id", listingId)
    .eq("seller_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    price: Number(data.price),
  };
}

export async function updateMyListing(
  listingId: string,
  input: UpdateMyListingInput
): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must sign in to manage listings.");
  }

  const { data, error } = await supabase
    .from("listings")
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      price: input.price,
    })
    .eq("id", listingId)
    .eq("seller_id", userId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Only the listing owner can edit this listing.");
  }
}

export async function bumpListing(listingId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must sign in to manage listings.");
  }

  if (bumpRequestsInFlight.has(listingId)) {
    return;
  }

  bumpRequestsInFlight.add(listingId);
  const requestId = `${listingId}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;

  try {
    const { error } = await supabase.rpc("bump_listing", {
      p_listing_id: listingId,
      p_request_id: requestId,
    });
    if (error) {
      throw new Error(error.message);
    }
  } finally {
    bumpRequestsInFlight.delete(listingId);
  }
}

export async function archiveMyListing(listingId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must sign in to manage listings.");
  }

  const { data, error } = await supabase
    .from("listings")
    .update({ status: "archived" })
    .eq("id", listingId)
    .eq("seller_id", userId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Only the listing owner can archive this listing.");
  }
}

export async function deleteMyListing(listingId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must sign in to manage listings.");
  }

  const { data, error } = await supabase
    .from("listings")
    .update({
      status: "removed",
      deleted_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("seller_id", userId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Only the listing owner can delete this listing.");
  }
}
