"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const listingSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  price: z.coerce.number().positive().max(999999),
  categoryId: z.string().uuid("Invalid category"),
  universityId: z.string().uuid("Invalid university"),
  condition: z.enum(["new", "like_new", "good", "fair"]).optional(),
  isService: z.coerce.boolean().default(false),
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
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    categoryId: formData.get("categoryId"),
    universityId: formData.get("universityId"),
    condition: formData.get("condition") || undefined,
    isService: formData.get("isService") === "true",
  };

  const parsed = listingSchema.safeParse(rawData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const { title, description, price, categoryId, universityId, condition, isService } =
    parsed.data;

  // Insert listing row
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .insert({
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
    return { message: `Failed to create listing: ${listingError.message}` };
  }

  // Handle image uploads
  const imageFiles = formData.getAll("images") as File[];
  const validImages = imageFiles.filter(
    (f) => f.size > 0 && f.size <= MAX_FILE_SIZE && ACCEPTED_IMAGE_TYPES.includes(f.type)
  );

  for (let i = 0; i < validImages.length; i++) {
    const file = validImages[i];
    const ext = file.name.split(".").pop();
    const storagePath = `${user.id}/${listing.id}/${Date.now()}-${i}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("listing-images")
      .upload(storagePath, file, { upsert: false });

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from("listing-images").getPublicUrl(storagePath);

      await supabase.from("listing_images").insert({
        listing_id: listing.id,
        storage_path: storagePath,
        public_url: publicUrl,
        sort_order: i,
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/browse");
  redirect(`/product/${listing.id}`);
}
