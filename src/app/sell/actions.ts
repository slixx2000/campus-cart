"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const uploadedImageSchema = z.object({
  publicUrl: z.string().url(),
  storagePath: z.string().min(1),
});

const listingSchema = z.object({
  listingId: z.string().uuid("Invalid listing id"),
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  price: z.coerce.number().positive().max(999999),
  categoryId: z.string().uuid("Invalid category"),
  universityId: z.string().uuid("Invalid university"),
  condition: z.enum(["new", "like_new", "good", "fair"]).optional(),
  isService: z.coerce.boolean().default(false),
  uploadedImages: z.array(uploadedImageSchema).max(6),
});

export type CreateListingState = {
  errors?: Partial<Record<string, string[]>>;
  message?: string;
};

export async function createListingAction(
  _prevState: CreateListingState,
  formData: FormData
): Promise<CreateListingState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { message: "You must be signed in to post a listing." };
  }

  const rawData = {
    listingId: formData.get("listingId"),
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    categoryId: formData.get("categoryId"),
    universityId: formData.get("universityId"),
    condition: formData.get("condition") || undefined,
    isService: formData.get("isService") === "true",
    uploadedImages: (() => {
      const rawValue = formData.get("uploadedImages");
      if (typeof rawValue !== "string") return [];

      try {
        const parsedImages = JSON.parse(rawValue);
        return Array.isArray(parsedImages) ? parsedImages : [];
      } catch {
        return [];
      }
    })(),
  };

  const parsed = listingSchema.safeParse(rawData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const {
    listingId,
    title,
    description,
    price,
    categoryId,
    universityId,
    condition,
    isService,
    uploadedImages,
  } = parsed.data;

  // Insert listing row
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .insert({
      id: listingId,
      seller_id: user.id,
      title,
      description,
      price,
      category_id: categoryId,
      university_id: universityId,
      condition: condition ?? null,
      is_service: isService,
      featured: false,
      status: "active",
    })
    .select("id")
    .single();

  if (listingError) {
    if (uploadedImages.length > 0) {
      await supabase.storage
        .from("listing-images")
        .remove(uploadedImages.map((image) => image.storagePath));
    }

    return { message: `Failed to create listing: ${listingError.message}` };
  }

  if (uploadedImages.length > 0) {
    const { error: imageInsertError } = await supabase.from("listing_images").insert(
      uploadedImages.map((image, index) => ({
        listing_id: listing.id,
        storage_path: image.storagePath,
        public_url: image.publicUrl,
        sort_order: index,
      }))
    );

    if (imageInsertError) {
      return { message: `Listing created, but images could not be saved: ${imageInsertError.message}` };
    }
  }

  revalidatePath("/");
  revalidatePath("/browse");
  redirect(`/product/${listing.id}`);
}
