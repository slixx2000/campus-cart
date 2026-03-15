import { getSupabaseClient } from "@/lib/supabase";
import { compressImageForUpload } from "@/lib/imageCompression";

const LISTING_IMAGE_BUCKET = "listing-images";
const MAX_LISTINGS_PER_HOUR = 10;
const RATE_LIMIT_ERROR_MESSAGE = "You can post up to 10 listings per hour. Please wait before posting again.";

export type CreateListingInput = {
  title: string;
  categoryId: string;
  description: string;
  price: number;
  condition: "new" | "like_new" | "good" | "fair";
  photoUris: string[];
};

export async function getCategories() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createListing(input: CreateListingInput): Promise<string> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must sign in to post a listing.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("university_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.university_id) {
    throw new Error("Set your university in profile settings before posting.");
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentCount, error: rateLimitError } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", user.id)
    .gte("created_at", oneHourAgo);

  if (rateLimitError) {
    throw new Error(rateLimitError.message);
  }

  if ((recentCount ?? 0) >= MAX_LISTINGS_PER_HOUR) {
    throw new Error(RATE_LIMIT_ERROR_MESSAGE);
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      seller_id: user.id,
      title: input.title,
      description: input.description,
      price: input.price,
      category_id: input.categoryId,
      university_id: profile.university_id,
      condition: input.condition,
    })
    .select("id")
    .single();

  if (error) {
    if (error.message.toLowerCase().includes("row-level security")) {
      throw new Error(RATE_LIMIT_ERROR_MESSAGE);
    }
    throw new Error(error.message);
  }

  if (input.photoUris.length > 0) {
    const imageRows: Array<{
      listing_id: string;
      storage_path: string;
      public_url: string;
      sort_order: number;
    }> = [];

    for (let index = 0; index < input.photoUris.length; index += 1) {
      const uri = input.photoUris[index];
      const compressedUri = await compressImageForUpload(uri);
      const blobResponse = await fetch(compressedUri);
      const blob = await blobResponse.blob();
      const storagePath = `${user.id}/${listing.id}/${Date.now()}-${index}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(LISTING_IMAGE_BUCKET)
        .upload(storagePath, blob, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/jpeg",
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from(LISTING_IMAGE_BUCKET)
        .getPublicUrl(storagePath);

      imageRows.push({
        listing_id: listing.id,
        storage_path: storagePath,
        public_url: publicUrlData.publicUrl,
        sort_order: index,
      });
    }

    const { error: imageInsertError } = await supabase.from("listing_images").insert(imageRows);

    if (imageInsertError) {
      throw new Error(imageInsertError.message);
    }
  }

  return listing.id;
}
