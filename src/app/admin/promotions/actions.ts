"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type PromotionState = { message?: string; ok?: boolean };

const grantSchema = z.object({
  listingId: z.string().uuid("Enter a valid listing id"),
  days: z.coerce.number().int().min(1).max(365),
  amount: z.coerce.number().min(0).max(1_000_000).optional(),
  note: z.string().max(300).optional(),
});

const bannerSchema = z.object({
  placement: z.enum(["home", "browse"]),
  title: z.string().min(2).max(120),
  imageUrl: z.string().url("Enter a valid image URL"),
  targetUrl: z.string().url("Enter a valid destination URL"),
  advertiser: z.string().max(120).optional(),
  days: z.coerce.number().int().min(1).max(365),
});

/**
 * All three actions rely on the database for authorisation: the RPCs and the
 * ad_banners policies re-check `is_admin` server-side, so a stolen form post
 * from a non-admin session fails at the database, not just in the UI.
 */
export async function grantPromotionAction(
  _prevState: PromotionState,
  formData: FormData
): Promise<PromotionState> {
  const parsed = grantSchema.safeParse({
    listingId: formData.get("listingId"),
    days: formData.get("days"),
    amount: formData.get("amount") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { message: Object.values(parsed.error.flatten().fieldErrors).flat()[0] };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_grant_listing_promotion", {
    p_listing_id: parsed.data.listingId,
    p_days: parsed.data.days,
    p_amount: parsed.data.amount ?? null,
    p_note: parsed.data.note ?? null,
  });

  if (error) return { message: error.message };

  revalidatePath("/admin/promotions");
  revalidatePath("/browse");
  revalidatePath("/");
  return {
    ok: true,
    message: `Featured until ${new Date(data as string).toLocaleString("en-ZM")}.`,
  };
}

export async function endPromotionAction(
  _prevState: PromotionState,
  formData: FormData
): Promise<PromotionState> {
  const listingId = String(formData.get("listingId") ?? "");
  if (!listingId) return { message: "Missing listing." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_end_listing_promotion", {
    p_listing_id: listingId,
  });

  if (error) return { message: error.message };

  revalidatePath("/admin/promotions");
  revalidatePath("/browse");
  revalidatePath("/");
  return { ok: true, message: "Promotion ended." };
}

export async function createBannerAction(
  _prevState: PromotionState,
  formData: FormData
): Promise<PromotionState> {
  const parsed = bannerSchema.safeParse({
    placement: formData.get("placement"),
    title: formData.get("title"),
    imageUrl: formData.get("imageUrl"),
    targetUrl: formData.get("targetUrl"),
    advertiser: formData.get("advertiser") || undefined,
    days: formData.get("days"),
  });

  if (!parsed.success) {
    return { message: Object.values(parsed.error.flatten().fieldErrors).flat()[0] };
  }

  const supabase = await createClient();
  const endsAt = new Date(Date.now() + parsed.data.days * 86_400_000).toISOString();

  const { error } = await supabase.from("ad_banners").insert({
    placement: parsed.data.placement,
    title: parsed.data.title,
    image_url: parsed.data.imageUrl,
    target_url: parsed.data.targetUrl,
    advertiser: parsed.data.advertiser ?? null,
    ends_at: endsAt,
  });

  if (error) return { message: error.message };

  revalidatePath("/admin/promotions");
  revalidatePath("/browse");
  revalidatePath("/");
  return { ok: true, message: `Banner live until ${new Date(endsAt).toLocaleDateString("en-ZM")}.` };
}

export async function endBannerAction(
  _prevState: PromotionState,
  formData: FormData
): Promise<PromotionState> {
  const id = String(formData.get("bannerId") ?? "");
  if (!id) return { message: "Missing banner." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ad_banners")
    .update({ ends_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { message: error.message };

  revalidatePath("/admin/promotions");
  revalidatePath("/browse");
  revalidatePath("/");
  return { ok: true, message: "Banner ended." };
}
