"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  listingId: z.string().uuid(),
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(2000).optional(),
  price: z.coerce.number().positive().max(999999).optional(),
  categoryId: z.string().uuid().optional(),
  condition: z.enum(["new", "like_new", "good", "fair"]).optional(),
  isService: z.coerce.boolean().optional(),
});

export type UpdateListingState = {
  errors?: Partial<Record<string, string[]>>;
  message?: string;
};

export async function updateListingAction(
  _prevState: UpdateListingState,
  formData: FormData
): Promise<UpdateListingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { message: "Not authenticated." };

  const parsed = updateSchema.safeParse({
    listingId: formData.get("listingId"),
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    price: formData.get("price") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    condition: formData.get("condition") || undefined,
    isService: formData.get("isService") ?? undefined,
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { listingId, ...fields } = parsed.data;

  // RLS ensures only the owner can update
  const { error } = await supabase
    .from("listings")
    .update({
      ...(fields.title !== undefined && { title: fields.title }),
      ...(fields.description !== undefined && { description: fields.description }),
      ...(fields.price !== undefined && { price: fields.price }),
      ...(fields.categoryId !== undefined && { category_id: fields.categoryId }),
      ...(fields.condition !== undefined && { condition: fields.condition }),
      ...(fields.isService !== undefined && { is_service: fields.isService }),
    })
    .eq("id", listingId)
    .eq("seller_id", user.id);

  if (error) return { message: `Update failed: ${error.message}` };

  revalidatePath(`/product/${listingId}`);
  revalidatePath("/my-listings");
  redirect(`/product/${listingId}`);
}

export async function deleteListingAction(
  formData: FormData
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const listingId = formData.get("listingId") as string;
  if (!listingId) return;

  // Soft delete — set deleted_at and status=archived
  await supabase
    .from("listings")
    .update({ deleted_at: new Date().toISOString(), status: "archived" })
    .eq("id", listingId)
    .eq("seller_id", user.id);

  revalidatePath("/my-listings");
  revalidatePath("/");
  redirect("/my-listings");
}
