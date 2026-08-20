import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PromotionsAdmin from "./PromotionsAdmin";

export const metadata = { title: "Promotions (Admin)" };

export default async function PromotionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in?redirect=/admin/promotions");

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!currentProfile?.is_admin) redirect("/");

  // RLS on both tables re-checks is_admin, so this is defence in depth rather
  // than the only gate.
  const [{ data: promoRows }, { data: bannerRows }] = await Promise.all([
    supabase
      .from("listing_promotions")
      .select("id, listing_id, ends_at, amount_kwacha, note, listings ( title )")
      .gt("ends_at", new Date().toISOString())
      .order("ends_at", { ascending: true }),
    supabase
      .from("ad_banners")
      .select("id, placement, title, advertiser, ends_at")
      .order("ends_at", { ascending: true }),
  ]);

  const promotions = (promoRows ?? []).map((row) => {
    const joined = row as typeof row & { listings: { title: string } | null };
    return {
      id: row.id,
      listing_id: row.listing_id,
      listing_title: joined.listings?.title ?? "(deleted listing)",
      ends_at: row.ends_at,
      amount_kwacha: row.amount_kwacha,
      note: row.note,
    };
  });

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="mx-auto max-w-[900px] px-4 py-10 md:px-12">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Promotions</h1>
        <p className="mt-2 text-sm text-muted">
          Paid featured placement and banner ads. Payments are taken manually over
          mobile money for now — this page records and activates what was sold.
        </p>
        <div className="mt-8">
          <PromotionsAdmin promotions={promotions} banners={bannerRows ?? []} />
        </div>
      </div>
    </div>
  );
}
